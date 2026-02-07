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
const serviceRoleKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Criando usuária Quezia na tabela auth.users...\n');

// Usar service role key para acesso administrativo
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

async function createQueziaAuth() {
  try {
    const email = 'borges.quezia@yahoo.com.br';
    const password = 'Brasilia@2026';
    const existingUserId = '8264fea5-ef75-4b84-b6e7-92a7476fc0b4';

    console.log('👤 Verificando se Quezia já existe em auth.users...');
    
    // Verificar se já existe
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    if (existingUser) {
      console.log('⚠️ Usuário já existe em auth.users:', existingUser.id);
      
      // Atualizar senha
      console.log('🔄 Atualizando senha...');
      const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        { password: password }
      );

      if (updateError) {
        console.error('❌ Erro ao atualizar senha:', updateError.message);
      } else {
        console.log('✅ Senha atualizada com sucesso!');
      }
    } else {
      console.log('➕ Criando novo usuário em auth.users...');
      
      // Criar usuário com ID específico
      const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        user_id: existingUserId,
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
          name: 'Quezia Borges Machado',
          role: 'admin'
        }
      });

      if (createError) {
        console.error('❌ Erro ao criar usuário:', createError.message);
        
        // Se falhar com ID específico, tentar sem ID
        console.log('🔄 Tentando criar sem ID específico...');
        const { data: createData2, error: createError2 } = await supabaseAdmin.auth.admin.createUser({
          email: email,
          password: password,
          email_confirm: true,
          user_metadata: {
            name: 'Quezia Borges Machado',
            role: 'admin'
          }
        });

        if (createError2) {
          console.error('❌ Erro ao criar usuário (sem ID):', createError2.message);
        } else {
          console.log('✅ Usuário criado com sucesso!');
          console.log('- Novo ID:', createData2.user?.id);
          console.log('- Email:', createData2.user?.email);
          
          // Atualizar as tabelas públicas com o novo ID
          const newUserId = createData2.user?.id;
          if (newUserId) {
            console.log('🔄 Atualizando tabelas públicas com novo ID...');
            
            // Atualizar users
            const { error: updateUsersError } = await supabaseAdmin
              .from('users')
              .update({ id: newUserId })
              .eq('email', email);

            if (updateUsersError) {
              console.error('❌ Erro ao atualizar users:', updateUsersError.message);
            } else {
              console.log('✅ Tabela users atualizada');
            }

            // Atualizar profiles
            const { error: updateProfilesError } = await supabaseAdmin
              .from('profiles')
              .update({ user_id: newUserId })
              .eq('email', email);

            if (updateProfilesError) {
              console.error('❌ Erro ao atualizar profiles:', updateProfilesError.message);
            } else {
              console.log('✅ Tabela profiles atualizada');
            }
          }
        }
      } else {
        console.log('✅ Usuário criado com ID específico!');
        console.log('- ID:', createData.user?.id);
        console.log('- Email:', createData.user?.email);
      }
    }

    // Testar login
    console.log('\n🔐 Testando login...');
    const supabaseClient = createClient(supabaseUrl, envVars.VITE_SUPABASE_PUBLISHABLE_KEY);
    
    const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (loginError) {
      console.error('❌ Erro no login:', loginError.message);
      console.log('- Código:', loginError.status);
      console.log('- Tipo:', loginError.code);
    } else {
      console.log('✅ Login realizado com sucesso!');
      console.log('- User ID:', loginData.user?.id);
      console.log('- Email:', loginData.user?.email);
      console.log('- Confirmado:', loginData.user?.email_confirmed_at ? 'Sim' : 'Não');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

createQueziaAuth();