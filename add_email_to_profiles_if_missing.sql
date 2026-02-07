-- Adicionar coluna email à tabela profiles se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'email' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN email VARCHAR(255);
        
        -- Criar índice único para email se a coluna foi criada
        CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_unique 
        ON public.profiles(email) 
        WHERE email IS NOT NULL;
        
        RAISE NOTICE 'Coluna email adicionada à tabela profiles';
    ELSE
        RAISE NOTICE 'Coluna email já existe na tabela profiles';
    END IF;
END $$;