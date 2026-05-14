const { neon } = require('@neondatabase/serverless');

async function run() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.log('DATABASE_URL nao encontrada');
    return;
  }
  
  const sql = neon(DATABASE_URL);
  
  console.log('1. Criando colunas de bloqueio...');
  await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false`;
  await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS block_reason TEXT`;
  await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP`;
  console.log('   Colunas criadas!');
  
  console.log('2. Bloqueando usuario suspeito...');
  await sql`
    UPDATE profiles 
    SET is_blocked = true, 
        block_reason = 'Usuario suspeito - saque fraudulento',
        blocked_at = NOW(),
        balance = 0
    WHERE id = '3ee9f41c-b8b7-4a48-bd13-f21e1f7c56cc'
  `;
  console.log('   Usuario bloqueado!');
  
  console.log('3. Cancelando saques pendentes...');
  await sql`
    UPDATE withdrawals 
    SET status = 'cancelled', notes = 'Cancelado - Usuario bloqueado por fraude'
    WHERE user_id = '3ee9f41c-b8b7-4a48-bd13-f21e1f7c56cc' 
    AND status IN ('pending', 'processing', 'pending_approval')
  `;
  console.log('   Saques cancelados!');
  
  console.log('4. Verificando resultado...');
  const user = await sql`SELECT name, email, is_blocked, balance FROM profiles WHERE id = '3ee9f41c-b8b7-4a48-bd13-f21e1f7c56cc'`;
  console.log('   Usuario:', user[0]?.name, '| Email:', user[0]?.email, '| Bloqueado:', user[0]?.is_blocked, '| Saldo:', user[0]?.balance);
  
  const withdrawals = await sql`SELECT id, amount, status FROM withdrawals WHERE user_id = '3ee9f41c-b8b7-4a48-bd13-f21e1f7c56cc'`;
  console.log('   Saques:', withdrawals.map(w => w.amount + ' - ' + w.status).join(', '));
  
  console.log('\n=== USUARIO BLOQUEADO COM SUCESSO ===');
}

run().catch(console.error);
