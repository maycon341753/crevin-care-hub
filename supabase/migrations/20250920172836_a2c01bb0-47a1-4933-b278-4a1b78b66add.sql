-- Primeiro, vamos limpar qualquer usuário existente com esse email
DELETE FROM auth.users WHERE email = 'desenvolvedor@crevin.com.br';

-- Verificar se as tabelas existem e recriar se necessário
DO $$
BEGIN
    -- Criar tabela profiles se não existir
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        CREATE TABLE public.profiles (
          id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL UNIQUE,
          full_name TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'developer')),
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );
        
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
        
        -- Políticas RLS mais flexíveis para profiles
        CREATE POLICY "Usuários podem ver seus próprios perfis" 
        ON public.profiles FOR SELECT 
        USING (auth.uid() = user_id);

        CREATE POLICY "Usuários podem inserir seus próprios perfis" 
        ON public.profiles FOR INSERT 
        WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Usuários podem atualizar seus próprios perfis" 
        ON public.profiles FOR UPDATE 
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- Criar função para criar perfil automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'), 
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para executar a função quando novo usuário é criado
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();