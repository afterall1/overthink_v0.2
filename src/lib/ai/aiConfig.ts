// =====================================================
// AI Council Configuration - Google Gemini
// =====================================================

/**
 * AI model and request configuration
 * Using Google Gemini 2.0 Flash (stable, fast, reliable)
 */
export const AI_CONFIG = {
    /** Gemini model to use
     * Options:
     * - 'gemini-2.0-flash' - Fast and reliable (RECOMMENDED)
     * - 'gemini-2.5-pro' - More powerful, slower
     * - 'gemini-2.5-flash' - Balanced speed/quality
     */
    model: 'gemini-2.0-flash' as const,

    /** Maximum tokens in response */
    maxTokens: 2048,

    /** Creativity level (0-2 for Gemini) */
    temperature: 0.8,

    /** Number of retry attempts on failure */
    retryAttempts: 3,

    /** Base delay between retries (ms) */
    retryDelay: 1000,

    /** Rate limit per minute per user */
    rateLimitPerMinute: 20,

    /** Cache duration for insights (hours) */
    insightCacheHours: {
        daily: 4,
        weekly: 24,
        task_specific: 1
    }
} as const

/**
 * Council member definitions
 */
export const COUNCIL_MEMBERS = {
    task_advisor: {
        id: 'task_advisor',
        name: 'Task Advisor',
        description: 'Görev sonuçlarına göre yönlendirme yapar',
        emoji: '🎯'
    },
    life_coach: {
        id: 'life_coach',
        name: 'Life Coach',
        description: 'Günlük ve haftalık girdilere göre pozitif bilgilendirme yapar',
        emoji: '✨'
    }
} as const

export type CouncilMemberId = keyof typeof COUNCIL_MEMBERS
