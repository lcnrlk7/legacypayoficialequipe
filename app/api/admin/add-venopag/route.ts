import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Primeiro garantir que as colunas de limite existem
    await sql`ALTER TABLE acquirers ADD COLUMN IF NOT EXISTS max_withdrawal DECIMAL(12, 2) DEFAULT 10000`;
    await sql`ALTER TABLE acquirers ADD COLUMN IF NOT EXISTS daily_limit DECIMAL(12, 2) DEFAULT 10000`;
    
    // Verificar se ja existe
    const existing = await sql`SELECT id, name, is_active FROM acquirers WHERE code = 'venopag'`;
    
    if (existing.length > 0) {
      // Atualizar para garantir que esta ativa
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
          max_withdrawal = 10000.00,
          daily_limit = 10000.00,
          route_type = 'white',
          health_status = 'online',
          updated_at = NOW()
        WHERE code = 'venopag'
      `;
      
      const acquirers = await sql`SELECT name, code, route_type, fee_percentage, withdrawal_fee, is_active FROM acquirers ORDER BY priority`;
      
      return NextResponse.json({
        success: true,
        message: "Venopag atualizada com sucesso!",
        acquirers
      });
    }
    
    // Criar nova
    const maxP = await sql`SELECT COALESCE(MAX(priority), 0) as mp FROM acquirers`;
    const nextPriority = (maxP[0]?.mp || 0) + 1;
    
    await sql`
      INSERT INTO acquirers (id, name, code, api_url, api_key, api_secret, is_active, priority, fee_percentage, withdrawal_fee, min_deposit, min_withdrawal, max_withdrawal, daily_limit, route_type, health_status, created_at, updated_at)
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
        10000.00,
        10000.00,
        'white',
        'online',
        NOW(),
        NOW()
      )
    `;
    
    const acquirers = await sql`SELECT name, code, route_type, fee_percentage, withdrawal_fee, is_active FROM acquirers ORDER BY priority`;
    
    return NextResponse.json({
      success: true,
      message: "Venopag adicionada com sucesso! Taxa deposito: 3%, Taxa saque: 4%, Limite diario: R$10.000, Limite por saque: R$10.000",
      acquirers
    });
  } catch (error) {
    console.error("[add-venopag] Erro:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Erro desconhecido" 
    }, { status: 500 });
  }
}
