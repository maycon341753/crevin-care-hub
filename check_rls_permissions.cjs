const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lhgujxyfxyxzozgokutf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxoZ3VqeHlmeHl4em96Z29rdXRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM5MDY2NSwiZXhwIjoyMDczOTY2NjY1fQ.AHq_kORGZlUpzsRM2Zy5wlGkzRbEr2wbB8AAyFDAEyk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLSPermissions() {
  console.log('🔍 Verificando permissões RLS na tabela idosos...\n');

  try {
    // 1. Verificar se RLS está habilitado
    const { data: rlsStatus, error: rlsError } = await supabase
      .from('pg_tables')
      .select('*')
      .eq('tablename', 'idosos');

    if (rlsError) {
      console.error('❌ Erro ao verificar RLS:', rlsError);
    } else {
      console.log('✅ Status da tabela idosos:', rlsStatus);
    }

    // 2. Tentar inserir um registro de teste
    console.log('\n🧪 Testando inserção na tabela idosos...');
    const { data: insertData, error: insertError } = await supabase
      .from('idosos')
      .insert({
        nome: 'Teste RLS',
        cpf: '12345678901',
        data_nascimento: '1950-01-01',
        ativo: true,
        created_by: '00000000-0000-0000-0000-000000000000' // UUID de teste
      })
      .select();

    if (insertError) {
      console.error('❌ Erro na inserção:', insertError);
      console.log('Detalhes do erro:', JSON.stringify(insertError, null, 2));
    } else {
      console.log('✅ Inserção bem-sucedida:', insertData);
      
      // Limpar o registro de teste
      if (insertData && insertData[0]) {
        await supabase
          .from('idosos')
          .delete()
          .eq('id', insertData[0].id);
        console.log('🧹 Registro de teste removido');
      }
    }

    // 3. Verificar políticas RLS
    console.log('\n🔐 Verificando políticas RLS...');
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_policies', { table_name: 'idosos' });

    if (policiesError) {
      console.log('⚠️ Não foi possível verificar políticas RLS:', policiesError.message);
    } else {
      console.log('📋 Políticas encontradas:', policies);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkRLSPermissions();