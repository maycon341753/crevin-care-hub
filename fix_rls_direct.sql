-- EXECUTE ESTE SQL NO SUPABASE SQL EDITOR
-- Problema: Administradores não conseguem editar perfis de outros usuários
-- Solução: Atualizar política RLS para permitir que admins editem qualquer perfil

-- 1. Remover política existente
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;

-- 2. Criar nova política que permite:
--    - Usuários editarem seus próprios perfis
--    - Administradores e desenvolvedores editarem qualquer perfil
CREATE POLICY "profiles_update_policy" ON public.profiles
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (
      -- Usuário pode editar seu próprio perfil
      user_id = auth.uid() 
      OR 
      -- Administradores e desenvolvedores podem editar qualquer perfil
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'developer')
      )
    )
  );

-- 3. Verificar se a política foi criada
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename = 'profiles' 
AND policyname = 'profiles_update_policy';