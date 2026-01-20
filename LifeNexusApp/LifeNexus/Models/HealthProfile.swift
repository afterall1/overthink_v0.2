import Foundation

// MARK: - Health Profile Model
struct UserHealthProfile: Codable, Identifiable {
    let id: UUID
    let userId: UUID
    var weightKg: Double
    var heightCm: Double
    var birthDate: Date
    var biologicalSex: BiologicalSex
    var activityLevel: ActivityLevel
    
    // Calculated values
    var bmrKcal: Int
    var tdeeKcal: Int
    var targetDailyKcal: Int
    
    // Activity & Movement
    var currentStepsAvg: Int?
    var workEnvironment: WorkEnvironment?
    var hasFitnessTracker: Bool?
    var bestActivityTime: TimeOfDayPreference?
    
    // Training Profile
    var trainingExperience: TrainingExperience?
    var trainingTypes: [String]?
    var gymAccess: GymAccess?
    var availableTrainingTimes: [String]?
    
    // Nutrition Habits
    var mealsPerDay: String?
    var cooksAtHome: CookingFrequency?
    var dailyVegetables: String?
    var fastFoodFrequency: FastFoodFrequency?
    var hasBreakfast: BreakfastHabit?
    var alcoholFrequency: AlcoholFrequency?
    
    // Hydration
    var currentWaterIntakeLiters: Double?
    var coffeeTeaCups: String?
    var hasWaterBottle: Bool?
    var hydrationBarriers: [String]?
    
    // Sugar Habits
    var sugarDrinksPerDay: Int?
    var sugarSources: [String]?
    var sugarCravingTrigger: SugarCravingTrigger?
    var acceptsArtificialSweeteners: Bool?
    
    // Sleep & Stress
    var sleepHoursAvg: Double?
    var sleepQuality: SleepQuality?
    var stressLevel: StressLevel?
    
    // Health Conditions
    var healthConditions: [String]?
    var dietaryRestrictions: [String]?
    var allergies: [String]?
    var usesSupplements: Bool?
    
    // Goals
    var primaryGoal: PrimaryGoal?
    var targetWeightKg: Double?
    var goalPace: GoalPace?
    var previousDietAttempts: DietAttemptsHistory?
    var mainStruggles: [String]?
    
    // Metadata
    var profileVersion: Int?
    var sectionsCompleted: [String]?
    
    let createdAt: Date
    var updatedAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case weightKg = "weight_kg"
        case heightCm = "height_cm"
        case birthDate = "birth_date"
        case biologicalSex = "biological_sex"
        case activityLevel = "activity_level"
        case bmrKcal = "bmr_kcal"
        case tdeeKcal = "tdee_kcal"
        case targetDailyKcal = "target_daily_kcal"
        case currentStepsAvg = "current_steps_avg"
        case workEnvironment = "work_environment"
        case hasFitnessTracker = "has_fitness_tracker"
        case bestActivityTime = "best_activity_time"
        case trainingExperience = "training_experience"
        case trainingTypes = "training_types"
        case gymAccess = "gym_access"
        case availableTrainingTimes = "available_training_times"
        case mealsPerDay = "meals_per_day"
        case cooksAtHome = "cooks_at_home"
        case dailyVegetables = "daily_vegetables"
        case fastFoodFrequency = "fast_food_frequency"
        case hasBreakfast = "has_breakfast"
        case alcoholFrequency = "alcohol_frequency"
        case currentWaterIntakeLiters = "current_water_intake_liters"
        case coffeeTeaCups = "coffee_tea_cups"
        case hasWaterBottle = "has_water_bottle"
        case hydrationBarriers = "hydration_barriers"
        case sugarDrinksPerDay = "sugar_drinks_per_day"
        case sugarSources = "sugar_sources"
        case sugarCravingTrigger = "sugar_craving_trigger"
        case acceptsArtificialSweeteners = "accepts_artificial_sweeteners"
        case sleepHoursAvg = "sleep_hours_avg"
        case sleepQuality = "sleep_quality"
        case stressLevel = "stress_level"
        case healthConditions = "health_conditions"
        case dietaryRestrictions = "dietary_restrictions"
        case allergies
        case usesSupplements = "uses_supplements"
        case primaryGoal = "primary_goal"
        case targetWeightKg = "target_weight_kg"
        case goalPace = "goal_pace"
        case previousDietAttempts = "previous_diet_attempts"
        case mainStruggles = "main_struggles"
        case profileVersion = "profile_version"
        case sectionsCompleted = "sections_completed"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

// MARK: - Health Profile Enums

enum BiologicalSex: String, Codable {
    case male
    case female
}

enum ActivityLevel: String, Codable, CaseIterable {
    case sedentary
    case light
    case moderate
    case veryActive = "very_active"
    case extreme
    
    var multiplier: Double {
        switch self {
        case .sedentary: return 1.2
        case .light: return 1.375
        case .moderate: return 1.55
        case .veryActive: return 1.725
        case .extreme: return 1.9
        }
    }
    
    var displayName: String {
        switch self {
        case .sedentary: return "Hareketsiz"
        case .light: return "Hafif Aktif"
        case .moderate: return "Orta Aktif"
        case .veryActive: return "Çok Aktif"
        case .extreme: return "Profesyonel Sporcu"
        }
    }
}

enum PrimaryGoal: String, Codable, CaseIterable {
    case weightLoss = "weight_loss"
    case weightGain = "weight_gain"
    case maintenance
    case muscleGain = "muscle_gain"
    case endurance
    
    var displayName: String {
        switch self {
        case .weightLoss: return "Kilo Vermek"
        case .weightGain: return "Kilo Almak"
        case .maintenance: return "Kilo Koruma"
        case .muscleGain: return "Kas Geliştirme"
        case .endurance: return "Dayanıklılık"
        }
    }
}

enum GoalPace: String, Codable, CaseIterable {
    case slow
    case moderate
    case aggressive
    
    var displayName: String {
        switch self {
        case .slow: return "Yavaş"
        case .moderate: return "Orta"
        case .aggressive: return "Hızlı"
        }
    }
}

enum StressLevel: String, Codable, CaseIterable {
    case low
    case medium
    case high
}

enum WorkEnvironment: String, Codable {
    case desk
    case mixed
    case active
    case standing
}

enum TimeOfDayPreference: String, Codable {
    case morning
    case afternoon
    case evening
    case flexible
}

enum TrainingExperience: String, Codable {
    case none
    case beginner
    case intermediate
    case advanced
}

enum GymAccess: String, Codable {
    case fullGym = "full_gym"
    case homeGym = "home_gym"
    case outdoor
    case none
}

enum CookingFrequency: String, Codable {
    case always
    case often
    case sometimes
    case rarely
}

enum FastFoodFrequency: String, Codable {
    case never
    case weekly
    case fewTimesWeek = "few_times_week"
    case daily
}

enum BreakfastHabit: String, Codable {
    case always
    case sometimes
    case rarely
    case never
}

enum AlcoholFrequency: String, Codable {
    case never
    case occasional
    case weekly
    case daily
}

enum SugarCravingTrigger: String, Codable {
    case morningCoffee = "morning_coffee"
    case afterLunch = "after_lunch"
    case afterDinner = "after_dinner"
    case lateNight = "late_night"
    case stress
}

enum SleepQuality: String, Codable {
    case poor
    case fair
    case good
    case excellent
}

enum DietAttemptsHistory: String, Codable {
    case never
    case failed
    case partial
    case success
}
