import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { mapMisticPayStatus } from "@/lib/acquirers/misticpay";
import { notifyPixPaid, notifyWithdrawalCompleted, notifyWithdrawalFailed } from "@/lib/notifications";

/**
 * Webhook para receber notificações da MisticPay
 * 
 * A MisticPay envia webhooks quando o status de uma transação muda.
 * Suporta tanto DEPÓSITOS quanto SAQUES.
 * 
 * Formato esperado do payload para DEPÓSITO:
 * {
 *   transactionId: string | number,
 *   transactionState: "PENDENTE" | "COMPLETO" | "FALHA",
 *   value: number,
 *   fee: number,
 *   transactionType: string,
 *   payer?: { name: string, document: string },
 *   ...
 * }
 * 
 * Formato esperado do payload para SAQUE:
 * {
 *   transactionId: string | number,
 *   transactionState: "PENDENTE" | "COMPLETO" | "FALHA" | "QUEUED",
 *   value: number,
 *   transactionType: "WITHDRAWAL" | "PIX_OUT",
 *   ...
 * }
 */

interface MisticPayWebhookPayload {
  transactionId: string | number;
  transactionState?: "PENDENTE" | "COMPLETO" | "FALHA" | "CANCELADO" | "QUEUED" | "COMPLETED" | "PAID";
  status?: string; // Alternativo para transactionState
  value: number;
  fee?: number;
  transactionType: string;
  transactionMethod?: string;
  payer?: {
    name: string;
    document: string;
  };
  endToEndId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    console.log("[MisticPay Webhook] Raw body recebido:", rawBody);
    
    const payload: MisticPayWebhookPayload = JSON.parse(rawBody);

    console.log("[MisticPay Webhook] Payload parseado:", JSON.stringify(payload, null, 2));

    // Registrar webhook recebido para debug
    try {
      await sql`
        INSERT INTO webhook_logs (id, url, payload, response_status, success, created_at)
        VALUES (
          ${crypto.randomUUID()},
          'misticpay-incoming',
          ${JSON.stringify(payload)},
          200,
          true,
          NOW()
        )
      `;
    } catch (logError) {
      console.error("[MisticPay Webhook] Erro ao logar webhook:", logError);
    }

    const { transactionId, transactionState, status, payer, transactionType } = payload;

    if (!transactionId) {
      console.log("[MisticPay Webhook] Payload sem ID:", payload);
      return NextResponse.json(
        { error: "ID da transação não informado", received: payload },
        { status: 400 }
      );
    }

    // MisticPay pode enviar status em transactionState ou status
    const rawStatus = transactionState || status || "PENDENTE";
    
    // Normalizar status (COMPLETED, PAID -> COMPLETO)
    let normalizedStatus = rawStatus.toUpperCase();
    if (normalizedStatus === "COMPLETED" || normalizedStatus === "PAID") {
      normalizedStatus = "COMPLETO";
    } else if (normalizedStatus === "FAILED" || normalizedStatus === "CANCELLED") {
      normalizedStatus = "FALHA";
    }
    
    // Mapear status da MisticPay para status interno
    const internalStatus = mapMisticPayStatus(normalizedStatus);
    
    console.log(`[MisticPay Webhook] Status raw=${rawStatus}, normalizado=${normalizedStatus}, interno=${internalStatus}`);

    // Detectar se é um callback de SAQUE
    // A MisticPay pode enviar como WITHDRAWAL, PIX_OUT ou RETIRADA
    const isWithdrawalCallback = transactionType === "WITHDRAWAL" || transactionType === "PIX_OUT" || transactionType === "RETIRADA";

    console.log(`[MisticPay Webhook] Tipo: ${transactionType} (${isWithdrawalCallback ? 'SAQUE' : 'DEPOSITO'}), Status: ${transactionState} -> ${internalStatus}`);

    // Primeiro, verificar se é um callback de saque
    // Busca por acquirer_withdrawal_id ou pelo ID no campo id (alguns webhooks enviam assim)
    const transactionIdStr = String(transactionId);
    console.log(`[MisticPay Webhook] Buscando saque com transactionId: "${transactionIdStr}" (tipo original: ${typeof transactionId})`);
    
