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
const TELEGRAM_PIX_FEE_PERCENT = 5;
const TELEGRAM_WITHDRAWAL_FEE_FIXED = 7;

// Estado temporario para consultas
const userStates: Map<number, { step: string; data?: Record<string, unknown> }> = new Map();

// ══════════════════════════════════════════════════════════════════════════════
// TECLADOS INLINE (BOTOES)
// ══════════════════════════════════════════════════════════════════════════════

const MENU_PRINCIPAL = {
  inline_keyboard: [
    [
      { text: "💰 Ver Saldo", callback_data: "saldo" },
      { text: "📋 Historico", callback_data: "historico" },
    ],
    [
      { text: "📥 Depositar", callback_data: "depositar" },
      { text: "📤 Sacar", callback_data: "sacar" },
    ],
    [
      { text: "📊 Taxas", callback_data: "taxas" },
      { text: "❓ Ajuda", callback_data: "ajuda" },
    ],
    [
      { text: "🌐 Acessar Painel", url: `${SITE_URL}/dashboard` },
    ],
    [
      { text: "📢 Vendas", url: SALES_CHANNEL },
      { text: "📣 Avisos", url: ANNOUNCEMENTS_CHANNEL },
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
    [{ text: "📥 Fazer Deposito", url: `${SITE_URL}/dashboard/deposit` }],
    [{ text: "🔙 Voltar ao Menu", callback_data: "menu" }],
  ],
};

const MENU_SACAR = {
  inline_keyboard: [
    [{ text: "📤 Fazer Saque", url: `${SITE_URL}/dashboard/withdraw` }],
    [{ text: "🔙 Voltar ao Menu", callback_data: "menu" }],
  ],
};

const MENU_AJUDA = {
  inline_keyboard: [
    [{ text: "🌐 Acessar Site", url: SITE_URL }],
    [
      { text: "💬 Discord", url: DISCORD_LINK },
      { text: "📱 WhatsApp", url: WHATSAPP_LINK },
    ],
    [
      { text: "📢 Vendas", url: SALES_CHANNEL },
      { text: "📣 Avisos", url: ANNOUNCEMENTS_CHANNEL },
    ],
    [{ text: "🔙 Voltar ao Menu", callback_data: "menu" }],
  ],
};

const CANCELAR = {
  inline_keyboard: [
    [{ text: "❌ Cancelar", callback_data: "menu" }],
  ],
};

// ══════════════════════════════════════════════════════════════════════════════
// FORMATACAO
// ══════════════════════════════════════════════════════════════════════════════

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  const masked = user.substring(0, 3) + "***";
  return `${masked}@${domain}`;
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

   Selecione uma opcao:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         📢 <b>NOSSOS CANAIS</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📊 Vendas: @legacypaybot
   📣 Avisos: @legacypayavisos
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
}

function msgPedirEmail(tipo: string): string {
  const titulo = tipo === "saldo" ? "VER SALDO" : "HISTORICO";
  const icone = tipo === "saldo" ? "💰" : "📋";
  
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         ${icone} <b>${titulo}</b> ${icone}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Para consultar, digite o <b>email</b>
   da sua conta LegacyPay:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Exemplo: seuemail@gmail.com

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
}

