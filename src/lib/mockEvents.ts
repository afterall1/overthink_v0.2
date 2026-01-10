// =====================================================
// LifeNexus - Mock Events Data
// Supabase bağlanmadan önce demo için kullanılır
// =====================================================

import type { Event } from '@/types/database.types'

// Helper: Gelecek tarih oluştur
function futureDate(daysFromNow: number, hour: number, minute: number = 0): string {
    const date = new Date()
    date.setDate(date.getDate() + daysFromNow)
    date.setHours(hour, minute, 0, 0)
    return date.toISOString()
}

// Category ID'leri (mock)
const CATEGORY_IDS = {
    trade: 'cat-trade-001',
    food: 'cat-food-002',
    sport: 'cat-sport-003',
    dev: 'cat-dev-004',
    etsy: 'cat-etsy-005',
    gaming: 'cat-gaming-006',
} as const

export const mockEvents: Event[] = [
    {
        id: 'evt-001',
        user_id: 'user-demo-001',
        category_id: CATEGORY_IDS.sport,
        title: 'Sabah Koşusu',
        description: '5km parkur koşusu',
        data: { activity: 'running', target_km: 5 },
        scheduled_at: futureDate(0, 7, 30), // Bugün 07:30
        duration_min: 45,
        reminder_min: 15,
        is_recurring: true,
        recurrence_rule: 'daily',
        status: 'pending',
        completed_at: null,
        linked_log_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'evt-002',
        user_id: 'user-demo-001',
        category_id: CATEGORY_IDS.dev,
        title: 'LifeNexus Sprint Review',
        description: 'Phase 5 Supabase entegrasyon kontrolü',
        data: { project: 'LifeNexus', task: 'Sprint Review' },
        scheduled_at: futureDate(0, 14, 0), // Bugün 14:00
        duration_min: 60,
        reminder_min: 30,
        is_recurring: false,
        recurrence_rule: null,
        status: 'pending',
        completed_at: null,
        linked_log_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'evt-003',
        user_id: 'user-demo-001',
        category_id: CATEGORY_IDS.trade,
        title: 'BTC Pozisyon Check',
        description: 'Açık pozisyonları değerlendir',
        data: { pair: 'BTC/USDT' },
        scheduled_at: futureDate(0, 21, 0), // Bugün 21:00
        duration_min: 15,
        reminder_min: 10,
        is_recurring: true,
        recurrence_rule: 'daily',
        status: 'pending',
        completed_at: null,
        linked_log_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'evt-004',
        user_id: 'user-demo-001',
        category_id: CATEGORY_IDS.food,
        title: 'Protein Shake',
        description: 'Post-workout shake',
        data: { meal_type: 'snack', calories: 200 },
        scheduled_at: futureDate(1, 8, 0), // Yarın 08:00
        duration_min: 5,
        reminder_min: 5,
        is_recurring: true,
        recurrence_rule: 'daily',
        status: 'pending',
        completed_at: null,
        linked_log_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'evt-005',
        user_id: 'user-demo-001',
        category_id: CATEGORY_IDS.etsy,
        title: 'Yeni Ürün Fotoğraf Çekimi',
        description: 'El yapımı kolyeler için fotoğraf',
        data: { product: 'Handmade Necklace Set' },
        scheduled_at: futureDate(2, 10, 0), // 2 gün sonra 10:00
        duration_min: 120,
        reminder_min: 60,
        is_recurring: false,
        recurrence_rule: null,
        status: 'pending',
        completed_at: null,
        linked_log_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'evt-006',
        user_id: 'user-demo-001',
        category_id: CATEGORY_IDS.gaming,
        title: 'Elden Ring Session',
        description: 'DLC bölümünü bitir',
        data: { game: 'Elden Ring', platform: 'PC' },
        scheduled_at: futureDate(3, 20, 0), // 3 gün sonra 20:00
        duration_min: 180,
        reminder_min: 15,
        is_recurring: false,
        recurrence_rule: null,
        status: 'pending',
        completed_at: null,
        linked_log_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
]

// Event'leri güncellemek için helper (mock state)
let eventsState = [...mockEvents]

export function getMockEvents(): Event[] {
    return eventsState
}

export function updateMockEventStatus(
    eventId: string,
    status: Event['status']
): Event | null {
    const index = eventsState.findIndex((e) => e.id === eventId)
    if (index === -1) return null

    eventsState[index] = {
        ...eventsState[index],
        status,
        completed_at: status === 'completed' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
    }

    return eventsState[index]
}

export function addMockEvent(event: Omit<Event, 'id' | 'created_at' | 'updated_at'>): Event {
    const newEvent: Event = {
        ...event,
        id: `evt-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    }
    eventsState.push(newEvent)
    return newEvent
}

// Reset mock state (testing için)
export function resetMockEvents(): void {
    eventsState = [...mockEvents]
}
