const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://lhgujxyfxyxzozgokutf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxoZ3VqeHlmeHl4em96Z29rdXRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM5MDY2NSwiZXhwIjoyMDczOTY2NjY1fQ.AHq_kORGZlUpzsRM2Zy5wlGkzRbEr2wbB8AAyFDAEyk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixFuncionarioDanielle() {
  console.log('🔧 Corrigindo inserção do funcionário Danielle...');
  
  try {
    // 1. Verificar se já existe funcionário com este email
    console.log('1️⃣ Verificando funcionário existente...');
    const { data: existingFunc, error: existingError } = await supabase
      .from('funcionarios')
      .select('*')
      .eq('email', 'daniellemoura16@gmail.com');

    if (existingError) {
      console.error('❌ Erro ao verificar funcionário existente:', existingError.message);
      return;
    }

    if (existingFunc && existingFunc.length > 0) {
      console.log('ℹ️ Funcionário já existe! Atualizando dados...');
      console.log('📊 Dados atuais:', existingFunc[0]);
      
      // Atualizar funcionário existente
      const { data: updateResult, error: updateError } = await supabase
        .from('funcionarios')
        .update({
          nome: 'Danielle da Silva Moura',
          cpf: '05437633157',
          cargo: 'Administrador',
          status: 'ativo'
        })
        .eq('email', 'daniellemoura16@gmail.com')
        .select();

      if (updateError) {
        console.error('❌ Erro ao atualizar funcionário:', updateError.message);
      } else {
        console.log('✅ Funcionário atualizado com sucesso!');
        console.log('📊 Dados atualizados:', updateResult[0]);
      }
    } else {
      console.log('ℹ️ Funcionário não existe, criando novo...');
      
      // 2. Buscar um departamento válido
      console.log('2️⃣ Buscando departamento válido...');
      const { data: departamentos, error: deptError } = await supabase
        .from('departamentos')
        .select('id, nome')
        .limit(1);

      let departamentoId = null;
      if (deptError || !departamentos || departamentos.length === 0) {
        console.log('ℹ️ Nenhum departamento encontrado, usando NULL');
      } else {
        departamentoId = departamentos[0].id;
        console.log('✅ Departamento encontrado:', departamentos[0].nome);
      }

      // 3. Criar novo funcionário com todos os campos obrigatórios
      console.log('3️⃣ Criando novo funcionário...');
      const funcionarioData = {
        nome: 'Danielle da Silva Moura',
        email: 'daniellemoura16@gmail.com',
        cpf: '05437633157',
        cargo: 'Administrador',
        departamento_id: departamentoId,
        status: 'ativo',
        data_admissao: new Date().toISOString().split('T')[0] // Data atual no formato YYYY-MM-DD
      };

      const { data: insertResult, error: insertError } = await supabase
        .from('funcionarios')
        .insert(funcionarioData)
        .select();

      if (insertError) {
        console.error('❌ Erro ao inserir funcionário:', insertError.message);
        
        // Tentar sem departamento_id se for o problema
        console.log('ℹ️ Tentando sem departamento_id...');
        delete funcionarioData.departamento_id;
        
        const { data: retryResult, error: retryError } = await supabase
          .from('funcionarios')
          .insert(funcionarioData)
          .select();

        if (retryError) {
          console.error('❌ Erro na segunda tentativa:', retryError.message);
        } else {
          console.log('✅ Funcionário criado sem departamento!');
          console.log('📊 Dados:', retryResult[0]);
        }
      } else {
        console.log('✅ Funcionário criado com sucesso!');
        console.log('📊 Dados:', insertResult[0]);
      }
    }

    // 4. Verificação final
    console.log('4️⃣ Verificação final...');
    const { data: finalCheck, error: finalError } = await supabase
      .from('funcionarios')
      .select('*')
      .eq('email', 'daniellemoura16@gmail.com');

    if (finalError) {
      console.error('❌ Erro na verificação final:', finalError.message);
    } else if (finalCheck && finalCheck.length > 0) {
      const funcionario = finalCheck[0];
      console.log('🎯 FUNCIONÁRIO CONFIRMADO!');
      console.log('');
      console.log('📋 DADOS COMPLETOS:');
      console.log('🆔 ID:', funcionario.id);
      console.log('👤 Nome:', funcionario.nome);
      console.log('📧 Email:', funcionario.email);
      console.log('📄 CPF:', funcionario.cpf);
      console.log('💼 Cargo:', funcionario.cargo);
      console.log('📊 Status:', funcionario.status);
      console.log('🏢 Departamento ID:', funcionario.departamento_id);
      console.log('📅 Data Admissão:', funcionario.data_admissao);
      console.log('📅 Criado em:', funcionario.created_at);
      console.log('');
      console.log('✅ CPF adicionado com sucesso na tabela funcionarios!');
    } else {
      console.log('❌ Funcionário não encontrado após operação');
    }

  } catch (error) {
    console.error('💥 Erro geral:', error.message);
  }
}

// Executar a função
fixFuncionarioDanielle();