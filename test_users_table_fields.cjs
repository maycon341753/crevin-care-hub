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

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function testUsersTableFields() {
  const envVars = loadEnvVars();
  const supabaseUrl = envVars.VITE_SUPABASE_URL;
  const supabaseKey = envVars.VITE_SUPABASE_PUBLISHABLE_KEY;
  
  console.log('🔍 Descobrindo estrutura da tabela users...');
  
  try {
    // Primeiro, vamos ver se há dados existentes na tabela users
    console.log('\n1️⃣ Verificando dados existentes na tabela users...');
    const existingResponse = await fetch(`${supabaseUrl}/rest/v1/users?limit=1`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (existingResponse.ok) {
      const existingData = await existingResponse.json();
      if (existingData.length > 0) {
        console.log('✅ Estrutura da tabela users (baseada em dados existentes):');
        console.log('Campos disponíveis:', Object.keys(existingData[0]));
        console.log('Exemplo de registro:', existingData[0]);
        return;
      } else {
        console.log('ℹ️ Tabela users está vazia, testando inserção...');
      }
    }
    
    // Se não há dados, vamos testar diferentes combinações de campos
    console.log('\n2️⃣ Testando diferentes estruturas de campos...');
    
    const testCases = [
      // Caso 1: Apenas campos básicos
      {
        name: 'Campos básicos (id, email)',
        data: {
          id: generateUUID(),
          email: 'test1@test.com'
        }
      },
      // Caso 2: Com campos de auth
      {
        name: 'Campos de autenticação',
        data: {
          id: generateUUID(),
          email: 'test2@test.com',
          encrypted_password: 'test',
          email_confirmed_at: new Date().toISOString()
        }
      },
      // Caso 3: Campos mínimos do Supabase Auth
      {
        name: 'Campos mínimos Auth',
        data: {
          id: generateUUID(),
          email: 'test3@test.com',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n🧪 Testando: ${testCase.name}`);
      
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/users`, {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(testCase.data)
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('✅ Sucesso! Estrutura aceita:', Object.keys(result[0]));
          console.log('Dados inseridos:', result[0]);
          
          // Limpar dados de teste
          await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${testCase.data.id}`, {
            method: 'DELETE',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`
            }
          });
          console.log('🧹 Dados de teste removidos');
          break;
          
        } else {
          const errorText = await response.text();
          console.log('❌ Falhou:', errorText);
        }
        
      } catch (error) {
        console.log('❌ Erro:', error.message);
      }
    }
    
    // Teste adicional: verificar se é uma tabela do Supabase Auth
    console.log('\n3️⃣ Verificando se é tabela do Supabase Auth...');
    
    try {
      // Tentar acessar via auth schema
      const authResponse = await fetch(`${supabaseUrl}/rest/v1/auth.users?limit=1`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (authResponse.ok) {
        console.log('✅ Tabela users pode ser do schema auth');
      } else {
        console.log('ℹ️ Não é tabela do schema auth');
      }
    } catch (error) {
      console.log('ℹ️ Erro ao testar schema auth:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Erro na verificação:', error.message);
  }
}

// Executar teste
testUsersTableFields().catch(console.error);