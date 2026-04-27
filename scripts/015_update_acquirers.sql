-- Migração para atualizar tabela acquirers com campos necessários
-- e adicionar a adquirente Medusa

-- Adicionar novos campos se não existirem
DO $$ 
BEGIN
  -- Adicionar fee_percentage
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'acquirers' AND column_name = 'fee_percentage') THEN
    ALTER TABLE acquirers ADD COLUMN fee_percentage DECIMAL(5,2) DEFAULT 0;
  END IF;

  -- Adicionar fixed_fee
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'acquirers' AND column_name = 'fixed_fee') THEN
    ALTER TABLE acquirers ADD COLUMN fixed_fee DECIMAL(10,2) DEFAULT 0;
  END IF;

  -- Adicionar withdrawal_fee
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'acquirers' AND column_name = 'withdrawal_fee') THEN
    ALTER TABLE acquirers ADD COLUMN withdrawal_fee DECIMAL(10,2) DEFAULT 0;
  END IF;

  -- Adicionar route_type
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'acquirers' AND column_name = 'route_type') THEN
    ALTER TABLE acquirers ADD COLUMN route_type TEXT DEFAULT 'black' CHECK (route_type IN ('white', 'black'));
  END IF;
END $$;

-- Atualizar MisticPay como rota white
UPDATE acquirers 
SET 
  route_type = 'white',
  fee_percentage = 0,
  fixed_fee = 1.50,
  withdrawal_fee = 2.00
WHERE code = 'misticpay';

-- Inserir Medusa como rota black (se não existir)
INSERT INTO acquirers (
  name, 
  code, 
  api_url,
  api_key,
  api_secret,
  is_active, 
  priority, 
  fee_percentage,
  fixed_fee,
  withdrawal_fee,
  route_type,
  config
) VALUES (
  'Medusa Payments', 
  'medusa', 
  'https://api.medusapayments.com/v1',
  '', -- A ser configurado manualmente: MEDUSA_SECRET_KEY
  '', -- A ser configurado manualmente: MEDUSA_LICENSE_KEY (necessário para saques)
  TRUE, 
  2, 
  5.00,  -- 5% de taxa
  1.00,  -- R$ 1,00 taxa fixa
  5.00,  -- R$ 5,00 taxa de saque
  'black',
  '{"version": "1.0", "note": "Configure api_key e api_secret no painel admin"}'
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  api_url = EXCLUDED.api_url,
  fee_percentage = EXCLUDED.fee_percentage,
  fixed_fee = EXCLUDED.fixed_fee,
  withdrawal_fee = EXCLUDED.withdrawal_fee,
  route_type = EXCLUDED.route_type,
  config = EXCLUDED.config;

-- Mostrar resultado
SELECT id, name, code, route_type, fee_percentage, fixed_fee, withdrawal_fee, is_active 
FROM acquirers 
ORDER BY priority;
