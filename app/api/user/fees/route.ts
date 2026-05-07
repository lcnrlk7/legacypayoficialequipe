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
    
    // Buscar dados da adquirente especifica se existir
    let acquirerData = { 
      min_deposit: 10, 
      min_withdrawal: 10,
      max_withdrawal: 10000,
      daily_limit: 10000,
      fee_percentage: 0,
      withdrawal_fee: 0,
      fixed_fee: 0,
      name: "",
      fee_is_percentage: true,
      withdrawal_fee_is_percentage: false,
      route_type: "black"
    };
    if (profile?.acquirer_id) {
      const acquirerResult = await sql`
        SELECT name, min_deposit, min_withdrawal, max_withdrawal, daily_limit, fee_percentage, withdrawal_fee, fixed_fee, fee_is_percentage, withdrawal_fee_is_percentage, route_type
        FROM acquirers WHERE id = ${profile.acquirer_id} AND is_active = true
      `;
      if (acquirerResult.length > 0) {
        const acq = acquirerResult[0];
        acquirerData = {
          min_deposit: Number(acq.min_deposit) || 10,
          min_withdrawal: Number(acq.min_withdrawal) || 10,
          max_withdrawal: Number(acq.max_withdrawal) || 10000,
          daily_limit: Number(acq.daily_limit) || 10000,
          fee_percentage: Number(acq.fee_percentage) || 0,
          withdrawal_fee: Number(acq.withdrawal_fee) || 0,
          fixed_fee: Number(acq.fixed_fee) || 0,
          name: acq.name || "",
          fee_is_percentage: acq.fee_is_percentage ?? true,
          withdrawal_fee_is_percentage: acq.withdrawal_fee_is_percentage ?? false,
          route_type: acq.route_type || "black"
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

    // Usar taxas da adquirente especifica se existir, senao usar do sistema
    // Usar os novos campos fee_is_percentage e withdrawal_fee_is_percentage
    const isFeePercentage = acquirerData.fee_is_percentage ?? true;
    const isWithdrawalPercentage = acquirerData.withdrawal_fee_is_percentage ?? false;
    
    const effectiveFees = acquirerData.name ? {
      pixFixedFee: isFeePercentage ? 0 : Number(acquirerData.fixed_fee || 0),
      pixPercentageFee: isFeePercentage ? Number(acquirerData.fee_percentage || 0) : 0,
      withdrawalFee: acquirerData.withdrawal_fee,
      withdrawalFeeIsPercentage: isWithdrawalPercentage,
      feeIsPercentage: isFeePercentage,
    } : systemFees;

    const fees = {
      // Taxas PIX In (deposito)
      pix_fixed_fee: Number(effectiveFees.pixFixedFee),
      pix_percentage_fee: Number(effectiveFees.pixPercentageFee),
      
      // Taxa PIX Out (saque) - pode ser percentual ou fixa
      withdrawal_fee: Number(effectiveFees.withdrawalFee),
      withdrawal_fee_is_percentage: effectiveFees.withdrawalFeeIsPercentage || false,
      
      // Taxas do usuario especifico (para exibicao no painel)
      user_fee_percentage: Number(effectiveFees.pixPercentageFee),
      user_fixed_fee: Number(effectiveFees.pixFixedFee),
      user_withdrawal_fee: Number(effectiveFees.withdrawalFee),
      
      // Flag para saber se usa taxa percentual ou fixa (deposito)
      has_percentage_fee: acquirerData.has_percentage_fee || Number(effectiveFees.pixPercentageFee) > 0,
      
      // Informações da rota (mostra nome da adquirente se existir)
      gateway_name: acquirerData.name || ROUTE_DISPLAY_NAMES[routeType as 'white' | 'black'] || 'Rota Black',
      route_type: routeType,
      
      // Limites - garantir que são números (priorizar adquirente, depois perfil, depois sistema)
      daily_limit: acquirerData.daily_limit || Number(profile?.daily_limit) || 50000,
      monthly_limit: Number(settings.monthly_limit) || 500000,
      min_deposit: acquirerData.min_deposit,
      max_deposit: Number(settings.max_deposit) || 50000,
      min_withdrawal: acquirerData.min_withdrawal,
      max_withdrawal: acquirerData.max_withdrawal || Number(settings.max_withdrawal) || 10000,
      per_withdrawal_limit: acquirerData.max_withdrawal || 10000,
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
