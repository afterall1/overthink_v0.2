// =====================================================
// LifeNexus Database Type Definitions
// Re-exports Supabase-generated types with additional helpers
// =====================================================

// Re-export all types from Supabase-generated file
// This is the PRIMARY source of truth for database types
export { type Database, type Json } from './supabase.generated'

// Import for local type usage
import type { Database, Json } from './supabase.generated'

// =====================================================
// Helper Types - Table Row Shortcuts
// =====================================================

export type Tables = Database['public']['Tables']
export type Views = Database['public']['Views']

// Table Row Types
export type User = Tables['users']['Row']
export type Category = Tables['categories']['Row']
export type Log = Tables['logs']['Row']
export type Goal = Tables['goals']['Row']
export type GoalKeyResult = Tables['goal_key_results']['Row']
export type Event = Tables['events']['Row']
export type DailyQuest = Tables['daily_quests']['Row']
export type QuestCompletion = Tables['quest_completions']['Row']
export type Ritual = Tables['rituals']['Row']
export type RitualCompletion = Tables['ritual_completions']['Row']
export type UserXpStats = Tables['user_xp_stats']['Row']
export type UserHealthProfile = Tables['user_health_profiles']['Row']

// New Synergy System Tables
export type GoalTemplate = Tables['goal_templates']['Row']
export type QuestTemplate = Tables['quest_templates']['Row']
export type QuestGoalContribution = Tables['quest_goal_contributions']['Row']

// Tables now available from Supabase after migration
export type GoalEntry = Tables['goal_entries']['Row']
export type GoalMilestone = Tables['goal_milestones']['Row']
export type AiConversation = Tables['ai_conversations']['Row']
export type AiInsight = Tables['ai_insights']['Row']

// Insert/Update types for new tables
export type GoalEntryInsert = Tables['goal_entries']['Insert']
export type GoalMilestoneInsert = Tables['goal_milestones']['Insert']
export type GoalMilestoneUpdate = Tables['goal_milestones']['Update']

export interface GoalWithDetails extends Goal {
    categories?: Category | null
    goal_key_results?: GoalKeyResult[]
    goal_entries?: GoalEntry[]
    goal_milestones?: GoalMilestone[]
    daily_quests?: DailyQuest[]
    goal_templates?: GoalTemplate | null
}

// Insert Types
export type GoalInsert = Tables['goals']['Insert']
export type DailyQuestInsert = Tables['daily_quests']['Insert']
export type QuestCompletionInsert = Tables['quest_completions']['Insert']
export type GoalTemplateInsert = Tables['goal_templates']['Insert']
export type QuestTemplateInsert = Tables['quest_templates']['Insert']
export type QuestGoalContributionInsert = Tables['quest_goal_contributions']['Insert']
export type UserHealthProfileInsert = Tables['user_health_profiles']['Insert']
export type EventInsert = Tables['events']['Insert']
export type LogInsert = Tables['logs']['Insert']

// Update Types
export type GoalUpdate = Tables['goals']['Update']
export type DailyQuestUpdate = Tables['daily_quests']['Update']
export type QuestGoalContributionUpdate = Tables['quest_goal_contributions']['Update']
export type UserHealthProfileUpdate = Tables['user_health_profiles']['Update']
export type EventUpdate = Tables['events']['Update']
export type UserXpStatsUpdate = Tables['user_xp_stats']['Update']

// =====================================================
// Enum Type Helpers
// =====================================================

export type CategorySlug = 'food' | 'sport' | 'trade' | 'dev' | 'etsy' | 'gaming'

export type GoalPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly'

export type QuestStatus = 'pending' | 'completed' | 'skipped' | 'overdue'

export type QuestDifficulty = 'easy' | 'medium' | 'hard'

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'anytime'

export type SynergyType = 'SYNERGISTIC' | 'COMPLEMENTARY' | 'PARALLEL' | 'CONFLICTING' | 'INDEPENDENT'

export type ContributionType = 'direct' | 'momentum' | 'synergy'

export type EventStatus = 'pending' | 'notified' | 'scheduled' | 'completed' | 'cancelled' | 'in_progress' | 'skipped'

// Extended Event type with category relation
export interface EventWithCategory extends Event {
    categories: Category | null
}

// =====================================================
// Extended Goal Types (with relationships)
// =====================================================

export interface GoalWithRelations extends Goal {
    categories?: Category | null
    goal_key_results?: GoalKeyResult[]
    daily_quests?: DailyQuest[]
    goal_template?: GoalTemplate | null
}

// =====================================================
// Quest Types (with relationships)
// =====================================================

export interface QuestWithGoal extends DailyQuest {
    goals?: Pick<Goal, 'id' | 'title' | 'metric_unit' | 'metric_name'> | null
}

export interface QuestWithContributions extends DailyQuest {
    quest_goal_contributions?: QuestGoalContribution[]
}

// Group of quests for a specific goal (used in DailyQuestsPanel)
export interface TodayQuestsGroup {
    goal: Pick<Goal, 'id' | 'title' | 'period' | 'current_value' | 'target_value'> | null
    quests: DailyQuest[]
    completedCount: number
    totalXp: number
}

// =====================================================
// Goal Template Extended Types
// =====================================================

export interface GoalTemplateWithQuests extends GoalTemplate {
    quest_templates?: QuestTemplate[]
}

// =====================================================
// Health Profile Extended Types
// =====================================================

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very_active' | 'extreme'

export type BiologicalSex = 'male' | 'female'

export type PrimaryGoal = 'weight_loss' | 'weight_gain' | 'maintenance' | 'muscle_gain' | 'endurance'

export type GoalPace = 'slow' | 'moderate' | 'aggressive'

export type StressLevel = 'low' | 'medium' | 'high'

// =====================================================
// XP & Gamification Types
// =====================================================

export interface XpBreakdown {
    base: number
    streak: number
    time: number
    difficulty: number
    total: number
}

export interface StreakData {
    current: number
    longest: number
    lastCompletedAt: string | null
    multiplier: number
    label: 'FRESH' | 'RISING' | 'STREAK' | 'MASTER' | 'LEGEND'
}

// =====================================================
// Momentum Score Types
// =====================================================

export interface MomentumData {
    score: number
    trend: 'rising' | 'stable' | 'falling'
    components: {
        completionRate: number
        streakMultiplier: number
        habitMaturity: number
        earlyBirdBonus: number
    }
}

// =====================================================
// Category Metadata
// =====================================================

export const CATEGORY_COLORS: Record<CategorySlug, string> = {
    trade: '#F59E0B',
    food: '#10B981',
    sport: '#3B82F6',
    dev: '#8B5CF6',
    etsy: '#EC4899',
    gaming: '#EF4444'
}

export const CATEGORY_ICONS: Record<CategorySlug, string> = {
    trade: 'trending-up',
    food: 'utensils',
    sport: 'dumbbell',
    dev: 'code-2',
    etsy: 'shopping-bag',
    gaming: 'gamepad-2'
}

// =====================================================
// Utility Type Functions
// =====================================================

/**
 * Get typed table row from Database
 */
export type TableRow<T extends keyof Tables> = Tables[T]['Row']

/**
 * Get typed table insert from Database
 */
export type TableInsert<T extends keyof Tables> = Tables[T]['Insert']

/**
 * Get typed table update from Database
 */
export type TableUpdate<T extends keyof Tables> = Tables[T]['Update']
