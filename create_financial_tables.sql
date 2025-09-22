-- Script para criar tabelas do módulo financeiro
-- Data: 2025-01-23
-- Descrição: Cria tabelas para contas a pagar, contas a receber, receitas e despesas

-- 1. Tabela de categorias financeiras
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'categorias_financeiras') THEN
    CREATE TABLE public.categorias_financeiras (
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

    -- Inserir categorias padrão
    INSERT INTO public.categorias_financeiras (nome, tipo, descricao, cor, created_by) VALUES
    ('Doações', 'receita', 'Doações recebidas', '#10B981', '00000000-0000-0000-0000-000000000000'),
    ('Mensalidades', 'receita', 'Mensalidades dos idosos', '#3B82F6', '00000000-0000-0000-0000-000000000000'),
    ('Convênios', 'receita', 'Receitas de convênios', '#8B5CF6', '00000000-0000-0000-0000-000000000000'),
    ('Alimentação', 'despesa', 'Gastos com alimentação', '#EF4444', '00000000-0000-0000-0000-000000000000'),
    ('Medicamentos', 'despesa', 'Gastos com medicamentos', '#F59E0B', '00000000-0000-0000-0000-000000000000'),
    ('Salários', 'despesa', 'Pagamento de funcionários', '#DC2626', '00000000-0000-0000-0000-000000000000'),
    ('Manutenção', 'despesa', 'Manutenção e reparos', '#6B7280', '00000000-0000-0000-0000-000000000000'),
    ('Utilidades', 'despesa', 'Água, luz, telefone', '#059669', '00000000-0000-0000-0000-000000000000');

    RAISE NOTICE '✅ Tabela categorias_financeiras criada com sucesso!';
  ELSE
    RAISE NOTICE 'ℹ️ Tabela categorias_financeiras já existe.';
  END IF;
END $$;

-- 2. Tabela de contas a receber
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'contas_receber') THEN
    CREATE TABLE public.contas_receber (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      descricao TEXT NOT NULL,
      valor DECIMAL(10,2) NOT NULL,
      data_vencimento DATE NOT NULL,
      data_recebimento DATE,
      categoria_id UUID NOT NULL REFERENCES public.categorias_financeiras(id),
      idoso_id UUID REFERENCES public.idosos(id),
      pagador_nome TEXT,
      pagador_cpf TEXT,
      pagador_telefone TEXT,
      forma_pagamento TEXT CHECK (forma_pagamento IN ('dinheiro', 'pix', 'cartao', 'transferencia', 'cheque', 'boleto')),
      status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'recebido', 'vencido', 'cancelado')),
      observacoes TEXT,
      comprovante_url TEXT,
      created_by UUID NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );

    RAISE NOTICE '✅ Tabela contas_receber criada com sucesso!';
  ELSE
    RAISE NOTICE 'ℹ️ Tabela contas_receber já existe.';
  END IF;
END $$;

-- 3. Tabela de contas a pagar
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'contas_pagar') THEN
    CREATE TABLE public.contas_pagar (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      descricao TEXT NOT NULL,
      valor DECIMAL(10,2) NOT NULL,
      data_vencimento DATE NOT NULL,
      data_pagamento DATE,
      categoria_id UUID NOT NULL REFERENCES public.categorias_financeiras(id),
      fornecedor_nome TEXT NOT NULL,
      fornecedor_cnpj TEXT,
      fornecedor_telefone TEXT,
      forma_pagamento TEXT CHECK (forma_pagamento IN ('dinheiro', 'pix', 'cartao', 'transferencia', 'cheque', 'boleto')),
      status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'vencido', 'cancelado')),
      numero_documento TEXT,
      observacoes TEXT,
      comprovante_url TEXT,
      created_by UUID NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );

    RAISE NOTICE '✅ Tabela contas_pagar criada com sucesso!';
  ELSE
    RAISE NOTICE 'ℹ️ Tabela contas_pagar já existe.';
  END IF;
END $$;

-- 4. Tabela de movimentações financeiras (histórico)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'movimentacoes_financeiras') THEN
    CREATE TABLE public.movimentacoes_financeiras (
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

    RAISE NOTICE '✅ Tabela movimentacoes_financeiras criada com sucesso!';
  ELSE
    RAISE NOTICE 'ℹ️ Tabela movimentacoes_financeiras já existe.';
  END IF;
END $$;

-- 5. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_contas_receber_status ON public.contas_receber(status);
CREATE INDEX IF NOT EXISTS idx_contas_receber_vencimento ON public.contas_receber(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_contas_receber_categoria ON public.contas_receber(categoria_id);

CREATE INDEX IF NOT EXISTS idx_contas_pagar_status ON public.contas_pagar(status);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_vencimento ON public.contas_pagar(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_categoria ON public.contas_pagar(categoria_id);

CREATE INDEX IF NOT EXISTS idx_movimentacoes_data ON public.movimentacoes_financeiras(data_movimentacao);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_tipo ON public.movimentacoes_financeiras(tipo);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_categoria ON public.movimentacoes_financeiras(categoria_id);

-- 6. Habilitar RLS (Row Level Security)
ALTER TABLE public.categorias_financeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas_receber ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas_pagar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes_financeiras ENABLE ROW LEVEL SECURITY;

-- 7. Criar políticas RLS básicas
CREATE POLICY "Usuários autenticados podem ver categorias financeiras" ON public.categorias_financeiras
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem gerenciar contas a receber" ON public.contas_receber
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem gerenciar contas a pagar" ON public.contas_pagar
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem ver movimentações financeiras" ON public.movimentacoes_financeiras
  FOR SELECT USING (auth.role() = 'authenticated');

-- 8. Criar triggers para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_categorias_financeiras_updated_at BEFORE UPDATE ON public.categorias_financeiras FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contas_receber_updated_at BEFORE UPDATE ON public.contas_receber FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contas_pagar_updated_at BEFORE UPDATE ON public.contas_pagar FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_movimentacoes_financeiras_updated_at BEFORE UPDATE ON public.movimentacoes_financeiras FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. Comentários nas tabelas
COMMENT ON TABLE public.categorias_financeiras IS 'Categorias para classificação de receitas e despesas';
COMMENT ON TABLE public.contas_receber IS 'Contas a receber da instituição';
COMMENT ON TABLE public.contas_pagar IS 'Contas a pagar da instituição';
COMMENT ON TABLE public.movimentacoes_financeiras IS 'Histórico de todas as movimentações financeiras';

-- Mensagem final
DO $$
BEGIN
  RAISE NOTICE '=== TABELAS FINANCEIRAS CRIADAS COM SUCESSO ===';
  RAISE NOTICE 'Tabelas criadas: categorias_financeiras, contas_receber, contas_pagar, movimentacoes_financeiras';
  RAISE NOTICE 'Próximo passo: Executar este script no Supabase e criar a página FinanceiroPage.tsx';
END $$;