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
const anonKey = envVars.VITE_SUPABASE_PUBLISHABLE_KEY;

console.log('🔍 Testando login do Anderson...');
console.log('URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, anonKey);

async function testLogin() {
  try {
    // Primeiro, vamos tentar fazer login
    console.log('📧 Tentando fazer login com andersondejesus@gmail.com...');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'andersondejesus@gmail.com',
      password: '123456' // senha padrão que usamos
    });
    
    if (error) {
      console.log('❌ Erro no login:', error.message);
      
      // Vamos verificar se o usuário existe na tabela profiles
      console.log('🔍 Verificando se existe na tabela profiles...');
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', 'andersondejesus@gmail.com')
        .single();
        
      if (profileError) {
        console.log('❌ Erro ao buscar profile:', profileError.message);
      } else if (profileData) {
        console.log('✅ Usuário encontrado na tabela profiles:');
        console.log('- Email:', profileData.email);
        console.log('- Status:', profileData.status);
        console.log('- Active:', profileData.active);
        console.log('- Role:', profileData.role);
        console.log('❌ MAS não existe na auth.users - precisa ser criado!');
      }
      
    } else {
      console.log('✅ Login realizado com sucesso!');
      console.log('- User ID:', data.user.id);
      console.log('- Email:', data.user.email);
      console.log('- Email confirmado:', data.user.email_confirmed_at ? 'SIM' : 'NÃO');
    }
    
  } catch (err) {
    console.log('❌ Erro geral:', err.message);
  }
}

testLogin();