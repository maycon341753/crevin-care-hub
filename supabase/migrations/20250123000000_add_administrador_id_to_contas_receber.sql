-- Migração para adicionar a coluna administrador_id na tabela contas_receber
-- Migration: 20250123000000_add_administrador_id_to_contas_receber

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

  RAISE NOTICE '🎉 Migração da tabela contas_receber concluída!';
END $$;