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

async function fixQueziaAuth() {
  try {
    console.log('🔧 Corrigindo autenticação da Quezia...\n');

    // Primeiro, verificar se o usuário já existe no auth
    const { data: existingUser, error: checkError } = await supabase.auth.admin.listUsers();
    
    if (checkError) {
      console.error('❌ Erro ao verificar usuários existentes:', checkError);
      return;
    }

    const queziaAuthUser = existingUser.users.find(user => user.email === 'borges.quezia@yahoo.com.br');
    
    if (queziaAuthUser) {
      console.log('👤 Usuário já existe no auth.users, atualizando senha...');
      
      // Atualizar a senha do usuário existente
      const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
        queziaAuthUser.id,
        {
          password: 'Brasilia@2026',
          email_confirm: true
        }
      );

      if (updateError) {
        console.error('❌ Erro ao atualizar senha:', updateError);
        return;
      }

      console.log('✅ Senha atualizada com sucesso!');
      console.log('- User ID:', updateData.user.id);
      console.log('- Email:', updateData.user.email);
      
    } else {
      console.log('👤 Criando novo usuário no auth.users...');
      
      // Criar novo usuário no auth
      const { data: createData, error: createError } = await supabase.auth.admin.createUser({
        email: 'borges.quezia@yahoo.com.br',
        password: 'Brasilia@2026',
        email_confirm: true,
        user_metadata: {
          name: 'Quezia Borges Machado',
          role: 'admin'
        }
      });

      if (createError) {
        console.error('❌ Erro ao criar usuário:', createError);
        return;
      }

      console.log('✅ Usuário criado com sucesso!');
      console.log('- User ID:', createData.user.id);
      console.log('- Email:', createData.user.email);

      // Atualizar o ID na tabela public.users se necessário
      const { error: updatePublicError } = await supabase
        .from('users')
        .update({ id: createData.user.id })
        .eq('email', 'borges.quezia@yahoo.com.br');

      if (updatePublicError) {
        console.error('⚠️ Aviso: Erro ao atualizar ID na tabela public.users:', updatePublicError);
      } else {
        console.log('✅ ID sincronizado na tabela public.users');
      }

      // Atualizar o ID na tabela profiles se necessário
      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({ id: createData.user.id })
        .eq('email', 'borges.quezia@yahoo.com.br');

      if (updateProfileError) {
        console.error('⚠️ Aviso: Erro ao atualizar ID na tabela profiles:', updateProfileError);
      } else {
        console.log('✅ ID sincronizado na tabela profiles');
      }
    }

    // Testar o login
    console.log('\n🔐 Testando login...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'borges.quezia@yahoo.com.br',
      password: 'Brasilia@2026'
    });

    if (loginError) {
      console.error('❌ Erro no login:', loginError.message);
    } else {
      console.log('✅ Login realizado com sucesso!');
      console.log('- User ID:', loginData.user?.id);
      console.log('- Email:', loginData.user?.email);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

fixQueziaAuth();