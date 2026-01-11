// Tipos globais da aplicação

export interface Idoso {
  id: string;
  nome: string;
  cpf: string;
  rg: string | null;
  data_nascimento: string;
  telefone: string | null;
  endereco: string | null;
  contato_emergencia: string | null;
  observacoes_medicas: string | null;
  beneficio_tipo?: 'aposentadoria' | 'loas' | 'bpc' | null;
  beneficio_valor?: number | null;
  contribuicao_percentual?: number | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Funcionario {
  id: string;
  nome: string;
  cpf: string;
  rg?: string | null;
  telefone?: string | null;
  email?: string | null;
  endereco?: string | null;
  cargo: string;
  departamento_id: string;
  salario?: number | null;
  data_admissao: string;
  data_demissao?: string | null;
  status: 'ativo' | 'inativo' | 'ferias' | 'afastado';
  observacoes?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  departamento?: Departamento;
}

export interface Departamento {
  id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  _count?: {
    funcionarios: number;
  };
}

export interface DoacaoDinheiro {
  id: string;
  protocolo: string;
  doador_nome: string;
  doador_cpf: string;
  doador_telefone?: string | null;
  doador_email?: string | null;
  valor: number;
  tipo_pagamento: 'PIX' | 'Cartão' | 'Dinheiro' | 'Transferência';
  data_doacao: string;
  observacoes?: string | null;
  recibo_gerado: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DoacaoItem {
  id: string;
  protocolo: string;
  doador_nome: string;
  doador_cpf: string;
  doador_telefone?: string | null;
  item_nome: string;
  quantidade: string;
  categoria?: string | null;
  data_doacao: string;
  observacoes?: string | null;
  guia_gerada: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  role: 'user' | 'admin' | 'developer';
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  operation: string;
  table_name: string;
  record_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  profiles?: {
    full_name: string | null;
  };
}
