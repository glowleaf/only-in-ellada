export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
      }
      categories: {
        Row: {
          id: number
          name: string
          slug: string
          color: string
          emoji: string | null
        }
        Insert: {
          id?: number
          name: string
          slug: string
          color?: string
          emoji?: string | null
        }
        Update: {
          id?: number
          name?: string
          slug?: string
          color?: string
          emoji?: string | null
        }
      }
      stories: {
        Row: {
          id: number
          title: string
          content: string
          user_id: string
          category_id: number
          upvotes: number
          downvotes: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          title: string
          content: string
          user_id: string
          category_id: number
          upvotes?: number
          downvotes?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          title?: string
          content?: string
          user_id?: string
          category_id?: number
          upvotes?: number
          downvotes?: number
          created_at?: string
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: number
          content: string
          user_id: string
          story_id: number
          parent_id: number | null
          created_at: string
        }
        Insert: {
          id?: number
          content: string
          user_id: string
          story_id: number
          parent_id?: number | null
          created_at?: string
        }
        Update: {
          id?: number
          content?: string
          user_id?: string
          story_id?: number
          parent_id?: number | null
          created_at?: string
        }
      }
      votes: {
        Row: {
          id: number
          user_id: string
          story_id: number
          vote_type: 'up' | 'down'
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          story_id: number
          vote_type: 'up' | 'down'
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          story_id?: number
          vote_type?: 'up' | 'down'
          created_at?: string
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

// Helper types
export type User = Database['public']['Tables']['users']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Story = Database['public']['Tables']['stories']['Row']
export type Comment = Database['public']['Tables']['comments']['Row']
export type Vote = Database['public']['Tables']['votes']['Row']

// Extended types with relations
export type StoryWithDetails = Story & {
  users: User
  categories: Category
  comment_count: number
  user_vote?: Vote
}

export type CommentWithUser = Comment & {
  users: User
  replies?: CommentWithUser[]
} 