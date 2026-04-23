import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { generateVerificationCode, sendVerificationEmail } from "@/lib/email"

export async function POST(request: Request) {
  try {
    const { email, name, cpf } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 }
      )
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Email inválido" },
        { status: 400 }
      )
    }

    // Verificar se email já está cadastrado
    const existingUsers = await sql`
      SELECT id FROM profiles WHERE email = ${email.toLowerCase()}
    `

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: "Este email já está cadastrado" },
        { status: 400 }
      )
    }

    // Verificar se CPF já está cadastrado
    if (cpf) {
      const cleanCpf = cpf.replace(/\D/g, "")
      const existingCpf = await sql`
        SELECT id FROM profiles WHERE cpf = ${cleanCpf}
      `

      if (existingCpf.length > 0) {
        return NextResponse.json(
          { error: "Este CPF já está cadastrado" },
          { status: 400 }
        )
      }
    }

    // Invalidar códigos anteriores
    await sql`
      UPDATE email_verification_codes 
      SET used = true 
      WHERE email = ${email.toLowerCase()} AND used = false
    `

    // Gerar novo código
    const code = generateVerificationCode()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutos

    // Salvar código no banco
    await sql`
      INSERT INTO email_verification_codes (email, code, expires_at)
      VALUES (${email.toLowerCase()}, ${code}, ${expiresAt.toISOString()})
    `

    // Enviar email
    const sent = await sendVerificationEmail(email, code, name)

    if (!sent) {
      return NextResponse.json(
        { error: "Erro ao enviar email. Tente novamente." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Código enviado para seu email",
    })
  } catch (error) {
    console.error("Erro ao enviar código:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
