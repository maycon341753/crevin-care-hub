-- Migração para criar tabela de documentos médicos e configurar storage
-- Data: 2025-01-27

-- 1. Criar tabela de documentos médicos
CREATE TABLE IF NOT EXISTS public.documentos_medicos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    idoso_id UUID NOT NULL REFERENCES public.idosos(id) ON DELETE CASCADE,
    nome_arquivo TEXT NOT NULL,
    tipo_arquivo TEXT NOT NULL DEFAULT 'application/pdf',
    tamanho_arquivo BIGINT,
    caminho_storage TEXT NOT NULL,
    descricao TEXT,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_documentos_medicos_idoso_id ON public.documentos_medicos(idoso_id);
CREATE INDEX IF NOT EXISTS idx_documentos_medicos_uploaded_by ON public.documentos_medicos(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documentos_medicos_created_at ON public.documentos_medicos(created_at);

-- 3. Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_documentos_medicos_updated_at ON public.documentos_medicos;
CREATE TRIGGER update_documentos_medicos_updated_at
    BEFORE UPDATE ON public.documentos_medicos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. Habilitar RLS (Row Level Security)
ALTER TABLE public.documentos_medicos ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas RLS
-- Política para visualização: usuários autenticados podem ver documentos
CREATE POLICY "Authenticated users can view medical documents" ON public.documentos_medicos
    FOR SELECT USING (auth.role() = 'authenticated');

-- Política para inserção: usuários autenticados podem inserir documentos
CREATE POLICY "Authenticated users can insert medical documents" ON public.documentos_medicos
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política para atualização: usuários autenticados podem atualizar documentos
CREATE POLICY "Authenticated users can update medical documents" ON public.documentos_medicos
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Política para exclusão: usuários autenticados podem excluir documentos
CREATE POLICY "Authenticated users can delete medical documents" ON public.documentos_medicos
    FOR DELETE USING (auth.role() = 'authenticated');

-- 6. Criar bucket de storage para documentos médicos (se não existir)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'documentos-medicos',
    'documentos-medicos',
    false,
    52428800, -- 50MB limit
    ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- 7. Criar políticas de storage
-- Política para visualização de arquivos
CREATE POLICY "Authenticated users can view medical documents files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'documentos-medicos' AND 
        auth.role() = 'authenticated'
    );

-- Política para upload de arquivos
CREATE POLICY "Authenticated users can upload medical documents files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'documentos-medicos' AND 
        auth.role() = 'authenticated'
    );

-- Política para exclusão de arquivos
CREATE POLICY "Authenticated users can delete medical documents files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'documentos-medicos' AND 
        auth.role() = 'authenticated'
    );

-- 8. Comentários para documentação
COMMENT ON TABLE public.documentos_medicos IS 'Tabela para armazenar metadados dos documentos médicos dos pacientes';
COMMENT ON COLUMN public.documentos_medicos.idoso_id IS 'Referência ao paciente (idoso)';
COMMENT ON COLUMN public.documentos_medicos.nome_arquivo IS 'Nome original do arquivo';
COMMENT ON COLUMN public.documentos_medicos.tipo_arquivo IS 'MIME type do arquivo';
COMMENT ON COLUMN public.documentos_medicos.tamanho_arquivo IS 'Tamanho do arquivo em bytes';
COMMENT ON COLUMN public.documentos_medicos.caminho_storage IS 'Caminho do arquivo no storage do Supabase';
COMMENT ON COLUMN public.documentos_medicos.descricao IS 'Descrição opcional do documento';
COMMENT ON COLUMN public.documentos_medicos.uploaded_by IS 'Usuário que fez o upload';

-- 9. Verificar se a tabela foi criada com sucesso
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'documentos_medicos') THEN
        RAISE NOTICE '✅ Tabela documentos_medicos criada com sucesso!';
    ELSE
        RAISE NOTICE '❌ Erro ao criar tabela documentos_medicos';
    END IF;
END $$;