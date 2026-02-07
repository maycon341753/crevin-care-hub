-- Script para criar a tabela contas_bancarias no Supabase
-- Execute este script no SQL Editor do Supabase Dashboard
-- URL: https://supabase.com/dashboard/project/lhgujxyfxyxzozgokutf/sql/new

-- 1. Criar tabela contas_bancarias
CREATE TABLE IF NOT EXISTS public.contas_bancarias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  banco TEXT NOT NULL,
  agencia TEXT NOT NULL,
  conta TEXT NOT NULL,
  tipo_conta TEXT NOT NULL CHECK (tipo_conta IN ('corrente', 'poupanca', 'aplicacao')),
  saldo_inicial DECIMAL(10,2) NOT NULL DEFAULT 0,
  saldo_atual DECIMAL(10,2) NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_contas_bancarias_ativo ON public.contas_bancarias(ativo);
CREATE INDEX IF NOT EXISTS idx_contas_bancarias_banco ON public.contas_bancarias(banco);
CREATE INDEX IF NOT EXISTS idx_contas_bancarias_tipo_conta ON public.contas_bancarias(tipo_conta);

-- 3. Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. Criar trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_contas_bancarias_updated_at ON public.contas_bancarias;
CREATE TRIGGER update_contas_bancarias_updated_at
    BEFORE UPDATE ON public.contas_bancarias
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Habilitar RLS (Row Level Security)
ALTER TABLE public.contas_bancarias ENABLE ROW LEVEL SECURITY;

-- 6. Criar políticas RLS
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

-- 7. Inserir dados de exemplo (opcional)
INSERT INTO public.contas_bancarias (nome, banco, agencia, conta, tipo_conta, saldo_inicial, saldo_atual) VALUES
('Conta Principal', 'Banco do Brasil', '1234-5', '12345-6', 'corrente', 10000.00, 10000.00),
('Conta Poupança', 'Caixa Econômica', '5678-9', '98765-4', 'poupanca', 5000.00, 5000.00)
ON CONFLICT DO NOTHING;

-- Verificar se a tabela foi criada com sucesso
SELECT 'Tabela contas_bancarias criada com sucesso!' as status;
SELECT COUNT(*) as total_contas FROM public.contas_bancarias;