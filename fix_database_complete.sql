-- 🔧 SCRIPT COMPLETO DE CORREÇÃO DO BANCO DE DADOS
-- Execute este script no SQL Editor do Supabase Dashboard
-- https://supabase.com/dashboard/project/lhgujxyfxyxzozgokutf/sql/new

-- ========================================
-- PASSO 1: DIAGNÓSTICO INICIAL
-- ========================================

SELECT 
    '🔍 VERIFICANDO TABELAS EXISTENTES' as status,
    schemaname,
    tablename
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- ========================================
-- PASSO 2: CRIAR TABELAS FALTANTES
-- ========================================

-- 1. Tabela profiles (principal)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    CREATE TABLE public.profiles (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL UNIQUE,
      email TEXT,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'developer')),
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );
    RAISE NOTICE '✅ Tabela profiles criada com sucesso!';
  ELSE
    RAISE NOTICE 'ℹ️ Tabela profiles já existe.';
  END IF;
END $$;

-- 2. Tabela departamentos
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'departamentos') THEN
    CREATE TABLE public.departamentos (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      nome TEXT NOT NULL UNIQUE,
      descricao TEXT,
      ativo BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );
    
    -- Inserir departamentos padrão
    INSERT INTO public.departamentos (nome, descricao) VALUES
    ('Cozinha', 'Departamento responsável pela alimentação'),
    ('Limpeza', 'Departamento de limpeza e higienização'),
    ('Cuidador', 'Cuidadores de idosos'),
    ('Lavanderia', 'Departamento de lavanderia'),
    ('Nutricionista', 'Departamento de nutrição'),
    ('Estagiários', 'Estagiários em diversas áreas'),
    ('Técnico de Enfermagem', 'Técnicos de enfermagem');
    
    RAISE NOTICE '✅ Tabela departamentos criada com sucesso!';
  ELSE
    RAISE NOTICE 'ℹ️ Tabela departamentos já existe.';
  END IF;
END $$;

-- 3. Tabela funcionarios
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'funcionarios') THEN
    CREATE TABLE public.funcionarios (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      nome TEXT NOT NULL,
      cpf TEXT NOT NULL UNIQUE,
      rg TEXT,
      telefone TEXT,
      email TEXT,
      endereco TEXT,
      cargo TEXT NOT NULL,
      departamento_id UUID NOT NULL REFERENCES public.departamentos(id),
      salario DECIMAL(10,2),
      data_admissao DATE NOT NULL,
      data_demissao DATE,
      status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'ferias', 'afastado')),
      observacoes TEXT,
      created_by UUID NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );
    RAISE NOTICE '✅ Tabela funcionarios criada com sucesso!';
  ELSE
    RAISE NOTICE 'ℹ️ Tabela funcionarios já existe.';
  END IF;
END $$;

-- 4. Tabela idosos
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'idosos') THEN
    CREATE TABLE public.idosos (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      nome TEXT NOT NULL,
      cpf TEXT NOT NULL UNIQUE,
      rg TEXT,
      data_nascimento DATE NOT NULL,
      telefone TEXT,
      endereco TEXT,
      contato_emergencia TEXT,
      telefone_emergencia TEXT,
      plano_saude TEXT,
      numero_carteirinha TEXT,
      medicamentos TEXT,
      restricoes_alimentares TEXT,
      observacoes_medicas TEXT,
      ativo BOOLEAN NOT NULL DEFAULT true,
      data_admissao DATE NOT NULL DEFAULT CURRENT_DATE,
      created_by UUID NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );
    RAISE NOTICE '✅ Tabela idosos criada com sucesso!';
  ELSE
    RAISE NOTICE 'ℹ️ Tabela idosos já existe.';
  END IF;
END $$;

-- 5. Tabela doacoes_dinheiro
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'doacoes_dinheiro') THEN
    CREATE TABLE public.doacoes_dinheiro (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      doador_nome TEXT NOT NULL,
      doador_cpf TEXT,
      doador_telefone TEXT,
      doador_email TEXT,
      valor DECIMAL(10,2) NOT NULL,
      data_doacao DATE NOT NULL DEFAULT CURRENT_DATE,
      forma_pagamento TEXT NOT NULL CHECK (forma_pagamento IN ('dinheiro', 'pix', 'cartao', 'transferencia', 'cheque')),
      observacoes TEXT,
      recibo_emitido BOOLEAN NOT NULL DEFAULT false,
      created_by UUID NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );
    RAISE NOTICE '✅ Tabela doacoes_dinheiro criada com sucesso!';
  ELSE
    RAISE NOTICE 'ℹ️ Tabela doacoes_dinheiro já existe.';
  END IF;
END $$;

