const { createClient } = require('@supabase/supabase-js');

// Carregar variáveis de ambiente manualmente
const fs = require('fs');
const path = require('path');

function loadEnv() {
  try {
    const envPath = path.join(__dirname, '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    for (const line of lines) {
      if (line.trim() && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/"/g, '').trim();
          process.env[key.trim()] = value;
        }
      }
    }
  } catch (error) {
    console.log('Arquivo .env não encontrado, usando variáveis do sistema');
  }
}

loadEnv();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

async function checkTables() {
  console.log('🔍 Verificando tabelas necessárias...');
  
  const tables = ['profiles', 'users', 'departamentos', 'funcionarios'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`❌ Tabela ${table}: ${error.message}`);
      } else {
        console.log(`✅ Tabela ${table}: OK`);
      }
    } catch (err) {
      console.log(`❌ Tabela ${table}: ${err.message}`);
    }
  }
}

checkTables().catch(console.error);