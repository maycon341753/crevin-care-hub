-- ========================================
-- SCRIPT PARA CRIAR TABELA MOVIMENTOS_BANCARIOS
-- Execute este script no SQL Editor do Supabase Dashboard
-- ========================================

-- 1. Criar tabela movimentos_bancarios
CREATE TABLE IF NOT EXISTS public.movimentos_bancarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conta_bancaria_id UUID NOT NULL REFERENCES public.contas_bancarias(id) ON DELETE CASCADE,
  data_movimento DATE NOT NULL,
  descricao TEXT NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  status_conciliacao TEXT NOT NULL DEFAULT 'pendente' CHECK (status_conciliacao IN ('conciliado', 'pendente', 'divergente')),
  documento TEXT,
  observacoes TEXT,
  hash_movimento TEXT,
  origem_importacao TEXT,
  data_importacao TIMESTAMP WITH TIME ZONE,
  conciliado_com_id UUID,
  conciliado_com_tipo TEXT CHECK (conciliado_com_tipo IN ('conta_pagar', 'conta_receber', 'movimentacao_financeira')),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_movimentos_bancarios_conta ON public.movimentos_bancarios(conta_bancaria_id);
CREATE INDEX IF NOT EXISTS idx_movimentos_bancarios_data ON public.movimentos_bancarios(data_movimento);
CREATE INDEX IF NOT EXISTS idx_movimentos_bancarios_status ON public.movimentos_bancarios(status_conciliacao);
CREATE INDEX IF NOT EXISTS idx_movimentos_bancarios_tipo ON public.movimentos_bancarios(tipo);
CREATE INDEX IF NOT EXISTS idx_movimentos_bancarios_hash ON public.movimentos_bancarios(hash_movimento);
CREATE UNIQUE INDEX IF NOT EXISTS idx_movimentos_bancarios_unique_hash ON public.movimentos_bancarios(conta_bancaria_id, hash_movimento) WHERE hash_movimento IS NOT NULL;

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE public.movimentos_bancarios ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas RLS (removendo políticas existentes primeiro)
DROP POLICY IF EXISTS "Usuários podem ver todos os movimentos bancários" ON public.movimentos_bancarios;
DROP POLICY IF EXISTS "Usuários podem inserir movimentos bancários" ON public.movimentos_bancarios;
DROP POLICY IF EXISTS "Usuários podem atualizar movimentos bancários" ON public.movimentos_bancarios;
DROP POLICY IF EXISTS "Usuários podem deletar movimentos bancários" ON public.movimentos_bancarios;

CREATE POLICY "Usuários podem ver todos os movimentos bancários" 
ON public.movimentos_bancarios FOR SELECT USING (true);

CREATE POLICY "Usuários podem inserir movimentos bancários" 
ON public.movimentos_bancarios FOR INSERT WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar movimentos bancários" 
ON public.movimentos_bancarios FOR UPDATE USING (true);

CREATE POLICY "Usuários podem deletar movimentos bancários" 
ON public.movimentos_bancarios FOR DELETE USING (true);

-- 5. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_movimentos_bancarios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Criar trigger para atualizar updated_at (removendo primeiro se existir)
DROP TRIGGER IF EXISTS update_movimentos_bancarios_updated_at ON public.movimentos_bancarios;
CREATE TRIGGER update_movimentos_bancarios_updated_at
    BEFORE UPDATE ON public.movimentos_bancarios
    FOR EACH ROW EXECUTE FUNCTION update_movimentos_bancarios_updated_at();

-- 7. Criar função para atualizar saldo das contas bancárias
CREATE OR REPLACE FUNCTION atualizar_saldo_conta_bancaria()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar saldo quando um movimento é inserido, atualizado ou deletado
  IF TG_OP = 'INSERT' THEN
    UPDATE public.contas_bancarias 
    SET saldo_atual = saldo_atual + CASE 
      WHEN NEW.tipo = 'entrada' THEN NEW.valor 
      ELSE -NEW.valor 
    END,
    updated_at = now()
    WHERE id = NEW.conta_bancaria_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Reverter movimento antigo
    UPDATE public.contas_bancarias 
    SET saldo_atual = saldo_atual - CASE 
      WHEN OLD.tipo = 'entrada' THEN OLD.valor 
      ELSE -OLD.valor 
    END
    WHERE id = OLD.conta_bancaria_id;
    
    -- Aplicar movimento novo
    UPDATE public.contas_bancarias 
    SET saldo_atual = saldo_atual + CASE 
      WHEN NEW.tipo = 'entrada' THEN NEW.valor 
      ELSE -NEW.valor 
    END,
    updated_at = now()
    WHERE id = NEW.conta_bancaria_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.contas_bancarias 
    SET saldo_atual = saldo_atual - CASE 
      WHEN OLD.tipo = 'entrada' THEN OLD.valor 
      ELSE -OLD.valor 
    END,
    updated_at = now()
    WHERE id = OLD.conta_bancaria_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

-- 8. Criar trigger para atualizar saldo automaticamente (removendo primeiro se existir)
DROP TRIGGER IF EXISTS trigger_atualizar_saldo_conta_bancaria ON public.movimentos_bancarios;
CREATE TRIGGER trigger_atualizar_saldo_conta_bancaria
    AFTER INSERT OR UPDATE OR DELETE ON public.movimentos_bancarios
    FOR EACH ROW EXECUTE FUNCTION atualizar_saldo_conta_bancaria();

-- 9. Comentário na tabela
COMMENT ON TABLE public.movimentos_bancarios IS 'Movimentações bancárias (extratos) para conciliação';

-- 10. Verificar se a tabela foi criada com sucesso
SELECT 'Tabela movimentos_bancarios criada com sucesso!' as status;
SELECT COUNT(*) as total_movimentos FROM public.movimentos_bancarios;

-- 11. Mostrar estrutura da tabela criada
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'movimentos_bancarios' 
AND table_schema = 'public'
ORDER BY ordinal_position;