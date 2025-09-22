import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Administrador {
  id: string;
  user_id: string;
  full_name: string;
  email?: string;
  role: 'admin' | 'developer';
  active?: boolean;
}

export function useAdministradores() {
  const [administradores, setAdministradores] = useState<Administrador[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAdministradores = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar usuários com role admin ou developer que estejam ativos
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          full_name,
          email,
          role,
          active
        `)
        .in('role', ['admin', 'developer'])
        .eq('active', true)
        .order('full_name');

      if (error) {
        throw error;
      }

      setAdministradores(data || []);
    } catch (err) {
      console.error('Erro ao buscar administradores:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdministradores();
  }, []);

  return {
    administradores,
    loading,
    error,
    refetch: fetchAdministradores
  };
}