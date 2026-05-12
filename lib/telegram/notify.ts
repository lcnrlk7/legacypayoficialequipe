import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

// Enviar mensagem para um chat/canal
async function sendToChannel(chatId: string, message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return false;
  
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
    });
    
    const data = await res.json();
    return data.ok;
  } catch (error) {
    console.error("[Telegram] Erro ao enviar mensagem:", error);
    return false;
  }
}

// Buscar configuracoes do Telegram
async function getSettings() {
  const result = await sql`SELECT * FROM telegram_settings LIMIT 1`;
  return result[0] || null;
}

// Notificar deposito confirmado no canal de vendas
export async function notifyDeposit(userId: string, amount: number, fee: number) {
  const settings = await getSettings();
  if (!settings?.bot_enabled || !settings?.notify_deposits || !settings?.sales_channel_id) {
    return;
  }
  
  // Buscar dados do usuario (mascara o email)
  const userResult = await sql`SELECT email, name FROM profiles WHERE id = ${userId}`;
  const user = userResult[0];
  
  if (!user) return;
  
  const emailParts = user.email.split("@");
  const maskedEmail = emailParts[0].substring(0, 3) + "***@" + emailParts[1];
  
  const netAmount = amount - fee;
  const now = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  
  const message = `
<b>DEPOSITO CONFIRMADO</b>

<b>Usuario:</b> ${maskedEmail}
<b>Valor:</b> R$ ${amount.toFixed(2)}
<b>Taxa:</b> R$ ${fee.toFixed(2)}
<b>Creditado:</b> R$ ${netAmount.toFixed(2)}
<b>Data:</b> ${now}
`;
  
  await sendToChannel(settings.sales_channel_id, message);
}

// Notificar saque processado no canal de vendas
export async function notifyWithdrawal(userId: string, amount: number, fee: number, status: string) {
  const settings = await getSettings();
  if (!settings?.bot_enabled || !settings?.notify_withdrawals || !settings?.sales_channel_id) {
    return;
  }
  
  // Buscar dados do usuario (mascara o email)
  const userResult = await sql`SELECT email, name FROM profiles WHERE id = ${userId}`;
  const user = userResult[0];
  
  if (!user) return;
  
  const emailParts = user.email.split("@");
  const maskedEmail = emailParts[0].substring(0, 3) + "***@" + emailParts[1];
  
  const netAmount = amount - fee;
  const now = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  
  const statusEmoji = status === "completed" ? "APROVADO" : status === "pending" ? "PROCESSANDO" : "RECUSADO";
  
  const message = `
<b>SAQUE ${statusEmoji}</b>

<b>Usuario:</b> ${maskedEmail}
<b>Valor:</b> R$ ${amount.toFixed(2)}
<b>Taxa:</b> R$ ${fee.toFixed(2)}
<b>Liquido:</b> R$ ${netAmount.toFixed(2)}
<b>Data:</b> ${now}
`;
  
  await sendToChannel(settings.sales_channel_id, message);
}

// Notificar usuario vinculado ao Telegram sobre transacao
export async function notifyUserTransaction(userId: string, type: "deposit" | "withdrawal", amount: number, status: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  
  // Verificar se usuario tem Telegram vinculado
  const telegramUser = await sql`
    SELECT telegram_id FROM telegram_users 
    WHERE user_id = ${userId} AND is_active = true
  `;
  
  if (telegramUser.length === 0) return;
  
  const telegramId = telegramUser[0].telegram_id;
  
  let message = "";
  
  if (type === "deposit") {
    if (status === "completed") {
      message = `<b>Deposito confirmado!</b>\n\nValor: R$ ${amount.toFixed(2)}\n\nSeu saldo foi atualizado.`;
    } else if (status === "pending") {
      message = `<b>Deposito pendente</b>\n\nValor: R$ ${amount.toFixed(2)}\n\nAguardando confirmacao do pagamento.`;
    }
  } else {
    if (status === "completed") {
      message = `<b>Saque processado!</b>\n\nValor: R$ ${amount.toFixed(2)}\n\nO PIX foi enviado para sua conta.`;
    } else if (status === "pending") {
      message = `<b>Saque em processamento</b>\n\nValor: R$ ${amount.toFixed(2)}\n\nVoce sera notificado quando for concluido.`;
    } else if (status === "rejected") {
      message = `<b>Saque recusado</b>\n\nValor: R$ ${amount.toFixed(2)}\n\nEntre em contato com o suporte.`;
    }
  }
  
  if (message) {
    await sendToChannel(telegramId.toString(), message);
  }
}

// Enviar aviso para o canal de anuncios
export async function sendAnnouncement(message: string) {
  const settings = await getSettings();
  if (!settings?.bot_enabled || !settings?.announcements_channel_id) {
    return false;
  }
  
  return await sendToChannel(settings.announcements_channel_id, message);
}
