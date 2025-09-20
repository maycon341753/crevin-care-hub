-- Migração para alinhar a tabela idosos com a interface atual
-- Esta migração atualiza os campos da tabela para corresponder à interface Idoso

-- 1. Renomear campo telefone_contato para telefone
ALTER TABLE public.idosos RENAME COLUMN telefone_contato TO telefone;

-- 2. Adicionar campo endereco
ALTER TABLE public.idosos ADD COLUMN endereco TEXT;

-- 3. Renomear campo observacoes_saude para observacoes_medicas
ALTER TABLE public.idosos RENAME COLUMN observacoes_saude TO observacoes_medicas;

-- 4. Alterar campo status para ativo (boolean)
-- Primeiro, adicionar a nova coluna
ALTER TABLE public.idosos ADD COLUMN ativo BOOLEAN NOT NULL DEFAULT true;

-- Migrar dados existentes: 'ativo' -> true, outros -> false
UPDATE public.idosos SET ativo = (status = 'ativo');

-- Remover a coluna status antiga
ALTER TABLE public.idosos DROP COLUMN status;

-- 5. Remover campos quarto e ala (não estão na interface atual)
ALTER TABLE public.idosos DROP COLUMN IF EXISTS quarto;
ALTER TABLE public.idosos DROP COLUMN IF EXISTS ala;

-- 6. Remover campos que não estão na interface atual
ALTER TABLE public.idosos DROP COLUMN IF EXISTS data_admissao;
ALTER TABLE public.idosos DROP COLUMN IF EXISTS medicamentos;
ALTER TABLE public.idosos DROP COLUMN IF EXISTS restricoes_nutricionais;
ALTER TABLE public.idosos DROP COLUMN IF EXISTS created_by;

-- 7. Atualizar comentários da tabela
COMMENT ON TABLE public.idosos IS 'Tabela de idosos atendidos pela instituição';
COMMENT ON COLUMN public.idosos.id IS 'Identificador único do idoso';
COMMENT ON COLUMN public.idosos.nome IS 'Nome completo do idoso';
COMMENT ON COLUMN public.idosos.cpf IS 'CPF do idoso (único)';
COMMENT ON COLUMN public.idosos.rg IS 'RG do idoso';
COMMENT ON COLUMN public.idosos.data_nascimento IS 'Data de nascimento do idoso';
COMMENT ON COLUMN public.idosos.telefone IS 'Telefone de contato do idoso';
COMMENT ON COLUMN public.idosos.endereco IS 'Endereço do idoso';
COMMENT ON COLUMN public.idosos.contato_emergencia IS 'Contato de emergência do idoso';
COMMENT ON COLUMN public.idosos.observacoes_medicas IS 'Observações médicas sobre o idoso';
COMMENT ON COLUMN public.idosos.ativo IS 'Status ativo/inativo do idoso';
COMMENT ON COLUMN public.idosos.created_at IS 'Data de criação do registro';
COMMENT ON COLUMN public.idosos.updated_at IS 'Data da última atualização do registro';