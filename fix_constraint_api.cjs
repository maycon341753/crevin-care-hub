const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lhgujxyfxyxzozgokutf.supabase.co';
const supabaseKey = 'sb_publishable_nqv19CzV1kkQVpjIijE28w_YJtKOEBA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixConstraintViaRPC() {
  console.log('🔧 Tentando corrigir constraint via RPC...');
  
  try {
    // Primeiro, vamos criar uma função RPC temporária para executar DDL
    console.log('\n1. Criando função RPC para executar DDL...');
    
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION fix_profiles_constraint()
      RETURNS text
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        -- Remover constraint atual
        ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
        
        -- Adicionar nova constraint
        ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
        CHECK (role IN ('user', 'admin', 'developer', 'manager'));
        
        RETURN 'Constraint corrigida com sucesso';
      EXCEPTION
        WHEN OTHERS THEN
          RETURN 'Erro: ' || SQLERRM;
      END;
      $$;
    `;
    
    // Tentar executar via query direta (pode não funcionar devido a RLS)
    const { data: createResult, error: createError } = await supabase
      .rpc('sql', { query: createFunctionSQL });
    
    if (createError) {
      console.log('❌ Não foi possível criar função RPC:', createError.message);
      
      // Alternativa: tentar inserir diretamente para testar se constraint foi corrigida externamente
      console.log('\n2. Testando se constraint já foi corrigida externamente...');
      
      const testUserId = crypto.randomUUID();
      const { data: testResult, error: testError } = await supabase
        .from('profiles')
        .insert({
          id: testUserId,
          email: 'test_constraint_fix@test.com',
          full_name: 'Test Constraint Fix',
          role: 'admin',
          active: true,
          status: 'active'
        });
      
      if (testError) {
        console.log('❌ Constraint ainda não foi corrigida:', testError.message);
        console.log('\n📋 AÇÃO NECESSÁRIA:');
        console.log('A constraint precisa ser corrigida manualmente no painel do Supabase.');
        console.log('');
        console.log('🔗 Acesse: https://supabase.com/dashboard/project/lhgujxyfxyxzozgokutf/sql');
        console.log('');
        console.log('📝 Execute este SQL:');
        console.log('');
        console.log('ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;');
        console.log('ALTER TABLE profiles ADD CONSTRAINT profiles_role_check');
        console.log('CHECK (role IN (\'user\', \'admin\', \'developer\', \'manager\'));');
        console.log('');
        console.log('✅ Após executar, teste novamente a criação de usuário admin');
        
        return false;
      } else {
        console.log('✅ Constraint já foi corrigida! Usuário admin criado com sucesso!');
        
        // Limpar teste
        await supabase
          .from('profiles')
          .delete()
          .eq('email', 'test_constraint_fix@test.com');
        
        return true;
      }
    } else {
      console.log('✅ Função RPC criada, executando correção...');
      
      // Executar a função de correção
      const { data: fixResult, error: fixError } = await supabase
        .rpc('fix_profiles_constraint');
      
      if (fixError) {
        console.log('❌ Erro ao executar correção:', fixError.message);
        return false;
      } else {
        console.log('✅ Resultado:', fixResult);
        
        // Testar se funcionou
        const testUserId = crypto.randomUUID();
        const { data: testResult, error: testError } = await supabase
          .from('profiles')
          .insert({
            id: testUserId,
            email: 'test_after_fix@test.com',
            full_name: 'Test After Fix',
            role: 'admin',
            active: true,
            status: 'active'
          });
        
        if (testError) {
          console.log('❌ Ainda há erro após correção:', testError.message);
          return false;
        } else {
          console.log('✅ Teste bem-sucedido! Constraint corrigida!');
          
          // Limpar teste
          await supabase
            .from('profiles')
            .delete()
            .eq('email', 'test_after_fix@test.com');
          
          return true;
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
    return false;
  }
}

fixConstraintViaRPC().then(success => {
  if (success) {
    console.log('\n🎉 Constraint corrigida com sucesso! Agora você pode criar usuários admin.');
  } else {
    console.log('\n⚠️ Correção automática não foi possível. Correção manual necessária.');
  }
});