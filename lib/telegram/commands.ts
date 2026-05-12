import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import { sendMessage, editMessageText, answerCallbackQuery } from "./bot";
import { createPixCharge } from "@/lib/acquirers";
import { getSystemFeesForUser } from "@/lib/acquirers";

const sql = neon(process.env.DATABASE_URL!);

// Estado temporario para fluxos multi-etapa
const userStates: Map<number, {
  action: string;
  data: Record<string, unknown>;
  expiresAt: number;
}> = new Map();

function setState(telegramId: number, action: string, data: Record<string, unknown> = {}) {
  userStates.set(telegramId, {
    action,
    data,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutos
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

// Verificar se usuario esta vinculado
async function getLinkedUser(telegramId: number) {
  const result = await sql`
    SELECT tu.*, p.email, p.name, p.balance, p.is_active as account_active
    FROM telegram_users tu
    JOIN profiles p ON tu.user_id = p.id
    WHERE tu.telegram_id = ${telegramId} AND tu.is_active = true
  `;
  return result[0] || null;
}

// Comando /start
export async function handleStart(chatId: number, telegramId: number, firstName: string, username?: string) {
  const linkedUser = await getLinkedUser(telegramId);
  
  if (linkedUser) {
    await sendMessage(chatId, `
Ola, <b>${linkedUser.name || firstName}</b>! 👋

Sua conta ja esta vinculada ao LegacyPay.

<b>Comandos disponiveis:</b>
/saldo - Ver seu saldo
/depositar - Gerar PIX para deposito
/sacar - Solicitar saque
/extrato - Ver ultimas transacoes
/taxas - Ver suas taxas
/ajuda - Lista de comandos
/desvincular - Remover vinculo
    `);
    return;
  }
  
  setState(telegramId, "awaiting_email");
  
  await sendMessage(chatId, `
Bem-vindo ao <b>LegacyPay Bot</b>! 🚀

Para comecar, preciso vincular sua conta.

<b>Digite o email da sua conta LegacyPay:</b>
  `);
}

// Comando /saldo
export async function handleSaldo(chatId: number, telegramId: number) {
  const user = await getLinkedUser(telegramId);
  
  if (!user) {
    await sendMessage(chatId, "Voce precisa vincular sua conta primeiro. Use /start");
    return;
  }
  
  const balance = Number(user.balance).toFixed(2);
  
  await sendMessage(chatId, `
💰 <b>Seu Saldo</b>

<b>Disponivel:</b> R$ ${balance}

Use /depositar para adicionar saldo
Use /sacar para solicitar saque
  `);
}

// Comando /depositar
export async function handleDepositar(chatId: number, telegramId: number, amount?: number) {
  const user = await getLinkedUser(telegramId);
  
  if (!user) {
    await sendMessage(chatId, "Voce precisa vincular sua conta primeiro. Use /start");
    return;
  }
  
  if (!amount || amount < 10) {
    setState(telegramId, "awaiting_deposit_amount");
    await sendMessage(chatId, `
💵 <b>Deposito PIX</b>

Digite o valor que deseja depositar (minimo R$ 10,00):

Exemplo: <code>100</code> ou <code>50.50</code>
    `, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "R$ 50", callback_data: "deposit_50" },
            { text: "R$ 100", callback_data: "deposit_100" },
            { text: "R$ 200", callback_data: "deposit_200" },
          ],
          [
            { text: "R$ 500", callback_data: "deposit_500" },
            { text: "R$ 1000", callback_data: "deposit_1000" },
          ],
          [{ text: "Cancelar", callback_data: "cancel" }],
        ],
      },
    });
    return;
  }
  
  await generatePixDeposit(chatId, telegramId, user, amount);
}

async function generatePixDeposit(chatId: number, telegramId: number, user: Record<string, unknown>, amount: number) {
  clearState(telegramId);
  
  await sendMessage(chatId, "Gerando PIX... Aguarde.");
  
  try {
    const fees = await getSystemFeesForUser(user.user_id as string);
    const fee = amount * (fees.pixPercentageFee / 100) + fees.pixFixedFee;
    const netAmount = amount - fee;
    
    // Criar cobranca PIX
    const pixResult = await createPixCharge({
      userId: user.user_id as string,
      amount,
      description: `Deposito via Telegram`,
    });
    
    if (!pixResult.success) {
      await sendMessage(chatId, "Erro ao gerar PIX. Tente novamente mais tarde.");
      return;
    }
    
    await sendMessage(chatId, `
✅ <b>PIX Gerado com Sucesso!</b>

<b>Valor:</b> R$ ${amount.toFixed(2)}
<b>Taxa:</b> R$ ${fee.toFixed(2)} (${fees.pixPercentageFee}%)
<b>Voce recebe:</b> R$ ${netAmount.toFixed(2)}

<b>Codigo Copia e Cola:</b>
<code>${pixResult.qrCode || pixResult.pixCode}</code>

⏱️ Valido por 30 minutos.
Voce sera notificado quando o pagamento for confirmado.
    `);
  } catch (error) {
    console.error("Erro ao gerar PIX:", error);
    await sendMessage(chatId, "Erro ao gerar PIX. Tente novamente mais tarde.");
  }
}

