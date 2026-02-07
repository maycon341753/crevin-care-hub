const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://lhgujxyfxyxzozgokutf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxoZ3VqeHlmeHl4em96Z29rdXRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM5MDY2NSwiZXhwIjoyMDczOTY2NjY1fQ.AHq_kORGZlUpzsRM2Zy5wlGkzRbEr2wbB8AAyFDAEyk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addCpfToFuncionarios() {
  console.log('🔧 Adicionando CPF na tabela funcionarios...');
  
  try {
    // 1. Primeiro, verificar a estrutura da tabela funcionarios
    console.log('1️⃣ Verificando estrutura da tabela funcionarios...');
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_columns', { table_name: 'funcionarios' });

    if (tableError) {
      console.log('ℹ️ Usando método alternativo para verificar tabela...');
      
      // Tentar buscar um registro para ver a estrutura
      const { data: sampleData, error: sampleError } = await supabase
        .from('funcionarios')
        .select('*')
        .limit(1);

      if (sampleError) {
        console.error('❌ Erro ao verificar tabela funcionarios:', sampleError.message);
        return;
      }

      console.log('📊 Estrutura da tabela (baseada em dados existentes):');
      if (sampleData && sampleData.length > 0) {
        console.log('Colunas encontradas:', Object.keys(sampleData[0]));
      } else {
        console.log('Tabela vazia, tentando inserir dados...');
      }
    }

    // 2. Verificar se existe algum departamento para usar como padrão
    console.log('2️⃣ Verificando departamentos disponíveis...');
    const { data: departamentos, error: deptError } = await supabase
      .from('departamentos')
      .select('id, nome')
      .limit(5);

    let departamentoId = null;
    if (deptError) {
      console.log('ℹ️ Erro ao buscar departamentos:', deptError.message);
      console.log('ℹ️ Tentando criar departamento padrão...');
      
      // Tentar criar um departamento padrão
      const { data: newDept, error: newDeptError } = await supabase
        .from('departamentos')
        .insert({
          nome: 'Administração',
          descricao: 'Departamento Administrativo',
          ativo: true
        })
        .select()
        .single();

      if (newDeptError) {
        console.error('❌ Erro ao criar departamento:', newDeptError.message);
      } else {
        departamentoId = newDept.id;
        console.log('✅ Departamento criado:', newDept.nome, 'ID:', departamentoId);
      }
    } else if (departamentos && departamentos.length > 0) {
      departamentoId = departamentos[0].id;
      console.log('✅ Departamento encontrado:', departamentos[0].nome, 'ID:', departamentoId);
    }

    // 3. Tentar inserir o funcionário com CPF
    console.log('3️⃣ Inserindo funcionário com CPF...');
    const funcionarioData = {
      nome: 'Danielle da Silva Moura',
      email: 'daniellemoura16@gmail.com',
      cpf: '05437633157',
      cargo: 'Administrador',
      status: 'ativo'
    };

    // Adicionar departamento_id se encontrado
    if (departamentoId) {
      funcionarioData.departamento_id = departamentoId;
    }

    const { data: funcionarioResult, error: funcionarioError } = await supabase
      .from('funcionarios')
      .upsert(funcionarioData, { 
        onConflict: 'email',
        ignoreDuplicates: false 
      })
      .select();

    if (funcionarioError) {
      console.error('❌ Erro ao inserir funcionário:', funcionarioError.message);
      
      // Tentar sem o campo que está causando problema
      console.log('ℹ️ Tentando inserção alternativa...');
      const { data: altResult, error: altError } = await supabase
        .from('funcionarios')
        .insert({
          nome: 'Danielle da Silva Moura',
          email: 'daniellemoura16@gmail.com',
          cpf: '05437633157'
        })
        .select();

      if (altError) {
        console.error('❌ Erro na inserção alternativa:', altError.message);
      } else {
        console.log('✅ Funcionário inserido com dados básicos!');
        console.log('📊 Dados:', altResult[0]);
      }
    } else {
      console.log('✅ Funcionário inserido com sucesso!');
      console.log('📊 Dados completos:', funcionarioResult[0]);
    }

    // 4. Verificação final
    console.log('4️⃣ Verificação final...');
    const { data: finalCheck, error: finalError } = await supabase
      .from('funcionarios')
      .select('*')
      .eq('email', 'daniellemoura16@gmail.com')
      .single();

    if (finalError) {
      console.error('❌ Erro na verificação final:', finalError.message);
    } else {
      console.log('🎯 FUNCIONÁRIO ENCONTRADO!');
      console.log('📋 Dados completos:');
      console.log('👤 Nome:', finalCheck.nome);
      console.log('📧 Email:', finalCheck.email);
      console.log('📄 CPF:', finalCheck.cpf);
      console.log('💼 Cargo:', finalCheck.cargo);
      console.log('📊 Status:', finalCheck.status);
      if (finalCheck.departamento_id) {
        console.log('🏢 Departamento ID:', finalCheck.departamento_id);
      }
      console.log('📅 Criado em:', finalCheck.created_at);
    }

  } catch (error) {
    console.error('💥 Erro geral:', error.message);
  }
}

// Executar a função
addCpfToFuncionarios();