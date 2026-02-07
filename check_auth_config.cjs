const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Carregar variáveis do arquivo .env
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    const value = valueParts.join('=').replace(/"/g, '');
    envVars[key.trim()] = value.trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseAnonKey = envVars.VITE_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Verificando configuração de autenticação do Supabase...\n');

console.log('📋 Variáveis de ambiente:');
console.log('- VITE_SUPABASE_URL:', supabaseUrl);
console.log('- VITE_SUPABASE_PUBLISHABLE_KEY:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'NÃO ENCONTRADA');
console.log('- SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? `${serviceRoleKey.substring(0, 20)}...` : 'NÃO ENCONTRADA');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

// Criar cliente com chave anônima
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAuthConfig() {
  try {
    console.log('\n🔍 Verificando configuração de autenticação...');

    // Verificar se conseguimos acessar o Supabase
    const { data: session } = await supabase.auth.getSession();
    console.log('✅ Conexão com Supabase estabelecida');

    // Verificar configurações de auth
    console.log('\n📊 Testando operações básicas...');

    // Tentar listar usuários (deve falhar com chave anônima)
    try {
      const { data: users, error } = await supabase.from('auth.users').select('*').limit(1);
      if (error) {
        console.log('⚠️ Acesso a auth.users negado (esperado com chave anônima):', error.message);
      } else {
        console.log('✅ Acesso a auth.users permitido');
      }
    } catch (err) {
      console.log('⚠️ Erro ao acessar auth.users:', err.message);
    }

    // Verificar tabela public.users
    try {
      const { data: publicUsers, error } = await supabase.from('users').select('*').limit(1);
      if (error) {
        console.log('⚠️ Erro ao acessar public.users:', error.message);
      } else {
        console.log('✅ Acesso a public.users permitido');
        console.log('- Número de usuários encontrados:', publicUsers?.length || 0);
      }
    } catch (err) {
      console.log('⚠️ Erro ao acessar public.users:', err.message);
    }

    // Verificar se signup está habilitado
    console.log('\n🔐 Testando signup com email temporário...');
    const testEmail = `test-${Date.now()}@example.com`;
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'TestPassword123!'
    });

    if (signupError) {
      console.log('⚠️ Signup falhou:', signupError.message);
      console.log('- Código:', signupError.status);
      
      if (signupError.message.includes('Signups not allowed')) {
        console.log('❌ PROBLEMA IDENTIFICADO: Signup está desabilitado no Supabase!');
        console.log('💡 Solução: Habilitar signup no painel do Supabase em Authentication > Settings');
      }
    } else {
      console.log('✅ Signup funcionando');
      console.log('- User ID:', signupData.user?.id);
    }

    // Testar login com Quezia
    console.log('\n👤 Testando login da Quezia...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'borges.quezia@yahoo.com.br',
      password: 'Brasilia@2026'
    });

    if (loginError) {
      console.log('❌ Login da Quezia falhou:', loginError.message);
      console.log('- Código:', loginError.status);
      console.log('- Tipo:', loginError.code);
    } else {
      console.log('✅ Login da Quezia funcionou!');
      console.log('- User ID:', loginData.user?.id);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkAuthConfig();