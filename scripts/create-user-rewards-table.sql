-- Tabela para rastrear recompensas entregues aos usuarios
CREATE TABLE IF NOT EXISTS user_rewards_delivered (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  goal_value INTEGER NOT NULL,
  goal_label VARCHAR(50) NOT NULL,
  reward_name VARCHAR(100) NOT NULL,
  delivered_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_by VARCHAR(255), -- email do admin que marcou como entregue
  notes TEXT, -- observacoes opcionais
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Garantir que cada usuario so recebe cada recompensa uma vez
  UNIQUE(user_id, goal_value)
);

-- Indice para buscar recompensas por usuario
CREATE INDEX IF NOT EXISTS idx_user_rewards_user_id ON user_rewards_delivered(user_id);

-- Indice para buscar por data de entrega
CREATE INDEX IF NOT EXISTS idx_user_rewards_delivered_at ON user_rewards_delivered(delivered_at DESC);
