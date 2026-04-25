import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { notifyTransactionApproved } from "@/lib/push-notifications";

/**
 * Webhook para receber notificações da Medusa Payments
 * Formato do payload conforme documentação:
 * https://api.medusapayments.com
 */

/**
 * MEDUSA STATUS (conforme documentação oficial)
 * - waiting_payment: Pagamento ainda não realizado
 * - pending: Em processamento
 * - approved: Confirmado com sucesso
 * - refused: Pagamento negado
 * - in_protest: Em disputa/contestação
 * - refunded: Valor devolvido ao pagador
 * - paid: Pagamento efetivado
 * - cancelled: Operação encerrada sem sucesso
 * - chargeback: Estorno iniciado pelo cliente ou instituição financeira
 */
const MEDUSA_STATUS_MAP: Record<string, string> = {
  // Status de aguardando/processando -> pending
  waiting_payment: "pending",
  pending: "pending",
  processing: "pending",
  
  // Status de sucesso -> completed
  approved: "completed",
  paid: "completed",
  
  // Status de falha -> failed
  refused: "failed",
  cancelled: "failed", // Cancelamento também é tratado como falha para saques
  
  // Status de disputa/estorno
  in_protest: "disputed",
  refunded: "refunded",
  chargeback: "chargeback",
  
  // Fallbacks para compatibilidade
  completed: "completed",
  failed: "failed",
  expired: "expired",
};

// Payload de VENDA (PIX/Depósito)
interface MedusaTransactionPayload {
  id: number;
  tenantId?: number;
  companyId?: number;
  amount: number;
  paymentMethod?: string;
  status: string;
  paidAt?: string;
  paidAmount?: number;
  refundedAt?: string;
  refundedAmount?: number;
  postbackUrl?: string;
  metadata?: unknown;
  ip?: string;
  externalRef?: string;
  createdAt?: string;
  updatedAt?: string;
  items?: Array<{
    title: string;
    quantity: number;
    tangible: boolean;
  }>;
  customer?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    document?: {
      type: string;
      number: string;
    };
  };
  pix?: {
    qrcode: string;
    end2EndId?: string;
    receiptUrl?: string;
    expirationDate?: string;
  };
}

// Payload de SAQUE (Withdrawal/Cash-out)
interface MedusaWithdrawalPayload {
  id: number;
  status: string;
  message?: string; // "cash-out" indica que é um saque
  amount?: string | number;
  taxa?: string | number;
  pixKey?: string;
  created?: string;
  // Campos alternativos que podem vir
  withdrawal_id?: number;
  transaction_id?: number;
}

