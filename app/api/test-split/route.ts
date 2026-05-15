import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { createMisticPayClient } from "@/lib/acquirers/misticpay"
import { MedusaPayments } from "@/lib/acquirers/medusa"

// API temporaria para testar pagamento dividido
// REMOVER APOS TESTE - v2 usando acquirer_id
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get("email") || "hazertiktok@gmail.com"
  const amount = parseFloat(searchParams.get("amount") || "1500")
  
  try {
    // 1. Buscar usuario com acquirer_id
    const users = await sql`
      SELECT id, name, email, kyc_status, acquirer_id 
      FROM profiles 
      WHERE email = ${email}
    `
    
    if (!users.length) {
      return NextResponse.json({ success: false, error: "Usuario nao encontrado" })
    }
    
    const user = users[0]
    
    if (!user.acquirer_id) {
      return NextResponse.json({ 
        success: false, 
        error: "Usuario nao tem rota de pagamento configurada",
        user: { name: user.name, kyc_status: user.kyc_status }
      })
    }
    
    // 2. Buscar adquirente
    const acquirerResult = await sql`
      SELECT * FROM acquirers WHERE id = ${user.acquirer_id} AND is_active = true LIMIT 1
    `
    
    if (!acquirerResult.length) {
      return NextResponse.json({ 
        success: false, 
        error: "Adquirente nao encontrada ou inativa",
        acquirer_id: user.acquirer_id
      })
    }
    
    const acquirer = acquirerResult[0]
    const transactionId = `test_split_${Date.now()}`
    
    let pixResult: { success: boolean; data?: any; error?: string }
    
    // 3. Gerar PIX baseado na adquirente
    if (acquirer.code === 'misticpay') {
      const misticPay = await createMisticPayClient()
      
      if (!misticPay) {
        return NextResponse.json({ success: false, error: "Erro ao conectar com MisticPay" })
      }
      
      pixResult = await misticPay.createPixCharge({
        amount,
        payerName: "Cliente Teste",
        payerDocument: "00000000000",
        transactionId,
        description: `Teste Split - Parcela R$ ${amount}`,
        projectWebhook: "https://www.legacypay.site/api/webhooks/misticpay",
      })
      
    } else if (acquirer.code === 'medusa' || acquirer.code === 'medusa_white') {
      const medusa = new MedusaPayments({
        secretKey: acquirer.api_key,
        licenseKey: acquirer.api_secret || undefined,
      })
      
      const amountInCents = Math.round(amount * 100)
      
      const medusaResult = await medusa.createSimplePixPayment(
        amountInCents,
        "Cliente Teste",
        "36009722004",
        "cliente@teste.com",
        `Teste Split - Parcela R$ ${amount}`,
        "https://www.legacypay.site/api/webhooks/medusa"
      )
      
      if (!medusaResult.pix?.qrcode) {
        pixResult = { success: false, error: "Medusa nao retornou QR Code" }
      } else {
        pixResult = {
          success: true,
          data: {
            qrCode: medusaResult.pix.qrcode,
            qrCodeBase64: medusaResult.pix.qrcode,
            copyPaste: medusaResult.pix.qrcode,
            transactionId: String(medusaResult.id),
          }
        }
      }
    } else {
      return NextResponse.json({ success: false, error: `Adquirente ${acquirer.code} nao suportada` })
    }
    
    if (!pixResult.success) {
      return NextResponse.json({
        success: false,
        error: pixResult.error || "Erro ao gerar PIX",
        user: { name: user.name, kyc_status: user.kyc_status },
        acquirer: { code: acquirer.code, name: acquirer.name }
      })
    }
    
    return NextResponse.json({
      success: true,
      user: { name: user.name, kyc_status: user.kyc_status },
      acquirer: { code: acquirer.code, name: acquirer.name },
      pix: {
        transactionId: pixResult.data.transactionId,
        amount,
        qrCodeBase64: pixResult.data.qrCodeBase64 ? "SIM" : "NAO",
        copyPaste: pixResult.data.copyPaste?.substring(0, 80) + "..."
      }
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido"
    })
  }
}
