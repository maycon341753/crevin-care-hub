-- Criação da tabela contas_receber
-- Migration: 20250122000000_create_contas_receber_table

DO $$
BEGIN
  -- Verificar se a tabela contas_receber já existe
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'contas_receber') THEN
    CREATE TABLE contas_receber (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      descricao TEXT NOT NULL,
      valor DECIMAL(10,2) NOT NULL,
      data_vencimento DATE NOT NULL,
      data_recebimento DATE,
      categoria TEXT,
      subcategoria TEXT,
      pagador_nome TEXT,
      pagador_cpf TEXT,
      pagador_telefone TEXT,
      forma_pagamento TEXT CHECK (forma_pagamento IN ('dinheiro', 'pix', 'cartao', 'transferencia', 'cheque', 'boleto')),
      status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'recebido', 'vencido', 'cancelado')),
      observacoes TEXT,
      comprovante_url TEXT,
      created_by UUID NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );

    RAISE NOTICE '✅ Tabela contas_receber criada com sucesso!';
  ELSE
    RAISE NOTICE 'ℹ️ Tabela contas_receber já existe.';
  END IF;

  -- Criar índices para melhor performance
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE tablename = 'contas_receber' AND indexname = 'idx_contas_receber_status') THEN
    CREATE INDEX idx_contas_receber_status ON contas_receber(status);
    RAISE NOTICE '✅ Índice idx_contas_receber_status criado!';
  END IF;

  IF NOT EXISTS (SELECT FROM pg_indexes WHERE tablename = 'contas_receber' AND indexname = 'idx_contas_receber_data_vencimento') THEN
    CREATE INDEX idx_contas_receber_data_vencimento ON contas_receber(data_vencimento);
    RAISE NOTICE '✅ Índice idx_contas_receber_data_vencimento criado!';
  END IF;

  IF NOT EXISTS (SELECT FROM pg_indexes WHERE tablename = 'contas_receber' AND indexname = 'idx_contas_receber_created_by') THEN
    CREATE INDEX idx_contas_receber_created_by ON contas_receber(created_by);
    RAISE NOTICE '✅ Índice idx_contas_receber_created_by criado!';
  END IF;

  -- Criar trigger para atualizar updated_at automaticamente
  IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'update_contas_receber_updated_at') THEN
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = now();
        RETURN NEW;
    END;
    $$ language 'plpgsql';

    CREATE TRIGGER update_contas_receber_updated_at
        BEFORE UPDATE ON contas_receber
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    
    RAISE NOTICE '✅ Trigger update_contas_receber_updated_at criado!';
  END IF;

  -- Habilitar RLS (Row Level Security)
  ALTER TABLE contas_receber ENABLE ROW LEVEL SECURITY;

  -- Criar política RLS para permitir que usuários vejam apenas seus próprios registros
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'contas_receber' AND policyname = 'contas_receber_policy') THEN
    CREATE POLICY contas_receber_policy ON contas_receber
      FOR ALL USING (auth.uid() = created_by);
    RAISE NOTICE '✅ Política RLS contas_receber_policy criada!';
  END IF;

  RAISE NOTICE '🎉 Configuração da tabela contas_receber concluída!';
END
$$;