import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function removePendingWithdrawals() {
  console.log("=== Removendo Saques Pendentes (SEM creditar de volta) ===\n");

  try {
    // Buscar saques pendentes
    const pendingWithdrawals = await sql`
      SELECT t.id, t.user_id, t.amount, t.net_amount, t.fee, t.status, t.pix_key, t.created_at,
             p.name as user_name, p.email as user_email
      FROM transactions t
      LEFT JOIN profiles p ON t.user_id = p.id
      WHERE t.type = 'withdrawal' AND t.status = 'pending'
      ORDER BY t.created_at DESC
    `;

    if (pendingWithdrawals.length === 0) {
      console.log("Nenhum saque pendente encontrado.");
      return;
    }

    console.log(`Encontrados ${pendingWithdrawals.length} saques pendentes:\n`);

    for (const withdrawal of pendingWithdrawals) {
      console.log(`- ID: ${withdrawal.id}`);
      console.log(`  Usuário: ${withdrawal.user_name} (${withdrawal.user_email})`);
      console.log(`  Valor: R$ ${Number(withdrawal.amount).toFixed(2)}`);
      console.log(`  Líquido: R$ ${Number(withdrawal.net_amount).toFixed(2)}`);
      console.log(`  Chave PIX: ${withdrawal.pix_key}`);
      console.log(`  Data: ${withdrawal.created_at}`);
      console.log("");
    }

    // Deletar os saques pendentes SEM devolver o saldo
    console.log("\nDeletando saques pendentes...");
    
    const deleted = await sql`
      DELETE FROM transactions 
      WHERE type = 'withdrawal' AND status = 'pending'
      RETURNING id, amount, user_id
    `;

    console.log(`\n${deleted.length} saques pendentes removidos com sucesso!`);
    console.log("NOTA: Os valores NÃO foram creditados de volta nas contas dos usuários.");

    // Resumo
    const totalRemoved = deleted.reduce((sum, t) => sum + Number(t.amount), 0);
    console.log(`\nTotal removido: R$ ${totalRemoved.toFixed(2)}`);

  } catch (error) {
    console.error("Erro ao remover saques pendentes:", error);
    throw error;
  }
}

removePendingWithdrawals()
  .then(() => {
    console.log("\n=== Processo concluído ===");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Falha na execução:", error);
    process.exit(1);
  });
