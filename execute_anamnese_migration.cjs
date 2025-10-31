const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuração do Supabase
const supabaseUrl = 'https://wnpqgvhqfqjqxqjqxqjq.supabase.co';
const supabaseKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InducHFndmhxZnFqcXhxanF4cWpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzM5NzI2NCwiZXhwIjoyMDUyOTczMjY0fQ.Ej3Ej3Ej3Ej3Ej3Ej3Ej3Ej3Ej3Ej3Ej3Ej3Ej3E';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeAnamneseMigration() {
  try {
    console.log('🔄 Executando migração dos campos da anamnese...');
    
    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, 'supabase', 'migrations', '20251008030000_add_anamnese_fields_to_prontuario_medico.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Executar a migração
    const { data, error } = await supabase.rpc('exec', { sql: sqlContent });
    
    if (error) {
      console.error('❌ Erro ao executar migração:', error);
      return;
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