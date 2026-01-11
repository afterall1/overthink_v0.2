// =====================================================
// LifeNexus Database Type Definitions
// Auto-generated types for Supabase tables
// =====================================================

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
            users: {
                Row: {
                    id: string
                    email: string
                    full_name: string | null
                    avatar_url: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email: string
                    full_name?: string | null
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    full_name?: string | null
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            categories: {
                Row: {
                    id: string
                    name: string
                    slug: string
                    color_code: string
                    icon_slug: string
                    description: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    slug: string
                    color_code: string
                    icon_slug: string
                    description?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    slug?: string
                    color_code?: string
                    icon_slug?: string
                    description?: string | null
                    created_at?: string
                }
                Relationships: []
            }
            logs: {
                Row: {
                    id: string
                    user_id: string
                    category_id: string
                    data: Json
                    sentiment: number | null
                    notes: string | null
                    logged_at: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    category_id: string
                    data?: Json
                    sentiment?: number | null
                    notes?: string | null
                    logged_at?: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    category_id?: string
                    data?: Json
                    sentiment?: number | null
                    notes?: string | null
                    logged_at?: string
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "logs_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "logs_category_id_fkey"
                        columns: ["category_id"]
                        isOneToOne: false
                        referencedRelation: "categories"
                        referencedColumns: ["id"]
                    }
                ]
            }
            goals: {
                Row: {
                    id: string
                    user_id: string
                    category_id: string | null
                    title: string
                    description: string | null
                    target_value: number | null
                    current_value: number | null
                    unit: string | null
                    period: 'daily' | 'weekly' | 'monthly' | 'yearly'
                    is_completed: boolean
                    start_date: string
                    end_date: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    category_id?: string | null
                    title: string
                    description?: string | null
                    target_value?: number | null
                    current_value?: number | null
                    unit?: string | null
                    period?: 'daily' | 'weekly' | 'monthly' | 'yearly'
                    is_completed?: boolean
                    start_date: string
                    end_date?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    category_id?: string | null
                    title?: string
                    description?: string | null
                    target_value?: number | null
                    current_value?: number | null
                    unit?: string | null
                    period?: 'daily' | 'weekly' | 'monthly' | 'yearly'
                    is_completed?: boolean
                    start_date?: string
                    end_date?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "goals_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "goals_category_id_fkey"
                        columns: ["category_id"]
                        isOneToOne: false
                        referencedRelation: "categories"
                        referencedColumns: ["id"]
                    }
                ]
            }
            goal_milestones: {
                Row: {
                    id: string
                    goal_id: string
                    title: string
                    description: string | null
                    target_value: number | null
                    is_completed: boolean
                    completed_at: string | null
                    sort_order: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    goal_id: string
                    title: string
                    description?: string | null
                    target_value?: number | null
                    is_completed?: boolean
                    completed_at?: string | null
                    sort_order?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    goal_id?: string
                    title?: string
                    description?: string | null
                    target_value?: number | null
                    is_completed?: boolean
                    completed_at?: string | null
                    sort_order?: number
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "goal_milestones_goal_id_fkey"
                        columns: ["goal_id"]
                        isOneToOne: false
                        referencedRelation: "goals"
                        referencedColumns: ["id"]
                    }
                ]
            }
            goal_entries: {
                Row: {
                    id: string
                    goal_id: string
                    value: number
                    notes: string | null
                    logged_at: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    goal_id: string
                    value: number
                    notes?: string | null
                    logged_at?: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    goal_id?: string
                    value?: number
                    notes?: string | null
                    logged_at?: string
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "goal_entries_goal_id_fkey"
                        columns: ["goal_id"]
                        isOneToOne: false
                        referencedRelation: "goals"
                        referencedColumns: ["id"]
                    }
                ]
            }
            events: {
                Row: {
                    id: string
                    user_id: string
                    category_id: string | null
                    title: string
                    description: string | null
                    data: Json
                    scheduled_at: string
                    duration_min: number
                    reminder_min: number
                    is_recurring: boolean
                    recurrence_rule: string | null
                    status: 'pending' | 'notified' | 'completed' | 'skipped'
                    completed_at: string | null
                    linked_log_id: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    category_id?: string | null
                    title: string
                    description?: string | null
                    data?: Json
                    scheduled_at: string
                    duration_min?: number
                    reminder_min?: number
                    is_recurring?: boolean
                    recurrence_rule?: string | null
                    status?: 'pending' | 'notified' | 'completed' | 'skipped'
                    completed_at?: string | null
                    linked_log_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    category_id?: string | null
                    title?: string
                    description?: string | null
                    data?: Json
                    scheduled_at?: string
                    duration_min?: number
                    reminder_min?: number
                    is_recurring?: boolean
                    recurrence_rule?: string | null
                    status?: 'pending' | 'notified' | 'completed' | 'skipped'
                    completed_at?: string | null
                    linked_log_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "events_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "events_category_id_fkey"
                        columns: ["category_id"]
                        isOneToOne: false
                        referencedRelation: "categories"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "events_linked_log_id_fkey"
                        columns: ["linked_log_id"]
                        isOneToOne: false
                        referencedRelation: "logs"
                        referencedColumns: ["id"]
                    }
                ]
            }
            ai_conversations: {
                Row: {
                    id: string
                    user_id: string
                    council_member: 'task_advisor' | 'life_coach'
                    messages: Json
                    context_data: Json | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    council_member: 'task_advisor' | 'life_coach'
                    messages?: Json
                    context_data?: Json | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    council_member?: 'task_advisor' | 'life_coach'
                    messages?: Json
                    context_data?: Json | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "ai_conversations_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            ai_insights: {
                Row: {
                    id: string
                    user_id: string
                    insight_type: 'daily' | 'weekly' | 'task_specific'
                    content: string
                    metadata: Json | null
                    valid_until: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    insight_type: 'daily' | 'weekly' | 'task_specific'
                    content: string
                    metadata?: Json | null
                    valid_until?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    insight_type?: 'daily' | 'weekly' | 'task_specific'
                    content?: string
                    metadata?: Json | null
                    valid_until?: string | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "ai_insights_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
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

// =====================================================
// Convenience Types
// =====================================================

// Table row types
export type User = Database['public']['Tables']['users']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Log = Database['public']['Tables']['logs']['Row']
export type Goal = Database['public']['Tables']['goals']['Row']

// Insert types
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type CategoryInsert = Database['public']['Tables']['categories']['Insert']
export type LogInsert = Database['public']['Tables']['logs']['Insert']
export type GoalInsert = Database['public']['Tables']['goals']['Insert']

// Update types
export type UserUpdate = Database['public']['Tables']['users']['Update']
export type CategoryUpdate = Database['public']['Tables']['categories']['Update']
export type LogUpdate = Database['public']['Tables']['logs']['Update']
export type GoalUpdate = Database['public']['Tables']['goals']['Update']

// Event types
export type Event = Database['public']['Tables']['events']['Row']
export type EventInsert = Database['public']['Tables']['events']['Insert']
export type EventUpdate = Database['public']['Tables']['events']['Update']
export type EventStatus = Event['status']

// Event with joined category data
export type EventWithCategory = Event & {
    categories: Pick<Category, 'id' | 'name' | 'slug' | 'color_code' | 'icon_slug'> | null
}

// Goal Milestone types
export type GoalMilestone = Database['public']['Tables']['goal_milestones']['Row']
export type GoalMilestoneInsert = Database['public']['Tables']['goal_milestones']['Insert']
export type GoalMilestoneUpdate = Database['public']['Tables']['goal_milestones']['Update']

// Goal Entry types
export type GoalEntry = Database['public']['Tables']['goal_entries']['Row']
export type GoalEntryInsert = Database['public']['Tables']['goal_entries']['Insert']

// Goal with all related data
export type GoalWithDetails = Goal & {
    categories: Pick<Category, 'id' | 'name' | 'slug' | 'color_code' | 'icon_slug'> | null
    goal_milestones: GoalMilestone[]
    goal_entries: GoalEntry[]
}

// Goal period type
export type GoalPeriod = Goal['period']

// =====================================================
// Category-specific Log Data Types
// =====================================================

export interface TradeLogData {
    pair: string
    side: 'long' | 'short'
    entry: number
    exit?: number
    pnl?: number
    pnl_percent?: number
    notes?: string
}

export interface FoodLogData {
    meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
    calories: number
    protein?: number
    carbs?: number
    fat?: number
    foods?: string[]
}

export interface SportLogData {
    activity: string
    duration_min: number
    calories_burned?: number
    exercises?: Array<{
        name: string
        sets?: number
        reps?: number
        weight?: number
    }>
}

export interface DevLogData {
    project: string
    task: string
    duration_min: number
    commits?: number
    language?: string
    description?: string
}

export interface EtsyLogData {
    order_id?: string
    product: string
    revenue: number
    cost?: number
    profit?: number
    status?: 'pending' | 'shipped' | 'completed'
}

export interface GamingLogData {
    game: string
    duration_min: number
    achievement?: string
    platform?: 'PC' | 'PS5' | 'Xbox' | 'Switch' | 'Mobile'
    score?: number
}

// Union type for all log data
export type LogData =
    | TradeLogData
    | FoodLogData
    | SportLogData
    | DevLogData
    | EtsyLogData
    | GamingLogData

// =====================================================
// Category Slugs (for type-safe category references)
// =====================================================

export type CategorySlug = 'trade' | 'food' | 'sport' | 'dev' | 'etsy' | 'gaming'
