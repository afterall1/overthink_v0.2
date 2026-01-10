// =====================================================
// AI Service - Google Gemini Integration
// =====================================================

import { GoogleGenAI } from '@google/genai'
import { AI_CONFIG } from './aiConfig'

// Lazy-initialized Gemini client
let _geminiClient: GoogleGenAI | null = null

/**
 * Get Gemini client instance (lazy initialization)
 * This prevents errors when GOOGLE_AI_API_KEY is not set during module load
 */
function getGeminiClient(): GoogleGenAI {
    if (!_geminiClient) {
        const apiKey = process.env.GOOGLE_AI_API_KEY
        if (!apiKey) {
            throw new Error('GOOGLE_AI_API_KEY ortam değişkeni ayarlanmamış. Lütfen .env.local dosyasına ekleyin.')
        }
        _geminiClient = new GoogleGenAI({ apiKey })
    }
    return _geminiClient
}

/**
 * AI Response type
 */
export interface AIResponse {
    success: boolean
    content: string
    usage?: {
        promptTokens: number
        completionTokens: number
        totalTokens: number
    }
    error?: string
}

/**
 * Message format for chat completions
 */
export interface ChatMessage {
    role: 'system' | 'user' | 'assistant'
    content: string
}

/**
 * Convert our message format to Gemini format
 */
function convertToGeminiMessages(messages: ChatMessage[]): Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> {
    const result: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = []

    // Gemini doesn't have a system role, so we prepend it to the first user message
    let systemPrompt = ''

    for (const msg of messages) {
        if (msg.role === 'system') {
            systemPrompt = msg.content + '\n\n'
        } else if (msg.role === 'user') {
            result.push({
                role: 'user',
                parts: [{ text: systemPrompt + msg.content }]
            })
            systemPrompt = '' // Only prepend to first user message
        } else if (msg.role === 'assistant') {
            result.push({
                role: 'model',
                parts: [{ text: msg.content }]
            })
        }
    }

    return result
}

/**
 * Generate a chat completion from Gemini
 */
export async function generateCompletion(
    messages: ChatMessage[],
    options?: {
        maxTokens?: number
        temperature?: number
    }
): Promise<AIResponse> {
    try {
        const client = getGeminiClient()
        const geminiMessages = convertToGeminiMessages(messages)

        const response = await client.models.generateContent({
            model: AI_CONFIG.model,
            contents: geminiMessages,
            config: {
                maxOutputTokens: options?.maxTokens ?? AI_CONFIG.maxTokens,
                temperature: options?.temperature ?? AI_CONFIG.temperature
            }
        })

        const text = response.text

        if (!text) {
            return {
                success: false,
                content: '',
                error: 'No response content received'
            }
        }

        return {
            success: true,
            content: text,
            usage: response.usageMetadata ? {
                promptTokens: response.usageMetadata.promptTokenCount ?? 0,
                completionTokens: response.usageMetadata.candidatesTokenCount ?? 0,
                totalTokens: response.usageMetadata.totalTokenCount ?? 0
            } : undefined
        }
    } catch (error) {
        return handleGeminiError(error)
    }
}

/**
 * Generate a streaming chat completion
 */
export async function* streamCompletion(
    messages: ChatMessage[],
    options?: {
        maxTokens?: number
        temperature?: number
    }
): AsyncGenerator<string, void, unknown> {
    try {
        const client = getGeminiClient()
        const geminiMessages = convertToGeminiMessages(messages)

        const response = await client.models.generateContentStream({
            model: AI_CONFIG.model,
            contents: geminiMessages,
            config: {
                maxOutputTokens: options?.maxTokens ?? AI_CONFIG.maxTokens,
                temperature: options?.temperature ?? AI_CONFIG.temperature
            }
        })

        for await (const chunk of response) {
            const text = chunk.text
            if (text) {
                yield text
            }
        }
    } catch (error) {
        const errorResponse = handleGeminiError(error)
        yield `[ERROR]: ${errorResponse.error}`
    }
}

/**
 * Retry wrapper with exponential backoff
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    maxAttempts: number = AI_CONFIG.retryAttempts
): Promise<T> {
    let lastError: Error | undefined

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn()
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error))

            // Don't retry on certain errors
            if (isNonRetryableError(error)) {
                throw lastError
            }

            // Exponential backoff
            if (attempt < maxAttempts) {
                const delay = AI_CONFIG.retryDelay * Math.pow(2, attempt - 1)
                await sleep(delay)
            }
        }
    }

    throw lastError ?? new Error('All retry attempts failed')
}

/**
 * Handle Gemini errors and return standardized response
 */
function handleGeminiError(error: unknown): AIResponse {
    console.error('[Gemini Service Error]:', error)

    if (error instanceof Error) {
        const message = error.message.toLowerCase()

        // Rate limit error
        if (message.includes('rate limit') || message.includes('quota')) {
            return {
                success: false,
                content: '',
                error: 'Rate limit aşıldı. Lütfen biraz bekleyip tekrar dene.'
            }
        }

        // Authentication error
        if (message.includes('api key') || message.includes('authentication') || message.includes('unauthorized')) {
            return {
                success: false,
                content: '',
                error: 'API anahtarı geçersiz. Lütfen GOOGLE_AI_API_KEY değerini kontrol et.'
            }
        }

        // Safety/content filter
        if (message.includes('safety') || message.includes('blocked')) {
            return {
                success: false,
                content: '',
                error: 'İçerik güvenlik filtresine takıldı.'
            }
        }

        return {
            success: false,
            content: '',
            error: `Gemini hatası: ${error.message}`
        }
    }

    // Network or unknown error
    return {
        success: false,
        content: '',
        error: 'AI servisine bağlanılamadı. Lütfen bağlantını kontrol et.'
    }
}

/**
 * Check if error should not be retried
 */
function isNonRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
        const message = error.message.toLowerCase()
        // Don't retry auth, quota, or content policy errors
        return message.includes('api key') ||
            message.includes('unauthorized') ||
            message.includes('safety') ||
            message.includes('blocked')
    }
    return false
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}
