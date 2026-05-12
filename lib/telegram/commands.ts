import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import { sendMessage, sendPhoto, editMessageText, answerCallbackQuery } from "./bot";
import { getSystemFeesForUser } from "@/lib/acquirers";
import { getMedusaPayments } from "@/lib/acquirers/medusa";
import { logTelegramAction } from "./logs";

const sql = neon(process.env.DATABASE_URL!);

// ═══════════════════════════════════════════════════════════════
// CONFIGURACOES
// ═══════════════════════════════════════════════════════════════

const BOT_NAME = "LegacyPay";
const SITE_URL = "https://legacypay.com.br";
const DISCORD_LINK = "https://discord.gg/ea32hgRSeM";
const WHATSAPP_LINK = "https://wa.me/5534999353187";
const SALES_CHANNEL = "https://t.me/legacypaybot";
const ANNOUNCEMENTS_CHANNEL = "https://t.me/legacypayusers";

// ═══════════════════════════════════════════════════════════════
// ESTADO TEMPORARIO
// ═══════════════════════════════════════════════════════════════

const userStates: Map<number, {
  action: string;
  data: Record<string, unknown>;
  expiresAt: number;
}> = new Map();

function setState(telegramId: number, action: string, data: Record<string, unknown> = {}) {
  userStates.set(telegramId, {
    action,
    data,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });
}

function getState(telegramId: number) {
  const state = userStates.get(telegramId);
  if (!state || state.expiresAt < Date.now()) {
    userStates.delete(telegramId);
    return null;
  }
  return state;
}

function clearState(telegramId: number) {
  userStates.delete(telegramId);
}

// ═══════════════════════════════════════════════════════════════
// FUNCOES AUXILIARES
// ═══════════════════════════════════════════════════════════════

async function getLinkedUser(telegramId: number) {
  const result = await sql`
    SELECT tu.*, p.email, p.name, p.balance, p.is_active as account_active, p.cpf_cnpj
    FROM telegram_users tu
    JOIN profiles p ON tu.user_id = p.id
    WHERE tu.telegram_id = ${telegramId} AND tu.is_active = true
  `;
  return result[0] || null;
}

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  return user.substring(0, 2) + "***@" + domain;
}

// ═══════════════════════════════════════════════════════════════
// TECLADOS INLINE (BOTOES)
// ═══════════════════════════════════════════════════════════════

const MAIN_MENU_KEYBOARD = {
  inline_keyboard: [
    [
      { text: "💰 Saldo", callback_data: "menu_saldo" },
      { text: "📥 Depositar", callback_data: "menu_depositar" },
    ],
    [
      { text: "📤 Sacar", callback_data: "menu_sacar" },
      { text: "📋 Extrato", callback_data: "menu_extrato" },
    ],
    [
      { text: "📊 Taxas", callback_data: "menu_taxas" },
      { text: "❓ Ajuda", callback_data: "menu_ajuda" },
    ],
    [
      { text: "🌐 Painel Web", url: `${SITE_URL}/dashboard` },
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

const DEPOSIT_VALUES_KEYBOARD = {
  inline_keyboard: [
    [
      { text: "💵 R$ 20", callback_data: "deposit_20" },
      { text: "💵 R$ 50", callback_data: "deposit_50" },
      { text: "💵 R$ 100", callback_data: "deposit_100" },
    ],
    [
      { text: "💵 R$ 200", callback_data: "deposit_200" },
      { text: "💵 R$ 500", callback_data: "deposit_500" },
      { text: "💵 R$ 1000", callback_data: "deposit_1000" },
    ],
    [
      { text: "✏️ Outro Valor", callback_data: "deposit_custom" },
    ],
    [
      { text: "🔙 Voltar ao Menu", callback_data: "back_menu" },
      { text: "❌ Cancelar", callback_data: "cancel" },
    ],
  ],
};

const WITHDRAW_VALUES_KEYBOARD = (balance: number) => ({
  inline_keyboard: [
    [
      { text: "💸 R$ 50", callback_data: "withdraw_50" },
      { text: "💸 R$ 100", callback_data: "withdraw_100" },
      { text: "💸 R$ 200", callback_data: "withdraw_200" },
    ],
    [
      { text: "💸 R$ 500", callback_data: "withdraw_500" },
      { text: `💸 Tudo (R$ ${formatCurrency(balance)})`, callback_data: "withdraw_all" },
    ],
    [
      { text: "✏️ Outro Valor", callback_data: "withdraw_custom" },
    ],
    [
      { text: "🔙 Voltar ao Menu", callback_data: "back_menu" },
      { text: "❌ Cancelar", callback_data: "cancel" },
    ],
  ],
});

const BACK_MENU_KEYBOARD = {
  inline_keyboard: [
    [{ text: "🔙 Voltar ao Menu", callback_data: "back_menu" }],
  ],
};

// ═══════════════════════════════════════════════════════════════
// COMANDO /start - MENU PRINCIPAL
// ═══════════════════════════════════════════════════════════════

export async function handleStart(chatId: number, telegramId: number, firstName: string, username?: string) {
  const linkedUser = await getLinkedUser(telegramId);
  
  if (linkedUser) {
    const balance = Number(linkedUser.balance);
    const name = linkedUser.name || firstName;
    
    await sendMessage(chatId, `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ <b>${BOT_NAME}</b> ⚡
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👋 Ola, <b>${name}</b>!

💳 <b>Sua Conta:</b>
├ 📧 ${maskEmail(linkedUser.email)}
└ 💰 Saldo: <b>R$ ${formatCurrency(balance)}</b>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 <b>MENU PRINCIPAL</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Selecione uma opcao abaixo:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📢 <b>SIGA NOSSOS CANAIS:</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Vendas: ${SALES_CHANNEL}
📣 Avisos: ${ANNOUNCEMENTS_CHANNEL}
    `, { reply_markup: MAIN_MENU_KEYBOARD });
    return;
  }
  
  setState(telegramId, "awaiting_email");
  
  await sendMessage(chatId, `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ <b>BEM-VINDO AO ${BOT_NAME}</b> ⚡
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 A plataforma de pagamentos mais rapida!

✅ Depositos instantaneos
✅ Saques em minutos  
✅ Taxas competitivas
✅ Suporte 24 horas

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📢 <b>SIGA NOSSOS CANAIS:</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Vendas: ${SALES_CHANNEL}
📣 Avisos: ${ANNOUNCEMENTS_CHANNEL}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 Para comecar, vamos vincular sua conta.

<b>Digite o email da sua conta ${BOT_NAME}:</b>
  `, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "📝 Criar Conta", url: `${SITE_URL}/register` }],
        [
          { text: "📢 Canal Vendas", url: SALES_CHANNEL },
          { text: "📣 Canal Avisos", url: ANNOUNCEMENTS_CHANNEL },
        ],
        [
          { text: "💬 Discord", url: DISCORD_LINK },
          { text: "📱 WhatsApp", url: WHATSAPP_LINK },
        ],
      ],
    },
  });
}

