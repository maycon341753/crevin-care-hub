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

console.log('🔍 Testando conectividade com Supabase...\n');

console.log('📋 Configurações:');
console.log('- URL:', supabaseUrl);
console.log('- Anon Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'NÃO ENCONTRADA');
console.log('- Service Role Key:', serviceRoleKey ? `${serviceRoleKey.substring(0, 20)}...` : 'NÃO ENCONTRADA');
console.log('');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

// Teste 1: Conectividade básica com anon key
async function testBasicConnectivity() {
  console.log('🔗 Teste 1: Conectividade básica...');
  
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Teste simples de ping
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      console.log('⚠️  Erro na consulta:', error.message);
      console.log('   Código:', error.code);
      console.log('   Detalhes:', error.details);
      
      // Verificar se é erro de conectividade
      if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('Failed to fetch')) {
        console.log('❌ PROBLEMA DE CONECTIVIDADE DETECTADO');
        return false;
      }
    } else {
      console.log('✅ Conectividade básica OK');
      return true;
    }
  } catch (err) {
    console.log('❌ Erro de conectividade:', err.message);
    return false;
  }
}

// Teste 2: Verificar status do projeto
async function testProjectStatus() {
  console.log('\n🏥 Teste 2: Status do projeto...');
  
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });
    
    console.log('   Status HTTP:', response.status);
    console.log('   Status Text:', response.statusText);
    
    if (response.status === 200) {
      console.log('✅ Projeto ativo e acessível');
      return true;
    } else if (response.status === 404) {
      console.log('❌ Projeto não encontrado ou pausado');
      return false;
    } else {
      console.log('⚠️  Status inesperado:', response.status);
      return false;
    }
  } catch (err) {
    console.log('❌ Erro ao verificar status:', err.message);
    return false;
  }
}

// Teste 3: Verificar DNS e conectividade de rede
async function testNetworkConnectivity() {
  console.log('\n🌐 Teste 3: Conectividade de rede...');
  
  try {
    const url = new URL(supabaseUrl);
    const hostname = url.hostname;
    
    console.log('   Testando DNS para:', hostname);
    
    const response = await fetch(`https://${hostname}`, {
      method: 'HEAD',
      timeout: 10000
    });
    
    console.log('   Resposta DNS:', response.status);
    console.log('✅ Conectividade de rede OK');
    return true;
  } catch (err) {
    console.log('❌ Erro de rede:', err.message);
    return false;
  }
}

// Executar todos os testes
async function runAllTests() {
  console.log('🚀 Iniciando diagnóstico de conectividade...\n');
  
  const test1 = await testBasicConnectivity();
  const test2 = await testProjectStatus();
  const test3 = await testNetworkConnectivity();
  
  console.log('\n📊 Resumo dos testes:');
  console.log('- Conectividade básica:', test1 ? '✅' : '❌');
  console.log('- Status do projeto:', test2 ? '✅' : '❌');
  console.log('- Conectividade de rede:', test3 ? '✅' : '❌');
  
  if (!test1 && !test2 && !test3) {
    console.log('\n🔴 DIAGNÓSTICO: Problema grave de conectividade');
    console.log('   Possíveis causas:');
    console.log('   - Projeto Supabase pausado ou inativo');
    console.log('   - Problemas de rede/firewall');
    console.log('   - URL ou chaves incorretas');
  } else if (!test1 && test2 && test3) {
    console.log('\n🟡 DIAGNÓSTICO: Problema de autenticação ou configuração');
    console.log('   Possíveis causas:');
    console.log('   - Chaves de API incorretas');
    console.log('   - Configuração RLS muito restritiva');
  } else if (test1 && test2 && test3) {
    console.log('\n🟢 DIAGNÓSTICO: Conectividade OK');
    console.log('   O problema pode estar na aplicação específica');
  }
}

runAllTests().catch(console.error);