-- Migration: Adiciona coluna 'recibo_gerado' em public.doacoes_dinheiro
-- Objetivo: Marcar se o recibo da doação em dinheiro foi gerado
-- Segura para reaplicação (IF NOT EXISTS)

BEGIN;

ALTER TABLE public.doacoes_dinheiro
  ADD COLUMN IF NOT EXISTS recibo_gerado BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.doacoes_dinheiro.recibo_gerado IS 'Indica se o recibo foi gerado para esta doação em dinheiro';

COMMIT;