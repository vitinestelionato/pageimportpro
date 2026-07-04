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
  public: {
    Tables: {
      activation_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token_hash: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          token_hash: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token_hash?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      catalog_favorites: {
        Row: {
          created_at: string
          id: string
          item_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_favorites_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_items: {
        Row: {
          category: string
          created_at: string
          description: string | null
          difficulty: string
          featured: boolean
          id: string
          image_url: string | null
          margin_pct: number
          monthly_searches: number
          name: string
          niche: string | null
          origin_country: string
          origin_currency: string
          origin_price: number
          rating: number
          suggested_price_brl: number
          supplier_platform: string | null
          supplier_url: string | null
          tags: string[]
          trend: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          difficulty?: string
          featured?: boolean
          id?: string
          image_url?: string | null
          margin_pct?: number
          monthly_searches?: number
          name: string
          niche?: string | null
          origin_country?: string
          origin_currency?: string
          origin_price?: number
          rating?: number
          suggested_price_brl?: number
          supplier_platform?: string | null
          supplier_url?: string | null
          tags?: string[]
          trend?: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          difficulty?: string
          featured?: boolean
          id?: string
          image_url?: string | null
          margin_pct?: number
          monthly_searches?: number
          name?: string
          niche?: string | null
          origin_country?: string
          origin_currency?: string
          origin_price?: number
          rating?: number
          suggested_price_brl?: number
          supplier_platform?: string | null
          supplier_url?: string | null
          tags?: string[]
          trend?: string
          updated_at?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          body: string
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          created_at: string
          id: string
          image_url: string | null
          name: string
          notes: string | null
          origin_currency: string
          origin_price: number
          status: string
          supplier_url: string | null
          updated_at: string
          user_id: string
          weight_kg: number
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          notes?: string | null
          origin_currency?: string
          origin_price?: number
          status?: string
          supplier_url?: string | null
          updated_at?: string
          user_id: string
          weight_kg?: number
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          notes?: string | null
          origin_currency?: string
          origin_price?: number
          status?: string
          supplier_url?: string | null
          updated_at?: string
          user_id?: string
          weight_kg?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          first_access: boolean
          full_name: string | null
          id: string
          phone: string | null
          plan: string | null
          provider: string
          purchase_date: string | null
          status: string
          subscription_expires_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_access?: boolean
          full_name?: string | null
          id: string
          phone?: string | null
          plan?: string | null
          provider?: string
          purchase_date?: string | null
          status?: string
          subscription_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          first_access?: boolean
          full_name?: string | null
          id?: string
          phone?: string | null
          plan?: string | null
          provider?: string
          purchase_date?: string | null
          status?: string
          subscription_expires_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      shipments: {
        Row: {
          carrier: string
          created_at: string
          events: Json
          id: string
          last_event_at: string | null
          last_event_description: string | null
          last_synced_at: string | null
          product_id: string | null
          product_name: string
          status: string
          sync_error: string | null
          tracking_code: string
          updated_at: string
          user_id: string
        }
        Insert: {
          carrier?: string
          created_at?: string
          events?: Json
          id?: string
          last_event_at?: string | null
          last_event_description?: string | null
          last_synced_at?: string | null
          product_id?: string | null
          product_name: string
          status?: string
          sync_error?: string | null
          tracking_code: string
          updated_at?: string
          user_id: string
        }
        Update: {
          carrier?: string
          created_at?: string
          events?: Json
          id?: string
          last_event_at?: string | null
          last_event_description?: string | null
          last_synced_at?: string | null
          product_id?: string | null
          product_name?: string
          status?: string
          sync_error?: string | null
          tracking_code?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          created_at: string
          event_type: string | null
          external_id: string | null
          id: string
          message: string | null
          payload: Json | null
          provider: string
          status: string
        }
        Insert: {
          created_at?: string
          event_type?: string | null
          external_id?: string | null
          id?: string
          message?: string | null
          payload?: Json | null
          provider: string
          status: string
        }
        Update: {
          created_at?: string
          event_type?: string | null
          external_id?: string | null
          id?: string
          message?: string | null
          payload?: Json | null
          provider?: string
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
