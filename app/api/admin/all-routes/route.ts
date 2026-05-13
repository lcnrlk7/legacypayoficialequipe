import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function GET() {
  const sql = neon(process.env.DATABASE_URL!);
  
  const routes = await sql`
    SELECT name, route_type, fee_percentage, fixed_fee, fee_is_percentage, 
           withdrawal_fee, withdrawal_fee_is_percentage, min_deposit, max_withdrawal
    FROM acquirers 
    ORDER BY route_type, name
  `;
  
  return NextResponse.json({ routes });
}
