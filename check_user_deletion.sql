-- VERIFICAR SE O USUÁRIO PAULO REIS FOI REALMENTE EXCLUÍDO
-- Execute este script no SQL Editor do Supabase Dashboard

-- ========================================
-- VERIFICAR NA TABELA PROFILES
-- ========================================

SELECT 
    '🔍 VERIFICANDO TABELA PROFILES' as info,
    id,
    user_id,
    email,
    full_name,
    role,
    created_at
FROM public.profiles 
WHERE full_name ILIKE '%Paulo Reis%' 
   OR email ILIKE '%pauloreis%';

-- ========================================
-- VERIFICAR NA TABELA USERS PÚBLICA
-- ========================================

SELECT 
    '🔍 VERIFICANDO TABELA USERS PÚBLICA' as info,
    id,
    email,
    name,
    role,
    created_at
FROM public.users 
WHERE name ILIKE '%Paulo Reis%' 
   OR email ILIKE '%pauloreis%';

-- ========================================
-- VERIFICAR NO AUTH.USERS
-- ========================================

SELECT 
    '🔍 VERIFICANDO AUTH.USERS' as info,
    id,
    email,
    created_at,
    email_confirmed_at,
    raw_user_meta_data
FROM auth.users 
WHERE email ILIKE '%pauloreis%'
   OR raw_user_meta_data->>'full_name' ILIKE '%Paulo Reis%';

-- ========================================
-- CONTAR TOTAL DE USUÁRIOS EM CADA TABELA
-- ========================================

SELECT 
    '📊 TOTAL PROFILES' as tabela,
    COUNT(*) as total_usuarios
FROM public.profiles;

SELECT 
    '📊 TOTAL USERS PÚBLICA' as tabela,
    COUNT(*) as total_usuarios
FROM public.users;

SELECT 
    '📊 TOTAL AUTH.USERS' as tabela,
    COUNT(*) as total_usuarios
FROM auth.users;