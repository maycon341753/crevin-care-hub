const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://ixqhqvqmkqjjxqjjxqjj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWhxdnFta3Fqanhxamp4cWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ1NTI5NzYsImV4cCI6MjA1MDEyODk3Nn0.Ej8nKgbQZhQKhQKhQKhQKhQKhQKhQKhQKhQKhQKhQKhQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanTestContas() {
  try {
    console.log('=== LIMPANDO CONTAS DE TESTE ===');
    
    // Primeiro, vamos ver o que temos
    const { data: allContas, error: selectError } = await supabase
      .from('contas_receber')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (selectError) {
      console.error('Erro ao buscar contas:', selectError);
      return;
    }
    
    console.log(`Total de contas encontradas: ${allContas?.length || 0}`);
    
    if (allContas && allContas.length > 0) {
      // Identificar contas que parecem ser de teste
      const contasTeste = allContas.filter(conta => {
        return (
          conta.descricao?.toLowerCase().includes('teste') ||
          conta.descricao?.toLowerCase().includes('test') ||
          conta.descricao?.toLowerCase().includes('exemplo') ||
          conta.descricao?.toLowerCase().includes('demo') ||
          conta.recorrente === true // Contas recorrentes criadas automaticamente
        );
      });
      
      console.log(`Contas identificadas como teste: ${contasTeste.length}`);
      
      if (contasTeste.length > 0) {
        console.log('\n=== CONTAS QUE SERÃO REMOVIDAS ===');
        contasTeste.forEach((conta, index) => {
          console.log(`${index + 1}. ${conta.descricao} - R$ ${conta.valor} (ID: ${conta.id})`);
        });
        
        // Remover contas de teste
        const idsParaRemover = contasTeste.map(c => c.id);
        
        const { error: deleteError } = await supabase
          .from('contas_receber')
          .delete()
          .in('id', idsParaRemover);
        
        if (deleteError) {
          console.error('Erro ao remover contas:', deleteError);
        } else {
          console.log(`\n✅ ${contasTeste.length} contas de teste removidas com sucesso!`);
          
          // Verificar o que sobrou
          const { data: remaining } = await supabase
            .from('contas_receber')
            .select('*');
          
          const totalRestante = remaining?.reduce((acc, c) => acc + (c.status === 'pendente' ? c.valor : 0), 0) || 0;
          console.log(`Contas restantes: ${remaining?.length || 0}`);
          console.log(`Total pendente após limpeza: R$ ${totalRestante.toLocaleString('pt-BR')}`);
        }
      } else {
        console.log('Nenhuma conta de teste identificada para remoção.');
        
        // Mostrar resumo das contas existentes
        const totalPendente = allContas
          .filter(c => c.status === 'pendente')
          .reduce((acc, c) => acc + c.valor, 0);
        
        console.log(`\n=== RESUMO ATUAL ===`);
        console.log(`Total de contas: ${allContas.length}`);
        console.log(`Total pendente: R$ ${totalPendente.toLocaleString('pt-BR')}`);
      }
    }
    
  } catch (err) {
    console.error('Erro durante limpeza:', err);
  }
}

cleanTestContas();