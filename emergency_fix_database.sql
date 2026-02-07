-- SCRIPT DE EMERGÊNCIA PARA RESOLVER PROBLEMAS CRÍTICOS DO BANCO
-- Execute este script IMEDIATAMENTE no SQL Editor do Supabase Dashboard
-- https://supabase.com/dashboard/project/lhgujxyfxyxzozgokutf/sql/new

-- ========================================
-- DIAGNÓSTICO INICIAL - VERIFICAR O QUE EXISTE
-- ========================================

-- Verificar se as tabelas existem
SELECT 
    '🔍 VERIFICANDO TABELAS EXISTENTES' as status,
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Verificar estrutura da tabela profiles se existir
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        RAISE NOTICE '✅ Tabela profiles existe';
        
        -- Mostrar estrutura atual
        PERFORM column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles'
        ORDER BY ordinal_position;
    ELSE
        RAISE NOTICE '❌ Tabela profiles NÃO existe - será criada';
    END IF;
END
$$;

-- ========================================
-- PASSO 1: RECRIAR TABELA PROFILES COMPLETA
-- ========================================

-- Dropar e recriar tabela profiles com estrutura completa
DROP TABLE IF EXISTS public.profiles CASCADE;

CREATE TABLE public.profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    email TEXT UNIQUE,
    full_name TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'developer', 'manager')),
    avatar_url TEXT,
    phone TEXT,
    department_id UUID,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_active ON public.profiles(active);

-- ========================================
-- PASSO 2: RECRIAR TABELA USERS PÚBLICA
-- ========================================

-- Dropar e recriar tabela users pública
DROP TABLE IF EXISTS public.users CASCADE;

CREATE TABLE public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'developer', 'manager')),
    department_id UUID,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_active ON public.users(active);

-- ========================================
-- PASSO 3: VERIFICAR/CRIAR TABELA DEPARTAMENTOS
-- ========================================

-- Criar tabela departamentos se não existir
CREATE TABLE IF NOT EXISTS public.departamentos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT UNIQUE NOT NULL,
    descricao TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir departamentos padrão
INSERT INTO public.departamentos (nome, descricao, ativo) 
VALUES 
    ('Administração', 'Departamento administrativo', true),
    ('Cuidados', 'Departamento de cuidados aos idosos', true),
    ('Manutenção', 'Departamento de manutenção', true),
    ('Limpeza', 'Departamento de limpeza', true),
    ('TI', 'Departamento de Tecnologia da Informação', true)
ON CONFLICT (nome) DO NOTHING;

-- ========================================
-- PASSO 4: CRIAR FUNÇÕES E TRIGGERS
-- ========================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_departamentos_updated_at ON public.departamentos;
CREATE TRIGGER update_departamentos_updated_at
    BEFORE UPDATE ON public.departamentos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- PASSO 5: CONFIGURAR POLÍTICAS RLS
-- ========================================

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departamentos ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas para users
DROP POLICY IF EXISTS "Users can view own user" ON public.users;
CREATE POLICY "Users can view own user" ON public.users
    FOR SELECT USING (true); -- Permitir leitura para todos por enquanto

DROP POLICY IF EXISTS "Users can insert own user" ON public.users;
CREATE POLICY "Users can insert own user" ON public.users
    FOR INSERT WITH CHECK (true); -- Permitir inserção para todos por enquanto

-- Políticas para departamentos
DROP POLICY IF EXISTS "Everyone can view departments" ON public.departamentos;
CREATE POLICY "Everyone can view departments" ON public.departamentos
    FOR SELECT USING (true);

-- ========================================
-- PASSO 6: VERIFICAÇÃO FINAL
-- ========================================

-- Verificar estrutura das tabelas criadas
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

-- Verificar estrutura da tabela users
SELECT 
    '📋 ESTRUTURA USERS' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- Contar departamentos
SELECT 
    '📊 DEPARTAMENTOS CRIADOS' as info,
    COUNT(*) as total,
    string_agg(nome, ', ') as nomes
FROM public.departamentos;

-- ========================================
-- PASSO 7: MENSAGEM DE SUCESSO
-- ========================================

SELECT 
    '🚀 BANCO DE DADOS RECRIADO!' as status,
    'Todas as tabelas foram recriadas com estrutura completa' as resultado,
    'Agora você pode criar usuários sem erros' as proximo_passo,
    NOW() as executado_em;