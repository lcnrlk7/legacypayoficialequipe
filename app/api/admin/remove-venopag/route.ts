import { verifyAdmin, accessDeniedResponse } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

// GET /api/admin/remove-venopag - Remove VenoPag do sistema e migra usuarios
export async function GET(request: NextRequest) {
  try {
    const results: string[] = [];

    // 1. Buscar MisticPay para usar como substituta
    const misticpay = await sql`SELECT id FROM acquirers WHERE code = 'misticpay' LIMIT 1`;
    
    if (misticpay.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "MisticPay nao encontrada para migrar usuarios" 
      }, { status: 400 });
    }
    
    const misticpayId = misticpay[0].id;
    results.push(`MisticPay encontrada: ${misticpayId}`);

    // 2. Buscar ID da VenoPag
    const venopag = await sql`SELECT id FROM acquirers WHERE code = 'venopag' LIMIT 1`;
    
    if (venopag.length === 0) {
      results.push("VenoPag ja foi removida do sistema");
    } else {
      const venopagId = venopag[0].id;
      
      // 3. Migrar usuarios da VenoPag para MisticPay
      const usersUpdated = await sql`
        UPDATE profiles 
        SET acquirer_id = ${misticpayId}, updated_at = NOW()
        WHERE acquirer_id = ${venopagId}
        RETURNING id, email
      `;
      results.push(`Usuarios migrados de VenoPag para MisticPay: ${usersUpdated.length}`);
      
      // 4. Desativar VenoPag
      await sql`UPDATE acquirers SET is_active = false WHERE code = 'venopag'`;
      results.push("VenoPag desativada");
      
      // 5. Remover VenoPag da tabela
      await sql`DELETE FROM acquirers WHERE code = 'venopag'`;
      results.push("VenoPag removida da tabela acquirers");
    }

    // 6. Verificar estado final
    const acquirers = await sql`
      SELECT name, code, route_type, is_active 
      FROM acquirers 
      ORDER BY priority
    `;

    const usersByAcquirer = await sql`
      SELECT a.name, COUNT(p.id) as total
      FROM profiles p
      LEFT JOIN acquirers a ON p.acquirer_id = a.id
      GROUP BY a.name
    `;

    return NextResponse.json({
      success: true,
      message: "VenoPag removida do sistema com sucesso",
      results,
      acquirers: acquirers.map(a => ({
        name: a.name,
        code: a.code,
        route_type: a.route_type,
        is_active: a.is_active
      })),
      usersByAcquirer: usersByAcquirer.map(u => ({
        acquirer: u.name || "Sem adquirente",
        total: Number(u.total)
      }))
    });
    
  } catch (error) {
    console.error("[Remove VenoPag] Erro:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erro ao remover VenoPag" },
      { status: 500 }
    );
  }
}
