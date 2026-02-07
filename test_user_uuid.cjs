// Lendo variáveis diretamente do arquivo .env
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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

// Função para gerar UUID v4
function generateUUID() {
  return crypto.randomUUID();
}

async function testUserCreationWithUUID() {
  const envVars = loadEnvVars();
  const supabaseUrl = envVars.VITE_SUPABASE_URL;
  const supabaseKey = envVars.VITE_SUPABASE_PUBLISHABLE_KEY;
  
  console.log('🧪 Teste de criação de usuário com UUID válido...');
  
  const testUser = {
    id: generateUUID(),
    email: 'teste@exemplo.com',
    full_name: 'Usuário de Teste',
    role: 'user'
  };
  
  console.log('📝 Dados do usuário:', testUser);
  
  try {
    // Teste 1: Inserir na tabela profiles
    console.log('\n1️⃣ Testando inserção na tabela profiles...');
    
    const profileResponse = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        id: testUser.id,
        email: testUser.email,
        full_name: testUser.full_name,
        role: testUser.role
      })
    });
    
    console.log('Status profiles:', profileResponse.status);
    
    if (profileResponse.ok) {
      const profileData = await profileResponse.json();
      console.log('✅ Usuário criado na tabela profiles:', profileData);
      
      // Teste 2: Verificar se o usuário foi criado
      console.log('\n2️⃣ Verificando usuário criado...');
      const checkResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${testUser.id}`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (checkResponse.ok) {
        const userData = await checkResponse.json();
        console.log('✅ Usuário encontrado:', userData);
      }
      
      // Teste 3: Tentar inserir na tabela users (se existir)
      console.log('\n3️⃣ Testando inserção na tabela users...');
      const userResponse = await fetch(`${supabaseUrl}/rest/v1/users`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          id: testUser.id,
          email: testUser.email,
          full_name: testUser.full_name,
          role: testUser.role
        })
      });
      
      console.log('Status users:', userResponse.status);
      
      if (userResponse.ok) {
        const usersData = await userResponse.json();
        console.log('✅ Usuário criado na tabela users:', usersData);
      } else {
        const errorText = await userResponse.text();
        console.log('ℹ️ Tabela users pode não existir ou ter restrições:', errorText);
      }
      
      // Limpar dados de teste
      console.log('\n🧹 Removendo dados de teste...');
      
      // Remover da tabela profiles
      const deleteProfileResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${testUser.id}`, {
        method: 'DELETE',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      
      if (deleteProfileResponse.ok) {
        console.log('✅ Dados removidos da tabela profiles');
      }
      
      // Tentar remover da tabela users
      const deleteUserResponse = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${testUser.id}`, {
        method: 'DELETE',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      
      if (deleteUserResponse.ok) {
        console.log('✅ Dados removidos da tabela users');
      }
      
      return true;
    } else {
      const errorText = await profileResponse.text();
      console.log('❌ Erro ao criar usuário:', errorText);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    return false;
  }
}

// Executar teste
testUserCreationWithUUID()
  .then(success => {
    if (success) {
      console.log('\n🎉 Teste de criação de usuário passou!');
      console.log('💡 O sistema de criação de usuários está funcionando corretamente.');
      console.log('💡 O problema era que o ID precisa ser um UUID válido.');
    } else {
      console.log('\n❌ Teste falhou. Verifique as configurações.');
    }
  })
  .catch(console.error);