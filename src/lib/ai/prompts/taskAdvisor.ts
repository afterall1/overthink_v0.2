// =====================================================
// Task Advisor Prompt - Re-exports from Council
// =====================================================

export { TASK_ADVISOR_SYSTEM_PROMPT } from './council'

/**
 * Build task advisor prompt with context
 */
export function buildTaskAdvisorPrompt(
    systemPrompt: string,
    userContext: string,
    userQuery: string
): Array<{ role: 'system' | 'user'; content: string }> {
    return [
        {
            role: 'system',
            content: systemPrompt
        },
        {
            role: 'user',
            content: `
--- KULLANICI BAĞLAMI ---
${userContext}

--- KULLANICI SORUSU ---
${userQuery}
            `.trim()
        }
    ]
}
