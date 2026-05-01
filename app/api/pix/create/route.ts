import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { createMisticPayClient } from "@/lib/acquirers/misticpay";
import { MedusaPayments } from "@/lib/acquirers/medusa";
import { getSystemFeesForUser } from "@/lib/acquirers";
import { logNewTransaction } from "@/lib/discord-webhook";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, description, externalId, payerName, payerDocument, apiKey } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Valor inválido" },
        { status: 400 }
      );
    }

    // Buscar configurações
    const settingsResult = await sql`
      SELECT key, value FROM system_settings WHERE key IN ('min_deposit', 'max_deposit')
    `;

    const settings: Record<string, number> = { min_deposit: 5, max_deposit: 100000 };
    settingsResult.forEach((s: { key: string; value: string }) => {
      settings[s.key] = parseFloat(s.value) || settings[s.key];
    });

    if (amount < settings.min_deposit) {
      return NextResponse.json(
        { error: `Valor mínimo: R$ ${settings.min_deposit.toFixed(2)}` },
        { status: 400 }
      );
    }

    if (amount > settings.max_deposit) {
      return NextResponse.json(
        { error: `Valor máximo: R$ ${settings.max_deposit.toFixed(2)}` },
        { status: 400 }
      );
    }

    let profile;

    // Autenticar via API Key ou sessão
    if (apiKey) {
      const result = await sql`
        SELECT id, name, email, cpf_cnpj, phone, is_active, kyc_status, balance, fee_percentage, route_type
        FROM profiles WHERE api_key = ${apiKey}
      `;
      profile = result[0];
    } else {
      const sessionUser = await getCurrentUser();
      if (sessionUser) {
        const result = await sql`
          SELECT id, name, email, cpf_cnpj, phone, is_active, kyc_status, balance, fee_percentage, route_type
          FROM profiles WHERE id = ${sessionUser.id}
        `;
        profile = result[0];
      }
    }

    if (!profile) {
      return NextResponse.json(
        { error: "Não autorizado. Faça login ou forneça uma API Key válida." },
        { status: 401 }
      );
    }

    if (!profile.is_active) {
      return NextResponse.json(
        { error: "Conta desativada" },
        { status: 403 }
      );
    }

    if (profile.kyc_status !== "approved") {
      return NextResponse.json(
        { error: "Você precisa completar a verificação KYC para usar esta funcionalidade." },
        { status: 403 }
      );
    }

    // Buscar adquirente baseado na rota do usuário (white = MisticPay, black = Promisse Pay)
    const userRouteType = profile.route_type || 'black';
    const acquirerResult = await sql`
      SELECT * FROM acquirers WHERE is_active = true AND route_type = ${userRouteType} LIMIT 1
    `;

    if (acquirerResult.length === 0) {
      return NextResponse.json(
        { error: "Nenhum provedor de pagamento disponível no momento." },
        { status: 503 }
      );
    }

    const acquirer = acquirerResult[0];
    const transactionId = externalId || `lp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    let pixResult: { success: boolean; data?: { qrCode?: string; qrCodeBase64?: string; copyPaste?: string; transactionId?: string; fee?: number }; error?: string };

    // Usar cliente correto baseado no adquirente selecionado
    if (acquirer.code === 'misticpay') {
      const misticPay = await createMisticPayClient();
      
      if (!misticPay) {
        return NextResponse.json(
          { error: "Erro ao conectar com MisticPay." },
          { status: 500 }
        );
      }

      // URL do webhook MisticPay - usar domínio de produção
      const webhookUrl = "https://legacypay.site/api/webhooks/misticpay";

      pixResult = await misticPay.createPixCharge({
        amount,
        payerName: payerName || profile.name || "Cliente LegacyPay",
        payerDocument: payerDocument || "00000000000",
        transactionId,
        description: description || "Depósito via PIX - LegacyPay",
        projectWebhook: webhookUrl,
      });
    } else if (acquirer.code === 'medusa') {
      try {
        const medusa = new MedusaPayments({
          secretKey: acquirer.api_key,
          licenseKey: acquirer.api_secret || undefined,
        });
        
        // Medusa usa valor em centavos
        const amountInCents = Math.round(amount * 100);
        
        // Usar nome e email do usuário + CPF fixo para Medusa
        const customerName = profile.name || "Cliente LegacyPay";
        const customerDocument = "36009722004"; // CPF fixo para todas as transações Medusa
        const customerEmail = profile.email || "cliente@legacypay.com";
        
        // URL do webhook Medusa - usar domínio de produção
        const medusaWebhookUrl = "https://legacypay.site/api/webhooks/medusa";
        
        const medusaResult = await medusa.createSimplePixPayment(
          amountInCents,
          customerName,
          customerDocument,
          customerEmail,
          description || "Depósito via PIX - LegacyPay",
          medusaWebhookUrl
        );
        
        if (!medusaResult.pix?.qrcode) {
          // Registrar erro
          try {
            await sql`
              INSERT INTO integration_errors (integration_name, error_code, error_message, request_data, response_data, user_id, created_at)
              VALUES (
                'medusa',
                'NO_PIX_CODE',
                'Medusa não retornou o código PIX',
                ${JSON.stringify({ amount: amountInCents, transactionId })},
                ${JSON.stringify(medusaResult)},
                ${profile.id},
                NOW()
              )
            `;
          } catch (logErr) {
            console.error("Error logging integration error:", logErr);
          }
          
          pixResult = {
            success: false,
            error: "Medusa não retornou o código PIX"
          };
        } else {
          pixResult = {
            success: true,
            data: {
              qrCode: medusaResult.pix.qrcode,
              qrCodeBase64: medusaResult.pix.qrcode,
              copyPaste: medusaResult.pix.qrcode,
              transactionId: String(medusaResult.id),
            }
          };
        }
      } catch (error) {
        console.error("Medusa error:", error);
        
        // Registrar erro na tabela de erros de integração
        try {
          await sql`
            INSERT INTO integration_errors (integration_name, error_code, error_message, request_data, user_id, created_at)
            VALUES (
              'medusa',
              'EXCEPTION',
              ${error instanceof Error ? error.message : 'Erro desconhecido'},
              ${JSON.stringify({ amount, transactionId })},
              ${profile.id},
              NOW()
            )
          `;
        } catch (logErr) {
          console.error("[v0] Error logging integration error:", logErr);
        }
        
        pixResult = {
          success: false,
          error: error instanceof Error ? error.message : "Erro ao criar cobrança PIX com Medusa"
        };
      }
    } else {
      return NextResponse.json(
        { error: "Adquirente não suportado" },
        { status: 500 }
      );
    }

    if (!pixResult.success || !pixResult.data) {
      return NextResponse.json(
        { error: pixResult.error || "Erro ao criar cobrança PIX" },
        { status: 500 }
      );
    }

    // Buscar taxas personalizadas do usuario (ou padrao da rota se nao tiver)
    const userFees = await getSystemFeesForUser(profile.id);
    const feePercentage = userFees.pixPercentageFee;
    const fixedFee = userFees.pixFixedFee;
    
    // Calcular taxa total
    const fee = (amount * (feePercentage / 100)) + fixedFee;
    const netAmount = amount - fee;
    
    console.log(`[PIX Create] Usuario ${profile.email}: Taxa ${feePercentage}% + R$${fixedFee} = R$${fee.toFixed(2)} para R$${amount}`);

    const txId = crypto.randomUUID();
    const acquirerTxId = pixResult.data.transactionId || transactionId;
    
    // Inserir transação (fee_percentage guardado no metadata)
    const txResult = await sql`
      INSERT INTO transactions (
        id, user_id, external_id, acquirer_transaction_id, type,
        amount, fee, net_amount, status,
        payer_name, payer_document, description, metadata, created_at
      )
      VALUES (
        ${txId}, ${profile.id}, ${transactionId}, ${acquirerTxId},
        ${'pix_in'}, ${amount}, ${fee}, ${netAmount}, ${'pending'},
        ${payerName || profile.name || ''}, ${payerDocument || ''}, ${description || 'Depósito via PIX'},
        ${JSON.stringify({ qr_code: pixResult.data.qrCode || '', qr_code_base64: pixResult.data.qrCodeBase64 || '', copy_paste: pixResult.data.copyPaste || '', acquirer_id: acquirer.id, acquirer_code: acquirer.code, acquirer_fee: pixResult.data.fee || 0, fee_percentage: feePercentage })}, NOW()
      )
      RETURNING *
    `;

    if (txResult.length === 0) {
      return NextResponse.json({
        success: true,
        transactionId,
        acquirerTransactionId: pixResult.data.transactionId,
        status: "pending",
        amount,
        qrCode: pixResult.data.qrCode,
        qrCodeBase64: pixResult.data.qrCodeBase64,
        copyPaste: pixResult.data.copyPaste,
        warning: "Transação criada mas houve erro ao salvar localmente",
      });
    }

    const transaction = txResult[0];

    await sql`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_value, created_at)
      VALUES (
        ${profile.id}, 
        'PIX_CHARGE_CREATED', 
        'transaction', 
        ${transaction.id}, 
        ${JSON.stringify({ 
          amount, 
          fee, 
          net_amount: netAmount, 
          acquirer_transaction_id: pixResult.data.transactionId,
          description: description || 'Depósito via PIX'
        })}, 
        NOW()
      )
    `;
    
    // Log para Discord (usa waitUntil para garantir execucao)
    logNewTransaction({
      transactionId: transaction.id,
      userName: profile.name || "N/A",
      userEmail: profile.email || "",
      amount: amount,
      fee: fee,
      netAmount: netAmount,
      payerName: payerName || profile.name || "Cliente",
      payerDocument: payerDocument,
      description: description || "Deposito via PIX",
      route: userRouteType,
      status: "pending",
    });

    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
      acquirerTransactionId: pixResult.data.transactionId,
      status: "pending",
      amount,
      qrCode: pixResult.data.qrCode,
      qrCodeBase64: pixResult.data.qrCodeBase64,
      copyPaste: pixResult.data.copyPaste,
    });
  } catch (error) {
    console.error("Error creating PIX charge:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao criar cobrança PIX" },
      { status: 500 }
    );
  }
}
