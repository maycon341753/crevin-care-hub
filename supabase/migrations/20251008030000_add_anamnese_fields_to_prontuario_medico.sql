-- Adicionar campos específicos da anamnese à tabela prontuario_medico
ALTER TABLE public.prontuario_medico 
ADD COLUMN IF NOT EXISTS queixa_principal TEXT,
ADD COLUMN IF NOT EXISTS historia_doenca_atual TEXT,
ADD COLUMN IF NOT EXISTS historia_medica_pregressa TEXT,
ADD COLUMN IF NOT EXISTS medicamentos_uso TEXT,
ADD COLUMN IF NOT EXISTS alergias TEXT,
ADD COLUMN IF NOT EXISTS historia_familiar TEXT,
ADD COLUMN IF NOT EXISTS historia_social TEXT,
ADD COLUMN IF NOT EXISTS revisao_sistemas TEXT;

-- Comentários para os novos campos
COMMENT ON COLUMN public.prontuario_medico.queixa_principal IS 'Queixa principal do paciente';
COMMENT ON COLUMN public.prontuario_medico.historia_doenca_atual IS 'História da doença atual';
COMMENT ON COLUMN public.prontuario_medico.historia_medica_pregressa IS 'História médica pregressa do paciente';
COMMENT ON COLUMN public.prontuario_medico.medicamentos_uso IS 'Medicamentos em uso atual';
COMMENT ON COLUMN public.prontuario_medico.alergias IS 'Alergias medicamentosas, alimentares ou outras';
COMMENT ON COLUMN public.prontuario_medico.historia_familiar IS 'História familiar de doenças';
COMMENT ON COLUMN public.prontuario_medico.historia_social IS 'História social, hábitos de vida e condições sociais';
COMMENT ON COLUMN public.prontuario_medico.revisao_sistemas IS 'Revisão de sistemas por aparelhos';