// ═══════════════════════════════════════════════════════════════
// COMANDO /saldo
// ═══════════════════════════════════════════════════════════════

export async function handleSaldo(chatId: number, telegramId: number) {
  const user = await getLinkedUser(telegramId);
  
  if (!user) {
    await sendMessage(chatId, "⚠️ Voce precisa vincular sua conta primeiro.\n\nUse /start para comecar.");
    return;
  }
  
  const balance = Number(user.balance);
  const fees = await getSystemFeesForUser(user.user_id as string);
  
  await sendMessage(chatId, `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 <b>SEU SALDO</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────────────┐
│                         │
│   💵 <b>R$ ${formatCurrency(balance)}</b>
│                         │
└─────────────────────────┘

📊 <b>Suas Taxas:</b>
├ 📥 Deposito: ${fees.pixPercentageFee}%
└ 📤 Saque: R$ ${formatCurrency(fees.withdrawalFee)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `, { reply_markup: MAIN_MENU_KEYBOARD });
}

// ═══════════════════════════════════════════════════════════════
// COMANDO /depositar - GERAR PIX VIA MEDUSA BLACK
// ═══════════════════════════════════════════════════════════════

export async function handleDepositar(chatId: number, telegramId: number, amount?: number) {
  const user = await getLinkedUser(telegramId);
  
  if (!user) {
    await sendMessage(chatId, "⚠️ Voce precisa vincular sua conta primeiro.\n\nUse /start para comecar.");
    return;
  }
  
  if (!amount || amount < 10) {
    setState(telegramId, "awaiting_deposit_amount");
    
    const fees = await getSystemFeesForUser(user.user_id as string);
    
    await sendMessage(chatId, `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📥 <b>DEPOSITAR VIA PIX</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚡ PIX Instantaneo - Cai na hora!

📊 <b>Taxa:</b> ${fees.pixPercentageFee}%
💵 <b>Minimo:</b> R$ 10,00

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Selecione um valor ou digite outro:
    `, { reply_markup: DEPOSIT_VALUES_KEYBOARD });
    return;
  }
  
  await generatePixDeposit(chatId, telegramId, user, amount);
}

