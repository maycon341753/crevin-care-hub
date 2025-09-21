-- Script para criar usuário desenvolvedor manualmente
-- Execute este script APÓS executar fix_rls_recursion.sql e create_tables_simple.sql

-- 1. Inserir usuário desenvolvedor diretamente no auth.users
-- ATENÇÃO: Este método só funciona se você tiver acesso de administrador ao banco

-- Primeiro, vamos verificar se o usuário já existe
DO $$
DECLARE
    user_exists BOOLEAN;
    new_user_id UUID;
BEGIN
    -- Verificar se o usuário já existe
    SELECT EXISTS(
        SELECT 1 FROM auth.users 
        WHERE email = 'desenvolvedor@crevin.com.br'
    ) INTO user_exists;
    
    IF NOT user_exists THEN
        -- Gerar um UUID para o novo usuário
        new_user_id := gen_random_uuid();
        
        -- Inserir o usuário no auth.users
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            invited_at,
            confirmation_token,
            confirmation_sent_at,
            recovery_token,
            recovery_sent_at,
            email_change_token_new,
            email_change,
            email_change_sent_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            created_at,
            updated_at,
            phone,
            phone_confirmed_at,
            phone_change,
            phone_change_token,
            phone_change_sent_at,
            email_change_token_current,
            email_change_confirm_status,
            banned_until,
            reauthentication_token,
            reauthentication_sent_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            'desenvolvedor@crevin.com.br',
            crypt('Dev@2025', gen_salt('bf')), -- Hash da senha
            NOW(),
            NULL,
            '',
            NULL,
            '',
            NULL,
            '',
            '',
            NULL,
            NULL,
            '{"provider": "email", "providers": ["email"]}',
            '{"full_name": "Desenvolvedor CREVIN"}',
            false,
            NOW(),
            NOW(),
            NULL,
            NULL,
            '',
            '',
            NULL,
            '',
            0,
            NULL,
            '',
            NULL
        );
        
        -- Inserir o perfil correspondente
        INSERT INTO public.profiles (
            user_id,
            email,
            full_name,
            role,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            'desenvolvedor@crevin.com.br',
            'Desenvolvedor CREVIN',
            'developer',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Usuário desenvolvedor criado com sucesso! ID: %', new_user_id;
    ELSE
        RAISE NOTICE 'Usuário desenvolvedor já existe!';
    END IF;
END
$$;

-- 2. Verificar se o usuário foi criado corretamente
SELECT 
    u.id,
    u.email,
    u.created_at,
    p.role,
    p.full_name
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE u.email = 'desenvolvedor@crevin.com.br';

-- 3. Se o método acima não funcionar, use este método alternativo:
-- Vá para o Supabase Dashboard > Authentication > Users
-- Clique em "Add user"
-- Email: desenvolvedor@crevin.com.br
-- Password: Dev@2025
-- Confirm password: Dev@2025
-- Clique em "Create user"

-- 4. Após criar o usuário no dashboard, execute este comando para definir o role:
-- UPDATE public.profiles 
-- SET role = 'developer' 
-- WHERE email = 'desenvolvedor@crevin.com.br';

-- COMMENT ON FUNCTION gen_random_uuid() IS 'Função para gerar UUID aleatório';