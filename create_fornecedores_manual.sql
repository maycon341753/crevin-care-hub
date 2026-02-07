-- Script para criar tabela de fornecedores
-- Execute este script no SQL Editor do Supabase Dashboard
-- https://supabase.com/dashboard/project/lhgujxyfxyxzozgokutf/sql/new

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

-- Remover trigger se já existir
DROP TRIGGER IF EXISTS update_fornecedores_updated_at ON public.fornecedores;

-- Criar trigger para atualizar updated_at
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

-- Inserir alguns dados de exemplo (opcional)
INSERT INTO public.fornecedores (nome, razao_social, cnpj, tipo_pessoa, email, telefone, categoria, status) VALUES
('Fornecedor Exemplo Ltda', 'Fornecedor Exemplo Ltda', '12.345.678/0001-90', 'juridica', 'contato@exemplo.com', '(11) 1234-5678', 'alimentacao', 'ativo'),
('João Silva', NULL, NULL, 'fisica', 'joao@email.com', '(11) 9876-5432', 'servicos', 'ativo')
ON CONFLICT DO NOTHING;