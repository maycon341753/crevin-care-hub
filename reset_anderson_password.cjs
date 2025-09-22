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

console.log('🔑 Redefinindo senha do Anderson...');

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function resetAndersonPassword() {
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
    console.log('- Email confirmado:', anderson.email_confirmed_at ? 'SIM' : 'NÃO');
    
    // Redefinir a senha
    const { data, error } = await supabase.auth.admin.updateUserById(
      anderson.id,
      { 
        password: 'admin123',
        email_confirm: true,
        user_metadata: {
          full_name: 'Anderson de Jesus'
        }
      }
    );
    
    if (error) {
      console.log('❌ Erro ao redefinir senha:', error.message);
      return;
    }
    
    console.log('✅ Senha redefinida com sucesso!');
    
    // Agora vamos testar o login com a nova senha
    console.log('\n🔐 Testando login com nova senha...');
    
    const anonKey = envVars.VITE_SUPABASE_PUBLISHABLE_KEY;
    const clientSupabase = createClient(supabaseUrl, anonKey);
    
    const { data: loginData, error: loginError } = await clientSupabase.auth.signInWithPassword({
      email: 'andersondejesus@gmail.com',
      password: 'admin123'
    });
    
    if (loginError) {
      console.log('❌ Erro no login:', loginError.message);
      
      // Vamos tentar com a senha original também
      console.log('\n🔐 Testando com senha original (123456)...');
      const { data: loginData2, error: loginError2 } = await clientSupabase.auth.signInWithPassword({
        email: 'andersondejesus@gmail.com',
        password: '123456'
      });
      
      if (loginError2) {
        console.log('❌ Erro no login com senha original:', loginError2.message);
      } else {
        console.log('✅ Login realizado com senha original!');
        console.log('- User ID:', loginData2.user.id);
        console.log('- Email:', loginData2.user.email);
      }
    } else {
      console.log('✅ Login realizado com nova senha!');
      console.log('- User ID:', loginData.user.id);
      console.log('- Email:', loginData.user.email);
    }
    
    console.log('\n🎉 CREDENCIAIS PARA TESTE:');
    console.log('📧 Email: andersondejesus@gmail.com');
    console.log('🔑 Senha nova: admin123');
    console.log('🔑 Senha original: 123456');
    
  } catch (err) {
    console.log('❌ Erro geral:', err.message);
  }
}

resetAndersonPassword();