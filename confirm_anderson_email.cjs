const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Lendo as variáveis do .env
const envContent = fs.readFileSync('.env', 'utf8');
const envLines = envContent.split('\n');
const envVars = {};
envLines.forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim().replace(/"/g, '');
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const serviceRoleKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

console.log('📧 Confirmando email do Anderson...');

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function confirmAndersonEmail() {
  try {
    // Primeiro, vamos buscar o usuário Anderson
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.log('❌ Erro ao listar usuários:', listError.message);
      return;
    }
    
    const anderson = users.users.find(user => 
      user.email === 'andersondejesus@gmail.com'
    );
    
    if (!anderson) {
      console.log('❌ Anderson não encontrado na auth.users');
      return;
    }
    
    console.log('👤 Anderson encontrado:');
    console.log('- ID:', anderson.id);
    console.log('- Email:', anderson.email);
    console.log('- Email confirmado antes:', anderson.email_confirmed_at ? 'SIM' : 'NÃO');
    
    // Confirmar o email
    const { data, error } = await supabase.auth.admin.updateUserById(
      anderson.id,
      { 
        email_confirm: true,
        user_metadata: {
          full_name: 'Anderson de Jesus'
        }
      }
    );
    
    if (error) {
      console.log('❌ Erro ao confirmar email:', error.message);
      return;
    }
    
    console.log('✅ Email confirmado com sucesso!');
    console.log('- Email confirmado agora:', data.user.email_confirmed_at ? 'SIM' : 'NÃO');
    
    // Agora vamos testar o login
    console.log('\n🔐 Testando login...');
    
    const anonKey = envVars.VITE_SUPABASE_PUBLISHABLE_KEY;
    const clientSupabase = createClient(supabaseUrl, anonKey);
    
    const { data: loginData, error: loginError } = await clientSupabase.auth.signInWithPassword({
      email: 'andersondejesus@gmail.com',
      password: '123456'
    });
    
    if (loginError) {
      console.log('❌ Erro no login:', loginError.message);
    } else {
      console.log('✅ Login realizado com sucesso!');
      console.log('- User ID:', loginData.user.id);
      console.log('- Email:', loginData.user.email);
    }
    
    console.log('\n🎉 PRONTO! Anderson agora pode fazer login com:');
    console.log('📧 Email: andersondejesus@gmail.com');
    console.log('🔑 Senha: 123456');
    
  } catch (err) {
    console.log('❌ Erro geral:', err.message);
  }
}

confirmAndersonEmail();