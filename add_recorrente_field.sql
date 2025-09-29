-- Script para adicionar campo recorrente à tabela contas_pagar
-- Este script adiciona os campos necessários para implementar contas recorrentes

DO $$
BEGIN
  -- Adicionar campo recorrente (boolean)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contas_pagar' 
    AND column_name = 'recorrente'
  ) THEN
    ALTER TABLE public.contas_pagar 
    ADD COLUMN recorrente BOOLEAN NOT NULL DEFAULT false;
    RAISE NOTICE '✅ Campo recorrente adicionado à tabela contas_pagar!';
  ELSE
    RAISE NOTICE 'ℹ️ Campo recorrente já existe na tabela contas_pagar.';
  END IF;

  -- Adicionar campo frequencia_recorrencia (mensal, anual, etc.)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contas_pagar' 
    AND column_name = 'frequencia_recorrencia'
  ) THEN
    ALTER TABLE public.contas_pagar 
    ADD COLUMN frequencia_recorrencia TEXT CHECK (frequencia_recorrencia IN ('mensal', 'bimestral', 'trimestral', 'semestral', 'anual')) DEFAULT 'mensal';
    RAISE NOTICE '✅ Campo frequencia_recorrencia adicionado à tabela contas_pagar!';
  ELSE
    RAISE NOTICE 'ℹ️ Campo frequencia_recorrencia já existe na tabela contas_pagar.';
  END IF;

  -- Adicionar campo conta_origem_id (para referenciar a conta original que gerou as recorrentes)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contas_pagar' 
    AND column_name = 'conta_origem_id'
  ) THEN
    ALTER TABLE public.contas_pagar 
    ADD COLUMN conta_origem_id UUID REFERENCES public.contas_pagar(id);
    RAISE NOTICE '✅ Campo conta_origem_id adicionado à tabela contas_pagar!';
  ELSE
    RAISE NOTICE 'ℹ️ Campo conta_origem_id já existe na tabela contas_pagar.';
  END IF;

  -- Adicionar campo data_proxima_geracao (para controlar quando gerar a próxima conta)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contas_pagar' 
    AND column_name = 'data_proxima_geracao'
  ) THEN
    ALTER TABLE public.contas_pagar 
    ADD COLUMN data_proxima_geracao DATE;
    RAISE NOTICE '✅ Campo data_proxima_geracao adicionado à tabela contas_pagar!';
  ELSE
    RAISE NOTICE 'ℹ️ Campo data_proxima_geracao já existe na tabela contas_pagar.';
  END IF;

END $$;

-- Criar índices para melhor performance nas consultas de contas recorrentes
CREATE INDEX IF NOT EXISTS idx_contas_pagar_recorrente ON public.contas_pagar(recorrente);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_data_proxima_geracao ON public.contas_pagar(data_proxima_geracao);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_conta_origem_id ON public.contas_pagar(conta_origem_id);

-- Comentários para documentação
COMMENT ON COLUMN public.contas_pagar.recorrente IS 'Indica se a conta é recorrente (true) ou única (false)';
COMMENT ON COLUMN public.contas_pagar.frequencia_recorrencia IS 'Frequência da recorrência: mensal, bimestral, trimestral, semestral, anual';
COMMENT ON COLUMN public.contas_pagar.conta_origem_id IS 'ID da conta original que gerou esta conta recorrente (NULL para contas originais)';
COMMENT ON COLUMN public.contas_pagar.data_proxima_geracao IS 'Data em que a próxima conta recorrente deve ser gerada';