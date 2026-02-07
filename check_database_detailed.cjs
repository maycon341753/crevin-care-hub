const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Função para carregar variáveis de ambiente
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      if (line.trim() && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        process.env[key.trim()] = value.trim();
      }
    });
  }
}

loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseStructure() {
  console.log('🔍 Verificando estrutura detalhada do banco de dados...\n');

  try {
    // 1. Verificar tabelas existentes
    console.log('📋 TABELAS EXISTENTES:');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');

    if (tablesError) {
      console.error('❌ Erro ao verificar tabelas:', tablesError.message);
    } else {
      tables.forEach(table => {
        console.log(`  ✅ ${table.table_name}`);
      });
    }

    console.log('\n📊 ESTRUTURA DA TABELA PROFILES:');
    const { data: profilesColumns, error: profilesError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'profiles')
      .order('ordinal_position');

    if (profilesError) {
      console.error('❌ Erro ao verificar estrutura da tabela profiles:', profilesError.message);
    } else {
      profilesColumns.forEach(col => {
        console.log(`  📝 ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
    }

    console.log('\n📊 ESTRUTURA DA TABELA USERS:');
    const { data: usersColumns, error: usersError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'users')
      .order('ordinal_position');

    if (usersError) {
      console.error('❌ Erro ao verificar estrutura da tabela users:', usersError.message);
    } else {
      usersColumns.forEach(col => {
        console.log(`  📝 ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
    }

    // 2. Verificar políticas RLS
    console.log('\n🔒 POLÍTICAS RLS:');
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('schemaname, tablename, policyname, permissive, roles, cmd, qual')
      .eq('schemaname', 'public');

    if (policiesError) {
      console.error('❌ Erro ao verificar políticas RLS:', policiesError.message);
    } else {
      if (policies.length === 0) {
        console.log('  ⚠️  Nenhuma política RLS encontrada');
      } else {
        policies.forEach(policy => {
          console.log(`  🔐 ${policy.tablename}.${policy.policyname} (${policy.cmd})`);
        });
      }
    }

    // 3. Testar inserção na tabela profiles
    console.log('\n🧪 TESTE DE INSERÇÃO NA TABELA PROFILES:');
    const testUser = {
      id: 'test-' + Date.now(),
      email: 'test@example.com',
      full_name: 'Usuário Teste',
      role: 'user'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('profiles')
      .insert([testUser])
      .select();

    if (insertError) {
      console.error('❌ Erro ao inserir usuário teste:', insertError.message);
      console.error('   Detalhes:', insertError.details);
      console.error('   Hint:', insertError.hint);
    } else {
      console.log('✅ Inserção teste bem-sucedida:', insertData);
      
      // Limpar dados de teste
      await supabase.from('profiles').delete().eq('id', testUser.id);
      console.log('🧹 Dados de teste removidos');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

checkDatabaseStructure();