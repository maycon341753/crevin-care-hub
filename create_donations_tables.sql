-- Script para criar tabelas de doações
-- Executar no Supabase SQL Editor

-- 1. Criar tabela de doações em dinheiro
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'doacoes_dinheiro') THEN
    CREATE TABLE public.doacoes_dinheiro (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      doador_nome TEXT NOT NULL,
      doador_email TEXT,
      doador_telefone TEXT,
      doador_cpf TEXT,
      valor DECIMAL(10,2) NOT NULL CHECK (valor > 0),
      data_doacao DATE NOT NULL DEFAULT CURRENT_DATE,
      forma_pagamento TEXT NOT NULL CHECK (forma_pagamento IN ('dinheiro', 'pix', 'cartao', 'transferencia', 'cheque', 'boleto')),
      observacoes TEXT,
      comprovante_url TEXT,
      status TEXT NOT NULL DEFAULT 'confirmada' CHECK (status IN ('pendente', 'confirmada', 'cancelada')),
      created_by UUID NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );

    RAISE NOTICE '✅ Tabela doacoes_dinheiro criada com sucesso!';
  ELSE
    RAISE NOTICE 'ℹ️ Tabela doacoes_dinheiro já existe.';
  END IF;
END $$;

-- 2. Criar tabela de doações de itens
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'doacoes_itens') THEN
    CREATE TABLE public.doacoes_itens (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      doador_nome TEXT NOT NULL,
      doador_email TEXT,
      doador_telefone TEXT,
      doador_cpf TEXT,
      item_descricao TEXT NOT NULL,
      quantidade INTEGER NOT NULL DEFAULT 1 CHECK (quantidade > 0),
      categoria TEXT NOT NULL CHECK (categoria IN ('roupas', 'alimentos', 'medicamentos', 'brinquedos', 'moveis', 'eletronicos', 'outros')),
      condicao TEXT NOT NULL DEFAULT 'novo' CHECK (condicao IN ('novo', 'usado_bom', 'usado_regular', 'usado_ruim')),
      data_doacao DATE NOT NULL DEFAULT CURRENT_DATE,
      observacoes TEXT,
      foto_url TEXT,
      status TEXT NOT NULL DEFAULT 'recebida' CHECK (status IN ('pendente', 'recebida', 'distribuida', 'cancelada')),
      created_by UUID NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );

    RAISE NOTICE '✅ Tabela doacoes_itens criada com sucesso!';
  ELSE
    RAISE NOTICE 'ℹ️ Tabela doacoes_itens já existe.';
  END IF;
END $$;

-- 3. Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $func$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$func$ language 'plpgsql';

-- 4. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_doacoes_dinheiro_data ON public.doacoes_dinheiro(data_doacao);
CREATE INDEX IF NOT EXISTS idx_doacoes_dinheiro_status ON public.doacoes_dinheiro(status);
CREATE INDEX IF NOT EXISTS idx_doacoes_dinheiro_doador ON public.doacoes_dinheiro(doador_nome);

CREATE INDEX IF NOT EXISTS idx_doacoes_itens_data ON public.doacoes_itens(data_doacao);
CREATE INDEX IF NOT EXISTS idx_doacoes_itens_status ON public.doacoes_itens(status);
CREATE INDEX IF NOT EXISTS idx_doacoes_itens_categoria ON public.doacoes_itens(categoria);
CREATE INDEX IF NOT EXISTS idx_doacoes_itens_doador ON public.doacoes_itens(doador_nome);

-- 5. Habilitar RLS (Row Level Security)
ALTER TABLE public.doacoes_dinheiro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doacoes_itens ENABLE ROW LEVEL SECURITY;

-- 6. Criar políticas RLS básicas
DROP POLICY IF EXISTS "Usuários autenticados podem gerenciar doações em dinheiro" ON public.doacoes_dinheiro;
CREATE POLICY "Usuários autenticados podem gerenciar doações em dinheiro" ON public.doacoes_dinheiro
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuários autenticados podem gerenciar doações de itens" ON public.doacoes_itens;
CREATE POLICY "Usuários autenticados podem gerenciar doações de itens" ON public.doacoes_itens
  FOR ALL USING (auth.role() = 'authenticated');

-- 7. Criar triggers para atualizar updated_at
DROP TRIGGER IF EXISTS update_doacoes_dinheiro_updated_at ON public.doacoes_dinheiro;
CREATE TRIGGER update_doacoes_dinheiro_updated_at 
  BEFORE UPDATE ON public.doacoes_dinheiro 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_doacoes_itens_updated_at ON public.doacoes_itens;
CREATE TRIGGER update_doacoes_itens_updated_at 
  BEFORE UPDATE ON public.doacoes_itens 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Comentários nas tabelas
COMMENT ON TABLE public.doacoes_dinheiro IS 'Registro de doações em dinheiro recebidas pela instituição';
COMMENT ON TABLE public.doacoes_itens IS 'Registro de doações de itens recebidas pela instituição';

-- 9. Inserir dados de exemplo (opcional)
INSERT INTO public.doacoes_dinheiro (doador_nome, doador_email, doador_telefone, valor, forma_pagamento, observacoes, created_by)
VALUES 
  ('João Silva', 'joao@email.com', '(11) 99999-9999', 100.00, 'pix', 'Doação mensal', '00000000-0000-0000-0000-000000000000'),
  ('Maria Santos', 'maria@email.com', '(11) 88888-8888', 250.00, 'transferencia', 'Doação para alimentação', '00000000-0000-0000-0000-000000000000'),
  ('Pedro Costa', 'pedro@email.com', '(11) 77777-7777', 50.00, 'dinheiro', 'Doação espontânea', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

INSERT INTO public.doacoes_itens (doador_nome, doador_email, doador_telefone, item_descricao, quantidade, categoria, condicao, observacoes, created_by)
VALUES 
  ('Ana Oliveira', 'ana@email.com', '(11) 66666-6666', 'Roupas infantis variadas', 20, 'roupas', 'usado_bom', 'Roupas de 2 a 8 anos', '00000000-0000-0000-0000-000000000000'),
  ('Carlos Ferreira', 'carlos@email.com', '(11) 55555-5555', 'Cestas básicas', 5, 'alimentos', 'novo', 'Cestas completas', '00000000-0000-0000-0000-000000000000'),
  ('Lucia Mendes', 'lucia@email.com', '(11) 44444-4444', 'Brinquedos educativos', 10, 'brinquedos', 'usado_bom', 'Brinquedos pedagógicos', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- Mensagem final
DO $$
BEGIN
  RAISE NOTICE '=== TABELAS DE DOAÇÕES CRIADAS COM SUCESSO ===';
  RAISE NOTICE 'Tabelas criadas: doacoes_dinheiro, doacoes_itens';
  RAISE NOTICE 'Índices, RLS, políticas e triggers configurados!';
  RAISE NOTICE 'Dados de exemplo inseridos com sucesso!';
  RAISE NOTICE 'Próximo passo: Executar este script no Supabase SQL Editor';
END $$;