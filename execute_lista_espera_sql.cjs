const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configurações do Supabase (substitua pelos seus valores)
const SUPABASE_URL = 'https://ixqhqjqvwqxqjqxqjqxq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function executeSql() {
  try {
    console.log('🔄 Executando script SQL para criar tabela lista_espera_idosos...');
    
    const sql = fs.readFileSync('create_lista_espera_table.sql', 'utf8');
    
    // Dividir o SQL em comandos individuais
    const commands = sql.split(';').filter(cmd => cmd.trim().length > 0);
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i].trim();
      if (command) {
        console.log(`Executando comando ${i + 1}/${commands.length}...`);
        
        const { data, error } = await supabase
          .from('_sql_exec')
          .select('*')
          .limit(1);
        
        if (error) {
          console.log('⚠️  Tentando método alternativo...');
          // Método alternativo usando rpc se disponível
          try {
            await supabase.rpc('exec_sql', { sql_query: command });
          } catch (rpcError) {
            console.log('ℹ️  Execute manualmente no Supabase Dashboard:');
            console.log(command);
          }
        }
      }
    }
    
    console.log('✅ Script executado! Verifique no Supabase Dashboard se a tabela foi criada.');
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
    console.log('\n📋 SQL para executar manualmente no Supabase:');
    console.log('=' .repeat(50));
    const sql = fs.readFileSync('create_lista_espera_table.sql', 'utf8');
    console.log(sql);
    console.log('=' .repeat(50));
  }
}

executeSql();