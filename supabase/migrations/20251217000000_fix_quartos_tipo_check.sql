-- Cria tabela quartos se não existir
CREATE TABLE IF NOT EXISTS public.quartos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero TEXT NOT NULL,
    tipo TEXT NOT NULL,
    capacidade INTEGER NOT NULL DEFAULT 1,
    ala TEXT NOT NULL,
    andar INTEGER DEFAULT 1,
    descricao TEXT,
    observacoes TEXT,
    valor_mensal NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adiciona constraint de unicidade para o número do quarto se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quartos_numero_key') THEN
        ALTER TABLE public.quartos ADD CONSTRAINT quartos_numero_key UNIQUE (numero);
    END IF;
END $$;

-- Atualiza a constraint de tipo para incluir todos os valores usados no frontend
DO $$
BEGIN
    -- Remove a constraint antiga se existir
    ALTER TABLE public.quartos DROP CONSTRAINT IF EXISTS quartos_tipo_check;
    
    -- Adiciona a nova constraint atualizada
    ALTER TABLE public.quartos ADD CONSTRAINT quartos_tipo_check 
    CHECK (tipo IN ('individual', 'duplo', 'coletivo', 'quarto'));
END $$;

-- Habilita RLS
ALTER TABLE public.quartos ENABLE ROW LEVEL SECURITY;

-- Política de acesso (exemplo simples: permite tudo para autenticados)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quartos' AND policyname = 'Permitir acesso total a usuários autenticados') THEN
        CREATE POLICY "Permitir acesso total a usuários autenticados" ON public.quartos
            FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;
