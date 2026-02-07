const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Função para carregar variáveis de ambiente
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      if (line.trim() && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        process.env[key.trim()] = value.trim();
      }
    });
  }
}

loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUserCreation() {
  console.log('🧪 Testando criação de usuário...\n');

  const testUser = {
    id: 'test-user-' + Date.now(),
    email: 'teste@exemplo.com',
    full_name: 'Usuário de Teste',
    role: 'user'
  };

  try {
    console.log('📝 Dados do usuário teste:', testUser);

    // 1. Testar inserção na tabela users
    console.log('\n1️⃣ Testando inserção na tabela users...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: testUser.id,
        email: testUser.email,
        full_name: testUser.full_name,
        role: testUser.role
      })
      .select();

    if (userError) {
      console.error('❌ Erro na tabela users:', userError.message);
      console.error('   Código:', userError.code);
      console.error('   Detalhes:', userError.details);
      console.error('   Hint:', userError.hint);
    } else {
      console.log('✅ Usuário inserido na tabela users:', userData);
    }

    // 2. Testar inserção na tabela profiles
    console.log('\n2️⃣ Testando inserção na tabela profiles...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: testUser.id,
        full_name: testUser.full_name,
        role: testUser.role,
        email: testUser.email
      })
      .select();

    if (profileError) {
      console.error('❌ Erro na tabela profiles:', profileError.message);
      console.error('   Código:', profileError.code);
      console.error('   Detalhes:', profileError.details);
      console.error('   Hint:', profileError.hint);
    } else {
      console.log('✅ Perfil inserido na tabela profiles:', profileData);
    }

    // 3. Verificar se os dados foram inseridos
    console.log('\n3️⃣ Verificando dados inseridos...');
    const { data: checkData, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', testUser.id);

    if (checkError) {
      console.error('❌ Erro ao verificar dados:', checkError.message);
    } else {
      console.log('📊 Dados encontrados:', checkData);
    }

    // 4. Limpar dados de teste
    console.log('\n4️⃣ Limpando dados de teste...');
    await supabase.from('profiles').delete().eq('user_id', testUser.id);
    await supabase.from('users').delete().eq('id', testUser.id);
    console.log('🧹 Dados de teste removidos');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testUserCreation();