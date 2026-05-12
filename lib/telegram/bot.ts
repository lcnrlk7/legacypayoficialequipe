import { neon } from "@neondatabase/serverless";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// Tipos
interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
}

interface TelegramMessage {
  message_id: number;
  from: TelegramUser;
  chat: {
    id: number;
    type: string;
    first_name?: string;
    username?: string;
  };
  date: number;
  text?: string;
}

interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  data?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

// Funcoes de envio
export async function sendMessage(
  chatId: number | string,
  text: string,
  options?: {
    parse_mode?: "HTML" | "Markdown" | "MarkdownV2";
    reply_markup?: object;
  }
) {
  const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: options?.parse_mode || "HTML",
      reply_markup: options?.reply_markup,
    }),
  });
  return response.json();
}

export async function sendPhoto(
  chatId: number | string,
  photo: string,
  caption?: string,
  options?: {
    reply_markup?: object;
  }
) {
  const response = await fetch(`${TELEGRAM_API}/sendPhoto`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      photo,
      caption,
      parse_mode: "HTML",
      reply_markup: options?.reply_markup,
    }),
  });
  return response.json();
}

export async function answerCallbackQuery(
  callbackQueryId: string,
  text?: string
) {
  const response = await fetch(`${TELEGRAM_API}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      text,
    }),
  });
  return response.json();
}

export async function editMessageText(
  chatId: number | string,
  messageId: number,
  text: string,
  options?: {
    parse_mode?: "HTML" | "Markdown" | "MarkdownV2";
    reply_markup?: object;
  }
) {
  const response = await fetch(`${TELEGRAM_API}/editMessageText`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: options?.parse_mode || "HTML",
      reply_markup: options?.reply_markup,
    }),
  });
  return response.json();
}

// Configurar webhook
export async function setWebhook(url: string) {
  const response = await fetch(`${TELEGRAM_API}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  return response.json();
}

// Funcoes de notificacao para canais
export async function notifySalesChannel(data: {
  type: "deposit" | "withdrawal";
  amount: number;
  userEmail: string;
  status: string;
}) {
  const sql = neon(process.env.DATABASE_URL!);
  
  const settings = await sql`
    SELECT sales_channel_id FROM telegram_settings LIMIT 1
  `;
  
  if (!settings[0]?.sales_channel_id) return;
  
  const channelId = settings[0].sales_channel_id;
  const maskedEmail = data.userEmail.replace(/(.{2})(.*)(@.*)/, "$1***$3");
  const emoji = data.type === "deposit" ? "💰" : "💸";
  const typeText = data.type === "deposit" ? "DEPOSITO" : "SAQUE";
  const now = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  
  const message = `
${emoji} <b>${typeText} CONFIRMADO</b>

<b>Valor:</b> R$ ${data.amount.toFixed(2)}
<b>Usuario:</b> ${maskedEmail}
<b>Status:</b> ${data.status}
<b>Data:</b> ${now}
`;

  await sendMessage(channelId, message);
}

export async function sendAnnouncement(message: string) {
  const sql = neon(process.env.DATABASE_URL!);
  
  const settings = await sql`
    SELECT announcements_channel_id FROM telegram_settings LIMIT 1
  `;
  
  if (!settings[0]?.announcements_channel_id) return;
  
  const channelId = settings[0].announcements_channel_id;
  
  const formattedMessage = `
📢 <b>AVISO LEGACYPAY</b>

${message}

<i>${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</i>
`;

  await sendMessage(channelId, formattedMessage);
}

// Notificar usuario especifico
export async function notifyUser(userId: string, message: string) {
  const sql = neon(process.env.DATABASE_URL!);
  
  const telegramUser = await sql`
    SELECT telegram_id FROM telegram_users 
    WHERE user_id = ${userId} AND is_active = true
  `;
  
  if (telegramUser.length === 0) return;
  
  await sendMessage(telegramUser[0].telegram_id, message);
}

export type { TelegramUpdate, TelegramMessage, TelegramCallbackQuery, TelegramUser };
