const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuração do Supabase
const supabaseUrl = 'https://lhgujxyfxyxzozgokutf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxoZ3VqeHlmeHl4em96Z29rdXRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM5MDY2NSwiZXhwIjoyMDczOTY2NjY1fQ.AHq_kORGZlUpzsRM2Zy5wlGkzRbEr2wbB8AAyFDAEyk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeAddRecorrenteFields() {
  try {
    console.log('🚀 Iniciando adição de campos recorrentes à tabela contas_receber...');
    
    // Ler o arquivo SQL
    const sqlFilePath = path.join(__dirname, 'add_recorrente_to_contas_receber.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Dividir o SQL em comandos individuais (separados por ponto e vírgula)
    const sqlCommands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`📝 Executando ${sqlCommands.length} comandos SQL...`);
    
    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i];
      if (command.trim()) {
        console.log(`\n⏳ Executando comando ${i + 1}/${sqlCommands.length}:`);
        console.log(command.substring(0, 100) + '...');
        
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: command
        });
        
        if (error) {
          console.error(`❌ Erro no comando ${i + 1}:`, error);
          
          // Tentar executar diretamente se o RPC falhar
          try {
            const { data: directData, error: directError } = await supabase
              .from('contas_receber')
              .select('*')
              .limit(0);
              
            if (directError && directError.message.includes('recorrente')) {
              console.log('🔄 Tentando executar ALTER TABLE diretamente...');
              
              // Executar ALTER TABLE usando uma abordagem diferente
              const alterCommands = [
                "ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS recorrente BOOLEAN DEFAULT false",
                "ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS frequencia_recorrencia TEXT DEFAULT 'mensal'"
              ];
              
              for (const alterCmd of alterCommands) {
                console.log(`Executando: ${alterCmd}`);
                // Aqui você pode usar uma biblioteca de PostgreSQL direta se necessário
                // Por enquanto, vamos continuar com a verificação
              }
            }
          } catch (directErr) {
            console.error('Erro na execução direta:', directErr);
          }
        } else {
          console.log(`✅ Comando ${i + 1} executado com sucesso`);
          if (data) {
            console.log('Resultado:', data);
          }
        }
      }
    }
    
    // Verificar se os campos foram adicionados
    console.log('\n🔍 Verificando se os campos foram adicionados...');
    
    const { data: checkData, error: checkError } = await supabase
      .from('contas_receber')
      .select('recorrente, frequencia_recorrencia')
      .limit(1);
    
    if (checkError) {
      if (checkError.message.includes('recorrente') || checkError.message.includes('frequencia_recorrencia')) {
        console.log('❌ Os campos ainda não existem na tabela');
        console.log('💡 Você pode precisar executar o SQL manualmente no painel do Supabase');
        console.log('\nSQL para executar manualmente:');
        console.log('ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS recorrente BOOLEAN DEFAULT false;');
        console.log("ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS frequencia_recorrencia TEXT DEFAULT 'mensal';");
      } else {
        console.error('Erro na verificação:', checkError);
      }
    } else {
      console.log('✅ Campos recorrentes adicionados com sucesso!');
      console.log('📋 Estrutura verificada - campos disponíveis para uso');
    }
    
  } catch (err) {
    console.error('❌ Erro geral:', err);
    console.log('\n💡 Instruções manuais:');
    console.log('1. Acesse o painel do Supabase');
    console.log('2. Vá para SQL Editor');
    console.log('3. Execute os seguintes comandos:');
    console.log('   ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS recorrente BOOLEAN DEFAULT false;');
    console.log("   ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS frequencia_recorrencia TEXT DEFAULT 'mensal';");
  }
}

executeAddRecorrenteFields();