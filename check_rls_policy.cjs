const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://lhgujxyfxyxzozgokutf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_nqv19CzV1kkQVpjIijE28w_YJtKOEBA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkRLSPolicy() {
  try {
    console.log('🔍 Verificando usuários e tentando edição...');
    
    // Primeiro, vamos ver quais usuários existem
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);
    
    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError);
      return;
    }
    
    console.log('👥 Usuários encontrados:', users.length);
    users.forEach(user => {
      console.log(`- ${user.full_name} (${user.role}) - ID: ${user.user_id}`);
    });
    
    // Tentar fazer um update de teste
    if (users.length > 0) {
      const testUser = users[0];
      console.log(`\n🧪 Testando update no usuário: ${testUser.full_name}`);
      
      const { data: updateResult, error: updateError } = await supabase
        .from('profiles')
        .update({ 
          full_name: testUser.full_name + ' (teste)' 
        })
        .eq('user_id', testUser.user_id)
        .select();
      
      if (updateError) {
        console.error('❌ Erro no update:', updateError);
        console.error('📋 Detalhes:', {
          code: updateError.code,
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint
        });
      } else {
        console.log('✅ Update realizado com sucesso!');
        console.log('📋 Resultado:', updateResult);
        
        // Reverter o teste
        await supabase
          .from('profiles')
          .update({ 
            full_name: testUser.full_name 
          })
          .eq('user_id', testUser.user_id);
        
        console.log('🔄 Teste revertido');
      }
    }
    
  } catch (err) {
    console.error('❌ Erro geral:', err.message);
  }
}

checkRLSPolicy();