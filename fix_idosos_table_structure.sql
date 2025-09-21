-- Script para corrigir a estrutura da tabela idosos
-- Problema: Dashboard espera coluna 'ativo' mas tabela tem 'status'

-- Verificar estrutura atual da tabela
DO $$
DECLARE
  rec RECORD;
BEGIN
  RAISE NOTICE '=== VERIFICANDO ESTRUTURA DA TABELA IDOSOS ===';
  
  -- Verificar se a tabela existe
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'idosos') THEN
    RAISE NOTICE 'Tabela idosos encontrada.';
    
    -- Verificar colunas existentes
    RAISE NOTICE 'Colunas existentes:';
    FOR rec IN 
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'idosos'
      ORDER BY ordinal_position
    LOOP
      RAISE NOTICE '  - %: % (nullable: %, default: %)', rec.column_name, rec.data_type, rec.is_nullable, rec.column_default;
    END LOOP;
  ELSE
    RAISE NOTICE 'Tabela idosos NÃO encontrada!';
  END IF;
END $$;

-- Corrigir estrutura da tabela idosos
DO $$
BEGIN
  RAISE NOTICE '=== CORRIGINDO ESTRUTURA DA TABELA IDOSOS ===';
  
  -- Se a tabela não existe, criar com estrutura correta
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'idosos') THEN
    RAISE NOTICE 'Criando tabela idosos...';
    CREATE TABLE public.idosos (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      nome TEXT NOT NULL,
      cpf TEXT NOT NULL UNIQUE,
      rg TEXT,
      data_nascimento DATE NOT NULL,
      telefone_contato TEXT,
      contato_emergencia TEXT,
      quarto TEXT,
      ala TEXT,
      data_admissao DATE NOT NULL,
      status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'transferido', 'falecido')),
      ativo BOOLEAN NOT NULL DEFAULT true, -- Adicionar coluna ativo para compatibilidade
      observacoes_saude TEXT,
      medicamentos TEXT,
      restricoes_nutricionais TEXT,
      created_by UUID NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );
    RAISE NOTICE 'Tabela idosos criada com sucesso!';
  ELSE
    -- Tabela existe, verificar e adicionar colunas necessárias
    RAISE NOTICE 'Tabela idosos existe. Verificando colunas...';
    
    -- Adicionar coluna 'ativo' se não existir
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'idosos' AND column_name = 'ativo') THEN
      RAISE NOTICE 'Adicionando coluna ativo...';
      ALTER TABLE public.idosos ADD COLUMN ativo BOOLEAN NOT NULL DEFAULT true;
      
      -- Sincronizar coluna ativo com status existente
      UPDATE public.idosos SET ativo = (status = 'ativo');
      RAISE NOTICE 'Coluna ativo adicionada e sincronizada com status!';
    ELSE
      RAISE NOTICE 'Coluna ativo já existe.';
    END IF;
    
    -- Verificar outras colunas importantes
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'idosos' AND column_name = 'nome') THEN
      ALTER TABLE public.idosos ADD COLUMN nome TEXT NOT NULL DEFAULT 'Nome não informado';
      RAISE NOTICE 'Coluna nome adicionada.';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'idosos' AND column_name = 'telefone_contato') THEN
      ALTER TABLE public.idosos ADD COLUMN telefone_contato TEXT;
      RAISE NOTICE 'Coluna telefone_contato adicionada.';
    END IF;
    
    -- Adicionar coluna telefone (esperada pelo frontend)
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'idosos' AND column_name = 'telefone') THEN
      ALTER TABLE public.idosos ADD COLUMN telefone TEXT;
      RAISE NOTICE 'Coluna telefone adicionada.';
    END IF;
    
    -- Adicionar coluna endereco (obrigatória para o frontend)
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'idosos' AND column_name = 'endereco') THEN
      ALTER TABLE public.idosos ADD COLUMN endereco TEXT;
      RAISE NOTICE 'Coluna endereco adicionada.';
    END IF;
    
    -- Adicionar coluna contato_emergencia (obrigatória para o frontend)
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'idosos' AND column_name = 'contato_emergencia') THEN
      ALTER TABLE public.idosos ADD COLUMN contato_emergencia TEXT;
      RAISE NOTICE 'Coluna contato_emergencia adicionada.';
    END IF;
    
    -- Adicionar coluna observacoes_medicas (obrigatória para o frontend)
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'idosos' AND column_name = 'observacoes_medicas') THEN
      ALTER TABLE public.idosos ADD COLUMN observacoes_medicas TEXT;
      RAISE NOTICE 'Coluna observacoes_medicas adicionada.';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'idosos' AND column_name = 'quarto') THEN
      ALTER TABLE public.idosos ADD COLUMN quarto TEXT;
      RAISE NOTICE 'Coluna quarto adicionada.';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'idosos' AND column_name = 'ala') THEN
      ALTER TABLE public.idosos ADD COLUMN ala TEXT;
      RAISE NOTICE 'Coluna ala adicionada.';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'idosos' AND column_name = 'data_admissao') THEN
      ALTER TABLE public.idosos ADD COLUMN data_admissao DATE NOT NULL DEFAULT CURRENT_DATE;
      RAISE NOTICE 'Coluna data_admissao adicionada.';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'idosos' AND column_name = 'observacoes_saude') THEN
      ALTER TABLE public.idosos ADD COLUMN observacoes_saude TEXT;
      RAISE NOTICE 'Coluna observacoes_saude adicionada.';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'idosos' AND column_name = 'medicamentos') THEN
      ALTER TABLE public.idosos ADD COLUMN medicamentos TEXT;
      RAISE NOTICE 'Coluna medicamentos adicionada.';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'idosos' AND column_name = 'restricoes_nutricionais') THEN
      ALTER TABLE public.idosos ADD COLUMN restricoes_nutricionais TEXT;
      RAISE NOTICE 'Coluna restricoes_nutricionais adicionada.';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'idosos' AND column_name = 'created_by') THEN
      ALTER TABLE public.idosos ADD COLUMN created_by UUID;
      RAISE NOTICE 'Coluna created_by adicionada.';
    END IF;
  END IF;
  
  RAISE NOTICE 'Estrutura da tabela verificada e corrigida!';
