import { neon } from "@neondatabase/serverless";
import { sendMessage, editMessageText, answerCallbackQuery } from "./bot";
import { logTelegramAction } from "./logs";
import { notifyNewUserLinked } from "./notify";

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

// ══════════════════════════════════════════════════════════════════════════════
// TECLADOS INLINE (BOTOES)
// ══════════════════════════════════════════════════════════════════════════════

const MENU_PRINCIPAL = {
  inline_keyboard: [
    [
      { text: "💰 Ver Saldo", callback_data: "saldo" },
      { text: "📥 Depositar", callback_data: "depositar" },
    ],
    [
      { text: "📤 Sacar", callback_data: "sacar" },
      { text: "📋 Extrato", callback_data: "extrato" },
    ],
    [
      { text: "📊 Minhas Taxas", callback_data: "taxas" },
      { text: "🔗 Vincular Conta", callback_data: "vincular" },
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
    [
      { text: "❓ Ajuda / Suporte", callback_data: "ajuda" },
    ],
  ],
};

const VOLTAR_MENU = {
  inline_keyboard: [
    [{ text: "🔙 Voltar ao Menu Principal", callback_data: "menu" }],
  ],
};

const VOLTAR_COM_LINKS = {
  inline_keyboard: [
    [{ text: "🌐 Acessar Painel Web", url: `${SITE_URL}/dashboard` }],
    [
      { text: "💬 Discord", url: DISCORD_LINK },
      { text: "📱 WhatsApp", url: WHATSAPP_LINK },
    ],
    [{ text: "🔙 Voltar ao Menu Principal", callback_data: "menu" }],
  ],
};

const VALORES_DEPOSITO = {
  inline_keyboard: [
    [
      { text: "R$ 20", callback_data: "dep_20" },
      { text: "R$ 50", callback_data: "dep_50" },
      { text: "R$ 100", callback_data: "dep_100" },
    ],
    [
      { text: "R$ 200", callback_data: "dep_200" },
      { text: "R$ 500", callback_data: "dep_500" },
      { text: "R$ 1.000", callback_data: "dep_1000" },
    ],
    [{ text: "🔙 Voltar ao Menu Principal", callback_data: "menu" }],
  ],
};

const VALORES_SAQUE = (balance: number) => ({
  inline_keyboard: [
    [
      { text: "R$ 50", callback_data: "saq_50" },
      { text: "R$ 100", callback_data: "saq_100" },
      { text: "R$ 200", callback_data: "saq_200" },
    ],
    [
      { text: "R$ 500", callback_data: "saq_500" },
      { text: `Tudo (R$ ${formatCurrency(balance)})`, callback_data: "saq_all" },
    ],
    [{ text: "🔙 Voltar ao Menu Principal", callback_data: "menu" }],
  ],
});

// ══════════════════════════════════════════════════════════════════════════════
// ESTADO TEMPORARIO
// ══════════════════════════════════════════════════════════════════════════════

const userStates = new Map<number, { step: string; data: Record<string, unknown> }>();

function setState(id: number, step: string, data: Record<string, unknown> = {}) {
  userStates.set(id, { step, data });
}

function getState(id: number) {
  return userStates.get(id);
}

function clearState(id: number) {
  userStates.delete(id);
}

// ══════════════════════════════════════════════════════════════════════════════
// UTILITARIOS
// ══════════════════════════════════════════════════════════════════════════════

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  return user.substring(0, 3) + "***@" + domain;
}

async function getLinkedUser(telegramId: number) {
  const result = await sql`
    SELECT tu.*, p.email, p.name, p.balance, p.api_key
    FROM telegram_users tu
    JOIN profiles p ON p.id = tu.user_id
    WHERE tu.telegram_id = ${telegramId} AND tu.is_active = true
  `;
  return result[0] || null;
}

// ══════════════════════════════════════════════════════════════════════════════
// MENSAGENS
// ══════════════════════════════════════════════════════════════════════════════

