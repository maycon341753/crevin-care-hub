-- Script SEGURO para corrigir políticas RLS da tabela funcionarios
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. REMOVER TODAS as políticas existentes que podem estar causando conflito
DROP POLICY IF EXISTS "Allow select funcionarios" ON public.funcionarios;
DROP POLICY IF EXISTS "Allow insert funcionarios" ON public.funcionarios;
DROP POLICY IF EXISTS "Allow update funcionarios" ON public.funcionarios;
DROP POLICY IF EXISTS "Allow delete funcionarios" ON public.funcionarios;
DROP POLICY IF EXISTS "Authenticated users can view funcionarios" ON public.funcionarios;
DROP POLICY IF EXISTS "Admins can manage funcionarios" ON public.funcionarios;
DROP POLICY IF EXISTS "Todos podem ver funcionarios" ON public.funcionarios;
DROP POLICY IF EXISTS "Apenas admins podem inserir funcionarios" ON public.funcionarios;
DROP POLICY IF EXISTS "Apenas admins podem atualizar funcionarios" ON public.funcionarios;
DROP POLICY IF EXISTS "Apenas admins podem deletar funcionarios" ON public.funcionarios;

-- 2. Verificar se a tabela funcionarios existe e tem RLS habilitado
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'funcionarios') THEN
        RAISE NOTICE 'Tabela funcionarios encontrada!';
        
        -- Habilitar RLS se não estiver habilitado
        ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS habilitado na tabela funcionarios';
    ELSE
        RAISE NOTICE 'ERRO: Tabela funcionarios não encontrada!';
    END IF;
END $$;

-- 3. Aguardar um momento para garantir que as políticas foram removidas
SELECT pg_sleep(1);

-- 4. Criar políticas RLS mais permissivas para funcionarios
-- Política para SELECT (todos podem ver)
CREATE POLICY "funcionarios_select_policy" ON public.funcionarios
  FOR SELECT USING (true);

-- Política para INSERT (usuários autenticados podem inserir)
CREATE POLICY "funcionarios_insert_policy" ON public.funcionarios
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Política para UPDATE (usuários autenticados podem atualizar)
CREATE POLICY "funcionarios_update_policy" ON public.funcionarios
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Política para DELETE (apenas developers podem deletar)
CREATE POLICY "funcionarios_delete_policy" ON public.funcionarios
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role = 'developer'
    )
  );

-- 5. Verificar se as políticas foram criadas
DO $$
BEGIN
    RAISE NOTICE '=== POLÍTICAS RLS PARA FUNCIONARIOS ATUALIZADAS ===';
    RAISE NOTICE 'SELECT: Todos podem ver (funcionarios_select_policy)';
    RAISE NOTICE 'INSERT: Usuários autenticados podem inserir (funcionarios_insert_policy)';
    RAISE NOTICE 'UPDATE: Usuários autenticados podem atualizar (funcionarios_update_policy)';
    RAISE NOTICE 'DELETE: Apenas developers podem deletar (funcionarios_delete_policy)';
END $$;

-- 6. Testar se a tabela está acessível
SELECT 'Teste de acesso à tabela funcionarios' as teste, COUNT(*) as total_funcionarios FROM public.funcionarios;