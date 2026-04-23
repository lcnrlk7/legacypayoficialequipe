import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { NextResponse } from "next/server";
import { getSystemFeesForUser, ROUTE_DISPLAY_NAMES } from "@/lib/acquirers";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Buscar perfil do usuário com taxas e rota
    const profileResult = await sql`
      SELECT fee_percentage, daily_limit, route_type
      FROM profiles
      WHERE id = ${user.id}
    `;

    const profile = profileResult[0];
    const routeType = profile?.route_type || 'black';

    // Buscar taxas do sistema baseado na rota do usuário
    const systemFees = await getSystemFeesForUser(user.id);

    // Buscar configurações globais do sistema
    const settingsResult = await sql`
      SELECT key, value FROM system_settings
    `;

    const settings: Record<string, string> = {};
    settingsResult.forEach((s: { key: string; value: string }) => {
      try {
        settings[s.key] = JSON.parse(s.value);
      } catch {
        settings[s.key] = s.value;
      }
    });

    // Buscar total de taxas pagas pelo usuário
    const transactionsResult = await sql`
      SELECT COALESCE(SUM(fee), 0) as total_fees, 
             COALESCE(SUM(amount), 0) as total_volume,
             COUNT(*) as total_transactions
      FROM transactions
      WHERE user_id = ${user.id} AND status = 'completed'
    `;

    const txStats = transactionsResult[0] || { total_fees: 0, total_volume: 0, total_transactions: 0 };

    const fees = {
      // Taxas PIX (recebimento) - garantir que são números
      pix_fixed_fee: Number(systemFees.pixFixedFee) || 1,
      pix_percentage_fee: Number(systemFees.pixPercentageFee) || 5,
      
      // Taxa de saque (padrão: white=R$2, black=R$5)
      withdrawal_fee: Number(systemFees.withdrawalFee) || (routeType === 'white' ? 2 : 5),
      
      // Taxas do usuário específico (se houver)
      user_fee_percentage: Number(profile?.fee_percentage) || Number(systemFees.pixPercentageFee) || 5,
      
      // Informações da rota (nome amigável, não mostra nome real da adquirente)
      gateway_name: ROUTE_DISPLAY_NAMES[routeType as 'white' | 'black'] || 'Rota Black',
      route_type: routeType,
      
      // Limites - garantir que são números
      daily_limit: Number(profile?.daily_limit) || 50000,
      monthly_limit: Number(settings.monthly_limit) || 500000,
      min_deposit: Number(settings.min_deposit) || 10,
      max_deposit: Number(settings.max_deposit) || 50000,
      min_withdrawal: Number(settings.min_withdrawal) || 10,
      max_withdrawal: Number(settings.max_withdrawal) || 50000,
      auto_withdrawal_limit: Number(settings.auto_withdrawal_limit) || 500,
      
      // Estatísticas
      total_fees_paid: Number(txStats.total_fees) || 0,
      total_volume: Number(txStats.total_volume) || 0,
      total_transactions: Number(txStats.total_transactions) || 0,
    };

    return NextResponse.json({ fees });
  } catch (error) {
    console.error("Error fetching fees:", error);
    return NextResponse.json(
      { error: "Erro ao buscar taxas" },
      { status: 500 }
    );
  }
}
