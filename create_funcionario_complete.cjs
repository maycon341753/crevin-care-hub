const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://lhgujxyfxyxzozgokutf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxoZ3VqeHlmeHl4em96Z29rdXRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM5MDY2NSwiZXhwIjoyMDczOTY2NjY1fQ.AHq_kORGZlUpzsRM2Zy5wlGkzRbEr2wbB8AAyFDAEyk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createFuncionarioComplete() {
  console.log('🔧 Criando funcionário Danielle com todos os campos obrigatórios...');
  
  try {
    // 1. Primeiro, buscar o user_id da Danielle na tabela auth.users
    console.log('1️⃣ Buscando user_id da Danielle...');
    const { data: authUser, error: authError } = await supabase
      .from('profiles')
      .select('user_id, full_name, email')
      .eq('email', 'daniellemoura16@gmail.com')
      .single();

    if (authError || !authUser) {
      console.error('❌ Usuário Danielle não encontrado na tabela profiles:', authError?.message);
      return;
    }

    console.log('✅ Usuário encontrado:', authUser.full_name);
    const createdBy = authUser.user_id;

    // 2. Buscar um departamento válido (preferencialmente Administradores)
    console.log('2️⃣ Buscando departamento Administradores...');
    let { data: adminDept, error: adminError } = await supabase
      .from('departamentos')
      .select('id, nome')
      .eq('nome', 'Administradores')
      .single();

    if (adminError || !adminDept) {
      console.log('ℹ️ Departamento Administradores não encontrado, buscando qualquer departamento...');
      const { data: anyDept, error: anyError } = await supabase
        .from('departamentos')
        .select('id, nome')
        .limit(1)
        .single();

      if (anyError || !anyDept) {
        console.error('❌ Nenhum departamento encontrado:', anyError?.message);
        return;
      }
      adminDept = anyDept;
    }

    console.log('✅ Departamento encontrado:', adminDept.nome);

    // 3. Verificar se já existe funcionário com este CPF
    console.log('3️⃣ Verificando se funcionário já existe...');
    const { data: existingFunc, error: existingError } = await supabase
      .from('funcionarios')
      .select('*')
      .eq('cpf', '05437633157');

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
          email: 'daniellemoura16@gmail.com',
          cargo: 'Administrador',
          departamento_id: adminDept.id,
          status: 'ativo',
          created_by: createdBy
        })
        .eq('cpf', '05437633157')
        .select();

      if (updateError) {
        console.error('❌ Erro ao atualizar funcionário:', updateError.message);
      } else {
        console.log('✅ Funcionário atualizado com sucesso!');
        console.log('📊 Dados atualizados:', updateResult[0]);
      }
    } else {
      console.log('4️⃣ Criando novo funcionário...');
      
      // Criar novo funcionário com TODOS os campos obrigatórios
      const funcionarioData = {
        nome: 'Danielle da Silva Moura',
        cpf: '05437633157',
        email: 'daniellemoura16@gmail.com',
        cargo: 'Administrador',
        departamento_id: adminDept.id,
        data_admissao: new Date().toISOString().split('T')[0], // Data atual no formato YYYY-MM-DD
        status: 'ativo',
        created_by: createdBy // Campo obrigatório!
      };

      console.log('📋 Dados a serem inseridos:', funcionarioData);

      const { data: insertResult, error: insertError } = await supabase
        .from('funcionarios')
        .insert(funcionarioData)
        .select();

      if (insertError) {
        console.error('❌ Erro ao inserir funcionário:', insertError.message);
        console.error('💡 Detalhes do erro:', insertError);
      } else {
        console.log('✅ Funcionário criado com sucesso!');
        console.log('📊 Dados:', insertResult[0]);
      }
    }

    // 5. Verificação final
    console.log('5️⃣ Verificação final...');
    const { data: finalCheck, error: finalError } = await supabase
      .from('funcionarios')
      .select('*')
      .eq('cpf', '05437633157');

    if (finalError) {
      console.error('❌ Erro na verificação final:', finalError.message);
    } else if (finalCheck && finalCheck.length > 0) {
      const funcionario = finalCheck[0];
      console.log('');
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
      console.log('👤 Criado por:', funcionario.created_by);
      console.log('📅 Criado em:', funcionario.created_at);
      console.log('');
      console.log('✅ FUNCIONÁRIO CRIADO COM SUCESSO NA SUPABASE!');
      console.log('🔐 Login: daniellemoura16@gmail.com');
      console.log('🔑 Senha: DanielleAdmin2025!');
      console.log('👑 Role: admin');
    } else {
      console.log('❌ Funcionário não encontrado após operação');
    }

  } catch (error) {
    console.error('💥 Erro geral:', error.message);
    console.error('📋 Stack:', error.stack);
  }
}

// Executar a função
createFuncionarioComplete();