function msgBoasVindas(nome: string): string {
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       ⚡ <b>${BOT_NAME}</b> ⚡
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ola, <b>${nome}</b>! 👋

Seja bem-vindo ao bot oficial do ${BOT_NAME}!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          ✨ <b>VANTAGENS</b> ✨
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   ✅ Depositos instantaneos
   ✅ Saques em minutos
   ✅ Taxas competitivas
   ✅ Suporte 24 horas
   ✅ Sistema 100% seguro

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      📢 <b>SIGA NOSSOS CANAIS</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   📊 Vendas: @legacypaybot
   📣 Avisos: @legacypayusers

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       📱 <b>MENU PRINCIPAL</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Selecione uma opcao abaixo:
`;
}

function msgMenuVinculado(nome: string, email: string, saldo: number): string {
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       ⚡ <b>${BOT_NAME}</b> ⚡
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ola, <b>${nome}</b>! 👋

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          💳 <b>SUA CONTA</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   📧 Email: ${maskEmail(email)}
   💰 Saldo: <b>R$ ${formatCurrency(saldo)}</b>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       📱 <b>MENU PRINCIPAL</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Selecione uma opcao abaixo:
`;
}

function msgContaNaoVinculada(): string {
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    ⚠️ <b>CONTA NAO VINCULADA</b> ⚠️
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Para usar esta funcao, voce precisa vincular sua conta ${BOT_NAME}.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         📝 <b>COMO VINCULAR?</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣ Clique em "Vincular Conta"
2️⃣ Digite seu email cadastrado
3️⃣ Confirme com o codigo enviado

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       🆕 <b>NAO TEM CONTA?</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Crie sua conta agora:
🌐 ${SITE_URL}/register

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
}

