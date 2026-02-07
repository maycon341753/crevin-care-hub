const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configurações do Supabase
const SUPABASE_URL = 'https://lhgujxyfxyxzozgokutf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_nqv19CzV1kkQVpjIijE28w_YJtKOEBA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fixRLS() {
  try {
    console.log('🔧 Corrigindo política RLS para profiles...');
    
    // Executar SQL diretamente
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro de conexão:', error);
      return;
    }
    
    console.log('✅ Conexão com Supabase OK');
    
    // Executar correção RLS via SQL direto
    const sqlCommands = [
      `DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;`,
      `CREATE POLICY "profiles_update_policy" ON public.profiles
        FOR UPDATE USING (
          auth.uid() IS NOT NULL AND (
            user_id = auth.uid() 
            OR 
            EXISTS (
              SELECT 1 FROM public.profiles 
              WHERE user_id = auth.uid() 
              AND role IN ('admin', 'developer')
            )
          )
        );`
    ];
    
    for (const sql of sqlCommands) {
      console.log('📝 Executando:', sql.substring(0, 50) + '...');
      const { error: sqlError } = await supabase.rpc('exec_sql', { query: sql });
      
      if (sqlError) {
        console.error('❌ Erro SQL:', sqlError);
      } else {
        console.log('✅ Comando executado com sucesso');
      }
    }
    
    console.log('🎉 Correção RLS concluída!');
    
  } catch (err) {
    console.error('❌ Erro geral:', err.message);
  }
}

fixRLS();