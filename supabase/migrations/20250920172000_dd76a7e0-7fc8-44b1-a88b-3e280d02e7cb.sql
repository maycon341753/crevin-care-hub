-- Criação das tabelas principais do sistema CREVIN

-- 1. Tabela de profiles para dados adicionais dos usuários  
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'developer')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Tabela de departamentos
CREATE TABLE public.departamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir departamentos padrão
INSERT INTO public.departamentos (nome, descricao) VALUES
('Cozinha', 'Departamento responsável pela alimentação'),
('Limpeza', 'Departamento de limpeza e higienização'),
('Cuidador', 'Cuidadores de idosos'),
('Lavanderia', 'Departamento de lavanderia'),
('Nutricionista', 'Departamento de nutrição'),
('Estagiários', 'Estagiários em diversas áreas'),
('Jovem Aprendiz', 'Programa Jovem Aprendiz'),
('Motorista', 'Departamento de transporte'),
('Pintor', 'Departamento de pintura e manutenção'),
('Jardinagem', 'Departamento de jardinagem'),
('Administradores', 'Departamento administrativo'),
('Diretoria', 'Diretoria da instituição'),
('Secretaria', 'Secretaria administrativa'),
('Enfermeira', 'Departamento de enfermagem'),
('Técnico de Enfermagem', 'Técnicos de enfermagem');

-- 3. Tabela de funcionários
CREATE TABLE public.funcionarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cpf TEXT NOT NULL UNIQUE,
  rg TEXT,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  cargo TEXT NOT NULL,
  departamento_id UUID NOT NULL REFERENCES public.departamentos(id),
  salario DECIMAL(10,2),
  data_admissao DATE NOT NULL,
  data_demissao DATE,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'ferias', 'afastado')),
  observacoes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Tabela de doações em dinheiro
CREATE TABLE public.doacoes_dinheiro (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  protocolo TEXT NOT NULL UNIQUE,
  doador_nome TEXT NOT NULL,
  doador_cpf TEXT NOT NULL,
  doador_telefone TEXT,
  doador_email TEXT,
  valor DECIMAL(10,2) NOT NULL,
  tipo_pagamento TEXT NOT NULL CHECK (tipo_pagamento IN ('PIX', 'Cartão', 'Dinheiro', 'Transferência')),
  data_doacao DATE NOT NULL DEFAULT CURRENT_DATE,
  observacoes TEXT,
  recibo_gerado BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Tabela de doações de itens
CREATE TABLE public.doacoes_itens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  protocolo TEXT NOT NULL UNIQUE,
  doador_nome TEXT NOT NULL,
  doador_cpf TEXT NOT NULL,
  doador_telefone TEXT,
  item_nome TEXT NOT NULL,
  quantidade TEXT NOT NULL, -- Permite "2kg", "50 unidades", etc.
  categoria TEXT,
  data_doacao DATE NOT NULL DEFAULT CURRENT_DATE,
  observacoes TEXT,
  guia_gerada BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Tabela de idosos
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
  observacoes_saude TEXT,
  medicamentos TEXT,
  restricoes_nutricionais TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. Tabela de logs de auditoria
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS (Row Level Security) em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doacoes_dinheiro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doacoes_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idosos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Usuários podem ver seus próprios perfis" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios perfis" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios perfis" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para departamentos (todos podem ver, apenas admins podem modificar)
CREATE POLICY "Todos podem ver departamentos" 
ON public.departamentos FOR SELECT 
USING (true);

CREATE POLICY "Apenas admins podem inserir departamentos" 
ON public.departamentos FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'developer')
));

CREATE POLICY "Apenas admins podem atualizar departamentos" 
ON public.departamentos FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'developer')
));

-- Políticas RLS para funcionários (usuários autenticados podem ver, apenas admins podem modificar)
CREATE POLICY "Usuários autenticados podem ver funcionários" 
ON public.funcionarios FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Apenas admins podem inserir funcionários" 
ON public.funcionarios FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'developer')
));

CREATE POLICY "Apenas admins podem atualizar funcionários" 
ON public.funcionarios FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'developer')
));

CREATE POLICY "Apenas developers podem excluir funcionários" 
ON public.funcionarios FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND role = 'developer'
));

-- Políticas RLS para doações (usuários autenticados podem ver, apenas admins podem modificar)
CREATE POLICY "Usuários autenticados podem ver doações dinheiro" 
ON public.doacoes_dinheiro FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Apenas admins podem inserir doações dinheiro" 
ON public.doacoes_dinheiro FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'developer')
));

