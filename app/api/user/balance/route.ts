import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const result = await sql`
      SELECT balance, name, email, kyc_status, fee_percentage, route_type
      FROM profiles
      WHERE id = ${user.id}
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Perfil não encontrado" },
        { status: 404 }
      );
    }

    const profile = result[0];
    const balance = Number(profile.balance) || 0;

    // Buscar saques pendentes do usuario
    const pendingResult = await sql`
      SELECT COALESCE(SUM(amount), 0) as pending_total
      FROM transactions
      WHERE user_id = ${user.id}
        AND type = 'withdrawal'
        AND status IN ('pending', 'processing', 'awaiting')
    `;
    const pendingWithdrawals = Number(pendingResult[0]?.pending_total) || 0;

    return NextResponse.json({
      balance,
      availableBalance: balance,
      pendingWithdrawals,
      name: profile.name,
      email: profile.email,
      kycStatus: profile.kyc_status,
      feePercentage: profile.fee_percentage || 2.5,
    });
  } catch (error) {
    console.error("[v0] Error fetching balance:", error);
    return NextResponse.json(
      { error: "Erro ao buscar saldo" },
      { status: 500 }
    );
  }
}
