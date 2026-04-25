-- Adicionar coluna withdrawal_fee na tabela profiles para taxa de saque personalizada por usuário
-- Padrão: NULL (usa taxa da rota - white=R$2, black=R$5)

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS withdrawal_fee DECIMAL(10,2) DEFAULT NULL;

-- Comentário explicativo
COMMENT ON COLUMN profiles.withdrawal_fee IS 'Taxa de saque personalizada em R$. NULL = usa padrão da rota (white=R$2, black=R$5)';

-- Atualizar taxa de saque nas adquirentes
UPDATE acquirers SET withdrawal_fee = 2.00 WHERE route_type = 'white' OR code = 'misticpay';
UPDATE acquirers SET withdrawal_fee = 5.00 WHERE route_type = 'black' OR code = 'medusa';
