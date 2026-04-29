-- Script para adicionar CEO ao admin_team
-- O usuário já deve existir na tabela profiles

-- Primeiro, verificar se o usuário existe
-- SELECT id, email, name FROM profiles WHERE email = 'elicecontadodiscord@gmail.com';

-- Adicionar o usuário como CEO no admin_team
INSERT INTO admin_team (user_id, role, permissions, is_active)
SELECT 
  id as user_id,
  'ceo' as role,
  '{"all": true}' as permissions,
  true as is_active
FROM profiles 
WHERE email = 'elicecontadodiscord@gmail.com'
ON CONFLICT DO NOTHING;

-- Verificar se foi adicionado
-- SELECT at.*, p.email, p.name 
-- FROM admin_team at 
-- JOIN profiles p ON p.id = at.user_id 
-- WHERE p.email = 'elicecontadodiscord@gmail.com';
