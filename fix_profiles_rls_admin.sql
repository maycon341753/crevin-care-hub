-- Corrigir política RLS para permitir que administradores editem perfis de outros usuários
-- Problema: A política atual só permite que usuários editem seus próprios perfis
-- Solução: Permitir que admins e developers editem qualquer perfil

-- Remover política de UPDATE existente
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;

-- Criar nova política de UPDATE que permite:
-- 1. Usuários editarem seus próprios perfis
-- 2. Administradores editarem qualquer perfil
-- 3. Desenvolvedores editarem qualquer perfil
CREATE POLICY "profiles_update_policy" ON public.profiles
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (
      -- Usuário pode editar seu próprio perfil
      user_id = auth.uid() 
      OR 
      -- Administradores podem editar qualquer perfil
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'developer')
      )
    )
  );

-- Verificar se a política foi criada corretamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles' AND policyname = 'profiles_update_policy';