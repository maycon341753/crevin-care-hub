const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://lhgujxyfxyxzozgokutf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxoZ3VqeHlmeHl4em96Z29rdXRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM5MDY2NSwiZXhwIjoyMDczOTY2NjY1fQ.AHq_kORGZlUpzsRM2Zy5wlGkzRbEr2wbB8AAyFDAEyk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addRecorrenteFields() {
  try {
    console.log('🚀 Tentando adicionar campos recorrentes à tabela contas_receber...');
    
    // Primeiro, vamos tentar inserir um registro de teste para forçar a criação dos campos
    console.log('📝 Método alternativo: Tentando usar uma migração via Supabase...');
    
    // Vamos tentar usar o SQL Editor do Supabase através da API REST
    const sqlCommands = [
      "ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS recorrente BOOLEAN DEFAULT false;",
      "ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS frequencia_recorrencia TEXT DEFAULT 'mensal';"
    ];
    
    console.log('\n💡 INSTRUÇÕES PARA EXECUÇÃO MANUAL:');
    console.log('Como o Supabase não permite execução direta de DDL via API, você precisa:');
    console.log('\n1. Acesse https://supabase.com/dashboard/project/lhgujxyfxyxzozgokutf');
    console.log('2. Vá para "SQL Editor" no menu lateral');
    console.log('3. Cole e execute os seguintes comandos SQL:');
    console.log('\n--- COPIE E COLE NO SQL EDITOR ---');
    sqlCommands.forEach((cmd, index) => {
      console.log(`-- Comando ${index + 1}:`);
      console.log(cmd);
      console.log('');
    });
    console.log('--- FIM DO SQL ---\n');
    
    console.log('4. Clique em "Run" para executar');
    console.log('5. Após executar, rode novamente o script de verificação');
    
    // Vamos tentar uma abordagem alternativa usando migrations
    console.log('\n🔄 Tentando criar arquivo de migração...');
    
    const migrationContent = `-- Migration: Add recurring fields to contas_receber
-- Created: ${new Date().toISOString()}

-- Add recorrente field
ALTER TABLE public.contas_receber 
ADD COLUMN IF NOT EXISTS recorrente BOOLEAN DEFAULT false;

-- Add frequencia_recorrencia field  
ALTER TABLE public.contas_receber 
ADD COLUMN IF NOT EXISTS frequencia_recorrencia TEXT DEFAULT 'mensal';

-- Add comments for documentation
COMMENT ON COLUMN public.contas_receber.recorrente IS 'Indica se a conta a receber é recorrente';
COMMENT ON COLUMN public.contas_receber.frequencia_recorrencia IS 'Frequência da recorrência: mensal, trimestral, semestral, anual';`;

    // Salvar como arquivo de migração
    const fs = require('fs');
    const migrationFileName = `supabase/migrations/${Date.now()}_add_recorrente_fields_contas_receber.sql`;
    
    try {
      fs.writeFileSync(migrationFileName, migrationContent);
      console.log(`✅ Arquivo de migração criado: ${migrationFileName}`);
      console.log('💡 Você pode aplicar esta migração usando: supabase db push');
    } catch (fsError) {
      console.log('⚠️  Não foi possível criar arquivo de migração automaticamente');
    }
    
    console.log('\n🔍 Verificando status atual da tabela...');
    
    // Verificar se os campos já existem
    const { data, error } = await supabase
      .from('contas_receber')
      .select('*')
      .limit(1);
    
    if (data && data.length > 0) {
      const fields = Object.keys(data[0]);
      const hasRecorrente = fields.includes('recorrente');
      const hasFrequencia = fields.includes('frequencia_recorrencia');
      
      console.log('\n📊 Status dos campos:');
      console.log(`Campo "recorrente": ${hasRecorrente ? '✅ Existe' : '❌ Não existe'}`);
      console.log(`Campo "frequencia_recorrencia": ${hasFrequencia ? '✅ Existe' : '❌ Não existe'}`);
      
      if (hasRecorrente && hasFrequencia) {
        console.log('\n🎉 Todos os campos recorrentes já existem! Você pode prosseguir.');
      } else {
        console.log('\n⚠️  Alguns campos ainda precisam ser adicionados manualmente.');
      }
    }
    
  } catch (err) {
    console.error('❌ Erro:', err);
  }
}

addRecorrenteFields();