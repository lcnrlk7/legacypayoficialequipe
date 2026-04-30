import { sql } from "../lib/db";

const TEST_USER_NAMES = [
  "Luciano Costa",
  "Kn mete mete", 
  "Arthur Pendragon"
];

async function cleanupTestUsers() {
  console.log("=== Iniciando limpeza de usuários de teste ===\n");

  try {
    // 1. Buscar IDs dos usuários de teste
    console.log("1. Buscando usuários de teste...");
    const testUsers = await sql`
      SELECT id, email, name FROM profiles 
      WHERE name = ANY(${TEST_USER_NAMES})
    `;

    if (testUsers.length === 0) {
      console.log("Nenhum usuário de teste encontrado.");
      return;
    }

    console.log(`Encontrados ${testUsers.length} usuários de teste:`);
    testUsers.forEach(u => console.log(`  - ${u.name} (${u.email}) - ID: ${u.id}`));

    const userIds = testUsers.map(u => u.id);

    // 2. Contar transações antes de deletar
    console.log("\n2. Contando transações dos usuários de teste...");
    const txCount = await sql`
      SELECT COUNT(*) as count, 
             COALESCE(SUM(amount), 0) as total_amount
      FROM transactions 
      WHERE user_id = ANY(${userIds})
    `;
    console.log(`  - Total de transações: ${txCount[0].count}`);
    console.log(`  - Valor total: R$ ${Number(txCount[0].total_amount).toFixed(2)}`);

    // 3. Deletar transações
    console.log("\n3. Deletando transações...");
    const deletedTx = await sql`
      DELETE FROM transactions 
      WHERE user_id = ANY(${userIds})
      RETURNING id
    `;
    console.log(`  - ${deletedTx.length} transações deletadas`);

    // 4. Buscar checkouts dos usuários para deletar checkout_orders primeiro
    console.log("\n4. Deletando checkout_orders e checkouts...");
    const userCheckouts = await sql`
      SELECT id FROM checkouts WHERE user_id = ANY(${userIds})
    `;
    const checkoutIds = userCheckouts.map(c => c.id);
    
    if (checkoutIds.length > 0) {
      // Deletar checkout_orders primeiro (foreign key)
      const deletedOrders = await sql`
        DELETE FROM checkout_orders 
        WHERE checkout_id = ANY(${checkoutIds})
        RETURNING id
      `;
      console.log(`  - ${deletedOrders.length} checkout_orders deletados`);
    }
    
    // Agora deletar checkouts
    const deletedCheckouts = await sql`
      DELETE FROM checkouts 
      WHERE user_id = ANY(${userIds})
      RETURNING id
    `;
    console.log(`  - ${deletedCheckouts.length} checkouts deletados`);

    // 5. Deletar chaves PIX
    console.log("\n5. Deletando chaves PIX...");
    const deletedPixKeys = await sql`
      DELETE FROM pix_keys 
      WHERE user_id = ANY(${userIds})
      RETURNING id
    `;
    console.log(`  - ${deletedPixKeys.length} chaves PIX deletadas`);

    // 6. Deletar push subscriptions
    console.log("\n6. Deletando push subscriptions...");
    const deletedPush = await sql`
      DELETE FROM push_subscriptions 
      WHERE user_id = ANY(${userIds})
      RETURNING id
    `;
    console.log(`  - ${deletedPush.length} push subscriptions deletadas`);

    // 7. Deletar audit logs
    console.log("\n7. Deletando audit logs...");
    const deletedLogs = await sql`
      DELETE FROM audit_logs 
      WHERE user_id = ANY(${userIds})
      RETURNING id
    `;
    console.log(`  - ${deletedLogs.length} audit logs deletados`);

    // 8. Deletar integration_errors
    console.log("\n8. Deletando integration_errors...");
    const deletedErrors = await sql`
      DELETE FROM integration_errors 
      WHERE user_id = ANY(${userIds})
      RETURNING id
    `;
    console.log(`  - ${deletedErrors.length} integration_errors deletados`);

    // 9. Deletar admin_notifications
    console.log("\n9. Deletando admin_notifications...");
    const deletedAdminNotifs = await sql`
      DELETE FROM admin_notifications 
      WHERE created_by = ANY(${userIds})
      RETURNING id
    `;
    console.log(`  - ${deletedAdminNotifs.length} admin_notifications deletados`);

    // 10. Deletar os próprios usuários
    console.log("\n10. Deletando usuários de teste...");
    const deletedUsers = await sql`
      DELETE FROM profiles 
      WHERE id = ANY(${userIds})
      RETURNING id, name, email
    `;
    console.log(`  - ${deletedUsers.length} usuários deletados:`);
    deletedUsers.forEach(u => console.log(`    - ${u.name} (${u.email})`));

    console.log("\n=== Limpeza concluída com sucesso! ===");
    
  } catch (error) {
    console.error("Erro durante a limpeza:", error);
    throw error;
  }
}

cleanupTestUsers()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
