-- SCRIPT PARA LIMPAR USUÁRIO FANTASMA
-- Execute ANTES do script emergency_fix_database.sql
-- Este script remove o usuário "fantasma" que está causando conflitos

-- ========================================
-- LIMPEZA DO USUÁRIO FANTASMA
-- ========================================

-- 1. Verificar usuário existente na tabela users
SELECT 
    '🔍 VERIFICANDO USUÁRIO FANTASMA' as info,
    id,
    email,
    name,
    role,
    created_at
FROM public.users
WHERE email = 'desenvolvedor@crevin.com.br';

-- 2. Remover usuário fantasma da tabela users
DELETE FROM public.users 
WHERE email = 'desenvolvedor@crevin.com.br';

-- 3. Verificar se foi removido
SELECT 
    '✅ VERIFICAÇÃO PÓS-LIMPEZA' as info,
    COUNT(*) as usuarios_restantes
FROM public.users
WHERE email = 'desenvolvedor@crevin.com.br';

-- 4. Limpar também possíveis registros na tabela profiles
DELETE FROM public.profiles 
WHERE email = 'desenvolvedor@crevin.com.br';

-- 5. Verificar limpeza completa
SELECT 
    '🧹 LIMPEZA COMPLETA' as status,
    'Usuário fantasma removido!' as resultado,
    'Agora execute o emergency_fix_database.sql' as proximo_passo;

-- ========================================
-- INSTRUÇÕES APÓS ESTE SCRIPT
-- ========================================
-- 1. Execute o script emergency_fix_database.sql
-- 2. Depois crie o usuário no Dashboard: Authentication > Users
-- 3. Por último execute o create_dev_user_final.sql