const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Carregar variáveis do .env
const envContent = fs.readFileSync('.env', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim().replace(/[\"']/g, '');
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Atualizando role da Layanne para admin...');

async function updateLayanneRole() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Atualizar role para admin
    const { data: profile, error: updateError } = await supabase
      .from('profiles')
      .update({ 
        role: 'admin',
        updated_at: new Date().toISOString()
      })
      .eq('email', 'layanne.crevin@gmail.com')
      .select()
      .single();
    
    if (updateError) {
      console.log('❌ Erro ao atualizar role:', updateError.message);
      return;
    }
    
    console.log('✅ Role atualizado com sucesso!');
    console.log('   Nome:', profile.full_name);
    console.log('   Email:', profile.email);
    console.log('   Role:', profile.role);
    console.log('   Ativo:', profile.active);
    
    console.log('\n🎯 USUÁRIO ADMINISTRATIVO PRONTO:');
    console.log('📧 Email: layanne.crevin@gmail.com');
    console.log('🔑 Senha: LayanneAdmin@2025');
    console.log('👑 Role: admin');
    console.log('✅ Status: ativo');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

updateLayanneRole();