export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      audit_logs: {
        Row: {
          id: string
          table_name: string
          operation: string
          old_data: Json | null
          new_data: Json | null
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          table_name: string
          operation: string
          old_data?: Json | null
          new_data?: Json | null
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          table_name?: string
          operation?: string
          old_data?: Json | null
          new_data?: Json | null
          user_id?: string
          created_at?: string
        }
        Relationships: []
      }
      departamentos: {
        Row: {
          id: string
          nome: string
          descricao: string | null
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          descricao?: string | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          descricao?: string | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      funcionarios: {
        Row: {
          id: string
          nome: string
          cpf: string
          rg: string | null
          telefone: string | null
          email: string | null
          endereco: string | null
          cargo: string
          departamento_id: string
          salario: number | null
          data_admissao: string
          data_demissao: string | null
          status: "ativo" | "inativo" | "ferias" | "afastado"
          observacoes: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          cpf: string
          rg?: string | null
          telefone?: string | null
          email?: string | null
          endereco?: string | null
          cargo: string
          departamento_id: string
          salario?: number | null
          data_admissao: string
          data_demissao?: string | null
          status?: "ativo" | "inativo" | "ferias" | "afastado"
          observacoes?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          cpf?: string
          rg?: string | null
          telefone?: string | null
          email?: string | null
          endereco?: string | null
          cargo?: string
          departamento_id?: string
          salario?: number | null
          data_admissao?: string
          data_demissao?: string | null
          status?: "ativo" | "inativo" | "ferias" | "afastado"
          observacoes?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "funcionarios_departamento_id_fkey"
            columns: ["departamento_id"]
            isOneToOne: false
            referencedRelation: "departamentos"
            referencedColumns: ["id"]
          }
        ]
      }
      doacoes: {
        Row: {
          id: string
          tipo: "dinheiro" | "item"
          valor: number | null
          descricao: string
          doador_nome: string | null
          doador_contato: string | null
          data_doacao: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tipo: "dinheiro" | "item"
          valor?: number | null
          descricao: string
          doador_nome?: string | null
          doador_contato?: string | null
          data_doacao: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tipo?: "dinheiro" | "item"
          valor?: number | null
          descricao?: string
          doador_nome?: string | null
          doador_contato?: string | null
          data_doacao?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      idosos: {
        Row: {
          id: string
          nome: string
          cpf: string
          rg: string | null
          data_nascimento: string
          telefone: string | null
          endereco: string | null
          contato_emergencia: string | null
          observacoes_medicas: string | null
          beneficio_tipo: 'aposentadoria' | 'loas' | 'bpc' | null
          beneficio_valor: number | null
          contribuicao_percentual: number | null
          ativo: boolean
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          cpf: string
          rg?: string | null
          data_nascimento: string
          telefone?: string | null
          endereco?: string | null
          contato_emergencia?: string | null
          observacoes_medicas?: string | null
          beneficio_tipo?: 'aposentadoria' | 'loas' | 'bpc' | null
          beneficio_valor?: number | null
          contribuicao_percentual?: number | null
          ativo?: boolean
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          cpf?: string
          rg?: string | null
          data_nascimento?: string
          telefone?: string | null
          endereco?: string | null
          contato_emergencia?: string | null
          observacoes_medicas?: string | null
          beneficio_tipo?: 'aposentadoria' | 'loas' | 'bpc' | null
          beneficio_valor?: number | null
          contribuicao_percentual?: number | null
          ativo?: boolean
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const