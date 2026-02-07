const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuração do Supabase
const supabaseUrl = 'https://ixqhqvqmkqjjxqjjxqjj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWhxdnFta3Fqanhxamp4cWpqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDU1Mjk3NiwiZXhwIjoyMDUwMTI4OTc2fQ.SERVICE_ROLE_KEY_HERE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeMigration() {
  try {
    console.log('=== EXECUTANDO MIGRAÇÃO: ADD DATA_NASCIMENTO TO FUNCIONARIOS ===');
    
    // Ler o arquivo de migração
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250124000000_add_data_nascimento_to_funcionarios.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('SQL a ser executado:');
    console.log(migrationSQL);
    console.log('\n--- Executando migração ---');
    
    // Executar a migração
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: migrationSQL 
    });
    
    if (error) {
      console.error('Erro ao executar migração:', error);
      
      // Tentar executar diretamente via SQL
      console.log('\nTentando executar SQL diretamente...');
      
      const { data: directData, error: directError } = await supabase
        .from('funcionarios')
        .select('*')
        .limit(1);
      
      if (directError) {
        console.error('Erro ao verificar tabela:', directError);
      } else {
        console.log('Tabela funcionarios acessível. Tentando adicionar coluna via ALTER TABLE...');
        
        // Como não temos acesso direto ao ALTER TABLE via cliente, vamos usar uma abordagem alternativa
        console.log('⚠️  ATENÇÃO: A migração precisa ser executada manualmente no painel do Supabase.');
        console.log('Execute o seguinte SQL no SQL Editor do Supabase:');
        console.log('\nALTER TABLE funcionarios ADD COLUMN data_nascimento DATE;');
        console.log('COMMENT ON COLUMN funcionarios.data_nascimento IS \'Data de nascimento do funcionário para controle de aniversários\';');
      }
    } else {
      console.log('✅ Migração executada com sucesso!');
      console.log('Resultado:', data);
    }
    
    // Verificar se a coluna foi adicionada
    console.log('\n--- Verificando estrutura da tabela ---');
    const { data: tableData, error: tableError } = await supabase
      .from('funcionarios')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('Erro ao verificar tabela:', tableError);
    } else if (tableData && tableData.length > 0) {
      const columns = Object.keys(tableData[0]);
      console.log('Colunas disponíveis:', columns);
      
      if (columns.includes('data_nascimento')) {
        console.log('✅ Campo data_nascimento foi adicionado com sucesso!');
      } else {
        console.log('❌ Campo data_nascimento ainda não está presente na tabela.');
      }
    }
    
  } catch (err) {
    console.error('Erro geral:', err);
  }
}

executeMigration();