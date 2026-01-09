import { z } from 'zod'
import { CategorySlug } from '@/types/database.types'

// Trade Schema
export const tradeSchema = z.object({
    pair: z.string().min(1, 'Pair zorunlu'),
    side: z.enum(['long', 'short']),
    entry: z.number().positive('Entry pozitif olmalı'),
    exit: z.number().optional(),
    pnl: z.number(),
    pnl_percent: z.number().optional(),
})

// Food Schema
export const foodSchema = z.object({
    meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
    calories: z.number().min(0, 'Kalori negatif olamaz'),
    protein: z.number().min(0).optional(),
    carbs: z.number().min(0).optional(),
    fat: z.number().min(0).optional(),
    foods: z.string().optional(),
})

// Sport Schema
export const sportSchema = z.object({
    activity: z.string().min(1, 'Aktivite zorunlu'),
    duration_min: z.number().min(1, 'Süre en az 1 dakika'),
    calories_burned: z.number().min(0).optional(),
})

// Dev Schema
export const devSchema = z.object({
    project: z.string().min(1, 'Proje adı zorunlu'),
    task: z.string().min(1, 'Task zorunlu'),
    duration_min: z.number().min(1, 'Süre en az 1 dakika'),
    commits: z.number().min(0).optional(),
    language: z.string().optional(),
})

// Etsy Schema
export const etsySchema = z.object({
    product: z.string().min(1, 'Ürün adı zorunlu'),
    revenue: z.number().min(0, 'Gelir negatif olamaz'),
    cost: z.number().min(0).optional(),
    profit: z.number().optional(),
})

// Gaming Schema
export const gamingSchema = z.object({
    game: z.string().min(1, 'Oyun adı zorunlu'),
    duration_min: z.number().min(1, 'Süre en az 1 dakika'),
    achievement: z.string().optional(),
    platform: z.enum(['PC', 'PS5', 'Xbox', 'Switch', 'Mobile']).optional(),
})

// Common sentiment schema
export const sentimentSchema = z.number().min(1).max(10)

// Schema map
export const categorySchemas: Record<CategorySlug, z.ZodObject<Record<string, z.ZodTypeAny>>> = {
    trade: tradeSchema,
    food: foodSchema,
    sport: sportSchema,
    dev: devSchema,
    etsy: etsySchema,
    gaming: gamingSchema,
}

// Type inference
export type TradeFormData = z.infer<typeof tradeSchema>
export type FoodFormData = z.infer<typeof foodSchema>
export type SportFormData = z.infer<typeof sportSchema>
export type DevFormData = z.infer<typeof devSchema>
export type EtsyFormData = z.infer<typeof etsySchema>
export type GamingFormData = z.infer<typeof gamingSchema>
