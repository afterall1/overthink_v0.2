// =====================================================
// AI Lib - Barrel Export
// =====================================================

export { AI_CONFIG, COUNCIL_MEMBERS } from './aiConfig'
export type { CouncilMemberId } from './aiConfig'

export {
    generateCompletion,
    streamCompletion,
    withRetry
} from './aiService'
export type { AIResponse, ChatMessage } from './aiService'

export {
    getDailySummary,
    getWeeklySummary,
    getTaskContext,
    buildPromptContext
} from './userDataAggregator'
export type {
    DailySummary,
    WeeklySummary,
    TaskContext,
    CategoryBreakdown
} from './userDataAggregator'
