import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

/**
 * Webhook para receber notificacoes da Venopag
 * 
 * Cash In (Deposito):
 * { type: "cashin", status: "confirmed", amount: 123.45, fee: 1.23, request_number: "vp_...", transaction_id: "...", e2e: "", provider: "...", updated_at: "2025-11-24 12:00:00" }
 * 
 * Cash Out (Saque):
 * { type: "cashout", status: "completed", amount: 250.00, fee: 2.50, transaction_id: "...", e2e: "WD_...", updated_at: "2025-11-24 12:00:00" }
 */

interface VenopagWebhook {
  type: "cashin" | "cashout";
  status: string;
  amount: number;
  fee: number;
  request_number?: string;
  transaction_id?: string;
  e2e?: string;
  provider?: string;
  updated_at?: string;
}

// Mapeamento de status Venopag -> Status interno
const STATUS_MAP: Record<string, string> = {
  confirmed: "completed",
  completed: "completed",
  pending: "pending",
  expired: "expired",
  failed: "failed",
};

export async function POST(request: Request) {
  try {
    const body: VenopagWebhook = await request.json();

    console.log("[Venopag Webhook] Recebido:", JSON.stringify(body));

    if (!body.type || !body.status) {
      console.error("[Venopag Webhook] Payload invalido:", body);
      return NextResponse.json({ error: "Payload invalido" }, { status: 400 });
    }

    const internalStatus = STATUS_MAP[body.status] || body.status;

    if (body.type === "cashin") {
      // Deposito PIX
      const transactionId = body.request_number || body.transaction_id;

      if (!transactionId) {
        console.error("[Venopag Webhook] Deposito sem ID de transacao");
        return NextResponse.json({ error: "ID de transacao ausente" }, { status: 400 });
      }

      console.log(`[Venopag Webhook] Deposito ${transactionId}: ${body.status} -> ${internalStatus}`);

      // Buscar transacao pelo external_id (que contem o request_number da Venopag)
      const transaction = await sql`
        SELECT t.*, p.id as user_id, p.balance, p.name
        FROM transactions t
        JOIN profiles p ON t.user_id = p.id
        WHERE t.external_id = ${transactionId}
        OR t.acquirer_transaction_id = ${transactionId}
        LIMIT 1
      `;

      if (transaction.length === 0) {
        console.log(`[Venopag Webhook] Transacao ${transactionId} nao encontrada`);
        // Nao retornar erro para Venopag nao reenviar
        return NextResponse.json({ ok: true, message: "Transacao nao encontrada" });
      }

      const tx = transaction[0];

      // Se ja esta completada, ignorar
      if (tx.status === "completed") {
        console.log(`[Venopag Webhook] Transacao ${transactionId} ja completada`);
        return NextResponse.json({ ok: true, message: "Ja processada" });
      }

      // Atualizar status da transacao
      await sql`
        UPDATE transactions 
        SET 
          status = ${internalStatus},
          updated_at = NOW()
        WHERE id = ${tx.id}
      `;

      // Se confirmado, creditar saldo do usuario
      if (internalStatus === "completed" && tx.status !== "completed") {
        const netAmount = tx.net_amount || tx.amount;

        await sql`
          UPDATE profiles 
          SET balance = balance + ${netAmount}
          WHERE id = ${tx.user_id}
        `;

        console.log(`[Venopag Webhook] Saldo creditado: R$ ${netAmount} para usuario ${tx.user_id}`);

        // Registrar no historico de saldo
        await sql`
          INSERT INTO balance_history (user_id, amount, type, description, transaction_id)
          VALUES (
            ${tx.user_id}, 
            ${netAmount}, 
            'deposit', 
            ${"Deposito PIX confirmado via Venopag"}, 
            ${tx.id}
          )
        `;
      }

      return NextResponse.json({ ok: true, message: "Deposito processado" });

    } else if (body.type === "cashout") {
      // Saque PIX
      const withdrawalId = body.e2e || body.transaction_id;

      if (!withdrawalId) {
        console.error("[Venopag Webhook] Saque sem ID");
        return NextResponse.json({ error: "ID de saque ausente" }, { status: 400 });
      }

      console.log(`[Venopag Webhook] Saque ${withdrawalId}: ${body.status} -> ${internalStatus}`);

      // Buscar saque pelo external_id
      const withdrawal = await sql`
        SELECT w.*, p.id as user_id, p.balance
        FROM withdrawals w
        JOIN profiles p ON w.user_id = p.id
        WHERE w.external_id = ${withdrawalId}
        OR w.acquirer_transaction_id = ${withdrawalId}
        LIMIT 1
      `;

      if (withdrawal.length === 0) {
        console.log(`[Venopag Webhook] Saque ${withdrawalId} nao encontrado`);
        return NextResponse.json({ ok: true, message: "Saque nao encontrado" });
      }

      const wd = withdrawal[0];

      // Se ja esta completado/cancelado, ignorar
      if (wd.status === "completed" || wd.status === "cancelled") {
        console.log(`[Venopag Webhook] Saque ${withdrawalId} ja processado: ${wd.status}`);
        return NextResponse.json({ ok: true, message: "Ja processado" });
      }

      // Atualizar status do saque
      await sql`
        UPDATE withdrawals 
        SET 
          status = ${internalStatus},
          updated_at = NOW()
        WHERE id = ${wd.id}
      `;

      // Se completado, ja foi debitado no momento da solicitacao
      // Se falhou, devolver saldo
      if (internalStatus === "failed" || internalStatus === "expired") {
        await sql`
          UPDATE profiles 
          SET balance = balance + ${wd.amount}
          WHERE id = ${wd.user_id}
        `;

        console.log(`[Venopag Webhook] Saque falhou, saldo devolvido: R$ ${wd.amount} para usuario ${wd.user_id}`);

        // Registrar devolucao
        await sql`
          INSERT INTO balance_history (user_id, amount, type, description, withdrawal_id)
          VALUES (
            ${wd.user_id}, 
            ${wd.amount}, 
            'refund', 
            ${"Saque PIX falhou - saldo devolvido via Venopag"}, 
            ${wd.id}
          )
        `;
      }

      return NextResponse.json({ ok: true, message: "Saque processado" });
    }

    return NextResponse.json({ ok: true, message: "Tipo desconhecido" });

  } catch (error) {
    console.error("[Venopag Webhook] Erro:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    );
  }
}

// GET para verificar se o webhook esta funcionando
export async function GET() {
  return NextResponse.json({ 
    status: "ok", 
    message: "Webhook Venopag ativo",
    timestamp: new Date().toISOString()
  });
}
