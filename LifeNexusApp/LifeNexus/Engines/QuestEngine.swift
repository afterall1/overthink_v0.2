import Foundation

// MARK: - XP Breakdown
struct XPBreakdown {
    let base: Int
    let streak: Int
    let time: Int
    let difficulty: Int
    var total: Int { base + streak + time + difficulty }
}

// MARK: - Streak Data
struct StreakData {
    let current: Int
    let longest: Int
    let lastCompletedAt: Date?
    let multiplier: Double
    let label: StreakLabel
    
    enum StreakLabel: String {
        case fresh = "FRESH"
        case rising = "RISING"
        case streak = "STREAK"
        case master = "MASTER"
        case legend = "LEGEND"
    }
}

// MARK: - Quest Engine
/// Engine for calculating XP, levels, and quest-related game mechanics
/// Swift port of src/lib/questEngine.ts
final class QuestEngine {
    static let shared = QuestEngine()
    
    // MARK: - Constants
    
    /// XP required for each level (level -> XP threshold)
    private let levelThresholds: [Int: Int] = [
        1: 0,
        2: 100,
        3: 250,
        4: 500,
        5: 850,
        6: 1300,
        7: 1850,
        8: 2500,
        9: 3250,
        10: 4100,
        11: 5050,
        12: 6100,
        13: 7250,
        14: 8500,
        15: 9850,
        16: 11300,
        17: 12850,
        18: 14500,
        19: 16250,
        20: 18100
    ]
    
    /// Base XP for each difficulty
    private let baseXpByDifficulty: [QuestDifficulty: Int] = [
        .easy: 25,
        .medium: 50,
        .hard: 100
    ]
    
    /// Streak bonus multipliers
    private let streakMultipliers: [(threshold: Int, multiplier: Double)] = [
        (3, 1.1),   // 3+ days: 10% bonus
        (7, 1.25),  // 7+ days: 25% bonus
        (14, 1.5),  // 14+ days: 50% bonus
        (30, 2.0),  // 30+ days: 100% bonus
        (60, 2.5),  // 60+ days: 150% bonus
        (90, 3.0)   // 90+ days: 200% bonus
    ]
    
    private init() {}
    
    // MARK: - XP Calculation
    
    /// Calculate total XP breakdown for a quest completion
    func calculateXP(
        quest: DailyQuest,
        currentStreak: Int,
        completedAt: Date = Date()
    ) -> XPBreakdown {
        // Base XP from difficulty
        let baseXp = baseXpByDifficulty[quest.difficulty] ?? 25
        
        // Streak bonus
        let streakMultiplier = getStreakMultiplier(streak: currentStreak)
        let streakBonus = Int(Double(baseXp) * (streakMultiplier - 1))
        
        // Time bonus (early completion)
        let timeBonus = calculateTimeBonus(completedAt: completedAt, scheduledTime: quest.scheduledTime)
        
        // Difficulty bonus
        let difficultyBonus: Int
        switch quest.difficulty {
        case .easy: difficultyBonus = 0
        case .medium: difficultyBonus = 10
        case .hard: difficultyBonus = 25
        }
        
        return XPBreakdown(
            base: baseXp,
            streak: streakBonus,
            time: timeBonus,
            difficulty: difficultyBonus
        )
    }
    
    /// Get streak multiplier based on current streak
    func getStreakMultiplier(streak: Int) -> Double {
        var multiplier = 1.0
        
        for (threshold, mult) in streakMultipliers where streak >= threshold {
            multiplier = mult
        }
        
        return multiplier
    }
    
    /// Calculate time bonus for early completion
    private func calculateTimeBonus(completedAt: Date, scheduledTime: String?) -> Int {
        let calendar = Calendar.current
        let hour = calendar.component(.hour, from: completedAt)
        
        // Morning completion bonus (6-9 AM)
        if hour >= 6 && hour < 9 {
            return 15
        }
        
        // Before noon bonus
        if hour < 12 {
            return 10
        }
        
        // Before 3 PM
        if hour < 15 {
            return 5
        }
        
        return 0
    }
    
    // MARK: - Level Calculation
    
    /// Calculate current level based on total XP
    func calculateLevel(totalXp: Int) -> Int {
        var level = 1
        
        for lvl in 1...20 {
            if let threshold = levelThresholds[lvl], totalXp >= threshold {
                level = lvl
            }
        }
        
        return level
    }
    
    /// Calculate XP required for next level
    func xpForNextLevel(currentLevel: Int) -> Int {
        let nextLevel = min(currentLevel + 1, 20)
        return levelThresholds[nextLevel] ?? 0
    }
    
    /// Calculate progress to next level (0.0 - 1.0)
    func progressToNextLevel(totalXp: Int, currentLevel: Int) -> Double {
        let currentThreshold = levelThresholds[currentLevel] ?? 0
        let nextThreshold = levelThresholds[min(currentLevel + 1, 20)] ?? currentThreshold
        
        let xpInCurrentLevel = totalXp - currentThreshold
        let xpNeededForLevel = nextThreshold - currentThreshold
        
        guard xpNeededForLevel > 0 else { return 1.0 }
        
        return min(1.0, Double(xpInCurrentLevel) / Double(xpNeededForLevel))
    }
    
    // MARK: - Streak Management
    
    /// Get streak data based on completion history
    func getStreakData(
        currentStreak: Int,
        longestStreak: Int,
        lastCompletedAt: Date?
    ) -> StreakData {
        let multiplier = getStreakMultiplier(streak: currentStreak)
        let label = getStreakLabel(streak: currentStreak)
        
        return StreakData(
            current: currentStreak,
            longest: longestStreak,
            lastCompletedAt: lastCompletedAt,
            multiplier: multiplier,
            label: label
        )
    }
    
    /// Get streak label based on streak count
    func getStreakLabel(streak: Int) -> StreakData.StreakLabel {
        switch streak {
        case 0...2: return .fresh
        case 3...6: return .rising
        case 7...29: return .streak
        case 30...89: return .master
        default: return .legend
        }
    }
    
    /// Check if streak is broken (more than 24 hours since last completion)
    func isStreakBroken(lastCompletedAt: Date?) -> Bool {
        guard let lastCompleted = lastCompletedAt else { return false }
        
        let calendar = Calendar.current
        let now = Date()
        
        // Get start of today and start of last completed day
        guard let todayStart = calendar.date(from: calendar.dateComponents([.year, .month, .day], from: now)),
              let lastCompletedStart = calendar.date(from: calendar.dateComponents([.year, .month, .day], from: lastCompleted)) else {
            return true
        }
        
        // Calculate days difference
        guard let daysDiff = calendar.dateComponents([.day], from: lastCompletedStart, to: todayStart).day else {
            return true
        }
        
        // Streak is broken if more than 1 day has passed
        return daysDiff > 1
    }
    
    // MARK: - Perfect Day Check
    
    /// Check if all quests for a day are completed
    func isPerfectDay(quests: [DailyQuest], date: Date = Date()) -> Bool {
        let calendar = Calendar.current
        
        let todayQuests = quests.filter { quest in
            guard let scheduledDate = quest.scheduledDate else { return false }
            return calendar.isDate(scheduledDate, inSameDayAs: date)
        }
        
        guard !todayQuests.isEmpty else { return false }
        
        return todayQuests.allSatisfy { $0.status == .completed }
    }
}
