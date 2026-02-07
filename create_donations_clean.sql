-- Script LIMPO para criar tabelas de doações
-- Este script remove tudo primeiro e recria do zero

-- PASSO 1: Limpar estruturas existentes (se houver)
DROP TABLE IF EXISTS public.doacoes_dinheiro CASCADE;
DROP TABLE IF EXISTS public.doacoes_itens CASCADE;

-- PASSO 2: Criar função de trigger (se não existir)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $func$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$func$ language 'plpgsql';

-- PASSO 3: Criar tabela de doações em dinheiro
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

-- PASSO 4: Criar tabela de doações de itens
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

-- PASSO 5: Criar índices
CREATE INDEX idx_doacoes_dinheiro_data ON public.doacoes_dinheiro(data_doacao);
CREATE INDEX idx_doacoes_dinheiro_status ON public.doacoes_dinheiro(status);
CREATE INDEX idx_doacoes_dinheiro_doador ON public.doacoes_dinheiro(doador_nome);

CREATE INDEX idx_doacoes_itens_data ON public.doacoes_itens(data_doacao);
CREATE INDEX idx_doacoes_itens_status ON public.doacoes_itens(status);
CREATE INDEX idx_doacoes_itens_categoria ON public.doacoes_itens(categoria);
CREATE INDEX idx_doacoes_itens_doador ON public.doacoes_itens(doador_nome);

-- PASSO 6: Configurar RLS
ALTER TABLE public.doacoes_dinheiro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doacoes_itens ENABLE ROW LEVEL SECURITY;

-- PASSO 7: Criar políticas RLS
CREATE POLICY "Usuários autenticados podem gerenciar doações em dinheiro" ON public.doacoes_dinheiro
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem gerenciar doações de itens" ON public.doacoes_itens
  FOR ALL USING (auth.role() = 'authenticated');

-- PASSO 8: Criar triggers
CREATE TRIGGER update_doacoes_dinheiro_updated_at 
  BEFORE UPDATE ON public.doacoes_dinheiro 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doacoes_itens_updated_at 
  BEFORE UPDATE ON public.doacoes_itens 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- PASSO 9: Adicionar comentários
COMMENT ON TABLE public.doacoes_dinheiro IS 'Registro de doações em dinheiro recebidas pela instituição';
COMMENT ON TABLE public.doacoes_itens IS 'Registro de doações de itens recebidas pela instituição';

-- PASSO 10: Inserir dados de exemplo
INSERT INTO public.doacoes_dinheiro (doador_nome, doador_email, doador_telefone, valor, forma_pagamento, observacoes, created_by)
VALUES 
  ('João Silva', 'joao@email.com', '(11) 99999-9999', 100.00, 'pix', 'Doação mensal', '00000000-0000-0000-0000-000000000000'),
  ('Maria Santos', 'maria@email.com', '(11) 88888-8888', 250.00, 'transferencia', 'Doação para alimentação', '00000000-0000-0000-0000-000000000000'),
  ('Pedro Costa', 'pedro@email.com', '(11) 77777-7777', 50.00, 'dinheiro', 'Doação espontânea', '00000000-0000-0000-0000-000000000000');

INSERT INTO public.doacoes_itens (doador_nome, doador_email, doador_telefone, item_descricao, quantidade, categoria, condicao, observacoes, created_by)
VALUES 
  ('Ana Oliveira', 'ana@email.com', '(11) 66666-6666', 'Roupas infantis variadas', 20, 'roupas', 'usado_bom', 'Roupas de 2 a 8 anos', '00000000-0000-0000-0000-000000000000'),
  ('Carlos Ferreira', 'carlos@email.com', '(11) 55555-5555', 'Cestas básicas', 5, 'alimentos', 'novo', 'Cestas completas', '00000000-0000-0000-0000-000000000000'),
  ('Lucia Mendes', 'lucia@email.com', '(11) 44444-4444', 'Brinquedos educativos', 10, 'brinquedos', 'usado_bom', 'Brinquedos pedagógicos', '00000000-0000-0000-0000-000000000000');

-- Verificar se tudo foi criado corretamente
SELECT 'Tabelas criadas com sucesso!' as resultado;
SELECT table_name, column_name FROM information_schema.columns 
WHERE table_name IN ('doacoes_dinheiro', 'doacoes_itens') 
AND column_name = 'status'
ORDER BY table_name;