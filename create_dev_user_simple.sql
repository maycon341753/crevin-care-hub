-- Script SIMPLIFICADO para criar usuário desenvolvedor
-- Execute este script no SQL Editor do Supabase Dashboard

-- MÉTODO RECOMENDADO: Usar o Dashboard do Supabase
-- 1. Vá para: Authentication > Users
-- 2. Clique em "Add user"
-- 3. Email: desenvolvedor@crevin.com.br
-- 4. Password: Dev@2025
-- 5. Clique em "Create user"

-- APÓS criar o usuário no Dashboard, execute este comando:
-- Primeiro, verificar se a tabela profiles existe
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        -- Atualizar ou inserir perfil do desenvolvedor
        -- Primeiro, vamos verificar se a tabela profiles existe, senão usar user_profiles
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
            -- Verificar se a coluna email existe antes de usá-la
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'email' AND table_schema = 'public') THEN
                INSERT INTO public.profiles (user_id, email, full_name, role)
                SELECT 
                    u.id,
                    'desenvolvedor@crevin.com.br',
                    'Desenvolvedor CREVIN',
                    'developer'
                FROM auth.users u
                WHERE u.email = 'desenvolvedor@crevin.com.br'
                ON CONFLICT (user_id) DO UPDATE SET
                    role = 'developer',
                    full_name = 'Desenvolvedor CREVIN',
                    updated_at = NOW();
            ELSE
                -- Inserir sem a coluna email se ela não existir
                INSERT INTO public.profiles (user_id, full_name, role)
                SELECT 
                    u.id,
                    'Desenvolvedor CREVIN',
                    'developer'
                FROM auth.users u
                WHERE u.email = 'desenvolvedor@crevin.com.br'
                ON CONFLICT (user_id) DO UPDATE SET
                    role = 'developer',
                    full_name = 'Desenvolvedor CREVIN';
            END IF;
        -- Senão, usar a tabela user_profiles
        ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles' AND table_schema = 'public') THEN
            INSERT INTO public.user_profiles (user_id, first_name, last_name, display_name)
            SELECT 
                u.id,
                'Desenvolvedor',
                'CREVIN',
                'Desenvolvedor CREVIN'
            FROM auth.users u
            WHERE u.email = 'desenvolvedor@crevin.com.br'
            ON CONFLICT (user_id) DO UPDATE SET
                first_name = 'Desenvolvedor',
                last_name = 'CREVIN',
                display_name = 'Desenvolvedor CREVIN';
        END IF;
            
        RAISE NOTICE 'Perfil do desenvolvedor atualizado com sucesso!';
    ELSE
        RAISE NOTICE 'Tabela profiles não existe. Execute create_tables_simple.sql primeiro.';
    END IF;
END
$$;

-- Verificar se o usuário foi criado corretamente
SELECT 
    u.id,
    u.email,
    u.created_at,
    u.email_confirmed_at,
    p.role,
    p.full_name
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE u.email = 'desenvolvedor@crevin.com.br';

-- Se não aparecer resultado, o usuário não foi criado
-- Neste caso, use o método do Dashboard conforme instruções acima