import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

async function createAdmin() {
  try {
    const sql = neon(process.env.DATABASE_URL || '');
    
    const email = 'ilove@gmail.com';
    const password = '@Pipoca02';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Verificar se já existe
    const existing = await sql('SELECT id FROM admin_team WHERE email = $1', [email]);
    
    if (existing.length > 0) {
      console.log('Admin já existe, atualizando...');
      await sql('UPDATE admin_team SET password = $1, role = $2 WHERE email = $3', 
        [hashedPassword, 'super_admin', email]);
    } else {
      console.log('Criando novo admin...');
      await sql('INSERT INTO admin_team (email, password, role, name, status) VALUES ($1, $2, $3, $4, $5)',
        [email, hashedPassword, 'super_admin', 'Super Admin', 'active']);
    }
    
    console.log('✅ Admin criado com sucesso!');
    console.log('Email:', email);
    console.log('Senha:', password);
    
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

createAdmin().then(() => process.exit(0));
