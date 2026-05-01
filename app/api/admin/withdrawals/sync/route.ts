import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { MisticPay } from "@/lib/acquirers/misticpay";
import { notifyWithdrawalCompleted, notifyWithdrawalFailed } from "@/lib/notifications";

export const dynamic = "force-dynamic";

/**
 * Sincroniza status de saques pendentes com a MisticPay
 * POST: Sincroniza um saque especifico
 * GET: Sincroniza todos os saques pendentes
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { withdrawalId } = body;

    if (!withdrawalId) {
      return NextResponse.json({ error: "withdrawalId obrigatorio" }, { status: 400 });
    }

    // Buscar o saque
    const withdrawals = await sql`
      SELECT w.*, p.email, p.name as user_name, p.balance as user_balance
      FROM withdrawals w
      JOIN profiles p ON w.user_id = p.id
      WHERE w.id = ${withdrawalId}
    `;

    if (withdrawals.length === 0) {
      return NextResponse.json({ error: "Saque nao encontrado" }, { status: 404 });
    }

    const withdrawal = withdrawals[0];

    if (!withdrawal.acquirer_withdrawal_id) {
      return NextResponse.json({ error: "Saque sem ID da adquirente" }, { status: 400 });
    }

    // Buscar credenciais da MisticPay
    const misticAcquirer = await sql`
      SELECT api_key, api_secret 
      FROM acquirers 
      WHERE code = 'misticpay' AND is_active = true 
      LIMIT 1
    `;

    if (misticAcquirer.length === 0) {
      return NextResponse.json({ error: "MisticPay nao configurada" }, { status: 500 });
    }

    const { api_key, api_secret } = misticAcquirer[0];
    const misticClient = new MisticPay({ clientId: api_key, clientSecret: api_secret });

    // Verificar status na MisticPay
    const result = await misticClient.checkTransaction(withdrawal.acquirer_withdrawal_id);
    
    console.log(`[Sync Withdrawal] Resposta MisticPay para ${withdrawal.acquirer_withdrawal_id}:`, JSON.stringify(result));

    if (!result.success) {
      return NextResponse.json({ 
        error: "Erro ao consultar MisticPay", 
        details: result.error,
        withdrawal: {
          id: withdrawal.id,
          status: withdrawal.status,
          acquirer_id: withdrawal.acquirer_withdrawal_id
        }
      }, { status: 500 });
    }

    const misticStatus = (result.data?.status || "").toUpperCase();
    let newStatus = withdrawal.status;
    let updated = false;

    // Mapear status
    if (misticStatus === "COMPLETO" || misticStatus === "COMPLETED" || misticStatus === "PAID") {
      if (withdrawal.status !== "completed") {
        newStatus = "completed";
        updated = true;

        await sql`
          UPDATE withdrawals 
          SET status = 'completed', processed_at = NOW()
          WHERE id = ${withdrawal.id}
        `;

        // Notificar usuario
        const grossAmount = Number(withdrawal.amount) || 0;
        const fee = Number(withdrawal.fee) || 0;
        const netAmount = Number(withdrawal.net_amount) || 0;
        await notifyWithdrawalCompleted(withdrawal.user_id, grossAmount, netAmount, fee, withdrawal.pix_key);
      }
    } else if (misticStatus === "FALHA" || misticStatus === "FAILED" || misticStatus === "CANCELADO" || misticStatus === "CANCELLED") {
      if (withdrawal.status !== "failed") {
        newStatus = "failed";
        updated = true;

        // Devolver saldo
        const refundAmount = Number(withdrawal.amount) || 0;
        const newBalance = Number(withdrawal.user_balance) + refundAmount;

        await sql`
          UPDATE withdrawals 
          SET status = 'failed', processed_at = NOW()
          WHERE id = ${withdrawal.id}
        `;

        await sql`
          UPDATE profiles 
          SET balance = ${newBalance}
          WHERE id = ${withdrawal.user_id}
        `;

        await notifyWithdrawalFailed(withdrawal.user_id, refundAmount, "Falha no processamento");
      }
    }

    return NextResponse.json({
      success: true,
      withdrawal: {
        id: withdrawal.id,
        oldStatus: withdrawal.status,
        newStatus,
        updated,
        misticStatus,
        acquirer_id: withdrawal.acquirer_withdrawal_id
      },
      misticpay: result.data
    });

  } catch (error) {
    console.error("[Sync Withdrawal] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao sincronizar saque", details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Buscar todos os saques em processamento
    const pendingWithdrawals = await sql`
      SELECT w.id, w.user_id, w.amount, w.fee, w.net_amount, w.pix_key, 
             w.acquirer_withdrawal_id, w.status, w.created_at,
             p.balance as user_balance
      FROM withdrawals w
      JOIN profiles p ON w.user_id = p.id
      WHERE w.status = 'processing'
        AND w.acquirer_withdrawal_id IS NOT NULL
      ORDER BY w.created_at DESC
      LIMIT 50
    `;

    if (pendingWithdrawals.length === 0) {
      return NextResponse.json({ success: true, message: "Nenhum saque pendente", synced: 0 });
    }

    // Buscar credenciais da MisticPay
    const misticAcquirer = await sql`
      SELECT api_key, api_secret 
      FROM acquirers 
      WHERE code = 'misticpay' AND is_active = true 
      LIMIT 1
    `;

    if (misticAcquirer.length === 0) {
      return NextResponse.json({ error: "MisticPay nao configurada" }, { status: 500 });
    }

    const { api_key, api_secret } = misticAcquirer[0];
    const misticClient = new MisticPay({ clientId: api_key, clientSecret: api_secret });

    const results = [];
    let syncedCount = 0;

    for (const withdrawal of pendingWithdrawals) {
      try {
        const result = await misticClient.checkTransaction(withdrawal.acquirer_withdrawal_id);
        
        if (result.success && result.data) {
          const misticStatus = (result.data.status || "").toUpperCase();
          
          if (misticStatus === "COMPLETO" || misticStatus === "COMPLETED" || misticStatus === "PAID") {
            await sql`
              UPDATE withdrawals 
              SET status = 'completed', processed_at = NOW()
              WHERE id = ${withdrawal.id}
            `;

            const grossAmount = Number(withdrawal.amount) || 0;
            const fee = Number(withdrawal.fee) || 0;
            const netAmount = Number(withdrawal.net_amount) || 0;
            await notifyWithdrawalCompleted(withdrawal.user_id, grossAmount, netAmount, fee, withdrawal.pix_key);

            results.push({
              id: withdrawal.id,
              oldStatus: "processing",
              newStatus: "completed",
              misticStatus
            });
            syncedCount++;

          } else if (misticStatus === "FALHA" || misticStatus === "FAILED" || misticStatus === "CANCELADO") {
            const refundAmount = Number(withdrawal.amount) || 0;
            const newBalance = Number(withdrawal.user_balance) + refundAmount;

            await sql`
              UPDATE withdrawals 
              SET status = 'failed', processed_at = NOW()
              WHERE id = ${withdrawal.id}
            `;

            await sql`
              UPDATE profiles 
              SET balance = ${newBalance}
              WHERE id = ${withdrawal.user_id}
            `;

            await notifyWithdrawalFailed(withdrawal.user_id, refundAmount, "Falha no processamento");

            results.push({
              id: withdrawal.id,
              oldStatus: "processing",
              newStatus: "failed",
              misticStatus,
              refunded: refundAmount
            });
            syncedCount++;
          } else {
            results.push({
              id: withdrawal.id,
              status: "still_processing",
              misticStatus
            });
          }
        }
      } catch (err) {
        console.error(`[Sync] Erro ao verificar saque ${withdrawal.id}:`, err);
        results.push({
          id: withdrawal.id,
          error: String(err)
        });
      }
    }

    return NextResponse.json({
      success: true,
      total: pendingWithdrawals.length,
      synced: syncedCount,
      results
    });

  } catch (error) {
    console.error("[Sync Withdrawals] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao sincronizar saques", details: String(error) },
      { status: 500 }
    );
  }
}
