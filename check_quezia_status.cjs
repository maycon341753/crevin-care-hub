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
    const value = valueParts.join('=').replace(/"/g, ''); // Remove aspas
    envVars[key.trim()] = value.trim();
  }
});

console.log('🔧 Variáveis carregadas:');
console.log('- URL:', envVars.VITE_SUPABASE_URL);
console.log('- Key length:', envVars.SUPABASE_SERVICE_ROLE_KEY ? envVars.SUPABASE_SERVICE_ROLE_KEY.length : 0);

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkQueziaStatus() {
  try {
    console.log('🔍 Verificando status da usuária Quezia...\n');

    // Usar SQL direto para acessar auth.users
    const { data: authUsers, error: authError } = await supabase
      .rpc('get_user_by_email', { user_email: 'borges.quezia@yahoo.com.br' });

    if (authError) {
      console.log('⚠️ Tentando método alternativo...');
      
      // Verificar na tabela public.users se existir
      const { data: publicUsers, error: publicError } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'borges.quezia@yahoo.com.br');

      if (publicError) {
        console.error('❌ Erro ao buscar na tabela users:', publicError);
      } else {
        console.log('👤 Usuários encontrados na tabela public.users:', publicUsers.length);
        if (publicUsers.length > 0) {
          console.log('Dados:', publicUsers[0]);
        }
      }
    }

    // Verificar na tabela profiles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'borges.quezia@yahoo.com.br');

    if (profileError) {
      console.error('❌ Erro ao buscar perfil:', profileError);
    } else {
      console.log('\n👥 Perfis encontrados:', profiles.length);
      if (profiles.length > 0) {
        const profile = profiles[0];
        console.log('- Nome:', profile.nome);
        console.log('- Email:', profile.email);
        console.log('- Role:', profile.role);
        console.log('- Status:', profile.status);
        console.log('- Ativo:', profile.ativo ? '✅ Sim' : '❌ Não');
      }
    }

    // Tentar fazer login com as credenciais
    console.log('\n🔐 Testando login...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'borges.quezia@yahoo.com.br',
      password: 'Brasilia@2026'
    });

    if (loginError) {
      console.error('❌ Erro no login:', loginError.message);
      console.error('Código do erro:', loginError.status);
      console.error('Detalhes completos:', JSON.stringify(loginError, null, 2));
    } else {
      console.log('✅ Login realizado com sucesso!');
      console.log('- User ID:', loginData.user?.id);
      console.log('- Email:', loginData.user?.email);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkQueziaStatus();