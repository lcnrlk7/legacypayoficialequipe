import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { sendPasswordResetEmail } from "@/lib/email"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 }
      )
    }

    // Verificar se o usuário existe
    const profiles = await sql`
      SELECT id, name FROM profiles WHERE email = ${email}
    `

    if (profiles.length === 0) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    const profile = profiles[0]

    // Gerar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutos

    // Invalidar códigos anteriores
    await sql`
      DELETE FROM email_verification_codes WHERE email = ${email}
    `

    // Salvar novo código
    await sql`
      INSERT INTO email_verification_codes (email, code, expires_at, used)
      VALUES (${email}, ${code}, ${expiresAt.toISOString()}, false)
    `

    // Enviar email
    const sent = await sendPasswordResetEmail(email, code, profile.name || "Usuário")

    if (!sent) {
      return NextResponse.json(
        { error: "Erro ao enviar email" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Código enviado para seu email",
    })
  } catch (error) {
    console.error("Erro ao enviar código de senha:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
