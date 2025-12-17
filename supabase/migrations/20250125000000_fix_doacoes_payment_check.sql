-- Atualiza as restrições da tabela doacoes_dinheiro para permitir novos métodos de pagamento
-- Especialmente 'pix_eletronico' e 'PIX Eletrônico'

DO $$
BEGIN
    -- Verifica se a tabela existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'doacoes_dinheiro') THEN
        
        -- Se a coluna forma_pagamento existir
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'doacoes_dinheiro' AND column_name = 'forma_pagamento') THEN
            -- Remove a constraint antiga se existir (tentando nomes comuns)
            ALTER TABLE public.doacoes_dinheiro DROP CONSTRAINT IF EXISTS doacoes_dinheiro_forma_pagamento_check;
            ALTER TABLE public.doacoes_dinheiro DROP CONSTRAINT IF EXISTS doacoes_dinheiro_tipo_pagamento_check;
            
            -- Adiciona a nova constraint mais permissiva
            ALTER TABLE public.doacoes_dinheiro ADD CONSTRAINT doacoes_dinheiro_forma_pagamento_check 
            CHECK (forma_pagamento IN (
                'PIX', 'Cartão', 'Dinheiro', 'Transferência', 'Cheque', 'Boleto',
                'pix', 'cartao', 'dinheiro', 'transferencia', 'cheque', 'boleto',
                'pix_eletronico', 'PIX Eletrônico'
            ));
        END IF;

        -- Se a coluna tipo_pagamento existir (caso o banco esteja usando o schema antigo)
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'doacoes_dinheiro' AND column_name = 'tipo_pagamento') THEN
            ALTER TABLE public.doacoes_dinheiro DROP CONSTRAINT IF EXISTS doacoes_dinheiro_tipo_pagamento_check;
            
            ALTER TABLE public.doacoes_dinheiro ADD CONSTRAINT doacoes_dinheiro_tipo_pagamento_check 
            CHECK (tipo_pagamento IN (
                'PIX', 'Cartão', 'Dinheiro', 'Transferência', 'Cheque', 'Boleto',
                'pix', 'cartao', 'dinheiro', 'transferencia', 'cheque', 'boleto',
                'pix_eletronico', 'PIX Eletrônico'
            ));
        END IF;
        
    END IF;
END $$;
