const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://lhgujxyfxyxzozgokutf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxoZ3VqeHlmeHl4em96Z29rdXRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM5MDY2NSwiZXhwIjoyMDczOTY2NjY1fQ.AHq_kORGZlUpzsRM2Zy5wlGkzRbEr2wbB8AAyFDAEyk';

const supabase = createClient(supabaseUrl, supabaseKey);

// SQL para criar a tabela fornecedores
const createFornecedoresTableSQL = `
-- Criar tabela fornecedores
CREATE TABLE IF NOT EXISTS public.fornecedores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    razao_social TEXT,
    cnpj TEXT UNIQUE,
    cpf TEXT UNIQUE,
    tipo_pessoa TEXT NOT NULL CHECK (tipo_pessoa IN ('fisica', 'juridica')),
    email TEXT,
    telefone TEXT,
    celular TEXT,
    endereco TEXT,
    cidade TEXT,
    estado TEXT,
    cep TEXT,
    categoria TEXT, -- Ex: 'alimentacao', 'limpeza', 'medicamentos', 'servicos'
    observacoes TEXT,
    status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'bloqueado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_fornecedores_nome ON public.fornecedores(nome);
CREATE INDEX IF NOT EXISTS idx_fornecedores_cnpj ON public.fornecedores(cnpj);
CREATE INDEX IF NOT EXISTS idx_fornecedores_cpf ON public.fornecedores(cpf);
CREATE INDEX IF NOT EXISTS idx_fornecedores_categoria ON public.fornecedores(categoria);
CREATE INDEX IF NOT EXISTS idx_fornecedores_status ON public.fornecedores(status);

-- Criar trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_fornecedores_updated_at
    BEFORE UPDATE ON public.fornecedores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura para usuários autenticados
CREATE POLICY "Permitir leitura para usuários autenticados" ON public.fornecedores
    FOR SELECT USING (auth.role() = 'authenticated');

-- Política para permitir inserção para usuários autenticados
CREATE POLICY "Permitir inserção para usuários autenticados" ON public.fornecedores
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política para permitir atualização para usuários autenticados
CREATE POLICY "Permitir atualização para usuários autenticados" ON public.fornecedores
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Política para permitir exclusão para usuários autenticados
CREATE POLICY "Permitir exclusão para usuários autenticados" ON public.fornecedores
    FOR DELETE USING (auth.role() = 'authenticated');
`;

async function createFornecedoresTable() {
    try {
        console.log('🔄 Criando tabela fornecedores...');
        
        const { data, error } = await supabase.rpc('exec_sql', {
            sql: createFornecedoresTableSQL
        });

        if (error) {
            console.error('❌ Erro ao criar tabela fornecedores:', error);
            
            // Tentar método alternativo
            console.log('🔄 Tentando método alternativo...');
            const { data: altData, error: altError } = await supabase
                .from('fornecedores')
                .select('*')
                .limit(0);
            
            if (altError && altError.message.includes('does not exist')) {
                console.log('📝 Executando SQL diretamente...');
                // Executar cada comando separadamente
                const commands = createFornecedoresTableSQL.split(';').filter(cmd => cmd.trim());
                
                for (const command of commands) {
                    if (command.trim()) {
                        try {
                            await supabase.rpc('exec_sql', { sql: command.trim() + ';' });
                        } catch (cmdError) {
                            console.log('⚠️ Comando ignorado:', command.substring(0, 50) + '...');
                        }
                    }
                }
            }
        }

        // Verificar se a tabela foi criada
        const { data: testData, error: testError } = await supabase
            .from('fornecedores')
            .select('*')
            .limit(1);

        if (testError) {
            console.error('❌ Tabela fornecedores ainda não existe:', testError.message);
            console.log('📋 SQL para executar manualmente no Supabase Dashboard:');
            console.log(createFornecedoresTableSQL);
        } else {
            console.log('✅ Tabela fornecedores criada com sucesso!');
        }

    } catch (error) {
        console.error('❌ Erro geral:', error);
        console.log('📋 SQL para executar manualmente no Supabase Dashboard:');
        console.log(createFornecedoresTableSQL);
    }
}

// Executar a função
createFornecedoresTable();