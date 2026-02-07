const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Ler variáveis de ambiente do arquivo .env
function loadEnvVars() {
  try {
    const envPath = path.join(__dirname, '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        // Remove aspas duplas do valor
        envVars[key.trim()] = value.trim().replace(/^"(.*)"$/, '$1');
      }
    });
    
    return envVars;
  } catch (error) {
    console.error('❌ Erro ao ler arquivo .env:', error.message);
    return {};
  }
}

const envVars = loadEnvVars();
const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? 'Encontrada' : 'Não encontrada');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'Encontrada' : 'Não encontrada');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
  try {
    console.log('🔍 Verificando se a tabela documentos_medicos existe...');
    
    // Tentar fazer uma consulta simples na tabela
    const { data, error } = await supabase
      .from('documentos_medicos')
      .select('id')
      .limit(1);
    
    if (error) {
      if (error.message.includes('relation "public.documentos_medicos" does not exist')) {
        console.log('❌ Tabela documentos_medicos não existe');
        console.log('💡 Você precisa executar o SQL manualmente no Supabase Dashboard:');
        console.log('   1. Acesse https://supabase.com/dashboard/project/' + envVars.VITE_SUPABASE_PROJECT_ID);
        console.log('   2. Vá para SQL Editor');
        console.log('   3. Execute o conteúdo do arquivo create_medical_documents_table.sql');
        return false;
      } else {
        console.log('⚠️  Erro ao acessar tabela:', error.message);
        return false;
      }
    } else {
      console.log('✅ Tabela documentos_medicos existe e está acessível!');
      return true;
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
    return false;
  }
}

checkTable();