import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { sendMessage } from "@/lib/telegram/bot";

const sql = neon(process.env.DATABASE_URL!);

/**
 * Webhook para receber confirmacao de pagamento PIX do Bot Telegram
 * Medusa envia callback quando o PIX e pago
 */

const MEDUSA_STATUS_MAP: Record<string, string> = {
  waiting_payment: "pending",
  pending: "pending",
  processing: "pending",
  approved: "completed",
  paid: "completed",
  refused: "failed",
  cancelled: "failed",
  expired: "expired",
};

// Canal de vendas para notificacoes
const SALES_CHANNEL_ID = "@legacypaybot";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    console.log("[Bot Webhook] Payload recebido:", rawBody);

    const payload = JSON.parse(rawBody);
    
    // Extrair dados do payload Medusa
    const transactionId = payload.id || payload.transaction_id;
    const status = payload.status;
    const paidAmount = payload.paidAmount || payload.amount;
    
    if (!transactionId) {
      console.log("[Bot Webhook] Sem ID de transacao");
      return NextResponse.json({ success: true, message: "Sem ID" });
    }

    // Mapear status
    const internalStatus = MEDUSA_STATUS_MAP[status?.toLowerCase()] || MEDUSA_STATUS_MAP[status] || status;
    console.log(`[Bot Webhook] ID: ${transactionId}, Status: ${status} -> ${internalStatus}`);

    // Buscar transacao do bot pelo external_id
    const transactions = await sql`
      SELECT bt.*, bu.telegram_id, bu.first_name, bu.balance as user_balance
      FROM bot_transactions bt
      JOIN bot_users bu ON bt.bot_user_id = bu.id
      WHERE bt.external_id = ${String(transactionId)}
         OR bt.external_id LIKE ${'%' + String(transactionId) + '%'}
      ORDER BY bt.created_at DESC
      LIMIT 1
    `;

    if (transactions.length === 0) {
      console.log(`[Bot Webhook] Transacao ${transactionId} nao encontrada no bot`);
      return NextResponse.json({ success: true, message: "Transacao nao encontrada" });
    }

    const tx = transactions[0];
    
    // Se ja esta completa, ignorar
    if (tx.status === "completed") {
      console.log(`[Bot Webhook] Transacao ${transactionId} ja foi processada`);
      return NextResponse.json({ success: true, message: "Ja processada" });
    }

    // Atualizar status da transacao
    await sql`
      UPDATE bot_transactions 
      SET status = ${internalStatus}, updated_at = NOW()
      WHERE id = ${tx.id}
    `;

    // Se pagamento confirmado, creditar saldo
    if (internalStatus === "completed") {
      const netAmount = Number(tx.net_amount);
      const newBalance = Number(tx.user_balance) + netAmount;
      
      // Atualizar saldo do usuario do bot
      await sql`
        UPDATE bot_users 
        SET 
          balance = ${newBalance},
          total_deposited = total_deposited + ${Number(tx.amount)},
          updated_at = NOW()
        WHERE id = ${tx.bot_user_id}
      `;

      console.log(`[Bot Webhook] Creditado R$ ${netAmount.toFixed(2)} para usuario ${tx.telegram_id}. Novo saldo: R$ ${newBalance.toFixed(2)}`);

      // Notificar usuario no Telegram
      const telegramId = tx.telegram_id;
      if (telegramId) {
        await sendMessage(telegramId, `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ✅ <b>PAGAMENTO CONFIRMADO!</b> ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   💵 Valor: R$ ${Number(tx.amount).toFixed(2).replace('.', ',')}
   📊 Taxa: R$ ${Number(tx.fee).toFixed(2).replace('.', ',')}
   ✅ Creditado: R$ ${netAmount.toFixed(2).replace('.', ',')}

   💰 Novo saldo: <b>R$ ${newBalance.toFixed(2).replace('.', ',')}</b>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`, {
          reply_markup: {
            inline_keyboard: [
              [{ text: "💰 Ver Saldo", callback_data: "saldo" }],
              [{ text: "📤 Sacar", callback_data: "sacar" }],
              [{ text: "🏠 Menu", callback_data: "menu" }]
            ]
          }
        });
      }

      // Notificar no canal de vendas
      const firstName = tx.first_name || "Usuario";
      const maskedName = firstName.substring(0, 3) + "***";
      
      await sendMessage(SALES_CHANNEL_ID, `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      💰 <b>DEPOSITO CONFIRMADO</b> 💰
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   👤 Usuario: ${maskedName}
   
   💵 Valor: R$ ${Number(tx.amount).toFixed(2).replace('.', ',')}
   📊 Taxa (5%): R$ ${Number(tx.fee).toFixed(2).replace('.', ',')}
   ✅ Creditado: R$ ${netAmount.toFixed(2).replace('.', ',')}
   
   🕐 ${new Date().toLocaleString('pt-BR')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      ⚡ <b>LegacyPay Bot</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

      return NextResponse.json({ 
        success: true, 
        status: "completed",
        credited: netAmount,
        new_balance: newBalance
      });
    }

    // Se falhou ou expirou
    if (internalStatus === "failed" || internalStatus === "expired") {
      const telegramId = tx.telegram_id;
      if (telegramId) {
        await sendMessage(telegramId, `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ❌ <b>PIX ${internalStatus === "expired" ? "EXPIRADO" : "CANCELADO"}</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   O PIX de R$ ${Number(tx.amount).toFixed(2).replace('.', ',')}
   ${internalStatus === "expired" ? "expirou" : "foi cancelado"}.

   Gere um novo deposito se desejar.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`, {
          reply_markup: {
            inline_keyboard: [
              [{ text: "📥 Novo Deposito", callback_data: "depositar" }],
              [{ text: "🏠 Menu", callback_data: "menu" }]
            ]
          }
        });
      }
    }

    return NextResponse.json({ success: true, status: internalStatus });

  } catch (error) {
    console.error("[Bot Webhook] Erro:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// GET para verificar se o webhook esta ativo
export async function GET() {
  return NextResponse.json({ 
    status: "active", 
    service: "telegram-bot-pix-webhook",
    timestamp: new Date().toISOString()
  });
}