async function generatePixDeposit(chatId: number, telegramId: number, user: Record<string, unknown>, amount: number) {
  clearState(telegramId);
  
  const loadingMsg = await sendMessage(chatId, `
⏳ <b>Gerando PIX...</b>

Aguarde um momento...
  `);
  
  try {
    const fees = await getSystemFeesForUser(user.user_id as string);
    const fee = amount * (fees.pixPercentageFee / 100) + fees.pixFixedFee;
    const netAmount = amount - fee;
    
    // Buscar adquirente Medusa Black
    const acquirer = await sql`
      SELECT * FROM acquirers 
      WHERE name ILIKE '%medusa%' AND route_type = 'black' AND is_active = true
      LIMIT 1
    `;
    
    if (acquirer.length === 0) {
      await editMessageText(chatId, loadingMsg.message_id, `
⚠️ <b>Servico temporariamente indisponivel</b>

Por favor, tente novamente mais tarde ou acesse o painel web.

🌐 ${SITE_URL}/dashboard/wallet
      `);
      return;
    }
    
    const medusa = getMedusaPayments(
      acquirer[0].api_key as string,
      acquirer[0].api_secret as string
    );
    
    // Gerar PIX
    const amountCents = Math.round(amount * 100);
    const pixResponse = await medusa.createSimplePixPayment(
      amountCents,
      (user.name as string) || "Cliente",
      (user.cpf_cnpj as string) || "00000000000",
      user.email as string,
      `Deposito Telegram - ${user.email}`,
      `${SITE_URL}/api/webhooks/medusa`
    );
    
    const qrCode = pixResponse.pix?.qrcode || pixResponse.transaction?.pix?.qrcode;
    const transactionId = pixResponse.insertId || pixResponse.id;
    
    if (!qrCode) {
      throw new Error("QR Code nao gerado");
    }
    
    // Salvar transacao no banco
    await sql`
      INSERT INTO transactions (
        user_id, type, amount, fee, net_amount, status, 
        external_id, acquirer_id, description, metadata
      ) VALUES (
        ${user.user_id as string}, 'pix_in', ${amount}, ${fee}, ${netAmount}, 'pending',
        ${String(transactionId)}, ${acquirer[0].id}, 'Deposito via Telegram',
        ${JSON.stringify({ source: 'telegram', telegram_id: telegramId })}
      )
    `;
    
    await editMessageText(chatId, loadingMsg.message_id, `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ <b>PIX GERADO COM SUCESSO</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💵 <b>Valor:</b> R$ ${formatCurrency(amount)}
💸 <b>Taxa:</b> R$ ${formatCurrency(fee)} (${fees.pixPercentageFee}%)
💰 <b>Voce recebe:</b> R$ ${formatCurrency(netAmount)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 <b>CODIGO PIX COPIA E COLA:</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<code>${qrCode}</code>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⏱️ <b>Valido por:</b> 30 minutos
📲 <b>ID:</b> ${transactionId}

✅ Voce sera notificado quando o pagamento for confirmado!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `, { reply_markup: BACK_MENU_KEYBOARD });
    
  } catch (error) {
    console.error("[Telegram] Erro ao gerar PIX:", error);
    await editMessageText(chatId, loadingMsg.message_id, `
❌ <b>Erro ao gerar PIX</b>

Ocorreu um erro ao processar sua solicitacao.
Por favor, tente novamente ou acesse o painel web.

🌐 ${SITE_URL}/dashboard/wallet
    `, { reply_markup: BACK_MENU_KEYBOARD });
  }
}

// ═══════════════════════════════════════════════════════════════
// COMANDO /sacar
// ═══════════════════════════════════════════════════════════════

export async function handleSacar(chatId: number, telegramId: number, amount?: number) {
  const user = await getLinkedUser(telegramId);
  
  if (!user) {
    await sendMessage(chatId, "⚠️ Voce precisa vincular sua conta primeiro.\n\nUse /start para comecar.");
    return;
  }
  
  if (!user.pin_hash) {
    setState(telegramId, "create_pin");
    await sendMessage(chatId, `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 <b>CRIAR PIN DE SEGURANCA</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Para realizar saques, voce precisa criar um PIN de 4 digitos.

Este PIN sera usado para confirmar todas as suas operacoes de saque.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<b>Digite seu novo PIN (4 numeros):</b>
    `, { reply_markup: { inline_keyboard: [[{ text: "❌ Cancelar", callback_data: "cancel" }]] } });
    return;
  }
  
  const balance = Number(user.balance);
  const fees = await getSystemFeesForUser(user.user_id as string);
  
  if (balance < 10) {
    await sendMessage(chatId, `
⚠️ <b>Saldo insuficiente</b>

Seu saldo atual: R$ ${formatCurrency(balance)}
Minimo para saque: R$ 10,00

📥 Use /depositar para adicionar saldo.
    `, { reply_markup: BACK_MENU_KEYBOARD });
    return;
  }
  
  if (!amount || amount < 10) {
    setState(telegramId, "awaiting_withdrawal_amount");
    await sendMessage(chatId, `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📤 <b>SOLICITAR SAQUE</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 <b>Saldo disponivel:</b> R$ ${formatCurrency(balance)}
💸 <b>Taxa de saque:</b> R$ ${formatCurrency(fees.withdrawalFee)}
⚡ <b>Tempo estimado:</b> 5-30 minutos

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Selecione um valor ou digite outro:
    `, { reply_markup: WITHDRAW_VALUES_KEYBOARD(balance) });
    return;
  }
  
  if (amount > balance) {
    await sendMessage(chatId, `
⚠️ <b>Saldo insuficiente</b>

Seu saldo: R$ ${formatCurrency(balance)}
Valor solicitado: R$ ${formatCurrency(amount)}
    `, { reply_markup: BACK_MENU_KEYBOARD });
    return;
  }
  
  setState(telegramId, "awaiting_pix_key", { amount });
  await sendMessage(chatId, `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔑 <b>CHAVE PIX</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Valor do saque: R$ ${formatCurrency(amount)}

<b>Digite sua chave PIX:</b>
(CPF, Email, Telefone ou Chave Aleatoria)
  `, { reply_markup: { inline_keyboard: [[{ text: "❌ Cancelar", callback_data: "cancel" }]] } });
}

