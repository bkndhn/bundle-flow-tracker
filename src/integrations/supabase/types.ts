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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          created_at: string | null
          id: string
          setting_key: string
          setting_value: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          setting_key: string
          setting_value?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          setting_key?: string
          setting_value?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      app_users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          password_hash: string
          role: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          password_hash: string
          role: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          password_hash?: string
          role?: string
        }
        Relationships: []
      }
      goods_movements: {
        Row: {
          accompanying_person: string | null
          auto_name: string
          bundles_count: number
          condition_notes: string | null
          created_at: string | null
          destination: string
          dispatch_date: string
          dispatch_notes: string | null
          fare_display_msg: string | null
          fare_payee_tag: string | null
          fare_payment: Database["public"]["Enums"]["fare_payment_type"]
          id: string
          item: string
          item_summary_display: string | null
          movement_type: string | null
          pant_bundles: number | null
          receive_notes: string | null
          received_at: string | null
          received_by: string | null
          sent_by: string
          shirt_bundles: number | null
          source: string | null
          status: Database["public"]["Enums"]["movement_status"]
          updated_at: string | null
        }
        Insert: {
          accompanying_person?: string | null
          auto_name?: string
          bundles_count: number
          condition_notes?: string | null
          created_at?: string | null
          destination: string
          dispatch_date: string
          dispatch_notes?: string | null
          fare_display_msg?: string | null
          fare_payee_tag?: string | null
          fare_payment: Database["public"]["Enums"]["fare_payment_type"]
          id?: string
          item?: string
          item_summary_display?: string | null
          movement_type?: string | null
          pant_bundles?: number | null
          receive_notes?: string | null
          received_at?: string | null
          received_by?: string | null
          sent_by: string
          shirt_bundles?: number | null
          source?: string | null
          status?: Database["public"]["Enums"]["movement_status"]
          updated_at?: string | null
        }
        Update: {
          accompanying_person?: string | null
          auto_name?: string
          bundles_count?: number
          condition_notes?: string | null
          created_at?: string | null
          destination?: string
          dispatch_date?: string
          dispatch_notes?: string | null
          fare_display_msg?: string | null
          fare_payee_tag?: string | null
          fare_payment?: Database["public"]["Enums"]["fare_payment_type"]
          id?: string
          item?: string
          item_summary_display?: string | null
          movement_type?: string | null
          pant_bundles?: number | null
          receive_notes?: string | null
          received_at?: string | null
          received_by?: string | null
          sent_by?: string
          shirt_bundles?: number | null
          source?: string | null
          status?: Database["public"]["Enums"]["movement_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goods_movements_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_movements_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          created_at: string | null
          id: string
          location: Database["public"]["Enums"]["location_type"]
          name: string
          role: Database["public"]["Enums"]["staff_role"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          location: Database["public"]["Enums"]["location_type"]
          name: string
          role: Database["public"]["Enums"]["staff_role"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          location?: Database["public"]["Enums"]["location_type"]
          name?: string
          role?: Database["public"]["Enums"]["staff_role"]
          updated_at?: string | null
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
      destination_type: "big_shop" | "small_shop"
      fare_payment_type:
        | "paid_by_sender"
        | "to_be_paid_by_receiver"
        | "to_be_paid_by_small_shop"
        | "to_be_paid_by_big_shop"
      location_type: "godown" | "big_shop" | "small_shop"
      movement_status: "dispatched" | "received"
      staff_role: "godown_staff" | "shop_staff" | "admin"
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
    Enums: {
      destination_type: ["big_shop", "small_shop"],
      fare_payment_type: [
        "paid_by_sender",
        "to_be_paid_by_receiver",
        "to_be_paid_by_small_shop",
        "to_be_paid_by_big_shop",
      ],
      location_type: ["godown", "big_shop", "small_shop"],
      movement_status: ["dispatched", "received"],
      staff_role: ["godown_staff", "shop_staff", "admin"],
    },
  },
} as const
