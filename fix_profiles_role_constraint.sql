-- Script para corrigir a constraint de role na tabela profiles
-- O problema é que a constraint atual não permite 'admin'

-- 1. Remover a constraint existente
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 2. Adicionar nova constraint com todos os valores necessários
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('user', 'admin', 'developer'));

-- 3. Verificar se a constraint foi aplicada corretamente
DO $$
BEGIN
    -- Testar inserção com role 'admin'
    INSERT INTO public.profiles (
        id, 
        user_id, 
        full_name, 
        role, 
        email
    ) VALUES (
        gen_random_uuid(),
        gen_random_uuid(),
        'Teste Admin',
        'admin',
        'teste-admin@exemplo.com'
    );
    
    -- Se chegou até aqui, a constraint está funcionando
    RAISE NOTICE '✅ Constraint corrigida com sucesso! Role "admin" agora é aceito.';
    
    -- Remover o registro de teste
    DELETE FROM public.profiles WHERE email = 'teste-admin@exemplo.com';
    
EXCEPTION WHEN check_violation THEN
    RAISE NOTICE '❌ Ainda há problema com a constraint de role';
    RAISE NOTICE 'Erro: %', SQLERRM;
END
$$;