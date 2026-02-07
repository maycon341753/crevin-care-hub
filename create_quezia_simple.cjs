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

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

// Usar a chave anônima para signup
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createQueziaSimple() {
  try {
    console.log('🔧 Criando usuária Quezia usando signup...\n');

    const email = 'borges.quezia@yahoo.com.br';
    const password = 'Brasilia@2026';

    // Tentar fazer signup
    console.log('👤 Tentando criar conta...');
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          name: 'Quezia Borges Machado',
          role: 'admin'
        }
      }
    });

    if (signupError) {
      console.error('❌ Erro no signup:', signupError.message);
      
      // Se o usuário já existe, tentar fazer login
      if (signupError.message.includes('already registered')) {
        console.log('⚠️ Usuário já existe, tentando fazer login...');
        
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: email,
          password: password
        });

        if (loginError) {
          console.error('❌ Erro no login:', loginError.message);
          
          // Tentar reset de senha
          console.log('🔄 Tentando reset de senha...');
          const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: 'http://localhost:8080/reset-password'
          });

          if (resetError) {
            console.error('❌ Erro no reset:', resetError.message);
          } else {
            console.log('✅ Email de reset enviado!');
          }
        } else {
          console.log('✅ Login realizado com sucesso!');
          console.log('- User ID:', loginData.user?.id);
          console.log('- Email:', loginData.user?.email);
        }
      }
    } else {
      console.log('✅ Conta criada com sucesso!');
      console.log('- User ID:', signupData.user?.id);
      console.log('- Email:', signupData.user?.email);
      console.log('- Confirmação necessária:', signupData.user?.email_confirmed_at ? 'Não' : 'Sim');

      // Se a conta foi criada, tentar fazer login
      console.log('\n🔐 Testando login...');
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (loginError) {
        console.error('❌ Erro no login:', loginError.message);
      } else {
        console.log('✅ Login realizado com sucesso!');
        console.log('- User ID:', loginData.user?.id);
        console.log('- Email:', loginData.user?.email);
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

createQueziaSimple();