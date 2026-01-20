import Foundation

// MARK: - Streak Engine
/// Engine for managing and calculating streak mechanics
/// Swift port of src/lib/streakEngine.ts
final class StreakEngine {
    static let shared = StreakEngine()
    
    private init() {}
    
    // MARK: - Constants
    
    /// Grace period in hours for streak continuation
    private let gracePeriodHours: Int = 4
    
    /// Maximum streak cap (for display purposes)
    private let maxStreakCap: Int = 999
    
    // MARK: - Streak Calculation
    
    /// Calculate new streak based on completion
    func calculateNewStreak(
        currentStreak: Int,
        lastCompletedAt: Date?,
        completedAt: Date = Date()
    ) -> (newStreak: Int, isNewRecord: Bool, wasBroken: Bool) {
        let calendar = Calendar.current
        
        guard let lastCompleted = lastCompletedAt else {
            // First completion ever = start streak at 1
            return (1, true, false)
        }
        
        // Get day boundaries
        guard let todayStart = calendar.date(from: calendar.dateComponents([.year, .month, .day], from: completedAt)),
              let lastCompletedDay = calendar.date(from: calendar.dateComponents([.year, .month, .day], from: lastCompleted)) else {
            return (1, true, false)
        }
        
        guard let daysDiff = calendar.dateComponents([.day], from: lastCompletedDay, to: todayStart).day else {
            return (1, true, false)
        }
        
        switch daysDiff {
        case 0:
            // Same day - streak unchanged
            return (currentStreak, false, false)
            
        case 1:
            // Next day - streak continues
            let newStreak = min(currentStreak + 1, maxStreakCap)
            return (newStreak, newStreak > currentStreak, false)
            
        default:
            // Check grace period
            let hoursDiff = calendar.dateComponents([.hour], from: lastCompleted, to: completedAt).hour ?? 0
            
            if daysDiff == 2 && hoursDiff <= 24 + gracePeriodHours {
                // Within grace period - streak continues
                let newStreak = min(currentStreak + 1, maxStreakCap)
                return (newStreak, newStreak > currentStreak, false)
            }
            
            // Streak broken - reset to 1
            return (1, false, true)
        }
    }
    
    // MARK: - Streak Status
    
    /// Get current streak status
    func getStreakStatus(
        currentStreak: Int,
        lastCompletedAt: Date?
    ) -> StreakStatus {
        guard let lastCompleted = lastCompletedAt else {
            return .noStreak
        }
        
        let calendar = Calendar.current
        let now = Date()
        
        guard let todayStart = calendar.date(from: calendar.dateComponents([.year, .month, .day], from: now)),
              let lastCompletedDay = calendar.date(from: calendar.dateComponents([.year, .month, .day], from: lastCompleted)),
              let daysDiff = calendar.dateComponents([.day], from: lastCompletedDay, to: todayStart).day else {
            return .noStreak
        }
        
        switch daysDiff {
        case 0:
            // Completed today - streak active
            return .active(streak: currentStreak)
            
        case 1:
            // Yesterday - at risk, needs completion today
            return .atRisk(streak: currentStreak, hoursRemaining: remainingHoursInDay(now))
            
        default:
            // Check grace period
            let hoursDiff = calendar.dateComponents([.hour], from: lastCompleted, to: now).hour ?? 0
            
            if daysDiff == 2 && hoursDiff <= 24 + gracePeriodHours {
                let remainingGrace = max(0, (24 + gracePeriodHours) - hoursDiff)
                return .gracePeriod(streak: currentStreak, hoursRemaining: remainingGrace)
            }
            
            // Streak is broken
            return .broken(previousStreak: currentStreak)
        }
    }
    
    /// Calculate remaining hours in the current day
    private func remainingHoursInDay(_ date: Date) -> Int {
        let calendar = Calendar.current
        guard let endOfDay = calendar.date(bySettingHour: 23, minute: 59, second: 59, of: date) else {
            return 0
        }
        
        let hours = calendar.dateComponents([.hour], from: date, to: endOfDay).hour ?? 0
        return max(0, hours)
    }
    
    // MARK: - Streak Rewards
    
    /// Get streak milestone rewards
    func getStreakMilestone(streak: Int) -> StreakMilestone? {
        switch streak {
        case 7:
            return StreakMilestone(
                streak: 7,
                title: "İlk Hafta 🎯",
                description: "7 günlük streak tamamladın!",
                bonusXp: 100,
                badge: "week_warrior"
            )
        case 14:
            return StreakMilestone(
                streak: 14,
                title: "İki Hafta 💪",
                description: "14 günlük streak - Alışkanlık oluşuyor!",
                bonusXp: 250,
                badge: "habit_builder"
            )
        case 30:
            return StreakMilestone(
                streak: 30,
                title: "Aylık Şampiyon 🏆",
                description: "30 günlük streak - Efsane oluyorsun!",
                bonusXp: 500,
                badge: "monthly_champion"
            )
        case 60:
            return StreakMilestone(
                streak: 60,
                title: "İki Aylık Kahraman 🦸",
                description: "60 günlük streak - Durdurulamıyorsun!",
                bonusXp: 1000,
                badge: "hero_status"
            )
        case 90:
            return StreakMilestone(
                streak: 90,
                title: "Üç Aylık Efsane 👑",
                description: "90 günlük streak - Yaşayan efsanesin!",
                bonusXp: 2000,
                badge: "legend"
            )
        case 365:
            return StreakMilestone(
                streak: 365,
                title: "Yıllık Titan ⚡",
                description: "Tam bir yıl! Tarihe geçtin!",
                bonusXp: 10000,
                badge: "titan"
            )
        default:
            return nil
        }
    }
    
    // MARK: - Freeze Token
    
    /// Check if user can use a streak freeze
    func canUseStreakFreeze(
        lastCompletedAt: Date?,
        freezeTokens: Int
    ) -> Bool {
        guard freezeTokens > 0 else { return false }
        
        let status = getStreakStatus(currentStreak: 1, lastCompletedAt: lastCompletedAt)
        
        switch status {
        case .atRisk, .gracePeriod:
            return true
        default:
            return false
        }
    }
}

// MARK: - Streak Status Enum
enum StreakStatus {
    case noStreak
    case active(streak: Int)
    case atRisk(streak: Int, hoursRemaining: Int)
    case gracePeriod(streak: Int, hoursRemaining: Int)
    case broken(previousStreak: Int)
    
    var emoji: String {
        switch self {
        case .noStreak: return "🆕"
        case .active: return "🔥"
        case .atRisk: return "⚠️"
        case .gracePeriod: return "🕐"
        case .broken: return "💔"
        }
    }
    
    var displayText: String {
        switch self {
        case .noStreak:
            return "Streak yok"
        case .active(let streak):
            return "\(streak) gün streak!"
        case .atRisk(let streak, let hours):
            return "\(streak) gün streak - \(hours)h kaldı"
        case .gracePeriod(let streak, let hours):
            return "\(streak) gün - \(hours)h tolerans"
        case .broken(let previous):
            return "Streak kırıldı (\(previous) gün)"
        }
    }
}

// MARK: - Streak Milestone
struct StreakMilestone {
    let streak: Int
    let title: String
    let description: String
    let bonusXp: Int
    let badge: String
}
