// Script para confirmar manualmente uma transação pendente
// Uso: npx tsx scripts/confirm-transaction.ts <transaction_id>

import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL não configurada");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function confirmTransaction(transactionId: string) {
  console.log("Buscando transação:", transactionId);
  
  // Buscar a transação
  const txResult = await sql`
    SELECT * FROM transactions WHERE id = ${transactionId} OR id LIKE ${transactionId + '%'}
  `;
  
  if (txResult.length === 0) {
    console.error("Transação não encontrada");
    return;
  }
  
  const transaction = txResult[0];
  console.log("Transação encontrada:", {
    id: transaction.id,
    status: transaction.status,
    amount: transaction.amount,
    net_amount: transaction.net_amount,
    fee: transaction.fee,
    user_id: transaction.user_id,
  });
  
  if (transaction.status === "completed" || transaction.status === "paid") {
    console.log("Transação já está completada!");
    return;
  }
  
  // Atualizar status da transação
  const paidAt = new Date().toISOString();
  await sql`
    UPDATE transactions 
    SET status = 'completed', paid_at = ${paidAt}, updated_at = NOW()
    WHERE id = ${transaction.id}
  `;
  console.log("Status atualizado para 'completed'");
  
  // Atualizar saldo do usuário
  const profileResult = await sql`SELECT balance FROM profiles WHERE id = ${transaction.user_id}`;
  const currentBalance = Number(profileResult[0]?.balance) || 0;
  const netAmount = Number(transaction.net_amount) || Number(transaction.amount);
  const newBalance = currentBalance + netAmount;
  
  await sql`UPDATE profiles SET balance = ${newBalance}, updated_at = NOW() WHERE id = ${transaction.user_id}`;
  console.log("Saldo atualizado:", { currentBalance, netAmount, newBalance });
  
  // Criar notificação
  try {
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
    console.log("Notificação criada");
  } catch (e) {
    console.error("Erro ao criar notificação:", e);
  }
  
  console.log("Transação confirmada com sucesso!");
}

const transactionId = process.argv[2];
if (!transactionId) {
  console.error("Por favor, forneça o ID da transação como argumento");
  console.log("Uso: npx tsx scripts/confirm-transaction.ts <transaction_id>");
  process.exit(1);
}

confirmTransaction(transactionId).catch(console.error);
