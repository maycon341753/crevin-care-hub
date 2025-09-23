-- Criar tabela notas_fiscais
CREATE TABLE IF NOT EXISTS public.notas_fiscais (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    numero VARCHAR(50) NOT NULL,
    serie VARCHAR(10),
    fornecedor_id UUID NOT NULL REFERENCES public.fornecedores(id) ON DELETE CASCADE,
    data_emissao DATE NOT NULL,
    data_vencimento DATE,
    valor_total DECIMAL(15,2) NOT NULL CHECK (valor_total >= 0),
    valor_desconto DECIMAL(15,2) DEFAULT 0 CHECK (valor_desconto >= 0),
    valor_liquido DECIMAL(15,2) GENERATED ALWAYS AS (valor_total - COALESCE(valor_desconto, 0)) STORED,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('entrada', 'saida')),
    status VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'paga', 'vencida', 'cancelada')),
    observacoes TEXT,
    arquivo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_fornecedor_id ON public.notas_fiscais(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_numero ON public.notas_fiscais(numero);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_data_emissao ON public.notas_fiscais(data_emissao);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_data_vencimento ON public.notas_fiscais(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_status ON public.notas_fiscais(status);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_tipo ON public.notas_fiscais(tipo);
CREATE UNIQUE INDEX IF NOT EXISTS idx_notas_fiscais_numero_serie_fornecedor ON public.notas_fiscais(numero, COALESCE(serie, ''), fornecedor_id);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_notas_fiscais_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Remover trigger se existir e criar novamente
DROP TRIGGER IF EXISTS update_notas_fiscais_updated_at ON public.notas_fiscais;
CREATE TRIGGER update_notas_fiscais_updated_at
    BEFORE UPDATE ON public.notas_fiscais
    FOR EACH ROW
    EXECUTE FUNCTION update_notas_fiscais_updated_at();

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.notas_fiscais ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas as operações para usuários autenticados
CREATE POLICY "Permitir todas as operações para usuários autenticados" ON public.notas_fiscais
    FOR ALL USING (auth.role() = 'authenticated');

-- Política para permitir leitura para usuários anônimos (se necessário)
CREATE POLICY "Permitir leitura para usuários anônimos" ON public.notas_fiscais
    FOR SELECT USING (true);

-- Inserir dados de exemplo (opcional)
INSERT INTO public.notas_fiscais (
    numero, 
    serie, 
    fornecedor_id, 
    data_emissao, 
    data_vencimento, 
    valor_total, 
    valor_desconto, 
    tipo, 
    status, 
    observacoes
) VALUES 
(
    '000001', 
    '1', 
    (SELECT id FROM public.fornecedores LIMIT 1), 
    CURRENT_DATE - INTERVAL '30 days', 
    CURRENT_DATE - INTERVAL '15 days', 
    1500.00, 
    50.00, 
    'entrada', 
    'paga', 
    'Nota fiscal de exemplo - Material de escritório'
),
(
    '000002', 
    '1', 
    (SELECT id FROM public.fornecedores LIMIT 1), 
    CURRENT_DATE - INTERVAL '15 days', 
    CURRENT_DATE + INTERVAL '15 days', 
    2800.00, 
    0.00, 
    'entrada', 
    'pendente', 
    'Nota fiscal de exemplo - Equipamentos de informática'
),
(
    '000003', 
    '2', 
    (SELECT id FROM public.fornecedores OFFSET 1 LIMIT 1), 
    CURRENT_DATE - INTERVAL '45 days', 
    CURRENT_DATE - INTERVAL '30 days', 
    950.00, 
    25.00, 
    'entrada', 
    'vencida', 
    'Nota fiscal de exemplo - Serviços de manutenção'
)
ON CONFLICT DO NOTHING;

-- Comentários na tabela e colunas
COMMENT ON TABLE public.notas_fiscais IS 'Tabela para armazenar informações das notas fiscais dos fornecedores';
COMMENT ON COLUMN public.notas_fiscais.id IS 'Identificador único da nota fiscal';
COMMENT ON COLUMN public.notas_fiscais.numero IS 'Número da nota fiscal';
COMMENT ON COLUMN public.notas_fiscais.serie IS 'Série da nota fiscal';
COMMENT ON COLUMN public.notas_fiscais.fornecedor_id IS 'Referência ao fornecedor da nota fiscal';
COMMENT ON COLUMN public.notas_fiscais.data_emissao IS 'Data de emissão da nota fiscal';
COMMENT ON COLUMN public.notas_fiscais.data_vencimento IS 'Data de vencimento da nota fiscal';
COMMENT ON COLUMN public.notas_fiscais.valor_total IS 'Valor total da nota fiscal';
COMMENT ON COLUMN public.notas_fiscais.valor_desconto IS 'Valor do desconto aplicado';
COMMENT ON COLUMN public.notas_fiscais.valor_liquido IS 'Valor líquido (total - desconto) - calculado automaticamente';
COMMENT ON COLUMN public.notas_fiscais.tipo IS 'Tipo da nota fiscal: entrada ou saída';
COMMENT ON COLUMN public.notas_fiscais.status IS 'Status da nota fiscal: pendente, paga, vencida ou cancelada';
COMMENT ON COLUMN public.notas_fiscais.observacoes IS 'Observações sobre a nota fiscal';
COMMENT ON COLUMN public.notas_fiscais.arquivo_url IS 'URL do arquivo da nota fiscal (PDF, imagem, etc.)';
COMMENT ON COLUMN public.notas_fiscais.created_at IS 'Data e hora de criação do registro';
COMMENT ON COLUMN public.notas_fiscais.updated_at IS 'Data e hora da última atualização do registro';