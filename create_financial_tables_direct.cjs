const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://lhgujxyfxyxzozgokutf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxoZ3VqeHlmeHl4em96Z29rdXRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM5MDY2NSwiZXhwIjoyMDczOTY2NjY1fQ.AHq_kORGZlUpzsRM2Zy5wlGkzRbEr2wbB8AAyFDAEyk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createFinancialTables() {
  console.log('🔄 Criando tabelas financeiras...');
  
  try {
    // 1. Criar tabela categorias_financeiras
    console.log('📋 Criando tabela categorias_financeiras...');
    const { error: error1 } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.categorias_financeiras (
          id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
          nome TEXT NOT NULL UNIQUE,
          tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
          descricao TEXT,
          cor TEXT DEFAULT '#6B7280',
          ativo BOOLEAN NOT NULL DEFAULT true,
          created_by UUID NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );
      `
    });
    
    if (error1) {
      console.error('❌ Erro ao criar categorias_financeiras:', error1);
    } else {
      console.log('✅ Tabela categorias_financeiras criada');
    }

    // 2. Criar tabela contas_receber
    console.log('📋 Criando tabela contas_receber...');
    const { error: error2 } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.contas_receber (
          id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
          descricao TEXT NOT NULL,
          valor DECIMAL(10,2) NOT NULL,
          data_vencimento DATE NOT NULL,
          data_recebimento DATE,
          status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'recebido', 'vencido', 'cancelado')),
          categoria_id UUID NOT NULL REFERENCES public.categorias_financeiras(id),
          observacoes TEXT,
          created_by UUID NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );
      `
    });
    
    if (error2) {
      console.error('❌ Erro ao criar contas_receber:', error2);
    } else {
      console.log('✅ Tabela contas_receber criada');
    }

    // 3. Criar tabela contas_pagar
    console.log('📋 Criando tabela contas_pagar...');
    const { error: error3 } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.contas_pagar (
          id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
          descricao TEXT NOT NULL,
          valor DECIMAL(10,2) NOT NULL,
          data_vencimento DATE NOT NULL,
          data_pagamento DATE,
          status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'vencido', 'cancelado')),
          categoria_id UUID NOT NULL REFERENCES public.categorias_financeiras(id),
          observacoes TEXT,
          created_by UUID NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );
      `
    });
    
    if (error3) {
      console.error('❌ Erro ao criar contas_pagar:', error3);
    } else {
      console.log('✅ Tabela contas_pagar criada');
    }

    // 4. Criar tabela movimentacoes_financeiras
    console.log('📋 Criando tabela movimentacoes_financeiras...');
    const { error: error4 } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.movimentacoes_financeiras (
          id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
          tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
          descricao TEXT NOT NULL,
          valor DECIMAL(10,2) NOT NULL,
          data_movimentacao DATE NOT NULL DEFAULT CURRENT_DATE,
          categoria_id UUID NOT NULL REFERENCES public.categorias_financeiras(id),
          conta_receber_id UUID REFERENCES public.contas_receber(id),
          conta_pagar_id UUID REFERENCES public.contas_pagar(id),
          forma_pagamento TEXT NOT NULL CHECK (forma_pagamento IN ('dinheiro', 'pix', 'cartao', 'transferencia', 'cheque', 'boleto')),
          observacoes TEXT,
          comprovante_url TEXT,
          created_by UUID NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );
      `
    });
    
    if (error4) {
      console.error('❌ Erro ao criar movimentacoes_financeiras:', error4);
    } else {
      console.log('✅ Tabela movimentacoes_financeiras criada');
    }

    // 5. Inserir categorias padrão
    console.log('📋 Inserindo categorias padrão...');
    const { error: error5 } = await supabase.rpc('exec_sql', {
      sql: `
        INSERT INTO public.categorias_financeiras (nome, tipo, descricao, cor, created_by) VALUES
        ('Doações', 'receita', 'Doações recebidas', '#10B981', '00000000-0000-0000-0000-000000000000'),
        ('Mensalidades', 'receita', 'Mensalidades dos idosos', '#3B82F6', '00000000-0000-0000-0000-000000000000'),
        ('Convênios', 'receita', 'Receitas de convênios', '#8B5CF6', '00000000-0000-0000-0000-000000000000'),
        ('Alimentação', 'despesa', 'Gastos com alimentação', '#EF4444', '00000000-0000-0000-0000-000000000000'),
        ('Medicamentos', 'despesa', 'Gastos com medicamentos', '#F59E0B', '00000000-0000-0000-0000-000000000000'),
        ('Limpeza', 'despesa', 'Produtos de limpeza', '#EC4899', '00000000-0000-0000-0000-000000000000'),
        ('Salários', 'despesa', 'Pagamento de funcionários', '#6366F1', '00000000-0000-0000-0000-000000000000'),
        ('Manutenção', 'despesa', 'Manutenção e reparos', '#F97316', '00000000-0000-0000-0000-000000000000')
        ON CONFLICT (nome) DO NOTHING;
      `
    });
    
    if (error5) {
      console.error('❌ Erro ao inserir categorias:', error5);
    } else {
      console.log('✅ Categorias padrão inseridas');
    }

    console.log('🎉 Tabelas financeiras criadas com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

createFinancialTables();