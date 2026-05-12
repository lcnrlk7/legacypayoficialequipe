-- Adicionar colunas para sistema de lembretes na tabela bot_transactions
ALTER TABLE bot_transactions 
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP;

-- Adicionar colunas para sistema de lembretes na tabela bot_users
ALTER TABLE bot_users 
ADD COLUMN IF NOT EXISTS last_reminder_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS low_balance_alert_at TIMESTAMP;

-- Criar indice para melhorar performance das queries de lembrete
CREATE INDEX IF NOT EXISTS idx_bot_transactions_pending_reminder 
ON bot_transactions (status, type, created_at, reminder_sent) 
WHERE status = 'pending' AND type = 'deposit';

CREATE INDEX IF NOT EXISTS idx_bot_users_inactive 
ON bot_users (is_active, updated_at, last_reminder_at) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_bot_users_low_balance 
ON bot_users (is_active, balance, low_balance_alert_at) 
WHERE is_active = true;
