import { NextRequest, NextResponse } from "next/server"
import { 
  testDatabaseConnection, 
  setupTenantDatabase 
} from "@/lib/white-label"
import { neon } from "@neondatabase/serverless"
import { getSession } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

// POST - Testar conexao com banco
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }
  
  const userId = session.userId
  
  try {
    const { database_url, action } = await request.json()
    
    if (!database_url) {
      return NextResponse.json({ error: "URL do banco e obrigatoria" }, { status: 400 })
    }
    
    // Testar conexao
    const testResult = await testDatabaseConnection(database_url)
    
    if (!testResult.success) {
      return NextResponse.json({ 
        success: false, 
        error: `Falha ao conectar: ${testResult.error}` 
      }, { status: 400 })
    }
    
    // Se action = setup, criar tabelas
    if (action === "setup") {
      const setupResult = await setupTenantDatabase(database_url)
      
      if (!setupResult.success) {
        return NextResponse.json({ 
          success: false, 
          error: `Falha ao criar tabelas: ${setupResult.error}` 
        }, { status: 400 })
      }
      
      // Atualizar tenant
      const tenantResult = await sql`
        SELECT id FROM white_label_tenants WHERE user_id = ${userId} LIMIT 1
      `
      if (tenantResult.length > 0) {
        await sql`
          UPDATE white_label_tenants
          SET database_configured = true, updated_at = NOW()
          WHERE id = ${tenantResult[0].id}
        `
      }
      
      return NextResponse.json({ 
        success: true, 
        message: "Banco conectado e tabelas criadas com sucesso" 
      })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Conexao bem sucedida" 
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
