const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://lhgujxyfxyxzozgokutf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxoZ3VqeHlmeHl4em96Z29rdXRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM5MDY2NSwiZXhwIjoyMDczOTY2NjY1fQ.AHq_kORGZlUpzsRM2Zy5wlGkzRbEr2wbB8AAyFDAEyk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAgendaTable() {
  try {
    console.log('🔍 Verificando se a tabela "agenda" existe...');
    
    // Tentar buscar dados da tabela agenda
    const { data: agendaData, error: agendaError } = await supabase
      .from('agenda')
      .select('*')
      .limit(1);

    if (agendaError) {
      if (agendaError.code === 'PGRST106' || agendaError.message.includes('does not exist')) {
        console.log('❌ Tabela "agenda" não existe. Criando...');
        
        // SQL para criar a tabela agenda
        const createTableSQL = `
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
        `;

        console.log('📝 SQL para criar tabela agenda:');
        console.log(createTableSQL);
        console.log('\n⚠️ Execute este SQL no Supabase Dashboard > SQL Editor');
        console.log('🔗 https://supabase.com/dashboard/project/lhgujxyfxyxzozgokutf/sql');
        
        return;
      } else {
        console.error('❌ Erro ao verificar tabela agenda:', agendaError);
        return;
      }
    }

    console.log('✅ Tabela "agenda" existe!');
    console.log(`📊 Registros encontrados: ${agendaData?.length || 0}`);
    
    if (agendaData && agendaData.length > 0) {
      console.log('📋 Exemplo de registro:');
      console.log(JSON.stringify(agendaData[0], null, 2));
    } else {
      console.log('📝 Tabela vazia. Criando alguns eventos de exemplo...');
      
      // Inserir dados de exemplo
      const exemploEventos = [
        {
          titulo: 'Consulta Médica - João Silva',
          descricao: 'Consulta de rotina com cardiologista',
          data_inicio: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Amanhã
          data_fim: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // Amanhã + 1h
          tipo: 'consulta',
          status: 'agendado',
          prioridade: 'alta',
          local: 'Consultório Médico',
          cor: '#ef4444'
        },
        {
          titulo: 'Atividade Recreativa',
          descricao: 'Bingo e jogos para os idosos',
          data_inicio: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Depois de amanhã
          data_fim: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(), // +2h
          tipo: 'atividade',
          status: 'agendado',
          prioridade: 'media',
          local: 'Sala de Recreação',
          cor: '#10b981'
        },
        {
          titulo: 'Reunião de Equipe',
          descricao: 'Reunião semanal da equipe de cuidadores',
          data_inicio: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // Em 3 dias
          data_fim: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // +1h
          tipo: 'reuniao',
          status: 'agendado',
          prioridade: 'media',
          local: 'Sala de Reuniões',
          cor: '#3b82f6'
        }
      ];

      const { data: insertData, error: insertError } = await supabase
        .from('agenda')
        .insert(exemploEventos)
        .select();

      if (insertError) {
        console.error('❌ Erro ao inserir eventos de exemplo:', insertError);
      } else {
        console.log('✅ Eventos de exemplo criados com sucesso!');
        console.log(`📊 ${insertData?.length || 0} eventos inseridos`);
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkAgendaTable();