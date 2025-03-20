export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      tickets: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          title: string
          description: string
          status: 'open' | 'in_progress' | 'resolved' | 'closed'
          priority: 'low' | 'medium' | 'high' | 'urgent'
          user_id: string
          assigned_to: string | null
          department: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          title: string
          description: string
          status?: 'open' | 'in_progress' | 'resolved' | 'closed'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          user_id: string
          assigned_to?: string | null
          department: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          title?: string
          description?: string
          status?: 'open' | 'in_progress' | 'resolved' | 'closed'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          user_id?: string
          assigned_to?: string | null
          department?: string
        }
      }
      ticket_comments: {
        Row: {
          id: string
          created_at: string
          ticket_id: string
          user_id: string
          content: string
          is_internal: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          ticket_id: string
          user_id: string
          content: string
          is_internal?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          ticket_id?: string
          user_id?: string
          content?: string
          is_internal?: boolean
        }
      }
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          full_name: string
          avatar_url: string | null
          role: 'user' | 'agent' | 'admin'
          department: string | null
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          full_name: string
          avatar_url?: string | null
          role?: 'user' | 'agent' | 'admin'
          department?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          full_name?: string
          avatar_url?: string | null
          role?: 'user' | 'agent' | 'admin'
          department?: string | null
        }
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
  }
}