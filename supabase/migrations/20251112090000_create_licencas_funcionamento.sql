-- Create table for Licenças de Funcionamento with idempotent RLS policies
-- Date: 2025-11-12

-- Ensure required extension for UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create table if missing
CREATE TABLE IF NOT EXISTS public.licencas_funcionamento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  emissor text,
  numero text,
  data_emissao date,
  data_validade date,
  arquivo_url text,
  arquivo_storage_path text,
  observacoes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add columns if not exist (idempotent safety)
ALTER TABLE public.licencas_funcionamento
  ADD COLUMN IF NOT EXISTS titulo text;
ALTER TABLE public.licencas_funcionamento
  ADD COLUMN IF NOT EXISTS emissor text;
ALTER TABLE public.licencas_funcionamento
  ADD COLUMN IF NOT EXISTS numero text;
ALTER TABLE public.licencas_funcionamento
  ADD COLUMN IF NOT EXISTS data_emissao date;
ALTER TABLE public.licencas_funcionamento
  ADD COLUMN IF NOT EXISTS data_validade date;
ALTER TABLE public.licencas_funcionamento
  ADD COLUMN IF NOT EXISTS arquivo_url text;
ALTER TABLE public.licencas_funcionamento
  ADD COLUMN IF NOT EXISTS arquivo_storage_path text;
ALTER TABLE public.licencas_funcionamento
  ADD COLUMN IF NOT EXISTS observacoes text;
ALTER TABLE public.licencas_funcionamento
  ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.licencas_funcionamento
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.licencas_funcionamento
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Ensure not null for titulo
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'licencas_funcionamento' AND column_name = 'titulo'
  ) THEN
    ALTER TABLE public.licencas_funcionamento ALTER COLUMN titulo SET NOT NULL;
  END IF;
END $$;

-- Create indexes idempotently
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'licencas_funcionamento_created_by_idx' AND n.nspname = 'public'
  ) THEN
    CREATE INDEX licencas_funcionamento_created_by_idx ON public.licencas_funcionamento(created_by);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'licencas_funcionamento_validade_idx' AND n.nspname = 'public'
  ) THEN
    CREATE INDEX licencas_funcionamento_validade_idx ON public.licencas_funcionamento(data_validade);
  END IF;
END $$;

-- Updated_at trigger function (idempotent)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger idempotently
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_licencas_funcionamento'
  ) THEN
    CREATE TRIGGER set_updated_at_licencas_funcionamento
    BEFORE UPDATE ON public.licencas_funcionamento
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.licencas_funcionamento ENABLE ROW LEVEL SECURITY;

-- Policies (idempotent): only owner can access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'licencas_funcionamento' AND policyname = 'licencas_funcionamento_select'
  ) THEN
    CREATE POLICY licencas_funcionamento_select ON public.licencas_funcionamento
    FOR SELECT USING (created_by = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'licencas_funcionamento' AND policyname = 'licencas_funcionamento_insert'
  ) THEN
    CREATE POLICY licencas_funcionamento_insert ON public.licencas_funcionamento
    FOR INSERT WITH CHECK (created_by = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'licencas_funcionamento' AND policyname = 'licencas_funcionamento_update'
  ) THEN
    CREATE POLICY licencas_funcionamento_update ON public.licencas_funcionamento
    FOR UPDATE USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'licencas_funcionamento' AND policyname = 'licencas_funcionamento_delete'
  ) THEN
    CREATE POLICY licencas_funcionamento_delete ON public.licencas_funcionamento
    FOR DELETE USING (created_by = auth.uid());
  END IF;
END $$;

-- Comment for documentation
COMMENT ON TABLE public.licencas_funcionamento IS 'Licenças de funcionamento com arquivo PDF opcional';
COMMENT ON COLUMN public.licencas_funcionamento.arquivo_url IS 'URL pública do PDF armazenado no Storage';
COMMENT ON COLUMN public.licencas_funcionamento.arquivo_storage_path IS 'Caminho no bucket do Supabase Storage';