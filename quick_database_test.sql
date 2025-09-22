-- TESTE RÁPIDO DE CONEXÃO E ESTRUTURA DO BANCO
-- Execute este script no Supabase SQL Editor para diagnóstico básico

-- 1. Teste básico de conexão
SELECT 'Conexão com banco estabelecida com sucesso!' as status;

-- 2. Verificar versão do PostgreSQL
SELECT version() as postgres_version;

-- 3. Listar todas as tabelas no schema public
SELECT 
    'TABELAS DISPONÍVEIS:' as info,
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 4. Verificar especificamente as tabelas mencionadas no erro
SELECT 
    CASE 
        WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') 
        THEN '✅ Tabela public.users EXISTE'
        ELSE '❌ Tabela public.users NÃO EXISTE'
    END as users_status;

SELECT 
    CASE 
        WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') 
        THEN '✅ Tabela public.profiles EXISTE'
        ELSE '❌ Tabela public.profiles NÃO EXISTE'
    END as profiles_status;

-- 5. Se profiles existe, mostrar estrutura básica
SELECT 
    'ESTRUTURA DA TABELA PROFILES:' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 6. Contar registros nas tabelas (se existirem)
DO $$
DECLARE
    profiles_count INTEGER := 0;
    users_count INTEGER := 0;
BEGIN
    -- Contar profiles
    IF EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        SELECT COUNT(*) INTO profiles_count FROM public.profiles;
        RAISE NOTICE 'Registros na tabela profiles: %', profiles_count;
    END IF;
    
    -- Contar users
    IF EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        SELECT COUNT(*) INTO users_count FROM public.users;
        RAISE NOTICE 'Registros na tabela users: %', users_count;
    END IF;
    
    -- Diagnóstico final
    RAISE NOTICE '=== DIAGNÓSTICO COMPLETO ===';
    RAISE NOTICE 'Se você vê esta mensagem, a conexão está funcionando!';
    RAISE NOTICE 'Execute o script fix_pgrst205_final.sql para corrigir o erro PGRST205';
END $$;