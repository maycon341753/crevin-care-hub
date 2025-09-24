const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Lê as variáveis de ambiente do arquivo .env
const envPath = path.join(__dirname, '.env');
const envVars = {};

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      envVars[key.trim()] = value.trim();
    }
  });
}

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Variáveis de ambiente do Supabase não encontradas');
  console.log('Verifique se o arquivo .env existe e contém:');
  console.log('VITE_SUPABASE_URL=sua_url');
  console.log('VITE_SUPABASE_ANON_KEY=sua_chave');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLembretesTable() {
  try {
    console.log('🔍 Verificando se a tabela lembretes existe...');
    
    // Tenta fazer uma query simples na tabela
    const { data, error } = await supabase
      .from('lembretes')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      if (error.message.includes('does not exist') || error.code === 'PGRST106') {
        console.log('❌ Tabela lembretes não existe');
        console.log('📝 Será necessário criar a tabela');
        return false;
      } else {
        console.log('❌ Erro ao verificar tabela:', error.message);
        console.log('🔍 Código do erro:', error.code);
        return false;
      }
    }
    
    console.log('✅ Tabela lembretes existe');
    console.log('📊 Total de registros:', data || 0);
    return true;
  } catch (err) {
    console.log('❌ Erro:', err.message);
    return false;
  }
}

checkLembretesTable().then(exists => {
  if (!exists) {
    console.log('\n🛠️  Para criar a tabela, execute o script SQL:');
    console.log('   create_lembretes_table.sql');
  }
});