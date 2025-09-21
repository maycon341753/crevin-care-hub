-- Script completo para criar todas as tabelas necessárias no projeto CREVIN
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Criar a tabela profiles (principal que está faltando)
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
    RAISE NOTICE 'Tabela profiles criada com sucesso!';
  ELSE
    RAISE NOTICE 'Tabela profiles já existe.';
  END IF;
END $$;

-- 2. Criar a tabela users (complementar ao auth.users)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    CREATE TABLE public.users (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      auth_user_id UUID UNIQUE,
      username TEXT UNIQUE,
      email TEXT NOT NULL UNIQUE,
      email_verified BOOLEAN NOT NULL DEFAULT false,
      phone TEXT,
      avatar_url TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
      last_login_at TIMESTAMP WITH TIME ZONE,
      login_count INTEGER NOT NULL DEFAULT 0,
      preferences JSONB DEFAULT '{}',
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );
    RAISE NOTICE 'Tabela users criada com sucesso!';
  ELSE
    RAISE NOTICE 'Tabela users já existe.';
  END IF;
END $$;

-- 3. Criar a tabela user_profiles (perfis detalhados)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN
    CREATE TABLE public.user_profiles (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
      first_name TEXT,
      last_name TEXT,
      display_name TEXT,
      bio TEXT,
      location TEXT,
      website TEXT,
      company TEXT,
      job_title TEXT,
      birth_date DATE,
      gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
      language TEXT DEFAULT 'pt-BR',
      timezone TEXT DEFAULT 'America/Sao_Paulo',
      notification_preferences JSONB DEFAULT '{"email": true, "push": true, "sms": false}',
      privacy_settings JSONB DEFAULT '{"profile_visibility": "public", "email_visibility": "private"}',
      social_links JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );
    RAISE NOTICE 'Tabela user_profiles criada com sucesso!';
  ELSE
    RAISE NOTICE 'Tabela user_profiles já existe.';
  END IF;
END $$;

-- 4. Criar a tabela departamentos
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
    ('Jovem Aprendiz', 'Programa Jovem Aprendiz'),
    ('Motorista', 'Departamento de transporte'),
    ('Pintor', 'Departamento de pintura e manutenção'),
    ('Jardinagem', 'Departamento de jardinagem'),
    ('Administradores', 'Departamento administrativo'),
    ('Diretoria', 'Diretoria da instituição'),
    ('Secretaria', 'Secretaria administrativa'),
    ('Enfermeira', 'Departamento de enfermagem'),
    ('Técnico de Enfermagem', 'Técnicos de enfermagem');
    
    RAISE NOTICE 'Tabela departamentos criada com sucesso!';
  ELSE
    RAISE NOTICE 'Tabela departamentos já existe.';
  END IF;
END $$;

-- 5. Criar a tabela funcionarios
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
    RAISE NOTICE 'Tabela funcionarios criada com sucesso!';
  ELSE
    RAISE NOTICE 'Tabela funcionarios já existe.';
  END IF;
END $$;

-- 6. Criar a tabela idosos
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
      observacoes_medicas TEXT,
      ativo BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );
    RAISE NOTICE 'Tabela idosos criada com sucesso!';
  ELSE
    RAISE NOTICE 'Tabela idosos já existe.';
  END IF;
END $$;

-- 7. Criar a tabela doacoes_dinheiro
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'doacoes_dinheiro') THEN
    CREATE TABLE public.doacoes_dinheiro (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      protocolo TEXT NOT NULL UNIQUE,
      doador_nome TEXT NOT NULL,
      doador_cpf TEXT NOT NULL,
      doador_telefone TEXT,
      doador_email TEXT,
      valor DECIMAL(10,2) NOT NULL,
      tipo_pagamento TEXT NOT NULL CHECK (tipo_pagamento IN ('PIX', 'Cartão', 'Dinheiro', 'Transferência')),
      data_doacao DATE NOT NULL DEFAULT CURRENT_DATE,
      observacoes TEXT,
      recibo_gerado BOOLEAN NOT NULL DEFAULT false,
      created_by UUID NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );
    RAISE NOTICE 'Tabela doacoes_dinheiro criada com sucesso!';
  ELSE
    RAISE NOTICE 'Tabela doacoes_dinheiro já existe.';
  END IF;
END $$;

-- 8. Criar a tabela doacoes_itens
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'doacoes_itens') THEN
    CREATE TABLE public.doacoes_itens (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      protocolo TEXT NOT NULL UNIQUE,
      doador_nome TEXT NOT NULL,
      doador_cpf TEXT NOT NULL,
      doador_telefone TEXT,
      item_nome TEXT NOT NULL,
      quantidade TEXT NOT NULL,
      categoria TEXT,
      data_doacao DATE NOT NULL DEFAULT CURRENT_DATE,
      observacoes TEXT,
      guia_gerada BOOLEAN NOT NULL DEFAULT false,
      created_by UUID NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );
    RAISE NOTICE 'Tabela doacoes_itens criada com sucesso!';
  ELSE
    RAISE NOTICE 'Tabela doacoes_itens já existe.';
  END IF;
