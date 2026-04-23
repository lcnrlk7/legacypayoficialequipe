import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email e código são obrigatórios" },
        { status: 400 }
      )
    }

    // Buscar código válido
    const verifications = await sql`
      SELECT * FROM email_verification_codes 
      WHERE email = ${email} 
        AND code = ${code} 
        AND used = false 
        AND expires_at > NOW()
    `

    if (verifications.length === 0) {
      return NextResponse.json(
        { error: "Código inválido ou expirado" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Código verificado com sucesso",
    })
  } catch (error) {
    console.error("Erro ao verificar código:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
