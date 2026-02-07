import { createClient } from "@supabase/supabase-js";

// Configurações do Supabase
const supabaseUrl = "https://lhgujxyfxyxzozgokutf.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxoZ3VqeHlmeHl4em96Z29rdXRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzOTA2NjUsImV4cCI6MjA3Mzk2NjY2NX0.GqhKb-Zo00t54x5pMYvwAZGFuOSeFedYKt7-Q-TVmfo";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log(" Verificando banco de dados...\n");
  
  try {
    // 1. Verificar tabelas existentes
    console.log(" Verificando tabelas existentes:");
    const { data: tables, error: tablesError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public");
    
    if (tablesError) {
      console.log(" Erro ao buscar tabelas:", tablesError.message);
    } else {
      console.log(" Tabelas encontradas:", tables?.map(t => t.table_name) || []);
    }
    
    // 2. Verificar usuários no auth.users
    console.log("\n Verificando usuários cadastrados:");
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log(" Erro ao buscar usuários auth:", authError.message);
    } else {
      console.log(" Usuários no auth.users:", authUsers.users?.length || 0);
      authUsers.users?.forEach(user => {
        console.log(`  - ${user.email} (ID: ${user.id})`);
      });
    }
    
    // 3. Verificar tabela profiles
    console.log("\n Verificando tabela profiles:");
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*");
    
    if (profilesError) {
      console.log(" Erro ao buscar profiles:", profilesError.message);
    } else {
      console.log(" Profiles encontrados:", profiles?.length || 0);
      profiles?.forEach(profile => {
        console.log(`  - ${profile.email} (Role: ${profile.role})`);
      });
    }
    
    // 4. Verificar tabela users (pública)
    console.log("\n Verificando tabela users (pública):");
    const { data: publicUsers, error: usersError } = await supabase
      .from("users")
      .select("*");
    
    if (usersError) {
      console.log(" Erro ao buscar users públicos:", usersError.message);
    } else {
      console.log(" Users públicos encontrados:", publicUsers?.length || 0);
      publicUsers?.forEach(user => {
        console.log(`  - ${user.email} (ID: ${user.id})`);
      });
    }
    
    // 5. Tentar login com desenvolvedor
    console.log("\n Testando login do desenvolvedor:");
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: "desenvolvedor@crevin.com.br",
      password: "Dev@2025"
    });
    
    if (loginError) {
      console.log(" Erro no login:", loginError.message);
    } else {
      console.log(" Login realizado com sucesso!");
      console.log("  - User ID:", loginData.user?.id);
      console.log("  - Email:", loginData.user?.email);
    }
    
  } catch (error) {
    console.error(" Erro geral:", error.message);
  }
}

checkDatabase();