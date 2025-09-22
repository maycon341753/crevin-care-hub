-- ========================================
-- SCRIPT PARA CRIAR TABELAS DE CONCILIAÇÃO BANCÁRIA
-- ========================================

-- 1. Tabela de contas bancárias
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'contas_bancarias') THEN
    CREATE TABLE public.contas_bancarias (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      nome TEXT NOT NULL,
      banco TEXT NOT NULL,
      agencia TEXT NOT NULL,
      conta TEXT NOT NULL,
      tipo_conta TEXT NOT NULL CHECK (tipo_conta IN ('corrente', 'poupanca', 'aplicacao')),
      saldo_inicial DECIMAL(10,2) NOT NULL DEFAULT 0,
      saldo_atual DECIMAL(10,2) NOT NULL DEFAULT 0,
      ativo BOOLEAN NOT NULL DEFAULT true,
      observacoes TEXT,
      created_by UUID NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );
    
    -- Índices para melhor performance
    CREATE INDEX idx_contas_bancarias_ativo ON public.contas_bancarias(ativo);
    CREATE INDEX idx_contas_bancarias_banco ON public.contas_bancarias(banco);
    
    RAISE NOTICE '✅ Tabela contas_bancarias criada com sucesso!';
  ELSE
    RAISE NOTICE 'ℹ️ Tabela contas_bancarias já existe.';
  END IF;
END $$;

-- 2. Tabela de movimentos bancários (extratos)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'movimentos_bancarios') THEN
    CREATE TABLE public.movimentos_bancarios (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      conta_bancaria_id UUID NOT NULL REFERENCES public.contas_bancarias(id) ON DELETE CASCADE,
      data_movimento DATE NOT NULL,
      descricao TEXT NOT NULL,
      valor DECIMAL(10,2) NOT NULL,
      tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
      status_conciliacao TEXT NOT NULL DEFAULT 'pendente' CHECK (status_conciliacao IN ('conciliado', 'pendente', 'divergente')),
      documento TEXT,
      observacoes TEXT,
      hash_movimento TEXT, -- Para evitar duplicatas na importação
      origem_importacao TEXT, -- OFX, CSV, manual, etc.
      data_importacao TIMESTAMP WITH TIME ZONE,
      conciliado_com_id UUID, -- Referência para conta_pagar ou conta_receber
      conciliado_com_tipo TEXT CHECK (conciliado_com_tipo IN ('conta_pagar', 'conta_receber', 'movimentacao_financeira')),
      created_by UUID NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );
    
    -- Índices para melhor performance
    CREATE INDEX idx_movimentos_bancarios_conta ON public.movimentos_bancarios(conta_bancaria_id);
    CREATE INDEX idx_movimentos_bancarios_data ON public.movimentos_bancarios(data_movimento);
    CREATE INDEX idx_movimentos_bancarios_status ON public.movimentos_bancarios(status_conciliacao);
    CREATE INDEX idx_movimentos_bancarios_tipo ON public.movimentos_bancarios(tipo);
    CREATE INDEX idx_movimentos_bancarios_hash ON public.movimentos_bancarios(hash_movimento);
    CREATE UNIQUE INDEX idx_movimentos_bancarios_unique_hash ON public.movimentos_bancarios(conta_bancaria_id, hash_movimento) WHERE hash_movimento IS NOT NULL;
    
    RAISE NOTICE '✅ Tabela movimentos_bancarios criada com sucesso!';
  ELSE
    RAISE NOTICE 'ℹ️ Tabela movimentos_bancarios já existe.';
  END IF;
END $$;

-- 3. Tabela de regras de conciliação automática
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'regras_conciliacao') THEN
    CREATE TABLE public.regras_conciliacao (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      nome TEXT NOT NULL,
      descricao TEXT,
      tipo_movimento TEXT NOT NULL CHECK (tipo_movimento IN ('entrada', 'saida', 'ambos')),
      padrao_descricao TEXT, -- Regex ou texto para buscar na descrição
      valor_minimo DECIMAL(10,2),
      valor_maximo DECIMAL(10,2),
      categoria_id UUID REFERENCES public.categorias_financeiras(id),
      acao_automatica TEXT NOT NULL CHECK (acao_automatica IN ('conciliar_automatico', 'sugerir_conciliacao', 'marcar_divergente')),
      ativo BOOLEAN NOT NULL DEFAULT true,
      prioridade INTEGER NOT NULL DEFAULT 1,
      created_by UUID NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );
    
    -- Índices
    CREATE INDEX idx_regras_conciliacao_ativo ON public.regras_conciliacao(ativo);
    CREATE INDEX idx_regras_conciliacao_tipo ON public.regras_conciliacao(tipo_movimento);
    CREATE INDEX idx_regras_conciliacao_prioridade ON public.regras_conciliacao(prioridade);
    
    RAISE NOTICE '✅ Tabela regras_conciliacao criada com sucesso!';
  ELSE
    RAISE NOTICE 'ℹ️ Tabela regras_conciliacao já existe.';
  END IF;
END $$;

