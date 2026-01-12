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
                    // Enhanced fields for psychological tracking
                    motivation: string | null
                    identity_statement: string | null
                    best_time_of_day: 'morning' | 'afternoon' | 'evening' | 'anytime' | null
                    difficulty_level: 'easy' | 'medium' | 'hard' | 'extreme' | null
                    streak_count: number
                    longest_streak: number
                    last_activity_date: string | null
                    // Momentum system fields
                    momentum_score: number
                    habit_maturity_days: number
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
                    // Enhanced fields for psychological tracking
                    motivation?: string | null
                    identity_statement?: string | null
                    best_time_of_day?: 'morning' | 'afternoon' | 'evening' | 'anytime' | null
                    difficulty_level?: 'easy' | 'medium' | 'hard' | 'extreme' | null
                    streak_count?: number
                    longest_streak?: number
                    last_activity_date?: string | null
                    // Momentum system fields
                    momentum_score?: number
                    habit_maturity_days?: number
                    // Goal Template fields
                    goal_template_id?: string | null
                    metric_unit?: string | null
                    metric_name?: string | null
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
                    // Enhanced fields for psychological tracking
                    motivation?: string | null
                    identity_statement?: string | null
                    best_time_of_day?: 'morning' | 'afternoon' | 'evening' | 'anytime' | null
                    difficulty_level?: 'easy' | 'medium' | 'hard' | 'extreme' | null
                    streak_count?: number
                    longest_streak?: number
                    last_activity_date?: string | null
                    // Momentum system fields
                    momentum_score?: number
                    habit_maturity_days?: number
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
            // =====================================================
            // Quest System Tables
            // =====================================================
            goal_key_results: {
                Row: {
                    id: string
                    goal_id: string
                    user_id: string
                    title: string
                    description: string | null
                    metric_type: 'numeric' | 'boolean' | 'percentage'
                    metric_name: string | null
                    target_value: number | null
                    current_value: number | null
                    unit: string | null
                    frequency: 'daily' | 'weekly' | 'monthly'
                    is_completed: boolean
                    completed_at: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    goal_id: string
                    user_id: string
                    title: string
                    description?: string | null
                    metric_type?: 'numeric' | 'boolean' | 'percentage'
                    metric_name?: string | null
                    target_value?: number | null
                    current_value?: number | null
                    unit?: string | null
                    frequency?: 'daily' | 'weekly' | 'monthly'
                    is_completed?: boolean
                    completed_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    goal_id?: string
                    user_id?: string
                    title?: string
                    description?: string | null
                    metric_type?: 'numeric' | 'boolean' | 'percentage'
                    metric_name?: string | null
                    target_value?: number | null
                    current_value?: number | null
                    unit?: string | null
                    frequency?: 'daily' | 'weekly' | 'monthly'
                    is_completed?: boolean
                    completed_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "goal_key_results_goal_id_fkey"
                        columns: ["goal_id"]
                        isOneToOne: false
                        referencedRelation: "goals"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "goal_key_results_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            daily_quests: {
                Row: {
                    id: string
                    user_id: string
                    goal_id: string | null
                    key_result_id: string | null
                    title: string
                    description: string | null
                    emoji: string
                    xp_reward: number
                    bonus_xp: number
                    scheduled_time: string | null
                    scheduled_date: string | null
                    due_time: string | null
                    is_recurring: boolean
                    recurrence_pattern: 'daily' | 'weekdays' | 'weekends' | 'mwf' | 'tts' | 'custom' | null
                    recurrence_days: number[] | null
                    status: 'pending' | 'completed' | 'skipped' | 'expired'
                    completed_at: string | null
                    is_ai_suggested: boolean
                    ai_confidence: number | null
                    ai_reasoning: string | null
                    difficulty: 'easy' | 'medium' | 'hard'
                    sort_order: number
                    progress_contribution: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    goal_id?: string | null
                    key_result_id?: string | null
                    title: string
                    description?: string | null
                    emoji?: string
                    xp_reward?: number
                    bonus_xp?: number
                    scheduled_time?: string | null
                    scheduled_date?: string | null
                    due_time?: string | null
                    is_recurring?: boolean
                    recurrence_pattern?: 'daily' | 'weekdays' | 'weekends' | 'mwf' | 'tts' | 'custom' | null
                    recurrence_days?: number[] | null
                    status?: 'pending' | 'completed' | 'skipped' | 'expired'
                    completed_at?: string | null
                    is_ai_suggested?: boolean
                    ai_confidence?: number | null
                    ai_reasoning?: string | null
                    difficulty?: 'easy' | 'medium' | 'hard'
                    sort_order?: number
                    progress_contribution?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    goal_id?: string | null
                    key_result_id?: string | null
                    title?: string
                    description?: string | null
                    emoji?: string
                    xp_reward?: number
                    bonus_xp?: number
                    scheduled_time?: string | null
                    scheduled_date?: string | null
                    due_time?: string | null
                    is_recurring?: boolean
                    recurrence_pattern?: 'daily' | 'weekdays' | 'weekends' | 'mwf' | 'tts' | 'custom' | null
                    recurrence_days?: number[] | null
                    status?: 'pending' | 'completed' | 'skipped' | 'expired'
                    completed_at?: string | null
                    is_ai_suggested?: boolean
                    ai_confidence?: number | null
                    ai_reasoning?: string | null
                    difficulty?: 'easy' | 'medium' | 'hard'
                    sort_order?: number
                    progress_contribution?: number
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "daily_quests_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "daily_quests_goal_id_fkey"
                        columns: ["goal_id"]
                        isOneToOne: false
                        referencedRelation: "goals"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "daily_quests_key_result_id_fkey"
                        columns: ["key_result_id"]
                        isOneToOne: false
                        referencedRelation: "goal_key_results"
                        referencedColumns: ["id"]
                    }
                ]
            }
            quest_completions: {
                Row: {
                    id: string
                    quest_id: string
                    user_id: string
                    goal_id: string | null
                    completed_date: string
                    completed_at: string
                    xp_earned: number
                    base_xp: number
                    streak_bonus_xp: number
                    time_bonus_xp: number
                    streak_count: number
                    notes: string | null
                    mood_rating: number | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    quest_id: string
                    user_id: string
                    goal_id?: string | null
                    completed_date: string
                    completed_at?: string
                    xp_earned?: number
                    base_xp?: number
                    streak_bonus_xp?: number
                    time_bonus_xp?: number
                    streak_count?: number
                    notes?: string | null
                    mood_rating?: number | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    quest_id?: string
                    user_id?: string
                    goal_id?: string | null
                    completed_date?: string
                    completed_at?: string
                    xp_earned?: number
                    base_xp?: number
                    streak_bonus_xp?: number
                    time_bonus_xp?: number
                    streak_count?: number
                    notes?: string | null
                    mood_rating?: number | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "quest_completions_quest_id_fkey"
                        columns: ["quest_id"]
                        isOneToOne: false
                        referencedRelation: "daily_quests"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "quest_completions_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "quest_completions_goal_id_fkey"
                        columns: ["goal_id"]
                        isOneToOne: false
                        referencedRelation: "goals"
                        referencedColumns: ["id"]
                    }
                ]
            }
            rituals: {
                Row: {
                    id: string
                    user_id: string
                    goal_id: string | null
                    trigger_habit: string
                    action: string
                    linked_quest_id: string | null
                    emoji: string
                    current_streak: number
                    longest_streak: number
                    last_completed_date: string | null
                    base_xp: number
                    streak_multiplier: number
                    is_active: boolean
                    total_completions: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    goal_id?: string | null
                    trigger_habit: string
                    action: string
                    linked_quest_id?: string | null
                    emoji?: string
                    current_streak?: number
                    longest_streak?: number
                    last_completed_date?: string | null
                    base_xp?: number
                    streak_multiplier?: number
                    is_active?: boolean
                    total_completions?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    goal_id?: string | null
                    trigger_habit?: string
                    action?: string
                    linked_quest_id?: string | null
                    emoji?: string
                    current_streak?: number
                    longest_streak?: number
                    last_completed_date?: string | null
                    base_xp?: number
                    streak_multiplier?: number
                    is_active?: boolean
                    total_completions?: number
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "rituals_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "rituals_goal_id_fkey"
                        columns: ["goal_id"]
                        isOneToOne: false
                        referencedRelation: "goals"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "rituals_linked_quest_id_fkey"
                        columns: ["linked_quest_id"]
                        isOneToOne: false
                        referencedRelation: "daily_quests"
                        referencedColumns: ["id"]
                    }
                ]
            }
            ritual_completions: {
                Row: {
                    id: string
                    ritual_id: string
                    user_id: string
                    completed_date: string
                    completed_at: string
                    xp_earned: number
                    streak_at_completion: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    ritual_id: string
                    user_id: string
                    completed_date: string
                    completed_at?: string
                    xp_earned?: number
                    streak_at_completion?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    ritual_id?: string
                    user_id?: string
                    completed_date?: string
                    completed_at?: string
                    xp_earned?: number
                    streak_at_completion?: number
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "ritual_completions_ritual_id_fkey"
                        columns: ["ritual_id"]
                        isOneToOne: false
                        referencedRelation: "rituals"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "ritual_completions_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            user_xp_stats: {
                Row: {
                    id: string
                    user_id: string
                    total_xp: number
                    current_level: number
                    xp_to_next_level: number
                    xp_today: number
                    xp_this_week: number
                    xp_this_month: number
                    longest_quest_streak: number
                    current_daily_streak: number
                    perfect_days_count: number
                    perfect_weeks_count: number
                    quests_completed_count: number
                    rituals_completed_count: number
                    last_xp_earned_at: string | null
                    last_perfect_day: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    total_xp?: number
                    current_level?: number
                    xp_to_next_level?: number
                    xp_today?: number
                    xp_this_week?: number
                    xp_this_month?: number
                    longest_quest_streak?: number
                    current_daily_streak?: number
                    perfect_days_count?: number
                    perfect_weeks_count?: number
                    quests_completed_count?: number
                    rituals_completed_count?: number
                    last_xp_earned_at?: string | null
                    last_perfect_day?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    total_xp?: number
                    current_level?: number
                    xp_to_next_level?: number
                    xp_today?: number
                    xp_this_week?: number
                    xp_this_month?: number
                    longest_quest_streak?: number
                    current_daily_streak?: number
                    perfect_days_count?: number
                    perfect_weeks_count?: number
                    quests_completed_count?: number
                    rituals_completed_count?: number
                    last_xp_earned_at?: string | null
                    last_perfect_day?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "user_xp_stats_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: true
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

// =====================================================
// Quest System Types
// =====================================================

// Key Result types
export type GoalKeyResult = Database['public']['Tables']['goal_key_results']['Row']
export type GoalKeyResultInsert = Database['public']['Tables']['goal_key_results']['Insert']
export type GoalKeyResultUpdate = Database['public']['Tables']['goal_key_results']['Update']
export type KeyResultMetricType = GoalKeyResult['metric_type']
export type KeyResultFrequency = GoalKeyResult['frequency']

// Daily Quest types
export type DailyQuest = Database['public']['Tables']['daily_quests']['Row']
export type DailyQuestInsert = Database['public']['Tables']['daily_quests']['Insert']
export type DailyQuestUpdate = Database['public']['Tables']['daily_quests']['Update']
export type QuestStatus = DailyQuest['status']
export type QuestDifficulty = DailyQuest['difficulty']
export type RecurrencePattern = DailyQuest['recurrence_pattern']

// Quest Completion types
export type QuestCompletion = Database['public']['Tables']['quest_completions']['Row']
export type QuestCompletionInsert = Database['public']['Tables']['quest_completions']['Insert']
export type QuestCompletionUpdate = Database['public']['Tables']['quest_completions']['Update']

// Ritual (Habit Stacking) types
export type Ritual = Database['public']['Tables']['rituals']['Row']
export type RitualInsert = Database['public']['Tables']['rituals']['Insert']
export type RitualUpdate = Database['public']['Tables']['rituals']['Update']

// Ritual Completion types
export type RitualCompletion = Database['public']['Tables']['ritual_completions']['Row']
export type RitualCompletionInsert = Database['public']['Tables']['ritual_completions']['Insert']

// User XP Stats types
export type UserXpStats = Database['public']['Tables']['user_xp_stats']['Row']
export type UserXpStatsInsert = Database['public']['Tables']['user_xp_stats']['Insert']
export type UserXpStatsUpdate = Database['public']['Tables']['user_xp_stats']['Update']

// =====================================================
// Quest System Composite Types
// =====================================================

// Quest with related data
export type DailyQuestWithDetails = DailyQuest & {
    goals: Pick<Goal, 'id' | 'title' | 'period'> | null
    goal_key_results: Pick<GoalKeyResult, 'id' | 'title'> | null
}

// Today's quests grouped
export interface TodayQuestsGroup {
    goal: Pick<Goal, 'id' | 'title' | 'period' | 'current_value' | 'target_value'> | null
    quests: DailyQuest[]
    completedCount: number
    totalXp: number
}

// Daily summary
export interface DailySummary {
    date: string
    questsCompleted: number
    questsTotal: number
    xpEarned: number
    isPerfectDay: boolean
    streakStatus: 'maintained' | 'at_risk' | 'broken'
}

// Ritual with streak info
export type RitualWithStreak = Ritual & {
    streakStatus: 'active' | 'at_risk' | 'inactive'
    nextMilestone: number
}

// Goal with key results and quests
export type GoalWithQuests = GoalWithDetails & {
    goal_key_results: GoalKeyResult[]
    daily_quests: DailyQuest[]
    rituals: Ritual[]
}

// =====================================================
// Quest Template Types
// =====================================================

export interface QuestTemplate {
    id: string
    category_slug: CategorySlug
    slug: string
    title: string
    description: string | null
    emoji: string
    xp_reward: number
    difficulty: 'easy' | 'medium' | 'hard'
    time_of_day: 'morning' | 'afternoon' | 'evening' | 'anytime' | null
    estimated_minutes: number | null
    is_recurring_default: boolean
    recurrence_pattern: RecurrencePattern | null
    goal_template_id: string | null  // Link to goal template
    progress_contribution: number    // Value added to goal when quest completed
    contribution_unit: string | null // 'kcal', 'step', 'gram', 'minute', 'percent'
    contribution_met_value: number | null // MET value for calorie calculation
    contribution_display: string | null // Human-readable: "+306 kcal (~1.1%)"
    contribution_type: 'direct' | 'momentum' // direct = measurable, momentum = consistency-based
    sort_order: number
    created_at: string
}

export type QuestTemplateTimeOfDay = QuestTemplate['time_of_day']

// =====================================================
// Goal Template Types
// =====================================================

export type ProgressDirection = 'increase' | 'decrease'

export interface GoalTemplate {
    id: string
    category_slug: CategorySlug
    slug: string
    title: string
    description: string | null
    emoji: string

    // Progress Configuration
    metric_unit: string
    metric_name: string
    default_target_value: number | null
    progress_direction: ProgressDirection

    // Time Configuration
    default_period: GoalPeriod
    default_duration_days: number

    // Difficulty & XP
    difficulty: 'easy' | 'medium' | 'hard'
    completion_xp: number

    // Quest → Goal Progress Formula
    quest_progress_value: number

    sort_order: number
    is_active: boolean
    created_at: string
}

// Goal Template with linked quest templates
export interface GoalTemplateWithQuests extends GoalTemplate {
    quest_templates: QuestTemplate[]
}

