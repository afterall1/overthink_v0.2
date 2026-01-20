import Foundation

// MARK: - User Model
struct User: Codable, Identifiable {
    let id: UUID
    let email: String
    var fullName: String?
    var avatarUrl: String?
    let createdAt: Date
    var updatedAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case email
        case fullName = "full_name"
        case avatarUrl = "avatar_url"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

// MARK: - Category Model
struct Category: Codable, Identifiable {
    let id: UUID
    let name: String
    let slug: CategorySlug
    let colorCode: String
    let iconSlug: String
    var description: String?
    let createdAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id, name, slug, description
        case colorCode = "color_code"
        case iconSlug = "icon_slug"
        case createdAt = "created_at"
    }
}

// MARK: - Category Slug Enum
enum CategorySlug: String, Codable, CaseIterable {
    case food
    case sport
    case trade
    case dev
    case etsy
    case gaming
    
    var color: String {
        switch self {
        case .trade: return "#F59E0B"
        case .food: return "#10B981"
        case .sport: return "#3B82F6"
        case .dev: return "#8B5CF6"
        case .etsy: return "#EC4899"
        case .gaming: return "#EF4444"
        }
    }
    
    var icon: String {
        switch self {
        case .trade: return "chart.line.uptrend.xyaxis"
        case .food: return "fork.knife"
        case .sport: return "dumbbell.fill"
        case .dev: return "chevron.left.forwardslash.chevron.right"
        case .etsy: return "bag.fill"
        case .gaming: return "gamecontroller.fill"
        }
    }
}

// MARK: - Goal Period Enum
enum GoalPeriod: String, Codable, CaseIterable {
    case daily
    case weekly
    case monthly
    case yearly
    
    var displayName: String {
        switch self {
        case .daily: return "Günlük"
        case .weekly: return "Haftalık"
        case .monthly: return "Aylık"
        case .yearly: return "Yıllık"
        }
    }
}

// MARK: - Goal Model
struct Goal: Codable, Identifiable {
    let id: UUID
    let userId: UUID
    var categoryId: UUID?
    var title: String
    var description: String?
    var targetValue: Double?
    var currentValue: Double
    var unit: String?
    var period: GoalPeriod
    var isCompleted: Bool
    let startDate: Date
    var endDate: Date?
    var momentumScore: Double?
    var habitMaturityDays: Int?
    var goalTemplateId: UUID?
    var metricUnit: String?
    var metricName: String?
    let createdAt: Date
    var updatedAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id, title, description, unit, period
        case userId = "user_id"
        case categoryId = "category_id"
        case targetValue = "target_value"
        case currentValue = "current_value"
        case isCompleted = "is_completed"
        case startDate = "start_date"
        case endDate = "end_date"
        case momentumScore = "momentum_score"
        case habitMaturityDays = "habit_maturity_days"
        case goalTemplateId = "goal_template_id"
        case metricUnit = "metric_unit"
        case metricName = "metric_name"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
    
    /// Calculate progress percentage (0-100)
    var progressPercentage: Double {
        guard let target = targetValue, target > 0 else { return 0 }
        return min(100, (currentValue / target) * 100)
    }
}

// MARK: - Quest Status Enum
enum QuestStatus: String, Codable {
    case pending
    case completed
    case skipped
    case overdue
}

// MARK: - Quest Difficulty Enum
enum QuestDifficulty: String, Codable, CaseIterable {
    case easy
    case medium
    case hard
    
    var xpMultiplier: Double {
        switch self {
        case .easy: return 1.0
        case .medium: return 1.5
        case .hard: return 2.0
        }
    }
    
    var displayName: String {
        switch self {
        case .easy: return "Kolay"
        case .medium: return "Orta"
        case .hard: return "Zor"
        }
    }
    
    var emoji: String {
        switch self {
        case .easy: return "🟢"
        case .medium: return "🟡"
        case .hard: return "🔴"
        }
    }
}

// MARK: - Daily Quest Model
struct DailyQuest: Codable, Identifiable {
    let id: UUID
    var goalId: UUID?
    var keyResultId: UUID?
    let userId: UUID
    var title: String
    var description: String?
    var emoji: String
    var difficulty: QuestDifficulty
    var xpReward: Int
    var isRecurring: Bool
    var recurrencePattern: String?
    var recurrenceDays: [Int]?
    var scheduledTime: String?
    var scheduledDate: Date?
    var status: QuestStatus
    var isAiSuggested: Bool
    var progressContribution: Double
    var contributionType: String?
    let createdAt: Date
    var updatedAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id, title, description, emoji, difficulty, status
        case goalId = "goal_id"
        case keyResultId = "key_result_id"
        case userId = "user_id"
        case xpReward = "xp_reward"
        case isRecurring = "is_recurring"
        case recurrencePattern = "recurrence_pattern"
        case recurrenceDays = "recurrence_days"
        case scheduledTime = "scheduled_time"
        case scheduledDate = "scheduled_date"
        case isAiSuggested = "is_ai_suggested"
        case progressContribution = "progress_contribution"
        case contributionType = "contribution_type"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

// MARK: - Quest Completion Model
struct QuestCompletion: Codable, Identifiable {
    let id: UUID
    let questId: UUID
    var goalId: UUID?
    let userId: UUID
    let completedDate: Date
    var xpEarned: Int
    var baseXp: Int
    var streakBonusXp: Int
    var timeBonusXp: Int
    var streakCount: Int
    var notes: String?
    let createdAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id, notes
        case questId = "quest_id"
        case goalId = "goal_id"
        case userId = "user_id"
        case completedDate = "completed_date"
        case xpEarned = "xp_earned"
        case baseXp = "base_xp"
        case streakBonusXp = "streak_bonus_xp"
        case timeBonusXp = "time_bonus_xp"
        case streakCount = "streak_count"
        case createdAt = "created_at"
    }
}

// MARK: - User XP Stats Model
struct UserXpStats: Codable, Identifiable {
    let id: UUID
    let userId: UUID
    var totalXp: Int
    var currentLevel: Int
    var xpToNextLevel: Int
    var xpToday: Int
    var xpThisWeek: Int
    var xpThisMonth: Int
    var currentDailyStreak: Int
    var longestDailyStreak: Int
    var questsCompletedCount: Int
    var perfectDaysCount: Int
    var lastActivityDate: Date?
    var lastPerfectDay: Date?
    let createdAt: Date
    var updatedAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case totalXp = "total_xp"
        case currentLevel = "current_level"
        case xpToNextLevel = "xp_to_next_level"
        case xpToday = "xp_today"
        case xpThisWeek = "xp_this_week"
        case xpThisMonth = "xp_this_month"
        case currentDailyStreak = "current_daily_streak"
        case longestDailyStreak = "longest_daily_streak"
        case questsCompletedCount = "quests_completed_count"
        case perfectDaysCount = "perfect_days_count"
        case lastActivityDate = "last_activity_date"
        case lastPerfectDay = "last_perfect_day"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}
