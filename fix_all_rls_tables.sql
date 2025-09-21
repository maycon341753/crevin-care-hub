-- Script completo para corrigir políticas RLS de todas as tabelas
-- Execute este script no SQL Editor do Supabase Dashboard

-- ========================================
-- REMOVER POLÍTICAS CONFLITANTES
-- ========================================

-- Departamentos
DROP POLICY IF EXISTS "Everyone can view departamentos" ON public.departamentos;
DROP POLICY IF EXISTS "Admins can manage departamentos" ON public.departamentos;
DROP POLICY IF EXISTS "Todos podem ver departamentos" ON public.departamentos;
DROP POLICY IF EXISTS "Apenas admins podem inserir departamentos" ON public.departamentos;
DROP POLICY IF EXISTS "Apenas admins podem atualizar departamentos" ON public.departamentos;

-- Funcionarios
DROP POLICY IF EXISTS "Allow select funcionarios" ON public.funcionarios;
DROP POLICY IF EXISTS "Allow insert funcionarios" ON public.funcionarios;
DROP POLICY IF EXISTS "Allow update funcionarios" ON public.funcionarios;
DROP POLICY IF EXISTS "Allow delete funcionarios" ON public.funcionarios;
DROP POLICY IF EXISTS "funcionarios_select_policy" ON public.funcionarios;
DROP POLICY IF EXISTS "funcionarios_insert_policy" ON public.funcionarios;
DROP POLICY IF EXISTS "funcionarios_update_policy" ON public.funcionarios;
DROP POLICY IF EXISTS "funcionarios_delete_policy" ON public.funcionarios;
DROP POLICY IF EXISTS "Authenticated users can view funcionarios" ON public.funcionarios;
DROP POLICY IF EXISTS "Admins can manage funcionarios" ON public.funcionarios;
DROP POLICY IF EXISTS "Todos podem ver funcionarios" ON public.funcionarios;
DROP POLICY IF EXISTS "Apenas admins podem inserir funcionarios" ON public.funcionarios;
DROP POLICY IF EXISTS "Apenas admins podem atualizar funcionarios" ON public.funcionarios;

-- Doações Dinheiro
DROP POLICY IF EXISTS "Authenticated users can view doacoes_dinheiro" ON public.doacoes_dinheiro;
DROP POLICY IF EXISTS "Admins can manage doacoes_dinheiro" ON public.doacoes_dinheiro;

-- Doações Itens
DROP POLICY IF EXISTS "Authenticated users can view doacoes_itens" ON public.doacoes_itens;
DROP POLICY IF EXISTS "Admins can manage doacoes_itens" ON public.doacoes_itens;

-- Idosos
DROP POLICY IF EXISTS "Authenticated users can view idosos" ON public.idosos;
DROP POLICY IF EXISTS "Admins can manage idosos" ON public.idosos;

-- ========================================
-- HABILITAR RLS EM TODAS AS TABELAS
-- ========================================

ALTER TABLE public.departamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doacoes_dinheiro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doacoes_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idosos ENABLE ROW LEVEL SECURITY;

-- ========================================
-- CRIAR POLÍTICAS PERMISSIVAS
-- ========================================

-- DEPARTAMENTOS
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
      AND role = 'developer'
    )
  );

-- FUNCIONARIOS
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
      AND role = 'developer'
    )
  );

-- DOAÇÕES DINHEIRO
CREATE POLICY "Allow select doacoes_dinheiro" ON public.doacoes_dinheiro
  FOR SELECT USING (true);

CREATE POLICY "Allow insert doacoes_dinheiro" ON public.doacoes_dinheiro
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow update doacoes_dinheiro" ON public.doacoes_dinheiro
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow delete doacoes_dinheiro" ON public.doacoes_dinheiro
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role = 'developer'
    )
  );

-- DOAÇÕES ITENS
CREATE POLICY "Allow select doacoes_itens" ON public.doacoes_itens
  FOR SELECT USING (true);

CREATE POLICY "Allow insert doacoes_itens" ON public.doacoes_itens
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow update doacoes_itens" ON public.doacoes_itens
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow delete doacoes_itens" ON public.doacoes_itens
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role = 'developer'
    )
  );

-- IDOSOS
CREATE POLICY "Allow select idosos" ON public.idosos
  FOR SELECT USING (true);

CREATE POLICY "Allow insert idosos" ON public.idosos
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow update idosos" ON public.idosos
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow delete idosos" ON public.idosos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role = 'developer'
    )
  );

-- ========================================
-- VERIFICAÇÕES E TESTES
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '=== POLÍTICAS RLS ATUALIZADAS COM SUCESSO ===';
    RAISE NOTICE 'Todas as tabelas agora permitem:';
    RAISE NOTICE '- SELECT: Todos podem visualizar';
    RAISE NOTICE '- INSERT: Usuários autenticados podem inserir';
    RAISE NOTICE '- UPDATE: Usuários autenticados podem atualizar';
    RAISE NOTICE '- DELETE: Apenas developers podem deletar';
    RAISE NOTICE '';
    RAISE NOTICE 'Tabelas atualizadas:';
    RAISE NOTICE '- departamentos';
    RAISE NOTICE '- funcionarios';
    RAISE NOTICE '- doacoes_dinheiro';
    RAISE NOTICE '- doacoes_itens';
    RAISE NOTICE '- idosos';
END $$;

-- Testes de acesso às tabelas
SELECT 'Teste departamentos' as tabela, COUNT(*) as total FROM public.departamentos
UNION ALL
SELECT 'Teste funcionarios' as tabela, COUNT(*) as total FROM public.funcionarios
UNION ALL
SELECT 'Teste doacoes_dinheiro' as tabela, COUNT(*) as total FROM public.doacoes_dinheiro
UNION ALL
SELECT 'Teste doacoes_itens' as tabela, COUNT(*) as total FROM public.doacoes_itens
UNION ALL
SELECT 'Teste idosos' as tabela, COUNT(*) as total FROM public.idosos;