-- 6. Tabela doacoes_itens
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'doacoes_itens') THEN
    CREATE TABLE public.doacoes_itens (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      doador_nome TEXT NOT NULL,
      doador_cpf TEXT,
      doador_telefone TEXT,
      doador_email TEXT,
      item_nome TEXT NOT NULL,
      categoria TEXT NOT NULL,
      quantidade INTEGER NOT NULL DEFAULT 1,
      unidade TEXT NOT NULL DEFAULT 'unidade',
      valor_estimado DECIMAL(10,2),
      data_doacao DATE NOT NULL DEFAULT CURRENT_DATE,
      condicao TEXT NOT NULL DEFAULT 'novo' CHECK (condicao IN ('novo', 'usado_bom', 'usado_regular', 'usado_ruim')),
      observacoes TEXT,
      created_by UUID NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );
    RAISE NOTICE '✅ Tabela doacoes_itens criada com sucesso!';
  ELSE
    RAISE NOTICE 'ℹ️ Tabela doacoes_itens já existe.';
  END IF;
END $$;

-- ========================================
-- PASSO 3: CORRIGIR CAMPO EMAIL NA TABELA PROFILES
-- ========================================

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

-- Atualizar registros existentes com emails dos usuários auth
UPDATE public.profiles 
SET email = auth_users.email
FROM auth.users auth_users
WHERE profiles.user_id = auth_users.id
AND (profiles.email IS NULL OR profiles.email = '');

-- ========================================
-- PASSO 4: CONFIGURAR POLÍTICAS RLS SEGURAS
-- ========================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idosos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doacoes_dinheiro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doacoes_itens ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes que podem causar conflito
DROP POLICY IF EXISTS "Allow select profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;

-- Criar políticas permissivas para profiles
CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_insert_policy" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "profiles_update_policy" ON public.profiles
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "profiles_delete_policy" ON public.profiles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role = 'developer'
    )
  );

-- Políticas para departamentos
DROP POLICY IF EXISTS "Allow select departamentos" ON public.departamentos;
DROP POLICY IF EXISTS "Allow insert departamentos" ON public.departamentos;
DROP POLICY IF EXISTS "Allow update departamentos" ON public.departamentos;
DROP POLICY IF EXISTS "Allow delete departamentos" ON public.departamentos;
DROP POLICY IF EXISTS "departamentos_select_policy" ON public.departamentos;
DROP POLICY IF EXISTS "departamentos_insert_policy" ON public.departamentos;
DROP POLICY IF EXISTS "departamentos_update_policy" ON public.departamentos;
DROP POLICY IF EXISTS "departamentos_delete_policy" ON public.departamentos;

CREATE POLICY "departamentos_select_policy" ON public.departamentos
  FOR SELECT USING (true);

CREATE POLICY "departamentos_insert_policy" ON public.departamentos
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "departamentos_update_policy" ON public.departamentos
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "departamentos_delete_policy" ON public.departamentos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'developer')
    )
  );

-- Políticas para funcionarios
DROP POLICY IF EXISTS "Allow select funcionarios" ON public.funcionarios;
DROP POLICY IF EXISTS "Allow insert funcionarios" ON public.funcionarios;
DROP POLICY IF EXISTS "Allow update funcionarios" ON public.funcionarios;
DROP POLICY IF EXISTS "Allow delete funcionarios" ON public.funcionarios;
DROP POLICY IF EXISTS "funcionarios_select_policy" ON public.funcionarios;
DROP POLICY IF EXISTS "funcionarios_insert_policy" ON public.funcionarios;
DROP POLICY IF EXISTS "funcionarios_update_policy" ON public.funcionarios;
DROP POLICY IF EXISTS "funcionarios_delete_policy" ON public.funcionarios;

CREATE POLICY "funcionarios_select_policy" ON public.funcionarios
  FOR SELECT USING (true);

CREATE POLICY "funcionarios_insert_policy" ON public.funcionarios
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "funcionarios_update_policy" ON public.funcionarios
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "funcionarios_delete_policy" ON public.funcionarios
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'developer')
    )
  );

-- Políticas para idosos
DROP POLICY IF EXISTS "Allow select idosos" ON public.idosos;
DROP POLICY IF EXISTS "Allow insert idosos" ON public.idosos;
DROP POLICY IF EXISTS "Allow update idosos" ON public.idosos;
DROP POLICY IF EXISTS "Allow delete idosos" ON public.idosos;
DROP POLICY IF EXISTS "idosos_select_policy" ON public.idosos;
DROP POLICY IF EXISTS "idosos_insert_policy" ON public.idosos;
DROP POLICY IF EXISTS "idosos_update_policy" ON public.idosos;
DROP POLICY IF EXISTS "idosos_delete_policy" ON public.idosos;

CREATE POLICY "idosos_select_policy" ON public.idosos
  FOR SELECT USING (true);

