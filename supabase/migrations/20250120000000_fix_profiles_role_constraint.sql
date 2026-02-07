-- Migração para corrigir a constraint profiles_role_check
-- Data: 2025-01-20
-- Descrição: Permite roles 'user', 'admin', 'developer', 'manager'

-- Remover a constraint atual que está restritiva
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Adicionar a constraint correta que permite admin
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('user', 'admin', 'developer', 'manager'));