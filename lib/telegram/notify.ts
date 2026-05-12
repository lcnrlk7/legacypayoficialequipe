import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

// Constantes de links
const SITE_URL = "https://www.legacypay.site";
const DISCORD_LINK = "https://discord.gg/ea32hgRSeM";
const WHATSAPP_LINK = "https://wa.me/5534999353187";

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
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 <b>DEPOSITO CONFIRMADO</b> 💰
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 <b>Usuario:</b> ${maskedEmail}

💵 <b>Valor:</b> R$ ${amount.toFixed(2)}
📊 <b>Taxa:</b> R$ ${fee.toFixed(2)}
✅ <b>Creditado:</b> R$ ${netAmount.toFixed(2)}

🕐 <b>Data:</b> ${now}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ <b>LegacyPay</b> - Pagamentos Rapidos
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
  
  let statusText = "";
  let emoji = "";
  
  if (status === "completed") {
    statusText = "SAQUE APROVADO";
    emoji = "💸";
  } else if (status === "pending") {
    statusText = "SAQUE EM PROCESSAMENTO";
    emoji = "⏳";
  } else {
    statusText = "SAQUE RECUSADO";
    emoji = "❌";
  }
  
  const message = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${emoji} <b>${statusText}</b> ${emoji}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 <b>Usuario:</b> ${maskedEmail}

💵 <b>Valor:</b> R$ ${amount.toFixed(2)}
📊 <b>Taxa:</b> R$ ${fee.toFixed(2)}
✅ <b>Liquido:</b> R$ ${netAmount.toFixed(2)}

🕐 <b>Data:</b> ${now}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ <b>LegacyPay</b> - Pagamentos Rapidos
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
  const now = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  
  let message = "";
  
  if (type === "deposit") {
    if (status === "completed") {
      message = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 <b>DEPOSITO CONFIRMADO!</b> 💰
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Seu deposito foi creditado!

💵 <b>Valor:</b> R$ ${amount.toFixed(2)}
🕐 <b>Data:</b> ${now}

📱 Acesse seu painel:
${SITE_URL}/dashboard

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
    } else if (status === "pending") {
      message = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏳ <b>DEPOSITO PENDENTE</b> ⏳
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⏰ Aguardando confirmacao do pagamento.

💵 <b>Valor:</b> R$ ${amount.toFixed(2)}

Voce sera notificado assim que for confirmado.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
    }
  } else {
    if (status === "completed") {
      message = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💸 <b>SAQUE ENVIADO!</b> 💸
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ O PIX foi enviado para sua conta!

💵 <b>Valor:</b> R$ ${amount.toFixed(2)}
🕐 <b>Data:</b> ${now}

Confira sua conta bancaria.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
    } else if (status === "pending") {
      message = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏳ <b>SAQUE EM PROCESSAMENTO</b> ⏳
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⏰ Seu saque esta sendo processado.

💵 <b>Valor:</b> R$ ${amount.toFixed(2)}

Voce sera notificado quando for enviado.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
    } else if (status === "rejected") {
      message = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ <b>SAQUE RECUSADO</b> ❌
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ Seu saque foi recusado.

💵 <b>Valor:</b> R$ ${amount.toFixed(2)}

O valor foi devolvido ao seu saldo.

📞 <b>Suporte:</b>
💬 Discord: ${DISCORD_LINK}
📱 WhatsApp: (34) 99935-3187

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
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

// Notificar novo usuario vinculado
export async function notifyNewUserLinked(email: string, telegramUsername: string | null) {
  const settings = await getSettings();
  if (!settings?.bot_enabled || !settings?.sales_channel_id) {
    return;
  }
  
  const emailParts = email.split("@");
  const maskedEmail = emailParts[0].substring(0, 3) + "***@" + emailParts[1];
  const now = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  
  const message = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🆕 <b>NOVO USUARIO TELEGRAM</b> 🆕
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 <b>Email:</b> ${maskedEmail}
📱 <b>Telegram:</b> ${telegramUsername ? "@" + telegramUsername : "Privado"}

🕐 <b>Data:</b> ${now}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  
  await sendToChannel(settings.sales_channel_id, message);
}
