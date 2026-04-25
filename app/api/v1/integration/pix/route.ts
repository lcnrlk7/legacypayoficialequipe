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

    // Buscar usuário pelas credenciais
    const profileResult = await sql`
      SELECT id, name, kyc_status, route_type, balance, api_enabled, is_active
      FROM profiles
      WHERE client_id = ${clientId} AND client_secret = ${clientSecret}
    `;

    if (profileResult.length === 0) {
      return NextResponse.json(
        { success: false, error: "Credenciais inválidas", code: "INVALID_CREDENTIALS" },
        { status: 401 }
      );
    }

    const profile = profileResult[0];

    // Verificar se a integração está ativa
    if (!profile.is_active || !profile.api_enabled) {
      return NextResponse.json(
        { success: false, error: "Integração desativada", code: "INTEGRATION_DISABLED" },
        { status: 403 }
      );
    }

    // Verificar KYC do proprietário
    if (profile.kyc_status !== "approved") {
      return NextResponse.json(
        { success: false, error: "KYC não aprovado. Complete a verificação de identidade.", code: "KYC_REQUIRED" },
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

    if (amount < 1) {
      return NextResponse.json(
        { success: false, error: "Valor mínimo é R$ 1,00", code: "MIN_AMOUNT" },
        { status: 400 }
      );
    }

    if (amount > 50000) {
      return NextResponse.json(
        { success: false, error: "Valor máximo é R$ 50.000,00", code: "MAX_AMOUNT" },
        { status: 400 }
      );
    }

    // Buscar taxas baseadas na rota do usuário
    const systemFees = await getSystemFeesForUser(profile.id);

    // Calcular taxa
    const feePercentage = systemFees.pixPercentageFee;
    const fixedFee = systemFees.pixFixedFee;
    const percentageFee = (amount * feePercentage) / 100;
    const fee = percentageFee + fixedFee;
    const netAmount = amount - fee;

    const transactionId = external_id || `int_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Criar cobrança PIX
    const pixResponse = await createPixPayment(
      amount,
      transactionId,
      profile.id,
      description || `Pagamento via ${profile.name}`,
      payer?.name || "Cliente",
      payer?.document || "00000000000"
    );

    if (!pixResponse.success) {
      return NextResponse.json(
        { success: false, error: pixResponse.error || "Erro ao criar cobrança", code: "ACQUIRER_ERROR" },
        { status: 500 }
      );
    }

    // Salvar transação no banco
    const txId = crypto.randomUUID();
    const result = await sql`
      INSERT INTO transactions (
        id, user_id, external_id, acquirer_transaction_id, type,
        amount, fee, net_amount, status, description, qr_code, qr_code_base64,
        copy_paste, payer_name, payer_document, payer_email, metadata, created_at
      )
      VALUES (
        ${txId}, ${profile.id}, ${transactionId}, ${pixResponse.data?.transactionId},
        ${'pix_in'}, ${amount}, ${fee}, ${netAmount}, ${'pending'}, ${description || `Pagamento via ${profile.name}`},
        ${pixResponse.data?.qrCode}, ${pixResponse.data?.qrCodeBase64}, ${pixResponse.data?.copyPaste},
        ${payer?.name}, ${payer?.document}, ${payer?.email}, ${JSON.stringify({ 
          integration_id: profile.id, 
          integration_name: profile.name,
          payer,
          route: profile.route_type
        })}, NOW()
      )
      RETURNING id, external_id, amount, fee, net_amount, status, qr_code, qr_code_base64, copy_paste, created_at
    `;

    const transaction = result[0];

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
          qr_code: transaction.qr_code,
          qr_code_base64: transaction.qr_code_base64,
          copy_paste: transaction.copy_paste,
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
    const credentials = Buffer.from(base64Credentials, "base64").toString("utf-8");
    const [clientId, clientSecret] = credentials.split(":");

    // Buscar usuário pelas credenciais
    const profileResult = await sql`
      SELECT id, api_enabled, is_active
      FROM profiles
      WHERE client_id = ${clientId} AND client_secret = ${clientSecret}
    `;

    if (profileResult.length === 0) {
      return NextResponse.json(
        { success: false, error: "Credenciais inválidas", code: "INVALID_CREDENTIALS" },
        { status: 401 }
      );
    }

    const profile = profileResult[0];

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
        WHERE id = ${transactionId} AND user_id = ${profile.id}
      `;
      transaction = result[0];
    } else {
      const result = await sql`
        SELECT id, external_id, amount, fee, net_amount, status, description, 
               payer_name, payer_document, created_at, updated_at
        FROM transactions 
        WHERE external_id = ${externalId} AND user_id = ${profile.id}
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
