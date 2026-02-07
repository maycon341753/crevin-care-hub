-- SCRIPT PARA REMOVER USUÁRIO ESPECÍFICO
-- Remove o usuário com ID: c9299492-5812-41bc-b60e-a231eab6c5bd
-- Execute no SQL Editor do Supabase Dashboard

-- ========================================
-- VERIFICAR USUÁRIO ANTES DA REMOÇÃO
-- ========================================

-- Verificar se existe no auth.users
SELECT 
    '🔍 VERIFICANDO NO AUTH.USERS' as info,
    id,
    email,
    created_at,
    email_confirmed_at
FROM auth.users 
WHERE id = 'c9299492-5812-41bc-b60e-a231eab6c5bd';

-- Verificar se existe na tabela profiles
SELECT 
    '🔍 VERIFICANDO NA TABELA PROFILES' as info,
    user_id,
    email,
    full_name,
    role
FROM public.profiles 
WHERE user_id = 'c9299492-5812-41bc-b60e-a231eab6c5bd';

-- Verificar se existe na tabela users
SELECT 
    '🔍 VERIFICANDO NA TABELA USERS' as info,
    id,
    email,
    name,
    role
FROM public.users 
WHERE id = 'c9299492-5812-41bc-b60e-a231eab6c5bd';

-- ========================================
-- REMOVER USUÁRIO DE TODAS AS TABELAS
-- ========================================

-- 1. Remover da tabela profiles (se existir)
DELETE FROM public.profiles 
WHERE user_id = 'c9299492-5812-41bc-b60e-a231eab6c5bd';

-- 2. Remover da tabela users (se existir)
DELETE FROM public.users 
WHERE id = 'c9299492-5812-41bc-b60e-a231eab6c5bd';

-- 3. Remover do auth.users (se existir)
-- NOTA: Este comando pode falhar se não tivermos permissão
-- Neste caso, remova manualmente pelo Dashboard: Authentication > Users
DELETE FROM auth.users 
WHERE id = 'c9299492-5812-41bc-b60e-a231eab6c5bd';

-- ========================================
-- VERIFICAÇÃO FINAL
-- ========================================

-- Verificar se foi removido completamente
SELECT 
    '✅ VERIFICAÇÃO FINAL - AUTH.USERS' as info,
    COUNT(*) as usuarios_encontrados
FROM auth.users 
WHERE id = 'c9299492-5812-41bc-b60e-a231eab6c5bd';

SELECT 
    '✅ VERIFICAÇÃO FINAL - PROFILES' as info,
    COUNT(*) as profiles_encontrados
FROM public.profiles 
WHERE user_id = 'c9299492-5812-41bc-b60e-a231eab6c5bd';

SELECT 
    '✅ VERIFICAÇÃO FINAL - USERS' as info,
    COUNT(*) as users_encontrados
FROM public.users 
WHERE id = 'c9299492-5812-41bc-b60e-a231eab6c5bd';

-- ========================================
-- MENSAGEM FINAL
-- ========================================

SELECT 
    '🗑️ USUÁRIO REMOVIDO' as status,
    'ID: c9299492-5812-41bc-b60e-a231eab6c5bd' as usuario_id,
    'Removido de todas as tabelas' as resultado,
    'Agora você pode criar um novo usuário limpo' as proximo_passo;