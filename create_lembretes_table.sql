-- Script para criar tabela de lembretes
-- Execute este script no SQL Editor do Supabase Dashboard
-- https://supabase.com/dashboard/project/lhgujxyfxyxzozgokutf/sql/new

-- Criar tabela lembretes
CREATE TABLE IF NOT EXISTS public.lembretes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    titulo TEXT NOT NULL,
    descricao TEXT,
    data_lembrete DATE NOT NULL,
    hora_lembrete TIME,
    tipo TEXT NOT NULL DEFAULT 'geral' CHECK (tipo IN ('geral', 'medicamento', 'consulta', 'atividade', 'alimentacao', 'outro')),
    prioridade TEXT NOT NULL DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente')),
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'concluido', 'cancelado')),
    funcionario_id UUID REFERENCES public.funcionarios(id) ON DELETE SET NULL,
    idoso_id UUID REFERENCES public.idosos(id) ON DELETE SET NULL,
    criado_por UUID REFERENCES public.funcionarios(id) ON DELETE SET NULL,
    observacoes TEXT,
    notificado BOOLEAN DEFAULT FALSE,
    data_notificacao TIMESTAMP WITH TIME ZONE,
    recorrente BOOLEAN DEFAULT FALSE,
    tipo_recorrencia TEXT CHECK (tipo_recorrencia IN ('diario', 'semanal', 'mensal', 'anual')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_lembretes_data_lembrete ON public.lembretes(data_lembrete);
CREATE INDEX IF NOT EXISTS idx_lembretes_tipo ON public.lembretes(tipo);
CREATE INDEX IF NOT EXISTS idx_lembretes_prioridade ON public.lembretes(prioridade);
CREATE INDEX IF NOT EXISTS idx_lembretes_status ON public.lembretes(status);
CREATE INDEX IF NOT EXISTS idx_lembretes_funcionario_id ON public.lembretes(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_lembretes_idoso_id ON public.lembretes(idoso_id);
CREATE INDEX IF NOT EXISTS idx_lembretes_criado_por ON public.lembretes(criado_por);

-- Criar trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_lembretes_updated_at 
    BEFORE UPDATE ON public.lembretes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE public.lembretes IS 'Tabela para armazenar lembretes e alertas do sistema';
COMMENT ON COLUMN public.lembretes.titulo IS 'Título do lembrete';
COMMENT ON COLUMN public.lembretes.descricao IS 'Descrição detalhada do lembrete';
COMMENT ON COLUMN public.lembretes.data_lembrete IS 'Data para o lembrete';
COMMENT ON COLUMN public.lembretes.hora_lembrete IS 'Hora específica do lembrete';
COMMENT ON COLUMN public.lembretes.tipo IS 'Tipo do lembrete (geral, medicamento, consulta, etc.)';
COMMENT ON COLUMN public.lembretes.prioridade IS 'Prioridade do lembrete (baixa, media, alta, urgente)';
COMMENT ON COLUMN public.lembretes.status IS 'Status atual do lembrete';
COMMENT ON COLUMN public.lembretes.funcionario_id IS 'Funcionário responsável pelo lembrete';
COMMENT ON COLUMN public.lembretes.idoso_id IS 'Idoso relacionado ao lembrete';
COMMENT ON COLUMN public.lembretes.criado_por IS 'Funcionário que criou o lembrete';
COMMENT ON COLUMN public.lembretes.recorrente IS 'Indica se o lembrete é recorrente';
COMMENT ON COLUMN public.lembretes.tipo_recorrencia IS 'Tipo de recorrência (diario, semanal, mensal, anual)';

-- Inserir alguns dados de exemplo para teste
INSERT INTO public.lembretes (titulo, descricao, data_lembrete, hora_lembrete, tipo, prioridade, status) VALUES
('Medicação da manhã', 'Administrar medicação para hipertensão', CURRENT_DATE + INTERVAL '1 day', '08:00:00', 'medicamento', 'alta', 'pendente'),
('Consulta médica', 'Consulta de rotina com cardiologista', CURRENT_DATE + INTERVAL '3 days', '14:30:00', 'consulta', 'media', 'pendente'),
('Atividade física', 'Caminhada no jardim', CURRENT_DATE, '16:00:00', 'atividade', 'baixa', 'pendente'),
('Lembrete geral', 'Verificar pressão arterial', CURRENT_DATE + INTERVAL '2 days', '10:00:00', 'geral', 'media', 'pendente');

-- Verificar se a tabela foi criada corretamente
SELECT 'Tabela lembretes criada com sucesso!' as status;
SELECT COUNT(*) as total_lembretes FROM public.lembretes;