import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// POST - Criar tabela de tenants White Label
export async function POST() {
  try {
    // Criar tabela principal de tenants
    await sql`
      CREATE TABLE IF NOT EXISTS white_label_tenants (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        domain_app TEXT UNIQUE,
        domain_admin TEXT UNIQUE,
        database_url TEXT,
        logo_url TEXT,
        mascot_url TEXT,
        favicon_url TEXT,
        primary_color TEXT DEFAULT '#FF5500',
        secondary_color TEXT DEFAULT '#1A1A1A',
        text_color TEXT DEFAULT '#FFFFFF',
        use_hyperion_gateway BOOLEAN DEFAULT true,
        gateway_provider TEXT,
        gateway_client_id TEXT,
        gateway_client_secret TEXT,
        transaction_fee DECIMAL(5, 2) DEFAULT 2.50,
        withdraw_fee DECIMAL(10, 2) DEFAULT 3.00,
        min_withdraw DECIMAL(10, 2) DEFAULT 10.00,
        is_active BOOLEAN DEFAULT false,
        is_verified BOOLEAN DEFAULT false,
        dns_configured BOOLEAN DEFAULT false,
        database_configured BOOLEAN DEFAULT false,
        plan TEXT DEFAULT 'basic',
        monthly_fee DECIMAL(10, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `
    
    // Indices
    await sql`CREATE INDEX IF NOT EXISTS idx_wl_tenants_user ON white_label_tenants(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_wl_tenants_domain_app ON white_label_tenants(domain_app)`
    await sql`CREATE INDEX IF NOT EXISTS idx_wl_tenants_domain_admin ON white_label_tenants(domain_admin)`
    await sql`CREATE INDEX IF NOT EXISTS idx_wl_tenants_slug ON white_label_tenants(slug)`
    
    // Tabela de logs de atividade White Label
    await sql`
      CREATE TABLE IF NOT EXISTS white_label_logs (
        id SERIAL PRIMARY KEY,
        tenant_id TEXT REFERENCES white_label_tenants(id),
        action TEXT NOT NULL,
        description TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `
    
    return NextResponse.json({
      success: true,
      message: "Tabelas White Label criadas com sucesso",
    })
  } catch (error: any) {
    console.error("[White Label Setup] Erro:", error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// GET - Verificar se tabelas existem
export async function GET() {
  try {
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'white_label_tenants'
      )
    `
    
    return NextResponse.json({
      success: true,
      exists: result[0]?.exists || false,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
