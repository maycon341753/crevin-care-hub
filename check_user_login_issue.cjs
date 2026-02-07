const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lhgujxyfxyxzozgokutf.supabase.co';
const supabaseKey = 'sb_publishable_nqv19CzV1kkQVpjIijE28w_YJtKOEBA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserLoginIssue() {
  console.log('🔍 Investigando problema de login para anderson.test@gmail.com...\n');
  
  try {
    // 1. Verificar se o usuário existe na tabela profiles
    console.log('📋 1. Verificando usuário na tabela profiles...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'anderson.test@gmail.com')
      .single();
    
    if (profileError) {
      console.error('❌ Erro ao buscar perfil:', profileError.message);
    } else if (profileData) {
      console.log('✅ Usuário encontrado na tabela profiles:');
      console.log('📊 Dados:', {
        id: profileData.id,
        email: profileData.email,
        full_name: profileData.full_name,
        role: profileData.role,
        active: profileData.active,
        status: profileData.status,
        user_id: profileData.user_id
      });
    } else {
      console.log('❌ Usuário NÃO encontrado na tabela profiles');
    }
    
    // 2. Verificar se existe tabela auth.users (sistema de autenticação do Supabase)
    console.log('\n📋 2. Verificando sistema de autenticação...');
    
    // Tentar fazer login para ver o erro específico
    console.log('🔐 Tentando fazer login com credenciais...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'anderson.test@gmail.com',
      password: 'senha123' // senha padrão que provavelmente foi usada
    });
    
    if (loginError) {
      console.error('❌ Erro de login:', loginError.message);
      console.error('📋 Código do erro:', loginError.status);
      
      if (loginError.message.includes('Invalid login credentials')) {
        console.log('\n💡 DIAGNÓSTICO: O usuário não existe no sistema de autenticação do Supabase!');
        console.log('🔧 SOLUÇÃO: Precisamos criar o usuário também na tabela auth.users');
      }
    } else {
      console.log('✅ Login realizado com sucesso!');
      console.log('📊 Dados do login:', loginData);
    }
    
    // 3. Verificar estrutura das tabelas de autenticação
    console.log('\n📋 3. Verificando estrutura do banco...');
    
    // Listar todas as tabelas para entender a estrutura
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_schema')
      .eq('table_schema', 'public');
    
    if (tablesError) {
      console.error('❌ Erro ao listar tabelas:', tablesError.message);
    } else {
      console.log('📊 Tabelas disponíveis no schema public:');
      tables.forEach(table => {
        console.log(`  - ${table.table_name}`);
      });
    }
    
    // 4. Verificar se há uma tabela users separada
    console.log('\n📋 4. Verificando tabela users...');
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'anderson.test@gmail.com')
      .single();
    
    if (usersError) {
      if (usersError.code === 'PGRST116') {
        console.log('ℹ️ Tabela users não existe ou está vazia');
      } else {
        console.error('❌ Erro ao verificar tabela users:', usersError.message);
      }
    } else {
      console.log('✅ Usuário encontrado na tabela users:', usersData);
    }
    
    // 5. Verificar como o sistema de login está configurado
    console.log('\n📋 5. Analisando configuração de autenticação...');
    console.log('💡 O Supabase usa duas camadas de autenticação:');
    console.log('   1. auth.users (sistema interno do Supabase para login)');
    console.log('   2. profiles (tabela customizada para dados do perfil)');
    console.log('\n🔧 Para resolver o problema, precisamos:');
    console.log('   1. Criar o usuário no sistema auth do Supabase');
    console.log('   2. Vincular o perfil existente ao usuário auth');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

async function suggestSolution() {
  console.log('\n🛠️ SOLUÇÕES POSSÍVEIS:\n');
  
  console.log('📝 OPÇÃO 1: Usar Supabase Admin API para criar usuário');
  console.log('   - Requer service_role key (mais seguro)');
  console.log('   - Cria usuário diretamente no auth.users');
  
  console.log('\n📝 OPÇÃO 2: Implementar signup no frontend');
  console.log('   - Usar supabase.auth.signUp()');
  console.log('   - Usuário recebe email de confirmação');
  
  console.log('\n📝 OPÇÃO 3: Criar usuário via SQL direto');
  console.log('   - Inserir diretamente na tabela auth.users');
  console.log('   - Mais complexo, requer hash de senha');
  
  console.log('\n🎯 RECOMENDAÇÃO: Implementar criação via Admin API');
}

async function runDiagnostic() {
  await checkUserLoginIssue();
  await suggestSolution();
  
  console.log('\n🏁 Diagnóstico concluído!');
}

runDiagnostic();