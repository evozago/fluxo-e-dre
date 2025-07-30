export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      ap_installments: {
        Row: {
          banco: string | null
          categoria: string | null
          comprovante_path: string | null
          created_at: string
          data_pagamento: string | null
          data_vencimento: string
          descricao: string
          eh_recorrente: boolean | null
          entidade_id: string
          forma_pagamento: string | null
          fornecedor: string
          id: string
          nfe_id: string | null
          numero_documento: string | null
          numero_parcela: number | null
          observacoes: string | null
          status: string
          tipo_recorrencia: string | null
          total_parcelas: number | null
          updated_at: string
          valor: number
          valor_fixo: boolean | null
          valor_total_titulo: number | null
        }
        Insert: {
          banco?: string | null
          categoria?: string | null
          comprovante_path?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento: string
          descricao: string
          eh_recorrente?: boolean | null
          entidade_id: string
          forma_pagamento?: string | null
          fornecedor: string
          id?: string
          nfe_id?: string | null
          numero_documento?: string | null
          numero_parcela?: number | null
          observacoes?: string | null
          status?: string
          tipo_recorrencia?: string | null
          total_parcelas?: number | null
          updated_at?: string
          valor: number
          valor_fixo?: boolean | null
          valor_total_titulo?: number | null
        }
        Update: {
          banco?: string | null
          categoria?: string | null
          comprovante_path?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string
          descricao?: string
          eh_recorrente?: boolean | null
          entidade_id?: string
          forma_pagamento?: string | null
          fornecedor?: string
          id?: string
          nfe_id?: string | null
          numero_documento?: string | null
          numero_parcela?: number | null
          observacoes?: string | null
          status?: string
          tipo_recorrencia?: string | null
          total_parcelas?: number | null
          updated_at?: string
          valor?: number
          valor_fixo?: boolean | null
          valor_total_titulo?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ap_installments_entidade_id_fkey"
            columns: ["entidade_id"]
            isOneToOne: false
            referencedRelation: "entidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ap_installments_nfe_id_fkey"
            columns: ["nfe_id"]
            isOneToOne: false
            referencedRelation: "nfe_data"
            referencedColumns: ["id"]
          },
        ]
      }
      config_vendas: {
        Row: {
          created_at: string
          dias_uteis_considerados: string | null
          id: string
          meta_loja_mensal: number | null
          observacoes: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          dias_uteis_considerados?: string | null
          id?: string
          meta_loja_mensal?: number | null
          observacoes?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          dias_uteis_considerados?: string | null
          id?: string
          meta_loja_mensal?: number | null
          observacoes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      entidades: {
        Row: {
          ativo: boolean
          cnpj_cpf: string | null
          created_at: string
          id: string
          nome: string
          razao_social: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cnpj_cpf?: string | null
          created_at?: string
          id?: string
          nome: string
          razao_social?: string | null
          tipo: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cnpj_cpf?: string | null
          created_at?: string
          id?: string
          nome?: string
          razao_social?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      fornecedores: {
        Row: {
          ativo: boolean
          cnpj_cpf: string | null
          created_at: string
          email: string | null
          endereco: string | null
          id: string
          nome: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cnpj_cpf?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          nome: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cnpj_cpf?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      meios_pagamento_vendas: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      metas_mensais: {
        Row: {
          ano: number
          comissao_calculada: number | null
          created_at: string
          id: string
          mes: number
          meta_valor: number
          supermeta_valor: number | null
          updated_at: string
          vendas_realizadas: number | null
          vendedora_id: string
        }
        Insert: {
          ano: number
          comissao_calculada?: number | null
          created_at?: string
          id?: string
          mes: number
          meta_valor: number
          supermeta_valor?: number | null
          updated_at?: string
          vendas_realizadas?: number | null
          vendedora_id: string
        }
        Update: {
          ano?: number
          comissao_calculada?: number | null
          created_at?: string
          id?: string
          mes?: number
          meta_valor?: number
          supermeta_valor?: number | null
          updated_at?: string
          vendas_realizadas?: number | null
          vendedora_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "metas_mensais_vendedora_id_fkey"
            columns: ["vendedora_id"]
            isOneToOne: false
            referencedRelation: "vendedoras"
            referencedColumns: ["id"]
          },
        ]
      }
      nfe_data: {
        Row: {
          chave_acesso: string
          cnpj_destinatario: string | null
          cnpj_emitente: string
          created_at: string
          data_emissao: string
          id: string
          nome_destinatario: string | null
          nome_emitente: string
          numero_nfe: string
          serie: string
          updated_at: string
          valor_cofins: number | null
          valor_icms: number | null
          valor_ipi: number | null
          valor_pis: number | null
          valor_total: number
          xml_content: string
        }
        Insert: {
          chave_acesso: string
          cnpj_destinatario?: string | null
          cnpj_emitente: string
          created_at?: string
          data_emissao: string
          id?: string
          nome_destinatario?: string | null
          nome_emitente: string
          numero_nfe: string
          serie: string
          updated_at?: string
          valor_cofins?: number | null
          valor_icms?: number | null
          valor_ipi?: number | null
          valor_pis?: number | null
          valor_total: number
          xml_content: string
        }
        Update: {
          chave_acesso?: string
          cnpj_destinatario?: string | null
          cnpj_emitente?: string
          created_at?: string
          data_emissao?: string
          id?: string
          nome_destinatario?: string | null
          nome_emitente?: string
          numero_nfe?: string
          serie?: string
          updated_at?: string
          valor_cofins?: number | null
          valor_icms?: number | null
          valor_ipi?: number | null
          valor_pis?: number | null
          valor_total?: number
          xml_content?: string
        }
        Relationships: []
      }
      representantes_contatos: {
        Row: {
          ativo: boolean
          created_at: string
          email: string
          fornecedor_id: string
          id: string
          marcas: string | null
          nome_representante: string
          observacoes: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          email: string
          fornecedor_id: string
          id?: string
          marcas?: string | null
          nome_representante: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          email?: string
          fornecedor_id?: string
          id?: string
          marcas?: string | null
          nome_representante?: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "representantes_contatos_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      vendas: {
        Row: {
          cliente_nome: string | null
          created_at: string
          data_venda: string
          forma_pagamento: string | null
          id: string
          observacoes: string | null
          updated_at: string
          valor_venda: number
          vendedora_id: string
        }
        Insert: {
          cliente_nome?: string | null
          created_at?: string
          data_venda: string
          forma_pagamento?: string | null
          id?: string
          observacoes?: string | null
          updated_at?: string
          valor_venda: number
          vendedora_id: string
        }
        Update: {
          cliente_nome?: string | null
          created_at?: string
          data_venda?: string
          forma_pagamento?: string | null
          id?: string
          observacoes?: string | null
          updated_at?: string
          valor_venda?: number
          vendedora_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendas_vendedora_id_fkey"
            columns: ["vendedora_id"]
            isOneToOne: false
            referencedRelation: "vendedoras"
            referencedColumns: ["id"]
          },
        ]
      }
      vendedoras: {
        Row: {
          ativo: boolean
          comissao_padrao: number | null
          comissao_supermeta: number | null
          created_at: string
          email: string | null
          id: string
          meta_mensal: number | null
          nome: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          comissao_padrao?: number | null
          comissao_supermeta?: number | null
          created_at?: string
          email?: string | null
          id?: string
          meta_mensal?: number | null
          nome: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          comissao_padrao?: number | null
          comissao_supermeta?: number | null
          created_at?: string
          email?: string | null
          id?: string
          meta_mensal?: number | null
          nome?: string
          telefone?: string | null
          updated_at?: string
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
