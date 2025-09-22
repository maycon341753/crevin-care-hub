export interface Quarto {
  id: string;
  numero: string;
  tipo: 'individual' | 'duplo' | 'coletivo' | 'quarto';
  capacidade: number;
  ocupacao_atual: number;
  status: 'disponivel' | 'ocupado' | 'manutencao' | 'reservado';
  andar?: number;
  ala: string;
  descricao?: string;
  observacoes?: string;
  valor_mensal?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateQuartoData {
  numero: string;
  tipo: 'individual' | 'duplo' | 'coletivo' | 'quarto';
  capacidade: number;
  ala: string;
  andar?: number;
  descricao?: string;
  observacoes?: string;
  valor_mensal?: number;
}

export interface UpdateQuartoData extends Partial<CreateQuartoData> {
  ocupacao_atual?: number;
  status?: 'disponivel' | 'ocupado' | 'manutencao' | 'reservado';
}