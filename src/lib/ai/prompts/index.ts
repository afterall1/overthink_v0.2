// =====================================================
// AI Prompts - Barrel Export
// =====================================================

// Ana konsey prompt'u
export { COUNCIL_SYSTEM_PROMPT } from './council'

// Spesifik modlar
export {
    TASK_ADVISOR_SYSTEM_PROMPT,
    buildTaskAdvisorPrompt
} from './taskAdvisor'

export {
    LIFE_COACH_SYSTEM_PROMPT,
    buildLifeCoachPrompt
} from './lifeCoach'

// =====================================================
// Health Council Prompts (Goal-Specific)
// =====================================================

export { BASE_SYSTEM_PROMPT } from './baseSystemPrompt'

export {
    SUGAR_REDUCTION_PROMPT,
    buildSugarContextMessage
} from './sugarReductionPrompt'

export {
    WEIGHT_LOSS_PROMPT,
    buildWeightLossContextMessage
} from './weightLossPrompt'

// Composition utilities
export {
    getGoalSpecificPrompt,
    composeSystemPrompt,
    buildGoalContextMessage
} from './healthPromptComposer'
