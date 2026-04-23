-- Atualizar License Key da Medusa para permitir saques automáticos
UPDATE acquirers 
SET api_secret = 'lic_6ed30e4bb4b87b4daa17bc9b6a19cdc5',
    updated_at = NOW()
WHERE code = 'medusa';

-- Verificar se foi atualizado
SELECT id, name, code, api_key, api_secret, is_active, withdrawal_enabled 
FROM acquirers 
WHERE code = 'medusa';
