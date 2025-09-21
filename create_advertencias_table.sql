-- Criar tabela advertencias para funcionários
CREATE TABLE IF NOT EXISTS public.advertencias (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    funcionario_id UUID NOT NULL REFERENCES public.funcionarios(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('verbal', 'escrita', 'suspensao', 'advertencia_final')),
    motivo TEXT NOT NULL,
    descricao TEXT,
    data_advertencia DATE NOT NULL DEFAULT CURRENT_DATE,
    aplicada_por UUID REFERENCES auth.users(id),
    status TEXT NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'revogada', 'cumprida')),
    data_revogacao DATE,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_advertencias_funcionario_id ON public.advertencias(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_advertencias_tipo ON public.advertencias(tipo);
CREATE INDEX IF NOT EXISTS idx_advertencias_status ON public.advertencias(status);
CREATE INDEX IF NOT EXISTS idx_advertencias_data ON public.advertencias(data_advertencia);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_advertencias_updated_at ON public.advertencias;
CREATE TRIGGER update_advertencias_updated_at
    BEFORE UPDATE ON public.advertencias
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.advertencias ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
-- Usuários autenticados podem visualizar advertências
CREATE POLICY "Authenticated users can view advertencias" ON public.advertencias
    FOR SELECT USING (auth.role() = 'authenticated');

-- Apenas admins e desenvolvedores podem inserir/atualizar/deletar
CREATE POLICY "Admins can manage advertencias" ON public.advertencias
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'developer')
        )
    );

-- Comentários para documentação
COMMENT ON TABLE public.advertencias IS 'Tabela para armazenar advertências aplicadas aos funcionários';
COMMENT ON COLUMN public.advertencias.tipo IS 'Tipo da advertência: verbal, escrita, suspensao, advertencia_final';
COMMENT ON COLUMN public.advertencias.status IS 'Status da advertência: ativa, revogada, cumprida';
COMMENT ON COLUMN public.advertencias.motivo IS 'Motivo principal da advertência';
COMMENT ON COLUMN public.advertencias.descricao IS 'Descrição detalhada da advertência';
COMMENT ON COLUMN public.advertencias.aplicada_por IS 'Usuário que aplicou a advertência';
COMMENT ON COLUMN public.advertencias.data_revogacao IS 'Data em que a advertência foi revogada (se aplicável)';

-- Inserir alguns dados de exemplo (opcional)
INSERT INTO public.advertencias (funcionario_id, tipo, motivo, descricao, aplicada_por, created_by) 
SELECT 
    f.id,
    'verbal',
    'Atraso recorrente',
    'Funcionário chegou atrasado 3 vezes na semana',
    (SELECT id FROM auth.users LIMIT 1),
    (SELECT id FROM auth.users LIMIT 1)
FROM public.funcionarios f 
LIMIT 1
ON CONFLICT DO NOTHING;