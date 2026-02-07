-- Script para corrigir políticas RLS da tabela departamentos
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Remover políticas existentes que podem estar causando conflito
DROP POLICY IF EXISTS "Everyone can view departamentos" ON public.departamentos;
DROP POLICY IF EXISTS "Admins can manage departamentos" ON public.departamentos;
DROP POLICY IF EXISTS "Todos podem ver departamentos" ON public.departamentos;
DROP POLICY IF EXISTS "Apenas admins podem inserir departamentos" ON public.departamentos;
DROP POLICY IF EXISTS "Apenas admins podem atualizar departamentos" ON public.departamentos;

-- 2. Verificar se a tabela departamentos existe e tem RLS habilitado
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'departamentos') THEN
        RAISE NOTICE 'Tabela departamentos encontrada!';
        
        -- Habilitar RLS se não estiver habilitado
        ALTER TABLE public.departamentos ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS habilitado na tabela departamentos';
    ELSE
        RAISE NOTICE 'ERRO: Tabela departamentos não encontrada!';
    END IF;
END $$;

-- 3. Criar políticas RLS mais permissivas para departamentos
-- Política para SELECT (todos podem ver)
CREATE POLICY "Allow select departamentos" ON public.departamentos
  FOR SELECT USING (true);

-- Política para INSERT (usuários autenticados podem inserir)
CREATE POLICY "Allow insert departamentos" ON public.departamentos
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Política para UPDATE (usuários autenticados podem atualizar)
CREATE POLICY "Allow update departamentos" ON public.departamentos
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Política para DELETE (apenas developers podem deletar)
CREATE POLICY "Allow delete departamentos" ON public.departamentos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role = 'developer'
    )
  );

-- 4. Verificar se as políticas foram criadas
DO $$
BEGIN
    RAISE NOTICE 'Políticas RLS para departamentos criadas com sucesso!';
    RAISE NOTICE 'SELECT: Todos podem ver';
    RAISE NOTICE 'INSERT: Usuários autenticados podem inserir';
    RAISE NOTICE 'UPDATE: Usuários autenticados podem atualizar';
    RAISE NOTICE 'DELETE: Apenas developers podem deletar';
END $$;

-- 5. Testar se a tabela está acessível
SELECT 'Teste de acesso à tabela departamentos' as teste, COUNT(*) as total_departamentos FROM public.departamentos;