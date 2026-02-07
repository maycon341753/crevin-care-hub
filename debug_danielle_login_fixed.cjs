const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const supabaseUrl = "https://lhgujxyfxyxzozgokutf.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxoZ3VqeHlmeHl4em96Z29rdXRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM5MDY2NSwiZXhwIjoyMDczOTY2NjY1fQ.AHq_kORGZlUpzsRM2Zy5wlGkzRbEr2wbB8AAyFDAEyk";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxoZ3VqeHlmeHl4em96Z29rdXRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzOTA2NjUsImV4cCI6MjA3Mzk2NjY2NX0.GqhKb-Zo00t54x5pMYvwAZGFuOSeFedYKt7-Q-TVmfo";

// Cliente com service_role para consultas administrativas
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

// Cliente com anon key para teste de login
const supabaseClient = createClient(supabaseUrl, anonKey);

async function debugDanielleLogin() {
  console.log('🔍 DIAGNÓSTICO DE LOGIN - DANIELLE DA SILVA MOURA');
  console.log('================================================');
  
  const email = 'daniellemoura16@gmail.com';
  const password = 'DanielleAdmin2025!';
  
  try {
    // 1. Verificar se o usuário existe na tabela auth.users
    console.log('\n1️⃣ Verificando usuário na tabela auth.users...');
    const { data: authUsers, error: authError } = await supabaseAdmin
      .from('auth.users')
      .select('*')
      .eq('email', email);
    
    if (authError) {
      console.log('❌ Erro ao consultar auth.users:', authError.message);
      
      // Tentar consulta direta via RPC
      console.log('🔄 Tentando consulta alternativa...');
      const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('get_auth_user_by_email', {
        user_email: email
      });
      
      if (rpcError) {
        console.log('❌ Erro na consulta RPC:', rpcError.message);
      } else {
        console.log('✅ Usuário encontrado via RPC:', rpcData);
      }
    } else {
      if (authUsers && authUsers.length > 0) {
        const user = authUsers[0];
        console.log('✅ Usuário encontrado na auth.users:');
        console.log('   - ID:', user.id);
        console.log('   - Email:', user.email);
        console.log('   - Criado em:', user.created_at);
        console.log('   - Email confirmado:', user.email_confirmed_at ? 'Sim' : 'Não');
        console.log('   - Último login:', user.last_sign_in_at || 'Nunca');
      } else {
        console.log('❌ Usuário NÃO encontrado na auth.users');
        return;
      }
    }
    
    // 2. Verificar perfil na tabela profiles
    console.log('\n2️⃣ Verificando perfil na tabela profiles...');
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', email);
    
    if (profileError) {
      console.log('❌ Erro ao consultar profiles:', profileError.message);
    } else {
      if (profiles && profiles.length > 0) {
        const profile = profiles[0];
        console.log('✅ Perfil encontrado:');
        console.log('   - User ID:', profile.user_id);
        console.log('   - Nome:', profile.full_name);
        console.log('   - Email:', profile.email);
        console.log('   - Role:', profile.role);
        console.log('   - Criado em:', profile.created_at);
      } else {
        console.log('❌ Perfil NÃO encontrado na tabela profiles');
      }
    }
    
    // 3. Verificar na tabela funcionarios
    console.log('\n3️⃣ Verificando na tabela funcionarios...');
    const { data: funcionarios, error: funcError } = await supabaseAdmin
      .from('funcionarios')
      .select('*')
      .eq('email', email);
    
    if (funcError) {
      console.log('❌ Erro ao consultar funcionarios:', funcError.message);
    } else {
      if (funcionarios && funcionarios.length > 0) {
        const funcionario = funcionarios[0];
        console.log('✅ Funcionário encontrado:');
        console.log('   - ID:', funcionario.id);
        console.log('   - Nome:', funcionario.nome);
        console.log('   - CPF:', funcionario.cpf);
        console.log('   - Cargo:', funcionario.cargo);
        console.log('   - Status:', funcionario.status);
      } else {
        console.log('❌ Funcionário NÃO encontrado na tabela funcionarios');
      }
    }
    
    // 4. Testar login programaticamente
    console.log('\n4️⃣ Testando login programaticamente...');
    console.log('Email:', email);
    console.log('Senha:', password);
    
    const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password
    });
    
    if (loginError) {
      console.log('❌ ERRO NO LOGIN:', loginError.message);
      console.log('   - Código:', loginError.status);
      console.log('   - Detalhes:', loginError);
      
      // Verificar possíveis causas
      if (loginError.message.includes('Invalid login credentials')) {
        console.log('\n🔍 POSSÍVEIS CAUSAS:');
        console.log('   1. Senha incorreta');
        console.log('   2. Email não confirmado');
        console.log('   3. Usuário desabilitado');
        console.log('   4. Configuração de autenticação incorreta');
      }
    } else {
      console.log('✅ LOGIN REALIZADO COM SUCESSO!');
      console.log('   - User ID:', loginData.user?.id);
      console.log('   - Email:', loginData.user?.email);
      console.log('   - Token válido:', loginData.session?.access_token ? 'Sim' : 'Não');
      
      // Fazer logout após o teste
      await supabaseClient.auth.signOut();
      console.log('   - Logout realizado após teste');
    }
    
    // 5. Verificar configurações de autenticação
    console.log('\n5️⃣ Verificando configurações de autenticação...');
    
    // Tentar obter configurações do projeto
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('auth.config')
      .select('*');
    
    if (settingsError) {
      console.log('ℹ️ Não foi possível acessar configurações de auth:', settingsError.message);
    } else {
      console.log('✅ Configurações de auth acessíveis');
    }
    
  } catch (error) {
    console.log('❌ ERRO GERAL:', error.message);
    console.log('Stack:', error.stack);
  }
  
  console.log('\n================================================');
  console.log('🏁 DIAGNÓSTICO CONCLUÍDO');
  console.log('================================================');
}

// Executar diagnóstico
debugDanielleLogin().catch(console.error);