import { createClient } from "@supabase/supabase-js";

// Configurações do Supabase
const supabaseUrl = "https://lhgujxyfxyxzozgokutf.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxoZ3VqeHlmeHl4em96Z29rdXRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzOTA2NjUsImV4cCI6MjA3Mzk2NjY2NX0.GqhKb-Zo00t54x5pMYvwAZGFuOSeFedYKt7-Q-TVmfo";

const supabase = createClient(supabaseUrl, supabaseKey);

// SQL para criar a tabela advertencias
const createAdvertenciasTableSQL = `
-- Criar tabela advertencias
CREATE TABLE IF NOT EXISTS public.advertencias (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    funcionario_id UUID NOT NULL REFERENCES public.funcionarios(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('verbal', 'escrita', 'suspensao')),
    motivo TEXT NOT NULL,
    descricao TEXT,
    data_advertencia DATE NOT NULL DEFAULT CURRENT_DATE,
    aplicada_por UUID REFERENCES public.funcionarios(id),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_advertencias_funcionario_id ON public.advertencias(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_advertencias_tipo ON public.advertencias(tipo);
CREATE INDEX IF NOT EXISTS idx_advertencias_data ON public.advertencias(data_advertencia);

-- Criar trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_advertencias_updated_at ON public.advertencias;
CREATE TRIGGER update_advertencias_updated_at
    BEFORE UPDATE ON public.advertencias
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.advertencias ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
DROP POLICY IF EXISTS "Usuários autenticados podem ver advertencias" ON public.advertencias;
CREATE POLICY "Usuários autenticados podem ver advertencias"
    ON public.advertencias FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Usuários autenticados podem inserir advertencias" ON public.advertencias;
CREATE POLICY "Usuários autenticados podem inserir advertencias"
    ON public.advertencias FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Usuários autenticados podem atualizar advertencias" ON public.advertencias;
CREATE POLICY "Usuários autenticados podem atualizar advertencias"
    ON public.advertencias FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Usuários autenticados podem deletar advertencias" ON public.advertencias;
CREATE POLICY "Usuários autenticados podem deletar advertencias"
    ON public.advertencias FOR DELETE
    TO authenticated
    USING (true);

-- Inserir dados de exemplo
INSERT INTO public.advertencias (funcionario_id, tipo, motivo, descricao, aplicada_por) 
SELECT 
    f1.id,
    'verbal',
    'Atraso frequente',
    'Funcionário chegou atrasado 3 vezes na semana',
    f2.id
FROM public.funcionarios f1, public.funcionarios f2 
WHERE f1.nome ILIKE '%silva%' 
AND f2.nome ILIKE '%santos%'
LIMIT 1
ON CONFLICT DO NOTHING;
`;

async function createMissingTables() {
    try {
        console.log('🔄 Verificando se a tabela advertencias existe...');
        
        // Tentar fazer uma consulta simples na tabela advertencias
        const { data: testQuery, error: testError } = await supabase
            .from('advertencias')
            .select('count', { count: 'exact', head: true });

        if (!testError) {
            console.log('✅ Tabela advertencias já existe');
            return;
        }

        console.log('📋 Tabela advertencias não existe. Criando...');
        
        // Executar o SQL de criação da tabela usando rpc
        const { data, error } = await supabase.rpc('exec_sql', {
            sql: createAdvertenciasTableSQL
        });

        if (error) {
            console.error('❌ Erro ao criar tabela advertencias:', error);
            console.log('💡 Tentando método alternativo...');
            
            // Método alternativo: tentar criar usando SQL direto
            const { data: altData, error: altError } = await supabase
                .from('advertencias')
                .insert([]);
                
            if (altError && altError.code === '42P01') {
                console.log('⚠️ Tabela realmente não existe. Você precisa executar o SQL manualmente no Supabase Dashboard.');
                console.log('🔗 Vá para: https://supabase.com/dashboard/project/lhgujxyfxyxzozgokutf/sql/new');
                console.log('📋 Execute o conteúdo do arquivo create_advertencias_table.sql');
            }
            return;
        }

        console.log('✅ Tabela advertencias criada com sucesso!');
        
        // Verificar se a tabela foi criada
        const { data: verification, error: verifyError } = await supabase
            .from('advertencias')
            .select('count', { count: 'exact', head: true });

        if (verifyError) {
            console.error('❌ Erro ao verificar tabela criada:', verifyError);
        } else {
            console.log('✅ Verificação: Tabela advertencias está funcionando');
        }

    } catch (error) {
        console.error('❌ Erro geral:', error);
    }
}

// Executar o script
createMissingTables();