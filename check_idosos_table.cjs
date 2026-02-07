const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lhgujxyfxyxzozgokutf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxoZ3VqeHlmeHl4em96Z29rdXRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM5MDY2NSwiZXhwIjoyMDczOTY2NjY1fQ.AHq_kORGZlUpzsRM2Zy5wlGkzRbEr2wbB8AAyFDAEyk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkIdososTable() {
  console.log('=== VERIFICANDO TABELA IDOSOS ===\n');

  try {
    // 1. Verificar se a tabela existe tentando fazer uma consulta simples
    console.log('1. Verificando se a tabela idosos existe...');
    const { data: testData, error: testError } = await supabase
      .from('idosos')
      .select('*')
      .limit(1);

    if (testError) {
      console.error('❌ Erro ao acessar tabela idosos:', testError);
      console.log('Detalhes do erro:', JSON.stringify(testError, null, 2));
      return;
    }

    console.log('✅ Tabela idosos existe e é acessível');

    // 2. Verificar quantos registros existem
    console.log('\n2. Verificando dados na tabela...');
    const { count, error: countError } = await supabase
      .from('idosos')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Erro ao contar registros:', countError);
      return;
    }

    console.log(`Total de registros: ${count}`);

    // 3. Verificar alguns registros
    if (count > 0) {
      console.log('\n3. Verificando alguns registros...');
      const { data: samples, error: samplesError } = await supabase
        .from('idosos')
        .select('id, nome, cpf, ativo')
        .limit(5);

      if (samplesError) {
        console.error('Erro ao buscar amostras:', samplesError);
        return;
      }

      console.log('Amostras de registros:');
      samples.forEach(idoso => {
        console.log(`  - ${idoso.nome} (CPF: ${idoso.cpf}, Ativo: ${idoso.ativo})`);
      });
    }

    // 4. Testar inserção simples
    console.log('\n4. Testando inserção na tabela...');
    const testData2 = {
      nome: 'Teste Transferência',
      cpf: '12345678901',
      data_nascimento: '1950-01-01',
      ativo: true
    };

    const { data: insertResult, error: insertError } = await supabase
      .from('idosos')
      .insert(testData2)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Erro ao inserir teste:', insertError);
      console.log('Detalhes do erro:', JSON.stringify(insertError, null, 2));
    } else {
      console.log('✅ Inserção de teste bem-sucedida');
      console.log('Registro criado:', insertResult);

      // Remover o registro de teste
      const { error: deleteError } = await supabase
        .from('idosos')
        .delete()
        .eq('id', insertResult.id);

      if (deleteError) {
        console.log('⚠️ Aviso: Não foi possível remover o registro de teste');
      } else {
        console.log('✅ Registro de teste removido');
      }
    }

  } catch (error) {
    console.error('Erro geral:', error);
  }
}

checkIdososTable();