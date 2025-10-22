const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const supabaseUrl = "https://lhgujxyfxyxzozgokutf.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxoZ3VqeHlmeHl4em96Z29rdXRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM5MDY2NSwiZXhwIjoyMDczOTY2NjY1fQ.AHq_kORGZlUpzsRM2Zy5wlGkzRbEr2wbB8AAyFDAEyk";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxoZ3VqeHlmeHl4em96Z29rdXRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzOTA2NjUsImV4cCI6MjA3Mzk2NjY2NX0.GqhKb-Zo00t54x5pMYvwAZGFuOSeFedYKt7-Q-TVmfo";

// Cliente com service_role para operações administrativas
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

// Cliente com anon key para teste de login
const supabaseClient = createClient(supabaseUrl, anonKey);

async function createAdminLayanne() {
  console.log('👤 CRIANDO USUÁRIO ADMINISTRATIVO - LAYANNE CAMPOS FIGUEIREDO LEPESQUEUR');
  console.log('==============================================================================');
  
  const userData = {
    fullName: 'Layanne Campos Figueiredo Lepesqueur',
    email: 'layanne.crevin@gmail.com',
    cpf: '01940639174', // CPF sem pontuação
    cpfFormatted: '019.406.391-74',
    password: 'LayanneAdmin2025!',
    role: 'admin',
    cargo: 'Administrador'
  };
  
  try {
    // 1. Verificar se usuário já existe
    console.log('\n1️⃣ Verificando se usuário já existe...');
    
    const { data: existingProfile, error: checkError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', userData.email)
      .single();
    
    if (existingProfile) {
      console.log('⚠️ Usuário já existe:');
      console.log('   - Nome:', existingProfile.full_name);
      console.log('   - Email:', existingProfile.email);
      console.log('   - Role:', existingProfile.role);
      console.log('   - User ID:', existingProfile.user_id);
      return;
    }
    
    console.log('✅ Usuário não existe, prosseguindo com criação...');
    
    // 2. Criar usuário no Supabase Auth
    console.log('\n2️⃣ Criando usuário no Supabase Auth...');
    
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        full_name: userData.fullName
      }
    });
    
    if (authError) {
      console.log('❌ Erro ao criar usuário no Auth:', authError.message);
      return;
    }
    
    console.log('✅ Usuário criado no Auth:');
    console.log('   - User ID:', authUser.user.id);
    console.log('   - Email:', authUser.user.email);
    console.log('   - Email confirmado:', authUser.user.email_confirmed_at ? 'Sim' : 'Não');
    
    const userId = authUser.user.id;
    
    // 3. Criar perfil na tabela profiles
    console.log('\n3️⃣ Criando perfil na tabela profiles...');
    
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        user_id: userId,
        full_name: userData.fullName,
        email: userData.email,
        role: userData.role
      })
      .select()
      .single();
    
    if (profileError) {
      console.log('❌ Erro ao criar perfil:', profileError.message);
      
      // Tentar deletar usuário do Auth se perfil falhou
      await supabaseAdmin.auth.admin.deleteUser(userId);
      console.log('🔄 Usuário removido do Auth devido ao erro no perfil');
      return;
    }
    
    console.log('✅ Perfil criado:');
    console.log('   - Nome:', profileData.full_name);
    console.log('   - Email:', profileData.email);
    console.log('   - Role:', profileData.role);
    
    // 4. Buscar departamento para funcionário
    console.log('\n4️⃣ Buscando departamento...');
    
    const { data: departments, error: deptError } = await supabaseAdmin
      .from('departamentos')
      .select('id, nome')
      .limit(1);
    
    if (deptError || !departments || departments.length === 0) {
      console.log('⚠️ Nenhum departamento encontrado, criando departamento padrão...');
      
      const { data: newDept, error: createDeptError } = await supabaseAdmin
        .from('departamentos')
        .insert({
          nome: 'ADMINISTRAÇÃO',
          descricao: 'Departamento Administrativo'
        })
        .select()
        .single();
      
      if (createDeptError) {
        console.log('❌ Erro ao criar departamento:', createDeptError.message);
        console.log('⚠️ Continuando sem departamento...');
      } else {
        console.log('✅ Departamento criado:', newDept.nome);
        departments.push(newDept);
      }
    }
    
    const departmentId = departments && departments.length > 0 ? departments[0].id : null;
    
    if (departmentId) {
      console.log('✅ Departamento encontrado:', departments[0].nome);
    }
    
    // 5. Criar funcionário na tabela funcionarios
    console.log('\n5️⃣ Criando funcionário na tabela funcionarios...');
    
    const funcionarioData = {
      nome: userData.fullName,
      cpf: userData.cpf,
      cargo: userData.cargo,
      data_admissao: new Date().toISOString().split('T')[0],
      status: 'ativo',
      created_by: userId
    };
    
    if (departmentId) {
      funcionarioData.departamento_id = departmentId;
    }
    
    const { data: funcionarioResult, error: funcionarioError } = await supabaseAdmin
      .from('funcionarios')
      .insert(funcionarioData)
      .select()
      .single();
    
    if (funcionarioError) {
      console.log('❌ Erro ao criar funcionário:', funcionarioError.message);
      console.log('⚠️ Usuário criado no Auth e Profiles, mas não em Funcionários');
    } else {
      console.log('✅ Funcionário criado:');
      console.log('   - ID:', funcionarioResult.id);
      console.log('   - Nome:', funcionarioResult.nome);
      console.log('   - CPF:', funcionarioResult.cpf);
      console.log('   - Cargo:', funcionarioResult.cargo);
      console.log('   - Status:', funcionarioResult.status);
    }
    
    // 6. Testar login
    console.log('\n6️⃣ Testando login...');
    console.log('Email:', userData.email);
    console.log('Senha:', userData.password);
    
    const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
      email: userData.email,
      password: userData.password
    });
    
    if (loginError) {
      console.log('❌ ERRO NO LOGIN:', loginError.message);
      
      // Aguardar e tentar novamente
      console.log('⏳ Aguardando 3 segundos e tentando novamente...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const { data: retryData, error: retryError } = await supabaseClient.auth.signInWithPassword({
        email: userData.email,
        password: userData.password
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
  
  console.log('\n==============================================================================');
  console.log('🏁 CRIAÇÃO DE USUÁRIO ADMINISTRATIVO CONCLUÍDA');
  console.log('==============================================================================');
  console.log('\n📋 CREDENCIAIS DO USUÁRIO LAYANNE:');
  console.log('   - Nome: Layanne Campos Figueiredo Lepesqueur');
  console.log('   - Email: layanne.crevin@gmail.com');
  console.log('   - Senha: LayanneAdmin2025!');
  console.log('   - CPF: 019.406.391-74');
  console.log('   - Role: admin');
  console.log('   - Cargo: Administrador');
  console.log('   - Status: Ativo');
  console.log('\n🔐 O usuário pode fazer login no sistema com essas credenciais.');
}

// Executar criação
createAdminLayanne().catch(console.error);