    const withdrawals = await sql`
      SELECT w.id, w.user_id, w.amount, w.fee, w.net_amount, w.status, w.pix_key, w.acquirer_withdrawal_id,
             p.email as profile_email, p.name as profile_name, p.balance as profile_balance
      FROM withdrawals w
      LEFT JOIN profiles p ON w.user_id = p.id
      WHERE w.acquirer_withdrawal_id = ${transactionIdStr}
         OR w.id = ${transactionIdStr}
         OR CAST(w.acquirer_withdrawal_id AS TEXT) = ${transactionIdStr}
    `;
    
    console.log(`[MisticPay Webhook] Resultado busca saque: encontrados ${withdrawals.length} registros`);
    if (withdrawals.length > 0) {
      console.log(`[MisticPay Webhook] Saque encontrado: id=${withdrawals[0].id}, acquirer_id=${withdrawals[0].acquirer_withdrawal_id}, status_atual=${withdrawals[0].status}`);
    }

    if (withdrawals.length > 0) {
      // É um callback de saque
      const withdrawal = withdrawals[0];
      
      // Se o status já é final, não atualizar
      if (withdrawal.status === "completed" || withdrawal.status === "failed" || withdrawal.status === "rejected") {
        console.log(`[MisticPay Webhook] Saque ${transactionId} já está em status final: ${withdrawal.status}`);
        return NextResponse.json({ success: true, message: "Saque já processado" });
      }

      // Mapear status para saque
      let withdrawalStatus = withdrawal.status;
      const grossAmount = Number(withdrawal.amount) || 0;
      const fee = Number(withdrawal.fee) || 0;
      const netAmount = Number(withdrawal.net_amount) || 0;
      const pixKey = withdrawal.pix_key as string;
      
      if (internalStatus === "completed") {
        withdrawalStatus = "completed";
        
        // Atualizar status do saque
        await sql`
          UPDATE withdrawals 
          SET status = ${withdrawalStatus}, processed_at = NOW()
          WHERE id = ${withdrawal.id}
        `;
        
        console.log(`[MisticPay Webhook] Saque ${transactionId} CONCLUIDO! Bruto: R$ ${grossAmount.toFixed(2)}, Taxa: R$ ${fee.toFixed(2)}, Liquido: R$ ${netAmount.toFixed(2)}`);
        
        // Notificar usuario com valor bruto, liquido e taxa
        await notifyWithdrawalCompleted(withdrawal.user_id as string, grossAmount, netAmount, fee, pixKey);
        
        return NextResponse.json({ success: true, type: "withdrawal", status: withdrawalStatus });
        
      } else if (internalStatus === "failed" || internalStatus === "cancelled") {
        withdrawalStatus = "failed";
        
        // Se o saque falhou, devolver o saldo ao usuário
        const currentBalance = Number(withdrawal.profile_balance) || 0;
        const refundAmount = Number(withdrawal.amount) || 0;
        const newBalance = currentBalance + refundAmount;
        
        await sql`
          UPDATE profiles SET balance = ${newBalance}
          WHERE id = ${withdrawal.user_id}
        `;
        
        console.log(`[MisticPay Webhook] Saque ${transactionId} falhou. Devolvido R$ ${refundAmount.toFixed(2)} para usuario ${withdrawal.user_id}`);
        
        // Notificar usuario sobre a falha
        await notifyWithdrawalFailed(withdrawal.user_id as string, refundAmount, "Falha no processamento");
      }

      // Atualizar status do saque
      await sql`
        UPDATE withdrawals 
        SET status = ${withdrawalStatus}, processed_at = NOW()
        WHERE id = ${withdrawal.id}
      `;

      console.log(`[MisticPay Webhook] Saque ${transactionId} atualizado para status: ${withdrawalStatus}`);

      return NextResponse.json({ success: true, type: "withdrawal", status: withdrawalStatus });
    }

    // Se não é saque, buscar transação de depósito
    // Busca por external_id, acquirer_transaction_id, ou acquirer_id no metadata
    const transactions = await sql`
      SELECT t.id, t.user_id, t.amount, t.fee, t.net_amount, t.status,
             p.balance as profile_balance
      FROM transactions t
      LEFT JOIN profiles p ON t.user_id = p.id
      WHERE t.external_id = ${String(transactionId)} 
         OR t.acquirer_transaction_id = ${String(transactionId)}
         OR t.metadata->>'acquirer_id' = ${String(transactionId)}
    `;

    if (transactions.length === 0) {
      console.log(`[MisticPay Webhook] Transaction ${transactionId} not found in system`);
      // Retornar 200 para não ficar reenviando
      return NextResponse.json({ success: true, message: "Transação não encontrada" });
    }

