const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Ler variáveis de ambiente
const envContent = fs.readFileSync('.env', 'utf8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL="(.+)"/)?.[1];
const supabaseKey = envContent.match(/VITE_SUPABASE_PUBLISHABLE_KEY="(.+)"/)?.[1];

console.log('🔍 URL:', supabaseUrl);
console.log('🔍 Key:', supabaseKey ? 'Encontrada' : 'Não encontrada');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createMedicalDocumentsTable() {
  try {
    console.log('📋 Verificando se a tabela documentos_medicos já existe...');
    
    // Primeiro, vamos testar a conexão
    const { data: testData, error: testError } = await supabase
      .from('idosos')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('❌ Erro de conexão:', testError);
      return;
    }
    
    console.log('✅ Conexão OK');
    
    // Verificar se a tabela já existe
    const { data: existingTable, error: checkError } = await supabase
      .from('documentos_medicos')
      .select('id')
      .limit(1);
    
    if (!checkError) {
      console.log('✅ Tabela documentos_medicos já existe!');
      return;
    }
    
    console.log('📋 Tabela não existe, criando via SQL...');
    
    // Como não podemos executar SQL diretamente, vamos adicionar os tipos TypeScript primeiro
    console.log('💡 Para criar a tabela, execute o arquivo create_medical_documents_table.sql no Supabase Dashboard');
    console.log('📁 Arquivo criado: create_medical_documents_table.sql');
    
    // Vamos atualizar os tipos TypeScript para incluir a nova tabela
    console.log('📋 Atualizando tipos TypeScript...');
    
    const typesPath = 'src/integrations/supabase/types.ts';
    let typesContent = fs.readFileSync(typesPath, 'utf8');
    
    // Verificar se a tabela já está nos tipos
    if (typesContent.includes('documentos_medicos')) {
      console.log('✅ Tipos já incluem documentos_medicos');
    } else {
      console.log('📝 Adicionando tipos para documentos_medicos...');
      
      // Encontrar onde adicionar a nova tabela
      const tablesMatch = typesContent.match(/(Tables: {[^}]+})/s);
      if (tablesMatch) {
        const newTableType = `    documentos_medicos: {
      Row: {
        id: string
        idoso_id: string
        nome_arquivo: string
        tipo_arquivo: string
        tamanho_arquivo: number | null
        caminho_storage: string
        descricao: string | null
        uploaded_by: string | null
        created_at: string
        updated_at: string
      }
      Insert: {
        id?: string
        idoso_id: string
        nome_arquivo: string
        tipo_arquivo?: string
        tamanho_arquivo?: number | null
        caminho_storage: string
        descricao?: string | null
        uploaded_by?: string | null
        created_at?: string
        updated_at?: string
      }
      Update: {
        id?: string
        idoso_id?: string
        nome_arquivo?: string
        tipo_arquivo?: string
        tamanho_arquivo?: number | null
        caminho_storage?: string
        descricao?: string | null
        uploaded_by?: string | null
        created_at?: string
        updated_at?: string
      }
      Relationships: [
        {
          foreignKeyName: "documentos_medicos_idoso_id_fkey"
          columns: ["idoso_id"]
          isOneToOne: false
          referencedRelation: "idosos"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "documentos_medicos_uploaded_by_fkey"
          columns: ["uploaded_by"]
          isOneToOne: false
          referencedRelation: "users"
          referencedColumns: ["id"]
        }
      ]
    }`;
        
        // Adicionar antes do fechamento das Tables
        const updatedContent = typesContent.replace(
          /(\s+)(\}\s+Views:)/,
          `$1${newTableType}$1$2`
        );
        
        fs.writeFileSync(typesPath, updatedContent);
        console.log('✅ Tipos TypeScript atualizados!');
      }
    }
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

createMedicalDocumentsTable();