END $$;

-- Criar função trigger para manter ativo sincronizado com status
CREATE OR REPLACE FUNCTION sync_idosos_ativo_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando status muda, atualizar ativo
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.ativo = (NEW.status = 'ativo');
  END IF;
  
  -- Quando ativo muda, atualizar status
  IF TG_OP = 'UPDATE' AND OLD.ativo IS DISTINCT FROM NEW.ativo THEN
    IF NEW.ativo = true THEN
      NEW.status = 'ativo';
    ELSE
      NEW.status = 'inativo';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger
DROP TRIGGER IF EXISTS sync_idosos_ativo_status_trigger ON public.idosos;
CREATE TRIGGER sync_idosos_ativo_status_trigger
  BEFORE UPDATE ON public.idosos
  FOR EACH ROW EXECUTE FUNCTION sync_idosos_ativo_status();

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_idosos_ativo ON public.idosos(ativo);
CREATE INDEX IF NOT EXISTS idx_idosos_status ON public.idosos(status);
CREATE INDEX IF NOT EXISTS idx_idosos_cpf ON public.idosos(cpf);
CREATE INDEX IF NOT EXISTS idx_idosos_data_admissao ON public.idosos(data_admissao);

-- Habilitar RLS se necessário
ALTER TABLE public.idosos ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS básicas se não existirem
DO $$
BEGIN
  -- Remover políticas existentes que possam causar conflito
  DROP POLICY IF EXISTS "Allow all access to idosos" ON public.idosos;
  DROP POLICY IF EXISTS "idosos_select_policy" ON public.idosos;
  DROP POLICY IF EXISTS "idosos_insert_policy" ON public.idosos;
  DROP POLICY IF EXISTS "idosos_update_policy" ON public.idosos;
  DROP POLICY IF EXISTS "idosos_delete_policy" ON public.idosos;
  DROP POLICY IF EXISTS "idosos_select_2024" ON public.idosos;
  DROP POLICY IF EXISTS "idosos_insert_2024" ON public.idosos;
  DROP POLICY IF EXISTS "idosos_update_2024" ON public.idosos;
  DROP POLICY IF EXISTS "idosos_delete_2024" ON public.idosos;
  
  -- Criar novas políticas com nomes únicos
  CREATE POLICY "idosos_select_2024" ON public.idosos
    FOR SELECT USING (true);
    
  CREATE POLICY "idosos_insert_2024" ON public.idosos
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    
  CREATE POLICY "idosos_update_2024" ON public.idosos
    FOR UPDATE USING (auth.role() = 'authenticated');
    
  CREATE POLICY "idosos_delete_2024" ON public.idosos
    FOR DELETE USING (auth.role() = 'authenticated');
    
  RAISE NOTICE 'Políticas RLS criadas para tabela idosos!';
END $$;

-- Verificar estrutura final
DO $$
DECLARE
  rec RECORD;
BEGIN
  RAISE NOTICE '=== ESTRUTURA FINAL DA TABELA IDOSOS ===';
  FOR rec IN 
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'idosos'
    ORDER BY ordinal_position
  LOOP
    RAISE NOTICE '  ✓ %: % (nullable: %, default: %)', rec.column_name, rec.data_type, rec.is_nullable, rec.column_default;
  END LOOP;
  
  RAISE NOTICE '=== SCRIPT CONCLUÍDO COM SUCESSO ===';
  RAISE NOTICE 'A tabela idosos agora tem as colunas "ativo" e "status" sincronizadas.';
  RAISE NOTICE 'O Dashboard pode usar tanto .eq("ativo", true) quanto .eq("status", "ativo")';
END $$;