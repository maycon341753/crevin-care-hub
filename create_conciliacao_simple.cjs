const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://lhgujxyfxyxzozgokutf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxoZ3VqeHlmeHl4em96Z29rdXRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM5MDY2NSwiZXhwIjoyMDczOTY2NjY1fQ.AHq_kORGZlUpzsRM2Zy5wlGkzRbEr2wbB8AAyFDAEyk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createConciliacaoTables() {
  try {
    console.log('📋 Criando tabelas de conciliação bancária...\n');
    
    // 1. Criar tabela contas_bancarias
    console.log('⏳ Criando tabela contas_bancarias...');
    const { error: error1 } = await supabase.rpc('exec_sql', {
      sql_query: `
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
      `
    });
    
    if (error1) {
      console.error('❌ Erro ao criar contas_bancarias:', error1);
    } else {
      console.log('✅ Tabela contas_bancarias criada!');
    }
    
    // 2. Criar tabela movimentos_bancarios
    console.log('⏳ Criando tabela movimentos_bancarios...');
    const { error: error2 } = await supabase.rpc('exec_sql', {
      sql_query: `
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
      `
    });
    
    if (error2) {
      console.error('❌ Erro ao criar movimentos_bancarios:', error2);
    } else {
      console.log('✅ Tabela movimentos_bancarios criada!');
    }
    
    // 3. Criar índices
    console.log('⏳ Criando índices...');
    const { error: error3 } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE INDEX IF NOT EXISTS idx_contas_bancarias_ativo ON public.contas_bancarias(ativo);
        CREATE INDEX IF NOT EXISTS idx_movimentos_bancarios_conta ON public.movimentos_bancarios(conta_bancaria_id);
        CREATE INDEX IF NOT EXISTS idx_movimentos_bancarios_data ON public.movimentos_bancarios(data_movimento);
        CREATE INDEX IF NOT EXISTS idx_movimentos_bancarios_status ON public.movimentos_bancarios(status_conciliacao);
      `
    });
    
    if (error3) {
      console.error('❌ Erro ao criar índices:', error3);
    } else {
      console.log('✅ Índices criados!');
    }
    
    // 4. Habilitar RLS
    console.log('⏳ Habilitando RLS...');
    const { error: error4 } = await supabase.rpc('exec_sql', {
      sql_query: `
        ALTER TABLE public.contas_bancarias ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.movimentos_bancarios ENABLE ROW LEVEL SECURITY;
      `
    });
    
    if (error4) {
      console.error('❌ Erro ao habilitar RLS:', error4);
    } else {
      console.log('✅ RLS habilitado!');
    }
    
    // 5. Criar políticas RLS
    console.log('⏳ Criando políticas RLS...');
    const { error: error5 } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE POLICY IF NOT EXISTS "Usuários podem ver todas as contas bancárias" ON public.contas_bancarias FOR SELECT USING (true);
        CREATE POLICY IF NOT EXISTS "Usuários podem inserir contas bancárias" ON public.contas_bancarias FOR INSERT WITH CHECK (true);
        CREATE POLICY IF NOT EXISTS "Usuários podem atualizar contas bancárias" ON public.contas_bancarias FOR UPDATE USING (true);
        CREATE POLICY IF NOT EXISTS "Usuários podem deletar contas bancárias" ON public.contas_bancarias FOR DELETE USING (true);
        
        CREATE POLICY IF NOT EXISTS "Usuários podem ver todos os movimentos bancários" ON public.movimentos_bancarios FOR SELECT USING (true);
        CREATE POLICY IF NOT EXISTS "Usuários podem inserir movimentos bancários" ON public.movimentos_bancarios FOR INSERT WITH CHECK (true);
        CREATE POLICY IF NOT EXISTS "Usuários podem atualizar movimentos bancários" ON public.movimentos_bancarios FOR UPDATE USING (true);
        CREATE POLICY IF NOT EXISTS "Usuários podem deletar movimentos bancários" ON public.movimentos_bancarios FOR DELETE USING (true);
      `
    });
    
    if (error5) {
      console.error('❌ Erro ao criar políticas RLS:', error5);
    } else {
      console.log('✅ Políticas RLS criadas!');
    }
    
    // 6. Inserir dados de exemplo
    console.log('⏳ Inserindo dados de exemplo...');
    
    // Primeiro, buscar um usuário válido
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (profiles && profiles.length > 0) {
      const userId = profiles[0].id;
      
      const { error: error6 } = await supabase
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
        ]);
      
      if (error6) {
        console.error('❌ Erro ao inserir dados de exemplo:', error6);
      } else {
        console.log('✅ Dados de exemplo inseridos!');
      }
    } else {
      console.log('⚠️ Nenhum usuário encontrado para inserir dados de exemplo.');
    }
    
    console.log('\n🎉 Tabelas de conciliação criadas com sucesso!');
    
    // Verificar tabelas criadas
    console.log('\n🔍 Verificando tabelas criadas...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['contas_bancarias', 'movimentos_bancarios']);
    
    if (tablesError) {
      console.error('❌ Erro ao verificar tabelas:', tablesError);
    } else {
      console.log('📋 Tabelas encontradas:', tables?.map(t => t.table_name) || []);
    }
    
  } catch (err) {
    console.error('❌ Erro geral:', err.message);
  }
}

// Executar o script
createConciliacaoTables();