-- Criar tabela agenda para o sistema CREVIN Care Hub
-- Execute este SQL no Supabase Dashboard > SQL Editor

-- Criar tabela agenda
CREATE TABLE IF NOT EXISTS public.agenda (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
  data_fim TIMESTAMP WITH TIME ZONE,
  tipo VARCHAR(50) DEFAULT 'evento',
  status VARCHAR(50) DEFAULT 'agendado',
  prioridade VARCHAR(20) DEFAULT 'media',
  local VARCHAR(255),
  participantes TEXT[],
  criado_por UUID REFERENCES auth.users(id),
  idoso_id UUID REFERENCES public.idosos(id),
  funcionario_id UUID REFERENCES public.funcionarios(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  all_day BOOLEAN DEFAULT FALSE,
  recorrencia VARCHAR(50),
  cor VARCHAR(7) DEFAULT '#3b82f6',
  observacoes TEXT
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_agenda_data_inicio ON public.agenda(data_inicio);
CREATE INDEX IF NOT EXISTS idx_agenda_criado_por ON public.agenda(criado_por);
CREATE INDEX IF NOT EXISTS idx_agenda_idoso_id ON public.agenda(idoso_id);
CREATE INDEX IF NOT EXISTS idx_agenda_funcionario_id ON public.agenda(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_agenda_status ON public.agenda(status);
CREATE INDEX IF NOT EXISTS idx_agenda_tipo ON public.agenda(tipo);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.agenda ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam todos os eventos (admin/funcionários)
CREATE POLICY "Usuários podem ver todos os eventos da agenda" ON public.agenda
  FOR SELECT USING (true);

-- Política para permitir que usuários autenticados criem eventos
CREATE POLICY "Usuários autenticados podem criar eventos" ON public.agenda
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Política para permitir que criadores e admins editem eventos
CREATE POLICY "Criadores e admins podem editar eventos" ON public.agenda
  FOR UPDATE USING (
    auth.uid() = criado_por OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'developer')
    )
  );

-- Política para permitir que criadores e admins deletem eventos
CREATE POLICY "Criadores e admins podem deletar eventos" ON public.agenda
  FOR DELETE USING (
    auth.uid() = criado_por OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'developer')
    )
  );

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_agenda_updated_at 
  BEFORE UPDATE ON public.agenda 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir alguns eventos de exemplo
INSERT INTO public.agenda (titulo, descricao, data_inicio, data_fim, tipo, status, prioridade, local, cor) VALUES
('Consulta Médica - João Silva', 'Consulta de rotina com cardiologista', NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day 1 hour', 'consulta', 'agendado', 'alta', 'Consultório Médico', '#ef4444'),
('Atividade Recreativa', 'Bingo e jogos para os idosos', NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days 2 hours', 'atividade', 'agendado', 'media', 'Sala de Recreação', '#10b981'),
('Reunião de Equipe', 'Reunião semanal da equipe de cuidadores', NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days 1 hour', 'reuniao', 'agendado', 'media', 'Sala de Reuniões', '#3b82f6'),
('Fisioterapia - Maria Santos', 'Sessão de fisioterapia para reabilitação', NOW() + INTERVAL '4 days', NOW() + INTERVAL '4 days 45 minutes', 'terapia', 'agendado', 'alta', 'Sala de Fisioterapia', '#f59e0b'),
('Aniversário - Pedro Costa', 'Comemoração do aniversário do Sr. Pedro', NOW() + INTERVAL '5 days', NOW() + INTERVAL '5 days 3 hours', 'evento', 'agendado', 'media', 'Salão Principal', '#8b5cf6');

-- Comentários sobre os campos da tabela
COMMENT ON TABLE public.agenda IS 'Tabela para gerenciar eventos e compromissos da agenda';
COMMENT ON COLUMN public.agenda.titulo IS 'Título do evento';
COMMENT ON COLUMN public.agenda.descricao IS 'Descrição detalhada do evento';
COMMENT ON COLUMN public.agenda.data_inicio IS 'Data e hora de início do evento';
COMMENT ON COLUMN public.agenda.data_fim IS 'Data e hora de fim do evento';
COMMENT ON COLUMN public.agenda.tipo IS 'Tipo do evento: evento, consulta, atividade, reuniao, terapia, etc.';
COMMENT ON COLUMN public.agenda.status IS 'Status: agendado, em_andamento, concluido, cancelado';
COMMENT ON COLUMN public.agenda.prioridade IS 'Prioridade: baixa, media, alta, urgente';
COMMENT ON COLUMN public.agenda.local IS 'Local onde o evento acontecerá';
COMMENT ON COLUMN public.agenda.participantes IS 'Array de participantes do evento';
COMMENT ON COLUMN public.agenda.criado_por IS 'ID do usuário que criou o evento';
COMMENT ON COLUMN public.agenda.idoso_id IS 'ID do idoso relacionado ao evento (se aplicável)';
COMMENT ON COLUMN public.agenda.funcionario_id IS 'ID do funcionário responsável pelo evento';
COMMENT ON COLUMN public.agenda.all_day IS 'Se o evento dura o dia todo';
COMMENT ON COLUMN public.agenda.recorrencia IS 'Padrão de recorrência: diario, semanal, mensal, anual';
COMMENT ON COLUMN public.agenda.cor IS 'Cor do evento no calendário (formato hex)';
COMMENT ON COLUMN public.agenda.observacoes IS 'Observações adicionais sobre o evento';