-- Adicionar campos recorrentes à tabela contas_receber
-- Este script adiciona os campos necessários para implementar pagamentos recorrentes

-- Adicionar campo recorrente (boolean, padrão false)
ALTER TABLE public.contas_receber 
ADD COLUMN IF NOT EXISTS recorrente BOOLEAN DEFAULT false;

-- Adicionar campo frequencia_recorrencia (texto, padrão 'mensal')
ALTER TABLE public.contas_receber 
ADD COLUMN IF NOT EXISTS frequencia_recorrencia TEXT DEFAULT 'mensal';

-- Adicionar comentários para documentar os campos
COMMENT ON COLUMN public.contas_receber.recorrente IS 'Indica se a conta a receber é recorrente';
COMMENT ON COLUMN public.contas_receber.frequencia_recorrencia IS 'Frequência da recorrência: mensal, trimestral, semestral, anual';

-- Verificar se os campos foram adicionados
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'contas_receber' 
  AND table_schema = 'public'
  AND column_name IN ('recorrente', 'frequencia_recorrencia')
ORDER BY column_name;