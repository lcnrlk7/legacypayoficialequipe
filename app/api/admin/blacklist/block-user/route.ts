import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-change-in-production"
)

// Verifica se e admin/CEO
async function verifyAdminAuth(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("ceo-auth-token")?.value
    
    if (!token) return false
    
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload.role === "ceo" || payload.role === "admin"
  } catch {
    return false
  }
}

// GET - Busca usuarios para selecionar
export async function GET(request: NextRequest) {
  const isAdmin = await verifyAdminAuth()
  if (!isAdmin) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const search = searchParams.get("search") || ""

  if (!search || search.length < 3) {
    return NextResponse.json({ users: [] })
  }

  try {
    const sql = neon(process.env.DATABASE_URL!)
    
    const searchLower = search.toLowerCase()
    
    const users = await sql`
      SELECT 
        id,
        name,
        email,
        cpf,
        phone,
        created_at,
        last_ip,
        device_id,
        is_blocked
      FROM users
      WHERE 
        LOWER(name) LIKE ${'%' + searchLower + '%'}
        OR LOWER(email) LIKE ${'%' + searchLower + '%'}
        OR cpf LIKE ${'%' + search + '%'}
        OR phone LIKE ${'%' + search + '%'}
      ORDER BY created_at DESC
      LIMIT 20
    `

    return NextResponse.json({ users })
  } catch (error) {
    console.error("Erro ao buscar usuarios:", error)
    return NextResponse.json({ error: "Erro ao buscar usuarios" }, { status: 500 })
  }
}

// POST - Bloqueia usuario completo (todos os dados dele)
export async function POST(request: NextRequest) {
  const isAdmin = await verifyAdminAuth()
  if (!isAdmin) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { user_id, reason, notes, block_types } = body

    if (!user_id || !reason) {
      return NextResponse.json({ error: "user_id e reason sao obrigatorios" }, { status: 400 })
    }

    const sql = neon(process.env.DATABASE_URL!)
    
    // Buscar dados do usuario
    const userResult = await sql`
      SELECT id, name, email, cpf, phone, last_ip, device_id
      FROM users
      WHERE id = ${user_id}
    `

    if (userResult.length === 0) {
      return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 404 })
    }

    const user = userResult[0]
    const blocksCreated: string[] = []
    const blockTypesToApply = block_types || ["email", "cpf", "ip", "device", "phone"]

    // Bloquear email
    if (blockTypesToApply.includes("email") && user.email) {
      try {
        await sql`
          INSERT INTO blacklist (type, value, reason, notes, user_id, blocked_by, is_active)
          VALUES ('email', ${user.email}, ${reason}, ${notes || null}, ${user_id}, 'admin', true)
          ON CONFLICT (type, value) DO UPDATE SET
            reason = ${reason},
            notes = ${notes || null},
            is_active = true,
            updated_at = NOW()
        `
        blocksCreated.push(`email: ${user.email}`)
      } catch (e) {
        console.error("Erro ao bloquear email:", e)
      }
    }

    // Bloquear CPF
    if (blockTypesToApply.includes("cpf") && user.cpf) {
      try {
        await sql`
          INSERT INTO blacklist (type, value, reason, notes, user_id, blocked_by, is_active)
          VALUES ('cpf', ${user.cpf}, ${reason}, ${notes || null}, ${user_id}, 'admin', true)
          ON CONFLICT (type, value) DO UPDATE SET
            reason = ${reason},
            notes = ${notes || null},
            is_active = true,
            updated_at = NOW()
        `
        blocksCreated.push(`cpf: ${user.cpf}`)
      } catch (e) {
        console.error("Erro ao bloquear cpf:", e)
      }
    }

    // Bloquear IP
    if (blockTypesToApply.includes("ip") && user.last_ip) {
      try {
        await sql`
          INSERT INTO blacklist (type, value, reason, notes, user_id, blocked_by, is_active)
          VALUES ('ip', ${user.last_ip}, ${reason}, ${notes || null}, ${user_id}, 'admin', true)
          ON CONFLICT (type, value) DO UPDATE SET
            reason = ${reason},
            notes = ${notes || null},
            is_active = true,
            updated_at = NOW()
        `
        blocksCreated.push(`ip: ${user.last_ip}`)
      } catch (e) {
        console.error("Erro ao bloquear ip:", e)
      }
    }

    // Bloquear Device ID
    if (blockTypesToApply.includes("device") && user.device_id) {
      try {
        await sql`
          INSERT INTO blacklist (type, value, reason, notes, user_id, blocked_by, is_active)
          VALUES ('device', ${user.device_id}, ${reason}, ${notes || null}, ${user_id}, 'admin', true)
          ON CONFLICT (type, value) DO UPDATE SET
            reason = ${reason},
            notes = ${notes || null},
            is_active = true,
            updated_at = NOW()
        `
        blocksCreated.push(`device: ${user.device_id.substring(0, 8)}...`)
      } catch (e) {
        console.error("Erro ao bloquear device:", e)
      }
    }

    // Bloquear Telefone
    if (blockTypesToApply.includes("phone") && user.phone) {
      try {
        await sql`
          INSERT INTO blacklist (type, value, reason, notes, user_id, blocked_by, is_active)
          VALUES ('phone', ${user.phone}, ${reason}, ${notes || null}, ${user_id}, 'admin', true)
          ON CONFLICT (type, value) DO UPDATE SET
            reason = ${reason},
            notes = ${notes || null},
            is_active = true,
            updated_at = NOW()
        `
        blocksCreated.push(`phone: ${user.phone}`)
      } catch (e) {
        console.error("Erro ao bloquear phone:", e)
      }
    }

    // Marcar usuario como bloqueado
    await sql`
      UPDATE users
      SET is_blocked = true, blocked_at = NOW(), blocked_reason = ${reason}
      WHERE id = ${user_id}
    `

    return NextResponse.json({
      success: true,
      message: `Usuario ${user.name || user.email} bloqueado com sucesso`,
      blocks_created: blocksCreated,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      }
    })
  } catch (error) {
    console.error("Erro ao bloquear usuario:", error)
    return NextResponse.json({ error: "Erro ao bloquear usuario" }, { status: 500 })
  }
}