function msgSaldo(email: string, saldo: number): string {
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          💰 <b>SEU SALDO</b> 💰
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   📧 Conta: ${maskEmail(email)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      <b>R$ ${formatCurrency(saldo)}</b>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   💡 Deposite agora e comece a usar!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
}

function msgDepositar(): string {
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         📥 <b>DEPOSITAR</b> 📥
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Selecione o valor que deseja depositar:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   💡 PIX gerado instantaneamente
   ⚡ Credito automatico apos pagamento

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
}

function msgSacar(saldo: number): string {
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          📤 <b>SACAR</b> 📤
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   💰 Saldo disponivel: <b>R$ ${formatCurrency(saldo)}</b>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Selecione o valor que deseja sacar:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   ⚡ Saques processados em minutos
   💡 Direto na sua chave PIX

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
}

function msgTaxas(pixFee: number, pixFixed: number, wdFee: number, wdFixed: number): string {
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         📊 <b>SUAS TAXAS</b> 📊
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   📥 <b>DEPOSITO (PIX)</b>
   ├ Taxa: ${pixFee}%
   └ Fixa: R$ ${formatCurrency(pixFixed)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   📤 <b>SAQUE</b>
   ├ Taxa: ${wdFee}%
   └ Fixa: R$ ${formatCurrency(wdFixed)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   💡 Taxas podem variar conforme seu plano

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
}

function msgAjuda(): string {
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         ❓ <b>AJUDA / SUPORTE</b> ❓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   📱 <b>FUNCOES DO BOT</b>

   💰 <b>Ver Saldo</b>
   └ Consulte seu saldo atual

   📥 <b>Depositar</b>
   └ Gere um PIX para deposito

   📤 <b>Sacar</b>
   └ Solicite um saque

   📋 <b>Extrato</b>
   └ Veja suas ultimas transacoes

   📊 <b>Minhas Taxas</b>
   └ Consulte suas taxas

   🔗 <b>Vincular Conta</b>
   └ Conecte sua conta ${BOT_NAME}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       📞 <b>SUPORTE 24 HORAS</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   🌐 Site: ${SITE_URL}
   💬 Discord: ${DISCORD_LINK}
   📱 WhatsApp: ${WHATSAPP}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
}

function msgVincular(): string {
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       🔗 <b>VINCULAR CONTA</b> 🔗
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Para vincular sua conta ${BOT_NAME}, 
digite o <b>email</b> cadastrado:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   💡 Voce recebera um codigo de 
   verificacao no email.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       🆕 <b>NAO TEM CONTA?</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Crie agora: ${SITE_URL}/register

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
}

// ══════════════════════════════════════════════════════════════════════════════
// HANDLER DE MENSAGENS
// ══════════════════════════════════════════════════════════════════════════════

export async function handleMessage(
  chatId: number,
  telegramId: number,
  text: string,
  firstName: string,
  username?: string
) {
  const state = getState(telegramId);
  
  // Se esta em fluxo de vinculacao
  if (state) {
    if (text === "/start" || text === "/menu") {
      clearState(telegramId);
      await showMenu(chatId, telegramId, firstName);
      return;
    }
    await handleStateMessage(chatId, telegramId, text, firstName, state);
    return;
  }
  
  // Comando /start ou qualquer mensagem mostra o menu
  await showMenu(chatId, telegramId, firstName);
  await logTelegramAction(telegramId, null, "MESSAGE", text.substring(0, 50));
}

async function showMenu(chatId: number, telegramId: number, firstName: string) {
  const user = await getLinkedUser(telegramId);
  
  if (user) {
    await sendMessage(chatId, msgMenuVinculado(user.name || firstName, user.email, Number(user.balance)), { reply_markup: MENU_PRINCIPAL });
  } else {
    await sendMessage(chatId, msgBoasVindas(firstName), { reply_markup: MENU_PRINCIPAL });
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// HANDLER DE START (EXPORTADO)
// ══════════════════════════════════════════════════════════════════════════════

export async function handleStart(chatId: number, telegramId: number, firstName: string, username?: string) {
  clearState(telegramId);
  await showMenu(chatId, telegramId, firstName);
  await logTelegramAction(telegramId, null, "START", "/start");
}

// ══════════════════════════════════════════════════════════════════════════════
// HANDLER DE CALLBACKS (BOTOES)
// ══════════════════════════════════════════════════════════════════════════════

export async function handleCallback(
  callbackId: string,
  chatId: number,
  messageId: number,
  telegramId: number,
  data: string,
  firstName: string
) {
  await answerCallbackQuery(callbackId);
  
  const user = await getLinkedUser(telegramId);
  
  switch (data) {
    case "menu":
      clearState(telegramId);
      if (user) {
        await editMessageText(chatId, messageId, msgMenuVinculado(user.name || firstName, user.email, Number(user.balance)), { reply_markup: MENU_PRINCIPAL });
      } else {
        await editMessageText(chatId, messageId, msgBoasVindas(firstName), { reply_markup: MENU_PRINCIPAL });
      }
      break;
      
    case "saldo":
      if (!user) {
        await editMessageText(chatId, messageId, msgContaNaoVinculada(), { reply_markup: VOLTAR_COM_LINKS });
        return;
      }
      await editMessageText(chatId, messageId, msgSaldo(user.email, Number(user.balance)), { reply_markup: VOLTAR_MENU });
      break;
      
    case "depositar":
      if (!user) {
        await editMessageText(chatId, messageId, msgContaNaoVinculada(), { reply_markup: VOLTAR_COM_LINKS });
        return;
      }
      await editMessageText(chatId, messageId, msgDepositar(), { reply_markup: VALORES_DEPOSITO });
      break;
      
    case "sacar":
      if (!user) {
        await editMessageText(chatId, messageId, msgContaNaoVinculada(), { reply_markup: VOLTAR_COM_LINKS });
        return;
      }
      const balance = Number(user.balance);
      if (balance < 10) {
        await editMessageText(chatId, messageId, `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       ⚠️ <b>SALDO INSUFICIENTE</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   💰 Seu saldo: <b>R$ ${formatCurrency(balance)}</b>
   💵 Minimo para saque: R$ 10,00

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   📥 Deposite mais para poder sacar.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`, { reply_markup: VOLTAR_MENU });
        return;
      }
      await editMessageText(chatId, messageId, msgSacar(balance), { reply_markup: VALORES_SAQUE(balance) });
      break;
      
    case "extrato":
      if (!user) {
        await editMessageText(chatId, messageId, msgContaNaoVinculada(), { reply_markup: VOLTAR_COM_LINKS });
        return;
      }
      await showExtrato(chatId, messageId, user);
      break;
      
    case "taxas":
      if (!user) {
        await editMessageText(chatId, messageId, msgContaNaoVinculada(), { reply_markup: VOLTAR_COM_LINKS });
        return;
      }
      await showTaxas(chatId, messageId, user);
      break;
      
    case "ajuda":
      await editMessageText(chatId, messageId, msgAjuda(), { reply_markup: VOLTAR_COM_LINKS });
      break;
      
    case "vincular":
      if (user) {
        await editMessageText(chatId, messageId, `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       ✅ <b>CONTA JA VINCULADA</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   📧 Email: ${maskEmail(user.email)}
   💰 Saldo: <b>R$ ${formatCurrency(Number(user.balance))}</b>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Sua conta ja esta vinculada!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`, { reply_markup: VOLTAR_MENU });
        return;
      }
      setState(telegramId, "awaiting_email");
      await editMessageText(chatId, messageId, msgVincular(), { reply_markup: VOLTAR_MENU });
      break;
      
    default:
      // Depositos
      if (data.startsWith("dep_")) {
        await handleDeposito(chatId, messageId, telegramId, data, user);
      }
      // Saques
      else if (data.startsWith("saq_")) {
        await handleSaque(chatId, messageId, telegramId, data, user);
      }
      break;
  }
  
  await logTelegramAction(telegramId, user?.user_id as string || null, "CALLBACK", data);
}

// ══════════════════════════════════════════════════════════════════════════════
// FUNCOES DE EXTRATO E TAXAS
// ══════════════════════════════════════════════════════════════════════════════

async function showExtrato(chatId: number, messageId: number, user: Record<string, unknown>) {
  const transactions = await sql`
    SELECT type, amount, status, created_at 
    FROM transactions 
    WHERE user_id = ${user.user_id as string}
    ORDER BY created_at DESC 
    LIMIT 10
  `;
  
  const withdrawals = await sql`
    SELECT amount, status, created_at 
    FROM withdrawals 
    WHERE user_id = ${user.user_id as string}
    ORDER BY created_at DESC 
    LIMIT 10
  `;
  
  let msg = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          📋 <b>EXTRATO</b> 📋
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   📧 Conta: ${maskEmail(user.email as string)}
   💰 Saldo: <b>R$ ${formatCurrency(Number(user.balance))}</b>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      📜 <b>ULTIMAS TRANSACOES</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

  interface Item {
    tipo: string;
    amount: number;
    status: string;
    created_at: string;
  }

  const items: Item[] = [
    ...transactions.map((t: Record<string, unknown>) => ({
      tipo: "deposito",
      amount: Number(t.amount),
      status: t.status as string,
      created_at: t.created_at as string,
    })),
    ...withdrawals.map((w: Record<string, unknown>) => ({
      tipo: "saque",
      amount: Number(w.amount),
      status: w.status as string,
      created_at: w.created_at as string,
    })),
  ]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);

  if (items.length === 0) {
    msg += "\n   📭 Nenhuma transacao encontrada.\n";
  } else {
    items.forEach((item) => {
      const emoji = item.tipo === "deposito" ? "📥" : "📤";
      const statusEmoji = item.status === "completed" ? "✅" : item.status === "pending" ? "⏳" : "❌";
      const date = new Date(item.created_at).toLocaleDateString("pt-BR");
      msg += `\n   ${emoji} R$ ${formatCurrency(item.amount)} ${statusEmoji} ${date}`;
    });
    msg += "\n";
  }

  msg += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

  await editMessageText(chatId, messageId, msg, { reply_markup: VOLTAR_MENU });
}

async function showTaxas(chatId: number, messageId: number, user: Record<string, unknown>) {
  const userFees = await sql`
    SELECT pix_percentage_fee, pix_fixed_fee, withdrawal_percentage_fee, withdrawal_fixed_fee
    FROM profiles WHERE id = ${user.user_id as string}
  `;
  
  const systemFees = await sql`SELECT * FROM system_fees LIMIT 1`;
  
  const pixFee = Number(userFees[0]?.pix_percentage_fee ?? systemFees[0]?.pix_percentage_fee ?? 2.5);
  const pixFixed = Number(userFees[0]?.pix_fixed_fee ?? systemFees[0]?.pix_fixed_fee ?? 0);
  const wdFee = Number(userFees[0]?.withdrawal_percentage_fee ?? systemFees[0]?.withdrawal_percentage_fee ?? 2);
  const wdFixed = Number(userFees[0]?.withdrawal_fixed_fee ?? systemFees[0]?.withdrawal_fixed_fee ?? 4);
  
  await editMessageText(chatId, messageId, msgTaxas(pixFee, pixFixed, wdFee, wdFixed), { reply_markup: VOLTAR_MENU });
}

// ══════════════════════════════════════════════════════════════════════════════
// HANDLERS DE DEPOSITO E SAQUE
// ══════════════════════════════════════════════════════════════════════════════

async function handleDeposito(chatId: number, messageId: number, telegramId: number, data: string, user: Record<string, unknown> | null) {
  if (!user) {
    await editMessageText(chatId, messageId, msgContaNaoVinculada(), { reply_markup: VOLTAR_COM_LINKS });
    return;
  }
  
  const amount = parseInt(data.replace("dep_", ""));
  
  // Buscar taxas
  const userFees = await sql`
    SELECT pix_percentage_fee, pix_fixed_fee FROM profiles WHERE id = ${user.user_id as string}
  `;
  const systemFees = await sql`SELECT pix_percentage_fee, pix_fixed_fee FROM system_fees LIMIT 1`;
  
  const percentageFee = Number(userFees[0]?.pix_percentage_fee ?? systemFees[0]?.pix_percentage_fee ?? 2.5);
  const fixedFee = Number(userFees[0]?.pix_fixed_fee ?? systemFees[0]?.pix_fixed_fee ?? 0);
  const fee = amount * (percentageFee / 100) + fixedFee;
  const netAmount = amount - fee;
  
  const msg = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          📥 <b>DEPOSITO</b> 📥
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   💵 Valor: <b>R$ ${formatCurrency(amount)}</b>
   📊 Taxa: R$ ${formatCurrency(fee)} (${percentageFee}%)
   ✅ Voce recebe: <b>R$ ${formatCurrency(netAmount)}</b>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Para gerar o PIX, acesse o painel:

🌐 ${SITE_URL}/dashboard/wallet

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   ⚡ PIX gerado instantaneamente
   ✅ Credito automatico apos pagamento

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  
  await editMessageText(chatId, messageId, msg, { reply_markup: VOLTAR_COM_LINKS });
}

async function handleSaque(chatId: number, messageId: number, telegramId: number, data: string, user: Record<string, unknown> | null) {
  if (!user) {
    await editMessageText(chatId, messageId, msgContaNaoVinculada(), { reply_markup: VOLTAR_COM_LINKS });
    return;
  }
  
  const balance = Number(user.balance);
  let amount = 0;
  
  if (data === "saq_all") {
    amount = balance;
  } else {
    amount = parseInt(data.replace("saq_", ""));
  }
  
  if (amount > balance) {
    await editMessageText(chatId, messageId, `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       ❌ <b>SALDO INSUFICIENTE</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   💰 Seu saldo: <b>R$ ${formatCurrency(balance)}</b>
   💵 Valor solicitado: R$ ${formatCurrency(amount)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   📥 Deposite mais para sacar este valor.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`, { reply_markup: VOLTAR_MENU });
    return;
  }
  
  if (amount <= 0) {
    await editMessageText(chatId, messageId, `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       ❌ <b>VALOR INVALIDO</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Voce precisa ter saldo para sacar.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`, { reply_markup: VOLTAR_MENU });
    return;
  }
  
  // Buscar taxas
  const userFees = await sql`
    SELECT withdrawal_percentage_fee, withdrawal_fixed_fee FROM profiles WHERE id = ${user.user_id as string}
  `;
  const systemFees = await sql`SELECT withdrawal_percentage_fee, withdrawal_fixed_fee FROM system_fees LIMIT 1`;
  
  const percentageFee = Number(userFees[0]?.withdrawal_percentage_fee ?? systemFees[0]?.withdrawal_percentage_fee ?? 2);
  const fixedFee = Number(userFees[0]?.withdrawal_fixed_fee ?? systemFees[0]?.withdrawal_fixed_fee ?? 4);
  const fee = amount * (percentageFee / 100) + fixedFee;
  const netAmount = amount - fee;
  
  const msg = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          📤 <b>SAQUE</b> 📤
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   💵 Valor: <b>R$ ${formatCurrency(amount)}</b>
   📊 Taxa: R$ ${formatCurrency(fee)}
   ✅ Voce recebe: <b>R$ ${formatCurrency(netAmount)}</b>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Para solicitar o saque, acesse o painel:

🌐 ${SITE_URL}/dashboard/wallet

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   ⚡ Saques processados em minutos
   ✅ Direto na sua chave PIX

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  
  await editMessageText(chatId, messageId, msg, { reply_markup: VOLTAR_COM_LINKS });
}

// ══════════════════════════════════════════════════════════════════════════════
// HANDLER DE ESTADOS (VINCULACAO)
// ══════════════════════════════════════════════════════════════════════════════

async function handleStateMessage(
  chatId: number,
  telegramId: number,
  text: string,
  firstName: string,
  state: { step: string; data: Record<string, unknown> }
) {
  switch (state.step) {
    case "awaiting_email":
      await handleEmailInput(chatId, telegramId, text, firstName);
      break;
      
    case "awaiting_code":
      await handleCodeInput(chatId, telegramId, text, firstName, state);
      break;
  }
}

async function handleEmailInput(chatId: number, telegramId: number, email: string, firstName: string) {
  const emailLower = email.toLowerCase().trim();
  
  if (!emailLower.includes("@") || !emailLower.includes(".")) {
    await sendMessage(chatId, `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       ❌ <b>EMAIL INVALIDO</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Por favor, digite um email valido.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`, { reply_markup: VOLTAR_MENU });
    return;
  }
  
  const user = await sql`SELECT id, email, name FROM profiles WHERE LOWER(email) = ${emailLower}`;
  
  if (!user[0]) {
    await sendMessage(chatId, `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    ❌ <b>CONTA NAO ENCONTRADA</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Nao encontramos uma conta com este email.

Verifique se digitou corretamente ou 
crie uma conta:

🌐 ${SITE_URL}/register

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`, { reply_markup: VOLTAR_MENU });
    return;
  }
  
  const existingLink = await sql`SELECT telegram_id FROM telegram_users WHERE user_id = ${user[0].id} AND is_active = true`;
  
  if (existingLink[0] && existingLink[0].telegram_id !== telegramId) {
    await sendMessage(chatId, `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    ⚠️ <b>CONTA JA VINCULADA</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Esta conta ja esta vinculada a outro Telegram.

Se isso e um erro, entre em contato:
💬 Discord: ${DISCORD_LINK}
📱 WhatsApp: ${WHATSAPP}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`, { reply_markup: VOLTAR_MENU });
    return;
  }
  
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  
  await sql`
    INSERT INTO telegram_users (user_id, telegram_id, telegram_username, verification_code, verification_expires_at, is_active)
    VALUES (${user[0].id}, ${telegramId}, ${firstName}, ${code}, ${expiresAt.toISOString()}, false)
    ON CONFLICT (user_id) DO UPDATE SET
      telegram_id = ${telegramId},
      telegram_username = ${firstName},
      verification_code = ${code},
      verification_expires_at = ${expiresAt.toISOString()},
      is_active = false
  `;
  
  setState(telegramId, "awaiting_code", { userId: user[0].id, email: user[0].email });
  
  await sendMessage(chatId, `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       📧 <b>CODIGO ENVIADO</b> 📧
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Enviamos um codigo de verificacao para:

📧 <b>${maskEmail(emailLower)}</b>

Digite o codigo de 6 digitos:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   ⏰ Valido por 10 minutos
   
   💡 Codigo: <code>${code}</code>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`, { reply_markup: VOLTAR_MENU });
}

async function handleCodeInput(
  chatId: number,
  telegramId: number,
  code: string,
  firstName: string,
  state: { step: string; data: Record<string, unknown> }
) {
  const codeTrimmed = code.trim();
  
  const telegramUser = await sql`
    SELECT * FROM telegram_users 
    WHERE user_id = ${state.data.userId as string}
      AND verification_code = ${codeTrimmed}
      AND verification_expires_at > NOW()
  `;
  
  if (!telegramUser[0]) {
    await sendMessage(chatId, `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       ❌ <b>CODIGO INVALIDO</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

O codigo digitado esta incorreto ou expirou.

Tente novamente ou volte ao menu.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`, { reply_markup: VOLTAR_MENU });
    return;
  }
  
  await sql`
    UPDATE telegram_users 
    SET is_active = true, verification_code = NULL, verification_expires_at = NULL, telegram_id = ${telegramId}
    WHERE user_id = ${state.data.userId as string}
  `;
  
  clearState(telegramId);
  
  const linkedUser = await getLinkedUser(telegramId);
  
  await notifyNewUserLinked(state.data.email as string, firstName);
  await logTelegramAction(telegramId, state.data.userId as string, "ACCOUNT_LINKED", "vincular");
  
  await sendMessage(chatId, `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     ✅ <b>CONTA VINCULADA!</b> ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Parabens, <b>${linkedUser?.name || firstName}</b>!

Sua conta foi vinculada com sucesso.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          💳 <b>SUA CONTA</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   📧 Email: ${maskEmail(state.data.email as string)}
   💰 Saldo: <b>R$ ${formatCurrency(Number(linkedUser?.balance || 0))}</b>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      📢 <b>SIGA NOSSOS CANAIS</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   📊 Vendas: @legacypaybot
   📣 Avisos: @legacypayusers

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`, { reply_markup: MENU_PRINCIPAL });
}

// ══════════════════════════════════════════════════════════════════════════════
// EXPORTS ADICIONAIS PARA COMPATIBILIDADE
// ══════════════════════════════════════════════════════════════════════════════

export async function handleSaldo(chatId: number, telegramId: number) {
  const user = await getLinkedUser(telegramId);
  if (!user) {
    await sendMessage(chatId, msgContaNaoVinculada(), { reply_markup: VOLTAR_COM_LINKS });
    return;
  }
  await sendMessage(chatId, msgSaldo(user.email, Number(user.balance)), { reply_markup: VOLTAR_MENU });
}

export async function handleDepositar(chatId: number, telegramId: number) {
  const user = await getLinkedUser(telegramId);
  if (!user) {
    await sendMessage(chatId, msgContaNaoVinculada(), { reply_markup: VOLTAR_COM_LINKS });
    return;
  }
  await sendMessage(chatId, msgDepositar(), { reply_markup: VALORES_DEPOSITO });
}

export async function handleSacar(chatId: number, telegramId: number) {
  const user = await getLinkedUser(telegramId);
  if (!user) {
    await sendMessage(chatId, msgContaNaoVinculada(), { reply_markup: VOLTAR_COM_LINKS });
    return;
  }
  const balance = Number(user.balance);
  await sendMessage(chatId, msgSacar(balance), { reply_markup: VALORES_SAQUE(balance) });
}

export async function handleExtrato(chatId: number, telegramId: number) {
  const user = await getLinkedUser(telegramId);
  if (!user) {
    await sendMessage(chatId, msgContaNaoVinculada(), { reply_markup: VOLTAR_COM_LINKS });
    return;
  }
  // Send message version for command
  const msg = await sendMessage(chatId, "Carregando extrato...");
  await showExtrato(chatId, msg.message_id, user);
}

export async function handleTaxas(chatId: number, telegramId: number) {
  const user = await getLinkedUser(telegramId);
  if (!user) {
    await sendMessage(chatId, msgContaNaoVinculada(), { reply_markup: VOLTAR_COM_LINKS });
    return;
  }
  const msg = await sendMessage(chatId, "Carregando taxas...");
  await showTaxas(chatId, msg.message_id, user);
}

export async function handleAjuda(chatId: number) {
  await sendMessage(chatId, msgAjuda(), { reply_markup: VOLTAR_COM_LINKS });
}

export async function handleDesvincular(chatId: number, telegramId: number) {
  const user = await getLinkedUser(telegramId);
  if (!user) {
    await sendMessage(chatId, "Sua conta nao esta vinculada.", { reply_markup: VOLTAR_MENU });
    return;
  }
  
  await sql`UPDATE telegram_users SET is_active = false WHERE telegram_id = ${telegramId}`;
  await sendMessage(chatId, `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     ✅ <b>CONTA DESVINCULADA</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Sua conta foi desvinculada com sucesso.

Para vincular novamente, use o menu.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`, { reply_markup: MENU_PRINCIPAL });
}
