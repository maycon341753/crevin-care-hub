const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://ixqhqvqmkqjjxqjjxqjj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWhxdnFta3Fqanhxamp4cWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ1NTI5NzYsImV4cCI6MjA1MDEyODk3Nn0.Ej8nKgbQZhQKhQKhQKhQKhQKhQKhQKhQKhQKhQKhQKhQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFuncionariosStructure() {
  try {
    console.log('=== VERIFICANDO ESTRUTURA DA TABELA FUNCIONARIOS ===');
    
    // Buscar alguns funcionários para ver a estrutura
    const { data, error } = await supabase
      .from('funcionarios')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Erro:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('Campos disponíveis na tabela funcionarios:');
      Object.keys(data[0]).forEach(field => {
        console.log(`- ${field}: ${typeof data[0][field]} (${data[0][field]})`);
      });
      
      // Verificar se tem data_nascimento
      if (data[0].hasOwnProperty('data_nascimento')) {
        console.log('\n✅ Campo data_nascimento EXISTE na tabela funcionarios');
      } else {
        console.log('\n❌ Campo data_nascimento NÃO EXISTE na tabela funcionarios');
        console.log('Será necessário adicionar este campo à tabela.');
      }
    } else {
      console.log('Nenhum funcionário encontrado para verificar estrutura.');
    }
    
    // Verificar também a tabela idosos
    console.log('\n=== VERIFICANDO ESTRUTURA DA TABELA IDOSOS ===');
    
    const { data: idososData, error: idososError } = await supabase
      .from('idosos')
      .select('*')
      .limit(1);
    
    if (idososError) {
      console.error('Erro:', idososError);
      return;
    }
    
    if (idososData && idososData.length > 0) {
      console.log('Campos disponíveis na tabela idosos:');
      Object.keys(idososData[0]).forEach(field => {
        console.log(`- ${field}: ${typeof idososData[0][field]} (${idososData[0][field]})`);
      });
      
      // Verificar se tem data_nascimento
      if (idososData[0].hasOwnProperty('data_nascimento')) {
        console.log('\n✅ Campo data_nascimento EXISTE na tabela idosos');
      } else {
        console.log('\n❌ Campo data_nascimento NÃO EXISTE na tabela idosos');
      }
    } else {
      console.log('Nenhum idoso encontrado para verificar estrutura.');
    }
    
  } catch (err) {
    console.error('Erro ao verificar estrutura:', err);
  }
}

checkFuncionariosStructure();