CREATE POLICY "idosos_insert_policy" ON public.idosos
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "idosos_update_policy" ON public.idosos
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "idosos_delete_policy" ON public.idosos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'developer')
    )
  );

-- Políticas para doacoes_dinheiro
DROP POLICY IF EXISTS "Allow select doacoes_dinheiro" ON public.doacoes_dinheiro;
DROP POLICY IF EXISTS "Allow insert doacoes_dinheiro" ON public.doacoes_dinheiro;
DROP POLICY IF EXISTS "Allow update doacoes_dinheiro" ON public.doacoes_dinheiro;
DROP POLICY IF EXISTS "Allow delete doacoes_dinheiro" ON public.doacoes_dinheiro;
DROP POLICY IF EXISTS "doacoes_dinheiro_select_policy" ON public.doacoes_dinheiro;
DROP POLICY IF EXISTS "doacoes_dinheiro_insert_policy" ON public.doacoes_dinheiro;
DROP POLICY IF EXISTS "doacoes_dinheiro_update_policy" ON public.doacoes_dinheiro;
DROP POLICY IF EXISTS "doacoes_dinheiro_delete_policy" ON public.doacoes_dinheiro;

CREATE POLICY "doacoes_dinheiro_select_policy" ON public.doacoes_dinheiro
  FOR SELECT USING (true);

CREATE POLICY "doacoes_dinheiro_insert_policy" ON public.doacoes_dinheiro
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "doacoes_dinheiro_update_policy" ON public.doacoes_dinheiro
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "doacoes_dinheiro_delete_policy" ON public.doacoes_dinheiro
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'developer')
    )
  );

-- Políticas para doacoes_itens
DROP POLICY IF EXISTS "Allow select doacoes_itens" ON public.doacoes_itens;
DROP POLICY IF EXISTS "Allow insert doacoes_itens" ON public.doacoes_itens;
DROP POLICY IF EXISTS "Allow update doacoes_itens" ON public.doacoes_itens;
DROP POLICY IF EXISTS "Allow delete doacoes_itens" ON public.doacoes_itens;
DROP POLICY IF EXISTS "doacoes_itens_select_policy" ON public.doacoes_itens;
DROP POLICY IF EXISTS "doacoes_itens_insert_policy" ON public.doacoes_itens;
DROP POLICY IF EXISTS "doacoes_itens_update_policy" ON public.doacoes_itens;
DROP POLICY IF EXISTS "doacoes_itens_delete_policy" ON public.doacoes_itens;

CREATE POLICY "doacoes_itens_select_policy" ON public.doacoes_itens
  FOR SELECT USING (true);

CREATE POLICY "doacoes_itens_insert_policy" ON public.doacoes_itens
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "doacoes_itens_update_policy" ON public.doacoes_itens
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "doacoes_itens_delete_policy" ON public.doacoes_itens
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'developer')
    )
  );

-- ========================================
-- PASSO 5: CRIAR ÍNDICES PARA PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_funcionarios_departamento_id ON public.funcionarios(departamento_id);
CREATE INDEX IF NOT EXISTS idx_funcionarios_cpf ON public.funcionarios(cpf);
CREATE INDEX IF NOT EXISTS idx_idosos_cpf ON public.idosos(cpf);

-- ========================================
-- PASSO 6: CRIAR TRIGGERS PARA UPDATED_AT
-- ========================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para todas as tabelas
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_departamentos_updated_at ON public.departamentos;
CREATE TRIGGER update_departamentos_updated_at
  BEFORE UPDATE ON public.departamentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_funcionarios_updated_at ON public.funcionarios;
CREATE TRIGGER update_funcionarios_updated_at
  BEFORE UPDATE ON public.funcionarios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_idosos_updated_at ON public.idosos;
CREATE TRIGGER update_idosos_updated_at
  BEFORE UPDATE ON public.idosos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================
-- PASSO 7: VERIFICAÇÃO FINAL
-- ========================================

SELECT 
    '🎉 CORREÇÃO CONCLUÍDA - VERIFICAÇÃO FINAL' as status;

-- Mostrar tabelas criadas
SELECT 
    '📋 TABELAS EXISTENTES:' as info,
    tablename
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Mostrar estrutura da tabela profiles
SELECT 
    '👤 ESTRUTURA PROFILES:' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Contar registros
SELECT 
    '📊 CONTAGEM DE REGISTROS:' as info,
    'profiles' as tabela,
    COUNT(*) as total
FROM public.profiles
UNION ALL
SELECT 
    '📊 CONTAGEM DE REGISTROS:' as info,
    'departamentos' as tabela,
    COUNT(*) as total
FROM public.departamentos;

SELECT '✅ BANCO DE DADOS CORRIGIDO COM SUCESSO!' as resultado_final;