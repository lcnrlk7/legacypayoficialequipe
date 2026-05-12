import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { MisticPay } from "@/lib/acquirers/misticpay";
import { notifyPixPaid } from "@/lib/notifications";

/**
 * Sincroniza status de transações PIX pendentes com a MisticPay
 * 
 * GET /api/cron/sync-misticpay - Sincroniza todas pendentes
 * POST /api/cron/sync-misticpay - Sincroniza uma transação específica
 */

export async function GET() {
  try {
    // Buscar adquirente MisticPay
    const acquirers = await sql`
      SELECT api_key, api_secret FROM acquirers 
      WHERE code = 'misticpay' AND is_active = true 
      LIMIT 1
    `;

    if (acquirers.length === 0) {
      return NextResponse.json({ error: "MisticPay não configurada" }, { status: 400 });
    }

    const client = new MisticPay({
      clientId: acquirers[0].api_key,
      clientSecret: acquirers[0].api_secret || "",
    });

    // Buscar transações pendentes da MisticPay (últimos 7 dias)
    const pending = await sql`
      SELECT t.id, t.user_id, t.external_id, t.acquirer_transaction_id, t.amount, t.fee, t.net_amount, t.metadata,
             p.balance as profile_balance
      FROM transactions t
      LEFT JOIN profiles p ON t.user_id = p.id
      WHERE t.status = 'pending' 
        AND t.type = 'pix_in'
        AND t.metadata->>'acquirer_code' = 'misticpay'
        AND t.created_at > NOW() - INTERVAL '7 days'
      ORDER BY t.created_at DESC
      LIMIT 50
    `;

    console.log(`[Sync MisticPay] Verificando ${pending.length} transações pendentes...`);

    let updated = 0;
    const results: Array<{ id: string; status: string; action: string }> = [];

    for (const tx of pending) {
      // Pegar o ID da MisticPay
      let misticId = tx.external_id;
      
      // Se o external_id começa com "lp_", é o nosso ID interno
      // O ID da MisticPay pode estar no metadata ou acquirer_transaction_id
      if (tx.metadata?.misticpay_id) {
        misticId = tx.metadata.misticpay_id;
      }

      try {
        const status = await client.getTransactionStatus(misticId);
        
        if (!status) {
          results.push({ id: tx.id, status: "not_found", action: "skipped" });
          continue;
        }

        const misticStatus = (status.transactionState || status.status || "").toUpperCase();
        console.log(`[Sync MisticPay] TX ${misticId} -> Status: ${misticStatus}`);

        if (misticStatus === "COMPLETO" || misticStatus === "COMPLETED" || misticStatus === "PAID") {
          // Atualizar para completed
          await sql`
            UPDATE transactions 
            SET status = 'completed', paid_at = NOW(), updated_at = NOW()
            WHERE id = ${tx.id}
          `;

          // Creditar saldo
          const netAmount = Number(tx.net_amount) || (Number(tx.amount) - Number(tx.fee || 0));
          const currentBalance = Number(tx.profile_balance) || 0;
          const newBalance = currentBalance + netAmount;

          await sql`
            UPDATE profiles SET balance = ${newBalance}, updated_at = NOW()
            WHERE id = ${tx.user_id}
          `;

          console.log(`[Sync MisticPay] TX ${misticId} -> COMPLETED! Credited R$ ${netAmount.toFixed(2)}`);

          // Notificar usuário
          await notifyPixPaid(tx.user_id as string, Number(tx.amount), netAmount);

          results.push({ id: tx.id, status: "completed", action: "updated" });
          updated++;
        } else if (misticStatus === "FALHA" || misticStatus === "FAILED" || misticStatus === "CANCELADO" || misticStatus === "CANCELLED") {
          await sql`
            UPDATE transactions SET status = 'failed', updated_at = NOW()
            WHERE id = ${tx.id}
          `;
          results.push({ id: tx.id, status: "failed", action: "updated" });
          updated++;
        } else {
          results.push({ id: tx.id, status: misticStatus, action: "no_change" });
        }
      } catch (err) {
        console.error(`[Sync MisticPay] Erro ao verificar ${misticId}:`, err);
        results.push({ id: tx.id, status: "error", action: "skipped" });
      }

      // Pequeno delay para não sobrecarregar API
      await new Promise(r => setTimeout(r, 200));
    }

    return NextResponse.json({
      success: true,
      checked: pending.length,
      updated,
      results,
    });
  } catch (error) {
    console.error("[Sync MisticPay] Error:", error);
    return NextResponse.json({ error: "Erro ao sincronizar" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { transaction_id } = await request.json();

    if (!transaction_id) {
      return NextResponse.json({ error: "transaction_id obrigatório" }, { status: 400 });
    }

    // Buscar transação
    const transactions = await sql`
      SELECT t.id, t.user_id, t.external_id, t.amount, t.fee, t.net_amount, t.status, t.metadata,
             p.balance as profile_balance
      FROM transactions t
      LEFT JOIN profiles p ON t.user_id = p.id
      WHERE t.id = ${transaction_id} OR t.external_id = ${transaction_id}
      LIMIT 1
    `;

    if (transactions.length === 0) {
      return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 });
    }

    const tx = transactions[0];

    if (tx.status !== "pending") {
      return NextResponse.json({ 
        success: true, 
        message: "Transação já está em status final",
        status: tx.status 
      });
    }

    // Buscar adquirente
    const acquirers = await sql`
      SELECT api_key, api_secret FROM acquirers 
      WHERE code = 'misticpay' AND is_active = true 
      LIMIT 1
    `;

    if (acquirers.length === 0) {
      return NextResponse.json({ error: "MisticPay não configurada" }, { status: 400 });
    }

    const client = new MisticPay({
      clientId: acquirers[0].api_key,
      clientSecret: acquirers[0].api_secret || "",
    });

    const status = await client.getTransactionStatus(tx.external_id);

    if (!status) {
      return NextResponse.json({ error: "Não foi possível consultar MisticPay" }, { status: 500 });
    }

    const misticStatus = (status.transactionState || status.status || "").toUpperCase();

    if (misticStatus === "COMPLETO" || misticStatus === "COMPLETED" || misticStatus === "PAID") {
      await sql`
        UPDATE transactions SET status = 'completed', paid_at = NOW(), updated_at = NOW()
        WHERE id = ${tx.id}
      `;

      const netAmount = Number(tx.net_amount) || (Number(tx.amount) - Number(tx.fee || 0));
      const currentBalance = Number(tx.profile_balance) || 0;
      const newBalance = currentBalance + netAmount;

      await sql`
        UPDATE profiles SET balance = ${newBalance}, updated_at = NOW()
        WHERE id = ${tx.user_id}
      `;

      await notifyPixPaid(tx.user_id as string, Number(tx.amount), netAmount);

      return NextResponse.json({
        success: true,
        status: "completed",
        credited: netAmount,
        new_balance: newBalance,
      });
    }

    return NextResponse.json({
      success: true,
      status: misticStatus,
      message: "Transação ainda não foi paga",
    });
  } catch (error) {
    console.error("[Sync MisticPay] Error:", error);
    return NextResponse.json({ error: "Erro ao sincronizar" }, { status: 500 });
  }
}
