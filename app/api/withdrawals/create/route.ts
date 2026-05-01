import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getFullUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { 
  getSystemFeesForUser, 
  calculateWithdrawalFees, 
  createWithdrawal as processWithdrawal,
  getAcquirerForUser
} from "@/lib/acquirers";
import { mapPixKeyType } from "@/lib/acquirers/misticpay";
import { validateWithdrawal, getClientIP, logSuspiciousActivity, rateLimit, isValidPixKey } from "@/lib/security";
import { logWithdrawalRequest } from "@/lib/discord-webhook";

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getCurrentUser();

    if (!sessionUser) {
      return NextResponse.json(
        { error: "Nao autorizado" },
        { status: 401 }
      );
    }

    // SEGURANCA: Rate limiting de saques por usuario
    const ip = await getClientIP();
    const withdrawalRateLimit = rateLimit(`withdrawal_${sessionUser.id}`, 5, 3600000); // 5 saques por hora
    
    if (!withdrawalRateLimit.allowed) {
      await logSuspiciousActivity(sessionUser.id, "WITHDRAWAL_RATE_LIMITED", `IP: ${ip}`, ip);
      return NextResponse.json(
        { error: "Limite de solicitacoes de saque atingido. Aguarde 1 hora." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { amount, pixKey, pixKeyType } = body;
    
    // SEGURANCA: Validar chave PIX
    if (!isValidPixKey(pixKey)) {
      return NextResponse.json(
        { error: "Chave PIX invalida" },
        { status: 400 }
      );
    }

    // SEGURANCA: Validacao anti-fraude
    const validation = await validateWithdrawal(sessionUser.id, amount, pixKey);
    if (!validation.valid) {
      await logSuspiciousActivity(sessionUser.id, "WITHDRAWAL_BLOCKED", `Reason: ${validation.reason}, Amount: ${amount}, PixKey: ${pixKey}`, ip);
      return NextResponse.json(
        { error: validation.reason || "Saque nao autorizado" },
        { status: 403 }
      );
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Valor inválido" },
        { status: 400 }
      );
    }

    if (!pixKey) {
      return NextResponse.json(
        { error: "Chave PIX é obrigatória" },
        { status: 400 }
      );
    }

    // Buscar configurações do sistema
    const settingsResult = await sql`
      SELECT key, value FROM system_settings
      WHERE key IN ('min_withdrawal', 'max_withdrawal', 'auto_withdraw_limit')
    `;

    const settings: Record<string, number> = {
      min_withdrawal: 25, // Minimo R$ 25 para rota black
      max_withdrawal: 50000,
      auto_withdraw_limit: 500, // Ate R$ 500 automatico, acima vai para admin
    };

    settingsResult.forEach((s: { key: string; value: string }) => {
      try {
        settings[s.key] = parseFloat(JSON.parse(s.value)) || settings[s.key];
      } catch {
        settings[s.key] = parseFloat(s.value) || settings[s.key];
      }
    });

    if (amount < settings.min_withdrawal) {
      return NextResponse.json(
        { error: `Valor mínimo para saque: R$ ${settings.min_withdrawal.toFixed(2)}` },
        { status: 400 }
      );
    }

    if (amount > settings.max_withdrawal) {
      return NextResponse.json(
        { error: `Valor máximo para saque: R$ ${settings.max_withdrawal.toFixed(2)}` },
        { status: 400 }
      );
    }

    // Buscar perfil do usuário
    const user = await getFullUser(sessionUser.id);

    if (!user) {
      return NextResponse.json(
        { error: "Perfil não encontrado" },
        { status: 404 }
      );
    }

    // Buscar saldo e KYC atual diretamente do banco (não do token que pode estar desatualizado)
    const profileResult = await sql`
      SELECT balance, kyc_status FROM profiles WHERE id = ${sessionUser.id}
    `;
    const currentBalance = Number(profileResult[0]?.balance) || 0;
    const currentKycStatus = profileResult[0]?.kyc_status;

    if (currentKycStatus !== "approved") {
      return NextResponse.json(
        { error: "KYC não aprovado. Complete a verificação para sacar." },
        { status: 403 }
      );
    }

    // Calcular taxas usando o sistema centralizado baseado na rota do usuário
    // NOTA: "amount" agora é o valor que o usuário QUER RECEBER
    // totalDebit = amount + taxa (o que será debitado do saldo)
    const systemFees = await getSystemFeesForUser(sessionUser.id);
    const withdrawalFee = systemFees.withdrawalFee || 2; // Taxa fixa de saque
    const netAmount = amount; // Valor que o usuário vai receber
    const totalFee = withdrawalFee; // Taxa de saque
    const totalDebit = amount + withdrawalFee; // Total a ser debitado do saldo
    
    if (amount <= 0) {
      return NextResponse.json(
        { error: "Valor inválido para saque" },
        { status: 400 }
      );
    }
    
    // Verificar se o saldo cobre o valor + taxa
    if (totalDebit > currentBalance) {
      return NextResponse.json(
        { error: `Saldo insuficiente. Para receber R$ ${amount.toFixed(2)}, você precisa de R$ ${totalDebit.toFixed(2)} (valor + taxa de R$ ${totalFee.toFixed(2)})` },
        { status: 400 }
      );
    }

    // Buscar rota do usuário para determinar limite de saque automático
    const userRouteResult = await sql`
      SELECT route_type FROM profiles WHERE id = ${sessionUser.id}
    `;
    const userRouteType = userRouteResult[0]?.route_type || 'black';
    
    // Saques automáticos até R$ 400, acima disso vai para aprovação manual no painel admin
    const AUTO_WITHDRAWAL_LIMIT = 400;
    const requiresApproval = amount > AUTO_WITHDRAWAL_LIMIT;

    // Buscar adquirente baseado na rota do usuário
    const acquirer = await getAcquirerForUser(sessionUser.id);

    let acquirerWithdrawalId = null;
    let withdrawalStatus = requiresApproval ? "pending" : "processing";

    // Descontar saldo do usuário ANTES de processar (valor + taxa)
    await sql`
      UPDATE profiles 
      SET balance = balance - ${totalDebit}
      WHERE id = ${sessionUser.id}
    `;

    // Se não requer aprovação, processar automaticamente
    if (!requiresApproval && acquirer) {
      const detectedPixKeyType = pixKeyType || mapPixKeyType(pixKey);
      
      const withdrawalResult = await processWithdrawal(
        netAmount,
        pixKey,
        sessionUser.id,
        detectedPixKeyType,
        `Saque LegacyPay - ${user.name || user.email}`
      );

      if (withdrawalResult.success && withdrawalResult.withdrawalId) {
        acquirerWithdrawalId = String(withdrawalResult.withdrawalId);
        withdrawalStatus = "processing";
      } else {
        // Se falhar no processamento automático, devolver saldo e marcar como failed
        console.error("[Withdrawal] Falha ao processar saque automático:", withdrawalResult.error);
        
        // Devolver saldo ao usuário
        await sql`
          UPDATE profiles SET balance = balance + ${totalDebit} WHERE id = ${sessionUser.id}
        `;
        
        // Retornar erro com mensagem da adquirente
        const errorMessage = withdrawalResult.error || "Falha ao processar saque na adquirente";
        return NextResponse.json({
          success: false,
          error: errorMessage,
        }, { status: 400 });
      }
    }

    // Salvar saque no banco (incluindo acquirer_withdrawal_id diretamente)
    // amount = valor a receber, totalDebit = valor debitado (amount + taxa)
    const withdrawalId = crypto.randomUUID();
    const savedResult = await sql`
      INSERT INTO withdrawals (
        id, user_id, amount, fee, net_amount,
        pix_key, pix_key_type, status, acquirer_withdrawal_id, created_at
      )
      VALUES (
        ${withdrawalId}, ${sessionUser.id},
        ${totalDebit}, ${totalFee}, ${netAmount}, ${pixKey}, ${pixKeyType || mapPixKeyType(pixKey)},
        ${withdrawalStatus}, ${acquirerWithdrawalId}, NOW()
      )
      RETURNING id, acquirer_withdrawal_id
    `;
    
    console.log(`[Withdrawal] Saque salvo: id=${withdrawalId}, total_debit=${totalDebit}, net=${netAmount}, fee=${totalFee}, status=${withdrawalStatus}`);

    if (savedResult.length === 0) {
      // Reverter saldo se falhar ao salvar
      await sql`
        UPDATE profiles SET balance = balance + ${totalDebit} WHERE id = ${sessionUser.id}
      `;
        
      return NextResponse.json(
        { error: "Erro ao processar saque. Tente novamente." },
        { status: 500 }
      );
    }

    // Registrar log de auditoria
    await sql`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_value, created_at)
      VALUES (
        ${sessionUser.id},
        ${requiresApproval ? 'WITHDRAWAL_PENDING' : 'WITHDRAWAL_PROCESSING'},
        'withdrawal',
        ${withdrawalId},
        ${JSON.stringify({ 
          amount, 
          fee: totalFee, 
          net_amount: netAmount, 
          pix_key: pixKey, 
          requires_approval: requiresApproval, 
          status: withdrawalStatus,
          acquirer: acquirer?.code 
        })},
        NOW()
      )
    `;
    
    // Log para Discord
    logWithdrawalRequest({
      withdrawalId: withdrawalId,
      userName: user.name || "N/A",
      userEmail: user.email,
      userDocument: (user as Record<string, unknown>).cpf_cnpj as string || undefined,
      amount: totalDebit,
      fee: totalFee,
      netAmount: netAmount,
      pixKey: pixKey,
      pixKeyType: pixKeyType || mapPixKeyType(pixKey),
    });

    // Notificar usuário
    await sql`
      INSERT INTO user_notifications (user_id, title, message, type)
      VALUES (
        ${sessionUser.id},
        ${requiresApproval ? 'Saque Solicitado' : 'Saque em Processamento'},
        ${requiresApproval 
          ? `Seu saque de R$ ${netAmount.toFixed(2)} foi solicitado e está aguardando aprovação.`
          : `Seu saque de R$ ${netAmount.toFixed(2)} está sendo processado e será enviado em breve.`
        },
        'info'
      )
    `;

    // Determinar mensagem baseada no status e se requer aprovação
    let message = "";
    if (withdrawalStatus === "processing") {
      message = `Saque de R$ ${netAmount.toFixed(2)} enviado para processamento!`;
    } else if (requiresApproval) {
      message = `Saque acima de R$ ${AUTO_WITHDRAWAL_LIMIT.toFixed(2)} requer aprovação. Valor líquido: R$ ${netAmount.toFixed(2)}`;
    } else {
      // Não requer aprovação mas ficou pendente (falha no processamento automático)
      message = `Saque de R$ ${netAmount.toFixed(2)} está aguardando processamento.`;
    }

    return NextResponse.json({
      success: true,
      withdrawal: {
        id: withdrawalId,
        amount,
        fee: totalFee,
        netAmount,
        status: withdrawalStatus,
        pixKey,
        requiresApproval,
      },
      message,
    });
  } catch (error) {
    console.error("Error creating withdrawal:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao criar saque" },
      { status: 500 }
    );
  }
}
