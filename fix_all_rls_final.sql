-- Script FINAL para corrigir políticas RLS - Remove TODAS as políticas existentes
-- Execute este script no SQL Editor do Supabase Dashboard

-- ========================================
-- REMOVER TODAS AS POLÍTICAS EXISTENTES
-- ========================================

-- Função para remover todas as políticas de uma tabela
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Remover todas as políticas da tabela departamentos
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'departamentos' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.departamentos', policy_record.policyname);
        RAISE NOTICE 'Removida política: % da tabela departamentos', policy_record.policyname;
    END LOOP;

    -- Remover todas as políticas da tabela funcionarios
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'funcionarios' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.funcionarios', policy_record.policyname);
        RAISE NOTICE 'Removida política: % da tabela funcionarios', policy_record.policyname;
    END LOOP;

    -- Remover todas as políticas da tabela doacoes_dinheiro
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'doacoes_dinheiro' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.doacoes_dinheiro', policy_record.policyname);
        RAISE NOTICE 'Removida política: % da tabela doacoes_dinheiro', policy_record.policyname;
    END LOOP;

    -- Remover todas as políticas da tabela doacoes_itens
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'doacoes_itens' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.doacoes_itens', policy_record.policyname);
        RAISE NOTICE 'Removida política: % da tabela doacoes_itens', policy_record.policyname;
    END LOOP;

    -- Remover todas as políticas da tabela idosos
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'idosos' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.idosos', policy_record.policyname);
        RAISE NOTICE 'Removida política: % da tabela idosos', policy_record.policyname;
    END LOOP;

    RAISE NOTICE '=== TODAS AS POLÍTICAS EXISTENTES FORAM REMOVIDAS ===';
END $$;

-- Aguardar um momento para garantir que as operações foram processadas
SELECT pg_sleep(2);

-- ========================================
-- HABILITAR RLS EM TODAS AS TABELAS
-- ========================================

ALTER TABLE public.departamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doacoes_dinheiro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doacoes_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idosos ENABLE ROW LEVEL SECURITY;

-- ========================================
-- CRIAR NOVAS POLÍTICAS PERMISSIVAS
-- ========================================

-- DEPARTAMENTOS
CREATE POLICY "dept_select_2024" ON public.departamentos
  FOR SELECT USING (true);

CREATE POLICY "dept_insert_2024" ON public.departamentos
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "dept_update_2024" ON public.departamentos
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "dept_delete_2024" ON public.departamentos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role = 'developer'
    )
  );

-- FUNCIONARIOS
CREATE POLICY "func_select_2024" ON public.funcionarios
  FOR SELECT USING (true);

CREATE POLICY "func_insert_2024" ON public.funcionarios
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "func_update_2024" ON public.funcionarios
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "func_delete_2024" ON public.funcionarios
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role = 'developer'
    )
  );

-- DOAÇÕES DINHEIRO
CREATE POLICY "doacoes_din_select_2024" ON public.doacoes_dinheiro
  FOR SELECT USING (true);

CREATE POLICY "doacoes_din_insert_2024" ON public.doacoes_dinheiro
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "doacoes_din_update_2024" ON public.doacoes_dinheiro
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "doacoes_din_delete_2024" ON public.doacoes_dinheiro
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role = 'developer'
    )
  );

-- DOAÇÕES ITENS
CREATE POLICY "doacoes_itens_select_2024" ON public.doacoes_itens
  FOR SELECT USING (true);

CREATE POLICY "doacoes_itens_insert_2024" ON public.doacoes_itens
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "doacoes_itens_update_2024" ON public.doacoes_itens
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "doacoes_itens_delete_2024" ON public.doacoes_itens
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role = 'developer'
    )
  );

-- IDOSOS
CREATE POLICY "idosos_select_2024" ON public.idosos
  FOR SELECT USING (true);

CREATE POLICY "idosos_insert_2024" ON public.idosos
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "idosos_update_2024" ON public.idosos
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "idosos_delete_2024" ON public.idosos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role = 'developer'
    )
  );

-- ========================================
-- VERIFICAÇÕES E TESTES FINAIS
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '=== POLÍTICAS RLS CRIADAS COM SUCESSO ===';
    RAISE NOTICE 'Todas as tabelas agora permitem:';
    RAISE NOTICE '- SELECT: Todos podem visualizar (políticas *_select_2024)';
    RAISE NOTICE '- INSERT: Usuários autenticados podem inserir (políticas *_insert_2024)';
    RAISE NOTICE '- UPDATE: Usuários autenticados podem atualizar (políticas *_update_2024)';
    RAISE NOTICE '- DELETE: Apenas developers podem deletar (políticas *_delete_2024)';
    RAISE NOTICE '';
    RAISE NOTICE 'Tabelas configuradas:';
    RAISE NOTICE '- departamentos (políticas dept_*)';
    RAISE NOTICE '- funcionarios (políticas func_*)';
    RAISE NOTICE '- doacoes_dinheiro (políticas doacoes_din_*)';
    RAISE NOTICE '- doacoes_itens (políticas doacoes_itens_*)';
    RAISE NOTICE '- idosos (políticas idosos_*)';
END $$;

-- Teste de acesso às tabelas
SELECT 'Teste departamentos' as tabela, COUNT(*) as total FROM public.departamentos
UNION ALL
SELECT 'Teste funcionarios' as tabela, COUNT(*) as total FROM public.funcionarios
UNION ALL
SELECT 'Teste doacoes_dinheiro' as tabela, COUNT(*) as total FROM public.doacoes_dinheiro
UNION ALL
SELECT 'Teste doacoes_itens' as tabela, COUNT(*) as total FROM public.doacoes_itens
UNION ALL
SELECT 'Teste idosos' as tabela, COUNT(*) as total FROM public.idosos;

-- Verificar políticas criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('departamentos', 'funcionarios', 'doacoes_dinheiro', 'doacoes_itens', 'idosos')
ORDER BY tablename, cmd, policyname;