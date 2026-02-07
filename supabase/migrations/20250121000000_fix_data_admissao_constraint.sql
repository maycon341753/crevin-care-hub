-- Migração para corrigir a restrição NOT NULL da coluna data_admissao
-- Problema: Formulário não envia data_admissao mas coluna tem restrição NOT NULL

-- Verificar se a coluna data_admissao existe e tem restrição NOT NULL
DO $$
BEGIN
  -- Verificar estrutura atual
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'idosos' 
    AND column_name = 'data_admissao'
  ) THEN
    RAISE NOTICE 'Coluna data_admissao encontrada. Ajustando restrições...';
    
    -- Alterar a coluna para ter um valor padrão (data atual)
    ALTER TABLE public.idosos 
    ALTER COLUMN data_admissao SET DEFAULT CURRENT_DATE;
    
    -- Atualizar registros existentes que possam ter data_admissao NULL
    UPDATE public.idosos 
    SET data_admissao = CURRENT_DATE 
    WHERE data_admissao IS NULL;
    
    RAISE NOTICE 'Coluna data_admissao ajustada com valor padrão CURRENT_DATE';
  ELSE
    RAISE NOTICE 'Coluna data_admissao não encontrada. Criando...';
    
    -- Adicionar a coluna com valor padrão
    ALTER TABLE public.idosos 
    ADD COLUMN data_admissao DATE NOT NULL DEFAULT CURRENT_DATE;
    
    RAISE NOTICE 'Coluna data_admissao criada com valor padrão CURRENT_DATE';
  END IF;
END $$;

-- Verificar estrutura final
DO $$
DECLARE
  rec RECORD;
BEGIN
  RAISE NOTICE '=== VERIFICAÇÃO FINAL DA COLUNA data_admissao ===';
  
  SELECT column_name, data_type, is_nullable, column_default
  INTO rec
  FROM information_schema.columns 
  WHERE table_schema = 'public' 
  AND table_name = 'idosos' 
  AND column_name = 'data_admissao';
  
  IF FOUND THEN
    RAISE NOTICE 'Coluna: % | Tipo: % | Nullable: % | Default: %', 
      rec.column_name, rec.data_type, rec.is_nullable, rec.column_default;
  ELSE
    RAISE NOTICE 'Coluna data_admissao não encontrada!';
  END IF;
  
  RAISE NOTICE '=== MIGRAÇÃO CONCLUÍDA ===';
END $$;