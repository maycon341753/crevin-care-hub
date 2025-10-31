const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://ixqhqvqmkqjjxqjjxqjj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWhxdnFta3Fqanhxamp4cWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ1NTI5NzYsImV4cCI6MjA1MDEyODk3Nn0.Ej8nKgbQZhQKhQKhQKhQKhQKhQKhQKhQKhQKhQKhQKhQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkContasReceber() {
  try {
    console.log('=== VERIFICANDO CONTAS A RECEBER ===');
    
    // Buscar todas as contas a receber
    const { data, error } = await supabase
      .from('contas_receber')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Erro:', error);
      return;
    }
    
    console.log('Total de registros encontrados:', data?.length || 0);
    
    if (data && data.length > 0) {
      console.log('\n=== ÚLTIMAS 10 CONTAS A RECEBER ===');
      data.slice(0, 10).forEach((conta, index) => {
        console.log(`${index + 1}. ID: ${conta.id}`);
        console.log(`   Descrição: ${conta.descricao}`);
        console.log(`   Valor: R$ ${conta.valor}`);
        console.log(`   Status: ${conta.status}`);
        console.log(`   Data Vencimento: ${conta.data_vencimento}`);
        console.log(`   Criado em: ${conta.created_at}`);
        console.log(`   Recorrente: ${conta.recorrente || 'false'}`);
        if (conta.recorrente) {
          console.log(`   Tipo Recorrência: ${conta.tipo_recorrencia || 'N/A'}`);
          console.log(`   Intervalo: ${conta.intervalo_recorrencia || 'N/A'}`);
        }
        console.log('   ---');
      });
      
      // Calcular totais
      const totalPendente = data
        .filter(c => c.status === 'pendente')
        .reduce((acc, c) => acc + c.valor, 0);
      
      const contasRecorrentes = data.filter(c => c.recorrente === true);
      const totalRecorrente = contasRecorrentes.reduce((acc, c) => acc + c.valor, 0);
      
      console.log(`\n=== RESUMO ===`);
      console.log(`Total de contas: ${data.length}`);
      console.log(`Total pendente: R$ ${totalPendente.toLocaleString('pt-BR')}`);
      console.log(`Contas recorrentes: ${contasRecorrentes.length}`);
      console.log(`Total recorrente: R$ ${totalRecorrente.toLocaleString('pt-BR')}`);
      
      // Verificar contas criadas hoje
      const hoje = new Date().toISOString().split('T')[0];
      const contasHoje = data.filter(c => c.created_at.startsWith(hoje));
      
      if (contasHoje.length > 0) {
        console.log(`\n=== CONTAS CRIADAS HOJE (${hoje}) ===`);
        contasHoje.forEach((conta, index) => {
          console.log(`${index + 1}. ${conta.descricao} - R$ ${conta.valor} (${conta.created_at})`);
        });
      }
      
    } else {
      console.log('Nenhuma conta a receber encontrada.');
    }
    
  } catch (err) {
    console.error('Erro ao verificar contas:', err);
  }
}

checkContasReceber();