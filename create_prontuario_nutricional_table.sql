-- Criar tabela para prontuário nutricional dos idosos
CREATE TABLE IF NOT EXISTS public.prontuario_nutricional (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    idoso_id UUID NOT NULL REFERENCES public.idosos(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Dados antropométricos
    peso_atual DECIMAL(5,2),
    altura DECIMAL(3,2),
    imc DECIMAL(4,2),
    peso_usual DECIMAL(5,2),
    aj DECIMAL(4,2), -- Altura do joelho
    cb DECIMAL(4,2), -- Circunferência do braço
    cp DECIMAL(4,2), -- Circunferência da panturrilha
    
    -- Diagnóstico e MNA
    diagnostico TEXT,
    mna_score INTEGER,
    
    -- Avaliação cognitiva e funcional
    idoso_lucido VARCHAR(20) CHECK (idoso_lucido IN ('sim', 'nao', 'as_vezes')),
    comunica_vontades VARCHAR(20) CHECK (comunica_vontades IN ('sim', 'nao', 'as_vezes')),
    audicao_normal VARCHAR(30) CHECK (audicao_normal IN ('sim', 'nao', 'usa_aparelho')),
    pode_caminhar VARCHAR(50) CHECK (pode_caminhar IN ('sim', 'nao', 'usa_auxilio')),
    mastiga_bem VARCHAR(20) CHECK (mastiga_bem IN ('sim', 'nao', 'as_vezes')),
    
    -- Dentição
    tipo_denticao VARCHAR(30) CHECK (tipo_denticao IN ('completa', 'protese_sup', 'protese_inf', 'ausencia_dentes')),
    protese_adaptada VARCHAR(10) CHECK (protese_adaptada IN ('sim', 'nao')),
    
    -- Alimentação
    apetite VARCHAR(20) CHECK (apetite IN ('preservado', 'deficiente')),
    consistencia_alimentacao VARCHAR(20) CHECK (consistencia_alimentacao IN ('solida', 'branda', 'pastosa', 'sonda')),
    aceitacao_alimentos VARCHAR(50) CHECK (aceitacao_alimentos IN ('aceita_tudo', 'aceita_metade', 'poucas_colheradas', 'pede_repeticao')),
    mastigacao VARCHAR(20) CHECK (mastigacao IN ('normal', 'rapida', 'lenta')),
    aceitacao_liquidos VARCHAR(50) CHECK (aceitacao_liquidos IN ('solicita_sede', 'nao_solicita_aceita', 'so_medicacao', '2_4_copos', 'mais_4_copos')),
    
    -- Restrições e preferências
    restricao_liquidos_alimentos BOOLEAN DEFAULT FALSE,
    restricoes_detalhes TEXT,
    aceita_carnes TEXT,
    alimentos_preferencia TEXT,
    alimentos_recusa TEXT,
    alergias_intolerancia TEXT,
    
    -- Suplementação
    usa_suplemento BOOLEAN DEFAULT FALSE,
    suplementos_detalhes TEXT,
    
    -- Hábito intestinal
    habito_intestinal VARCHAR(20) CHECK (habito_intestinal IN ('normal', 'constipante', 'diarreico', 'variado', 'usa_laxante')),
    
    -- Observações gerais
    observacoes TEXT,
    
    -- Evolução nutricional
    idade_paciente INTEGER,
    mobilidade VARCHAR(50),
    diagnostico_medico TEXT,
    estado_geral VARCHAR(10) CHECK (estado_geral IN ('BEG', 'REG')),
    colaborativo BOOLEAN DEFAULT TRUE,
    respiracao VARCHAR(30) DEFAULT 'ar_ambiente',
    aceitacao_dieta VARCHAR(20) CHECK (aceitacao_dieta IN ('boa', 'parcial', 'regular', 'baixa')),
    habito_intestinal_evolucao VARCHAR(20) CHECK (habito_intestinal_evolucao IN ('regular', 'irregular')),
    evacuacoes_por_dia INTEGER,
    caracteristica_fezes VARCHAR(20) DEFAULT 'pastosa',
    diurese_presente BOOLEAN DEFAULT TRUE,
    medicamentos_uso TEXT,
    
    -- Antropometria na evolução
    peso_aferido_estimado DECIMAL(5,2),
    altura_aferida_estimada DECIMAL(3,2),
    imc_evolucao DECIMAL(4,2),
    aj_evolucao DECIMAL(4,2),
    cb_evolucao DECIMAL(4,2),
    cp_evolucao DECIMAL(4,2),
    reserva_massa_muscular VARCHAR(30) CHECK (reserva_massa_muscular IN ('preservada', 'depletada')),
    
    -- Diagnóstico e conduta nutricional
    diagnostico_nutricional TEXT,
    conduta_dietetica TEXT,
    prescricao_dietetica TEXT,
    
    -- Triagem MNA
    mna_diminuicao_ingesta INTEGER CHECK (mna_diminuicao_ingesta IN (0, 1, 2)),
    mna_perda_peso INTEGER CHECK (mna_perda_peso IN (0, 1, 2, 3)),
    mna_mobilidade INTEGER CHECK (mna_mobilidade IN (0, 1, 2)),
    mna_estresse_psicologico INTEGER CHECK (mna_estresse_psicologico IN (0, 2)),
    mna_problemas_neuropsicologicos INTEGER CHECK (mna_problemas_neuropsicologicos IN (0, 1, 2)),
    mna_imc INTEGER CHECK (mna_imc IN (0, 1, 2, 3)),
    mna_circunferencia_panturrilha INTEGER CHECK (mna_circunferencia_panturrilha IN (0, 3)),
    mna_escore_total INTEGER,
    mna_classificacao VARCHAR(30) CHECK (mna_classificacao IN ('normal', 'risco_desnutricao', 'desnutrido'))
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_prontuario_nutricional_idoso_id ON public.prontuario_nutricional(idoso_id);
CREATE INDEX IF NOT EXISTS idx_prontuario_nutricional_created_at ON public.prontuario_nutricional(created_at);

-- Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_prontuario_nutricional_updated_at 
    BEFORE UPDATE ON public.prontuario_nutricional 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.prontuario_nutricional ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
CREATE POLICY "Usuários autenticados podem visualizar prontuários nutricionais" ON public.prontuario_nutricional
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir prontuários nutricionais" ON public.prontuario_nutricional
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar prontuários nutricionais" ON public.prontuario_nutricional
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar prontuários nutricionais" ON public.prontuario_nutricional
    FOR DELETE USING (auth.role() = 'authenticated');

-- Comentários para documentação
COMMENT ON TABLE public.prontuario_nutricional IS 'Tabela para armazenar prontuários nutricionais dos idosos';
COMMENT ON COLUMN public.prontuario_nutricional.idoso_id IS 'Referência ao idoso (FK)';
COMMENT ON COLUMN public.prontuario_nutricional.mna_score IS 'Pontuação do Mini Nutritional Assessment';
COMMENT ON COLUMN public.prontuario_nutricional.mna_escore_total IS 'Escore total da triagem MNA (0-14 pontos)';
COMMENT ON COLUMN public.prontuario_nutricional.mna_classificacao IS 'Classificação: normal (12-14), risco (8-11), desnutrido (0-7)';