// Comando /sacar
export async function handleSacar(chatId: number, telegramId: number, amount?: number) {
  const user = await getLinkedUser(telegramId);
  
  if (!user) {
    await sendMessage(chatId, "Voce precisa vincular sua conta primeiro. Use /start");
    return;
  }
  
  if (!user.pin_hash) {
    setState(telegramId, "create_pin");
    await sendMessage(chatId, `
🔐 <b>Criar PIN de Seguranca</b>

Para realizar saques, voce precisa criar um PIN de 4 digitos.

<b>Digite seu novo PIN:</b>
    `);
    return;
  }
  
  const balance = Number(user.balance);
  
  if (!amount || amount < 10) {
    setState(telegramId, "awaiting_withdrawal_amount");
    await sendMessage(chatId, `
💸 <b>Solicitar Saque</b>

<b>Saldo disponivel:</b> R$ ${balance.toFixed(2)}

Digite o valor que deseja sacar (minimo R$ 10,00):
    `, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "R$ 50", callback_data: "withdraw_50" },
            { text: "R$ 100", callback_data: "withdraw_100" },
          ],
          [
            { text: "Sacar Tudo", callback_data: "withdraw_all" },
          ],
          [{ text: "Cancelar", callback_data: "cancel" }],
        ],
      },
    });
    return;
  }
  
  if (amount > balance) {
    await sendMessage(chatId, `Saldo insuficiente. Seu saldo e R$ ${balance.toFixed(2)}`);
    return;
  }
  
  setState(telegramId, "awaiting_pix_key", { amount });
  await sendMessage(chatId, `
<b>Digite sua chave PIX:</b>

Pode ser: CPF, Email, Telefone ou Chave Aleatoria
  `);
}

// Comando /extrato
export async function handleExtrato(chatId: number, telegramId: number) {
  const user = await getLinkedUser(telegramId);
  
  if (!user) {
    await sendMessage(chatId, "Voce precisa vincular sua conta primeiro. Use /start");
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
  
  let message = `📋 <b>Ultimas Transacoes</b>\n\n`;
  
  if (transactions.length === 0 && withdrawals.length === 0) {
    message += "Nenhuma transacao encontrada.";
  } else {
    // Combinar e ordenar
    const all = [
      ...transactions.map(t => ({ ...t, tipo: "deposito" })),
      ...withdrawals.map(w => ({ ...w, type: "saque", tipo: "saque" })),
    ].sort((a, b) => new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime()).slice(0, 10);
    
    all.forEach(t => {
      const emoji = t.tipo === "deposito" ? "💰" : "💸";
      const status = t.status === "completed" ? "✅" : t.status === "pending" ? "⏳" : "❌";
      const date = new Date(t.created_at as string).toLocaleDateString("pt-BR");
      message += `${emoji} R$ ${Number(t.amount).toFixed(2)} - ${status} - ${date}\n`;
    });
  }
  
  await sendMessage(chatId, message);
}

// Comando /taxas
export async function handleTaxas(chatId: number, telegramId: number) {
  const user = await getLinkedUser(telegramId);
  
  if (!user) {
    await sendMessage(chatId, "Voce precisa vincular sua conta primeiro. Use /start");
    return;
  }
  
  const fees = await getSystemFeesForUser(user.user_id as string);
  
  await sendMessage(chatId, `
📊 <b>Suas Taxas</b>

<b>Deposito (PIX In):</b>
Taxa: ${fees.pixPercentageFee}%${fees.pixFixedFee > 0 ? ` + R$ ${fees.pixFixedFee.toFixed(2)}` : ""}

<b>Saque (PIX Out):</b>
Taxa: ${fees.withdrawalFeeIsPercentage ? fees.withdrawalFee + "%" : "R$ " + fees.withdrawalFee.toFixed(2)}

<b>Transferencia Interna:</b>
Taxa: GRATIS
  `);
}

// Comando /ajuda
export async function handleAjuda(chatId: number) {
  await sendMessage(chatId, `
📚 <b>Comandos Disponiveis</b>

/start - Iniciar / Vincular conta
/saldo - Ver seu saldo atual
/depositar - Gerar PIX para deposito
/sacar - Solicitar saque
/extrato - Ver ultimas transacoes
/taxas - Ver suas taxas
/ajuda - Esta mensagem
/desvincular - Remover vinculo da conta

<b>Suporte:</b> Entre no nosso grupo de suporte
  `);
}

// Comando /desvincular
export async function handleDesvincular(chatId: number, telegramId: number) {
  const user = await getLinkedUser(telegramId);
  
  if (!user) {
    await sendMessage(chatId, "Sua conta nao esta vinculada.");
    return;
  }
  
  await sendMessage(chatId, `
⚠️ <b>Desvincular Conta</b>

Tem certeza que deseja desvincular sua conta LegacyPay deste Telegram?

Voce podera vincular novamente a qualquer momento.
  `, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "Sim, desvincular", callback_data: "confirm_unlink" },
          { text: "Cancelar", callback_data: "cancel" },
        ],
      ],
    },
  });
}

