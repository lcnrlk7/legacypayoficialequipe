import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getSession } from "@/lib/auth"
import { 
  testDatabaseConnection, 
  setupTenantDatabase,
  addDomainToVercel,
  removeDomainFromVercel,
  checkDomainStatus
} from "@/lib/white-label"

const sql = neon(process.env.DATABASE_URL!)

// GET - Buscar tenant do usuario
export async function GET() {
  const session = await getSession()
  
  if (!session) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }
  
  const userId = session.userId
  
  try {
    const result = await sql`
      SELECT * FROM white_label_tenants WHERE user_id = ${userId} LIMIT 1
    `
    
    const tenant = result[0] || null
    
    if (!tenant) {
      return NextResponse.json({ success: true, tenant: null })
    }
    
    // Verificar status dos dominios (com tratamento de erro)
    let domainAppStatus = { configured: false, verified: false }
    let domainAdminStatus = { configured: false, verified: false }
    
    try {
      if (tenant.domain_app) {
        domainAppStatus = await checkDomainStatus(tenant.domain_app)
      }
      if (tenant.domain_admin) {
        domainAdminStatus = await checkDomainStatus(tenant.domain_admin)
      }
    } catch (domainError) {
      console.error("[White Label] Erro ao verificar dominios:", domainError)
    }
    
    return NextResponse.json({ 
      success: true,
      tenant,
      domainStatus: {
        app: domainAppStatus,
        admin: domainAdminStatus,
      }
    })
  } catch (error: any) {
    console.error("[White Label] Erro ao buscar tenant:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Criar tenant
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }
  
  const userId = session.userId
  
  try {
    const body = await request.json()
    const { name, slug } = body
    
    if (!name || !slug) {
      return NextResponse.json({ error: "Nome e slug sao obrigatorios" }, { status: 400 })
    }
    
    // Verificar se usuario ja tem tenant
    const existing = await sql`
      SELECT id FROM white_label_tenants WHERE user_id = ${userId} LIMIT 1
    `
    
    if (existing.length > 0) {
      return NextResponse.json({ error: "Voce ja possui um tenant" }, { status: 400 })
    }
    
    // Verificar se slug ja existe
    const slugExists = await sql`
      SELECT id FROM white_label_tenants WHERE slug = ${slug}
    `
    
    if (slugExists.length > 0) {
      return NextResponse.json({ error: "Slug ja existe" }, { status: 400 })
    }
    
    await sql`
      INSERT INTO white_label_tenants (user_id, name, slug)
      VALUES (${userId}, ${name}, ${slug})
    `
    
    return NextResponse.json({ success: true, message: "Tenant criado" })
  } catch (error: any) {
    console.error("[White Label] Erro:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Atualizar tenant
export async function PUT(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }
  
  const userId = session.userId
  
  try {
    const body = await request.json()
    const {
      name,
      slug,
      domain_app,
      domain_admin,
      database_url,
      logo_url,
      mascot_url,
      favicon_url,
      badge_url,
      banner_url,
      login_bg_url,
      primary_color,
      secondary_color,
      text_color,
      use_hyperion_gateway,
      gateway_provider,
      gateway_client_id,
      gateway_client_secret,
      transaction_fee,
      withdraw_fee,
      min_withdraw,
      modules_config,
      ceo_modules_config,
      custom_texts,
    } = body
    
    // Verificar se usuario tem tenant
    const existing = await sql`
      SELECT id FROM white_label_tenants WHERE user_id = ${userId} LIMIT 1
    `
    
    if (existing.length === 0) {
      return NextResponse.json({ error: "Tenant nao encontrado" }, { status: 404 })
    }
    
    const tenantId = existing[0].id
    
    // Verificar se slug ja existe (se estiver mudando)
    if (slug) {
      const slugExists = await sql`
        SELECT id FROM white_label_tenants WHERE slug = ${slug} AND id != ${tenantId}
      `
      
      if (slugExists.length > 0) {
        return NextResponse.json({ error: "Slug ja existe" }, { status: 400 })
      }
    }
    
    // Atualizar tenant
    await sql`
      UPDATE white_label_tenants
      SET
        name = COALESCE(${name}, name),
        slug = COALESCE(${slug}, slug),
        domain_app = ${domain_app},
        domain_admin = ${domain_admin},
        database_url = ${database_url},
        logo_url = ${logo_url},
        mascot_url = ${mascot_url},
        favicon_url = ${favicon_url},
        badge_url = ${badge_url},
        banner_url = ${banner_url},
        login_bg_url = ${login_bg_url},
        primary_color = COALESCE(${primary_color}, primary_color),
        secondary_color = COALESCE(${secondary_color}, secondary_color),
        text_color = COALESCE(${text_color}, text_color),
        use_hyperion_gateway = COALESCE(${use_hyperion_gateway}, use_hyperion_gateway),
        gateway_provider = ${gateway_provider},
        gateway_client_id = ${gateway_client_id},
        gateway_client_secret = ${gateway_client_secret},
        transaction_fee = COALESCE(${transaction_fee}, transaction_fee),
        withdraw_fee = COALESCE(${withdraw_fee}, withdraw_fee),
        min_withdraw = COALESCE(${min_withdraw}, min_withdraw),
        modules_config = COALESCE(${JSON.stringify(modules_config)}, modules_config),
        ceo_modules_config = COALESCE(${JSON.stringify(ceo_modules_config)}, ceo_modules_config),
        custom_texts = COALESCE(${JSON.stringify(custom_texts)}, custom_texts),
        updated_at = NOW()
      WHERE id = ${tenantId}
    `
    
    return NextResponse.json({ success: true, message: "Tenant atualizado" })
  } catch (error: any) {
    console.error("[White Label] Erro:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Remover tenant
export async function DELETE() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }
  
  const userId = session.userId
  
  try {
    const result = await sql`
      SELECT * FROM white_label_tenants WHERE user_id = ${userId} LIMIT 1
    `
    
    const tenant = result[0]
    
    if (!tenant) {
      return NextResponse.json({ error: "Tenant nao encontrado" }, { status: 404 })
    }
    
    // Remover dominios da Vercel
    if (tenant.domain_app) {
      await removeDomainFromVercel(tenant.domain_app)
    }
    if (tenant.domain_admin) {
      await removeDomainFromVercel(tenant.domain_admin)
    }
    
    // Remover pagamentos
    await sql`DELETE FROM white_label_payments WHERE tenant_id = ${tenant.id}`
    
    // Remover logs
    await sql`DELETE FROM white_label_logs WHERE tenant_id = ${tenant.id}`
    
    // Remover tenant
    await sql`DELETE FROM white_label_tenants WHERE id = ${tenant.id}`
    
    return NextResponse.json({ success: true, message: "Tenant removido" })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
