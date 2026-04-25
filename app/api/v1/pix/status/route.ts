import { sql } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

// API pública para consultar status de transação
export async function GET(request: NextRequest) {
  try {
    // Extrair credenciais do header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Basic ")) {
      return NextResponse.json(
        { error: "Credenciais não fornecidas", code: "UNAUTHORIZED" },
        { status: 401 }
      )
    }

    // Decodificar Basic Auth
    const base64Credentials = authHeader.slice(6)
    const credentials = Buffer.from(base64Credentials, "base64").toString("utf-8")
    const [clientId, clientSecret] = credentials.split(":")

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "Credenciais inválidas", code: "INVALID_CREDENTIALS" },
        { status: 401 }
      )
    }

    // Buscar usuário
    const users = await sql`
      SELECT id FROM profiles WHERE client_id = ${clientId} AND client_secret = ${clientSecret}
    `

    if (users.length === 0) {
      return NextResponse.json(
        { error: "Credenciais inválidas", code: "INVALID_CREDENTIALS" },
        { status: 401 }
      )
    }

    const user = users[0]

    // Obter ID da transação
    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get("id")
    const externalId = searchParams.get("external_id")

    if (!transactionId && !externalId) {
      return NextResponse.json(
        { error: "ID da transação não fornecido", code: "MISSING_ID" },
        { status: 400 }
      )
    }

    // Buscar transação
    let transactions
    if (transactionId) {
      transactions = await sql`
        SELECT * FROM transactions WHERE user_id = ${user.id} AND id = ${transactionId}
      `
    } else {
      transactions = await sql`
        SELECT * FROM transactions WHERE user_id = ${user.id} AND external_id = ${externalId}
      `
    }

    if (transactions.length === 0) {
      return NextResponse.json(
        { error: "Transação não encontrada", code: "NOT_FOUND" },
        { status: 404 }
      )
    }

    const transaction = transactions[0]

    return NextResponse.json({
      success: true,
      data: {
        id: transaction.id,
        external_id: transaction.external_id,
        amount: transaction.amount,
        fee: transaction.fee,
        net_amount: transaction.net_amount,
        status: transaction.status,
        payer_name: transaction.payer_name,
        payer_document: transaction.payer_document,
        paid_at: transaction.paid_at,
        created_at: transaction.created_at,
      },
    })
  } catch (error) {
    console.error("[v0] PIX status error:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor", code: "INTERNAL_ERROR" },
      { status: 500 }
    )
  }
}
