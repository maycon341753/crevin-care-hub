const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://lhgujxyfxyxzozgokutf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxoZ3VqeHlmeHl4em96Z29rdXRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM5MDY2NSwiZXhwIjoyMDczOTY2NjY1fQ.AHq_kORGZlUpzsRM2Zy5wlGkzRbEr2wbB8AAyFDAEyk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkContasReceberStructure() {
  try {
    console.log('Verificando estrutura da tabela contas_receber...');
    
    // Fazer uma consulta simples para obter a estrutura
    const { data, error } = await supabase
      .from('contas_receber')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Erro ao consultar tabela:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('Estrutura da tabela contas_receber:');
      console.log('Campos disponíveis:', Object.keys(data[0]));
      
      // Verificar se existe campo recorrente
      const hasRecorrenteField = Object.keys(data[0]).includes('recorrente');
      const hasFrequenciaField = Object.keys(data[0]).includes('frequencia_recorrencia');
      
      console.log('\n--- Análise de campos recorrentes ---');
      console.log('Campo "recorrente" existe:', hasRecorrenteField);
      console.log('Campo "frequencia_recorrencia" existe:', hasFrequenciaField);
      
      if (!hasRecorrenteField) {
        console.log('\n⚠️  AÇÃO NECESSÁRIA: Campo "recorrente" não encontrado na tabela contas_receber');
        console.log('Será necessário adicionar este campo para implementar pagamentos recorrentes');
      } else {
        console.log('\n✅ Campo "recorrente" já existe na tabela');
      }
    } else {
      console.log('Tabela contas_receber está vazia, mas existe');
      
      // Tentar obter informações da estrutura através de uma consulta vazia
      const { error: structureError } = await supabase
        .from('contas_receber')
        .select('recorrente, frequencia_recorrencia')
        .limit(0);
        
      if (structureError) {
        if (structureError.message.includes('recorrente')) {
          console.log('❌ Campo "recorrente" não existe na tabela');
        } else {
          console.log('Erro ao verificar estrutura:', structureError.message);
        }
      } else {
        console.log('✅ Campos recorrentes existem na tabela');
      }
    }
    
  } catch (err) {
    console.error('Erro geral:', err);
  }
}

checkContasReceberStructure();