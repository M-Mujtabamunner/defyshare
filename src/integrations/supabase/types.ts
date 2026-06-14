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
      blocked_users: {
        Row: {
          blocked_user_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_user_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_user_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      conversation_members: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string
          last_read_at: string
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string
          last_read_at?: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string
          last_read_at?: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_members_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          type: Database["public"]["Enums"]["conversation_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          type: Database["public"]["Enums"]["conversation_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          type?: Database["public"]["Enums"]["conversation_type"]
          updated_at?: string
        }
        Relationships: []
      }
      file_history: {
        Row: {
          created_at: string
          id: string
          name: string
          room_key: string
          shared_file_id: string | null
          size: number
          subject: string | null
          type: string | null
          uploaded_at: string
          uploader_email: string | null
          uploader_id: string | null
          uploader_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          room_key: string
          shared_file_id?: string | null
          size?: number
          subject?: string | null
          type?: string | null
          uploaded_at?: string
          uploader_email?: string | null
          uploader_id?: string | null
          uploader_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          room_key?: string
          shared_file_id?: string | null
          size?: number
          subject?: string | null
          type?: string | null
          uploaded_at?: string
          uploader_email?: string | null
          uploader_id?: string | null
          uploader_name?: string | null
        }
        Relationships: []
      }
      friend_requests: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          receiver_id: string
          sender_id: string
          status: Database["public"]["Enums"]["friend_request_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id: string
          sender_id: string
          status?: Database["public"]["Enums"]["friend_request_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id?: string
          sender_id?: string
          status?: Database["public"]["Enums"]["friend_request_status"]
          updated_at?: string
        }
        Relationships: []
      }
      friends: {
        Row: {
          created_at: string
          custom_display_name: string | null
          friend_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_display_name?: string | null
          friend_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          custom_display_name?: string | null
          friend_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      groups: {
        Row: {
          conversation_id: string
          created_at: string
          created_by: string
          group_name: string
          group_photo: string | null
          id: string
          updated_at: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          created_by: string
          group_name: string
          group_photo?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          created_by?: string
          group_name?: string
          group_photo?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: true
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          conversation_id: string
          created_at: string
          expires_at: string | null
          file_name: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          id: string
          is_read: boolean
          message_type: Database["public"]["Enums"]["message_type"]
          sender_id: string
          text_content: string | null
        }
        Insert: {
          conversation_id: string
          created_at?: string
          expires_at?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: Database["public"]["Enums"]["message_type"]
          sender_id: string
          text_content?: string | null
        }
        Update: {
          conversation_id?: string
          created_at?: string
          expires_at?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: Database["public"]["Enums"]["message_type"]
          sender_id?: string
          text_content?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          google_email: string | null
          google_name: string | null
          google_photo: string | null
          last_seen: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          google_email?: string | null
          google_name?: string | null
          google_photo?: string | null
          last_seen?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          google_email?: string | null
          google_name?: string | null
          google_photo?: string | null
          last_seen?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promo_overrides: {
        Row: {
          created_at: string
          keep_forever: boolean
          override_seconds: number | null
          promo_code: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          keep_forever?: boolean
          override_seconds?: number | null
          promo_code?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          keep_forever?: boolean
          override_seconds?: number | null
          promo_code?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          created_at: string
          id: string
          room_key: string
        }
        Insert: {
          created_at?: string
          id?: string
          room_key: string
        }
        Update: {
          created_at?: string
          id?: string
          room_key?: string
        }
        Relationships: []
      }
      shared_files: {
        Row: {
          created_at: string
          expires_at: string
          file_path: string
          id: string
          keep_forever: boolean
          name: string
          room_key: string
          size: number
          subject: string | null
          type: string
          uploader_email: string | null
          uploader_id: string | null
          uploader_name: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string
          file_path?: string
          id?: string
          keep_forever?: boolean
          name: string
          room_key: string
          size: number
          subject?: string | null
          type: string
          uploader_email?: string | null
          uploader_id?: string | null
          uploader_name?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          file_path?: string
          id?: string
          keep_forever?: boolean
          name?: string
          room_key?: string
          size?: number
          subject?: string | null
          type?: string
          uploader_email?: string | null
          uploader_id?: string | null
          uploader_name?: string | null
        }
        Relationships: []
      }
      shared_texts: {
        Row: {
          content: string
          created_at: string
          expires_at: string
          id: string
          room_key: string
        }
        Insert: {
          content: string
          created_at?: string
          expires_at?: string
          id?: string
          room_key: string
        }
        Update: {
          content?: string
          created_at?: string
          expires_at?: string
          id?: string
          room_key?: string
        }
        Relationships: []
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
          role: Database["public"]["Enums"]["app_role"]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_friend_request: { Args: { _req_id: string }; Returns: undefined }
      cleanup_expired: { Args: never; Returns: undefined }
      create_group_conversation: {
        Args: { _member_ids: string[]; _name: string; _photo: string }
        Returns: string
      }
      find_profile_by_email: {
        Args: { _email: string }
        Returns: {
          google_email: string
          google_name: string
          google_photo: string
          user_id: string
        }[]
      }
      get_or_create_direct_conversation: {
        Args: { _other: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_blocked: { Args: { a: string; b: string }; Returns: boolean }
      is_conversation_admin: {
        Args: { _conv: string; _user: string }
        Returns: boolean
      }
      is_conversation_member: {
        Args: { _conv: string; _user: string }
        Returns: boolean
      }
      is_friend: { Args: { a: string; b: string }; Returns: boolean }
      search_profiles: {
        Args: { _q: string }
        Returns: {
          google_email: string
          google_name: string
          google_photo: string
          user_id: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      conversation_type: "direct" | "group"
      friend_request_status: "pending" | "accepted" | "rejected" | "cancelled"
      member_role: "admin" | "member"
      message_type: "text" | "image" | "video" | "file"
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
      app_role: ["admin", "moderator", "user"],
      conversation_type: ["direct", "group"],
      friend_request_status: ["pending", "accepted", "rejected", "cancelled"],
      member_role: ["admin", "member"],
      message_type: ["text", "image", "video", "file"],
    },
  },
} as const
