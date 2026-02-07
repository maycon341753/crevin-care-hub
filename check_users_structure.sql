-- VERIFICAR ESTRUTURA DA TABELA PUBLIC.USERS
-- Para identificar o nome correto da coluna de ID do usuário

-- 1. Verificar se a tabela existe
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') 
        THEN '✅ Tabela public.users EXISTE'
        ELSE '❌ Tabela public.users NÃO EXISTE'
    END as status_tabela;

-- 2. Mostrar estrutura completa da tabela users (se existir)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- 3. Verificar se existe coluna relacionada ao auth.uid()
SELECT 
    column_name,
    data_type,
    'Possível coluna de ID do usuário' as observacao
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users'
  AND (column_name ILIKE '%user%id%' 
       OR column_name ILIKE '%auth%' 
       OR column_name = 'id'
       OR column_name = 'user_id'
       OR column_name = 'auth_id'
       OR column_name = 'uuid');

-- 4. Verificar estrutura da tabela profiles também
SELECT 
    'ESTRUTURA DA TABELA PROFILES:' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 5. Mostrar todas as tabelas no schema public
SELECT 
    'TODAS AS TABELAS NO SCHEMA PUBLIC:' as info,
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;