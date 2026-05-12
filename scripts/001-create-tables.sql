-- LegacyPay Database Schema
-- Migration 001: Create all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  cpf_cnpj VARCHAR(20) UNIQUE,
  kyc_status VARCHAR(20) DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'submitted', 'approved', 'rejected')),
  api_key VARCHAR(255) UNIQUE,
  client_id VARCHAR(255) UNIQUE,
  client_secret VARCHAR(255),
  webhook_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  balance DECIMAL(15, 2) DEFAULT 0,
  route_type VARCHAR(50) DEFAULT 'black',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_api_key ON profiles(api_key);
CREATE INDEX IF NOT EXISTS idx_profiles_client_id ON profiles(client_id);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  external_id VARCHAR(255),
  type VARCHAR(50) NOT NULL CHECK (type IN ('pix_in', 'pix_out', 'withdrawal', 'deposit', 'fee', 'refund')),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')),
  amount DECIMAL(15, 2) NOT NULL,
  fee DECIMAL(15, 2) DEFAULT 0,
  net_amount DECIMAL(15, 2),
  currency VARCHAR(3) DEFAULT 'BRL',
  description TEXT,
  payer_name VARCHAR(255),
  payer_document VARCHAR(20),
  payer_email VARCHAR(255),
  pix_key VARCHAR(255),
  pix_key_type VARCHAR(20),
  qr_code TEXT,
  qr_code_base64 TEXT,
  copy_paste TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  acquirer VARCHAR(50),
  acquirer_transaction_id VARCHAR(255),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for transactions
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_external_id ON transactions(external_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

-- Withdrawals table
CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id),
  amount DECIMAL(15, 2) NOT NULL,
  fee DECIMAL(15, 2) DEFAULT 0,
  net_amount DECIMAL(15, 2),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'rejected', 'cancelled')),
  pix_key VARCHAR(255) NOT NULL,
  pix_key_type VARCHAR(20) NOT NULL,
  recipient_name VARCHAR(255),
  recipient_document VARCHAR(20),
  bank_name VARCHAR(255),
  notes TEXT,
  admin_notes TEXT,
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for withdrawals
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_created_at ON withdrawals(created_at DESC);

-- PIX Keys table
CREATE TABLE IF NOT EXISTS pix_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  key_type VARCHAR(20) NOT NULL CHECK (key_type IN ('cpf', 'cnpj', 'email', 'phone', 'random')),
  key_value VARCHAR(255) NOT NULL,
  holder_name VARCHAR(255),
  holder_document VARCHAR(20),
  bank_name VARCHAR(255),
  is_primary BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, key_value)
);

-- Create index for pix_keys
CREATE INDEX IF NOT EXISTS idx_pix_keys_user_id ON pix_keys(user_id);

-- KYC Documents table
CREATE TABLE IF NOT EXISTS kyc_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('identity_front', 'identity_back', 'selfie', 'proof_of_address', 'company_document')),
  file_url TEXT NOT NULL,
  file_name VARCHAR(255),
  file_size INTEGER,
  mime_type VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for kyc_documents
CREATE INDEX IF NOT EXISTS idx_kyc_documents_user_id ON kyc_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_status ON kyc_documents(status);

-- Audit Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Fee Settings table
CREATE TABLE IF NOT EXISTS fee_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  fee_type VARCHAR(50) NOT NULL CHECK (fee_type IN ('pix_in', 'pix_out', 'withdrawal')),
  fee_percentage DECIMAL(5, 4) DEFAULT 0,
  fee_fixed DECIMAL(15, 2) DEFAULT 0,
  min_amount DECIMAL(15, 2) DEFAULT 0,
  max_amount DECIMAL(15, 2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, fee_type)
);

-- Create index for fee_settings
CREATE INDEX IF NOT EXISTS idx_fee_settings_user_id ON fee_settings(user_id);

-- Push Subscriptions table (for web push notifications)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for push_subscriptions
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);

-- Verification Codes table (for 2FA / phone verification)
CREATE TABLE IF NOT EXISTS verification_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  code VARCHAR(10) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('email', 'phone', 'login', 'password_reset')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for verification_codes
CREATE INDEX IF NOT EXISTS idx_verification_codes_user_id ON verification_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_codes_code ON verification_codes(code);

-- Integration Errors table (for logging external API errors)
CREATE TABLE IF NOT EXISTS integration_errors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  acquirer VARCHAR(50) NOT NULL,
  error_type VARCHAR(100),
  error_message TEXT,
  request_data JSONB,
  response_data JSONB,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for integration_errors
CREATE INDEX IF NOT EXISTS idx_integration_errors_acquirer ON integration_errors(acquirer);
CREATE INDEX IF NOT EXISTS idx_integration_errors_resolved ON integration_errors(resolved);
CREATE INDEX IF NOT EXISTS idx_integration_errors_created_at ON integration_errors(created_at DESC);

-- System Settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create default admin user (password: admin123)
-- Note: Change this password immediately in production!
INSERT INTO profiles (id, email, password_hash, name, is_admin, is_active, kyc_status, api_key, client_id, client_secret)
VALUES (
  uuid_generate_v4(),
  'admin@legacypay.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.2jZ6JlTbWEqNjG', -- admin123
  'Administrador',
  TRUE,
  TRUE,
  'approved',
  'lp_admin_' || replace(gen_random_uuid()::text, '-', ''),
  'lp_admin_' || replace(gen_random_uuid()::text, '-', ''),
  'sk_admin_' || replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')
)
ON CONFLICT (email) DO NOTHING;

-- Insert default system settings
INSERT INTO system_settings (key, value, description)
VALUES 
  ('default_pix_in_fee', '{"percentage": 0.0199, "fixed": 0}', 'Taxa padrão para PIX recebido'),
  ('default_pix_out_fee', '{"percentage": 0.0199, "fixed": 0}', 'Taxa padrão para PIX enviado'),
  ('default_withdrawal_fee', '{"percentage": 0.01, "fixed": 2.00}', 'Taxa padrão para saque'),
  ('min_withdrawal_amount', '{"value": 10.00}', 'Valor mínimo para saque'),
  ('max_withdrawal_amount', '{"value": 50000.00}', 'Valor máximo para saque'),
  ('maintenance_mode', '{"enabled": false}', 'Modo de manutenção do sistema')
ON CONFLICT (key) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN 
    SELECT table_name 
    FROM information_schema.columns 
    WHERE column_name = 'updated_at' 
    AND table_schema = 'public'
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS update_%I_updated_at ON %I;
      CREATE TRIGGER update_%I_updated_at
        BEFORE UPDATE ON %I
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    ', t, t, t, t);
  END LOOP;
END;
$$ LANGUAGE plpgsql;
