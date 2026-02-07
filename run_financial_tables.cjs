const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase em produção
const supabaseUrl = 'https://lhgujxyfxyxzozgokutf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxoZ3VqeHlmeHl4em96Z29rdXRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM5MDY2NSwiZXhwIjoyMDczOTY2NjY1fQ.AHq_kORGZlUpzsRM2Zy5wlGkzRbEr2wbB8AAyFDAEyk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runFinancialTables() {
  try {
    console.log('🔄 Executando script das tabelas financeiras...');
    
    // Ler o arquivo SQL
    const sql = fs.readFileSync('create_financial_tables.sql', 'utf8');
    
    // Dividir o SQL em comandos individuais
    const commands = sql.split('$$').filter(cmd => cmd.trim());
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i].trim();
      if (command && !command.startsWith('--') && command.length > 10) {
        try {
          console.log(`Executando comando ${i + 1}...`);
          const { data, error } = await supabase.rpc('exec_sql', { 
            sql: command.includes('$$') ? command : command + '$$'
          });
          
          if (error) {
            console.error(`❌ Erro no comando ${i + 1}:`, error);
          } else {
            console.log(`✅ Comando ${i + 1} executado com sucesso`);
          }
        } catch (err) {
          console.error(`❌ Erro ao executar comando ${i + 1}:`, err.message);
        }
      }
    }
    
    console.log('✅ Script das tabelas financeiras concluído!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

runFinancialTables();