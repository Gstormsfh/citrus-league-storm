export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      players: {
        Row: {
          id: string
          full_name: string
          position: string
          team: string
          jersey_number: string | null
          status: string | null
          goals: number | null
          assists: number | null
          points: number | null
          plus_minus: number | null
          shots: number | null
          hits: number | null
          blocks: number | null
          wins: number | null
          losses: number | null
          ot_losses: number | null
          saves: number | null
          goals_against_average: number | null
          save_percentage: number | null
          headshot_url: string | null
          last_updated: string | null
        }
        Insert: {
          id?: string
          full_name: string
          position: string
          team: string
          jersey_number?: string | null
          status?: string | null
          goals?: number | null
          assists?: number | null
          points?: number | null
          plus_minus?: number | null
          shots?: number | null
          hits?: number | null
          blocks?: number | null
          wins?: number | null
          losses?: number | null
          ot_losses?: number | null
          saves?: number | null
          goals_against_average?: number | null
          save_percentage?: number | null
          headshot_url?: string | null
          last_updated?: string | null
        }
        Update: {
          id?: string
          full_name?: string
          position?: string
          team?: string
          jersey_number?: string | null
          status?: string | null
          goals?: number | null
          assists?: number | null
          points?: number | null
          plus_minus?: number | null
          shots?: number | null
          hits?: number | null
          blocks?: number | null
          wins?: number | null
          losses?: number | null
          ot_losses?: number | null
          saves?: number | null
          goals_against_average?: number | null
          save_percentage?: number | null
          headshot_url?: string | null
          last_updated?: string | null
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
