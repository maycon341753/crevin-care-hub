const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase (usando valores padrão para desenvolvimento local)
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeMigration() {
  try {
    console.log('🚀 Iniciando migração para adicionar campos de recorrência...');
    
    // SQL para adicionar os campos
    const migrations = [
      {
        name: 'Adicionar campo recorrente',
        sql: `
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'contas_pagar' 
              AND column_name = 'recorrente'
            ) THEN
              ALTER TABLE public.contas_pagar 
              ADD COLUMN recorrente BOOLEAN NOT NULL DEFAULT false;
              RAISE NOTICE '✅ Campo recorrente adicionado!';
            ELSE
              RAISE NOTICE 'ℹ️ Campo recorrente já existe.';
            END IF;
          END $$;
        `
      },
      {
        name: 'Adicionar campo frequencia_recorrencia',
        sql: `
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'contas_pagar' 
              AND column_name = 'frequencia_recorrencia'
            ) THEN
              ALTER TABLE public.contas_pagar 
              ADD COLUMN frequencia_recorrencia TEXT CHECK (frequencia_recorrencia IN ('mensal', 'bimestral', 'trimestral', 'semestral', 'anual')) DEFAULT 'mensal';
              RAISE NOTICE '✅ Campo frequencia_recorrencia adicionado!';
            ELSE
              RAISE NOTICE 'ℹ️ Campo frequencia_recorrencia já existe.';
            END IF;
          END $$;
        `
      },
      {
        name: 'Adicionar campo conta_origem_id',
        sql: `
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'contas_pagar' 
              AND column_name = 'conta_origem_id'
            ) THEN
              ALTER TABLE public.contas_pagar 
              ADD COLUMN conta_origem_id UUID REFERENCES public.contas_pagar(id);
              RAISE NOTICE '✅ Campo conta_origem_id adicionado!';
            ELSE
              RAISE NOTICE 'ℹ️ Campo conta_origem_id já existe.';
            END IF;
          END $$;
        `
      },
      {
        name: 'Adicionar campo data_proxima_geracao',
        sql: `
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'contas_pagar' 
              AND column_name = 'data_proxima_geracao'
            ) THEN
              ALTER TABLE public.contas_pagar 
              ADD COLUMN data_proxima_geracao DATE;
              RAISE NOTICE '✅ Campo data_proxima_geracao adicionado!';
            ELSE
              RAISE NOTICE 'ℹ️ Campo data_proxima_geracao já existe.';
            END IF;
          END $$;
        `
      }
    ];
    
    // Executar cada migração
    for (const migration of migrations) {
      console.log(`📝 Executando: ${migration.name}`);
      
      const { error } = await supabase.rpc('exec_sql', {
        sql_query: migration.sql
      });
      
      if (error) {
        console.error(`❌ Erro em ${migration.name}:`, error);
        // Continuar com as próximas migrações mesmo se uma falhar
      } else {
        console.log(`✅ ${migration.name} executada com sucesso!`);
      }
    }
    
    // Criar índices
    console.log('📝 Criando índices...');
    const indexSql = `
      CREATE INDEX IF NOT EXISTS idx_contas_pagar_recorrente ON public.contas_pagar(recorrente);
      CREATE INDEX IF NOT EXISTS idx_contas_pagar_data_proxima_geracao ON public.contas_pagar(data_proxima_geracao);
      CREATE INDEX IF NOT EXISTS idx_contas_pagar_conta_origem_id ON public.contas_pagar(conta_origem_id);
    `;
    
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql_query: indexSql
    });
    
    if (indexError) {
      console.error('❌ Erro ao criar índices:', indexError);
    } else {
      console.log('✅ Índices criados com sucesso!');
    }
    
    console.log('🎉 Migração concluída!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar a migração
executeMigration();