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

async function checkSupabaseStatus() {
  const envVars = loadEnvVars();
  const supabaseUrl = envVars.VITE_SUPABASE_URL;
  const supabaseKey = envVars.VITE_SUPABASE_PUBLISHABLE_KEY;
  
  console.log('🔍 Verificando status do projeto Supabase...');
  console.log('URL:', supabaseUrl);
  console.log('Key (primeiros 20 chars):', supabaseKey?.substring(0, 20) + '...');
  
  try {
    // Teste 1: Verificar se a URL base responde
    console.log('\n📡 Testando conectividade básica...');
    const baseResponse = await fetch(supabaseUrl);
    console.log('Status da URL base:', baseResponse.status);
    
    if (baseResponse.status === 404) {
      console.log('❌ Projeto parece estar pausado (404)');
      console.log('💡 Tentando reativar fazendo uma chamada à API...');
      
      // Teste 2: Tentar fazer uma chamada à API REST para reativar
      const restUrl = `${supabaseUrl}/rest/v1/`;
      const restResponse = await fetch(restUrl, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Status da API REST:', restResponse.status);
      
      if (restResponse.status === 200) {
        console.log('✅ Projeto reativado com sucesso!');
        
        // Teste 3: Verificar se conseguimos listar tabelas
        console.log('\n📋 Testando listagem de tabelas...');
        const tablesResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Accept': 'application/json'
          }
        });
        
        if (tablesResponse.ok) {
          const tables = await tablesResponse.text();
          console.log('✅ API REST funcionando:', tables.substring(0, 200) + '...');
        }
        
      } else {
        console.log('❌ Falha ao reativar projeto');
        console.log('Response:', await restResponse.text());
      }
    } else {
      console.log('✅ Projeto parece estar ativo');
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar status:', error.message);
    
    if (error.message.includes('fetch failed')) {
      console.log('\n💡 Possíveis soluções:');
      console.log('1. Verificar se o projeto está pausado no dashboard Supabase');
      console.log('2. Verificar se as credenciais estão corretas');
      console.log('3. Verificar conectividade de rede');
      console.log('4. Aguardar alguns minutos se o projeto foi recém-reativado');
    }
  }
}

// Executar verificação
checkSupabaseStatus().catch(console.error);