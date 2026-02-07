-- Criar tabela para lista de espera de idosos
CREATE TABLE IF NOT EXISTS lista_espera_idosos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    data_nascimento DATE NOT NULL,
    telefone VARCHAR(20),
    endereco TEXT,
    responsavel_nome VARCHAR(255),
    responsavel_telefone VARCHAR(20),
    responsavel_parentesco VARCHAR(100),
    observacoes TEXT,
    data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    posicao_fila INTEGER,
    status VARCHAR(20) DEFAULT 'aguardando' CHECK (status IN ('aguardando', 'contatado', 'transferido', 'cancelado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_lista_espera_cpf ON lista_espera_idosos(cpf);
CREATE INDEX IF NOT EXISTS idx_lista_espera_status ON lista_espera_idosos(status);
CREATE INDEX IF NOT EXISTS idx_lista_espera_posicao ON lista_espera_idosos(posicao_fila);
CREATE INDEX IF NOT EXISTS idx_lista_espera_data_cadastro ON lista_espera_idosos(data_cadastro);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_lista_espera_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_lista_espera_updated_at ON lista_espera_idosos;
CREATE TRIGGER trigger_update_lista_espera_updated_at
    BEFORE UPDATE ON lista_espera_idosos
    FOR EACH ROW
    EXECUTE FUNCTION update_lista_espera_updated_at();

-- Função para gerenciar posição na fila automaticamente
CREATE OR REPLACE FUNCTION manage_fila_position()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Ao inserir, definir próxima posição na fila
        SELECT COALESCE(MAX(posicao_fila), 0) + 1 
        INTO NEW.posicao_fila 
        FROM lista_espera_idosos 
        WHERE status = 'aguardando';
        
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Se status mudou para 'transferido' ou 'cancelado', reorganizar fila
        IF OLD.status = 'aguardando' AND NEW.status IN ('transferido', 'cancelado') THEN
            UPDATE lista_espera_idosos 
            SET posicao_fila = posicao_fila - 1 
            WHERE posicao_fila > OLD.posicao_fila 
            AND status = 'aguardando';
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerenciar posição na fila
DROP TRIGGER IF EXISTS trigger_manage_fila_position ON lista_espera_idosos;
CREATE TRIGGER trigger_manage_fila_position
    BEFORE INSERT OR UPDATE ON lista_espera_idosos
    FOR EACH ROW
    EXECUTE FUNCTION manage_fila_position();

-- Habilitar RLS (Row Level Security)
ALTER TABLE lista_espera_idosos ENABLE ROW LEVEL SECURITY;

-- Política RLS para permitir acesso apenas a usuários autenticados
CREATE POLICY "Permitir acesso a usuários autenticados" ON lista_espera_idosos
    FOR ALL USING (auth.role() = 'authenticated');

-- Comentários na tabela
COMMENT ON TABLE lista_espera_idosos IS 'Tabela para gerenciar lista de espera de idosos aguardando vaga na instituição';
COMMENT ON COLUMN lista_espera_idosos.posicao_fila IS 'Posição do idoso na fila de espera (gerenciada automaticamente)';
COMMENT ON COLUMN lista_espera_idosos.status IS 'Status do idoso na lista: aguardando, contatado, transferido, cancelado';