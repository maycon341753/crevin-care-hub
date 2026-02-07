-- Migration: Add recurring fields to contas_receber
-- Created: 2025-10-27T20:36:50.993Z

-- Add recorrente field
ALTER TABLE public.contas_receber 
ADD COLUMN IF NOT EXISTS recorrente BOOLEAN DEFAULT false;

-- Add frequencia_recorrencia field  
ALTER TABLE public.contas_receber 
ADD COLUMN IF NOT EXISTS frequencia_recorrencia TEXT DEFAULT 'mensal';

-- Add comments for documentation
COMMENT ON COLUMN public.contas_receber.recorrente IS 'Indica se a conta a receber é recorrente';
COMMENT ON COLUMN public.contas_receber.frequencia_recorrencia IS 'Frequência da recorrência: mensal, trimestral, semestral, anual';