function msgSaldo(email: string, name: string, balance: number): string {
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         💰 <b>SEU SALDO</b> 💰
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   👤 <b>${name}</b>
   📧 ${maskEmail(email)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   💵 Saldo Disponivel:

   <b>R$ ${formatCurrency(balance)}</b>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   📥 Depositar: /depositar
   📤 Sacar: /sacar

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
}

function msgEmailNaoEncontrado(): string {
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       ❌ <b>EMAIL NAO ENCONTRADO</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Nao encontramos uma conta
   com esse email.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   📝 Ainda nao tem conta?
   Acesse: ${SITE_URL}/register

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
          📊 <b>TAXA</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Taxa de deposito: <b>${TELEGRAM_PIX_FEE_PERCENT}%</b>

   Exemplo:
   Deposito R$ 100 → Recebe R$ 95

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
          📊 <b>TAXA</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Taxa de saque: <b>R$ ${formatCurrency(TELEGRAM_WITHDRAWAL_FEE_FIXED)}</b> fixo

   Exemplo:
   Saque R$ 100 → Recebe R$ 93

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

   R$ 100 → Recebe R$ 95,00
   R$ 500 → Recebe R$ 475,00
   R$ 1.000 → Recebe R$ 950,00

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         💸 <b>SAQUE PIX</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Taxa: <b>R$ ${formatCurrency(TELEGRAM_WITHDRAWAL_FEE_FIXED)}</b> fixo

   R$ 100 → Recebe R$ 93,00
   R$ 500 → Recebe R$ 493,00
   R$ 1.000 → Recebe R$ 993,00

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
}

function msgAjuda(): string {
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         ❓ <b>AJUDA</b> ❓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

         🤖 <b>COMANDOS</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   /start - Menu principal
   /saldo - Ver seu saldo
   /historico - Ver transacoes
   /depositar - Como depositar
   /sacar - Como sacar
   /taxas - Ver taxas
   /ajuda - Esta mensagem

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         📞 <b>SUPORTE 24H</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   💬 Discord: ${DISCORD_LINK}
   📱 WhatsApp: ${WHATSAPP}

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
  const trimmedText = text.trim();
  const command = trimmedText.toLowerCase();
  
  // Verificar se tem estado pendente (aguardando email)
  const state = userStates.get(telegramId);
  
  if (state) {
    // Processar input baseado no estado
    if (state.step === "awaiting_email_saldo" || state.step === "awaiting_email_historico") {
      await handleEmailInput(chatId, telegramId, trimmedText, state.step);
      return;
    }
  }
  
  // Log da acao
  await logTelegramAction(telegramId, null, "MESSAGE", command, { firstName, username });
  
  // Processar comandos
  switch (command) {
    case "/start":
    case "/menu":
      userStates.delete(telegramId);
      await sendMessage(chatId, msgBoasVindas(firstName), { reply_markup: MENU_PRINCIPAL });
      break;
      
    case "/saldo":
      userStates.set(telegramId, { step: "awaiting_email_saldo" });
      await sendMessage(chatId, msgPedirEmail("saldo"), { reply_markup: CANCELAR });
      break;
      
    case "/historico":
    case "/extrato":
      userStates.set(telegramId, { step: "awaiting_email_historico" });
      await sendMessage(chatId, msgPedirEmail("historico"), { reply_markup: CANCELAR });
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
      // Se parece um email, tenta buscar saldo
      if (trimmedText.includes("@") && trimmedText.includes(".")) {
        userStates.set(telegramId, { step: "awaiting_email_saldo" });
        await handleEmailInput(chatId, telegramId, trimmedText, "awaiting_email_saldo");
      } else {
        await sendMessage(chatId, msgBoasVindas(firstName), { reply_markup: MENU_PRINCIPAL });
      }
      break;
  }
}

async function handleEmailInput(chatId: number, telegramId: number, email: string, step: string) {
  const cleanEmail = email.toLowerCase().trim();
  
  // Validar formato do email
  if (!cleanEmail.includes("@") || !cleanEmail.includes(".")) {
    await sendMessage(chatId, `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       ❌ <b>EMAIL INVALIDO</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Digite um email valido.
   Exemplo: seuemail@gmail.com

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`, { reply_markup: CANCELAR });
    return;
  }
  
  // Buscar usuario pelo email
  const users = await sql`
    SELECT id, name, email, balance FROM profiles WHERE email = ${cleanEmail}
  `;
  
  if (users.length === 0) {
    userStates.delete(telegramId);
    await sendMessage(chatId, msgEmailNaoEncontrado(), { reply_markup: VOLTAR_MENU });
    return;
  }
  
  const user = users[0];
  userStates.delete(telegramId);
  
  if (step === "awaiting_email_saldo") {
    await sendMessage(chatId, msgSaldo(user.email, user.name || "Usuario", Number(user.balance)), { reply_markup: VOLTAR_MENU });
    await logTelegramAction(telegramId, user.id, "VIEW_BALANCE", "/saldo", { balance: user.balance });
  } else {
    // Historico de transacoes
    await showHistorico(chatId, telegramId, user);
  }
}

async function showHistorico(chatId: number, telegramId: number, user: Record<string, unknown>) {
  // Buscar ultimas transacoes
  const transactions = await sql`
    SELECT type, amount, fee, net_amount, status, created_at 
    FROM transactions 
    WHERE user_id = ${user.id as string}
    ORDER BY created_at DESC 
    LIMIT 10
  `;
  
  const withdrawals = await sql`
    SELECT amount, fee, net_amount, status, created_at 
    FROM withdrawals 
    WHERE user_id = ${user.id as string}
    ORDER BY created_at DESC 
    LIMIT 10
  `;
  
  let historicoMsg = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         📋 <b>HISTORICO</b> 📋
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   👤 <b>${user.name || "Usuario"}</b>
   📧 ${maskEmail(user.email as string)}
   💰 Saldo: <b>R$ ${formatCurrency(Number(user.balance))}</b>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      📥 <b>ULTIMOS DEPOSITOS</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

  if (transactions.length === 0) {
    historicoMsg += `
   Nenhum deposito encontrado.
`;
  } else {
    for (const tx of transactions.slice(0, 5)) {
      const statusIcon = tx.status === "completed" ? "✅" : tx.status === "pending" ? "⏳" : "❌";
      historicoMsg += `
   ${statusIcon} R$ ${formatCurrency(Number(tx.amount))}
      ${formatDate(tx.created_at)}
`;
    }
  }

  historicoMsg += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      📤 <b>ULTIMOS SAQUES</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

  if (withdrawals.length === 0) {
    historicoMsg += `
   Nenhum saque encontrado.
`;
  } else {
    for (const wd of withdrawals.slice(0, 5)) {
      const statusIcon = wd.status === "completed" ? "✅" : wd.status === "processing" ? "⏳" : wd.status === "pending" ? "🕐" : "❌";
      historicoMsg += `
   ${statusIcon} R$ ${formatCurrency(Number(wd.amount))}
      ${formatDate(wd.created_at)}
`;
    }
  }

  historicoMsg += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   ✅ Confirmado  ⏳ Processando
   🕐 Pendente    ❌ Falhou

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

  await sendMessage(chatId, historicoMsg, { reply_markup: VOLTAR_MENU });
  await logTelegramAction(telegramId, user.id as string, "VIEW_HISTORY", "/historico", {});
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
  
  // Limpar estado se voltar ao menu
  if (data === "menu") {
    userStates.delete(telegramId);
  }
  
  switch (data) {
    case "menu":
      await editMessageText(chatId, messageId, msgBoasVindas(firstName || "Usuario"), { reply_markup: MENU_PRINCIPAL });
      break;
      
    case "saldo":
      userStates.set(telegramId, { step: "awaiting_email_saldo" });
      await editMessageText(chatId, messageId, msgPedirEmail("saldo"), { reply_markup: CANCELAR });
      break;
      
    case "historico":
      userStates.set(telegramId, { step: "awaiting_email_historico" });
      await editMessageText(chatId, messageId, msgPedirEmail("historico"), { reply_markup: CANCELAR });
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
