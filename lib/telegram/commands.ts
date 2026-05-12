import { neon } from "@neondatabase/serverless";
import { sendMessage, editMessageText, answerCallbackQuery } from "./bot";
import { logTelegramAction } from "./logs";

const sql = neon(process.env.DATABASE_URL!);

// ══════════════════════════════════════════════════════════════════════════════
// CONFIGURACOES
// ══════════════════════════════════════════════════════════════════════════════

const BOT_NAME = "LegacyPay";
const SITE_URL = "https://www.legacypay.site";
const DISCORD_LINK = "https://discord.gg/ea32hgRSeM";
const WHATSAPP = "(34) 99935-3187";
const WHATSAPP_LINK = "https://wa.me/5534999353187";
const SALES_CHANNEL = "https://t.me/legacypaybot";
const ANNOUNCEMENTS_CHANNEL = "https://t.me/legacypayavisos";

// Taxas do Bot Telegram (Medusa Black)
const TELEGRAM_PIX_FEE_PERCENT = 5; // 5% deposito
const TELEGRAM_WITHDRAWAL_FEE_FIXED = 7; // R$7 fixo saque

// ══════════════════════════════════════════════════════════════════════════════
// TECLADOS INLINE (BOTOES)
// ══════════════════════════════════════════════════════════════════════════════

const MENU_PRINCIPAL = {
  inline_keyboard: [
    [
      { text: "💰 Depositar", callback_data: "depositar" },
      { text: "💸 Sacar", callback_data: "sacar" },
    ],
    [
      { text: "📊 Taxas", callback_data: "taxas" },
      { text: "❓ Ajuda", callback_data: "ajuda" },
    ],
    [
      { text: "🌐 Acessar Painel Web", url: `${SITE_URL}/dashboard` },
    ],
    [
      { text: "📢 Canal Vendas", url: SALES_CHANNEL },
      { text: "📣 Canal Avisos", url: ANNOUNCEMENTS_CHANNEL },
    ],
    [
      { text: "💬 Discord", url: DISCORD_LINK },
      { text: "📱 WhatsApp", url: WHATSAPP_LINK },
    ],
  ],
};

const VOLTAR_MENU = {
  inline_keyboard: [
    [{ text: "🔙 Voltar ao Menu", callback_data: "menu" }],
  ],
};

const MENU_DEPOSITAR = {
  inline_keyboard: [
    [
      { text: "📥 Fazer Deposito", url: `${SITE_URL}/dashboard/deposit` },
    ],
    [
      { text: "🔙 Voltar ao Menu", callback_data: "menu" },
    ],
  ],
};

const MENU_SACAR = {
  inline_keyboard: [
    [
      { text: "📤 Fazer Saque", url: `${SITE_URL}/dashboard/withdraw` },
    ],
    [
      { text: "🔙 Voltar ao Menu", callback_data: "menu" },
    ],
  ],
};

const MENU_AJUDA = {
  inline_keyboard: [
    [
      { text: "🌐 Acessar Site", url: SITE_URL },
    ],
    [
      { text: "💬 Discord", url: DISCORD_LINK },
      { text: "📱 WhatsApp", url: WHATSAPP_LINK },
    ],
    [
      { text: "📢 Canal Vendas", url: SALES_CHANNEL },
      { text: "📣 Canal Avisos", url: ANNOUNCEMENTS_CHANNEL },
    ],
    [
      { text: "🔙 Voltar ao Menu", callback_data: "menu" },
    ],
  ],
};

// ══════════════════════════════════════════════════════════════════════════════
// FORMATACAO
// ══════════════════════════════════════════════════════════════════════════════

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ══════════════════════════════════════════════════════════════════════════════
// MENSAGENS
// ══════════════════════════════════════════════════════════════════════════════

function msgBoasVindas(firstName: string): string {
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        ⚡ <b>${BOT_NAME}</b> ⚡
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Ola, <b>${firstName}</b>! 👋

   Seja bem-vindo ao bot oficial
   do LegacyPay!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         📱 <b>MENU PRINCIPAL</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Selecione uma opcao abaixo:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         📢 <b>NOSSOS CANAIS</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📊 Vendas: @legacypaybot
   📣 Avisos: @legacypayavisos
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
}

function msgDepositar(): string {
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         📥 <b>DEPOSITAR</b> 📥
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Para fazer um deposito, acesse
   nosso painel web:

   🌐 ${SITE_URL}/dashboard/deposit

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          📊 <b>TAXAS</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Taxa de deposito: <b>${TELEGRAM_PIX_FEE_PERCENT}%</b>

   Exemplo:
   Deposito de R$ 100,00
   Taxa: R$ ${formatCurrency(100 * TELEGRAM_PIX_FEE_PERCENT / 100)}
   Voce recebe: R$ ${formatCurrency(100 - (100 * TELEGRAM_PIX_FEE_PERCENT / 100))}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   ⚡ PIX instantaneo
   ✅ Credito automatico

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
}

