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
    const value = valueParts.join('=');
    envVars[key.trim()] = value.trim().replace(/"/g, '');
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const serviceRoleKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Variáveis de ambiente não encontradas. Verifique VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.');
  process.exit(1);
}

// Cliente admin (service role)
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

async function createHayaneAuthUser() {
  const email = 'hayanepformiga@gmail.com';
  const password = 'Crevin@2025!'; // senha inicial (pode ser alterada depois)
  const fullName = 'Hayane da Ponte Formiga Riotinto';
  const cpfFormatted = '031.317.361-35';
  const cpfDigits = cpfFormatted.replace(/\D/g, '');

  console.log('🔧 Iniciando criação de usuário administrativo (Hayane)...');

  // 1) Listar e verificar se já existe
  const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) {
    console.error('❌ Erro ao listar usuários:', listError.message);
    process.exit(1);
  }

  const existing = existingUsers?.users?.find(u => u.email === email);
  if (existing) {
    console.log('ℹ️ Usuário já existe em auth.users:', existing.id);
    // Atualizar metadados e senha para garantir consistência
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
      password,
      user_metadata: {
        full_name: fullName,
        role: 'admin',
        cpf: cpfDigits,
        cpf_formatted: cpfFormatted
      }
    });
    if (updateError) {
      console.error('⚠️ Erro ao atualizar usuário existente:', updateError.message);
    } else {
      console.log('✅ Usuário existente atualizado com sucesso.');
    }
  } else {
    console.log('➕ Criando novo usuário em auth.users...');
    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: 'admin',
        cpf: cpfDigits,
        cpf_formatted: cpfFormatted
      }
    });
    if (createError) {
      console.error('❌ Erro ao criar usuário:', createError.message);
      process.exit(1);
    } else {
      console.log('✅ Usuário criado com sucesso!');
      console.log('- ID:', createData.user?.id);
    }
  }

  // 2) Obter usuário final para ter o ID
  const { data: usersAfter } = await supabaseAdmin.auth.admin.listUsers();
  const user = usersAfter?.users?.find(u => u.email === email);
  if (!user) {
    console.error('❌ Usuário não encontrado após criação.');
    process.exit(1);
  }

  // 3) Upsert em public.profiles com role admin
  console.log('📤 Sincronizando perfil em public.profiles...');
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: user.id, // manter id = user.id conforme alguns fluxos do app
      user_id: user.id,
      email,
      full_name: fullName,
      role: 'admin'
    }, { onConflict: 'user_id' });

  if (profileError) {
    console.error('⚠️ Erro ao upsert perfil:', profileError.message);
  } else {
    console.log('✅ Perfil sincronizado/atualizado com sucesso.');
  }

  // 4) Validação simples
  console.log('🔎 Validando criação...');
  const { data: profileData, error: profileReadError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (profileReadError) {
    console.error('⚠️ Erro ao ler perfil:', profileReadError.message);
  } else {
    console.log('📊 Perfil:', {
      user_id: profileData.user_id,
      full_name: profileData.full_name,
      role: profileData.role,
      email: profileData.email
    });
  }

  console.log('\n🎉 Concluído! Credenciais para primeiro acesso:');
  console.log('📧 Email:', email);
  console.log('🔑 Senha:', password);
  console.log('👤 Nome completo:', fullName);
  console.log('🪪 CPF:', cpfFormatted);
}

createHayaneAuthUser().catch(err => {
  console.error('❌ Erro geral:', err);
  process.exit(1);
});