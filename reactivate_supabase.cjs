// Lendo variáveis diretamente do arquivo .env
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
        envVars[key.trim()] = value.trim().replace(/"/g, '');
      }
    });
    
    return envVars;
  } catch (error) {
    console.error('Erro ao ler .env:', error.message);
    return {};
  }
}

async function reactivateSupabase() {
  const envVars = loadEnvVars();
  const supabaseUrl = envVars.VITE_SUPABASE_URL;
  const supabaseKey = envVars.VITE_SUPABASE_PUBLISHABLE_KEY;
  
  console.log('🔄 Tentando reativar projeto Supabase...');
  console.log('URL:', supabaseUrl);
  
  try {
    // Tentativa 1: Fazer uma chamada simples à tabela profiles
    console.log('\n📋 Tentando acessar tabela profiles...');
    const profilesResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?select=id&limit=1`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status profiles:', profilesResponse.status);
    
    if (profilesResponse.ok) {
      console.log('✅ Projeto reativado! Tabela profiles acessível.');
      const data = await profilesResponse.json();
      console.log('Dados recebidos:', data);
      return true;
    }
    
    // Tentativa 2: Fazer uma chamada à tabela users
    console.log('\n👥 Tentando acessar tabela users...');
    const usersResponse = await fetch(`${supabaseUrl}/rest/v1/users?select=id&limit=1`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status users:', usersResponse.status);
    
    if (usersResponse.ok) {
      console.log('✅ Projeto reativado! Tabela users acessível.');
      const data = await usersResponse.json();
      console.log('Dados recebidos:', data);
      return true;
    }
    
    // Tentativa 3: Fazer uma chamada genérica para qualquer tabela
    console.log('\n🔍 Tentando chamada genérica...');
    const genericResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Accept': 'application/json'
      }
    });
    
    console.log('Status genérico:', genericResponse.status);
    
    if (genericResponse.status === 200 || genericResponse.status === 406) {
      console.log('✅ Projeto parece estar reativando...');
      console.log('💡 Aguarde alguns minutos para que o projeto seja totalmente reativado.');
      return true;
    }
    
    console.log('❌ Não foi possível reativar o projeto');
    console.log('Response:', await genericResponse.text());
    return false;
    
  } catch (error) {
    console.error('❌ Erro ao tentar reativar:', error.message);
    
    if (error.message.includes('fetch failed')) {
      console.log('\n💡 O projeto pode estar sendo reativado. Tente novamente em alguns minutos.');
    }
    
    return false;
  }
}

// Executar reativação
reactivateSupabase()
  .then(success => {
    if (success) {
      console.log('\n🎉 Processo de reativação iniciado com sucesso!');
      console.log('💡 Agora você pode tentar criar usuários novamente.');
    } else {
      console.log('\n❌ Falha na reativação. Verifique o dashboard do Supabase.');
    }
  })
  .catch(console.error);