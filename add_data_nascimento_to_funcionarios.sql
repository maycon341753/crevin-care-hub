-- Adicionar campo data_nascimento na tabela funcionarios
ALTER TABLE funcionarios 
ADD COLUMN IF NOT EXISTS data_nascimento DATE;

-- Comentário para documentar a alteração
COMMENT ON COLUMN funcionarios.data_nascimento IS 'Data de nascimento do funcionário para controle de aniversários';