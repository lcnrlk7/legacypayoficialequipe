import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL nao encontrada');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function run() {
  console.log('=== BLOQUEANDO USUARIO FRAUDULENTO ===\n');
  
  console.log('1. Criando colunas de bloqueio...');
  await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false`;
  await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS block_reason TEXT`;
  await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP`;
  console.log('   OK!');
  
  console.log('2. Bloqueando usuario...');
  await sql`
    UPDATE profiles 
    SET is_blocked = true, 
        block_reason = 'Fraude - saque sem deposito real',
        blocked_at = NOW(),
        balance = 0
    WHERE id = '3ee9f41c-b8b7-4a48-bd13-f21e1f7c56cc'
  `;
  console.log('   OK!');
  
  console.log('3. Cancelando saques pendentes...');
  await sql`
    UPDATE withdrawals 
    SET status = 'cancelled', notes = 'Cancelado - Usuario bloqueado por fraude'
    WHERE user_id = '3ee9f41c-b8b7-4a48-bd13-f21e1f7c56cc' 
    AND status IN ('pending', 'processing', 'pending_approval')
  `;
  console.log('   OK!');
  
  console.log('\n4. Verificando resultado...');
  const user = await sql`SELECT name, email, is_blocked, balance FROM profiles WHERE id = '3ee9f41c-b8b7-4a48-bd13-f21e1f7c56cc'`;
  console.log('   Usuario:', user[0]?.name);
  console.log('   Email:', user[0]?.email);
  console.log('   Bloqueado:', user[0]?.is_blocked);
  console.log('   Saldo:', user[0]?.balance);
  
  const withdrawals = await sql`SELECT amount, status FROM withdrawals WHERE user_id = '3ee9f41c-b8b7-4a48-bd13-f21e1f7c56cc'`;
  console.log('   Saques:', withdrawals.map(w => `R$${w.amount} - ${w.status}`).join(', ') || 'Nenhum');
  
  console.log('\n=== USUARIO BLOQUEADO COM SUCESSO ===');
}

run().catch(console.error);
