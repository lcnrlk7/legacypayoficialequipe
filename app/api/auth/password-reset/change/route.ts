import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const { email, code, newPassword } = await request.json()

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { error: "Email, código e nova senha são obrigatórios" },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 6 caracteres" },
        { status: 400 }
      )
    }

    // Verificar código novamente
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

    const verification = verifications[0]

    // Buscar usuário pelo profile
    const profiles = await sql`
      SELECT id FROM profiles WHERE email = ${email}
    `

    if (profiles.length === 0) {
      return NextResponse.json(
        { error: "Usuario nao encontrado" },
        { status: 404 }
      )
    }

    const profile = profiles[0]

    // Hash da nova senha
    const passwordHash = await bcrypt.hash(newPassword, 12)

    // Atualizar senha
    await sql`
      UPDATE profiles SET password_hash = ${passwordHash} WHERE id = ${profile.id}
    `

    // Marcar código como usado
    await sql`
      UPDATE email_verification_codes SET used = true WHERE id = ${verification.id}
    `

    return NextResponse.json({
      success: true,
      message: "Senha alterada com sucesso",
    })
  } catch (error) {
    console.error("Erro ao alterar senha:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
