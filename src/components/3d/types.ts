import { CategorySlug } from '@/types/database.types'

export interface SectorData {
    id: string
    slug: CategorySlug
    name: string
    colorCode: string
    iconSlug: string
    isCompleted: boolean
}

export interface DailyStatus {
    trade: boolean
    food: boolean
    sport: boolean
    dev: boolean
    etsy: boolean
    gaming: boolean
}

export const SECTOR_COLORS = {
    completed: '#22c55e',    // Neon Green
    incomplete: '#374151',   // Dim Gray
    hover: '#6366f1',        // Indigo
} as const

export const CATEGORY_COLORS: Record<CategorySlug, string> = {
    trade: '#F59E0B',   // Amber
    food: '#10B981',    // Emerald
    sport: '#3B82F6',   // Blue
    dev: '#8B5CF6',     // Purple
    etsy: '#EC4899',    // Pink
    gaming: '#EF4444',  // Red
} as const
