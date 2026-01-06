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
      items: {
        Row: {
          id: string
          content: string
          completed: boolean
          collapsed: boolean
          parent_id: string | null
          position: number
          is_new: boolean
          created_at: string
          updated_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          content?: string
          completed?: boolean
          collapsed?: boolean
          parent_id?: string | null
          position?: number
          is_new?: boolean
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          content?: string
          completed?: boolean
          collapsed?: boolean
          parent_id?: string | null
          position?: number
          is_new?: boolean
          created_at?: string
          updated_at?: string
          completed_at?: string | null
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

// Helper type for the items table row
export type ItemRow = Database['public']['Tables']['items']['Row'];
export type ItemInsert = Database['public']['Tables']['items']['Insert'];
export type ItemUpdate = Database['public']['Tables']['items']['Update'];