// União dos tipos possíveis
type MedusaWebhookPayload = MedusaTransactionPayload | MedusaWithdrawalPayload;

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    console.log("[Medusa Webhook] Raw body recebido:", rawBody);
    
    const payload = JSON.parse(rawBody);

    console.log("[Medusa Webhook] Payload parseado:", JSON.stringify(payload, null, 2));

    // Identificar o ID - pode vir em diferentes campos dependendo se é venda ou saque
    const transactionId = payload.id || payload.withdrawal_id || payload.transaction_id;
    const status = payload.status;
    
    // Detectar se é um callback de SAQUE
    // Formato de saque: { id, status, message: "cash-out", amount, taxa, pixKey, created }
    const isWithdrawalCallback = payload.message === "cash-out" || payload.pixKey !== undefined || payload.taxa !== undefined;

    console.log(`[Medusa Webhook] Tipo: ${isWithdrawalCallback ? 'SAQUE' : 'VENDA'}, ID: ${transactionId}, Status: ${status}`);

    if (!transactionId) {
      console.log("[Medusa Webhook] Payload sem ID:", payload);
      return NextResponse.json(
        { error: "ID da transação não informado", received: payload },
        { status: 400 }
      );
    }

    // Mapear status da Medusa para status interno
    const internalStatus = MEDUSA_STATUS_MAP[status?.toLowerCase()] || MEDUSA_STATUS_MAP[status] || status;

    console.log(`[Medusa Webhook] Status original: ${status}, Status interno: ${internalStatus}`);

    // Se é callback de saque OU buscar pelo ID na tabela de saques
    const withdrawals = await sql`
      SELECT w.id, w.user_id, w.amount, w.fee, w.net_amount, w.status, w.pix_key,
             p.email as profile_email, p.name as profile_name, p.balance as profile_balance
      FROM withdrawals w
      LEFT JOIN profiles p ON w.user_id = p.id
      WHERE w.acquirer_withdrawal_id = ${String(transactionId)}
    `;

    if (withdrawals.length > 0) {
      // É um callback de saque
      const withdrawal = withdrawals[0];
      
      // Se o status já é final, não atualizar
      if (withdrawal.status === "completed" || withdrawal.status === "failed" || withdrawal.status === "rejected") {
        console.log(`[Medusa Webhook] Saque ${transactionId} já está em status final: ${withdrawal.status}`);
        return NextResponse.json({ success: true, message: "Saque já processado" });
      }

      // Mapear status para saque
      let withdrawalStatus = withdrawal.status;
      if (internalStatus === "completed") {
        withdrawalStatus = "completed";
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
        
        console.log(`[Medusa Webhook] Saque ${transactionId} falhou. Devolvido R$ ${refundAmount.toFixed(2)} para usuário ${withdrawal.user_id}`);
        
        // Notificar usuário sobre a falha
        await sql`
          INSERT INTO user_notifications (id, user_id, title, message, type, created_at)
          VALUES (
            ${crypto.randomUUID()},
            ${withdrawal.user_id},
            'Saque Falhou',
            ${`Seu saque de R$ ${refundAmount.toFixed(2)} falhou. O valor foi devolvido ao seu saldo.`},
            'error',
            NOW()
          )
        `;
      }

      // Atualizar status do saque
      await sql`
        UPDATE withdrawals 
        SET status = ${withdrawalStatus}, processed_at = NOW()
        WHERE id = ${withdrawal.id}
      `;

      console.log(`[Medusa Webhook] Saque ${transactionId} atualizado para status: ${withdrawalStatus}`);

      // Se saque completado, notificar usuário
      if (withdrawalStatus === "completed") {
        await sql`
          INSERT INTO user_notifications (id, user_id, title, message, type, created_at)
          VALUES (
            ${crypto.randomUUID()},
            ${withdrawal.user_id},
            'Saque Concluído!',
            ${`Seu saque de R$ ${Number(withdrawal.net_amount).toFixed(2)} foi enviado para a chave PIX ${withdrawal.pix_key}.`},
            'success',
            NOW()
          )
        `;
      }

      return NextResponse.json({ success: true, type: "withdrawal", status: withdrawalStatus });
    }

    // Se não é saque, buscar transação de pagamento
    const transactions = await sql`
      SELECT t.id, t.user_id, t.amount, t.fee, t.net_amount, t.status,
             p.email as profile_email, p.name as profile_name, p.balance as profile_balance
      FROM transactions t
      LEFT JOIN profiles p ON t.user_id = p.id
      WHERE t.external_id = ${String(transactionId)} OR t.acquirer_transaction_id = ${String(transactionId)}
    `;

    if (transactions.length === 0) {
      console.log(`[Medusa Webhook] Transação/Saque ${transactionId} não encontrado no sistema`);
      return NextResponse.json({ success: true, message: "Transação não encontrada" });
    }

    const transaction = transactions[0];

    // Se o status já é final, não atualizar
    if (transaction.status === "completed" || transaction.status === "failed") {
      console.log(`[Medusa Webhook] Transação ${transactionId} já está em status final: ${transaction.status}`);
      return NextResponse.json({ success: true, message: "Transação já processada" });
    }

    // Extrair campos específicos de venda (podem não existir em callbacks de saque)
    const paidAt = payload.paidAt;
    const customer = payload.customer;

    // Atualizar status da transação
    await sql`
      UPDATE transactions 
      SET 
        status = ${internalStatus},
        paid_at = ${paidAt ? new Date(paidAt) : (internalStatus === 'completed' ? new Date() : null)},
        payer_name = ${customer?.name || null},
        payer_document = ${customer?.document?.number || null},
        updated_at = NOW()
      WHERE id = ${transaction.id}
    `;

    console.log(`[Medusa Webhook] Transação ${transactionId} atualizada para status: ${internalStatus}`);

    // Se pagamento confirmado, creditar saldo do usuário
    if (internalStatus === "completed" && transaction.user_id) {
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

      console.log(`[Medusa Webhook] Creditado R$ ${netAmount.toFixed(2)} para usuário ${transaction.user_id}. Novo saldo: R$ ${newBalance.toFixed(2)}`);

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
            payer: customer?.name || 'N/A'
          })},
          NOW()
        )
      `;

      // Criar notificação para o usuário
      await sql`
        INSERT INTO user_notifications (id, user_id, title, message, type, created_at)
        VALUES (
          ${crypto.randomUUID()},
          ${transaction.user_id},
          'Pagamento Recebido!',
          ${`Você recebeu R$ ${netAmount.toFixed(2)} via PIX.`},
          'success',
          NOW()
        )
      `;

      // Enviar push notification
      try {
        await notifyTransactionApproved(transaction.user_id, netAmount, transaction.id);
      } catch (pushError) {
        console.error("[Medusa Webhook] Erro ao enviar push notification:", pushError);
      }

      // Processar comissao de afiliado
      try {
        const referrer = await sql`
          SELECT referred_by FROM profiles WHERE id = ${transaction.user_id} AND referred_by IS NOT NULL
        `;
        
        if (referrer.length > 0 && referrer[0].referred_by) {
          const affiliateId = referrer[0].referred_by;
          const commissionAmount = 0.05; // R$ 0,05 por transacao
          
          // Criar registro de comissao
          await sql`
            INSERT INTO affiliate_commissions (id, affiliate_id, referred_user_id, transaction_id, amount, status, created_at)
            VALUES (
              ${crypto.randomUUID()},
              ${affiliateId},
              ${transaction.user_id},
              ${transaction.id},
              ${commissionAmount},
              'pending',
              NOW()
            )
          `;
          
          console.log(`[Medusa Webhook] Comissao de R$ ${commissionAmount.toFixed(2)} criada para afiliado ${affiliateId}`);
        }
      } catch (affiliateError) {
        console.error("[Medusa Webhook] Erro ao processar comissao de afiliado:", affiliateError);
      }

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
            paid_at: paidAt || new Date().toISOString(),
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
          console.error(`[Medusa Webhook] Erro ao enviar webhook:`, webhookError);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Medusa Webhook] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao processar webhook" },
      { status: 500 }
    );
  }
}

// GET para verificar se o endpoint está funcionando
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "Medusa Payments Webhook",
    timestamp: new Date().toISOString(),
  });
}
