-- Script para criar a tabela contas_bancarias
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Criar tabela contas_bancarias
CREATE TABLE IF NOT EXISTS public.contas_bancarias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  banco TEXT NOT NULL,
  agencia TEXT NOT NULL,
  conta TEXT NOT NULL,
  saldo_atual DECIMAL(10,2) NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Criar índices
CREATE INDEX IF NOT EXISTS idx_contas_bancarias_ativo ON public.contas_bancarias(ativo);
CREATE INDEX IF NOT EXISTS idx_contas_bancarias_banco ON public.contas_bancarias(banco);

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE public.contas_bancarias ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas RLS
DROP POLICY IF EXISTS "Usuários podem ver todas as contas bancárias" ON public.contas_bancarias;
CREATE POLICY "Usuários podem ver todas as contas bancárias" 
  ON public.contas_bancarias FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Usuários podem inserir contas bancárias" ON public.contas_bancarias;
CREATE POLICY "Usuários podem inserir contas bancárias" 
  ON public.contas_bancarias FOR INSERT 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Usuários podem atualizar contas bancárias" ON public.contas_bancarias;
CREATE POLICY "Usuários podem atualizar contas bancárias" 
  ON public.contas_bancarias FOR UPDATE 
  USING (true);

DROP POLICY IF EXISTS "Usuários podem deletar contas bancárias" ON public.contas_bancarias;
CREATE POLICY "Usuários podem deletar contas bancárias" 
  ON public.contas_bancarias FOR DELETE 
  USING (true);

-- 5. Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Criar trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_contas_bancarias_updated_at ON public.contas_bancarias;
CREATE TRIGGER update_contas_bancarias_updated_at 
  BEFORE UPDATE ON public.contas_bancarias 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Inserir dados de exemplo (opcional)
INSERT INTO public.contas_bancarias (nome, banco, agencia, conta, saldo_atual) 
VALUES 
  ('Conta Corrente Principal', 'Banco do Brasil', '1234-5', '12345-6', 10000.00),
  ('Conta Poupança', 'Caixa Econômica Federal', '0001', '98765-4', 5000.00)
ON CONFLICT DO NOTHING;

SELECT 'Tabela contas_bancarias criada com sucesso!' as resultado;