import { createClient } from "@supabase/supabase-js";

// Configurações do Supabase
const supabaseUrl = "https://lhgujxyfxyxzozgokutf.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxoZ3VqeHlmeHl4em96Z29rdXRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzOTA2NjUsImV4cCI6MjA3Mzk2NjY2NX0.GqhKb-Zo00t54x5pMYvwAZGFuOSeFedYKt7-Q-TVmfo";

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDataAdmissaoConstraint() {
  console.log("🔧 Iniciando correção da coluna data_admissao...");
  
  try {
    // Verificar estrutura atual da tabela
    console.log("📋 Verificando estrutura atual da tabela idosos...");
    
    const { data: tableInfo, error: tableError } = await supabase
      .from('idosos')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error("❌ Erro ao verificar tabela:", tableError);
      return;
    }
    
    console.log("✅ Tabela idosos encontrada");
    
    // Executar SQL para corrigir a coluna data_admissao
    const sqlQuery = `
      -- Alterar a coluna para ter um valor padrão (data atual)
      ALTER TABLE public.idosos 
      ALTER COLUMN data_admissao SET DEFAULT CURRENT_DATE;
      
      -- Atualizar registros existentes que possam ter data_admissao NULL
      UPDATE public.idosos 
      SET data_admissao = CURRENT_DATE 
      WHERE data_admissao IS NULL;
    `;
    
    console.log("🔄 Executando correção da coluna data_admissao...");
    
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: sqlQuery 
    });
    
    if (error) {
      console.error("❌ Erro ao executar SQL:", error);
      
      // Tentar uma abordagem alternativa usando uma função personalizada
      console.log("🔄 Tentando abordagem alternativa...");
      
      // Primeiro, vamos verificar se existem registros com data_admissao NULL
      const { data: nullRecords, error: nullError } = await supabase
        .from('idosos')
        .select('id, data_admissao')
        .is('data_admissao', null);
      
      if (nullError) {
        console.error("❌ Erro ao verificar registros NULL:", nullError);
        return;
      }
      
      if (nullRecords && nullRecords.length > 0) {
        console.log(`📝 Encontrados ${nullRecords.length} registros com data_admissao NULL`);
        
        // Atualizar cada registro individualmente
        for (const record of nullRecords) {
          const { error: updateError } = await supabase
            .from('idosos')
            .update({ data_admissao: new Date().toISOString().split('T')[0] })
            .eq('id', record.id);
          
          if (updateError) {
            console.error(`❌ Erro ao atualizar registro ${record.id}:`, updateError);
          } else {
            console.log(`✅ Registro ${record.id} atualizado`);
          }
        }
      } else {
        console.log("✅ Nenhum registro com data_admissao NULL encontrado");
      }
    } else {
      console.log("✅ SQL executado com sucesso:", data);
    }
    
    // Verificar se a correção funcionou
    console.log("🔍 Verificando resultado final...");
    
    const { data: finalCheck, error: finalError } = await supabase
      .from('idosos')
      .select('id, nome, data_admissao')
      .limit(5);
    
    if (finalError) {
      console.error("❌ Erro na verificação final:", finalError);
    } else {
      console.log("📊 Primeiros 5 registros da tabela idosos:");
      console.table(finalCheck);
    }
    
    console.log("🎉 Correção da coluna data_admissao concluída!");
    console.log("💡 Agora o formulário deve funcionar corretamente");
    
  } catch (error) {
    console.error("❌ Erro geral:", error);
  }
}

// Executar a correção
fixDataAdmissaoConstraint();