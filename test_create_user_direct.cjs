const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lhgujxyfxyxzozgokutf.supabase.co';
const supabaseKey = 'sb_publishable_nqv19CzV1kkQVpjIijE28w_YJtKOEBA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCreateUserLikeButton() {
  console.log('🧪 Testando criação de usuário exatamente como no botão...');
  
  try {
    // Simular dados do formulário
    const newUserData = {
      email: 'anderson.test@gmail.com',
      full_name: 'Anderson de Jesus Teste',
      role: 'admin'
    };
    
    console.log('📝 Dados do usuário:', newUserData);
    
    // Gerar um UUID para o novo usuário (igual ao código)
    const userId = crypto.randomUUID();
    console.log('🆔 UUID gerado:', userId);
    
    // Criar perfil na tabela profiles (exatamente como no código)
    console.log('\n📤 Inserindo na tabela profiles...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: newUserData.email,
        full_name: newUserData.full_name,
        role: newUserData.role,
        active: true,
        status: 'active'
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Erro ao criar perfil:', profileError);
      console.error('📋 Detalhes do erro:');
      console.error('- Código:', profileError.code);
      console.error('- Mensagem:', profileError.message);
      console.error('- Detalhes:', profileError.details);
      console.error('- Hint:', profileError.hint);
      return false;
    }

    console.log('✅ Usuário criado com sucesso!');
    console.log('📊 Dados retornados:', profileData);
    
    // Verificar se o usuário foi realmente inserido
    console.log('\n🔍 Verificando se o usuário foi inserido...');
    const { data: checkData, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', newUserData.email)
      .single();
    
    if (checkError) {
      console.error('❌ Erro ao verificar usuário:', checkError.message);
    } else {
      console.log('✅ Usuário encontrado no banco:', checkData);
    }
    
    // Limpar teste
    console.log('\n🧹 Limpando dados de teste...');
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('email', newUserData.email);
    
    if (deleteError) {
      console.error('⚠️ Erro ao limpar teste:', deleteError.message);
    } else {
      console.log('✅ Dados de teste limpos');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
    return false;
  }
}

// Também testar se há problemas de RLS
async function testRLSPolicies() {
  console.log('\n🔒 Testando políticas RLS...');
  
  try {
    // Testar SELECT
    const { data: selectData, error: selectError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (selectError) {
      console.error('❌ Erro no SELECT:', selectError.message);
    } else {
      console.log('✅ SELECT funcionando, registros encontrados:', selectData?.length || 0);
    }
    
    // Testar INSERT com dados mínimos
    const testId = crypto.randomUUID();
    const { data: insertData, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: testId,
        email: 'rls.test@test.com',
        full_name: 'RLS Test',
        role: 'user',
        active: true,
        status: 'active'
      });
    
    if (insertError) {
      console.error('❌ Erro no INSERT (RLS):', insertError.message);
      console.error('📋 Código do erro:', insertError.code);
    } else {
      console.log('✅ INSERT funcionando');
      
      // Limpar
      await supabase
        .from('profiles')
        .delete()
        .eq('email', 'rls.test@test.com');
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar RLS:', error);
  }
}

async function runAllTests() {
  console.log('🚀 Iniciando testes completos...\n');
  
  await testRLSPolicies();
  await testCreateUserLikeButton();
  
  console.log('\n🏁 Testes concluídos!');
}

runAllTests();