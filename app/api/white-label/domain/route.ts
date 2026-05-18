import { NextRequest, NextResponse } from "next/server"
import { 
  addDomainToVercel,
  removeDomainFromVercel,
  checkDomainStatus
} from "@/lib/white-label"
import { neon } from "@neondatabase/serverless"
import { getSession } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

// POST - Adicionar dominio
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }
  
  const userId = session.userId
  
  try {
    const { domain, type } = await request.json()
    
    if (!domain || !type) {
      return NextResponse.json({ error: "Dominio e tipo sao obrigatorios" }, { status: 400 })
    }
    
    if (type !== "app" && type !== "admin") {
      return NextResponse.json({ error: "Tipo deve ser 'app' ou 'admin'" }, { status: 400 })
    }
    
    // Verificar se dominio ja esta em uso
    const existing = await sql`
      SELECT id FROM white_label_tenants 
      WHERE (domain_app = ${domain} OR domain_admin = ${domain})
      AND user_id != ${userId}
    `
    
    if (existing.length > 0) {
      return NextResponse.json({ error: "Dominio ja esta em uso" }, { status: 400 })
    }
    
    // Adicionar dominio na Vercel
    const result = await addDomainToVercel(domain)
    
    if (!result.success) {
      return NextResponse.json({ 
        success: false, 
        error: result.error 
      }, { status: 400 })
    }
    
    // Atualizar tenant
    const tenant = await getTenantByUserId(userId)
    if (tenant) {
      if (type === "app") {
        await sql`
          UPDATE white_label_tenants
          SET domain_app = ${domain}, updated_at = NOW()
          WHERE id = ${tenant.id}
        `
      } else {
        await sql`
          UPDATE white_label_tenants
          SET domain_admin = ${domain}, updated_at = NOW()
          WHERE id = ${tenant.id}
        `
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Dominio adicionado. Configure o DNS apontando para cname.vercel-dns.com",
      dns_instruction: {
        type: "CNAME",
        name: domain.split(".")[0],
        value: "cname.vercel-dns.com"
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET - Verificar status do dominio
export async function GET(request: NextRequest) {
  const userId = await verifyAuth()
  if (!userId) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }
  
  try {
    const { searchParams } = new URL(request.url)
    const domain = searchParams.get("domain")
    
    if (!domain) {
      return NextResponse.json({ error: "Dominio e obrigatorio" }, { status: 400 })
    }
    
    const status = await checkDomainStatus(domain)
    
    return NextResponse.json({ 
      success: true, 
      domain,
      ...status
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Remover dominio
export async function DELETE(request: NextRequest) {
  const userId = await verifyAuth()
  if (!userId) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }
  
  try {
    const { domain, type } = await request.json()
    
    if (!domain || !type) {
      return NextResponse.json({ error: "Dominio e tipo sao obrigatorios" }, { status: 400 })
    }
    
    // Remover da Vercel
    await removeDomainFromVercel(domain)
    
    // Atualizar tenant
    const tenant = await getTenantByUserId(userId)
    if (tenant) {
      if (type === "app") {
        await sql`
          UPDATE white_label_tenants
          SET domain_app = NULL, updated_at = NOW()
          WHERE id = ${tenant.id}
        `
      } else {
        await sql`
          UPDATE white_label_tenants
          SET domain_admin = NULL, updated_at = NOW()
          WHERE id = ${tenant.id}
        `
      }
    }
    
    return NextResponse.json({ success: true, message: "Dominio removido" })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
