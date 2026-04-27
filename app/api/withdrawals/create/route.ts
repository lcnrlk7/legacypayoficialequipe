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

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getCurrentUser();

    if (!sessionUser) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { amount, pixKey, pixKeyType } = body;

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

    // Buscar saldo atual
    const balanceResult = await sql`
      SELECT balance FROM profiles WHERE id = ${sessionUser.id}
    `;
    const currentBalance = Number(balanceResult[0]?.balance) || 0;

    if (sessionUser.kyc_status !== "approved") {
      return NextResponse.json(
        { error: "KYC não aprovado. Complete a verificação para sacar." },
        { status: 403 }
      );
    }

    if (amount > currentBalance) {
      return NextResponse.json(
        { error: `Saldo insuficiente. Disponível: R$ ${currentBalance.toFixed(2)}` },
        { status: 400 }
      );
    }

    // Calcular taxas usando o sistema centralizado baseado na rota do usuário
    const systemFees = await getSystemFeesForUser(sessionUser.id);
    const { netAmount, totalFee } = calculateWithdrawalFees(amount, systemFees);
    
    if (netAmount <= 0) {
      return NextResponse.json(
        { error: `Valor muito baixo. Após taxa de R$ ${totalFee.toFixed(2)}, não sobraria valor para transferir.` },
        { status: 400 }
      );
    }

    // Buscar rota do usuário para determinar limite de saque automático
    const userRouteResult = await sql`
      SELECT route_type FROM profiles WHERE id = ${sessionUser.id}
    `;
    const userRouteType = userRouteResult[0]?.route_type || 'black';
    
    // Saques automáticos até R$ 500, acima disso vai para aprovação manual no painel admin
    const AUTO_WITHDRAWAL_LIMIT = 500;
    const requiresApproval = amount >= AUTO_WITHDRAWAL_LIMIT;

    // Buscar adquirente baseado na rota do usuário
    const acquirer = await getAcquirerForUser(sessionUser.id);

    let acquirerWithdrawalId = null;
    let withdrawalStatus = requiresApproval ? "pending" : "processing";

    // Descontar saldo do usuário ANTES de processar
    await sql`
      UPDATE profiles 
      SET balance = balance - ${amount}
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
        // Se falhar no processamento automático
        console.error("[Withdrawal] Falha ao processar saque automático:", withdrawalResult.error);
        
        // Se o erro é de saldo insuficiente na adquirente, devolver saldo e retornar erro
        if (withdrawalResult.error?.toLowerCase().includes("saldo insuficiente")) {
          await sql`
            UPDATE profiles 
            SET balance = balance + ${amount}
            WHERE id = ${sessionUser.id}
          `;
          
          return NextResponse.json({
            success: false,
            error: "Sistema temporariamente indisponível para saques. Tente novamente em alguns minutos.",
          }, { status: 503 });
        }
        
        // Para outros erros, deixar pendente para aprovação manual
        withdrawalStatus = "pending";
      }
    }

    // Salvar saque no banco (incluindo acquirer_withdrawal_id diretamente)
    const withdrawalId = crypto.randomUUID();
    const savedResult = await sql`
      INSERT INTO withdrawals (
        id, user_id, amount, fee, net_amount,
        pix_key, pix_key_type, status, acquirer_withdrawal_id, created_at
      )
      VALUES (
        ${withdrawalId}, ${sessionUser.id},
        ${amount}, ${totalFee}, ${netAmount}, ${pixKey}, ${pixKeyType || mapPixKeyType(pixKey)},
        ${withdrawalStatus}, ${acquirerWithdrawalId}, NOW()
      )
      RETURNING id, acquirer_withdrawal_id
    `;
    
    console.log(`[Withdrawal] Saque salvo: id=${withdrawalId}, acquirer_id=${acquirerWithdrawalId}, status=${withdrawalStatus}`);

    if (savedResult.length === 0) {
      // Reverter saldo se falhar ao salvar
      await sql`
        UPDATE profiles SET balance = balance + ${amount} WHERE id = ${sessionUser.id}
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