    const transaction = transactions[0];

    // Verificar se o saldo ja foi creditado para esta transacao
    const existingCredit = await sql`
      SELECT id FROM audit_logs 
      WHERE entity_id = ${transaction.id}
        AND action = 'PAYMENT_CONFIRMED'
      LIMIT 1
    `;
    const alreadyCredited = existingCredit.length > 0;

    // Se o status já é final E o saldo já foi creditado, não fazer nada
    if ((transaction.status === "completed" || transaction.status === "failed") && alreadyCredited) {
      console.log(`[MisticPay Webhook] Transaction ${transactionId} already processed and credited. Skipping.`);
      return NextResponse.json({ success: true, message: "Transação já processada" });
    }

    // Atualizar status da transação
    await sql`
      UPDATE transactions 
      SET 
        status = ${internalStatus},
        paid_at = COALESCE(paid_at, ${internalStatus === 'completed' ? new Date() : null}),
        payer_name = COALESCE(payer_name, ${payer?.name || null}),
        payer_document = COALESCE(payer_document, ${payer?.document || null}),
        updated_at = NOW()
      WHERE id = ${transaction.id}
    `;

    console.log(`[MisticPay Webhook] Transaction ${transactionId} updated to status: ${internalStatus}. Already credited: ${alreadyCredited}`);

    // Se pagamento confirmado E saldo ainda nao foi creditado, creditar saldo do usuário
    if (internalStatus === "completed" && transaction.user_id && !alreadyCredited) {
      const netAmount = Number(transaction.net_amount) || (Number(transaction.amount) - Number(transaction.fee || 0));
      const currentBalance = Number(transaction.profile_balance) || 0;
      const newBalance = currentBalance + netAmount;

      await sql`
        UPDATE profiles 
        SET 
          balance = ${newBalance},
          updated_at = NOW()
        WHERE id = ${transaction.user_id}
      `;

      console.log(`[MisticPay Webhook] Credited R$ ${netAmount.toFixed(2)} to user ${transaction.user_id}. New balance: R$ ${newBalance.toFixed(2)}`);

      // Registrar audit log
      await sql`
        INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, new_value, created_at)
        VALUES (
          ${crypto.randomUUID()},
          ${transaction.user_id},
          'PAYMENT_CONFIRMED',
          'transaction',
          ${transaction.id},
          ${JSON.stringify({ 
            amount: Number(transaction.amount), 
            net_amount: netAmount, 
            new_balance: newBalance,
            payer: payer?.name || 'N/A',
            acquirer: 'misticpay'
          })},
          NOW()
        )
      `;

      // Notificar usuario com valor bruto e liquido
      const grossAmount = Number(transaction.amount) || 0;
      await notifyPixPaid(transaction.user_id as string, grossAmount, netAmount);

      // Enviar webhook para o cliente se configurado
      const userProfile = await sql`
        SELECT webhook_url, webhook_secret FROM profiles WHERE id = ${transaction.user_id}
      `;

      if (userProfile.length > 0 && userProfile[0].webhook_url) {
        try {
          const webhookPayload = {
            event: "payment.completed",
            transaction_id: transaction.id,
            amount: Number(transaction.amount),
            net_amount: netAmount,
            status: "completed",
            paid_at: new Date().toISOString(),
            payer: payer || null,
          };

          const response = await fetch(userProfile[0].webhook_url, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              ...(userProfile[0].webhook_secret && { "X-Webhook-Secret": userProfile[0].webhook_secret })
            },
            body: JSON.stringify(webhookPayload),
          });

          // Registrar log do webhook
          await sql`
            INSERT INTO webhook_logs (id, user_id, transaction_id, url, payload, response_status, success, created_at)
            VALUES (
              ${crypto.randomUUID()},
              ${transaction.user_id},
              ${transaction.id},
              ${userProfile[0].webhook_url},
              ${JSON.stringify(webhookPayload)},
              ${response.status},
              ${response.ok},
              NOW()
            )
          `;
        } catch (webhookError) {
          console.error(`[MisticPay Webhook] Error sending client webhook:`, webhookError);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[MisticPay Webhook] Error:", error);
    return NextResponse.json(
      { error: "Erro ao processar webhook" },
      { status: 500 }
    );
  }
}

// Também aceitar GET para verificação de saúde
export async function GET() {
  return NextResponse.json({ status: "ok", service: "misticpay-webhook" });
}
