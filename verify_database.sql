-- Script para verificar o estado atual do banco de dados
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Verificar todas as tabelas existentes
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Verificar se a tabela profiles existe e sua estrutura
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 3. Verificar se a tabela users existe e sua estrutura
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- 4. Verificar quantos registros existem em cada tabela principal
SELECT 
    'profiles' as tabela,
    COUNT(*) as total_registros
FROM public.profiles
UNION ALL
SELECT 
    'users' as tabela,
    COUNT(*) as total_registros
FROM public.users
UNION ALL
SELECT 
    'departamentos' as tabela,
    COUNT(*) as total_registros
FROM public.departamentos
UNION ALL
SELECT 
    'funcionarios' as tabela,
    COUNT(*) as total_registros
FROM public.funcionarios
UNION ALL
SELECT 
    'idosos' as tabela,
    COUNT(*) as total_registros
FROM public.idosos;

-- 5. Verificar usuários no auth.users (se tiver permissão)
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at,
    last_sign_in_at
FROM auth.users
LIMIT 5;