CREATE POLICY "Apenas admins podem atualizar doações dinheiro" 
ON public.doacoes_dinheiro FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'developer')
));

CREATE POLICY "Apenas developers podem excluir doações dinheiro" 
ON public.doacoes_dinheiro FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND role = 'developer'
));

-- Políticas similares para doações de itens
CREATE POLICY "Usuários autenticados podem ver doações itens" 
ON public.doacoes_itens FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Apenas admins podem inserir doações itens" 
ON public.doacoes_itens FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'developer')
));

CREATE POLICY "Apenas admins podem atualizar doações itens" 
ON public.doacoes_itens FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'developer')
));

CREATE POLICY "Apenas developers podem excluir doações itens" 
ON public.doacoes_itens FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND role = 'developer'
));

-- Políticas RLS para idosos
CREATE POLICY "Usuários autenticados podem ver idosos" 
ON public.idosos FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Apenas admins podem inserir idosos" 
ON public.idosos FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'developer')
));

CREATE POLICY "Apenas admins podem atualizar idosos" 
ON public.idosos FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'developer')
));

CREATE POLICY "Apenas developers podem excluir idosos" 
ON public.idosos FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND role = 'developer'
));

-- Políticas RLS para audit logs (apenas developers podem ver)
CREATE POLICY "Apenas developers podem ver logs de auditoria" 
ON public.audit_logs FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND role = 'developer'
));

CREATE POLICY "Sistema pode inserir logs de auditoria" 
ON public.audit_logs FOR INSERT 
WITH CHECK (true);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_departamentos_updated_at
  BEFORE UPDATE ON public.departamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_funcionarios_updated_at
  BEFORE UPDATE ON public.funcionarios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_doacoes_dinheiro_updated_at
  BEFORE UPDATE ON public.doacoes_dinheiro
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_doacoes_itens_updated_at
  BEFORE UPDATE ON public.doacoes_itens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_idosos_updated_at
  BEFORE UPDATE ON public.idosos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para gerar protocolos automáticos
CREATE OR REPLACE FUNCTION public.generate_protocolo_dinheiro()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
  current_year TEXT;
BEGIN
  current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(protocolo FROM 1 FOR 3) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.doacoes_dinheiro
  WHERE protocolo LIKE '%-' || current_year;
  
  NEW.protocolo := LPAD(next_number::TEXT, 3, '0') || '-' || current_year;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.generate_protocolo_itens()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
  current_date TEXT;
BEGIN
  current_date := TO_CHAR(CURRENT_DATE, 'DDMMYYYY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(protocolo FROM 1 FOR 3) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.doacoes_itens
  WHERE protocolo LIKE '%' || current_date;
  
  NEW.protocolo := LPAD(next_number::TEXT, 3, '0') || current_date;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para gerar protocolos automaticamente
CREATE TRIGGER generate_protocolo_doacoes_dinheiro
  BEFORE INSERT ON public.doacoes_dinheiro
  FOR EACH ROW
  WHEN (NEW.protocolo IS NULL OR NEW.protocolo = '')
  EXECUTE FUNCTION public.generate_protocolo_dinheiro();

CREATE TRIGGER generate_protocolo_doacoes_itens
  BEFORE INSERT ON public.doacoes_itens
  FOR EACH ROW
  WHEN (NEW.protocolo IS NULL OR NEW.protocolo = '')
  EXECUTE FUNCTION public.generate_protocolo_itens();

-- Índices para melhor performance
CREATE INDEX idx_funcionarios_departamento ON public.funcionarios(departamento_id);
CREATE INDEX idx_funcionarios_status ON public.funcionarios(status);
CREATE INDEX idx_funcionarios_cpf ON public.funcionarios(cpf);
CREATE INDEX idx_doacoes_dinheiro_data ON public.doacoes_dinheiro(data_doacao);
CREATE INDEX idx_doacoes_dinheiro_protocolo ON public.doacoes_dinheiro(protocolo);
CREATE INDEX idx_doacoes_itens_data ON public.doacoes_itens(data_doacao);
CREATE INDEX idx_doacoes_itens_protocolo ON public.doacoes_itens(protocolo);
CREATE INDEX idx_idosos_cpf ON public.idosos(cpf);
CREATE INDEX idx_idosos_status ON public.idosos(status);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);