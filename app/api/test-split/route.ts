import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

// API temporaria para testar pagamento dividido
// REMOVER APOS TESTE
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get("email") || "hazertiktok@gmail.com"
  const valor = parseFloat(searchParams.get("valor") || "1500")
  
  try {
    // 1. Buscar usuario
    const users = await sql`
      SELECT id, name, email, mp_access_token, kyc_status 
      FROM profiles 
      WHERE email = ${email}
    `
    
    if (!users.length) {
      return NextResponse.json({ success: false, error: "Usuario nao encontrado" })
    }
    
    const user = users[0]
    
    if (!user.mp_access_token) {
      return NextResponse.json({ 
        success: false, 
        error: "Usuario nao tem Mercado Pago configurado",
        user: { name: user.name, kyc_status: user.kyc_status }
      })
    }
    
    // 2. Gerar PIX
    const payload = {
      transaction_amount: valor,
      description: `Teste Split Payment - R$ ${valor}`,
      payment_method_id: "pix",
      payer: {
        email: "cliente@teste.com",
        first_name: "Cliente",
        last_name: "Teste",
        identification: {
          type: "CPF",
          number: "12345678909"
        }
      }
    }
    
    const response = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${user.mp_access_token}`,
        "X-Idempotency-Key": `test-split-${Date.now()}`
      },
      body: JSON.stringify(payload)
    })
    
    const data = await response.json()
    
    if (data.id) {
      return NextResponse.json({
        success: true,
        user: { name: user.name, kyc_status: user.kyc_status },
        pix: {
          id: data.id,
          status: data.status,
          valor: data.transaction_amount,
          qrCodeBase64: data.point_of_interaction?.transaction_data?.qr_code_base64 ? "SIM (gerado)" : "NAO",
          copyPaste: data.point_of_interaction?.transaction_data?.qr_code?.substring(0, 50) + "..."
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        error: "Erro ao gerar PIX",
        details: data
      })
    }
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido"
    })
  }
}
