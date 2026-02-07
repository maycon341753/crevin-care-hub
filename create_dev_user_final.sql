-- SCRIPT FINAL PARA CRIAR USUÁRIO DESENVOLVEDOR
-- Execute APÓS executar o script fix_all_supabase_issues.sql
-- Execute este script no SQL Editor do Supabase Dashboard

-- ========================================
-- IMPORTANTE: PRIMEIRO CRIAR O USUÁRIO NO DASHBOARD
-- ========================================
-- 1. Vá para: Authentication > Users no Dashboard do Supabase
-- 2. Clique em "Add user"
-- 3. Email: desenvolvedor@crevin.com.br
-- 4. Password: Dev@2025
-- 5. Clique em "Create user"
-- 6. DEPOIS execute este script

-- ========================================
-- CRIAR PERFIL DO DESENVOLVEDOR
-- ========================================

-- Verificar se o usuário foi criado no auth
SELECT 
    '👤 VERIFICANDO USUÁRIO AUTH' as info,
    id,
    email,
    created_at,
    email_confirmed_at
FROM auth.users 
WHERE email = 'desenvolvedor@crevin.com.br';

-- Inserir ou atualizar perfil do desenvolvedor
DO $$
DECLARE
    user_uuid UUID;
BEGIN
    -- Buscar o UUID do usuário
    SELECT id INTO user_uuid 
    FROM auth.users 
    WHERE email = 'desenvolvedor@crevin.com.br';
    
    IF user_uuid IS NOT NULL THEN
        -- Inserir perfil do desenvolvedor
        INSERT INTO public.profiles (
            user_id, 
            email, 
            full_name, 
            role,
            created_at,
            updated_at
        ) VALUES (
            user_uuid,
            'desenvolvedor@crevin.com.br',
            'Desenvolvedor CREVIN',
            'developer',
            NOW(),
            NOW()
        )
        ON CONFLICT (user_id) DO UPDATE SET
            email = 'desenvolvedor@crevin.com.br',
            full_name = 'Desenvolvedor CREVIN',
            role = 'developer',
            updated_at = NOW();
            
        RAISE NOTICE '✅ Perfil do desenvolvedor criado/atualizado com sucesso!';
        
        -- Inserir também na tabela users se existir
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
            INSERT INTO public.users (
                id,
                email,
                name,
                role,
                created_at
            ) VALUES (
                user_uuid,
                'desenvolvedor@crevin.com.br',
                'Desenvolvedor CREVIN',
                'developer',
                NOW()
            )
            ON CONFLICT (id) DO UPDATE SET
                email = 'desenvolvedor@crevin.com.br',
                name = 'Desenvolvedor CREVIN',
                role = 'developer';
                
            RAISE NOTICE '✅ Usuário também inserido na tabela users!';
        END IF;
        
    ELSE
        RAISE NOTICE '❌ USUÁRIO NÃO ENCONTRADO! Crie primeiro no Dashboard: Authentication > Users';
        RAISE NOTICE '📧 Email: desenvolvedor@crevin.com.br';
        RAISE NOTICE '🔑 Password: Dev@2025';
    END IF;
END
$$;

-- ========================================
-- VERIFICAR RESULTADO FINAL
-- ========================================

-- Verificar se o perfil foi criado corretamente
SELECT 
    '🎯 RESULTADO FINAL' as info,
    u.id as user_id,
    u.email as auth_email,
    u.created_at as auth_created,
    p.email as profile_email,
    p.full_name,
    p.role,
    p.created_at as profile_created
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE u.email = 'desenvolvedor@crevin.com.br';

-- Verificar se existe na tabela users também
SELECT 
    '👥 USUÁRIO NA TABELA USERS' as info,
    id,
    email,
    name,
    role,
    created_at
FROM public.users
WHERE email = 'desenvolvedor@crevin.com.br';

-- ========================================
-- MENSAGEM FINAL
-- ========================================

SELECT 
    '🚀 USUÁRIO DESENVOLVEDOR' as status,
    'Criado com sucesso!' as resultado,
    'Email: desenvolvedor@crevin.com.br' as login,
    'Password: Dev@2025' as senha,
    'Agora você pode fazer login na aplicação!' as proximo_passo;