// Processar mensagem de texto (fluxos)
export async function handleTextMessage(chatId: number, telegramId: number, text: string, firstName: string) {
  const state = getState(telegramId);
  
  if (!state) {
    // Verificar se e um comando
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
        default:
          await sendMessage(chatId, "Comando nao reconhecido. Use /ajuda para ver os comandos disponiveis.");
      }
      return;
    }
    
    await sendMessage(chatId, "Use /ajuda para ver os comandos disponiveis.");
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
        await sendMessage(chatId, "Valor invalido. Digite um valor minimo de R$ 10,00");
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
        await sendMessage(chatId, "Valor invalido. Digite um valor minimo de R$ 10,00");
        return;
      }
      setState(telegramId, "awaiting_pix_key", { amount: withdrawAmount });
      await sendMessage(chatId, "Digite sua chave PIX:");
      break;
    case "awaiting_pix_key":
      setState(telegramId, "awaiting_pin", { ...state.data, pixKey: text });
      await sendMessage(chatId, "Digite seu PIN de 4 digitos para confirmar:");
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

// Processar email para vinculacao
async function processEmail(chatId: number, telegramId: number, email: string, firstName: string) {
  const emailLower = email.toLowerCase().trim();
  
  // Verificar se email existe no LegacyPay
  const profile = await sql`
    SELECT id, name, email FROM profiles 
    WHERE LOWER(email) = ${emailLower} AND is_active = true
  `;
  
  if (profile.length === 0) {
    await sendMessage(chatId, "Email nao encontrado. Verifique se digitou corretamente ou crie uma conta em nosso site.");
    return;
  }
  
  // Verificar se ja esta vinculado a outro Telegram
  const existing = await sql`
    SELECT * FROM telegram_users WHERE user_id = ${profile[0].id}
  `;
  
  if (existing.length > 0 && existing[0].telegram_id !== telegramId) {
    await sendMessage(chatId, "Esta conta ja esta vinculada a outro Telegram. Use /desvincular no outro dispositivo primeiro.");
    return;
  }
  
  // Gerar codigo de verificacao
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Salvar codigo temporariamente
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
  
  // TODO: Enviar email com codigo (por enquanto mostra no chat para teste)
  // Em producao, usar nodemailer ou similar
  console.log(`[Telegram] Codigo de verificacao para ${email}: ${code}`);
  
  setState(telegramId, "awaiting_verification_code", { email: emailLower, userId: profile[0].id });
  
  await sendMessage(chatId, `
Enviamos um codigo de verificacao para <b>${emailLower}</b>.

<b>Digite o codigo de 6 digitos:</b>

(O codigo expira em 10 minutos)
  `);
}

// Processar codigo de verificacao
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
    await sendMessage(chatId, "Codigo invalido ou expirado. Use /start para tentar novamente.");
    clearState(telegramId);
    return;
  }
  
  // Ativar vinculo
  await sql`
    UPDATE telegram_users 
    SET is_active = true, verification_code = NULL, verification_expires_at = NULL, telegram_id = ${telegramId}
    WHERE user_id = ${state.data.userId as string}
  `;
  
  clearState(telegramId);
  
  await sendMessage(chatId, `
✅ <b>Conta vinculada com sucesso!</b>

Agora voce pode usar todos os comandos:
/saldo - Ver seu saldo
/depositar - Gerar PIX
/sacar - Solicitar saque
/extrato - Ver transacoes

Boas operacoes! 🚀
  `);
}

