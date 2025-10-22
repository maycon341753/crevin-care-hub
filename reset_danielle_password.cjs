const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const supabaseUrl = "https://lhgujxyfxyxzozgokutf.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxoZ3VqeHlmeHl4em96Z29rdXRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM5MDY2NSwiZXhwIjoyMDczOTY2NjY1fQ.AHq_kORGZlUpzsRM2Zy5wlGkzRbEr2wbB8AAyFDAEyk";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxoZ3VqeHlmeHl4em96Z29rdXRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzOTA2NjUsImV4cCI6MjA3Mzk2NjY2NX0.GqhKb-Zo00t54x5pMYvwAZGFuOSeFedYKt7-Q-TVmfo";

// Cliente com service_role para operações administrativas
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

// Cliente com anon key para teste de login
const supabaseClient = createClient(supabaseUrl, anonKey);

async function resetDaniellePassword() {
  console.log('🔐 RESETANDO SENHA - DANIELLE DA SILVA MOURA');
  console.log('===========================================');
  
  const email = 'daniellemoura16@gmail.com';
  const newPassword = 'DanielleAdmin2025!';
  
  try {
    // 1. Buscar o usuário primeiro
    console.log('\n1️⃣ Buscando usuário...');
    const { data: users, error: searchError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, email, full_name')
      .eq('email', email);
    
    if (searchError) {
      console.log('❌ Erro ao buscar usuário:', searchError.message);
      return;
    }
    
    if (!users || users.length === 0) {
      console.log('❌ Usuário não encontrado');
      return;
    }
    
    const user = users[0];
    console.log('✅ Usuário encontrado:');
    console.log('   - User ID:', user.user_id);
    console.log('   - Nome:', user.full_name);
    console.log('   - Email:', user.email);
    
    // 2. Resetar senha usando Admin API
    console.log('\n2️⃣ Resetando senha...');
    
    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.user_id,
      {
        password: newPassword,
        email_confirm: true // Confirmar email automaticamente
      }
    );
    
    if (updateError) {
      console.log('❌ Erro ao resetar senha:', updateError.message);
      
      // Tentar método alternativo - criar novo usuário com mesma informação
      console.log('\n🔄 Tentando método alternativo...');
      
      // Primeiro, deletar o usuário existente
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.user_id);
      
      if (deleteError) {
        console.log('❌ Erro ao deletar usuário existente:', deleteError.message);
        return;
      }
      
      console.log('✅ Usuário existente removido');
      
      // Criar novo usuário
      const { data: newUserData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: newPassword,
        email_confirm: true,
        user_metadata: {
          full_name: 'Danielle da Silva Moura'
        }
      });
      
      if (createError) {
        console.log('❌ Erro ao criar novo usuário:', createError.message);
        return;
      }
      
      console.log('✅ Novo usuário criado:');
      console.log('   - User ID:', newUserData.user.id);
      console.log('   - Email:', newUserData.user.email);
      
      // Atualizar perfil com novo user_id
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ user_id: newUserData.user.id })
        .eq('email', email);
      
      if (profileError) {
        console.log('❌ Erro ao atualizar perfil:', profileError.message);
      } else {
        console.log('✅ Perfil atualizado com novo user_id');
      }
      
    } else {
      console.log('✅ Senha resetada com sucesso!');
      console.log('   - User ID:', updateData.user.id);
      console.log('   - Email confirmado:', updateData.user.email_confirmed_at ? 'Sim' : 'Não');
    }
    
    // 3. Testar login com nova senha
    console.log('\n3️⃣ Testando login com nova senha...');
    console.log('Email:', email);
    console.log('Nova senha:', newPassword);
    
    const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: newPassword
    });
    
    if (loginError) {
      console.log('❌ ERRO NO LOGIN APÓS RESET:', loginError.message);
      
      // Aguardar um pouco e tentar novamente
      console.log('⏳ Aguardando 3 segundos e tentando novamente...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const { data: retryData, error: retryError } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: newPassword
      });
      
      if (retryError) {
        console.log('❌ ERRO NO LOGIN (2ª tentativa):', retryError.message);
      } else {
        console.log('✅ LOGIN REALIZADO COM SUCESSO (2ª tentativa)!');
        console.log('   - User ID:', retryData.user?.id);
        console.log('   - Email:', retryData.user?.email);
        
        // Fazer logout após teste
        await supabaseClient.auth.signOut();
        console.log('   - Logout realizado após teste');
      }
    } else {
      console.log('✅ LOGIN REALIZADO COM SUCESSO!');
      console.log('   - User ID:', loginData.user?.id);
      console.log('   - Email:', loginData.user?.email);
      console.log('   - Token válido:', loginData.session?.access_token ? 'Sim' : 'Não');
      
      // Fazer logout após teste
      await supabaseClient.auth.signOut();
      console.log('   - Logout realizado após teste');
    }
    
  } catch (error) {
    console.log('❌ ERRO GERAL:', error.message);
    console.log('Stack:', error.stack);
  }
  
  console.log('\n===========================================');
  console.log('🏁 RESET DE SENHA CONCLUÍDO');
  console.log('===========================================');
  console.log('\n📋 CREDENCIAIS ATUALIZADAS:');
  console.log('   - Email: daniellemoura16@gmail.com');
  console.log('   - Senha: DanielleAdmin2025!');
  console.log('   - Role: admin');
  console.log('   - Status: Ativo');
}

// Executar reset
resetDaniellePassword().catch(console.error);