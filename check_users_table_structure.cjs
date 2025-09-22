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

async function checkUsersTableStructure() {
  const envVars = loadEnvVars();
  const supabaseUrl = envVars.VITE_SUPABASE_URL;
  const supabaseKey = envVars.VITE_SUPABASE_PUBLISHABLE_KEY;
  
  console.log('🔍 Verificando estrutura da tabela users...');
  
  try {
    // Teste 1: Verificar se a tabela users existe
    console.log('\n1️⃣ Verificando se tabela users existe...');
    const usersResponse = await fetch(`${supabaseUrl}/rest/v1/users?limit=0`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status tabela users:', usersResponse.status);
    
    if (usersResponse.ok) {
      console.log('✅ Tabela users existe');
      
      // Teste 2: Tentar fazer uma inserção para descobrir a estrutura
      console.log('\n2️⃣ Testando estrutura da tabela users...');
      const testResponse = await fetch(`${supabaseUrl}/rest/v1/users`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          id: 'test-structure-check',
          email: 'test@test.com'
        })
      });
      
      if (!testResponse.ok) {
        const errorText = await testResponse.text();
        console.log('ℹ️ Erro de estrutura:', errorText);
        
        // Analisar o erro para entender a estrutura
        if (errorText.includes('full_name')) {
          console.log('❌ Campo full_name não existe na tabela users');
        }
        if (errorText.includes('role')) {
          console.log('❌ Campo role não existe na tabela users');
        }
        if (errorText.includes('uuid')) {
          console.log('ℹ️ Campo id deve ser UUID');
        }
      }
      
    } else {
      const errorText = await usersResponse.text();
      console.log('❌ Tabela users não existe ou não é acessível:', errorText);
    }
    
    // Teste 3: Verificar estrutura da tabela profiles (que sabemos que funciona)
    console.log('\n3️⃣ Verificando estrutura da tabela profiles...');
    const profilesResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?limit=1`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (profilesResponse.ok) {
      const profilesData = await profilesResponse.json();
      console.log('✅ Estrutura da tabela profiles:');
      if (profilesData.length > 0) {
        console.log('Campos disponíveis:', Object.keys(profilesData[0]));
      } else {
        console.log('Tabela profiles está vazia, mas existe');
      }
    }
    
    // Teste 4: Listar todas as tabelas disponíveis
    console.log('\n4️⃣ Tentando descobrir tabelas disponíveis...');
    
    const tables = ['users', 'profiles', 'departamentos', 'funcionarios', 'idosos', 'advertencias'];
    
    for (const table of tables) {
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/${table}?limit=0`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          console.log(`✅ Tabela ${table} existe`);
        } else {
          console.log(`❌ Tabela ${table} não existe ou não é acessível`);
        }
      } catch (error) {
        console.log(`❌ Erro ao verificar tabela ${table}:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro na verificação:', error.message);
  }
}

// Executar verificação
checkUsersTableStructure().catch(console.error);