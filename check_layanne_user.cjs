const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Carregar variáveis do .env
const envContent = fs.readFileSync('.env', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim().replace(/[\"']/g, '');
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Verificando usuário Layanne no Supabase Auth...');
console.log('URL:', supabaseUrl);

async function checkLayanneUser() {
  try {
    // Usar service role key para acessar auth.users
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('\n📋 Verificando se usuário existe no auth.users...');
    
    // Buscar usuário por email
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.log('❌ Erro ao buscar usuários:', usersError.message);
      return;
    }
    
    const layanne = users.users.find(user => user.email === 'layanne.crevin@gmail.com');
    
    if (layanne) {
      console.log('✅ Usuário encontrado no auth.users:');
      console.log('   ID:', layanne.id);
      console.log('   Email:', layanne.email);
      console.log('   Criado em:', layanne.created_at);
      console.log('   Email confirmado:', layanne.email_confirmed_at ? 'Sim' : 'Não');
      console.log('   Último login:', layanne.last_sign_in_at || 'Nunca');
      
      // Verificar se existe perfil
      console.log('\n👤 Verificando perfil na tabela profiles...');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', layanne.id)
        .single();
      
      if (profileError) {
        console.log('❌ Erro ao buscar perfil:', profileError.message);
        console.log('   Código:', profileError.code);
      } else if (profile) {
        console.log('✅ Perfil encontrado:');
        console.log('   Nome:', profile.full_name);
        console.log('   Role:', profile.role);
        console.log('   Ativo:', profile.active);
      } else {
        console.log('⚠️ Perfil não encontrado na tabela profiles');
      }
      
    } else {
      console.log('❌ Usuário NÃO encontrado no auth.users');
      console.log('📝 Usuários existentes:');
      users.users.forEach(user => {
        console.log(`   - ${user.email} (${user.id})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

checkLayanneUser();