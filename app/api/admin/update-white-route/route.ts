import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    // Atualizar rota WHITE para 2% + R$0.70 fixo
    const result = await sql`
      UPDATE acquirers 
      SET fee_percentage = 2, 
          fixed_fee = 0.70,
          fee_is_percentage = true,
          updated_at = NOW()
      WHERE route_type = 'white'
      RETURNING *
    `;
    
    // Atualizar todos os usuarios que estao na rota white
    const usersUpdated = await sql`
      UPDATE profiles
      SET fee_percentage = 2,
          updated_at = NOW()
      WHERE route_type = 'white'
      RETURNING id, email, fee_percentage
    `;

    return NextResponse.json({
      success: true,
      message: "Rota WHITE atualizada para 2% + R$0.70 fixo",
      acquirers_updated: result,
      users_updated: usersUpdated.length,
      users: usersUpdated.map((u: any) => ({ email: u.email, fee_percentage: u.fee_percentage }))
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
