const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://lhgujxyfxyxzozgokutf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxoZ3VqeHlmeHl4em96Z29rdXRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM5MDY2NSwiZXhwIjoyMDczOTY2NjY1fQ.AHq_kORGZlUpzsRM2Zy5wlGkzRbEr2wbB8AAyFDAEyk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTables() {
  try {
    console.log('📋 Criando tabelas de conciliação bancária...\n');
    
    // Primeiro, vamos verificar se as tabelas já existem
    console.log('🔍 Verificando tabelas existentes...');
    
    // Tentar inserir dados diretamente para verificar se as tabelas existem
    try {
      const { data: existingTables } = await supabase
        .from('contas_bancarias')
        .select('id')
        .limit(1);
      
      console.log('✅ Tabela contas_bancarias já existe!');
      
    } catch (error) {
      console.log('ℹ️ Tabela contas_bancarias não existe, será criada via SQL...');
    }
    
    // Como não conseguimos usar exec_sql, vamos tentar criar as tabelas usando o painel do Supabase
    console.log('\n📝 Para criar as tabelas de conciliação, execute o seguinte SQL no painel do Supabase:');
    console.log('🔗 Acesse: https://supabase.com/dashboard/project/lhgujxyfxyxzozgokutf/sql');
    console.log('\n--- SQL PARA EXECUTAR ---');
    
    const sqlScript = `
-- 1. Tabela de contas bancárias
CREATE TABLE IF NOT EXISTS public.contas_bancarias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  banco TEXT NOT NULL,
  agencia TEXT NOT NULL,
  conta TEXT NOT NULL,
  tipo_conta TEXT NOT NULL CHECK (tipo_conta IN ('corrente', 'poupanca', 'aplicacao')),
  saldo_inicial DECIMAL(10,2) NOT NULL DEFAULT 0,
  saldo_atual DECIMAL(10,2) NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  observacoes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Tabela de movimentos bancários
CREATE TABLE IF NOT EXISTS public.movimentos_bancarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conta_bancaria_id UUID NOT NULL REFERENCES public.contas_bancarias(id) ON DELETE CASCADE,
  data_movimento DATE NOT NULL,
  descricao TEXT NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  status_conciliacao TEXT NOT NULL DEFAULT 'pendente' CHECK (status_conciliacao IN ('conciliado', 'pendente', 'divergente')),
  documento TEXT,
  observacoes TEXT,
  hash_movimento TEXT,
  origem_importacao TEXT,
  data_importacao TIMESTAMP WITH TIME ZONE,
  conciliado_com_id UUID,
  conciliado_com_tipo TEXT CHECK (conciliado_com_tipo IN ('conta_pagar', 'conta_receber', 'movimentacao_financeira')),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Criar índices
CREATE INDEX IF NOT EXISTS idx_contas_bancarias_ativo ON public.contas_bancarias(ativo);
CREATE INDEX IF NOT EXISTS idx_contas_bancarias_banco ON public.contas_bancarias(banco);
CREATE INDEX IF NOT EXISTS idx_movimentos_bancarios_conta ON public.movimentos_bancarios(conta_bancaria_id);
CREATE INDEX IF NOT EXISTS idx_movimentos_bancarios_data ON public.movimentos_bancarios(data_movimento);
CREATE INDEX IF NOT EXISTS idx_movimentos_bancarios_status ON public.movimentos_bancarios(status_conciliacao);
CREATE INDEX IF NOT EXISTS idx_movimentos_bancarios_tipo ON public.movimentos_bancarios(tipo);

-- 4. Habilitar RLS
ALTER TABLE public.contas_bancarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentos_bancarios ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas RLS
CREATE POLICY IF NOT EXISTS "Usuários podem ver todas as contas bancárias" ON public.contas_bancarias FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Usuários podem inserir contas bancárias" ON public.contas_bancarias FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Usuários podem atualizar contas bancárias" ON public.contas_bancarias FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "Usuários podem deletar contas bancárias" ON public.contas_bancarias FOR DELETE USING (true);

CREATE POLICY IF NOT EXISTS "Usuários podem ver todos os movimentos bancários" ON public.movimentos_bancarios FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Usuários podem inserir movimentos bancários" ON public.movimentos_bancarios FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Usuários podem atualizar movimentos bancários" ON public.movimentos_bancarios FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "Usuários podem deletar movimentos bancários" ON public.movimentos_bancarios FOR DELETE USING (true);
`;
    
    console.log(sqlScript);
    console.log('--- FIM DO SQL ---\n');
    
    // Tentar inserir dados de exemplo se as tabelas existirem
    console.log('⏳ Tentando inserir dados de exemplo...');
    
    // Buscar um usuário válido
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (profiles && profiles.length > 0) {
      const userId = profiles[0].id;
      console.log(`👤 Usuário encontrado: ${userId}`);
      
      // Tentar inserir dados de exemplo
      try {
        const { data, error } = await supabase
          .from('contas_bancarias')
          .insert([
            {
              nome: 'Conta Corrente Principal',
              banco: 'Banco do Brasil',
              agencia: '1234-5',
              conta: '12345-6',
              tipo_conta: 'corrente',
              saldo_inicial: 10000.00,
              saldo_atual: 10000.00,
              created_by: userId
            },
            {
              nome: 'Conta Poupança',
              banco: 'Caixa Econômica Federal',
              agencia: '0001',
              conta: '98765-4',
              tipo_conta: 'poupanca',
              saldo_inicial: 5000.00,
              saldo_atual: 5000.00,
              created_by: userId
            }
          ])
          .select();
        
        if (error) {
          console.log('ℹ️ Tabelas ainda não existem. Execute o SQL acima primeiro.');
        } else {
          console.log('✅ Dados de exemplo inseridos com sucesso!');
          console.log('📊 Contas criadas:', data?.length || 0);
        }
        
      } catch (insertError) {
        console.log('ℹ️ Não foi possível inserir dados de exemplo. Execute o SQL primeiro.');
      }
      
    } else {
      console.log('⚠️ Nenhum usuário encontrado para inserir dados de exemplo.');
    }
    
    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('1. Acesse o painel do Supabase: https://supabase.com/dashboard/project/lhgujxyfxyxzozgokutf/sql');
    console.log('2. Cole e execute o SQL mostrado acima');
    console.log('3. Execute este script novamente para inserir dados de exemplo');
    console.log('4. Teste a página de conciliação em http://localhost:5173/financeiro/conciliacao');
    
  } catch (err) {
    console.error('❌ Erro geral:', err.message);
  }
}

// Executar o script
createTables();