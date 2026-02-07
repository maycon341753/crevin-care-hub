const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuração do Supabase
const supabaseUrl = 'https://ixqjqhqjqhqjqhqjqhqj.supabase.co'; // Substitua pela sua URL
const supabaseKey = 'your-service-role-key'; // Substitua pela sua service role key

// Para desenvolvimento local, vamos usar as configurações do arquivo .env
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'http://localhost:54321',
  process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'
);

async function executeMigration() {
  try {
    console.log('🚀 Iniciando migração para adicionar campos de recorrência...');
    
    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, 'add_recorrente_field.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Executar o SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: sqlContent
    });
    
    if (error) {
      console.error('❌ Erro ao executar migração:', error);
      return;
    }
    
    console.log('✅ Migração executada com sucesso!');
    console.log('📊 Resultado:', data);
    
    // Verificar se os campos foram adicionados
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'contas_pagar')
      .in('column_name', ['recorrente', 'frequencia_recorrencia', 'conta_origem_id', 'data_proxima_geracao']);
    
    if (tableError) {
      console.error('❌ Erro ao verificar estrutura da tabela:', tableError);
      return;
    }
    
    console.log('📋 Campos adicionados:');
    tableInfo.forEach(column => {
      console.log(`  - ${column.column_name}: ${column.data_type} (nullable: ${column.is_nullable})`);
    });
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar a migração
executeMigration();