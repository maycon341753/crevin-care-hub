-- Script para criar usuário desenvolvedor no Supabase
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Primeiro, verificar se o usuário já existe e deletar se necessário
DELETE FROM auth.users WHERE email = 'desenvolvedor@crevin.com.br';

-- 2. Criar o usuário na tabela auth.users
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'desenvolvedor@crevin.com.br',
  crypt('Dev@2025!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Desenvolvedor CREVIN"}',
  false,
  'authenticated'
)
RETURNING id, email;

-- 2. Criar perfil na tabela profiles (será criado automaticamente pelo trigger)
-- O trigger handle_new_user() já está configurado para criar o perfil automaticamente

-- 3. Verificar se o usuário foi criado corretamente
SELECT 
  u.id,
  u.email,
  u.created_at,
  p.full_name,
  p.role,
  p.created_at as profile_created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE u.email = 'desenvolvedor@crevin.com.br';

-- CREDENCIAIS DE ACESSO:
-- Email: desenvolvedor@crevin.com.br
-- Senha: Dev@2025!