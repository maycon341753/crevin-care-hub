-- Script para verificar estrutura do banco de dados e diagnosticar erro PGRST205
-- Erro: Could not find the table 'public.auth.users' - sugestão: 'public.users'

-- 1. Verificar todas as tabelas no schema public
SELECT 
    'Tabelas disponíveis no schema public:' as info;

SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Verificar se existe tabela 'users' no schema public
SELECT 
    'Verificando se existe tabela public.users:' as info;

SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'users';

-- 3. Verificar estrutura da tabela users (se existir)
SELECT 
    'Estrutura da tabela public.users (se existir):' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- 4. Verificar estrutura da tabela profiles
SELECT 
    'Estrutura da tabela public.profiles:' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 5. Verificar dados na tabela profiles
SELECT 
    'Dados na tabela public.profiles:' as info;

SELECT 
    id,
    user_id,
    email,
    full_name,
    role,
    created_at
FROM public.profiles 
ORDER BY created_at DESC
LIMIT 10;

-- 6. Verificar se existe tabela users e comparar com profiles
DO $$
DECLARE
    users_exists BOOLEAN;
    profiles_exists BOOLEAN;
BEGIN
    -- Verificar se tabela users existe
    SELECT EXISTS(
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'users'
    ) INTO users_exists;
    
    -- Verificar se tabela profiles existe
    SELECT EXISTS(
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'profiles'
    ) INTO profiles_exists;
    
    RAISE NOTICE '=== DIAGNÓSTICO DO BANCO ===';
    
    IF users_exists THEN
        RAISE NOTICE '✅ Tabela public.users EXISTE';
    ELSE
        RAISE NOTICE '❌ Tabela public.users NÃO EXISTE';
    END IF;
    
    IF profiles_exists THEN
        RAISE NOTICE '✅ Tabela public.profiles EXISTE';
    ELSE
        RAISE NOTICE '❌ Tabela public.profiles NÃO EXISTE';
    END IF;
    
    -- Sugestão baseada no erro
    IF NOT users_exists AND profiles_exists THEN
        RAISE NOTICE '💡 SOLUÇÃO: O código deve usar "profiles" em vez de "users"';
        RAISE NOTICE '💡 O erro sugere usar "public.users" mas ela não existe';
        RAISE NOTICE '💡 A tabela correta é "public.profiles"';
    ELSIF users_exists AND profiles_exists THEN
        RAISE NOTICE '💡 ATENÇÃO: Ambas as tabelas existem - verificar qual usar';
    END IF;
END $$;

-- 7. Verificar políticas RLS nas tabelas
SELECT 
    'Políticas RLS ativas:' as info;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('users', 'profiles')
ORDER BY tablename, policyname;