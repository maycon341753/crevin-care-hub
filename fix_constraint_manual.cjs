const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lhgujxyfxyxzozgokutf.supabase.co';
const supabaseKey = 'sb_publishable_nqv19CzV1kkQVpjIijE28w_YJtKOEBA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixConstraint() {
  console.log('🔧 Corrigindo constraint profiles_role_check manualmente...');
  
  try {
    // Executar SQL direto para corrigir a constraint
    console.log('\n1. Removendo constraint atual...');
    const { data: dropResult, error: dropError } = await supabase
      .from('profiles')
      .select('*')
      .limit(0); // Apenas para testar conexão
    
    if (dropError) {
      console.log('❌ Erro de conexão:', dropError.message);
      return;
    }
    
    console.log('✅ Conexão com Supabase OK');
    
    // Como não podemos executar DDL diretamente via client, vamos testar se a constraint já foi corrigida
    console.log('\n2. Testando se podemos criar usuário admin...');
    
    const testUserId = crypto.randomUUID();
    const { data: insertData, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: testUserId,
        email: 'test_admin_constraint@test.com',
        full_name: 'Test Admin Constraint',
        role: 'admin',
        active: true,
        status: 'active'
      });

    if (insertError) {
      console.log('❌ Constraint ainda não foi corrigida:', insertError.message);
      console.log('\n📋 INSTRUÇÕES PARA CORREÇÃO MANUAL:');
      console.log('1. Acesse o painel do Supabase: https://supabase.com/dashboard');
      console.log('2. Vá para o projeto: lhgujxyfxyxzozgokutf');
      console.log('3. Acesse SQL Editor');
      console.log('4. Execute o seguinte SQL:');
      console.log('');
      console.log('   ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;');
      console.log('   ALTER TABLE profiles ADD CONSTRAINT profiles_role_check');
      console.log('   CHECK (role IN (\'user\', \'admin\', \'developer\', \'manager\'));');
      console.log('');
      console.log('5. Após executar, teste novamente a criação de usuário admin');
    } else {
      console.log('✅ Usuário admin criado com sucesso! Constraint já está corrigida!');
      
      // Limpar teste
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('email', 'test_admin_constraint@test.com');
      
      if (deleteError) {
        console.log('⚠️ Erro ao limpar teste:', deleteError.message);
      } else {
        console.log('✅ Teste limpo com sucesso');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

fixConstraint();