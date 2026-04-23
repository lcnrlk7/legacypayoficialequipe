-- Adicionar coluna acquirer_withdrawal_id na tabela withdrawals
-- Esta coluna armazena o ID da transação de saque no gateway de pagamento

ALTER TABLE withdrawals 
ADD COLUMN IF NOT EXISTS acquirer_withdrawal_id VARCHAR(255);

-- Adicionar coluna approved_at para registrar quando o saque foi aprovado
ALTER TABLE withdrawals 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;

-- Criar índice para buscar saques pelo ID do gateway
CREATE INDEX IF NOT EXISTS idx_withdrawals_acquirer_id ON withdrawals(acquirer_withdrawal_id);
