const { createClient } = require('@supabase/supabase-js');

// Configuração direta do Supabase
const supabaseUrl = 'https://lhgujxyfxyxzozgokutf.supabase.co';
const supabaseKey = 'sb_publishable_nqv19CzV1kkQVpjIijE28w_YJtKOEBA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUserCreation() {
  console.log('🔍 Testando criação de usuário...');
  
  // Primeiro, vamos verificar a constraint atual
  console.log('\n🔍 Verificando constraint atual...');
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .limit(1);
    
    console.log('Consulta de teste executada');
  } catch (err) {
    console.log('Erro na consulta:', err);
  }
  
  // Testar com diferentes valores de role
  const testRoles = ['user', 'admin', 'developer', 'manager'];
  
  for (const role of testRoles) {
    console.log(`\n🧪 Testando role: "${role}"`);
    
    const testData = {
      id: crypto.randomUUID(),
      email: `teste-${role}@exemplo.com`,
      full_name: `Usuário ${role}`,
      role: role,
      active: true,
      status: 'active'
    };
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert(testData)
        .select()
        .single();
      
      if (error) {
        console.error(`❌ Erro com role "${role}":`, error.message);
      } else {
        console.log(`✅ Sucesso com role "${role}"`);
        
        // Limpar dados de teste
        await supabase
          .from('profiles')
          .delete()
          .eq('id', testData.id);
      }
    } catch (err) {
      console.error(`❌ Erro geral com role "${role}":`, err.message);
    }
  }
}

testUserCreation();