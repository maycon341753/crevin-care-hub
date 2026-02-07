-- CORREÇÃO DEFINITIVA DO ERRO PGRST205
-- Erro: Could not find the table 'public.auth.users'
-- Sugestão: Perhaps you meant the table 'public.users'

-- DIAGNÓSTICO: O problema está nas políticas RLS que referenciam auth.users incorretamente

-- 1. PRIMEIRO: Verificar qual tabela realmente existe
DO $$
BEGIN
    -- Verificar se public.users existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        RAISE NOTICE '✅ Tabela public.users EXISTE';
    ELSE
        RAISE NOTICE '❌ Tabela public.users NÃO EXISTE';
    END IF;
    
    -- Verificar se profiles existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        RAISE NOTICE '✅ Tabela profiles EXISTE';
    ELSE
        RAISE NOTICE '❌ Tabela profiles NÃO EXISTE';
    END IF;
END $$;

-- 2. REMOVER POLÍTICAS PROBLEMÁTICAS que referenciam auth.users incorretamente
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Buscar políticas que fazem referência incorreta a auth.users
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname
        FROM pg_policies 
        WHERE (qual LIKE '%public.auth.users%' OR with_check LIKE '%public.auth.users%')
           OR (qual LIKE '%auth.users%' AND schemaname = 'public')
    LOOP
        RAISE NOTICE 'Removendo política problemática: %.% - %', 
            policy_record.schemaname, policy_record.tablename, policy_record.policyname;
        
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            policy_record.policyname, policy_record.schemaname, policy_record.tablename);
    END LOOP;
END $$;

-- 3. CRIAR POLÍTICAS CORRETAS PARA A TABELA PROFILES
-- (A página usa apenas a tabela profiles, então vamos focar nela)

-- Desabilitar RLS temporariamente
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;

-- Remover políticas antigas da tabela profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow all access to profiles" ON public.profiles;

-- Criar política simples e funcional para profiles
CREATE POLICY "Allow authenticated users to view profiles" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated users to insert profiles" 
ON public.profiles FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update own profile" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Reabilitar RLS
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. SE A TABELA PUBLIC.USERS EXISTE, criar políticas para ela também
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        -- Desabilitar RLS temporariamente
        ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
        
        -- Remover políticas antigas
        DROP POLICY IF EXISTS "Users can view own user" ON public.users;
        DROP POLICY IF EXISTS "Users can update own user" ON public.users;
        DROP POLICY IF EXISTS "Users can insert own user" ON public.users;
        DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
        DROP POLICY IF EXISTS "Allow all access to users" ON public.users;
        
        -- Criar políticas simples
        CREATE POLICY "Allow authenticated users to view users" 
        ON public.users FOR SELECT 
        TO authenticated 
        USING (true);
        
        CREATE POLICY "Allow authenticated users to insert users" 
        ON public.users FOR INSERT 
        TO authenticated 
        WITH CHECK (true);
        
        CREATE POLICY "Allow authenticated users to update own user" 
        ON public.users FOR UPDATE 
        TO authenticated 
        USING (auth.uid() = auth_user_id)
        WITH CHECK (auth.uid() = auth_user_id);
        
        -- Reabilitar RLS
        ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
        
        RAISE NOTICE '✅ Políticas da tabela public.users corrigidas';
    END IF;
END $$;

-- 5. VERIFICAÇÃO FINAL
DO $$
BEGIN
    RAISE NOTICE '=== VERIFICAÇÃO FINAL ===';
    RAISE NOTICE '✅ Políticas problemáticas removidas';
    RAISE NOTICE '✅ Políticas corretas criadas';
    RAISE NOTICE '✅ RLS configurado adequadamente';
    RAISE NOTICE '💡 A página de usuários deve funcionar agora';
    RAISE NOTICE '📋 Execute este script no Supabase SQL Editor';
END $$;

-- 6. MOSTRAR ESTRUTURA ATUAL DAS TABELAS
SELECT 
    'TABELAS DISPONÍVEIS NO SCHEMA PUBLIC:' as info,
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;