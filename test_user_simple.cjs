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

async function testUserCreationSimple() {
  const envVars = loadEnvVars();
  const supabaseUrl = envVars.VITE_SUPABASE_URL;
  const supabaseKey = envVars.VITE_SUPABASE_PUBLISHABLE_KEY;
  
  console.log('🧪 Teste simples de criação de usuário...');
  
  const testUser = {
    id: `test-user-${Date.now()}`,
    email: 'teste@exemplo.com',
    full_name: 'Usuário de Teste',
    role: 'user'
  };
  
  console.log('📝 Dados do usuário:', testUser);
  
  try {
    // Teste 1: Inserir na tabela profiles (que sabemos que existe)
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
      
      // Limpar dados de teste
      console.log('\n🧹 Removendo dados de teste...');
      const deleteResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${testUser.id}`, {
        method: 'DELETE',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      
      if (deleteResponse.ok) {
        console.log('✅ Dados de teste removidos com sucesso');
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
testUserCreationSimple()
  .then(success => {
    if (success) {
      console.log('\n🎉 Teste de criação de usuário passou!');
      console.log('💡 O sistema de criação de usuários está funcionando.');
    } else {
      console.log('\n❌ Teste falhou. Verifique as configurações.');
    }
  })
  .catch(console.error);