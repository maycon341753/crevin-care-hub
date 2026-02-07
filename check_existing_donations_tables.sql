-- Script para verificar se as tabelas de doações já existem
-- Execute este script primeiro para verificar o estado atual

-- Verificar se as tabelas existem
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename IN ('doacoes_dinheiro', 'doacoes_itens')
ORDER BY tablename;

-- Verificar estrutura das tabelas se existirem
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('doacoes_dinheiro', 'doacoes_itens')
    AND table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- Verificar índices existentes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('doacoes_dinheiro', 'doacoes_itens')
ORDER BY tablename, indexname;