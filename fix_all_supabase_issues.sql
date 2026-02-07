-- SCRIPT COMPLETO PARA RESOLVER TODOS OS PROBLEMAS DO SUPABASE
-- Execute este script no SQL Editor do Supabase Dashboard
-- https://supabase.com/dashboard/project/lhgujxyfxyxzozgokutf/sql/new

-- ========================================
-- PASSO 1: CORRIGIR ESTRUTURA DA TABELA PROFILES
-- ========================================

-- Adicionar coluna email se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'email'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN email TEXT;
        RAISE NOTICE '✅ Coluna email adicionada à tabela profiles';
    ELSE
        RAISE NOTICE '✅ Coluna email já existe na tabela profiles';
    END IF;
END
$$;

-- Adicionar coluna full_name se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'full_name'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
        RAISE NOTICE '✅ Coluna full_name adicionada à tabela profiles';
    ELSE
        RAISE NOTICE '✅ Coluna full_name já existe na tabela profiles';
    END IF;
END
$$;

-- Adicionar coluna role se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'role'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'user';
        RAISE NOTICE '✅ Coluna role adicionada à tabela profiles';
    ELSE
        RAISE NOTICE '✅ Coluna role já existe na tabela profiles';
    END IF;
END
$$;

-- Adicionar coluna updated_at se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE '✅ Coluna updated_at adicionada à tabela profiles';
    ELSE
        RAISE NOTICE '✅ Coluna updated_at já existe na tabela profiles';
    END IF;
END
$$;

-- ========================================
-- PASSO 2: CRIAR ÍNDICES PARA PERFORMANCE
-- ========================================

-- Índice para email na tabela profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Índice para user_id na tabela profiles
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- Índice para role na tabela profiles
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- ========================================
-- PASSO 3: CRIAR TRIGGER PARA UPDATED_AT
-- ========================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- PASSO 4: CONFIGURAR POLÍTICAS RLS BÁSICAS
-- ========================================

-- Habilitar RLS na tabela profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam seus próprios perfis
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

-- Política para permitir que usuários atualizem seus próprios perfis
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Política para permitir inserção de novos perfis
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ========================================
-- PASSO 5: INSERIR DADOS PADRÃO NOS DEPARTAMENTOS
-- ========================================

-- Inserir departamentos padrão se não existirem
INSERT INTO public.departamentos (nome, descricao, ativo) 
VALUES 
    ('Administração', 'Departamento administrativo', true),
    ('Cuidados', 'Departamento de cuidados aos idosos', true),
    ('Manutenção', 'Departamento de manutenção', true),
    ('Limpeza', 'Departamento de limpeza', true)
ON CONFLICT (nome) DO NOTHING;

-- ========================================
-- PASSO 6: VERIFICAR ESTRUTURA FINAL
-- ========================================

-- Mostrar estrutura da tabela profiles
SELECT 
    '📋 ESTRUTURA PROFILES' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Contar registros nas tabelas principais
SELECT 
    '📊 CONTAGEM DE REGISTROS' as info,
    'profiles' as tabela,
    COUNT(*) as total
FROM public.profiles
UNION ALL
SELECT 
    '📊 CONTAGEM DE REGISTROS' as info,
    'departamentos' as tabela,
    COUNT(*) as total
FROM public.departamentos
UNION ALL
SELECT 
    '📊 CONTAGEM DE REGISTROS' as info,
    'users' as tabela,
    COUNT(*) as total
FROM public.users;

-- ========================================
-- PASSO 7: MENSAGEM DE SUCESSO
-- ========================================

SELECT 
    '🎉 CORREÇÃO COMPLETA!' as status,
    'Todas as correções foram aplicadas com sucesso!' as mensagem,
    'Agora você pode criar o usuário desenvolvedor.' as proximo_passo,
    NOW() as executado_em;