-- 4. Tabela de histórico de conciliações
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'historico_conciliacoes') THEN
    CREATE TABLE public.historico_conciliacoes (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      movimento_bancario_id UUID NOT NULL REFERENCES public.movimentos_bancarios(id) ON DELETE CASCADE,
      tipo_conciliacao TEXT NOT NULL CHECK (tipo_conciliacao IN ('manual', 'automatica', 'sugestao')),
      status_anterior TEXT NOT NULL,
      status_novo TEXT NOT NULL,
      conciliado_com_id UUID,
      conciliado_com_tipo TEXT,
      observacoes TEXT,
      usuario_id UUID NOT NULL,
      data_conciliacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );
    
    -- Índices
    CREATE INDEX idx_historico_conciliacoes_movimento ON public.historico_conciliacoes(movimento_bancario_id);
    CREATE INDEX idx_historico_conciliacoes_data ON public.historico_conciliacoes(data_conciliacao);
    CREATE INDEX idx_historico_conciliacoes_usuario ON public.historico_conciliacoes(usuario_id);
    
    RAISE NOTICE '✅ Tabela historico_conciliacoes criada com sucesso!';
  ELSE
    RAISE NOTICE 'ℹ️ Tabela historico_conciliacoes já existe.';
  END IF;
END $$;

-- 5. Inserir dados de exemplo para contas bancárias
DO $$
BEGIN
  -- Verificar se já existem contas bancárias
  IF NOT EXISTS (SELECT 1 FROM public.contas_bancarias LIMIT 1) THEN
    -- Buscar um usuário válido para usar como created_by
    DECLARE
      user_id UUID;
    BEGIN
      SELECT id INTO user_id FROM public.profiles LIMIT 1;
      
      IF user_id IS NOT NULL THEN
        INSERT INTO public.contas_bancarias (nome, banco, agencia, conta, tipo_conta, saldo_inicial, saldo_atual, created_by) VALUES
        ('Conta Corrente Principal', 'Banco do Brasil', '1234-5', '12345-6', 'corrente', 10000.00, 10000.00, user_id),
        ('Conta Poupança', 'Caixa Econômica Federal', '0001', '98765-4', 'poupanca', 5000.00, 5000.00, user_id),
        ('Conta Aplicação', 'Itaú', '5678', '11111-1', 'aplicacao', 25000.00, 25000.00, user_id);
        
        RAISE NOTICE '✅ Contas bancárias de exemplo inseridas!';
      ELSE
        RAISE NOTICE '⚠️ Nenhum usuário encontrado para inserir contas bancárias de exemplo.';
      END IF;
    END;
  ELSE
    RAISE NOTICE 'ℹ️ Contas bancárias já existem.';
  END IF;
END $$;

-- 6. Criar função para atualizar saldo das contas bancárias
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
$$ LANGUAGE plpgsql;

-- 7. Criar trigger para atualizar saldo automaticamente
DROP TRIGGER IF EXISTS trigger_atualizar_saldo_conta ON public.movimentos_bancarios;
CREATE TRIGGER trigger_atualizar_saldo_conta
  AFTER INSERT OR UPDATE OR DELETE ON public.movimentos_bancarios
  FOR EACH ROW EXECUTE FUNCTION atualizar_saldo_conta_bancaria();

-- 8. Criar políticas RLS para as novas tabelas
-- Contas bancárias
ALTER TABLE public.contas_bancarias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuários podem ver todas as contas bancárias" ON public.contas_bancarias FOR SELECT USING (true);
CREATE POLICY "Usuários podem inserir contas bancárias" ON public.contas_bancarias FOR INSERT WITH CHECK (true);
CREATE POLICY "Usuários podem atualizar contas bancárias" ON public.contas_bancarias FOR UPDATE USING (true);
CREATE POLICY "Usuários podem deletar contas bancárias" ON public.contas_bancarias FOR DELETE USING (true);

-- Movimentos bancários
ALTER TABLE public.movimentos_bancarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuários podem ver todos os movimentos bancários" ON public.movimentos_bancarios FOR SELECT USING (true);
CREATE POLICY "Usuários podem inserir movimentos bancários" ON public.movimentos_bancarios FOR INSERT WITH CHECK (true);
CREATE POLICY "Usuários podem atualizar movimentos bancários" ON public.movimentos_bancarios FOR UPDATE USING (true);
CREATE POLICY "Usuários podem deletar movimentos bancários" ON public.movimentos_bancarios FOR DELETE USING (true);

-- Regras de conciliação
ALTER TABLE public.regras_conciliacao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuários podem ver todas as regras de conciliação" ON public.regras_conciliacao FOR SELECT USING (true);
CREATE POLICY "Usuários podem inserir regras de conciliação" ON public.regras_conciliacao FOR INSERT WITH CHECK (true);
CREATE POLICY "Usuários podem atualizar regras de conciliação" ON public.regras_conciliacao FOR UPDATE USING (true);
CREATE POLICY "Usuários podem deletar regras de conciliação" ON public.regras_conciliacao FOR DELETE USING (true);

-- Histórico de conciliações
ALTER TABLE public.historico_conciliacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuários podem ver todo o histórico de conciliações" ON public.historico_conciliacoes FOR SELECT USING (true);
CREATE POLICY "Usuários podem inserir no histórico de conciliações" ON public.historico_conciliacoes FOR INSERT WITH CHECK (true);

SELECT '✅ TABELAS DE CONCILIAÇÃO BANCÁRIA CRIADAS COM SUCESSO!' as resultado_final;