import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"
import { neon } from "@neondatabase/serverless"
import { 
  getTenantByUserId, 
  testDatabaseConnection, 
  setupTenantDatabase,
  addDomainToVercel,
  removeDomainFromVercel,
  checkDomainStatus
} from "@/lib/white-label"

const sql = neon(process.env.DATABASE_URL!)
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret")

async function verifyAuth(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value
    if (!token) return null
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload.sub as string
  } catch {
    return null
  }
}

// GET - Buscar tenant do usuario
export async function GET() {
  const userId = await verifyAuth()
  if (!userId) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }
  
  try {
    const tenant = await getTenantByUserId(userId)
    
    if (!tenant) {
      return NextResponse.json({ tenant: null })
    }
    
    // Verificar status dos dominios
    let domainAppStatus = { configured: false, verified: false }
    let domainAdminStatus = { configured: false, verified: false }
    
    if (tenant.domain_app) {
      domainAppStatus = await checkDomainStatus(tenant.domain_app)
    }
    if (tenant.domain_admin) {
      domainAdminStatus = await checkDomainStatus(tenant.domain_admin)
    }
    
    return NextResponse.json({ 
      tenant,
      domainStatus: {
        app: domainAppStatus,
        admin: domainAdminStatus,
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Criar ou atualizar tenant
export async function POST(request: NextRequest) {
  const userId = await verifyAuth()
  if (!userId) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }
  
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
    } = body
    
    // Verificar se usuario ja tem tenant
    const existingTenant = await getTenantByUserId(userId)
    
    if (existingTenant) {
      // Atualizar tenant existente
      await sql`
        UPDATE white_label_tenants
        SET
          name = COALESCE(${name}, name),
          slug = COALESCE(${slug}, slug),
          domain_app = COALESCE(${domain_app}, domain_app),
          domain_admin = COALESCE(${domain_admin}, domain_admin),
          database_url = COALESCE(${database_url}, database_url),
          logo_url = COALESCE(${logo_url}, logo_url),
          mascot_url = COALESCE(${mascot_url}, mascot_url),
          favicon_url = COALESCE(${favicon_url}, favicon_url),
          primary_color = COALESCE(${primary_color}, primary_color),
          secondary_color = COALESCE(${secondary_color}, secondary_color),
          text_color = COALESCE(${text_color}, text_color),
          use_hyperion_gateway = COALESCE(${use_hyperion_gateway}, use_hyperion_gateway),
          gateway_provider = COALESCE(${gateway_provider}, gateway_provider),
          gateway_client_id = COALESCE(${gateway_client_id}, gateway_client_id),
          gateway_client_secret = COALESCE(${gateway_client_secret}, gateway_client_secret),
          transaction_fee = COALESCE(${transaction_fee}, transaction_fee),
          withdraw_fee = COALESCE(${withdraw_fee}, withdraw_fee),
          min_withdraw = COALESCE(${min_withdraw}, min_withdraw),
          updated_at = NOW()
        WHERE id = ${existingTenant.id}
      `
      
      return NextResponse.json({ success: true, message: "Tenant atualizado" })
    }
    
    // Criar novo tenant
    if (!name || !slug) {
      return NextResponse.json({ error: "Nome e slug sao obrigatorios" }, { status: 400 })
    }
    
    // Verificar se slug ja existe
    const slugExists = await sql`
      SELECT id FROM white_label_tenants WHERE slug = ${slug}
    `
    
    if (slugExists.length > 0) {
      return NextResponse.json({ error: "Slug ja existe" }, { status: 400 })
    }
    
    await sql`
      INSERT INTO white_label_tenants (
        user_id, name, slug, domain_app, domain_admin, database_url,
        logo_url, mascot_url, favicon_url, primary_color, secondary_color, text_color,
        use_hyperion_gateway, gateway_provider, gateway_client_id, gateway_client_secret,
        transaction_fee, withdraw_fee, min_withdraw
      ) VALUES (
        ${userId}, ${name}, ${slug}, ${domain_app || null}, ${domain_admin || null}, ${database_url || null},
        ${logo_url || null}, ${mascot_url || null}, ${favicon_url || null}, 
        ${primary_color || '#FF5500'}, ${secondary_color || '#1A1A1A'}, ${text_color || '#FFFFFF'},
        ${use_hyperion_gateway !== false}, ${gateway_provider || null}, ${gateway_client_id || null}, ${gateway_client_secret || null},
        ${transaction_fee || 2.5}, ${withdraw_fee || 3.0}, ${min_withdraw || 10.0}
      )
    `
    
    return NextResponse.json({ success: true, message: "Tenant criado" })
  } catch (error: any) {
    console.error("[White Label] Erro:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Remover tenant
export async function DELETE() {
  const userId = await verifyAuth()
  if (!userId) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }
  
  try {
    const tenant = await getTenantByUserId(userId)
    
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
    
    // Remover tenant
    await sql`DELETE FROM white_label_tenants WHERE id = ${tenant.id}`
    
    return NextResponse.json({ success: true, message: "Tenant removido" })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
