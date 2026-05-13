/**
 * Script para criar as tabelas necessárias para o Super Admin Dashboard
 * Execução: node --env-file-if-exists=/vercel/share/.env.project scripts/setup-superadmin-tables.js
 */

const { neon } = require('@neondatabase/serverless');

const SQL = neon(process.env.DATABASE_URL);

async function setupTables() {
  try {
    console.log('[v0] Setting up Super Admin tables...\n');

    // 1. Criar tabela admin_credentials
    console.log('[v0] Creating admin_credentials table...');
    await SQL`
      CREATE TABLE IF NOT EXISTS admin_credentials (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        password_plain TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, created_at)
      );
      CREATE INDEX IF NOT EXISTS idx_admin_credentials_user_id ON admin_credentials(user_id);
    `;
    console.log('✓ admin_credentials table created\n');

    // 2. Criar tabela audit_logs
    console.log('[v0] Creating audit_logs table...');
    await SQL`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        target_id UUID,
        details TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON audit_logs(actor_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
    `;
    console.log('✓ audit_logs table created\n');

    // 3. Criar tabela admin_roles
    console.log('[v0] Creating admin_roles table...');
    await SQL`
      CREATE TABLE IF NOT EXISTS admin_roles (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        role VARCHAR(50) NOT NULL UNIQUE,
        permissions JSONB DEFAULT '[]',
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    console.log('✓ admin_roles table created\n');

    // 4. Atualizar admin_team se necessário
    console.log('[v0] Ensuring admin_team columns...');
    try {
      await SQL`
        ALTER TABLE admin_team 
        ADD COLUMN IF NOT EXISTS last_login_superadmin TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS permission_level VARCHAR(50) DEFAULT 'user';
      `;
      console.log('✓ admin_team columns updated\n');
    } catch (e) {
      console.log('⚠ admin_team columns may already exist\n');
    }

    console.log('==========================================');
    console.log('Super Admin tables setup completed!');
    console.log('==========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('[v0] Error setting up tables:', error);
    process.exit(1);
  }
}

setupTables();
