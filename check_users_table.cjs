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
const supabaseAnonKey = envVars.VITE_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Verificando tabela de usuários...\n');

// Criar cliente com service role key para acesso completo
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

async function checkUsersTable() {
  try {
    console.log('📊 Verificando com Service Role Key...');
    
    // Verificar tabela users com admin
    const { data: adminUsers, error: adminError } = await supabaseAdmin.from('users').select('*');
    if (adminError) {
      console.log('❌ Erro ao acessar users com admin:', adminError.message);
    } else {
      console.log('✅ Usuários encontrados com admin:', adminUsers?.length || 0);
      if (adminUsers && adminUsers.length > 0) {
        adminUsers.forEach(user => {
          console.log(`- ID: ${user.id}, Email: ${user.email}, Nome: ${user.name}, Ativo: ${user.ativo}`);
        });
      }
    }

    // Verificar tabela profiles com admin
    const { data: adminProfiles, error: profileError } = await supabaseAdmin.from('profiles').select('*');
    if (profileError) {
      console.log('❌ Erro ao acessar profiles com admin:', profileError.message);
    } else {
      console.log('✅ Profiles encontrados com admin:', adminProfiles?.length || 0);
      if (adminProfiles && adminProfiles.length > 0) {
        adminProfiles.forEach(profile => {
          console.log(`- ID: ${profile.id}, User ID: ${profile.user_id}, Nome: ${profile.name}, Ativo: ${profile.ativo}`);
        });
      }
    }

    console.log('\n📊 Verificando com Anon Key...');
    
    // Verificar com chave anônima
    const { data: anonUsers, error: anonError } = await supabaseAnon.from('users').select('*');
    if (anonError) {
      console.log('❌ Erro ao acessar users com anon:', anonError.message);
    } else {
      console.log('✅ Usuários encontrados com anon:', anonUsers?.length || 0);
    }

    // Tentar acessar auth.users com service role
    console.log('\n🔐 Verificando auth.users...');
    try {
      const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
      if (authError) {
        console.log('❌ Erro ao listar usuários auth:', authError.message);
      } else {
        console.log('✅ Usuários auth encontrados:', authUsers?.users?.length || 0);
        if (authUsers?.users && authUsers.users.length > 0) {
          authUsers.users.forEach(user => {
            console.log(`- ID: ${user.id}, Email: ${user.email}, Confirmado: ${user.email_confirmed_at ? 'Sim' : 'Não'}`);
          });
        }
      }
    } catch (err) {
      console.log('❌ Erro ao acessar auth.users:', err.message);
    }

    // Verificar se Quezia existe especificamente
    console.log('\n👤 Procurando especificamente por Quezia...');
    const { data: queziaUser, error: queziaError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', 'borges.quezia@yahoo.com.br')
      .single();

    if (queziaError) {
      console.log('❌ Quezia não encontrada em users:', queziaError.message);
    } else {
      console.log('✅ Quezia encontrada em users:');
      console.log(JSON.stringify(queziaUser, null, 2));
    }

    // Verificar Quezia em profiles
    const { data: queziaProfile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', 'borges.quezia@yahoo.com.br')
      .single();

    if (profileErr) {
      console.log('❌ Quezia não encontrada em profiles:', profileErr.message);
    } else {
      console.log('✅ Quezia encontrada em profiles:');
      console.log(JSON.stringify(queziaProfile, null, 2));
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkUsersTable();