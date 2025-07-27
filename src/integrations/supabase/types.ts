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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ai_detections: {
        Row: {
          alert_generated: boolean | null
          bounding_box: Json | null
          camera_id: string
          confidence: number
          detection_type: string
          gpt_analysis: string | null
          id: string
          metadata: Json | null
          processed_by_gpt: boolean | null
          room: string
          timestamp: string
        }
        Insert: {
          alert_generated?: boolean | null
          bounding_box?: Json | null
          camera_id: string
          confidence: number
          detection_type: string
          gpt_analysis?: string | null
          id?: string
          metadata?: Json | null
          processed_by_gpt?: boolean | null
          room: string
          timestamp?: string
        }
        Update: {
          alert_generated?: boolean | null
          bounding_box?: Json | null
          camera_id?: string
          confidence?: number
          detection_type?: string
          gpt_analysis?: string | null
          id?: string
          metadata?: Json | null
          processed_by_gpt?: boolean | null
          room?: string
          timestamp?: string
        }
        Relationships: []
      }
      alerts: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          acknowledged_by: string | null
          created_at: string | null
          id: string
          message: string
          notes: string | null
          patient_id: string | null
          priority: number | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          room: string
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string | null
          id?: string
          message: string
          notes?: string | null
          patient_id?: string | null
          priority?: number | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          room: string
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string | null
          id?: string
          message?: string
          notes?: string | null
          patient_id?: string | null
          priority?: number | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          room?: string
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alerts_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      camera_feeds: {
        Row: {
          ai_monitoring_enabled: boolean | null
          camera_id: string
          created_at: string | null
          id: string
          last_motion_detected: string | null
          name: string
          recording: boolean | null
          room: string
          status: string
          stream_url: string | null
          updated_at: string | null
        }
        Insert: {
          ai_monitoring_enabled?: boolean | null
          camera_id: string
          created_at?: string | null
          id?: string
          last_motion_detected?: string | null
          name: string
          recording?: boolean | null
          room: string
          status?: string
          stream_url?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_monitoring_enabled?: boolean | null
          camera_id?: string
          created_at?: string | null
          id?: string
          last_motion_detected?: string | null
          name?: string
          recording?: boolean | null
          room?: string
          status?: string
          stream_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      consultations: {
        Row: {
          created_at: string
          diagnosis: string | null
          doctor_id: string | null
          end_time: string | null
          id: string
          notes: string | null
          patient_id: string | null
          recording_url: string | null
          start_time: string
          status: string
          treatment_plan: string | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          diagnosis?: string | null
          doctor_id?: string | null
          end_time?: string | null
          id?: string
          notes?: string | null
          patient_id?: string | null
          recording_url?: string | null
          start_time: string
          status?: string
          treatment_plan?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          diagnosis?: string | null
          doctor_id?: string | null
          end_time?: string | null
          id?: string
          notes?: string | null
          patient_id?: string | null
          recording_url?: string | null
          start_time?: string
          status?: string
          treatment_plan?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultations_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          patient_id: string | null
          room: string | null
          source: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id: string
          patient_id?: string | null
          room?: string | null
          source?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          patient_id?: string | null
          room?: string | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_vitals_history: {
        Row: {
          id: string
          patient_id: string | null
          recorded_by: string | null
          source: string | null
          timestamp: string
          vitals: Json
        }
        Insert: {
          id?: string
          patient_id?: string | null
          recorded_by?: string | null
          source?: string | null
          timestamp?: string
          vitals: Json
        }
        Update: {
          id?: string
          patient_id?: string | null
          recorded_by?: string | null
          source?: string | null
          timestamp?: string
          vitals?: Json
        }
        Relationships: [
          {
            foreignKeyName: "patient_vitals_history_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_vitals_history_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          admission_date: string | null
          age: number | null
          conditions: string[] | null
          created_at: string | null
          id: string
          name: string
          notes: string | null
          room: string | null
          status: string | null
          summary: string | null
          vitals: Json | null
        }
        Insert: {
          admission_date?: string | null
          age?: number | null
          conditions?: string[] | null
          created_at?: string | null
          id: string
          name: string
          notes?: string | null
          room?: string | null
          status?: string | null
          summary?: string | null
          vitals?: Json | null
        }
        Update: {
          admission_date?: string | null
          age?: number | null
          conditions?: string[] | null
          created_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          room?: string | null
          status?: string | null
          summary?: string | null
          vitals?: Json | null
        }
        Relationships: []
      }
      prescriptions: {
        Row: {
          consultation_id: string | null
          created_at: string
          doctor_id: string | null
          dosage: string
          duration: string | null
          frequency: string
          id: string
          instructions: string | null
          medication_name: string
          patient_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          consultation_id?: string | null
          created_at?: string
          doctor_id?: string | null
          dosage: string
          duration?: string | null
          frequency: string
          id?: string
          instructions?: string | null
          medication_name: string
          patient_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          consultation_id?: string | null
          created_at?: string
          doctor_id?: string | null
          dosage?: string
          duration?: string | null
          frequency?: string
          id?: string
          instructions?: string | null
          medication_name?: string
          patient_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          department: string | null
          email: string
          full_name: string | null
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          username: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string | null
          data: Json | null
          description: string | null
          generated_by: string | null
          id: string
          report_type: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          description?: string | null
          generated_by?: string | null
          id?: string
          report_type: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          description?: string | null
          generated_by?: string | null
          id?: string
          report_type?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      security_settings: {
        Row: {
          created_at: string | null
          id: string
          last_login: string | null
          locked_until: string | null
          login_attempts: number | null
          session_timeout: number | null
          two_factor_enabled: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_login?: string | null
          locked_until?: string | null
          login_attempts?: number | null
          session_timeout?: number | null
          two_factor_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_login?: string | null
          locked_until?: string | null
          login_attempts?: number | null
          session_timeout?: number | null
          two_factor_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      video_sessions: {
        Row: {
          consultation_id: string | null
          created_at: string
          ended_at: string | null
          id: string
          participants: Json | null
          recording_enabled: boolean | null
          recording_url: string | null
          session_id: string
          started_at: string | null
          status: string
        }
        Insert: {
          consultation_id?: string | null
          created_at?: string
          ended_at?: string | null
          id?: string
          participants?: Json | null
          recording_enabled?: boolean | null
          recording_url?: string | null
          session_id: string
          started_at?: string | null
          status?: string
        }
        Update: {
          consultation_id?: string | null
          created_at?: string
          ended_at?: string | null
          id?: string
          participants?: Json | null
          recording_enabled?: boolean | null
          recording_url?: string | null
          session_id?: string
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_sessions_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      log_user_action: {
        Args: {
          action_type: string
          resource_type: string
          resource_id?: string
          details?: Json
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "nurse" | "remote_worker" | "remote_doctor"
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
      app_role: ["admin", "nurse", "remote_worker", "remote_doctor"],
    },
  },
} as const
