// =====================================================
// LifeNexus - Notification Utilities
// Web Push API ve Service Worker entegrasyonu
// =====================================================

import type { Event } from '@/types/database.types'

// Notification izni durumu
export type NotificationPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported'

/**
 * Bildirim iznini kontrol et
 */
export function getNotificationPermission(): NotificationPermissionStatus {
    if (typeof window === 'undefined' || !('Notification' in window)) {
        return 'unsupported'
    }
    return Notification.permission as NotificationPermissionStatus
}

/**
 * Bildirim izni iste
 * @returns Promise<boolean> - İzin verildi mi?
 */
export async function requestNotificationPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
        console.warn('Notifications are not supported in this browser')
        return false
    }

    if (Notification.permission === 'granted') {
        return true
    }

    if (Notification.permission === 'denied') {
        console.warn('Notification permission was denied')
        return false
    }

    try {
        const permission = await Notification.requestPermission()
        return permission === 'granted'
    } catch (error) {
        console.error('Error requesting notification permission:', error)
        return false
    }
}

/**
 * Bildirim göster
 */
export function showNotification(
    title: string,
    options?: NotificationOptions
): Notification | null {
    if (getNotificationPermission() !== 'granted') {
        console.warn('Notification permission not granted')
        return null
    }

    try {
        const notification = new Notification(title, {
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-192.png',
            ...options,
        })

        return notification
    } catch (error) {
        console.error('Error showing notification:', error)
        return null
    }
}

/**
 * Event için bildirim göster
 */
export function showEventNotification(event: Event): Notification | null {
    const categoryEmojis: Record<string, string> = {
        trade: '📈',
        food: '🍽️',
        sport: '🏃',
        dev: '💻',
        etsy: '🛍️',
        gaming: '🎮',
    }

    // Category slug'ı event.data veya başka bir yerden almanız gerekebilir
    // Şimdilik genel bir emoji kullanıyoruz
    const emoji = '⏰'

    return showNotification(`${emoji} ${event.title}`, {
        body: event.description || 'Zamanı geldi!',
        tag: event.id,
        requireInteraction: true,
    })
}

/**
 * Belirli bir süre sonra bildirim planla
 * NOT: Bu basit bir setTimeout kullanır. Gerçek uygulamada
 * Service Worker + Background Sync gerekir.
 */
export function scheduleNotification(
    event: Event,
    onNotify?: (event: Event) => void
): number | null {
    const scheduledTime = new Date(event.scheduled_at).getTime()
    const reminderTime = scheduledTime - event.reminder_min * 60 * 1000
    const now = Date.now()

    const delay = reminderTime - now

    if (delay <= 0) {
        // Zaten geçmiş
        return null
    }

    const timeoutId = window.setTimeout(() => {
        showEventNotification(event)
        onNotify?.(event)
    }, delay)

    return timeoutId
}

/**
 * Planlanmış bildirimi iptal et
 */
export function cancelScheduledNotification(timeoutId: number): void {
    window.clearTimeout(timeoutId)
}

/**
 * Service Worker kaydet (PWA için)
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        console.warn('Service Worker is not supported')
        return null
    }

    try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        console.log('Service Worker registered:', registration.scope)
        return registration
    } catch (error) {
        console.error('Service Worker registration failed:', error)
        return null
    }
}

/**
 * Tarihi okunabilir formata çevir
 */
export function formatEventTime(isoString: string): string {
    const date = new Date(isoString)
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const timeStr = date.toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
    })

    // Bugün mü?
    if (date.toDateString() === now.toDateString()) {
        return `Bugün ${timeStr}`
    }

    // Yarın mı?
    if (date.toDateString() === tomorrow.toDateString()) {
        return `Yarın ${timeStr}`
    }

    // Diğer günler
    return date.toLocaleDateString('tr-TR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    })
}

/**
 * Event'in zamanına ne kadar kaldığını hesapla
 */
export function getTimeUntilEvent(isoString: string): string {
    const eventTime = new Date(isoString).getTime()
    const now = Date.now()
    const diff = eventTime - now

    if (diff <= 0) return 'Geçti'

    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days} gün`
    if (hours > 0) return `${hours} saat`
    return `${minutes} dk`
}
