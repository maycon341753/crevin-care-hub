-- Add sexo column to lista_espera_idosos and create table if it doesn't exist

-- Ensure required extension for UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create table if missing (basic schema based on app usage)
CREATE TABLE IF NOT EXISTS public.lista_espera_idosos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cpf text NOT NULL UNIQUE,
  data_nascimento date NOT NULL,
  telefone text,
  endereco text,
  responsavel_nome text,
  responsavel_telefone text,
  responsavel_parentesco text,
  observacoes text,
  data_cadastro date DEFAULT now(),
  posicao_fila integer,
  status text NOT NULL DEFAULT 'aguardando' CHECK (status IN ('aguardando','contatado','transferido','cancelado'))
);

-- Add sexo column if not exists
ALTER TABLE public.lista_espera_idosos
  ADD COLUMN IF NOT EXISTS sexo text;

-- Add check constraint for sexo values (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'lista_espera_idosos_sexo_check'
  ) THEN
    ALTER TABLE public.lista_espera_idosos
      ADD CONSTRAINT lista_espera_idosos_sexo_check
      CHECK (sexo IS NULL OR sexo IN ('masculino','feminino'));
  END IF;
END $$;

COMMENT ON COLUMN public.lista_espera_idosos.sexo IS 'Sexo do idoso: masculino ou feminino';