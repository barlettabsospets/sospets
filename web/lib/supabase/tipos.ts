export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      administradores: {
        Row: {
          ativo: boolean
          atualizado_em: string
          criado_em: string
          nome: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          nome: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          nome?: string
          user_id?: string
        }
        Relationships: []
      }
      campanhas: {
        Row: {
          atualizado_em: string
          criado_em: string
          descricao: string | null
          foto_path: string | null
          id: string
          inicio: string
          meta: number | null
          nome: string
          situacao: Database["public"]["Enums"]["situacao_campanha"]
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          descricao?: string | null
          foto_path?: string | null
          id?: string
          inicio: string
          meta?: number | null
          nome: string
          situacao?: Database["public"]["Enums"]["situacao_campanha"]
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          descricao?: string | null
          foto_path?: string | null
          id?: string
          inicio?: string
          meta?: number | null
          nome?: string
          situacao?: Database["public"]["Enums"]["situacao_campanha"]
        }
        Relationships: []
      }
      categorias: {
        Row: {
          ativa: boolean
          atualizado_em: string
          cor: string
          criado_em: string
          id: string
          nome: string
          ordem: number
        }
        Insert: {
          ativa?: boolean
          atualizado_em?: string
          cor?: string
          criado_em?: string
          id?: string
          nome: string
          ordem?: number
        }
        Update: {
          ativa?: boolean
          atualizado_em?: string
          cor?: string
          criado_em?: string
          id?: string
          nome?: string
          ordem?: number
        }
        Relationships: []
      }
      configuracoes: {
        Row: {
          atualizado_em: string
          aviso_meses: number
          criado_em: string
          dados_desde: string
          id: string
          unica: boolean
          valor_padrao: number
        }
        Insert: {
          atualizado_em?: string
          aviso_meses?: number
          criado_em?: string
          dados_desde: string
          id?: string
          unica?: boolean
          valor_padrao?: number
        }
        Update: {
          atualizado_em?: string
          aviso_meses?: number
          criado_em?: string
          dados_desde?: string
          id?: string
          unica?: boolean
          valor_padrao?: number
        }
        Relationships: []
      }
      contribuicoes: {
        Row: {
          atualizado_em: string
          campanha_id: string | null
          cancelada_em: string | null
          competencia: string
          criado_em: string
          criado_por: string | null
          id: string
          membro_id: string | null
          motivo_cancelamento: string | null
          nome_avulso: string | null
          valor: number
        }
        Insert: {
          atualizado_em?: string
          campanha_id?: string | null
          cancelada_em?: string | null
          competencia: string
          criado_em?: string
          criado_por?: string | null
          id?: string
          membro_id?: string | null
          motivo_cancelamento?: string | null
          nome_avulso?: string | null
          valor: number
        }
        Update: {
          atualizado_em?: string
          campanha_id?: string | null
          cancelada_em?: string | null
          competencia?: string
          criado_em?: string
          criado_por?: string | null
          id?: string
          membro_id?: string | null
          motivo_cancelamento?: string | null
          nome_avulso?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "contribuicoes_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contribuicoes_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "pub_campanhas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contribuicoes_membro_id_fkey"
            columns: ["membro_id"]
            isOneToOne: false
            referencedRelation: "membros"
            referencedColumns: ["id"]
          },
        ]
      }
      despesas: {
        Row: {
          atualizado_em: string
          campanha_id: string | null
          cancelada_em: string | null
          categoria_id: string
          criado_em: string
          criado_por: string | null
          data: string
          descricao: string
          id: string
          motivo_cancelamento: string | null
          pet_id: string | null
          valor: number
        }
        Insert: {
          atualizado_em?: string
          campanha_id?: string | null
          cancelada_em?: string | null
          categoria_id: string
          criado_em?: string
          criado_por?: string | null
          data: string
          descricao: string
          id?: string
          motivo_cancelamento?: string | null
          pet_id?: string | null
          valor: number
        }
        Update: {
          atualizado_em?: string
          campanha_id?: string | null
          cancelada_em?: string | null
          categoria_id?: string
          criado_em?: string
          criado_por?: string | null
          data?: string
          descricao?: string
          id?: string
          motivo_cancelamento?: string | null
          pet_id?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "despesas_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "despesas_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "pub_campanhas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "despesas_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "despesas_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "pub_gasto_categoria_mes"
            referencedColumns: ["categoria_id"]
          },
          {
            foreignKeyName: "despesas_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "despesas_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pub_pets"
            referencedColumns: ["id"]
          },
        ]
      }
      historico: {
        Row: {
          acao: Database["public"]["Enums"]["acao_historico"]
          antes: Json | null
          depois: Json | null
          id: string
          quando: string
          registro_id: string
          resumo: string
          tabela: string
          user_id: string | null
        }
        Insert: {
          acao: Database["public"]["Enums"]["acao_historico"]
          antes?: Json | null
          depois?: Json | null
          id?: string
          quando?: string
          registro_id: string
          resumo: string
          tabela: string
          user_id?: string | null
        }
        Update: {
          acao?: Database["public"]["Enums"]["acao_historico"]
          antes?: Json | null
          depois?: Json | null
          id?: string
          quando?: string
          registro_id?: string
          resumo?: string
          tabela?: string
          user_id?: string | null
        }
        Relationships: []
      }
      membros: {
        Row: {
          ativo: boolean
          atualizado_em: string
          criado_em: string
          id: string
          nome: string
          valor_mensal: number | null
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          id?: string
          nome: string
          valor_mensal?: number | null
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          id?: string
          nome?: string
          valor_mensal?: number | null
        }
        Relationships: []
      }
      pets: {
        Row: {
          adotado_em: string | null
          atualizado_em: string
          castrado: Database["public"]["Enums"]["castracao"]
          castrado_em: string | null
          criado_em: string
          entrou_em: string
          especie: Database["public"]["Enums"]["especie_pet"]
          faixa_idade: Database["public"]["Enums"]["faixa_idade"]
          fiv_felv_testado: boolean
          foto_path: string | null
          id: string
          lar_em: string | null
          local: string | null
          necessidade: string | null
          nome: string
          obito_em: string | null
          oculto: boolean
          pelagem: string | null
          precisa_lar: boolean
          sexo: Database["public"]["Enums"]["sexo_pet"]
          vacinado: boolean
          vermifugado: boolean
        }
        Insert: {
          adotado_em?: string | null
          atualizado_em?: string
          castrado?: Database["public"]["Enums"]["castracao"]
          castrado_em?: string | null
          criado_em?: string
          entrou_em: string
          especie: Database["public"]["Enums"]["especie_pet"]
          faixa_idade: Database["public"]["Enums"]["faixa_idade"]
          fiv_felv_testado?: boolean
          foto_path?: string | null
          id?: string
          lar_em?: string | null
          local?: string | null
          necessidade?: string | null
          nome: string
          obito_em?: string | null
          oculto?: boolean
          pelagem?: string | null
          precisa_lar?: boolean
          sexo: Database["public"]["Enums"]["sexo_pet"]
          vacinado?: boolean
          vermifugado?: boolean
        }
        Update: {
          adotado_em?: string | null
          atualizado_em?: string
          castrado?: Database["public"]["Enums"]["castracao"]
          castrado_em?: string | null
          criado_em?: string
          entrou_em?: string
          especie?: Database["public"]["Enums"]["especie_pet"]
          faixa_idade?: Database["public"]["Enums"]["faixa_idade"]
          fiv_felv_testado?: boolean
          foto_path?: string | null
          id?: string
          lar_em?: string | null
          local?: string | null
          necessidade?: string | null
          nome?: string
          obito_em?: string | null
          oculto?: boolean
          pelagem?: string | null
          precisa_lar?: boolean
          sexo?: Database["public"]["Enums"]["sexo_pet"]
          vacinado?: boolean
          vermifugado?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      pub_campanhas: {
        Row: {
          arrecadado: number | null
          descricao: string | null
          foto_path: string | null
          gasto: number | null
          id: string | null
          inicio: string | null
          meta: number | null
          nome: string | null
          situacao: Database["public"]["Enums"]["situacao_campanha"] | null
        }
        Insert: {
          arrecadado?: never
          descricao?: string | null
          foto_path?: string | null
          gasto?: never
          id?: string | null
          inicio?: string | null
          meta?: number | null
          nome?: string | null
          situacao?: Database["public"]["Enums"]["situacao_campanha"] | null
        }
        Update: {
          arrecadado?: never
          descricao?: string | null
          foto_path?: string | null
          gasto?: never
          id?: string | null
          inicio?: string | null
          meta?: number | null
          nome?: string | null
          situacao?: Database["public"]["Enums"]["situacao_campanha"] | null
        }
        Relationships: []
      }
      pub_config: {
        Row: {
          dados_desde: string | null
        }
        Insert: {
          dados_desde?: string | null
        }
        Update: {
          dados_desde?: string | null
        }
        Relationships: []
      }
      pub_despesas: {
        Row: {
          campanha_id: string | null
          categoria: string | null
          cor: string | null
          data: string | null
          descricao: string | null
          especie: Database["public"]["Enums"]["especie_pet"] | null
          id: string | null
          pet: string | null
          pet_id: string | null
          valor: number | null
        }
        Relationships: [
          {
            foreignKeyName: "despesas_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "despesas_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "pub_campanhas"
            referencedColumns: ["id"]
          },
        ]
      }
      pub_gasto_categoria_mes: {
        Row: {
          categoria: string | null
          categoria_id: string | null
          cor: string | null
          mes: string | null
          ordem: number | null
          total: number | null
        }
        Relationships: []
      }
      pub_pets: {
        Row: {
          adotado_em: string | null
          castrado: Database["public"]["Enums"]["castracao"] | null
          castrado_em: string | null
          criado_em: string | null
          entrou_em: string | null
          especie: Database["public"]["Enums"]["especie_pet"] | null
          faixa_idade: Database["public"]["Enums"]["faixa_idade"] | null
          fiv_felv_testado: boolean | null
          foto_path: string | null
          id: string | null
          lar_em: string | null
          necessidade: string | null
          nome: string | null
          obito_em: string | null
          pelagem: string | null
          precisa_lar: boolean | null
          sexo: Database["public"]["Enums"]["sexo_pet"] | null
          vacinado: boolean | null
          vermifugado: boolean | null
        }
        Insert: {
          adotado_em?: string | null
          castrado?: Database["public"]["Enums"]["castracao"] | null
          castrado_em?: string | null
          criado_em?: string | null
          entrou_em?: string | null
          especie?: Database["public"]["Enums"]["especie_pet"] | null
          faixa_idade?: Database["public"]["Enums"]["faixa_idade"] | null
          fiv_felv_testado?: boolean | null
          foto_path?: string | null
          id?: string | null
          lar_em?: string | null
          necessidade?: string | null
          nome?: string | null
          obito_em?: string | null
          pelagem?: string | null
          precisa_lar?: boolean | null
          sexo?: Database["public"]["Enums"]["sexo_pet"] | null
          vacinado?: boolean | null
          vermifugado?: boolean | null
        }
        Update: {
          adotado_em?: string | null
          castrado?: Database["public"]["Enums"]["castracao"] | null
          castrado_em?: string | null
          criado_em?: string | null
          entrou_em?: string | null
          especie?: Database["public"]["Enums"]["especie_pet"] | null
          faixa_idade?: Database["public"]["Enums"]["faixa_idade"] | null
          fiv_felv_testado?: boolean | null
          foto_path?: string | null
          id?: string | null
          lar_em?: string | null
          necessidade?: string | null
          nome?: string | null
          obito_em?: string | null
          pelagem?: string | null
          precisa_lar?: boolean | null
          sexo?: Database["public"]["Enums"]["sexo_pet"] | null
          vacinado?: boolean | null
          vermifugado?: boolean | null
        }
        Relationships: []
      }
      pub_resumo_mensal: {
        Row: {
          contribuicoes: number | null
          despesas: number | null
          entrou: number | null
          mes: string | null
          saiu: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      eh_admin: { Args: never; Returns: boolean }
      eh_inicio_do_mes: { Args: { d: string }; Returns: boolean }
      resumo_historico: {
        Args: {
          acao: Database["public"]["Enums"]["acao_historico"]
          antes: Json
          depois: Json
          tabela: string
        }
        Returns: string
      }
      situacao_pet: {
        Args: { mes: string; p: Database["public"]["Tables"]["pets"]["Row"] }
        Returns: string
      }
    }
    Enums: {
      acao_historico: "criou" | "alterou" | "cancelou"
      castracao: "sim" | "nao" | "nao_sei"
      especie_pet: "cachorro" | "gato"
      faixa_idade: "filhote" | "adulto"
      sexo_pet: "f" | "m"
      situacao_campanha: "em_andamento" | "encerrada"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      acao_historico: ["criou", "alterou", "cancelou"],
      castracao: ["sim", "nao", "nao_sei"],
      especie_pet: ["cachorro", "gato"],
      faixa_idade: ["filhote", "adulto"],
      sexo_pet: ["f", "m"],
      situacao_campanha: ["em_andamento", "encerrada"],
    },
  },
} as const
