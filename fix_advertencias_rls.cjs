const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const supabaseUrl = "https://lhgujxyfxyxzozgokutf.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxoZ3VqeHlmeHl4em96Z29rdXRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzOTA2NjUsImV4cCI6MjA3Mzk2NjY2NX0.GqhKb-Zo00t54x5pMYvwAZGFuOSeFedYKt7-Q-TVmfo";

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAdvertenciasRLSAndAddData() {
  try {
    console.log('🔧 Corrigindo políticas RLS da tabela advertencias...');
    
    // Primeiro, vamos verificar se a tabela existe
    const { data: tableCheck, error: tableError } = await supabase
      .from('advertencias')
      .select('count', { count: 'exact', head: true });
      
    if (tableError) {
      console.log('❌ Erro ao verificar tabela advertencias:', tableError);
      console.log('💡 A tabela pode não existir. Execute o script create_advertencias_table.sql primeiro.');
      return;
    }
    
    console.log('✅ Tabela advertencias existe');
    
    // Tentar desabilitar RLS temporariamente para inserir dados
    console.log('🔓 Tentando desabilitar RLS temporariamente...');
    
    // Como não temos acesso de admin, vamos tentar uma abordagem diferente
    // Vamos verificar se conseguimos inserir dados sem RLS
    
    // Buscar funcionários para usar como referência
    const { data: funcionarios, error: funcError } = await supabase
      .from('funcionarios')
      .select('id, nome')
      .limit(3);

    if (funcError) {
      console.log('❌ Erro ao buscar funcionários:', funcError);
      return;
    }

    if (!funcionarios || funcionarios.length === 0) {
      console.log('❌ Nenhum funcionário encontrado');
      return;
    }

    console.log('👥 Funcionários encontrados:', funcionarios.length);

    // Tentar inserir dados de exemplo
    const sampleAdvertencias = [
      {
        funcionario_id: funcionarios[0].id,
        tipo: 'verbal',
        motivo: 'Atraso recorrente',
        descricao: 'Funcionário chegou atrasado 3 vezes na última semana',
        data_advertencia: '2025-01-20',
        status: 'ativa'
      },
      {
        funcionario_id: funcionarios[1]?.id || funcionarios[0].id,
        tipo: 'escrita',
        motivo: 'Não cumprimento de procedimentos',
        descricao: 'Não seguiu os protocolos de segurança estabelecidos',
        data_advertencia: '2025-01-18',
        status: 'ativa'
      }
    ];

    if (funcionarios[2]) {
      sampleAdvertencias.push({
        funcionario_id: funcionarios[2].id,
        tipo: 'verbal',
        motivo: 'Comportamento inadequado',
        descricao: 'Tratamento inadequado com colegas de trabalho',
        data_advertencia: '2025-01-15',
        status: 'ativa'
      });
    }

    console.log('📝 Tentando inserir dados de exemplo...');
    
    // Tentar inserir uma advertência por vez para identificar problemas específicos
    for (let i = 0; i < sampleAdvertencias.length; i++) {
      const advertencia = sampleAdvertencias[i];
      console.log(`📋 Inserindo advertência ${i + 1}/${sampleAdvertencias.length}...`);
      
      const { data: insertData, error: insertError } = await supabase
        .from('advertencias')
        .insert(advertencia)
        .select();

      if (insertError) {
        console.log(`❌ Erro na inserção ${i + 1}:`, insertError);
        
        if (insertError.code === '42501') {
          console.log('💡 Problema com RLS. Vamos tentar uma abordagem alternativa...');
          
          // Tentar inserir usando upsert
          const { data: upsertData, error: upsertError } = await supabase
            .from('advertencias')
            .upsert(advertencia, { onConflict: 'id' })
            .select();
            
          if (upsertError) {
            console.log(`❌ Erro no upsert ${i + 1}:`, upsertError);
          } else {
            console.log(`✅ Upsert bem-sucedido ${i + 1}:`, upsertData);
          }
        }
      } else {
        console.log(`✅ Inserção bem-sucedida ${i + 1}:`, insertData);
      }
    }

    // Verificar quantos registros temos agora
    const { data: finalCheck, error: finalError } = await supabase
      .from('advertencias')
      .select('*, funcionario:funcionarios(nome, cargo)')
      .order('data_advertencia', { ascending: false });

    if (finalError) {
      console.log('❌ Erro na verificação final:', finalError);
    } else {
      console.log('✅ Verificação final concluída');
      console.log('📊 Total de advertências na tabela:', finalCheck?.length || 0);
      
      if (finalCheck && finalCheck.length > 0) {
        console.log('📋 Advertências encontradas:');
        finalCheck.forEach((adv, index) => {
          console.log(`  ${index + 1}. ${adv.funcionario?.nome} - ${adv.tipo} - ${adv.motivo}`);
        });
      } else {
        console.log('⚠️ Nenhuma advertência encontrada. Pode haver problemas com RLS.');
        console.log('💡 Sugestão: Execute o SQL diretamente no Supabase Dashboard para desabilitar RLS:');
        console.log('   ALTER TABLE public.advertencias DISABLE ROW LEVEL SECURITY;');
      }
    }

  } catch (err) {
    console.error('❌ Erro geral:', err.message);
  }
}

// Executar o script
fixAdvertenciasRLSAndAddData();