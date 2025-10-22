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
const supabaseKey = envVars.VITE_SUPABASE_PUBLISHABLE_KEY;

console.log('🔍 Diagnóstico da aplicação React - Erro "Falha ao buscar"');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'NÃO ENCONTRADA');

async function diagnoseReactApp() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('\n📋 Teste 1: Buscar profiles (useAdministradores)...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, user_id, full_name, email, role, active')
      .in('role', ['admin', 'developer'])
      .eq('active', true)
      .order('full_name');
    
    if (profilesError) {
      console.log('❌ Erro profiles:', profilesError.message);
      console.log('   Código:', profilesError.code);
      console.log('   Detalhes:', profilesError.details);
    } else {
      console.log('✅ Profiles OK:', profiles?.length || 0, 'registros');
    }
    
    console.log('\n🏢 Teste 2: Buscar fornecedores...');
    const { data: fornecedores, error: fornecedoresError } = await supabase
      .from('fornecedores')
      .select('*')
      .order('nome', { ascending: true });
    
    if (fornecedoresError) {
      console.log('❌ Erro fornecedores:', fornecedoresError.message);
      console.log('   Código:', fornecedoresError.code);
    } else {
      console.log('✅ Fornecedores OK:', fornecedores?.length || 0, 'registros');
    }
    
    console.log('\n📝 Teste 3: Buscar lembretes...');
    const { data: lembretes, error: lembretesError } = await supabase
      .from('lembretes')
      .select('*')
      .order('data_lembrete', { ascending: true });
    
    if (lembretesError) {
      console.log('❌ Erro lembretes:', lembretesError.message);
      console.log('   Código:', lembretesError.code);
    } else {
      console.log('✅ Lembretes OK:', lembretes?.length || 0, 'registros');
    }

    console.log('\n🔐 Teste 4: Verificar autenticação...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('❌ Erro auth:', authError.message);
    } else if (user) {
      console.log('✅ Usuário autenticado:', user.email);
    } else {
      console.log('⚠️  Nenhum usuário autenticado');
    }

    console.log('\n🌐 Teste 5: Conectividade de rede...');
    const response = await fetch(supabaseUrl + '/rest/v1/', {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Accept': 'application/json'
      }
    });
    
    console.log('Status da resposta:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      console.log('✅ Conectividade de rede OK');
    } else {
      console.log('❌ Problema de conectividade');
      const text = await response.text();
      console.log('Resposta:', text.substring(0, 200));
    }
    
  } catch (error) {
    console.error('\n❌ ERRO GERAL:', error.message);
    
    if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
      console.log('\n💡 DIAGNÓSTICO: Problema de conectividade detectado!');
      console.log('Possíveis soluções:');
      console.log('1. Verificar se o projeto Supabase está ativo');
      console.log('2. Verificar firewall/antivírus');
      console.log('3. Verificar conexão com a internet');
      console.log('4. Tentar acessar o dashboard Supabase diretamente');
    }
    
    if (error.message.includes('Invalid API key')) {
      console.log('\n💡 DIAGNÓSTICO: Problema com a chave da API!');
      console.log('Verificar se VITE_SUPABASE_PUBLISHABLE_KEY está correta no .env');
    }
  }
}

diagnoseReactApp().catch(console.error);