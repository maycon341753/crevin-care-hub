-- DIAGNÓSTICO COMPLETO DO BANCO DE DADOS SUPABASE
-- Execute este script no SQL Editor do Supabase Dashboard
-- https://supabase.com/dashboard/project/lhgujxyfxyxzozgokutf/sql/new

-- ========================================
-- 1. VERIFICAR TODAS AS TABELAS EXISTENTES
-- ========================================
SELECT 
    'TABELAS EXISTENTES' as secao,
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- ========================================
-- 2. VERIFICAR ESTRUTURA DA TABELA PROFILES
-- ========================================
SELECT 
    'ESTRUTURA PROFILES' as secao,
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- ========================================
-- 3. VERIFICAR ESTRUTURA DA TABELA USERS
-- ========================================
SELECT 
    'ESTRUTURA USERS' as secao,
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- ========================================
-- 4. VERIFICAR TODAS AS COLUNAS DE TODAS AS TABELAS
-- ========================================
SELECT 
    'TODAS AS COLUNAS' as secao,
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- ========================================
-- 5. CONTAR REGISTROS EM CADA TABELA
-- ========================================
-- Profiles
SELECT 
    'CONTAGEM PROFILES' as secao,
    COUNT(*) as total_registros,
    'profiles' as tabela
FROM public.profiles;

-- Users públicos
SELECT 
    'CONTAGEM USERS' as secao,
    COUNT(*) as total_registros,
    'users' as tabela
FROM public.users;

-- Departamentos
SELECT 
    'CONTAGEM DEPARTAMENTOS' as secao,
    COUNT(*) as total_registros,
    'departamentos' as tabela
FROM public.departamentos;

-- ========================================
-- 6. VERIFICAR USUÁRIOS DE AUTENTICAÇÃO (se permitido)
-- ========================================
SELECT 
    'USUARIOS AUTH' as secao,
    id,
    email,
    created_at,
    email_confirmed_at,
    last_sign_in_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- ========================================
-- 7. VERIFICAR POLÍTICAS RLS
-- ========================================
SELECT 
    'POLITICAS RLS' as secao,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ========================================
-- 8. VERIFICAR ÍNDICES
-- ========================================
SELECT 
    'INDICES' as secao,
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ========================================
-- 9. VERIFICAR TRIGGERS
-- ========================================
SELECT 
    'TRIGGERS' as secao,
    trigger_schema,
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ========================================
-- 10. VERIFICAR FUNÇÕES PERSONALIZADAS
-- ========================================
SELECT 
    'FUNCOES' as secao,
    routine_name,
    routine_type,
    data_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- ========================================
-- RESUMO FINAL
-- ========================================
SELECT 
    'RESUMO FINAL' as secao,
    'Diagnóstico completo executado com sucesso!' as status,
    NOW() as executado_em;