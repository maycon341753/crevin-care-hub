-- Script para corrigir recursão infinita nas políticas RLS
-- Execute este script PRIMEIRO no SQL Editor do Supabase Dashboard

-- 1. REMOVER todas as políticas existentes que causam recursão
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can manage own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can view own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can manage own detailed profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable insert for new user profiles" ON public.profiles;

-- 2. DESABILITAR RLS temporariamente para evitar problemas
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- 3. Criar políticas simples SEM recursão
-- Política básica para profiles - permite acesso total temporariamente
CREATE POLICY "Allow all access to profiles" ON public.profiles
  FOR ALL USING (true) WITH CHECK (true);

-- Política básica para users - permite acesso total temporariamente  
CREATE POLICY "Allow all access to users" ON public.users
  FOR ALL USING (true) WITH CHECK (true);

-- Política básica para accounts
CREATE POLICY "Allow all access to accounts" ON public.accounts
  FOR ALL USING (true) WITH CHECK (true);

-- Política básica para sessions
CREATE POLICY "Allow all access to sessions" ON public.sessions
  FOR ALL USING (true) WITH CHECK (true);

-- Política básica para user_profiles
CREATE POLICY "Allow all access to user_profiles" ON public.user_profiles
  FOR ALL USING (true) WITH CHECK (true);

-- 4. REABILITAR RLS com políticas simples
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 5. Verificar se as tabelas existem e criar se necessário
-- Esta parte deve ser executada APENAS se as tabelas não existirem

-- Verificar se a tabela profiles existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        CREATE TABLE public.profiles (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
            email TEXT,
            full_name TEXT,
            role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'developer')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END
$$;

-- Trigger para atualizar updated_at (criar separadamente)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger apenas se a tabela profiles existir
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
        CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;

-- 6. Função para criar perfil automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Comentários
COMMENT ON TABLE public.profiles IS 'Perfis de usuários com políticas RLS corrigidas';
COMMENT ON POLICY "Allow all access to profiles" ON public.profiles IS 'Política temporária - permite acesso total para evitar recursão';

-- IMPORTANTE: Após executar este script, execute o create_tables_simple.sql se as tabelas não existirem