-- Configuração de Row Level Security (RLS) para as tabelas
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Habilitar RLS nas tabelas principais
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 2. Políticas para tabela profiles
-- Usuários podem ver e editar apenas seu próprio perfil
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Admins e desenvolvedores podem ver todos os perfis
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'developer')
    )
  );

-- 3. Políticas para tabela users
-- Usuários podem ver apenas seus próprios dados
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = auth_user_id);

-- Admins podem ver todos os usuários
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'developer')
    )
  );

-- 4. Políticas para tabela accounts
-- Usuários podem gerenciar apenas suas próprias contas
CREATE POLICY "Users can manage own accounts" ON public.accounts
  FOR ALL USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

-- 5. Políticas para tabela sessions
-- Usuários podem ver apenas suas próprias sessões
CREATE POLICY "Users can view own sessions" ON public.sessions
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

-- Usuários podem atualizar suas próprias sessões
CREATE POLICY "Users can update own sessions" ON public.sessions
  FOR UPDATE USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

-- 6. Políticas para tabela user_profiles
-- Usuários podem gerenciar apenas seu próprio perfil detalhado
CREATE POLICY "Users can manage own detailed profile" ON public.user_profiles
  FOR ALL USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

-- 7. Políticas para outras tabelas do sistema (funcionários, doações, etc.)
-- Apenas usuários autenticados podem ver dados
CREATE POLICY "Authenticated users can view funcionarios" ON public.funcionarios
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view doacoes_dinheiro" ON public.doacoes_dinheiro
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view doacoes_itens" ON public.doacoes_itens
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view idosos" ON public.idosos
  FOR SELECT USING (auth.role() = 'authenticated');

-- Apenas admins e desenvolvedores podem inserir/atualizar/deletar
CREATE POLICY "Admins can manage funcionarios" ON public.funcionarios
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'developer')
    )
  );

CREATE POLICY "Admins can manage doacoes_dinheiro" ON public.doacoes_dinheiro
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'developer')
    )
  );

CREATE POLICY "Admins can manage doacoes_itens" ON public.doacoes_itens
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'developer')
    )
  );

CREATE POLICY "Admins can manage idosos" ON public.idosos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'developer')
    )
  );

-- 8. Habilitar RLS nas tabelas existentes
ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doacoes_dinheiro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doacoes_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idosos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departamentos ENABLE ROW LEVEL SECURITY;

-- Política para departamentos (todos podem ver, apenas admins podem modificar)
CREATE POLICY "Everyone can view departamentos" ON public.departamentos
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage departamentos" ON public.departamentos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'developer')
    )
  );

-- 9. Função auxiliar para verificar se usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'developer')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Política para permitir inserção de novos perfis (trigger handle_new_user)
CREATE POLICY "Enable insert for new user profiles" ON public.profiles
  FOR INSERT WITH CHECK (true);

-- Comentários sobre as políticas
COMMENT ON POLICY "Users can view own profile" ON public.profiles IS 'Usuários podem ver apenas seu próprio perfil';
COMMENT ON POLICY "Admins can view all profiles" ON public.profiles IS 'Administradores podem ver todos os perfis';
COMMENT ON FUNCTION public.is_admin() IS 'Função auxiliar para verificar se o usuário atual é administrador';