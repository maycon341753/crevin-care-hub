const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://wnpqgvhqfqjqxqjqxqjq.supabase.co';
const supabaseKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InducHFndmhxZnFqcXhxanF4cWpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzM5NzI2NCwiZXhwIjoyMDUyOTczMjY0fQ.Ej3Ej3Ej3Ej3Ej3Ej3Ej3Ej3Ej3Ej3Ej3Ej3Ej3E';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeAnamneseMigration() {
  try {
    console.log('🔄 Executando migração dos campos da anamnese...');
    
    // SQL para adicionar os campos
    const sqlCommands = [
      `ALTER TABLE public.prontuario_medico ADD COLUMN IF NOT EXISTS queixa_principal TEXT;`,
      `ALTER TABLE public.prontuario_medico ADD COLUMN IF NOT EXISTS historia_doenca_atual TEXT;`,
      `ALTER TABLE public.prontuario_medico ADD COLUMN IF NOT EXISTS historia_medica_pregressa TEXT;`,
      `ALTER TABLE public.prontuario_medico ADD COLUMN IF NOT EXISTS medicamentos_uso TEXT;`,
      `ALTER TABLE public.prontuario_medico ADD COLUMN IF NOT EXISTS alergias TEXT;`,
      `ALTER TABLE public.prontuario_medico ADD COLUMN IF NOT EXISTS historia_familiar TEXT;`,
      `ALTER TABLE public.prontuario_medico ADD COLUMN IF NOT EXISTS historia_social TEXT;`,
      `ALTER TABLE public.prontuario_medico ADD COLUMN IF NOT EXISTS revisao_sistemas TEXT;`
    ];
    
    // Executar cada comando
    for (const sql of sqlCommands) {
      console.log(`Executando: ${sql}`);
      const { error } = await supabase.rpc('exec', { sql });
      if (error) {
        console.error('❌ Erro:', error);
        return;
      }
    }
    
    console.log('✅ Migração executada com sucesso!');
    console.log('📋 Novos campos adicionados à tabela prontuario_medico:');
    console.log('   - queixa_principal');
    console.log('   - historia_doenca_atual');
    console.log('   - historia_medica_pregressa');
    console.log('   - medicamentos_uso');
    console.log('   - alergias');
    console.log('   - historia_familiar');
    console.log('   - historia_social');
    console.log('   - revisao_sistemas');
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

executeAnamneseMigration();