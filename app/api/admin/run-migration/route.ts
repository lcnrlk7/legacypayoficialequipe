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
    
    return NextResponse.json({ 
      success: false, 
      error: "Migração não reconhecida",
      available: ["withdrawal-fee", "fixed-fee", "all-fees"]
    }, { status: 400 });
    
  } catch (error) {
    console.error("[Admin Migration] Erro:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erro ao executar migração" },
      { status: 500 }
    );
  }
}
