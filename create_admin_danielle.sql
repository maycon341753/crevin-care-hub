-- SCRIPT PARA CRIAR USUÁRIO ADMINISTRATIVO - DANIELLE DA SILVA MOURA
-- Execute este script no SQL Editor do Supabase Dashboard

-- ========================================
-- IMPORTANTE: PRIMEIRO CRIAR O USUÁRIO NO DASHBOARD
-- ========================================
-- 1. Vá para: Authentication > Users no Dashboard do Supabase
-- 2. Clique em "Add user"
-- 3. Email: daniellemoura16@gmail.com
-- 4. Password: Admin@2025 (ou defina uma senha segura)
-- 5. Clique em "Create user"
-- 6. DEPOIS execute este script

-- ========================================
-- CRIAR PERFIL DO ADMINISTRADOR
-- ========================================

-- Verificar se o usuário foi criado no auth
SELECT 
    '👤 VERIFICANDO USUÁRIO AUTH' as info,
    id,
    email,
    created_at,
    email_confirmed_at
FROM auth.users 
WHERE email = 'daniellemoura16@gmail.com';

-- Inserir ou atualizar perfil do administrador
DO $$
DECLARE
    user_uuid UUID;
BEGIN
    -- Buscar o UUID do usuário
    SELECT id INTO user_uuid 
    FROM auth.users 
    WHERE email = 'daniellemoura16@gmail.com';
    
    IF user_uuid IS NOT NULL THEN
        -- Inserir perfil do administrador
        INSERT INTO public.profiles (
            user_id, 
            email, 
            full_name, 
            role,
            created_at,
            updated_at
        ) VALUES (
            user_uuid,
            'daniellemoura16@gmail.com',
            'Danielle da Silva Moura',
            'admin',
            NOW(),
            NOW()
        )
        ON CONFLICT (user_id) DO UPDATE SET
            email = 'daniellemoura16@gmail.com',
            full_name = 'Danielle da Silva Moura',
            role = 'admin',
            updated_at = NOW();
        
        RAISE NOTICE '✅ Perfil do administrador criado/atualizado com sucesso!';
        RAISE NOTICE 'Email: daniellemoura16@gmail.com';
        RAISE NOTICE 'Nome: Danielle da Silva Moura';
        RAISE NOTICE 'Role: admin';
    ELSE
        RAISE NOTICE '❌ ERRO: Usuário não encontrado no auth.users!';
        RAISE NOTICE 'Certifique-se de criar o usuário no Dashboard primeiro.';
    END IF;
END
$$;

-- ========================================
-- INSERIR NA TABELA USERS (SE EXISTIR)
-- ========================================

-- Verificar se a tabela users existe e inserir dados complementares
DO $$
DECLARE
    user_uuid UUID;
BEGIN
    -- Verificar se a tabela users existe
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        -- Buscar o UUID do usuário
        SELECT id INTO user_uuid 
        FROM auth.users 
        WHERE email = 'daniellemoura16@gmail.com';
        
        IF user_uuid IS NOT NULL THEN
            -- Inserir na tabela users
            INSERT INTO public.users (
                auth_user_id,
                email,
                email_verified,
                status,
                created_at,
                updated_at
            ) VALUES (
                user_uuid,
                'daniellemoura16@gmail.com',
                true,
                'active',
                NOW(),
                NOW()
            )
            ON CONFLICT (email) DO UPDATE SET
                auth_user_id = user_uuid,
                email_verified = true,
                status = 'active',
                updated_at = NOW();
            
            RAISE NOTICE '✅ Dados inseridos na tabela users!';
        END IF;
    ELSE
        RAISE NOTICE 'ℹ️ Tabela users não existe, pulando esta etapa.';
    END IF;
END
$$;

-- ========================================
-- ADICIONAR CPF SE HOUVER TABELA ESPECÍFICA
-- ========================================

-- Verificar se existe tabela para armazenar CPF (funcionários, profiles estendidos, etc.)
DO $$
BEGIN
    -- Se existir uma tabela funcionarios, inserir dados lá também
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'funcionarios') THEN
        -- Verificar se a coluna cpf existe na tabela funcionarios
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'funcionarios' AND column_name = 'cpf') THEN
            INSERT INTO public.funcionarios (
                nome,
                email,
                cpf,
                cargo,
                status,
                created_at,
                updated_at
            ) VALUES (
                'Danielle da Silva Moura',
                'daniellemoura16@gmail.com',
                '05437633157',
                'Administrador',
                'ativo',
                NOW(),
                NOW()
            )
            ON CONFLICT (email) DO UPDATE SET
                nome = 'Danielle da Silva Moura',
                cpf = '05437633157',
                cargo = 'Administrador',
                status = 'ativo',
                updated_at = NOW();
            
            RAISE NOTICE '✅ Dados inseridos na tabela funcionarios com CPF!';
        ELSE
            RAISE NOTICE 'ℹ️ Tabela funcionarios existe mas não tem coluna CPF.';
        END IF;
    ELSE
        RAISE NOTICE 'ℹ️ Tabela funcionarios não existe.';
        RAISE NOTICE 'CPF: 05437633157 (armazenar manualmente se necessário)';
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
WHERE u.email = 'daniellemoura16@gmail.com';

-- Verificar se existe na tabela users também
SELECT 
    '👥 USUÁRIO NA TABELA USERS' as info,
    id,
    email,
    status,
    created_at
FROM public.users
WHERE email = 'daniellemoura16@gmail.com';

-- Verificar se existe na tabela funcionarios
SELECT 
    '👨‍💼 FUNCIONÁRIO' as info,
    nome,
    email,
    cpf,
    cargo,
    status,
    created_at
FROM public.funcionarios
WHERE email = 'daniellemoura16@gmail.com';

-- ========================================
-- MENSAGEM FINAL
-- ========================================

SELECT 
    '🚀 USUÁRIO ADMINISTRATIVO' as status,
    'Danielle da Silva Moura' as nome,
    'daniellemoura16@gmail.com' as email,
    '05437633157' as cpf,
    'admin' as role,
    'Criado com sucesso!' as resultado,
    'Agora pode fazer login na aplicação!' as proximo_passo;