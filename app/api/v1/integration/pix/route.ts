import { sql } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { createPixPayment, getSystemFeesForUser } from "@/lib/acquirers";
import crypto from "crypto";

// POST - Criar cobrança PIX via integração externa
export async function POST(request: NextRequest) {
  try {
    // Autenticação via Basic Auth (client_id:client_secret)
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Basic ")) {
      return NextResponse.json(
        { 
          success: false,
          error: "Credenciais não fornecidas", 
          code: "UNAUTHORIZED" 
        },
        { status: 401 }
      );
    }

    const base64Credentials = authHeader.slice(6);
    let credentials: string;
    try {
      credentials = Buffer.from(base64Credentials, "base64").toString("utf-8");
    } catch {
      return NextResponse.json(
        { success: false, error: "Credenciais mal formatadas", code: "INVALID_CREDENTIALS" },
        { status: 401 }
      );
    }

    const [clientId, clientSecret] = credentials.split(":");

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { success: false, error: "Credenciais inválidas", code: "INVALID_CREDENTIALS" },
        { status: 401 }
      );
    }

    // Buscar integração pelas credenciais na tabela user_integrations
    const integrationResult = await sql`
      SELECT ui.id as integration_id, ui.user_id, ui.name as integration_name, ui.is_active as integration_active,
             ui.webhook_url, ui.webhook_secret,
             p.id as profile_id, p.name, p.kyc_status, p.route_type, p.balance, p.api_enabled, p.is_active
      FROM user_integrations ui
      INNER JOIN profiles p ON p.id::text = ui.user_id
      WHERE ui.client_id = ${clientId} AND ui.client_secret = ${clientSecret}
    `;

    if (integrationResult.length === 0) {
      return NextResponse.json(
        { success: false, error: "Credenciais inválidas", code: "INVALID_CREDENTIALS" },
        { status: 401 }
      );
    }

    const integration = integrationResult[0];
    const profile = {
      id: integration.user_id,
      name: integration.name,
      kyc_status: integration.kyc_status,
      route_type: integration.route_type,
      balance: integration.balance,
      api_enabled: integration.api_enabled,
      is_active: integration.is_active
    };

    // Verificar se a integração específica está ativa
    if (!integration.integration_active) {
      return NextResponse.json(
        { success: false, error: "Esta integração está desativada", code: "INTEGRATION_DISABLED" },
        { status: 403 }
      );
    }

    // Verificar se o usuário está ativo
    if (!profile.is_active) {
      return NextResponse.json(
        { success: false, error: "Conta desativada", code: "ACCOUNT_DISABLED" },
        { status: 403 }
      );
    }

    // Verificar KYC do proprietário
    if (profile.kyc_status !== "approved") {
      return NextResponse.json(
        { success: false, error: "KYC não aprovado. Complete a verificação de identidade no dashboard.", code: "KYC_REQUIRED" },
        { status: 403 }
      );
    }

    // Parsear body
    const body = await request.json();
    const { amount, external_id, description, payer } = body;

    // Validar campos obrigatórios
    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Valor inválido", code: "INVALID_AMOUNT" },
        { status: 400 }
      );
    }

    // Valor mínimo depende da rota: black = R$ 5,00 | white = R$ 1,00
    const minAmount = profile.route_type === 'black' ? 5 : 1;
    if (amount < minAmount) {
      return NextResponse.json(
        { success: false, error: `Valor mínimo é R$ ${minAmount.toFixed(2).replace('.', ',')}`, code: "MIN_AMOUNT" },
        { status: 400 }
      );
    }

    if (amount > 50000) {
      return NextResponse.json(
        { success: false, error: "Valor máximo é R$ 50.000,00", code: "MAX_AMOUNT" },
        { status: 400 }
      );
    }

    // Buscar taxas baseadas na rota do usuário (considera taxas personalizadas)
    const systemFees = await getSystemFeesForUser(profile.id);
    
    console.log(`[Integration PIX] Usuario ${profile.id} - Taxas: ${systemFees.pixPercentageFee}% + R$${systemFees.pixFixedFee} (rota: ${profile.route_type})`);

    // Calcular taxa (usar taxa personalizada do usuario ou padrao da rota)
    const feePercentage = systemFees.pixPercentageFee;
    const fixedFee = systemFees.pixFixedFee;
    const percentageFee = (amount * feePercentage) / 100;
    const fee = percentageFee + fixedFee;
    const netAmount = amount - fee;
    
    console.log(`[Integration PIX] Valor: R$${amount}, Taxa: R$${fee.toFixed(2)} (${feePercentage}% + R$${fixedFee}), Liquido: R$${netAmount.toFixed(2)}`);

    const transactionId = external_id || `int_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Criar cobrança PIX
    // Garantir que os dados do pagador nunca sejam undefined
    const safePayerName = (payer?.name && String(payer.name).trim()) ? String(payer.name).trim() : "Cliente";
    const safePayerDocument = (payer?.document && String(payer.document).trim()) ? String(payer.document).replace(/\D/g, "") : "00000000000";
    
    console.log(`[Integration PIX] Criando PIX - payerName: "${safePayerName}", payerDocument: "${safePayerDocument}"`);
    
    const pixResponse = await createPixPayment(
      amount,
      transactionId,
      profile.id,
      description || `Pagamento via ${profile.name}`,
      safePayerName,
      safePayerDocument
    );

    if (!pixResponse.success) {
      console.error("[Integration PIX] Erro ao criar PIX:", pixResponse.error);
      return NextResponse.json(
        { success: false, error: pixResponse.error || "Erro ao criar cobrança", code: "ACQUIRER_ERROR" },
        { status: 500 }
      );
    }

    // Extrair dados do PIX - pode estar em data.* ou diretamente no objeto
    const acquirerTransactionId = pixResponse.transactionId || pixResponse.data?.transactionId || transactionId;
    const qrCode = pixResponse.qrCode || pixResponse.data?.qrCode || pixResponse.copyPaste || '';
    const qrCodeBase64 = pixResponse.qrCodeBase64 || pixResponse.data?.qrCodeBase64 || '';
    const copyPaste = pixResponse.copyPaste || pixResponse.data?.copyPaste || pixResponse.data?.pixCode || qrCode;
    
    console.log(`[Integration PIX] PIX criado - acquirerTxId: ${acquirerTransactionId}, qrCode: ${qrCode ? 'OK' : 'VAZIO'}, copyPaste: ${copyPaste ? 'OK' : 'VAZIO'}`);

    // Salvar transação no banco (tabela transactions sem qr_code)
    const txId = crypto.randomUUID();
    const txResult = await sql`
      INSERT INTO transactions (
        id, user_id, external_id, type, amount, fee, net_amount, 
        status, description, payer_name, payer_document, metadata, created_at
      )
      VALUES (
        ${txId}, ${profile.id}, ${transactionId}, ${'pix_in'}, 
        ${amount}, ${fee}, ${netAmount}, ${'pending'}, 
        ${description || `Pagamento via ${profile.name}`},
        ${safePayerName}, ${safePayerDocument}, 
        ${JSON.stringify({ 
          integration_id: integration.integration_id, 
          integration_name: integration.integration_name,
          acquirer_transaction_id: acquirerTransactionId,
          payer: { name: safePayerName, document: safePayerDocument, email: payer?.email },
          route: profile.route_type
        })}, 
        NOW()
      )
      RETURNING id, external_id, amount, fee, net_amount, status, description, created_at
    `;

    // Salvar dados do QR Code na tabela pix_charges
    const chargeId = crypto.randomUUID();
    await sql`
      INSERT INTO pix_charges (
        id, user_id, transaction_id, amount, description, 
        qr_code, qr_code_base64, copy_paste, external_id,
        payer_name, payer_document, status, created_at
      )
      VALUES (
        ${chargeId}, ${profile.id}, ${txId}, ${amount}, 
        ${description || `Pagamento via ${profile.name}`},
        ${qrCode}, ${qrCodeBase64}, ${copyPaste}, ${transactionId},
        ${safePayerName}, ${safePayerDocument}, ${'active'}, NOW()
      )
    `;

    const transaction = txResult[0];

    // Registrar log de auditoria
    await sql`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_value, created_at)
      VALUES (
        ${profile.id}, 
        'PIX_INTEGRATION_CREATED', 
        'transaction', 
        ${transaction.id}, 
        ${JSON.stringify({ 
          amount, 
          fee, 
          net_amount: netAmount, 
          integration_id: profile.id,
          integration_name: profile.name
        })}, 
        NOW()
      )
    `;

    // Retornar resposta formatada
    return NextResponse.json({
      success: true,
      data: {
        transaction_id: transaction.id,
        external_id: transaction.external_id,
        amount: transaction.amount,
        fee: transaction.fee,
        net_amount: transaction.net_amount,
        status: transaction.status,
        pix: {
          qr_code: qrCode,
          qr_code_base64: qrCodeBase64,
          copy_paste: copyPaste,
        },
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
        created_at: transaction.created_at,
      },
    });
  } catch (error) {
    console.error("[v1/integration/pix] Error:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

// GET - Consultar status de transação
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Basic ")) {
      return NextResponse.json(
        { success: false, error: "Credenciais não fornecidas", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const base64Credentials = authHeader.slice(6);
    let credentials: string;
    try {
      credentials = Buffer.from(base64Credentials, "base64").toString("utf-8");
    } catch {
      return NextResponse.json(
        { success: false, error: "Credenciais mal formatadas", code: "INVALID_CREDENTIALS" },
        { status: 401 }
      );
    }
    const [clientId, clientSecret] = credentials.split(":");

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { success: false, error: "Credenciais inválidas", code: "INVALID_CREDENTIALS" },
        { status: 401 }
      );
    }

    // Buscar integração pelas credenciais na tabela user_integrations
    const integrationResult = await sql`
      SELECT ui.user_id, ui.is_active as integration_active
      FROM user_integrations ui
      INNER JOIN profiles p ON p.id::text = ui.user_id
      WHERE ui.client_id = ${clientId} AND ui.client_secret = ${clientSecret}
    `;

    if (integrationResult.length === 0) {
      return NextResponse.json(
        { success: false, error: "Credenciais inválidas", code: "INVALID_CREDENTIALS" },
        { status: 401 }
      );
    }

    const integration = integrationResult[0];
    
    if (!integration.integration_active) {
      return NextResponse.json(
        { success: false, error: "Esta integração está desativada", code: "INTEGRATION_DISABLED" },
        { status: 403 }
      );
    }

    const userId = integration.user_id;

    // Buscar transação
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get("transaction_id");
    const externalId = searchParams.get("external_id");

    if (!transactionId && !externalId) {
      return NextResponse.json(
        { success: false, error: "Informe transaction_id ou external_id", code: "MISSING_PARAM" },
        { status: 400 }
      );
    }

    let transaction;
    if (transactionId) {
      const result = await sql`
        SELECT id, external_id, amount, fee, net_amount, status, description, 
               payer_name, payer_document, created_at, updated_at
        FROM transactions 
        WHERE id = ${transactionId} AND user_id = ${userId}
      `;
      transaction = result[0];
    } else {
      const result = await sql`
        SELECT id, external_id, amount, fee, net_amount, status, description, 
               payer_name, payer_document, created_at, updated_at
        FROM transactions 
        WHERE external_id = ${externalId} AND user_id = ${userId}
      `;
      transaction = result[0];
    }

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: "Transação não encontrada", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        transaction_id: transaction.id,
        external_id: transaction.external_id,
        amount: transaction.amount,
        fee: transaction.fee,
        net_amount: transaction.net_amount,
        status: transaction.status,
        description: transaction.description,
        payer: {
          name: transaction.payer_name,
          document: transaction.payer_document,
        },
        created_at: transaction.created_at,
        updated_at: transaction.updated_at,
      },
    });
  } catch (error) {
    console.error("[v1/integration/pix] GET Error:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
