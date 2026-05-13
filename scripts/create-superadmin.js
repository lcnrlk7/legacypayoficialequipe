/**
 * Script para criar um Super Admin de teste no banco de dados
 * Execução: node --env-file-if-exists=/vercel/share/.env.project scripts/create-superadmin.js
 */

const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');

const SQL = neon(process.env.DATABASE_URL);

async function createSuperAdmin() {
  try {
    console.log('[v0] Starting Super Admin creation script...');

    const email = 'superadmin@legacypay.com';
    const password = 'SuperAdmin@2024!'; // Change this
    const name = 'Super Admin';

    // 1. Criar ou obter profile
    console.log('[v0] Creating/updating profile...');
    
    // Fazer hash da senha
    const passwordHash = await bcrypt.hash(password, 10);

    const profile = await SQL`
      INSERT INTO profiles (email, name, password_hash, is_admin, is_active)
      VALUES (${email}, ${name}, ${passwordHash}, true, true)
      ON CONFLICT (email) DO UPDATE
      SET password_hash = ${passwordHash}, is_admin = true, is_active = true
      RETURNING id, email, name
    `;

    const userId = profile[0].id;
    console.log('[v0] Profile created:', profile[0]);

    // 2. Criar entrada em admin_team como Super Admin
    console.log('[v0] Creating admin_team entry...');
    
    const adminTeam = await SQL`
      INSERT INTO admin_team (user_id, role, is_active)
      VALUES (${userId}, 'superadmin', true)
      ON CONFLICT (user_id) DO UPDATE
      SET role = 'superadmin', is_active = true
      RETURNING id, user_id, role
    `;

    console.log('[v0] Admin team entry created:', adminTeam[0]);

    // 3. Salvar credenciais em texto (apenas para referência, NÃO use em produção!)
    console.log('[v0] Recording credentials...');
    
    await SQL`
      INSERT INTO admin_credentials (user_id, password_plain, created_at)
      VALUES (${userId}, ${password}, NOW())
    `.catch(() => {
      // Tabela pode não existir, ignora erro
      console.log('[v0] Note: admin_credentials table not found, skipping credential storage');
    });

    // 4. Exibir dados
    console.log('\n==========================================');
    console.log('Super Admin Created Successfully!');
    console.log('==========================================');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`User ID: ${userId}`);
    console.log('==========================================\n');
    console.log('To access the Super Admin Dashboard:');
    console.log('1. Go to /lp-x7k9m2-internal/login');
    console.log(`2. Login with email: ${email}`);
    console.log(`3. Password: ${password}`);
    console.log('4. Navigate to /lp-x7k9m2-internal/superadmin\n');

    process.exit(0);
  } catch (error) {
    console.error('[v0] Error creating super admin:', error);
    process.exit(1);
  }
}

createSuperAdmin();
