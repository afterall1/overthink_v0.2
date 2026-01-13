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

// Goal Synergy Engine
export {
    analyzeGoalSynergy,
    createQuestGoalContributions,
    getQuestGoalContributions,
    updateGoalsFromQuestCompletion,
    autoLinkSynergisticQuests,
    getSynergyRelationship,
    getSynergisticGoals,
    getConflictingGoals,
    areGoalsConflicting
} from './goalSynergyEngine'
export type {
    SynergyAnalysisResult,
    QuestContributionInfo,
    ActiveGoalInfo,
    SynergyType,
    SynergyRelationship
} from './goalSynergyEngine'

// Synergy Matrix
export {
    GOAL_SYNERGY_MATRIX,
    GOAL_METADATA
} from './synergyMatrix'
export type { GoalSynergyInfo } from './synergyMatrix'

// Synergy Context Builder (NEW)
export {
    buildSynergyContext,
    formatSynergyContextForPrompt,
    fetchExistingQuests,
    fetchSynergisticGoals,
    identifyMultiGoalContributions
} from './synergyContextBuilder'
export type {
    SynergyContext,
    ExistingQuestInfo,
    SynergisticGoalInfo
} from './synergyContextBuilder'