END $$;

-- 9. Criar a tabela audit_logs
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_logs') THEN
    CREATE TABLE public.audit_logs (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL,
      action TEXT NOT NULL,
      table_name TEXT NOT NULL,
      record_id UUID,
      old_values JSONB,
      new_values JSONB,
      ip_address INET,
      user_agent TEXT,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );
    RAISE NOTICE 'Tabela audit_logs criada com sucesso!';
  ELSE
    RAISE NOTICE 'Tabela audit_logs já existe.';
  END IF;
END $$;

-- Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar triggers para updated_at
DO $$
BEGIN
  -- Trigger para profiles
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
    CREATE TRIGGER update_profiles_updated_at
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  -- Trigger para users
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
    CREATE TRIGGER update_users_updated_at
      BEFORE UPDATE ON public.users
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  -- Trigger para user_profiles
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN
    DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
    CREATE TRIGGER update_user_profiles_updated_at
      BEFORE UPDATE ON public.user_profiles
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  -- Trigger para departamentos
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'departamentos') THEN
    DROP TRIGGER IF EXISTS update_departamentos_updated_at ON public.departamentos;
    CREATE TRIGGER update_departamentos_updated_at
      BEFORE UPDATE ON public.departamentos
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  -- Trigger para funcionarios
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'funcionarios') THEN
    DROP TRIGGER IF EXISTS update_funcionarios_updated_at ON public.funcionarios;
    CREATE TRIGGER update_funcionarios_updated_at
      BEFORE UPDATE ON public.funcionarios
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  -- Trigger para idosos
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'idosos') THEN
    DROP TRIGGER IF EXISTS update_idosos_updated_at ON public.idosos;
    CREATE TRIGGER update_idosos_updated_at
      BEFORE UPDATE ON public.idosos
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  -- Trigger para doacoes_dinheiro
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'doacoes_dinheiro') THEN
    DROP TRIGGER IF EXISTS update_doacoes_dinheiro_updated_at ON public.doacoes_dinheiro;
    CREATE TRIGGER update_doacoes_dinheiro_updated_at
      BEFORE UPDATE ON public.doacoes_dinheiro
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  -- Trigger para doacoes_itens
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'doacoes_itens') THEN
    DROP TRIGGER IF EXISTS update_doacoes_itens_updated_at ON public.doacoes_itens;
    CREATE TRIGGER update_doacoes_itens_updated_at
      BEFORE UPDATE ON public.doacoes_itens
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_funcionarios_cpf ON public.funcionarios(cpf);
CREATE INDEX IF NOT EXISTS idx_funcionarios_departamento_id ON public.funcionarios(departamento_id);
CREATE INDEX IF NOT EXISTS idx_idosos_cpf ON public.idosos(cpf);
CREATE INDEX IF NOT EXISTS idx_doacoes_dinheiro_protocolo ON public.doacoes_dinheiro(protocolo);
CREATE INDEX IF NOT EXISTS idx_doacoes_itens_protocolo ON public.doacoes_itens(protocolo);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);

-- Habilitar RLS nas tabelas principais
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas para profiles
CREATE POLICY "Allow all access to profiles" ON public.profiles
  FOR ALL USING (true);

-- Políticas RLS básicas para users
CREATE POLICY "Allow all access to users" ON public.users
  FOR ALL USING (true);

-- Políticas RLS básicas para user_profiles
CREATE POLICY "Allow all access to user_profiles" ON public.user_profiles
  FOR ALL USING (true);

-- Comentários nas tabelas
COMMENT ON TABLE public.profiles IS 'Perfis básicos dos usuários';
COMMENT ON TABLE public.users IS 'Tabela principal de usuários do sistema';
COMMENT ON TABLE public.user_profiles IS 'Perfis detalhados dos usuários';
COMMENT ON TABLE public.departamentos IS 'Departamentos da instituição';
COMMENT ON TABLE public.funcionarios IS 'Funcionários da instituição';
COMMENT ON TABLE public.idosos IS 'Idosos atendidos pela instituição';
COMMENT ON TABLE public.doacoes_dinheiro IS 'Doações em dinheiro recebidas';
COMMENT ON TABLE public.doacoes_itens IS 'Doações de itens recebidas';
COMMENT ON TABLE public.audit_logs IS 'Logs de auditoria do sistema';

-- Mensagem final
DO $$
BEGIN
  RAISE NOTICE '=== SCRIPT EXECUTADO COM SUCESSO ===';
  RAISE NOTICE 'Todas as tabelas necessárias foram verificadas e criadas se necessário.';
  RAISE NOTICE 'Próximo passo: Execute o script create_dev_user_simple.sql para criar o usuário desenvolvedor.';
END $$;