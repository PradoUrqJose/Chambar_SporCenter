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
    PostgrestVersion: "14.5"
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
      asignaciones: {
        Row: {
          created_at: string
          empresa_id: string
          usuario_id: string
        }
        Insert: {
          created_at?: string
          empresa_id: string
          usuario_id: string
        }
        Update: {
          created_at?: string
          empresa_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asignaciones_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asignaciones_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cajas: {
        Row: {
          activa: boolean
          created_at: string
          empresa_id: string
          id: string
          nombre: string
          tipo: Database["public"]["Enums"]["tipo_caja"]
        }
        Insert: {
          activa?: boolean
          created_at?: string
          empresa_id: string
          id?: string
          nombre: string
          tipo: Database["public"]["Enums"]["tipo_caja"]
        }
        Update: {
          activa?: boolean
          created_at?: string
          empresa_id?: string
          id?: string
          nombre?: string
          tipo?: Database["public"]["Enums"]["tipo_caja"]
        }
        Relationships: [
          {
            foreignKeyName: "cajas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias: {
        Row: {
          activa: boolean
          color: string | null
          descripcion: string | null
          icono: string | null
          id: string
          nombre: string
          tipo: Database["public"]["Enums"]["tipo_movimiento"]
        }
        Insert: {
          activa?: boolean
          color?: string | null
          descripcion?: string | null
          icono?: string | null
          id?: string
          nombre: string
          tipo: Database["public"]["Enums"]["tipo_movimiento"]
        }
        Update: {
          activa?: boolean
          color?: string | null
          descripcion?: string | null
          icono?: string | null
          id?: string
          nombre?: string
          tipo?: Database["public"]["Enums"]["tipo_movimiento"]
        }
        Relationships: []
      }
      empresas: {
        Row: {
          activa: boolean
          color: string | null
          created_at: string
          id: string
          nombre: string
          ruc: string | null
        }
        Insert: {
          activa?: boolean
          color?: string | null
          created_at?: string
          id?: string
          nombre: string
          ruc?: string | null
        }
        Update: {
          activa?: boolean
          color?: string | null
          created_at?: string
          id?: string
          nombre?: string
          ruc?: string | null
        }
        Relationships: []
      }
      movimientos: {
        Row: {
          anulado_at: string | null
          anulado_por: string | null
          caja_id: string
          categoria_id: string | null
          comprobante_url: string | null
          creado_por: string
          descripcion: string | null
          fecha: string
          id: string
          monto: number
          motivo_anulacion: string | null
          sesion_id: string
          stand_id: string | null
          tipo: Database["public"]["Enums"]["tipo_movimiento"]
          transferencia_id: string | null
        }
        Insert: {
          anulado_at?: string | null
          anulado_por?: string | null
          caja_id: string
          categoria_id?: string | null
          comprobante_url?: string | null
          creado_por: string
          descripcion?: string | null
          fecha?: string
          id?: string
          monto: number
          motivo_anulacion?: string | null
          sesion_id: string
          stand_id?: string | null
          tipo: Database["public"]["Enums"]["tipo_movimiento"]
          transferencia_id?: string | null
        }
        Update: {
          anulado_at?: string | null
          anulado_por?: string | null
          caja_id?: string
          categoria_id?: string | null
          comprobante_url?: string | null
          creado_por?: string
          descripcion?: string | null
          fecha?: string
          id?: string
          monto?: number
          motivo_anulacion?: string | null
          sesion_id?: string
          stand_id?: string | null
          tipo?: Database["public"]["Enums"]["tipo_movimiento"]
          transferencia_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "movimientos_anulado_por_fkey"
            columns: ["anulado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_caja_id_fkey"
            columns: ["caja_id"]
            isOneToOne: false
            referencedRelation: "cajas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_caja_id_fkey"
            columns: ["caja_id"]
            isOneToOne: false
            referencedRelation: "saldos_cajas"
            referencedColumns: ["caja_id"]
          },
          {
            foreignKeyName: "movimientos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_sesion_id_fkey"
            columns: ["sesion_id"]
            isOneToOne: false
            referencedRelation: "saldos_cajas"
            referencedColumns: ["sesion_abierta_id"]
          },
          {
            foreignKeyName: "movimientos_sesion_id_fkey"
            columns: ["sesion_id"]
            isOneToOne: false
            referencedRelation: "sesiones_caja"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_stand_id_fkey"
            columns: ["stand_id"]
            isOneToOne: false
            referencedRelation: "stands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_transferencia_id_fkey"
            columns: ["transferencia_id"]
            isOneToOne: false
            referencedRelation: "transferencias"
            referencedColumns: ["id"]
          },
        ]
      }
      perfiles: {
        Row: {
          activo: boolean
          created_at: string
          email: string
          id: string
          nombre: string
          rol_global: Database["public"]["Enums"]["rol_global"] | null
        }
        Insert: {
          activo?: boolean
          created_at?: string
          email: string
          id: string
          nombre: string
          rol_global?: Database["public"]["Enums"]["rol_global"] | null
        }
        Update: {
          activo?: boolean
          created_at?: string
          email?: string
          id?: string
          nombre?: string
          rol_global?: Database["public"]["Enums"]["rol_global"] | null
        }
        Relationships: []
      }
      sesiones_caja: {
        Row: {
          abierta_por: string
          apertura_at: string
          caja_id: string
          cerrada_por: string | null
          cierre_at: string | null
          diferencia: number | null
          id: string
          monto_apertura: number
          monto_contado: number | null
          monto_esperado: number | null
          observaciones_apertura: string | null
          observaciones_cierre: string | null
        }
        Insert: {
          abierta_por: string
          apertura_at?: string
          caja_id: string
          cerrada_por?: string | null
          cierre_at?: string | null
          diferencia?: number | null
          id?: string
          monto_apertura: number
          monto_contado?: number | null
          monto_esperado?: number | null
          observaciones_apertura?: string | null
          observaciones_cierre?: string | null
        }
        Update: {
          abierta_por?: string
          apertura_at?: string
          caja_id?: string
          cerrada_por?: string | null
          cierre_at?: string | null
          diferencia?: number | null
          id?: string
          monto_apertura?: number
          monto_contado?: number | null
          monto_esperado?: number | null
          observaciones_apertura?: string | null
          observaciones_cierre?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sesiones_caja_abierta_por_fkey"
            columns: ["abierta_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sesiones_caja_caja_id_fkey"
            columns: ["caja_id"]
            isOneToOne: false
            referencedRelation: "cajas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sesiones_caja_caja_id_fkey"
            columns: ["caja_id"]
            isOneToOne: false
            referencedRelation: "saldos_cajas"
            referencedColumns: ["caja_id"]
          },
          {
            foreignKeyName: "sesiones_caja_cerrada_por_fkey"
            columns: ["cerrada_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stands: {
        Row: {
          activo: boolean
          created_at: string
          empresa_id: string
          id: string
          nombre: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          empresa_id: string
          id?: string
          nombre: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          empresa_id?: string
          id?: string
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "stands_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      transferencias: {
        Row: {
          anulado_at: string | null
          anulado_por: string | null
          caja_destino_id: string
          caja_origen_id: string
          creado_por: string
          created_at: string
          descripcion: string | null
          id: string
          monto: number
          motivo_anulacion: string | null
        }
        Insert: {
          anulado_at?: string | null
          anulado_por?: string | null
          caja_destino_id: string
          caja_origen_id: string
          creado_por: string
          created_at?: string
          descripcion?: string | null
          id?: string
          monto: number
          motivo_anulacion?: string | null
        }
        Update: {
          anulado_at?: string | null
          anulado_por?: string | null
          caja_destino_id?: string
          caja_origen_id?: string
          creado_por?: string
          created_at?: string
          descripcion?: string | null
          id?: string
          monto?: number
          motivo_anulacion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transferencias_anulado_por_fkey"
            columns: ["anulado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transferencias_caja_destino_id_fkey"
            columns: ["caja_destino_id"]
            isOneToOne: false
            referencedRelation: "cajas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transferencias_caja_destino_id_fkey"
            columns: ["caja_destino_id"]
            isOneToOne: false
            referencedRelation: "saldos_cajas"
            referencedColumns: ["caja_id"]
          },
          {
            foreignKeyName: "transferencias_caja_origen_id_fkey"
            columns: ["caja_origen_id"]
            isOneToOne: false
            referencedRelation: "cajas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transferencias_caja_origen_id_fkey"
            columns: ["caja_origen_id"]
            isOneToOne: false
            referencedRelation: "saldos_cajas"
            referencedColumns: ["caja_id"]
          },
          {
            foreignKeyName: "transferencias_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      saldos_cajas: {
        Row: {
          abierta: boolean | null
          activa: boolean | null
          apertura_at: string | null
          caja_id: string | null
          empresa_id: string | null
          nombre: string | null
          saldo: number | null
          sesion_abierta_id: string | null
          tipo: Database["public"]["Enums"]["tipo_caja"] | null
        }
        Relationships: [
          {
            foreignKeyName: "cajas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      abrir_caja: {
        Args: {
          p_caja_id: string
          p_monto_apertura: number
          p_observaciones?: string
        }
        Returns: string
      }
      actualizar_mi_nombre: {
        Args: { p_nombre: string }
        Returns: {
          activo: boolean
          created_at: string
          email: string
          id: string
          nombre: string
          rol_global: Database["public"]["Enums"]["rol_global"] | null
        }
        SetofOptions: {
          from: "*"
          to: "perfiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      anular_movimiento: {
        Args: { p_motivo: string; p_movimiento_id: string }
        Returns: undefined
      }
      anular_transferencia: {
        Args: { p_motivo: string; p_transferencia_id: string }
        Returns: undefined
      }
      asignar_rol_usuario: {
        Args: {
          p_empresa_ids?: string[]
          p_rol_global: Database["public"]["Enums"]["rol_global"]
          p_usuario_id: string
        }
        Returns: undefined
      }
      cerrar_caja: {
        Args: {
          p_monto_contado: number
          p_observaciones?: string
          p_sesion_id: string
        }
        Returns: {
          abierta_por: string
          apertura_at: string
          caja_id: string
          cerrada_por: string | null
          cierre_at: string | null
          diferencia: number | null
          id: string
          monto_apertura: number
          monto_contado: number | null
          monto_esperado: number | null
          observaciones_apertura: string | null
          observaciones_cierre: string | null
        }
        SetofOptions: {
          from: "*"
          to: "sesiones_caja"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      crear_transferencia: {
        Args: {
          p_caja_destino_id: string
          p_caja_origen_id: string
          p_descripcion?: string
          p_monto: number
        }
        Returns: string
      }
      entregar_a_stand: {
        Args: { p_monto: number; p_observaciones?: string; p_stand_id: string }
        Returns: string
      }
      es_admin_general: { Args: never; Returns: boolean }
      esta_asignado: { Args: { p_empresa_id: string }; Returns: boolean }
      puede_acceder_caja: { Args: { p_caja_id: string }; Returns: boolean }
      puede_acceder_empresa: {
        Args: { p_empresa_id: string }
        Returns: boolean
      }
      puede_operar_todas: { Args: never; Returns: boolean }
      recibir_de_stand: {
        Args: { p_monto: number; p_observaciones?: string; p_stand_id: string }
        Returns: string
      }
      registrar_movimiento: {
        Args: {
          p_caja_id: string
          p_categoria_id: string
          p_comprobante_url?: string
          p_descripcion?: string
          p_monto: number
          p_tipo: Database["public"]["Enums"]["tipo_movimiento"]
        }
        Returns: string
      }
    }
    Enums: {
      rol_global: "admin_general" | "admin_organizacion"
      tipo_caja: "empresa"
      tipo_movimiento: "ingreso" | "egreso"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      rol_global: ["admin_general", "admin_organizacion"],
      tipo_caja: ["empresa"],
      tipo_movimiento: ["ingreso", "egreso"],
    },
  },
} as const
