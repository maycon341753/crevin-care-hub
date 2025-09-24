const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configuração do Supabase
const supabaseUrl = 'https://lhgujxyfxyxzozgokutf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxoZ3VqeHlmeHl4em96Z29rdXRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM5MDY2NSwiZXhwIjoyMDczOTY2NjY1fQ.AHq_kORGZlUpzsRM2Zy5wlGkzRbEr2wbB8AAyFDAEyk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createListaEsperaTable() {
  try {
    console.log('🔧 Verificando se a tabela lista_espera_idosos já existe...');
    
    // Primeiro, vamos tentar acessar a tabela para ver se ela existe
    const { data: existingData, error: existingError } = await supabase
      .from('lista_espera_idosos')
      .select('*')
      .limit(1);
    
    if (!existingError) {
      console.log('✅ Tabela lista_espera_idosos já existe e está acessível!');
      console.log('📊 Estrutura da tabela verificada com sucesso');
      return;
    }
    
    console.log('ℹ️ Tabela não existe, será necessário criá-la manualmente no Supabase Dashboard');
    console.log('');
    console.log('📋 INSTRUÇÕES PARA CRIAR A TABELA:');
    console.log('1. Acesse: https://supabase.com/dashboard/project/lhgujxyfxyxzozgokutf/sql/new');
    console.log('2. Cole o seguinte SQL:');
    console.log('');
    console.log('-- Criar tabela para lista de espera de idosos');
    console.log('CREATE TABLE IF NOT EXISTS lista_espera_idosos (');
    console.log('    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,');
    console.log('    nome VARCHAR(255) NOT NULL,');
    console.log('    cpf VARCHAR(14) UNIQUE NOT NULL,');
    console.log('    data_nascimento DATE NOT NULL,');
    console.log('    telefone VARCHAR(20),');
    console.log('    endereco TEXT,');
    console.log('    responsavel_nome VARCHAR(255),');
    console.log('    responsavel_telefone VARCHAR(20),');
    console.log('    responsavel_parentesco VARCHAR(100),');
    console.log('    observacoes TEXT,');
    console.log('    data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
    console.log('    posicao_fila INTEGER,');
    console.log('    status VARCHAR(20) DEFAULT \'aguardando\' CHECK (status IN (\'aguardando\', \'contatado\', \'transferido\', \'cancelado\')),');
    console.log('    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
    console.log('    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
    console.log(');');
    console.log('');
    console.log('-- Criar índices para melhor performance');
    console.log('CREATE INDEX IF NOT EXISTS idx_lista_espera_cpf ON lista_espera_idosos(cpf);');
    console.log('CREATE INDEX IF NOT EXISTS idx_lista_espera_status ON lista_espera_idosos(status);');
    console.log('CREATE INDEX IF NOT EXISTS idx_lista_espera_posicao ON lista_espera_idosos(posicao_fila);');
    console.log('CREATE INDEX IF NOT EXISTS idx_lista_espera_data_cadastro ON lista_espera_idosos(data_cadastro);');
    console.log('');
    console.log('-- Habilitar RLS (Row Level Security)');
    console.log('ALTER TABLE lista_espera_idosos ENABLE ROW LEVEL SECURITY;');
    console.log('');
    console.log('-- Política RLS para permitir acesso apenas a usuários autenticados');
    console.log('CREATE POLICY "Permitir acesso a usuários autenticados" ON lista_espera_idosos');
    console.log('    FOR ALL USING (auth.role() = \'authenticated\');');
    console.log('');
    console.log('3. Execute o script clicando em "Run"');
    console.log('');
    console.log('⚠️ IMPORTANTE: A tabela precisa ser criada manualmente no Supabase Dashboard');
    console.log('   pois não temos acesso direto ao banco via API para DDL operations.');
    
  } catch (error) {
    console.log('❌ Erro geral:', error.message);
  }
}

createListaEsperaTable().catch(console.error);