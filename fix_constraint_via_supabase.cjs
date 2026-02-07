const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lhgujxyfxyxzozgokutf.supabase.co';
const supabaseKey = 'sb_publishable_nqv19CzV1kkQVpjIijE28w_YJtKOEBA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixConstraint() {
  console.log('🔧 Corrigindo constraint profiles_role_check...');
  
  try {
    // 1. Verificar constraint atual
    console.log('\n1. Verificando constraint atual...');
    const { data: currentConstraint, error: checkError } = await supabase
      .rpc('sql', { 
        query: `SELECT conname, pg_get_constraintdef(oid) as definition 
                FROM pg_constraint 
                WHERE conname = 'profiles_role_check';`
      });
    
    if (checkError) {
      console.log('❌ Erro ao verificar constraint:', checkError.message);
    } else {
      console.log('✅ Constraint atual:', currentConstraint);
    }

    // 2. Remover constraint atual
    console.log('\n2. Removendo constraint atual...');
    const { error: dropError } = await supabase
      .rpc('sql', { 
        query: 'ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;'
      });
    
    if (dropError) {
      console.log('❌ Erro ao remover constraint:', dropError.message);
    } else {
      console.log('✅ Constraint removida com sucesso');
    }

    // 3. Adicionar nova constraint
    console.log('\n3. Adicionando nova constraint...');
    const { error: addError } = await supabase
      .rpc('sql', { 
        query: `ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
                CHECK (role IN ('user', 'admin', 'developer', 'manager'));`
      });
    
    if (addError) {
      console.log('❌ Erro ao adicionar constraint:', addError.message);
    } else {
      console.log('✅ Nova constraint adicionada com sucesso');
    }

    // 4. Verificar nova constraint
    console.log('\n4. Verificando nova constraint...');
    const { data: newConstraint, error: verifyError } = await supabase
      .rpc('sql', { 
        query: `SELECT conname, pg_get_constraintdef(oid) as definition 
                FROM pg_constraint 
                WHERE conname = 'profiles_role_check';`
      });
    
    if (verifyError) {
      console.log('❌ Erro ao verificar nova constraint:', verifyError.message);
    } else {
      console.log('✅ Nova constraint:', newConstraint);
    }

    // 5. Teste com usuário admin
    console.log('\n5. Testando criação de usuário admin...');
    const testUserId = crypto.randomUUID();
    const { data: insertData, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: testUserId,
        email: 'test_admin_fix@test.com',
        full_name: 'Test Admin Fix',
        role: 'admin',
        active: true,
        status: 'active'
      });

    if (insertError) {
      console.log('❌ Erro ao inserir usuário admin:', insertError.message);
    } else {
      console.log('✅ Usuário admin criado com sucesso!');
      
      // Limpar teste
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('email', 'test_admin_fix@test.com');
      
      if (deleteError) {
        console.log('⚠️ Erro ao limpar teste:', deleteError.message);
      } else {
        console.log('✅ Teste limpo com sucesso');
      }
    }

    console.log('\n🎉 Correção da constraint concluída!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

fixConstraint();