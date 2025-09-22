import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  user_id: string;
  email?: string;
  full_name: string;
  role: 'user' | 'admin' | 'developer';
  status?: 'active' | 'pending' | 'inactive';
  active?: boolean;
  created_at: string;
  updated_at: string;
}

export function useCurrentUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserProfile() {
      console.log('🔍 useCurrentUserProfile - Iniciando busca do perfil');
      console.log('👤 Usuário atual:', user);
      
      if (!user?.id) {
        console.log('❌ Nenhum usuário logado');
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log('🔄 Buscando perfil para user_id:', user.id);

        const { data, error: profileError } = await supabase
          .from('profiles')
          .select(`
            id,
            user_id,
            email,
            full_name,
            role,
            status,
            active,
            created_at,
            updated_at
          `)
          .eq('user_id', user.id)
          .single();

        console.log('📊 Resultado da busca:', { data, profileError });

        if (profileError) {
          console.error('❌ Erro ao buscar perfil do usuário:', profileError);
          setError(profileError.message);
          setProfile(null);
        } else {
          console.log('✅ Perfil encontrado:', data);
          setProfile(data);
        }
      } catch (err) {
        console.error('❌ Erro inesperado ao buscar perfil:', err);
        setError('Erro inesperado ao carregar perfil do usuário');
        setProfile(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUserProfile();
  }, [user?.id]);

  const isDeveloper = profile?.role === 'developer';
  const isAdmin = profile?.role === 'admin';
  const isUser = profile?.role === 'user';

  console.log('🎯 useCurrentUserProfile - Estado final:', {
    profile,
    loading,
    error,
    isDeveloper,
    isAdmin,
    isUser
  });

  return {
    profile,
    loading,
    error,
    isDeveloper,
    isAdmin,
    isUser,
  };
}