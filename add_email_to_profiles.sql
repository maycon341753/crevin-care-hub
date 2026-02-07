-- Adicionar campo email à tabela profiles
-- Este script resolve o erro PGRST205 adicionando o campo email necessário
-- Versão corrigida para evitar conflitos com políticas RLS existentes

-- 1. Verificar se a coluna email já existe
DO $$
BEGIN
    -- Adicionar coluna email se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'email'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN email TEXT;
        RAISE NOTICE '✅ Coluna email adicionada à tabela profiles';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna email já existe na tabela profiles';
    END IF;
END $$;

-- 2. Atualizar registros existentes com emails dos usuários auth
UPDATE public.profiles 
SET email = auth_users.email
FROM auth.users auth_users
WHERE profiles.user_id = auth_users.id
AND (profiles.email IS NULL OR profiles.email = '');

-- 3. Criar índice para melhor performance (se não existir)
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 4. Comentário na coluna
COMMENT ON COLUMN public.profiles.email IS 'Email do usuário sincronizado com auth.users';

-- 5. Verificar se a atualização funcionou
SELECT 
    'Verificação dos perfis atualizados:' as status;

SELECT 
    p.id,
    p.user_id,
    p.email,
    p.full_name,
    p.role,
    p.created_at
FROM public.profiles p
ORDER BY p.created_at DESC
LIMIT 5;

-- 6. Mostrar estatísticas
SELECT 
    'Estatísticas da tabela profiles:' as status;

SELECT 
    COUNT(*) as total_profiles,
    COUNT(email) as profiles_with_email,
    COUNT(*) - COUNT(email) as profiles_without_email
FROM public.profiles;

-- 7. Verificar estrutura da tabela
SELECT 
    'Estrutura atual da tabela profiles:' as status;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;