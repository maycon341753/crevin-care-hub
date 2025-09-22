-- Script para corrigir a constraint profiles_role_check
-- Este script deve ser executado diretamente no Supabase

-- 1. Primeiro, vamos ver a constraint atual
SELECT conname, pg_get_constraintdef(oid) as definition 
FROM pg_constraint 
WHERE conname = 'profiles_role_check';

-- 2. Remover a constraint atual
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 3. Adicionar a constraint correta que permite admin
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('user', 'admin', 'developer', 'manager'));

-- 4. Verificar se a constraint foi criada corretamente
SELECT conname, pg_get_constraintdef(oid) as definition 
FROM pg_constraint 
WHERE conname = 'profiles_role_check';

-- 5. Teste rápido - inserir e remover um usuário admin
INSERT INTO profiles (id, email, full_name, role, active, status) 
VALUES (gen_random_uuid(), 'test_admin@test.com', 'Test Admin', 'admin', true, 'active');

-- Remover o teste
DELETE FROM profiles WHERE email = 'test_admin@test.com';