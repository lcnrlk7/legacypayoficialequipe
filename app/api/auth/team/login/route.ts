import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'
import { cookies } from 'next/headers'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
)

const TEAM_COOKIE_NAME = 'team_session'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar membro da equipe - busca na tabela admin_team vinculada a profiles
    const result = await sql`
      SELECT at.id, p.name, p.email, p.password_hash, at.role, at.permissions, at.is_active
      FROM admin_team at
      INNER JOIN profiles p ON p.id = at.user_id
      WHERE p.email = ${email}
    `

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      )
    }

    const member = result[0]

    // Verificar se está ativo
    if (!member.is_active) {
      return NextResponse.json(
        { error: 'Conta desativada. Contate o administrador.' },
        { status: 403 }
      )
    }

    // Verificar senha
    const isValid = await bcrypt.compare(password, member.password_hash)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      )
    }

    // Atualizar último login
    await sql`
      UPDATE admin_team 
      SET updated_at = NOW() 
      WHERE id = ${member.id}
    `

    // Criar token JWT
    const token = await new SignJWT({
      id: member.id,
      email: member.email,
      name: member.name,
      role: member.role,
      permissions: member.permissions,
      isTeamMember: true,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(JWT_SECRET)

    // Definir cookie
    const cookieStore = await cookies()
    cookieStore.set(TEAM_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 horas
      path: '/',
    })

    // Retornar dados do membro (sem senha)
    return NextResponse.json({
      success: true,
      member: {
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role,
        permissions: member.permissions,
      },
      redirectUrl: getRedirectUrl(member.role),
      loginTime: Date.now(), // Para o timer de sessao
    })
  } catch (error) {
    console.error('Team login error:', error)
    return NextResponse.json(
      { error: 'Erro ao fazer login' },
      { status: 500 }
    )
  }
}

// Redirecionar baseado no role
function getRedirectUrl(role: string): string {
  switch (role) {
    case 'ceo':
      return '/lp-x7k9m2-internal/ceo'
    case 'manager':
      return '/lp-x7k9m2-internal/manager'
    case 'finance':
      return '/lp-x7k9m2-internal/finance'
    case 'support':
    default:
      return '/lp-x7k9m2-internal/support'
  }
}
