import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

// Verifica se um valor esta na blacklist
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ip, email, cpf, device_id, phone, user_id } = body

    if (!ip && !email && !cpf && !device_id && !phone && !user_id) {
      return NextResponse.json({ blocked: false })
    }

    const sql = neon(process.env.DATABASE_URL!)

    // Monta a query dinamicamente
    const conditions: string[] = []
    const values: string[] = []

    if (ip) {
      conditions.push(`(type = 'ip' AND value = '${ip}')`)
    }
    if (email) {
      conditions.push(`(type = 'email' AND value = '${email.toLowerCase()}')`)
    }
    if (cpf) {
      const cleanCpf = cpf.replace(/\D/g, "")
      conditions.push(`(type = 'cpf' AND value = '${cleanCpf}')`)
    }
    if (device_id) {
      conditions.push(`(type = 'device' AND value = '${device_id}')`)
    }
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, "")
      conditions.push(`(type = 'phone' AND value = '${cleanPhone}')`)
    }
    if (user_id) {
      conditions.push(`user_id = '${user_id}'`)
    }

    if (conditions.length === 0) {
      return NextResponse.json({ blocked: false })
    }

    const query = `
      SELECT id, type, value, reason, created_at
      FROM blacklist
      WHERE (${conditions.join(" OR ")})
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > NOW())
      LIMIT 1
    `

    const result = await sql(query)

    if (result.length > 0) {
      // Registra o hit
      const block = result[0]
      await sql`
        INSERT INTO blacklist_hits (blacklist_id, ip, user_agent, created_at)
        VALUES (${block.id}, ${ip || null}, ${request.headers.get("user-agent") || null}, NOW())
      `

      return NextResponse.json({
        blocked: true,
        reason: block.reason,
        type: block.type,
        blocked_at: block.created_at,
      })
    }

    return NextResponse.json({ blocked: false })
  } catch (error) {
    console.error("[Blacklist Check] Erro:", error)
    // Em caso de erro, nao bloqueia para nao afetar usuarios legitimos
    return NextResponse.json({ blocked: false })
  }
}
