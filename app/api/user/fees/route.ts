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

    // Buscar perfil do usuário com taxas, rota e adquirente especifica
    const profileResult = await sql`
      SELECT fee_percentage, fixed_fee, withdrawal_fee, daily_limit, route_type, acquirer_id
      FROM profiles
      WHERE id = ${user.id}
    `;

    const profile = profileResult[0];
    const routeType = profile?.route_type || 'black';
    
    // Buscar limites da adquirente especifica se existir
    let acquirerLimits = { min_deposit: 10, min_withdrawal: 10 };
    if (profile?.acquirer_id) {
      const acquirerResult = await sql`
        SELECT min_deposit, min_withdrawal FROM acquirers WHERE id = ${profile.acquirer_id} AND is_active = true
      `;
      if (acquirerResult.length > 0) {
        acquirerLimits = {
          min_deposit: Number(acquirerResult[0].min_deposit) || 10,
          min_withdrawal: Number(acquirerResult[0].min_withdrawal) || 10,
        };
      }
    }

    // Buscar taxas do sistema baseado na rota do usuário (considera taxas personalizadas)
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

    // Buscar total de taxas pagas pelo usuário (volume apenas de depositos)
    const transactionsResult = await sql`
      SELECT COALESCE(SUM(fee), 0) as total_fees, 
             COALESCE(SUM(CASE WHEN type IN ('pix_in', 'deposit') THEN amount ELSE 0 END), 0) as total_volume,
             COUNT(*) as total_transactions
      FROM transactions
      WHERE user_id = ${user.id} AND status = 'completed'
    `;

    const txStats = transactionsResult[0] || { total_fees: 0, total_volume: 0, total_transactions: 0 };

    const fees = {
      // Taxas PIX In (deposito) - ja considera taxas personalizadas do usuario
      pix_fixed_fee: Number(systemFees.pixFixedFee),
      pix_percentage_fee: Number(systemFees.pixPercentageFee),
      
      // Taxa PIX Out (saque) - ja considera taxa personalizada do usuario
      withdrawal_fee: Number(systemFees.withdrawalFee),
      
      // Taxas do usuario especifico (para exibicao no painel)
      user_fee_percentage: Number(systemFees.pixPercentageFee),
      user_fixed_fee: Number(systemFees.pixFixedFee),
      user_withdrawal_fee: Number(systemFees.withdrawalFee),
      
      // Informações da rota (nome amigável, não mostra nome real da adquirente)
      gateway_name: ROUTE_DISPLAY_NAMES[routeType as 'white' | 'black'] || 'Rota Black',
      route_type: routeType,
      
      // Limites - garantir que são números
      daily_limit: Number(profile?.daily_limit) || 50000,
      monthly_limit: Number(settings.monthly_limit) || 500000,
      min_deposit: acquirerLimits.min_deposit,
      max_deposit: Number(settings.max_deposit) || 50000,
      min_withdrawal: acquirerLimits.min_withdrawal,
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
