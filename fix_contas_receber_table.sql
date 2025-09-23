-- SCRIPT DE EMERGÊNCIA PARA CORRIGIR TABELA CONTAS_RECEBER
-- Execute este script no SQL Editor do Supabase Dashboard
-- https://supabase.com/dashboard/project/[SEU_PROJECT_ID]/sql/new

-- ========================================
-- DIAGNÓSTICO - VERIFICAR ESTRUTURA ATUAL
-- ========================================

-- Verificar se a tabela contas_receber existe
SELECT 
    '🔍 VERIFICANDO TABELA CONTAS_RECEBER' as status,
    EXISTS(SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'contas_receber') as tabela_existe;

-- Mostrar estrutura atual da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'contas_receber'
ORDER BY ordinal_position;

-- ========================================
-- CORREÇÃO - ADICIONAR COLUNAS FALTANTES
-- ========================================

DO $$
BEGIN
  -- Verificar se a coluna administrador_id já existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'contas_receber' 
    AND column_name = 'administrador_id'
  ) THEN
    -- Adicionar a coluna administrador_id
    ALTER TABLE public.contas_receber 
    ADD COLUMN administrador_id UUID;
    
    RAISE NOTICE '✅ Coluna administrador_id adicionada à tabela contas_receber';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna administrador_id já existe na tabela contas_receber';
  END IF;

  -- Verificar se a coluna categoria_id já existe (necessária para o relacionamento)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'contas_receber' 
    AND column_name = 'categoria_id'
  ) THEN
    -- Adicionar a coluna categoria_id se não existir
    ALTER TABLE public.contas_receber 
    ADD COLUMN categoria_id UUID;
    
    RAISE NOTICE '✅ Coluna categoria_id adicionada à tabela contas_receber';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna categoria_id já existe na tabela contas_receber';
  END IF;

  -- Verificar se a coluna idoso_id já existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'contas_receber' 
    AND column_name = 'idoso_id'
  ) THEN
    -- Adicionar a coluna idoso_id se não existir
    ALTER TABLE public.contas_receber 
    ADD COLUMN idoso_id UUID;
    
    RAISE NOTICE '✅ Coluna idoso_id adicionada à tabela contas_receber';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna idoso_id já existe na tabela contas_receber';
  END IF;

  -- Criar índices para melhor performance se não existirem
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE tablename = 'contas_receber' AND indexname = 'idx_contas_receber_administrador_id') THEN
    CREATE INDEX idx_contas_receber_administrador_id ON contas_receber(administrador_id);
    RAISE NOTICE '✅ Índice idx_contas_receber_administrador_id criado!';
  END IF;

  IF NOT EXISTS (SELECT FROM pg_indexes WHERE tablename = 'contas_receber' AND indexname = 'idx_contas_receber_categoria_id') THEN
    CREATE INDEX idx_contas_receber_categoria_id ON contas_receber(categoria_id);
    RAISE NOTICE '✅ Índice idx_contas_receber_categoria_id criado!';
  END IF;

  IF NOT EXISTS (SELECT FROM pg_indexes WHERE tablename = 'contas_receber' AND indexname = 'idx_contas_receber_idoso_id') THEN
    CREATE INDEX idx_contas_receber_idoso_id ON contas_receber(idoso_id);
    RAISE NOTICE '✅ Índice idx_contas_receber_idoso_id criado!';
  END IF;

  RAISE NOTICE '🎉 Correção da tabela contas_receber concluída!';
END $$;

-- ========================================
-- VERIFICAÇÃO FINAL
-- ========================================

-- Mostrar estrutura final da tabela
SELECT 
    '🎯 ESTRUTURA FINAL DA TABELA CONTAS_RECEBER' as status,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'contas_receber'
ORDER BY ordinal_position;

-- Verificar se todas as colunas necessárias existem
SELECT 
    '✅ VERIFICAÇÃO FINAL' as status,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'contas_receber' AND column_name = 'administrador_id') as administrador_id_existe,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'contas_receber' AND column_name = 'categoria_id') as categoria_id_existe,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'contas_receber' AND column_name = 'idoso_id') as idoso_id_existe;

SELECT '🚀 SCRIPT EXECUTADO COM SUCESSO! Agora você pode criar contas a receber sem erros.' as resultado;