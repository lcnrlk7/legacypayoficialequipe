import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import bcrypt from 'bcryptjs'

// API temporária para criar CEO - REMOVER APÓS USO
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, secret } = body

    // Verificar secret para segurança
    if (secret !== 'SETUP_CEO_2024_LEGACY') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 })
    }

    // Verificar se o usuário existe em profiles
    let profileResult = await sql`
      SELECT id, email, name FROM profiles WHERE email = ${email}
    `

    // Se não existe, criar o usuário em profiles
    if (profileResult.length === 0) {
      const password = 'LegacyPay@2024#Admin'
      const passwordHash = await bcrypt.hash(password, 12)
      const userId = crypto.randomUUID()
      
      await sql`
        INSERT INTO profiles (id, email, name, password_hash, role, kyc_status, is_active, route_type, balance)
        VALUES (${userId}, ${email}, 'CEO LegacyPay', ${passwordHash}, 'admin', 'approved', true, 'white', 0)
      `
      
      profileResult = await sql`
        SELECT id, email, name FROM profiles WHERE id = ${userId}
      `
    }

    const profile = profileResult[0]

    // Verificar se já existe em admin_team
    const existingAdmin = await sql`
      SELECT id FROM admin_team WHERE user_id = ${profile.id}
    `

    if (existingAdmin.length > 0) {
      // Atualizar para CEO
      await sql`
        UPDATE admin_team 
        SET role = 'ceo', permissions = '{"all": true}'::jsonb, is_active = true
        WHERE user_id = ${profile.id}
      `
      return NextResponse.json({ 
        success: true, 
        message: 'Usuário atualizado para CEO',
        user: { id: profile.id, email: profile.email, name: profile.name }
      })
    }

    // Criar novo registro em admin_team
    await sql`
      INSERT INTO admin_team (user_id, role, permissions, is_active)
      VALUES (${profile.id}, 'ceo', '{"all": true}'::jsonb, true)
    `

    return NextResponse.json({ 
      success: true, 
      message: 'CEO criado com sucesso!',
      user: { id: profile.id, email: profile.email, name: profile.name }
    })

  } catch (error) {
    console.error('Setup CEO error:', error)
    return NextResponse.json({ 
      error: 'Erro ao criar CEO', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
