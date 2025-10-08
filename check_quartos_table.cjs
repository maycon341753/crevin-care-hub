const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lhgujxyfxyxzozgokutf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxoZ3VqeHlmeHl4em96Z29rdXRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM5MDY2NSwiZXhwIjoyMDczOTY2NjY1fQ.AHq_kORGZlUpzsRM2Zy5wlGkzRbEr2wbB8AAyFDAEyk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkQuartosTable() {
  console.log('🔍 Verificando estrutura da tabela quartos...');
  
  try {
    // Tentar fazer uma consulta simples na tabela quartos
    const { data: quartos, error: quartosError } = await supabase
      .from('quartos')
      .select('*')
      .limit(1);
    
    if (quartosError) {
      console.log('❌ Erro ao acessar tabela quartos:', quartosError.message);
      console.log('❌ Código do erro:', quartosError.code);
      console.log('❌ Detalhes:', quartosError.details);
      
      if (quartosError.code === '42P01') {
        console.log('📋 A tabela quartos não existe no banco de dados');
      }
      return;
    }
    
    console.log('✅ Tabela quartos existe e é acessível');
    console.log('📊 Exemplo de dados:', quartos);
    
    // Tentar inserir um quarto de teste para ver qual erro ocorre
    console.log('\n🧪 Testando inserção de quarto duplicado...');
    
    // Primeiro, inserir um quarto de teste
    const { data: insertData, error: insertError } = await supabase
      .from('quartos')
      .insert([{
        numero: 'TESTE_001',
        tipo: 'individual',
        capacidade: 1,
        ala: 'TESTE',
        status: 'disponivel'
      }])
      .select();
    
    if (insertError) {
      console.log('❌ Erro ao inserir quarto de teste:', insertError.message);
      console.log('❌ Código:', insertError.code);
      console.log('❌ Detalhes:', insertError.details);
    } else {
      console.log('✅ Quarto de teste inserido:', insertData);
      
      // Agora tentar inserir o mesmo número novamente
      const { data: duplicateData, error: duplicateError } = await supabase
        .from('quartos')
        .insert([{
          numero: 'TESTE_001',
          tipo: 'duplo',
          capacidade: 2,
          ala: 'TESTE2',
          status: 'disponivel'
        }]);
      
      if (duplicateError) {
        console.log('🔍 Erro esperado ao inserir duplicado:', duplicateError.message);
        console.log('🔍 Código:', duplicateError.code);
        console.log('🔍 Detalhes:', duplicateError.details);
      }
      
      // Limpar o quarto de teste
      const { error: deleteError } = await supabase
        .from('quartos')
        .delete()
        .eq('numero', 'TESTE_001');
      
      if (deleteError) {
        console.log('⚠️ Erro ao limpar quarto de teste:', deleteError.message);
      } else {
        console.log('🧹 Quarto de teste removido');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

checkQuartosTable();