// Processar criacao de PIN
async function processCreatePin(chatId: number, telegramId: number, pin: string) {
  if (!/^\d{4}$/.test(pin)) {
    await sendMessage(chatId, "PIN invalido. Digite exatamente 4 numeros.");
    return;
  }
  
  setState(telegramId, "confirm_pin", { pin });
  await sendMessage(chatId, "Confirme seu PIN (digite novamente):");
}

// Confirmar PIN
async function processConfirmPin(chatId: number, telegramId: number, pin: string, data: Record<string, unknown>) {
  if (pin !== data.pin) {
    await sendMessage(chatId, "PINs nao conferem. Use /sacar para tentar novamente.");
    clearState(telegramId);
    return;
  }
  
  const hashedPin = await bcrypt.hash(pin, 10);
  
  await sql`
    UPDATE telegram_users SET pin_hash = ${hashedPin} WHERE telegram_id = ${telegramId}
  `;
  
  clearState(telegramId);
  
  await sendMessage(chatId, `
✅ PIN criado com sucesso!

Agora voce pode realizar saques. Use /sacar para continuar.
  `);
}

// Processar PIN para saque
async function processWithdrawalPin(chatId: number, telegramId: number, pin: string, data: Record<string, unknown>) {
  const user = await getLinkedUser(telegramId);
  if (!user) return;
  
  const isValid = await bcrypt.compare(pin, user.pin_hash);
  
  if (!isValid) {
    await sendMessage(chatId, "PIN incorreto. Tente novamente.");
    return;
  }
  
  clearState(telegramId);
  
  const amount = data.amount as number;
  const pixKey = data.pixKey as string;
  const balance = Number(user.balance);
  
  if (amount > balance) {
    await sendMessage(chatId, `Saldo insuficiente. Seu saldo e R$ ${balance.toFixed(2)}`);
    return;
  }
  
  // Buscar taxas
  const fees = await getSystemFeesForUser(user.user_id as string);
  const fee = fees.withdrawalFeeIsPercentage 
    ? amount * (fees.withdrawalFee / 100) 
    : fees.withdrawalFee;
  const netAmount = amount - fee;
  
  // Criar saque
  await sql`
    INSERT INTO withdrawals (user_id, amount, fee, net_amount, pix_key, status, description)
    VALUES (${user.user_id as string}, ${amount}, ${fee}, ${netAmount}, ${pixKey}, 'pending', 'Saque via Telegram')
  `;
  
  // Debitar saldo
  await sql`
    UPDATE profiles SET balance = balance - ${amount} WHERE id = ${user.user_id as string}
  `;
  
  await sendMessage(chatId, `
✅ <b>Saque Solicitado!</b>

<b>Valor:</b> R$ ${amount.toFixed(2)}
<b>Taxa:</b> R$ ${fee.toFixed(2)}
<b>Voce recebe:</b> R$ ${netAmount.toFixed(2)}
<b>Chave PIX:</b> ${pixKey}

⏱️ Previsao: 5-30 minutos
Voce sera notificado quando for processado.
  `);
}

// Processar callbacks (botoes)
export async function handleCallback(callbackId: string, chatId: number, messageId: number, telegramId: number, data: string) {
  await answerCallbackQuery(callbackId);
  
  const user = await getLinkedUser(telegramId);
  
  if (data === "cancel") {
    clearState(telegramId);
    await editMessageText(chatId, messageId, "Operacao cancelada.");
    return;
  }
  
  if (data === "confirm_unlink") {
    await sql`UPDATE telegram_users SET is_active = false WHERE telegram_id = ${telegramId}`;
    clearState(telegramId);
    await editMessageText(chatId, messageId, "Conta desvinculada com sucesso. Use /start para vincular novamente.");
    return;
  }
  
  if (data.startsWith("deposit_")) {
    const amount = parseInt(data.replace("deposit_", ""));
    if (user) {
      await generatePixDeposit(chatId, telegramId, user, amount);
    }
    return;
  }
  
  if (data.startsWith("withdraw_")) {
    if (!user) return;
    
    const balance = Number(user.balance);
    let amount: number;
    
    if (data === "withdraw_all") {
      amount = balance;
    } else {
      amount = parseInt(data.replace("withdraw_", ""));
    }
    
    if (amount > balance) {
      await sendMessage(chatId, `Saldo insuficiente. Seu saldo e R$ ${balance.toFixed(2)}`);
      return;
    }
    
    if (!user.pin_hash) {
      setState(telegramId, "create_pin");
      await sendMessage(chatId, "Para realizar saques, voce precisa criar um PIN de 4 digitos. Digite seu novo PIN:");
      return;
    }
    
    setState(telegramId, "awaiting_pix_key", { amount });
    await sendMessage(chatId, "Digite sua chave PIX:");
  }
}
