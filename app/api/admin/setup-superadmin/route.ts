import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: 'DATABASE_URL não configurada' },
        { status: 500 }
      )
    }

    const sql = neon(process.env.DATABASE_URL)
    
    // Verificar se já existe
    const existing = await sql(
      'SELECT id FROM admin_team WHERE email = $1',
      [email]
    )

    if (existing.length > 0) {
      return NextResponse.json(
        { message: 'Super admin já existe', user: existing[0] },
        { status: 200 }
      )
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10)

    // Criar super admin
    const result = await sql(
      `INSERT INTO admin_team (email, password, role, name, status, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING id, email, name, role`,
      [email, hashedPassword, 'super_admin', name || 'Super Admin', 'active']
    )

    return NextResponse.json(
      { 
        message: 'Super admin criado com sucesso!',
        user: result[0]
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[Setup] Erro:', error)
    return NextResponse.json(
      { error: 'Erro ao criar super admin' },
      { status: 500 }
    )
  }
}
