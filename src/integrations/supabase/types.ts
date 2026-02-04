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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      item_detail_fields: {
        Row: {
          id: number
          type: string
        }
        Insert: {
          id?: number
          type: string
        }
        Update: {
          id?: number
          type?: string
        }
        Relationships: []
      }
      item_details: {
        Row: {
          created_at: string | null
          field_id: number | null
          id: number
          item_id: number | null
          value: string
        }
        Insert: {
          created_at?: string | null
          field_id?: number | null
          id?: number
          item_id?: number | null
          value: string
        }
        Update: {
          created_at?: string | null
          field_id?: number | null
          id?: number
          item_id?: number | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_details_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "item_detail_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_details_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      loqatrs: {
        Row: {
          created_at: string | null
          email: string | null
          id: number
          item_id: number | null
          message: string | null
          name: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: number
          item_id?: number | null
          message?: string | null
          name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: number
          item_id?: number | null
          message?: string | null
          name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loqatrs_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: number
          is_read: boolean
          location: string | null
          loqatr_message_id: number | null
          message: string | null
          qrcode_id: number | null
          title: string
          type: string
          user_id: number
        }
        Insert: {
          created_at?: string
          id?: number
          is_read?: boolean
          location?: string | null
          loqatr_message_id?: number | null
          message?: string | null
          qrcode_id?: number | null
          title: string
          type: string
          user_id: number
        }
        Update: {
          created_at?: string
          id?: number
          is_read?: boolean
          location?: string | null
          loqatr_message_id?: number | null
          message?: string | null
          qrcode_id?: number | null
          title?: string
          type?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "notifications_loqatr_message_id_fkey"
            columns: ["loqatr_message_id"]
            isOneToOne: false
            referencedRelation: "loqatrs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_qrcode_id_fkey"
            columns: ["qrcode_id"]
            isOneToOne: false
            referencedRelation: "qrcodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      qrcode_batches: {
        Row: {
          created_at: string | null
          id: number
          is_downloaded: boolean
          is_printed: boolean
          notes: string | null
          rand_value: number
          retailer_id: number | null
          staff_id: number | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          is_downloaded?: boolean
          is_printed?: boolean
          notes?: string | null
          rand_value: number
          retailer_id?: number | null
          staff_id?: number | null
          status: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          is_downloaded?: boolean
          is_printed?: boolean
          notes?: string | null
          rand_value?: number
          retailer_id?: number | null
          staff_id?: number | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qrcode_batches_retailer_id_fkey"
            columns: ["retailer_id"]
            isOneToOne: false
            referencedRelation: "retailers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qrcode_batches_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      qrcodes: {
        Row: {
          assigned_to: number | null
          batch_id: number | null
          created_at: string | null
          id: number
          is_public: boolean
          item_id: number | null
          loqatr_id: string
          status: Database["public"]["Enums"]["qr_code_status"]
          updated_at: string | null
        }
        Insert: {
          assigned_to?: number | null
          batch_id?: number | null
          created_at?: string | null
          id?: number
          is_public?: boolean
          item_id?: number | null
          loqatr_id: string
          status?: Database["public"]["Enums"]["qr_code_status"]
          updated_at?: string | null
        }
        Update: {
          assigned_to?: number | null
          batch_id?: number | null
          created_at?: string | null
          id?: number
          is_public?: boolean
          item_id?: number | null
          loqatr_id?: string
          status?: Database["public"]["Enums"]["qr_code_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qrcodes_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qrcodes_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "qrcode_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qrcodes_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      retailers: {
        Row: {
          contact_email: string | null
          contact_name: string | null
          contact_number: string | null
          created_at: string | null
          id: number
          name: string
          updated_at: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_name?: string | null
          contact_number?: string | null
          created_at?: string | null
          id?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_name?: string | null
          contact_number?: string | null
          created_at?: string | null
          id?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          id: number
          permission: Database["public"]["Enums"]["user_permission"]
          role: string
        }
        Insert: {
          id?: number
          permission: Database["public"]["Enums"]["user_permission"]
          role: string
        }
        Update: {
          id?: number
          permission?: Database["public"]["Enums"]["user_permission"]
          role?: string
        }
        Relationships: []
      }
      scans: {
        Row: {
          address: string | null
          contact_revealed: boolean | null
          id: number
          ip_address: unknown
          is_owner: boolean | null
          latitude: number | null
          longitude: number | null
          qr_code_id: number | null
          scanned_at: string | null
          scanned_by: number | null
        }
        Insert: {
          address?: string | null
          contact_revealed?: boolean | null
          id?: number
          ip_address?: unknown
          is_owner?: boolean | null
          latitude?: number | null
          longitude?: number | null
          qr_code_id?: number | null
          scanned_at?: string | null
          scanned_by?: number | null
        }
        Update: {
          address?: string | null
          contact_revealed?: boolean | null
          id?: number
          ip_address?: unknown
          is_owner?: boolean | null
          latitude?: number | null
          longitude?: number | null
          qr_code_id?: number | null
          scanned_at?: string | null
          scanned_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scans_qr_code_id_fkey"
            columns: ["qr_code_id"]
            isOneToOne: false
            referencedRelation: "qrcodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scans_scanned_by_fkey"
            columns: ["scanned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: number
          role: string
          user_id: number | null
        }
        Insert: {
          id?: number
          role: string
          user_id?: number | null
        }
        Update: {
          id?: number
          role?: string
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth_id: string
          created_at: string | null
          email: string
          id: number
          name: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          auth_id: string
          created_at?: string | null
          email: string
          id?: number
          name: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          auth_id?: string
          created_at?: string | null
          email?: string
          id?: number
          name?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_id: { Args: never; Returns: number }
      is_super_admin:
        | { Args: never; Returns: boolean }
        | { Args: { check_user_id: number }; Returns: boolean }
      reveal_item_contact: {
        Args: { current_scan_id: number; target_qr_id: string }
        Returns: {
          owner_email: string
          owner_name: string
          owner_phone: string
          whatsapp_url: string
        }[]
      }
    }
    Enums: {
      qr_code_status: "assigned" | "unassigned" | "active" | "retired"
      user_permission: "read" | "write" | "delete" | "admin"
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
      qr_code_status: ["assigned", "unassigned", "active", "retired"],
      user_permission: ["read", "write", "delete", "admin"],
    },
  },
} as const
