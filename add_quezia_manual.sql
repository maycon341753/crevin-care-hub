-- Script SQL para adicionar a usuária Quezia manualmente no Supabase
-- Execute este script diretamente no SQL Editor do painel do Supabase

-- 1. Inserir usuário na tabela auth.users
-- IMPORTANTE: Este comando deve ser executado com privilégios de administrador
-- Você pode executar isso no SQL Editor do Supabase Dashboard

-- Primeiro, verificar se o usuário já existe e deletá-lo se necessário
DELETE FROM auth.identities WHERE user_id = '8264fea5-ef75-4b84-b6e7-92a7476fc0b4';
DELETE FROM auth.users WHERE id = '8264fea5-ef75-4b84-b6e7-92a7476fc0b4' OR email = 'borges.quezia@yahoo.com.br';

INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token,
    aud,
    role,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    last_sign_in_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at,
    is_sso_user,
    deleted_at
) VALUES (
    '8264fea5-ef75-4b84-b6e7-92a7476fc0b4'::uuid,  -- ID específico para manter consistência
    '00000000-0000-0000-0000-000000000000'::uuid,   -- instance_id padrão
    'borges.quezia@yahoo.com.br',                    -- email
    crypt('Brasilia@2026', gen_salt('bf')),          -- senha criptografada
    NOW(),                                           -- email confirmado agora
    NOW(),                                           -- created_at
    NOW(),                                           -- updated_at
    '',                                              -- confirmation_token vazio
    '',                                              -- email_change vazio
    '',                                              -- email_change_token_new vazio
    '',                                              -- recovery_token vazio
    'authenticated',                                 -- aud
    'authenticated',                                 -- role
    '{"provider": "email", "providers": ["email"]}', -- raw_app_meta_data
    '{"name": "Quezia Borges Machado", "role": "admin"}', -- raw_user_meta_data
    false,                                           -- is_super_admin
    NULL,                                            -- last_sign_in_at
    NULL,                                            -- phone
    NULL,                                            -- phone_confirmed_at
    '',                                              -- phone_change
    '',                                              -- phone_change_token
    '',                                              -- email_change_token_current
    0,                                               -- email_change_confirm_status
    NULL,                                            -- banned_until
    '',                                              -- reauthentication_token
    NULL,                                            -- reauthentication_sent_at
    false,                                           -- is_sso_user
    NULL                                             -- deleted_at
);

-- 2. Inserir identidade na tabela auth.identities (necessário para login por email)
INSERT INTO auth.identities (
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
) VALUES (
    '8264fea5-ef75-4b84-b6e7-92a7476fc0b4',         -- provider_id (obrigatório)
    '8264fea5-ef75-4b84-b6e7-92a7476fc0b4'::uuid,  -- user_id
    '{"sub": "8264fea5-ef75-4b84-b6e7-92a7476fc0b4", "email": "borges.quezia@yahoo.com.br"}', -- identity_data
    'email',                                         -- provider
    NULL,                                            -- last_sign_in_at
    NOW(),                                           -- created_at
    NOW()                                            -- updated_at
);

-- 3. Verificar se o usuário foi criado corretamente
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    raw_user_meta_data
FROM auth.users 
WHERE email = 'borges.quezia@yahoo.com.br';

-- 4. Verificar se a identidade foi criada
SELECT 
    provider_id,
    user_id,
    provider,
    identity_data
FROM auth.identities 
WHERE user_id = '8264fea5-ef75-4b84-b6e7-92a7476fc0b4';

-- 5. Verificar se os dados nas tabelas públicas estão consistentes
SELECT 
    'users' as tabela,
    id,
    email,
    name,
    role,
    active
FROM public.users 
WHERE email = 'borges.quezia@yahoo.com.br'

UNION ALL

SELECT 
    'profiles' as tabela,
    user_id as id,
    email,
    full_name as name,
    role,
    active
FROM public.profiles 
WHERE email = 'borges.quezia@yahoo.com.br';

-- INSTRUÇÕES DE USO:
-- 1. Acesse o painel do Supabase: https://supabase.com/dashboard
-- 2. Selecione seu projeto
-- 3. Vá para "SQL Editor"
-- 4. Cole e execute este script
-- 5. Verifique se as consultas de verificação retornam os dados esperados
-- 6. Teste o login no sistema com: borges.quezia@yahoo.com.br / Brasilia@2026