-- Script para desabilitar RLS da tabela advertencias e adicionar dados de exemplo
-- Execute este script no Supabase Dashboard SQL Editor

-- 1. Desabilitar RLS temporariamente para permitir inserção de dados
ALTER TABLE public.advertencias DISABLE ROW LEVEL SECURITY;

-- 2. Inserir dados de exemplo para testar a página
INSERT INTO public.advertencias (funcionario_id, tipo, motivo, descricao, data_advertencia, status) 
SELECT 
    f.id,
    'verbal',
    'Atraso recorrente',
    'Funcionário chegou atrasado 3 vezes na última semana',
    '2025-01-20',
    'ativa'
FROM public.funcionarios f 
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.advertencias (funcionario_id, tipo, motivo, descricao, data_advertencia, status) 
SELECT 
    f.id,
    'escrita',
    'Não cumprimento de procedimentos',
    'Não seguiu os protocolos de segurança estabelecidos',
    '2025-01-18',
    'ativa'
FROM public.funcionarios f 
OFFSET 1
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.advertencias (funcionario_id, tipo, motivo, descricao, data_advertencia, status) 
SELECT 
    f.id,
    'verbal',
    'Comportamento inadequado',
    'Tratamento inadequado com colegas de trabalho',
    '2025-01-15',
    'ativa'
FROM public.funcionarios f 
OFFSET 2
LIMIT 1
ON CONFLICT DO NOTHING;

-- 3. Verificar se os dados foram inseridos
SELECT 
    a.*,
    f.nome as funcionario_nome,
    f.cargo as funcionario_cargo
FROM public.advertencias a
LEFT JOIN public.funcionarios f ON a.funcionario_id = f.id
ORDER BY a.data_advertencia DESC;

-- 4. Reabilitar RLS com políticas mais permissivas
ALTER TABLE public.advertencias ENABLE ROW LEVEL SECURITY;

-- 5. Remover TODAS as políticas existentes que podem estar muito restritivas
DROP POLICY IF EXISTS "Authenticated users can view advertencias" ON public.advertencias;
DROP POLICY IF EXISTS "Admins can manage advertencias" ON public.advertencias;
DROP POLICY IF EXISTS "Allow authenticated users to view advertencias" ON public.advertencias;
DROP POLICY IF EXISTS "Allow authenticated users to insert advertencias" ON public.advertencias;
DROP POLICY IF EXISTS "Allow authenticated users to update advertencias" ON public.advertencias;
DROP POLICY IF EXISTS "Allow authenticated users to delete advertencias" ON public.advertencias;

-- 6. Criar políticas mais permissivas para usuários autenticados
CREATE POLICY "Allow authenticated users to view advertencias" ON public.advertencias
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert advertencias" ON public.advertencias
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update advertencias" ON public.advertencias
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete advertencias" ON public.advertencias
    FOR DELETE USING (auth.role() = 'authenticated');

-- 7. Verificação final
SELECT 
    'Políticas RLS da tabela advertencias:' as info,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'advertencias'
ORDER BY cmd, policyname;

-- 8. Contar registros na tabela
SELECT 
    'Total de advertências na tabela:' as info,
    COUNT(*) as total
FROM public.advertencias;