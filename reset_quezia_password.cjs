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
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetQueziaPassword() {
  try {
    console.log('🔧 Resetando senha da Quezia usando método alternativo...\n');

    // Nova senha
    const newPassword = 'Brasilia@2026';
    
    console.log('🔐 Preparando reset da senha');

    // Primeiro, verificar se existe um usuário auth para este email
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Erro ao listar usuários:', listError);
      return;
    }

    const existingUser = existingUsers.users.find(u => u.email === 'borges.quezia@yahoo.com.br');
    
    if (existingUser) {
      console.log('👤 Usuário encontrado no auth, ID:', existingUser.id);
      
      // Tentar atualizar usando admin API
      const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        {
          password: newPassword,
          email_confirm: true
        }
      );

      if (updateError) {
        console.error('❌ Erro ao atualizar via admin API:', updateError);
      } else {
        console.log('✅ Senha atualizada via admin API!');
      }
    } else {
      console.log('⚠️ Usuário não encontrado no auth.users');
      
      // Tentar criar o usuário
      console.log('👤 Tentando criar usuário...');
      
      const { data: createData, error: createError } = await supabase.auth.admin.createUser({
        email: 'borges.quezia@yahoo.com.br',
        password: newPassword,
        email_confirm: true,
        user_metadata: {
          name: 'Quezia Borges Machado'
        }
      });

      if (createError) {
        console.error('❌ Erro ao criar usuário:', createError);
      } else {
        console.log('✅ Usuário criado com sucesso!');
        console.log('- ID:', createData.user.id);
        console.log('- Email:', createData.user.email);
      }
    }

    // Testar o login
    console.log('\n🔐 Testando login...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'borges.quezia@yahoo.com.br',
      password: newPassword
    });

    if (loginError) {
      console.error('❌ Erro no login:', loginError.message);
      console.error('Detalhes:', JSON.stringify(loginError, null, 2));
    } else {
      console.log('✅ Login realizado com sucesso!');
      console.log('- User ID:', loginData.user?.id);
      console.log('- Email:', loginData.user?.email);
      console.log('- Email confirmado:', loginData.user?.email_confirmed_at ? 'Sim' : 'Não');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

resetQueziaPassword();