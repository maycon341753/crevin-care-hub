const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Lendo as variáveis do .env
const envContent = fs.readFileSync('.env', 'utf8');
const envLines = envContent.split('\n');
const envVars = {};
envLines.forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim().replace(/"/g, '');
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const serviceRoleKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Criando usuário Anderson na autenticação...');
console.log('URL:', supabaseUrl);
console.log('Service Role Key disponível:', !!serviceRoleKey);

if (!serviceRoleKey) {
  console.log('❌ Service Role Key não encontrada no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function createAndersonAuthUser() {
  try {
    console.log('📧 Criando usuário Anderson na auth.users...');
    
    // Primeiro, vamos verificar se já existe
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.log('❌ Erro ao listar usuários:', listError.message);
      return;
    }
    
    const existingAnderson = existingUsers.users.find(user => 
      user.email === 'andersondejesus@gmail.com'
    );
    
    if (existingAnderson) {
      console.log('✅ Anderson já existe na auth.users!');
      console.log('- ID:', existingAnderson.id);
      console.log('- Email:', existingAnderson.email);
      console.log('- Email confirmado:', existingAnderson.email_confirmed_at ? 'SIM' : 'NÃO');
      return;
    }
    
    // Criar o usuário na autenticação
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'andersondejesus@gmail.com',
      password: '123456',
      email_confirm: true, // Confirma o email automaticamente
      user_metadata: {
        full_name: 'Anderson de Jesus'
      }
    });
    
    if (error) {
      console.log('❌ Erro ao criar usuário:', error.message);
      return;
    }
    
    console.log('✅ Usuário Anderson criado com sucesso na auth.users!');
    console.log('- User ID:', data.user.id);
    console.log('- Email:', data.user.email);
    console.log('- Email confirmado:', data.user.email_confirmed_at ? 'SIM' : 'NÃO');
    
    // Agora vamos atualizar o profile para conectar com o auth user
    console.log('🔗 Conectando profile com auth user...');
    
    const { data: updateData, error: updateError } = await supabase
      .from('profiles')
      .update({ 
        user_id: data.user.id,
        updated_at: new Date().toISOString()
      })
      .eq('email', 'andersondejesus@gmail.com');
    
    if (updateError) {
      console.log('⚠️ Aviso: Erro ao atualizar profile:', updateError.message);
      console.log('O usuário foi criado na auth, mas pode precisar conectar manualmente');
    } else {
      console.log('✅ Profile conectado com sucesso!');
    }
    
    console.log('\n🎉 PRONTO! Anderson agora pode fazer login com:');
    console.log('📧 Email: andersondejesus@gmail.com');
    console.log('🔑 Senha: 123456');
    
  } catch (err) {
    console.log('❌ Erro geral:', err.message);
  }
}

createAndersonAuthUser();