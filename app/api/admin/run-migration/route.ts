import { verifyAdmin, accessDeniedResponse } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

// POST /api/admin/run-migration - Executa migracoes pendentes
export async function POST(request: NextRequest) {
  try {
    // SEGURANCA: Verificar se e admin
    const admin = await verifyAdmin();
    if (!admin) return accessDeniedResponse();
    
    const { migration } = await request.json();
    
    if (migration === "withdrawal-fee") {
      // 1. Adicionar coluna withdrawal_fee na tabela profiles (se não existir)
      await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS withdrawal_fee DECIMAL(10, 2) DEFAULT NULL`;
      
      // 2. Atualizar taxa de saque da MisticPay (rota white) para R$ 2,00
      await sql`UPDATE acquirers SET withdrawal_fee = 2.00 WHERE code = 'misticpay'`;
      
      // 3. Atualizar taxa de saque da Medusa (rota black) para R$ 5,00
      await sql`UPDATE acquirers SET withdrawal_fee = 5.00 WHERE code = 'medusa'`;
      
      // 4. Verificar adquirentes atualizadas
      const acquirers = await sql`SELECT name, code, withdrawal_fee FROM acquirers`;
      
      return NextResponse.json({
        success: true,
        message: "Migração de taxa de saque executada com sucesso",
        acquirers: acquirers.map(a => ({
          name: a.name,
          code: a.code,
          withdrawal_fee: Number(a.withdrawal_fee)
        }))
      });
    }

    if (migration === "fixed-fee") {
      // 1. Adicionar coluna fixed_fee na tabela profiles (se não existir)
      await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fixed_fee DECIMAL(10, 2) DEFAULT NULL`;
      
      return NextResponse.json({
        success: true,
        message: "Coluna fixed_fee adicionada com sucesso na tabela profiles"
      });
    }

    if (migration === "all-fees") {
      // Executar todas as migrações de taxas
      await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS withdrawal_fee DECIMAL(10, 2) DEFAULT NULL`;
      await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fixed_fee DECIMAL(10, 2) DEFAULT NULL`;
      
      await sql`UPDATE acquirers SET withdrawal_fee = 2.00 WHERE code = 'misticpay'`;
      await sql`UPDATE acquirers SET withdrawal_fee = 5.00 WHERE code = 'medusa'`;
      
      const acquirers = await sql`SELECT name, code, withdrawal_fee FROM acquirers`;
      
      return NextResponse.json({
        success: true,
        message: "Todas as migrações de taxas executadas com sucesso",
        acquirers: acquirers.map(a => ({
          name: a.name,
          code: a.code,
          withdrawal_fee: Number(a.withdrawal_fee)
        }))
      });
    }
    
    if (migration === "add-venopag") {
      // Verificar se ja existe
      const existing = await sql`SELECT id FROM acquirers WHERE code = 'venopag'`;
      
      if (existing.length > 0) {
        // Atualizar
        await sql`
          UPDATE acquirers SET
            name = 'Venopag',
            api_url = 'https://venopag.com',
            api_key = 'np_56f1e77f0183e5f933312005',
            api_secret = 'npsec_238d95c8e8b5463b229652f7468bc138b91f0b82644211fd',
            is_active = true,
            fee_percentage = 3.0,
            withdrawal_fee = 4.0,
            min_deposit = 1.00,
            min_withdrawal = 10.00,
            route_type = 'white',
            health_status = 'online',
            updated_at = NOW()
          WHERE code = 'venopag'
        `;
        
        return NextResponse.json({
          success: true,
          message: "Venopag atualizada com sucesso"
        });
      }
      
      // Criar nova
      const maxP = await sql`SELECT COALESCE(MAX(priority), 0) as mp FROM acquirers`;
      const nextPriority = (maxP[0]?.mp || 0) + 1;
      
      await sql`
        INSERT INTO acquirers (id, name, code, api_url, api_key, api_secret, is_active, priority, fee_percentage, withdrawal_fee, min_deposit, min_withdrawal, route_type, health_status, created_at, updated_at)
        VALUES (
          gen_random_uuid(),
          'Venopag',
          'venopag',
          'https://venopag.com',
          'np_56f1e77f0183e5f933312005',
          'npsec_238d95c8e8b5463b229652f7468bc138b91f0b82644211fd',
          true,
          ${nextPriority},
          3.0,
          4.0,
          1.00,
          10.00,
          'white',
          'online',
          NOW(),
          NOW()
        )
      `;
      
      const acquirers = await sql`SELECT name, code, route_type, fee_percentage, withdrawal_fee, is_active FROM acquirers ORDER BY priority`;
      
      return NextResponse.json({
        success: true,
        message: "Venopag adicionada com sucesso! Taxa deposito: 3%, Taxa saque: 4%",
        acquirers
      });
    }
    
    return NextResponse.json({ 
      success: false, 
      error: "Migração não reconhecida",
      available: ["withdrawal-fee", "fixed-fee", "all-fees", "add-venopag"]
    }, { status: 400 });
    
  } catch (error) {
    console.error("[Admin Migration] Erro:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erro ao executar migração" },
      { status: 500 }
    );
  }
}