// ═══════════════════════════════════════════════════════════════
// COMANDO /extrato
// ═══════════════════════════════════════════════════════════════

export async function handleExtrato(chatId: number, telegramId: number) {
  const user = await getLinkedUser(telegramId);
  
  if (!user) {
    await sendMessage(chatId, "⚠️ Voce precisa vincular sua conta primeiro.\n\nUse /start para comecar.");
    return;
  }
  
  const transactions = await sql`
    SELECT type, amount, status, created_at FROM transactions 
    WHERE user_id = ${user.user_id as string} 
    ORDER BY created_at DESC LIMIT 10
  `;
  
  const withdrawals = await sql`
    SELECT amount, status, created_at FROM withdrawals 
    WHERE user_id = ${user.user_id as string} 
    ORDER BY created_at DESC LIMIT 5
  `;
  
  let message = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 <b>EXTRATO</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 Saldo atual: <b>R$ ${formatCurrency(Number(user.balance))}</b>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📜 <b>ULTIMAS TRANSACOES:</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  
  if (transactions.length === 0 && withdrawals.length === 0) {
    message += "\n📭 Nenhuma transacao encontrada.\n";
  } else {
    interface TransactionItem {
      created_at: string;
      status: string;
      amount: number;
      tipo: string;
    }
    
    const all: TransactionItem[] = [
      ...transactions.map((t: Record<string, unknown>) => ({ 
        created_at: t.created_at as string,
        status: t.status as string,
        amount: Number(t.amount),
        tipo: "deposito" 
      })),
      ...withdrawals.map((w: Record<string, unknown>) => ({ 
        created_at: w.created_at as string,
        status: w.status as string,
        amount: Number(w.amount),
        tipo: "saque" 
      })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10);
    
    all.forEach(t => {
      const emoji = t.tipo === "deposito" ? "📥" : "📤";
      const statusEmoji = t.status === "completed" ? "✅" : t.status === "pending" ? "⏳" : "❌";
      const date = new Date(t.created_at).toLocaleDateString("pt-BR");
      const time = new Date(t.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      const tipo = t.tipo === "deposito" ? "Deposito" : "Saque";
      
      message += `\n${emoji} <b>${tipo}</b> - R$ ${formatCurrency(t.amount)}\n`;
      message += `    ${statusEmoji} ${t.status === "completed" ? "Confirmado" : t.status === "pending" ? "Pendente" : "Falhou"} • ${date} ${time}\n`;
    });
  }
  
  message += "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━";
  
  await sendMessage(chatId, message, { reply_markup: MAIN_MENU_KEYBOARD });
}

// ═══════════════════════════════════════════════════════════════
// COMANDO /taxas
// ═══════════════════════════════════════════════════════════════

export async function handleTaxas(chatId: number, telegramId: number) {
  const user = await getLinkedUser(telegramId);
  
  if (!user) {
    await sendMessage(chatId, "⚠️ Voce precisa vincular sua conta primeiro.\n\nUse /start para comecar.");
    return;
  }
  
  const fees = await getSystemFeesForUser(user.user_id as string);
  
  await sendMessage(chatId, `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 <b>SUAS TAXAS</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📥 <b>DEPOSITO (PIX IN)</b>
├ Taxa: <b>${fees.pixPercentageFee}%</b>
${fees.pixFixedFee > 0 ? `├ Taxa fixa: R$ ${formatCurrency(fees.pixFixedFee)}\n` : ""}└ Tempo: Instantaneo ⚡

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📤 <b>SAQUE (PIX OUT)</b>
├ Taxa: <b>R$ ${formatCurrency(fees.withdrawalFee)}</b>
└ Tempo: 5-30 minutos ⏱️

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔄 <b>TRANSFERENCIA INTERNA</b>
├ Taxa: <b>GRATIS</b> ✨
└ Tempo: Instantaneo ⚡

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 <i>Taxas sujeitas a alteracoes. Consulte o painel para mais detalhes.</i>
  `, { reply_markup: MAIN_MENU_KEYBOARD });
}

// ═══════════════════════════════════════════════════════════════
// COMANDO /ajuda
// ═══════════════════════════════════════════════════════════════

export async function handleAjuda(chatId: number) {
  await sendMessage(chatId, `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❓ <b>CENTRAL DE AJUDA</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📱 <b>COMANDOS DISPONIVEIS:</b>

/start - 🏠 Menu principal
/saldo - 💰 Ver seu saldo
/depositar - 📥 Depositar via PIX
/sacar - 📤 Solicitar saque
/extrato - 📋 Ver transacoes
/taxas - 📊 Ver suas taxas
/ajuda - ❓ Esta mensagem
/desvincular - 🔓 Desvincular conta

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🆘 <b>PRECISA DE AJUDA?</b>

📞 Suporte 24 horas
🌐 Site: ${SITE_URL}
💬 Discord: ${DISCORD_LINK}
📱 WhatsApp: ${WHATSAPP_LINK}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`, {
reply_markup: {
inline_keyboard: [
[
  { text: "💬 Discord", url: DISCORD_LINK },
  { text: "📱 WhatsApp", url: WHATSAPP_LINK },
],
[{ text: "🌐 Painel Web", url: `${SITE_URL}/dashboard` }],
[{ text: "🔙 Voltar ao Menu", callback_data: "back_menu" }],
],
},
});
}

// ═══════════════════════════════════════════════════════════════
// COMANDO /desvincular
// ═══════════════════════════════════════════════════════════════

export async function handleDesvincular(chatId: number, telegramId: number) {
  const user = await getLinkedUser(telegramId);
  
  if (!user) {
    await sendMessage(chatId, "⚠️ Sua conta nao esta vinculada.\n\nUse /start para vincular.");
    return;
  }
  
  await sendMessage(chatId, `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ <b>DESVINCULAR CONTA</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tem certeza que deseja desvincular sua conta <b>${BOT_NAME}</b> deste Telegram?

📧 Conta: ${maskEmail(user.email)}

⚠️ Voce podera vincular novamente a qualquer momento.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "✅ Sim, desvincular", callback_data: "confirm_unlink" },
        ],
        [
          { text: "❌ Cancelar", callback_data: "back_menu" },
        ],
      ],
    },
  });
}

// ═══════════════════════════════════════════════════════════════
// PROCESSAR MENSAGENS DE TEXTO
// ═══════════════════════════════════════════════════════════════

export async function handleTextMessage(chatId: number, telegramId: number, text: string, firstName: string) {
  const state = getState(telegramId);
  
  if (!state) {
    if (text.startsWith("/")) {
      const [command, ...args] = text.split(" ");
      const amount = args[0] ? parseFloat(args[0]) : undefined;
      
      switch (command.toLowerCase()) {
        case "/start":
          return handleStart(chatId, telegramId, firstName);
        case "/saldo":
          return handleSaldo(chatId, telegramId);
        case "/depositar":
          return handleDepositar(chatId, telegramId, amount);
        case "/sacar":
          return handleSacar(chatId, telegramId, amount);
        case "/extrato":
          return handleExtrato(chatId, telegramId);
        case "/taxas":
          return handleTaxas(chatId, telegramId);
        case "/ajuda":
        case "/help":
          return handleAjuda(chatId);
        case "/desvincular":
          return handleDesvincular(chatId, telegramId);
        case "/menu":
          return handleStart(chatId, telegramId, firstName);
        default:
          await sendMessage(chatId, `
⚠️ Comando nao reconhecido.

Use /ajuda para ver os comandos disponiveis ou clique no botao abaixo:
          `, { reply_markup: MAIN_MENU_KEYBOARD });
      }
      return;
    }
    
    await sendMessage(chatId, "Use /start para abrir o menu principal.", { reply_markup: MAIN_MENU_KEYBOARD });
    return;
  }
  
  // Processar estados
  switch (state.action) {
    case "awaiting_email":
      await processEmail(chatId, telegramId, text, firstName);
      break;
    case "awaiting_verification_code":
      await processVerificationCode(chatId, telegramId, text);
      break;
    case "awaiting_deposit_amount":
      const depositAmount = parseFloat(text.replace(",", "."));
      if (isNaN(depositAmount) || depositAmount < 10) {
        await sendMessage(chatId, "⚠️ Valor invalido. Digite um valor minimo de R$ 10,00", { reply_markup: BACK_MENU_KEYBOARD });
        return;
      }
      const depositUser = await getLinkedUser(telegramId);
      if (depositUser) {
        await generatePixDeposit(chatId, telegramId, depositUser, depositAmount);
      }
      break;
    case "awaiting_withdrawal_amount":
      const withdrawAmount = parseFloat(text.replace(",", "."));
      if (isNaN(withdrawAmount) || withdrawAmount < 10) {
        await sendMessage(chatId, "⚠️ Valor invalido. Digite um valor minimo de R$ 10,00", { reply_markup: BACK_MENU_KEYBOARD });
        return;
      }
      setState(telegramId, "awaiting_pix_key", { amount: withdrawAmount });
      await sendMessage(chatId, `
🔑 <b>CHAVE PIX</b>

Valor do saque: R$ ${formatCurrency(withdrawAmount)}

<b>Digite sua chave PIX:</b>
      `, { reply_markup: { inline_keyboard: [[{ text: "❌ Cancelar", callback_data: "cancel" }]] } });
      break;
    case "awaiting_pix_key":
      setState(telegramId, "awaiting_pin", { ...state.data, pixKey: text });
      await sendMessage(chatId, `
🔐 <b>CONFIRMAR SAQUE</b>

<b>Digite seu PIN de 4 digitos:</b>
      `, { reply_markup: { inline_keyboard: [[{ text: "❌ Cancelar", callback_data: "cancel" }]] } });
      break;
    case "awaiting_pin":
      await processWithdrawalPin(chatId, telegramId, text, state.data);
      break;
    case "create_pin":
      await processCreatePin(chatId, telegramId, text);
      break;
    case "confirm_pin":
      await processConfirmPin(chatId, telegramId, text, state.data);
      break;
  }
}

// ═══════════════════════════════════════════════════════════════
// FUNCOES DE PROCESSAMENTO
// ═══════════════════════════════════════════════════════════════

async function processEmail(chatId: number, telegramId: number, email: string, firstName: string) {
  const emailLower = email.toLowerCase().trim();
  
  if (!emailLower.includes("@")) {
    await sendMessage(chatId, "⚠️ Email invalido. Digite um email valido:", { 
      reply_markup: { inline_keyboard: [[{ text: "❌ Cancelar", callback_data: "cancel" }]] } 
    });
    return;
  }
  
  const profile = await sql`
    SELECT id, name, email FROM profiles 
    WHERE LOWER(email) = ${emailLower} AND is_active = true
  `;
  
  if (profile.length === 0) {
    await sendMessage(chatId, `
⚠️ <b>Email nao encontrado</b>

Verifique se digitou corretamente ou crie uma conta:
    `, { 
      reply_markup: { 
        inline_keyboard: [
          [{ text: "📝 Criar Conta", url: `${SITE_URL}/register` }],
          [{ text: "🔄 Tentar Novamente", callback_data: "retry_email" }],
        ] 
      } 
    });
    return;
  }
  
  const existing = await sql`
    SELECT * FROM telegram_users WHERE user_id = ${profile[0].id}
  `;
  
  if (existing.length > 0 && existing[0].telegram_id !== telegramId) {
    await sendMessage(chatId, `
⚠️ <b>Conta ja vinculada</b>

Esta conta ja esta vinculada a outro Telegram.
Use /desvincular no outro dispositivo primeiro.
    `, { reply_markup: BACK_MENU_KEYBOARD });
    return;
  }
  
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  if (existing.length > 0) {
    await sql`
      UPDATE telegram_users 
      SET verification_code = ${code}, verification_expires_at = NOW() + INTERVAL '10 minutes'
      WHERE user_id = ${profile[0].id}
    `;
  } else {
    await sql`
      INSERT INTO telegram_users (user_id, telegram_id, telegram_username, telegram_first_name, verification_code, verification_expires_at, is_active)
      VALUES (${profile[0].id}, ${telegramId}, ${firstName}, ${firstName}, ${code}, NOW() + INTERVAL '10 minutes', false)
    `;
  }
  
  console.log(`[Telegram] Codigo de verificacao para ${email}: ${code}`);
  
  setState(telegramId, "awaiting_verification_code", { email: emailLower, userId: profile[0].id });
  
  await sendMessage(chatId, `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 <b>VERIFICACAO DE EMAIL</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Enviamos um codigo de verificacao para:
<b>${emailLower}</b>

⏱️ O codigo expira em 10 minutos.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<b>Digite o codigo de 6 digitos:</b>
  `, { reply_markup: { inline_keyboard: [[{ text: "❌ Cancelar", callback_data: "cancel" }]] } });
}

async function processVerificationCode(chatId: number, telegramId: number, code: string) {
  const state = getState(telegramId);
  if (!state) return;
  
  const result = await sql`
    SELECT * FROM telegram_users 
    WHERE user_id = ${state.data.userId as string} 
    AND verification_code = ${code.trim()}
    AND verification_expires_at > NOW()
  `;
  
  if (result.length === 0) {
    await sendMessage(chatId, `
❌ <b>Codigo invalido ou expirado</b>

Use /start para tentar novamente.
    `, { reply_markup: BACK_MENU_KEYBOARD });
    clearState(telegramId);
    return;
  }
  
  await sql`
    UPDATE telegram_users 
    SET is_active = true, verification_code = NULL, verification_expires_at = NULL, telegram_id = ${telegramId}
    WHERE user_id = ${state.data.userId as string}
  `;
  
  clearState(telegramId);
  
  await sendMessage(chatId, `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ <b>CONTA VINCULADA!</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Parabens! Sua conta foi vinculada com sucesso.

Agora voce pode usar todos os recursos do ${BOT_NAME} diretamente pelo Telegram!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Clique em um botao abaixo para comecar:
  `, { reply_markup: MAIN_MENU_KEYBOARD });
}

async function processCreatePin(chatId: number, telegramId: number, pin: string) {
  if (!/^\d{4}$/.test(pin)) {
    await sendMessage(chatId, "⚠️ PIN invalido. Digite exatamente 4 numeros:", { 
      reply_markup: { inline_keyboard: [[{ text: "❌ Cancelar", callback_data: "cancel" }]] } 
    });
    return;
  }
  
  setState(telegramId, "confirm_pin", { pin });
  await sendMessage(chatId, `
🔐 <b>CONFIRMAR PIN</b>

Digite novamente seu PIN para confirmar:
  `, { reply_markup: { inline_keyboard: [[{ text: "❌ Cancelar", callback_data: "cancel" }]] } });
}

async function processConfirmPin(chatId: number, telegramId: number, pin: string, data: Record<string, unknown>) {
  if (pin !== data.pin) {
    await sendMessage(chatId, `
❌ <b>PINs nao conferem</b>

Use /sacar para tentar novamente.
    `, { reply_markup: BACK_MENU_KEYBOARD });
    clearState(telegramId);
    return;
  }
  
  const hashedPin = await bcrypt.hash(pin, 10);
  
  await sql`
    UPDATE telegram_users SET pin_hash = ${hashedPin} WHERE telegram_id = ${telegramId}
  `;
  
  clearState(telegramId);
  
  await sendMessage(chatId, `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ <b>PIN CRIADO COM SUCESSO!</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Seu PIN de seguranca foi configurado.
Agora voce pode realizar saques.

Use /sacar para continuar.
  `, { reply_markup: MAIN_MENU_KEYBOARD });
}

async function processWithdrawalPin(chatId: number, telegramId: number, pin: string, data: Record<string, unknown>) {
  const user = await getLinkedUser(telegramId);
  if (!user) return;
  
  const isValid = await bcrypt.compare(pin, user.pin_hash);
  
  if (!isValid) {
    await sendMessage(chatId, "❌ PIN incorreto. Tente novamente:", { 
      reply_markup: { inline_keyboard: [[{ text: "❌ Cancelar", callback_data: "cancel" }]] } 
    });
    return;
  }
  
  clearState(telegramId);
  
  const amount = data.amount as number;
  const pixKey = data.pixKey as string;
  const balance = Number(user.balance);
  
  if (amount > balance) {
    await sendMessage(chatId, `
⚠️ <b>Saldo insuficiente</b>

Seu saldo: R$ ${formatCurrency(balance)}
Valor solicitado: R$ ${formatCurrency(amount)}
    `, { reply_markup: BACK_MENU_KEYBOARD });
    return;
  }
  
  const fees = await getSystemFeesForUser(user.user_id as string);
  const fee = fees.withdrawalFeeIsPercentage 
    ? amount * (fees.withdrawalFee / 100) 
    : fees.withdrawalFee;
  const netAmount = amount - fee;
  
  await sql`
    INSERT INTO withdrawals (user_id, amount, fee, net_amount, pix_key, status, description)
    VALUES (${user.user_id as string}, ${amount}, ${fee}, ${netAmount}, ${pixKey}, 'pending', 'Saque via Telegram')
  `;
  
  await sql`
    UPDATE profiles SET balance = balance - ${amount} WHERE id = ${user.user_id as string}
  `;
  
  await sendMessage(chatId, `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ <b>SAQUE SOLICITADO!</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💵 <b>Valor:</b> R$ ${formatCurrency(amount)}
💸 <b>Taxa:</b> R$ ${formatCurrency(fee)}
💰 <b>Voce recebe:</b> R$ ${formatCurrency(netAmount)}

🔑 <b>Chave PIX:</b>
<code>${pixKey}</code>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⏱️ <b>Previsao:</b> 5-30 minutos

✅ Voce sera notificado quando o saque for processado!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `, { reply_markup: MAIN_MENU_KEYBOARD });
}

// ═══════════════════════════════════════════════════════════════
// PROCESSAR CALLBACKS (BOTOES)
// ═══════════════════════════════════════════════════════════════

export async function handleCallback(callbackId: string, chatId: number, messageId: number, telegramId: number, data: string, firstName: string) {
  await answerCallbackQuery(callbackId);
  
  const user = await getLinkedUser(telegramId);
  
  // Cancelar operacao
  if (data === "cancel") {
    clearState(telegramId);
    await editMessageText(chatId, messageId, "❌ Operacao cancelada.\n\nUse /start para voltar ao menu.");
    return;
  }
  
  // Voltar ao menu
  if (data === "back_menu") {
    clearState(telegramId);
    await handleStart(chatId, telegramId, firstName);
    return;
  }
  
  // Retry email
  if (data === "retry_email") {
    setState(telegramId, "awaiting_email");
    await sendMessage(chatId, "<b>Digite o email da sua conta:</b>");
    return;
  }
  
  // Confirmar desvinculacao
  if (data === "confirm_unlink") {
    await sql`UPDATE telegram_users SET is_active = false WHERE telegram_id = ${telegramId}`;
    clearState(telegramId);
    await editMessageText(chatId, messageId, `
✅ <b>Conta desvinculada</b>

Sua conta foi desvinculada com sucesso.
Use /start para vincular novamente.
    `);
    return;
  }
  
  // Menu actions
  if (data === "menu_saldo") {
    return handleSaldo(chatId, telegramId);
  }
  if (data === "menu_depositar") {
    return handleDepositar(chatId, telegramId);
  }
  if (data === "menu_sacar") {
    return handleSacar(chatId, telegramId);
  }
  if (data === "menu_extrato") {
    return handleExtrato(chatId, telegramId);
  }
  if (data === "menu_taxas") {
    return handleTaxas(chatId, telegramId);
  }
  if (data === "menu_ajuda") {
    return handleAjuda(chatId);
  }
  
  // Deposito com valor predefinido
  if (data.startsWith("deposit_")) {
    if (!user) {
      await sendMessage(chatId, "⚠️ Vincule sua conta primeiro. Use /start");
      return;
    }
    if (data === "deposit_custom") {
      setState(telegramId, "awaiting_deposit_amount");
      await sendMessage(chatId, `
💵 <b>VALOR PERSONALIZADO</b>

Digite o valor que deseja depositar (minimo R$ 10,00):
      `, { reply_markup: { inline_keyboard: [[{ text: "❌ Cancelar", callback_data: "cancel" }]] } });
      return;
    }
    const amount = parseInt(data.replace("deposit_", ""));
    await generatePixDeposit(chatId, telegramId, user, amount);
    return;
  }
  
  // Saque com valor predefinido
  if (data.startsWith("withdraw_")) {
    if (!user) {
      await sendMessage(chatId, "⚠️ Vincule sua conta primeiro. Use /start");
      return;
    }
    
    const balance = Number(user.balance);
    
    if (data === "withdraw_custom") {
      setState(telegramId, "awaiting_withdrawal_amount");
      await sendMessage(chatId, `
💸 <b>VALOR PERSONALIZADO</b>

Saldo disponivel: R$ ${formatCurrency(balance)}

Digite o valor que deseja sacar (minimo R$ 10,00):
      `, { reply_markup: { inline_keyboard: [[{ text: "❌ Cancelar", callback_data: "cancel" }]] } });
      return;
    }
    
    let amount: number;
    if (data === "withdraw_all") {
      amount = balance;
    } else {
      amount = parseInt(data.replace("withdraw_", ""));
    }
    
    if (amount > balance) {
      await sendMessage(chatId, `
⚠️ <b>Saldo insuficiente</b>

Seu saldo: R$ ${formatCurrency(balance)}
      `, { reply_markup: BACK_MENU_KEYBOARD });
      return;
    }
    
    if (amount < 10) {
      await sendMessage(chatId, "⚠️ Valor minimo para saque: R$ 10,00", { reply_markup: BACK_MENU_KEYBOARD });
      return;
    }
    
    if (!user.pin_hash) {
      setState(telegramId, "create_pin");
      await sendMessage(chatId, `
🔐 <b>CRIAR PIN</b>

Para realizar saques, crie um PIN de 4 digitos:
      `, { reply_markup: { inline_keyboard: [[{ text: "❌ Cancelar", callback_data: "cancel" }]] } });
      return;
    }
    
    setState(telegramId, "awaiting_pix_key", { amount });
    await sendMessage(chatId, `
🔑 <b>CHAVE PIX</b>

Valor do saque: R$ ${formatCurrency(amount)}

<b>Digite sua chave PIX:</b>
    `, { reply_markup: { inline_keyboard: [[{ text: "❌ Cancelar", callback_data: "cancel" }]] } });
    return;
  }
}
