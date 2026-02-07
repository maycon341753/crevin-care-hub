const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Carregar variáveis do .env
const envContent = fs.readFileSync('.env', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim().replace(/[\"']/g, '');
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

console.log('🚀 Criando usuário administrativo - Layanne Campos Figueiredo Lepesqueur');
console.log('URL:', supabaseUrl);

async function createLayanneUser() {
  try {
    // Usar service role key para criar usuário
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('\n👤 Criando usuário no auth.users...');
    
    // Criar usuário
    const { data: user, error: userError } = await supabase.auth.admin.createUser({
      email: 'layanne.crevin@gmail.com',
      password: 'LayanneAdmin@2025',
      email_confirm: true,
      user_metadata: {
        full_name: 'Layanne Campos Figueiredo Lepesqueur'
      }
    });
    
    if (userError) {
      console.log('❌ Erro ao criar usuário:', userError.message);
      return;
    }
    
    console.log('✅ Usuário criado com sucesso!');
    console.log('   ID:', user.user.id);
    console.log('   Email:', user.user.email);
    
    // Aguardar um pouco para garantir que o usuário foi criado
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('\n📋 Criando perfil na tabela profiles...');
    
    // Criar perfil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: user.user.id,
        email: 'layanne.crevin@gmail.com',
        full_name: 'Layanne Campos Figueiredo Lepesqueur',
        role: 'admin',
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (profileError) {
      console.log('❌ Erro ao criar perfil:', profileError.message);
      console.log('   Código:', profileError.code);
      console.log('   Detalhes:', profileError.details);
    } else {
      console.log('✅ Perfil criado com sucesso!');
      console.log('   Nome:', profile.full_name);
      console.log('   Role:', profile.role);
    }
    
    console.log('\n👨‍💼 Verificando tabela funcionarios...');
    
    // Verificar se existe tabela funcionarios e criar registro
    const { data: funcionarios, error: funcError } = await supabase
      .from('funcionarios')
      .select('id')
      .limit(1);
    
    if (!funcError) {
      // Tabela existe, inserir funcionário
      const { data: funcionario, error: insertFuncError } = await supabase
        .from('funcionarios')
        .insert({
          nome: 'Layanne Campos Figueiredo Lepesqueur',
          email: 'layanne.crevin@gmail.com',
          cpf: '01940639174',
          cargo: 'Administrador',
          status: 'ativo',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (insertFuncError) {
        console.log('❌ Erro ao criar funcionário:', insertFuncError.message);
        console.log('   Código:', insertFuncError.code);
      } else {
        console.log('✅ Funcionário criado com sucesso!');
        console.log('   CPF:', '019.406.391-74');
        console.log('   Cargo:', funcionario.cargo);
      }
    } else {
      console.log('ℹ️ Tabela funcionarios não existe ou não acessível');
    }
    
    console.log('\n🎯 RESUMO FINAL:');
    console.log('✅ Usuário criado no Supabase Auth');
    console.log('✅ Perfil administrativo criado');
    console.log('📧 Email: layanne.crevin@gmail.com');
    console.log('🔑 Senha: LayanneAdmin@2025');
    console.log('👑 Role: admin');
    console.log('📄 CPF: 019.406.391-74');
    console.log('\n🚀 Agora você pode fazer login na aplicação!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

createLayanneUser();