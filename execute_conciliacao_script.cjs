const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configuração do Supabase
const supabaseUrl = 'https://lhgujxyfxyxzozgokutf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxoZ3VqeHlmeHl4em96Z29rdXRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM5MDY2NSwiZXhwIjoyMDczOTY2NjY1fQ.AHq_kORGZlUpzsRM2Zy5wlGkzRbEr2wbB8AAyFDAEyk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQLScript() {
  try {
    console.log('📋 Executando script de criação das tabelas de conciliação...\n');
    
    // Ler o arquivo SQL
    const sqlScript = fs.readFileSync('create_conciliacao_tables.sql', 'utf8');
    
    // Dividir o script em comandos individuais
    const commands = sqlScript
      .split('$$;')
      .filter(cmd => cmd.trim().length > 0)
      .map(cmd => cmd.trim() + (cmd.includes('$$') ? '$$;' : ''));
    
    console.log(`📝 Encontrados ${commands.length} comandos SQL para executar...\n`);
    
    // Executar cada comando individualmente
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command.trim().length === 0) continue;
      
      console.log(`⏳ Executando comando ${i + 1}/${commands.length}...`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_query: command 
        });
        
        if (error) {
          console.error(`❌ Erro no comando ${i + 1}:`, error);
          continue;
        }
        
        console.log(`✅ Comando ${i + 1} executado com sucesso!`);
        if (data) {
          console.log('📊 Resultado:', data);
        }
        
      } catch (cmdError) {
        console.error(`❌ Erro ao executar comando ${i + 1}:`, cmdError.message);
      }
      
      console.log(''); // Linha em branco para separar
    }
    
    console.log('🎉 Script de conciliação executado completamente!');
    
    // Verificar se as tabelas foram criadas
    console.log('\n🔍 Verificando tabelas criadas...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['contas_bancarias', 'movimentos_bancarios', 'regras_conciliacao', 'historico_conciliacoes']);
    
    if (tablesError) {
      console.error('❌ Erro ao verificar tabelas:', tablesError);
    } else {
      console.log('📋 Tabelas encontradas:', tables?.map(t => t.table_name) || []);
    }
    
  } catch (err) {
    console.error('❌ Erro geral:', err.message);
  }
}

// Executar o script
executeSQLScript();