function msgSacar(): string {
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         📤 <b>SACAR</b> 📤
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Para fazer um saque, acesse
   nosso painel web:

   🌐 ${SITE_URL}/dashboard/withdraw

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          📊 <b>TAXAS</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Taxa de saque: <b>R$ ${formatCurrency(TELEGRAM_WITHDRAWAL_FEE_FIXED)}</b> fixo

   Exemplo:
   Saque de R$ 100,00
   Taxa: R$ ${formatCurrency(TELEGRAM_WITHDRAWAL_FEE_FIXED)}
   Voce recebe: R$ ${formatCurrency(100 - TELEGRAM_WITHDRAWAL_FEE_FIXED)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   ⚡ Processamento rapido
   ✅ Direto na sua chave PIX

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
}

function msgTaxas(): string {
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         📊 <b>TAXAS</b> 📊
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

         💰 <b>DEPOSITO PIX</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Taxa: <b>${TELEGRAM_PIX_FEE_PERCENT}%</b> do valor

   Exemplos:
   R$ 100 → Taxa R$ 5,00 → Recebe R$ 95,00
   R$ 500 → Taxa R$ 25,00 → Recebe R$ 475,00
   R$ 1.000 → Taxa R$ 50,00 → Recebe R$ 950,00

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         💸 <b>SAQUE PIX</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Taxa: <b>R$ ${formatCurrency(TELEGRAM_WITHDRAWAL_FEE_FIXED)}</b> fixo

   Exemplos:
   R$ 100 → Taxa R$ 7,00 → Recebe R$ 93,00
   R$ 500 → Taxa R$ 7,00 → Recebe R$ 493,00
   R$ 1.000 → Taxa R$ 7,00 → Recebe R$ 993,00

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Acesse o painel para operar:
   🌐 ${SITE_URL}/dashboard

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
}

function msgAjuda(): string {
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         ❓ <b>AJUDA</b> ❓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

         🌐 <b>PAINEL WEB</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Para depositar, sacar e ver seu
   saldo, acesse nosso painel:

   🌐 ${SITE_URL}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         📞 <b>SUPORTE</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   💬 Discord: ${DISCORD_LINK}
   📱 WhatsApp: ${WHATSAPP}

   Atendimento 24 horas!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         📢 <b>CANAIS</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   📊 Vendas: @legacypaybot
   📣 Avisos: @legacypayavisos

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
}

// ══════════════════════════════════════════════════════════════════════════════
// HANDLERS
// ══════════════════════════════════════════════════════════════════════════════

export async function handleMessage(
  chatId: number,
  telegramId: number,
  text: string,
  firstName: string,
  username?: string
) {
  const command = text.trim().toLowerCase();
  
  // Log da acao
  await logTelegramAction(telegramId, null, "MESSAGE", command, { firstName, username });
  
  switch (command) {
    case "/start":
    case "/menu":
      await sendMessage(chatId, msgBoasVindas(firstName), { reply_markup: MENU_PRINCIPAL });
      break;
      
    case "/depositar":
    case "/deposito":
    case "/pix":
      await sendMessage(chatId, msgDepositar(), { reply_markup: MENU_DEPOSITAR });
      break;
      
    case "/sacar":
    case "/saque":
      await sendMessage(chatId, msgSacar(), { reply_markup: MENU_SACAR });
      break;
      
    case "/taxas":
    case "/taxa":
      await sendMessage(chatId, msgTaxas(), { reply_markup: VOLTAR_MENU });
      break;
      
    case "/ajuda":
    case "/help":
    case "/suporte":
      await sendMessage(chatId, msgAjuda(), { reply_markup: MENU_AJUDA });
      break;
      
    default:
      // Para qualquer outra mensagem, mostra o menu principal
      await sendMessage(chatId, msgBoasVindas(firstName), { reply_markup: MENU_PRINCIPAL });
      break;
  }
}

export async function handleCallback(
  callbackId: string,
  chatId: number,
  messageId: number,
  telegramId: number,
  data: string,
  firstName?: string
) {
  await answerCallbackQuery(callbackId);
  
  // Log da acao
  await logTelegramAction(telegramId, null, "CALLBACK", data, { firstName });
  
  switch (data) {
    case "menu":
      await editMessageText(chatId, messageId, msgBoasVindas(firstName || "Usuario"), { reply_markup: MENU_PRINCIPAL });
      break;
      
    case "depositar":
      await editMessageText(chatId, messageId, msgDepositar(), { reply_markup: MENU_DEPOSITAR });
      break;
      
    case "sacar":
      await editMessageText(chatId, messageId, msgSacar(), { reply_markup: MENU_SACAR });
      break;
      
    case "taxas":
      await editMessageText(chatId, messageId, msgTaxas(), { reply_markup: VOLTAR_MENU });
      break;
      
    case "ajuda":
      await editMessageText(chatId, messageId, msgAjuda(), { reply_markup: MENU_AJUDA });
      break;
      
    default:
      await editMessageText(chatId, messageId, msgBoasVindas(firstName || "Usuario"), { reply_markup: MENU_PRINCIPAL });
      break;
  }
}
