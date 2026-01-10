// =====================================================
// Life Coach Prompt - Re-exports from Council
// =====================================================

export { LIFE_COACH_SYSTEM_PROMPT } from './council'

/**
 * Build life coach prompt with context
 */
export function buildLifeCoachPrompt(
    systemPrompt: string,
    userContext: string,
    insightType: 'daily' | 'weekly'
): Array<{ role: 'system' | 'user'; content: string }> {
    const timeFrame = insightType === 'daily' ? 'bugünkü' : 'bu haftaki'

    return [
        {
            role: 'system',
            content: systemPrompt
        },
        {
            role: 'user',
            content: `
--- KULLANICI ${insightType.toUpperCase()} VERİLERİ ---
${userContext}

Lütfen ${timeFrame} aktivitelerime göre bir konsey oturumu başlat ve değerlendirme yap.
            `.trim()
        }
    ]
}
