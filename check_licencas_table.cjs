const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnvVars() {
  try {
    const envPath = path.join(__dirname, '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        envVars[key.trim()] = value.trim().replace(/^"(.*)"$/, '$1');
      }
    });
    return envVars;
  } catch (error) {
    console.error('❌ Erro ao ler .env:', error.message);
    return {};
  }
}

const env = loadEnvVars();
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente ausentes. Configure no .env:');
  console.log(' - VITE_SUPABASE_URL');
  console.log(' - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLicencasTable() {
  console.log('🔍 Verificando tabela public.licencas_funcionamento...');
  try {
    const { data, error } = await supabase
      .from('licencas_funcionamento')
      .select('id')
      .limit(1);

    if (error) {
      const code = error.code || 'UNKNOWN';
      console.log('⚠️  Erro:', error.message, '| code:', code);
      if (code === 'PGRST205' || error.message.includes('does not exist')) {
        console.log('\n❌ Tabela não encontrada no schema cache.');
        console.log('✅ Aplique a migration: supabase/migrations/20251112090000_create_licencas_funcionamento.sql');
        console.log('\nOpções:');
        console.log(' - Dashboard > SQL Editor > cole e execute o conteúdo da migration');
        console.log(' - Ou instale o CLI e rode: npx supabase@latest db push');
      }
      return;
    }

    console.log('✅ Tabela encontrada.');
    console.log('📋 Resultado da consulta:', data);
    console.log('\n➡️  Dica: Garanta que o bucket de Storage "licencas" exista (Dashboard > Storage).');
  } catch (err) {
    console.error('❌ Erro geral:', err);
  }
}

checkLicencasTable();