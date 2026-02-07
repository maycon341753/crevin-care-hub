const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://lhgujxyfxyxzozgokutf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxoZ3VqeHlmeHl4em96Z29rdXRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM5MDY2NSwiZXhwIjoyMDczOTY2NjY1fQ.AHq_kORGZlUpzsRM2Zy5wlGkzRbEr2wbB8AAyFDAEyk';

const supabase = createClient(supabaseUrl, supabaseKey);

// Dados do usuário a ser criado
const userData = {
  email: 'daniellemoura16@gmail.com',
  password: 'Admin@2025',
  full_name: 'Danielle da Silva Moura',
  cpf: '05437633157',
  role: 'admin'
};

async function createUserDirectly() {
  console.log('🚀 Iniciando criação de usuário diretamente no Supabase...');
  console.log('📧 Email:', userData.email);
  console.log('👤 Nome:', userData.full_name);
  console.log('🔑 Role:', userData.role);
  console.log('📄 CPF:', userData.cpf);
  console.log('');

  try {
    // 1. Criar usuário na autenticação
    console.log('1️⃣ Criando usuário na autenticação...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true, // Confirma o email automaticamente
      user_metadata: {
        full_name: userData.full_name,
        cpf: userData.cpf
      }
    });

    if (authError) {
      console.error('❌ Erro ao criar usuário na autenticação:', authError.message);
      return;
    }

    console.log('✅ Usuário criado na autenticação!');
    console.log('🆔 User ID:', authData.user.id);
    console.log('📧 Email:', authData.user.email);
    console.log('');

    // 2. Criar perfil na tabela profiles
    console.log('2️⃣ Criando perfil na tabela profiles...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: authData.user.id,
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role
      })
      .select();

    if (profileError) {
      console.error('❌ Erro ao criar perfil:', profileError.message);
      console.log('ℹ️ Tentando atualizar perfil existente...');
      
      // Tentar atualizar se já existir
      const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update({
          email: userData.email,
          full_name: userData.full_name,
          role: userData.role
        })
        .eq('user_id', authData.user.id)
        .select();

      if (updateError) {
        console.error('❌ Erro ao atualizar perfil:', updateError.message);
      } else {
        console.log('✅ Perfil atualizado com sucesso!');
        console.log('📊 Dados do perfil:', updateData[0]);
      }
    } else {
      console.log('✅ Perfil criado com sucesso!');
      console.log('📊 Dados do perfil:', profileData[0]);
    }
    console.log('');

    // 3. Verificar se existe tabela users e inserir dados
    console.log('3️⃣ Verificando tabela users...');
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .insert({
        auth_user_id: authData.user.id,
        email: userData.email,
        email_verified: true,
        status: 'active'
      })
      .select();

    if (usersError) {
      console.log('ℹ️ Tabela users não existe ou erro:', usersError.message);
    } else {
      console.log('✅ Dados inseridos na tabela users!');
      console.log('📊 Dados users:', usersData[0]);
    }
    console.log('');

    // 4. Verificar se existe tabela funcionarios e inserir CPF
    console.log('4️⃣ Verificando tabela funcionarios...');
    const { data: funcionariosData, error: funcionariosError } = await supabase
      .from('funcionarios')
      .insert({
        nome: userData.full_name,
        email: userData.email,
        cpf: userData.cpf,
        cargo: 'Administrador',
        status: 'ativo'
      })
      .select();

    if (funcionariosError) {
      console.log('ℹ️ Tabela funcionarios não existe ou erro:', funcionariosError.message);
    } else {
      console.log('✅ Dados inseridos na tabela funcionarios!');
      console.log('📊 Dados funcionarios:', funcionariosData[0]);
    }
    console.log('');

    // 5. Verificação final
    console.log('5️⃣ Verificação final...');
    const { data: finalCheck, error: finalError } = await supabase
      .from('profiles')
      .select(`
        user_id,
        email,
        full_name,
        role,
        created_at
      `)
      .eq('email', userData.email)
      .single();

    if (finalError) {
      console.error('❌ Erro na verificação final:', finalError.message);
    } else {
      console.log('🎯 USUÁRIO CRIADO COM SUCESSO!');
      console.log('');
      console.log('📋 RESUMO FINAL:');
      console.log('🆔 User ID:', finalCheck.user_id);
      console.log('📧 Email:', finalCheck.email);
      console.log('👤 Nome:', finalCheck.full_name);
      console.log('🔑 Role:', finalCheck.role);
      console.log('📄 CPF:', userData.cpf);
      console.log('📅 Criado em:', finalCheck.created_at);
      console.log('');
      console.log('🔐 CREDENCIAIS DE LOGIN:');
      console.log('📧 Email:', userData.email);
      console.log('🔒 Senha:', userData.password);
      console.log('');
      console.log('✅ O usuário já pode fazer login na aplicação!');
    }

  } catch (error) {
    console.error('💥 Erro geral:', error.message);
  }
}

// Executar a função
createUserDirectly();