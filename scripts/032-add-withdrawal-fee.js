// Script para adicionar coluna withdrawal_fee e atualizar taxas de saque
// Executar com: node scripts/032-add-withdrawal-fee.js
// Ou via API: POST /api/admin/run-migration

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function migrate() {
  console.log('Iniciando migração de taxa de saque...');
  
  try {
    // 1. Adicionar coluna withdrawal_fee na tabela profiles (se não existir)
    await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS withdrawal_fee DECIMAL(10, 2) DEFAULT NULL`;
    console.log('✓ Coluna withdrawal_fee adicionada em profiles');
    
    // 2. Atualizar taxa de saque da MisticPay (rota white) para R$ 2,00
    const misticResult = await sql`UPDATE acquirers SET withdrawal_fee = 2.00 WHERE slug = 'misticpay' RETURNING id, name`;
    console.log('✓ Taxa de saque MisticPay atualizada para R$ 2,00', misticResult);
    
    // 3. Atualizar taxa de saque da Medusa (rota black) para R$ 5,00
    const medusaResult = await sql`UPDATE acquirers SET withdrawal_fee = 5.00 WHERE slug = 'medusa' RETURNING id, name`;
    console.log('✓ Taxa de saque Medusa atualizada para R$ 5,00', medusaResult);
    
    // 4. Verificar adquirentes atualizadas
    const acquirers = await sql`SELECT name, slug, withdrawal_fee FROM acquirers`;
    console.log('\nAdquirentes atualizadas:');
    acquirers.forEach(a => {
      console.log(`  - ${a.name} (${a.slug}): R$ ${a.withdrawal_fee}`);
    });
    
    console.log('\n✓ Migração concluída com sucesso!');
  } catch (error) {
    console.error('✗ Erro na migração:', error.message);
    process.exit(1);
  }
}

migrate();
