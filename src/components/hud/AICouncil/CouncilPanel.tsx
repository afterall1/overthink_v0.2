'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import CouncilHeader from './CouncilHeader'
import CouncilChat from './CouncilChat'
import CouncilInput from './CouncilInput'
import { useState, useCallback } from 'react'
import { getDailyInsights, getWeeklyInsights, getTaskAdvice } from '@/actions/ai'

interface CouncilPanelProps {
    isOpen: boolean
    onClose: () => void
    activeEventId?: string
}

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
}

/**
 * Main slide-up panel for AI Council
 * Contains header, chat, and input components
 */
export default function CouncilPanel({ isOpen, onClose, activeEventId }: CouncilPanelProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [activeMember, setActiveMember] = useState<string | null>(null)

    const addMessage = useCallback((role: 'user' | 'assistant', content: string) => {
        setMessages(prev => [...prev, {
            id: `${Date.now()}-${Math.random()}`,
            role,
            content,
            timestamp: new Date()
        }])
    }, [])

    const handleQuickAction = useCallback(async (action: 'daily' | 'weekly' | 'task') => {
        setIsLoading(true)
        setActiveMember('all')

        try {
            let result
            if (action === 'daily') {
                addMessage('user', '📊 Günlük özet istiyorum')
                result = await getDailyInsights()
            } else if (action === 'weekly') {
                addMessage('user', '📅 Haftalık rapor istiyorum')
                result = await getWeeklyInsights()
            } else if (action === 'task' && activeEventId) {
                addMessage('user', '🎯 Bu görev için tavsiye istiyorum')
                result = await getTaskAdvice(activeEventId, 'Bu görev hakkında ne düşünüyorsunuz?')
            }

            if (result?.success) {
                addMessage('assistant', result.content)
            } else {
                addMessage('assistant', `⚠️ Bir hata oluştu: ${result?.error ?? 'Bilinmeyen hata'}`)
            }
        } catch (error) {
            console.error('[Council Panel Error]:', error)
            addMessage('assistant', '⚠️ Konsey şu an yanıt veremiyor. Lütfen daha sonra tekrar dene.')
        } finally {
            setIsLoading(false)
            setActiveMember(null)
        }
    }, [addMessage, activeEventId])

    const handleSendMessage = useCallback(async (message: string) => {
        if (!message.trim()) return

        setIsLoading(true)
        setActiveMember('all')
        addMessage('user', message)

        try {
            // For now, use daily insights with custom query
            // In future, implement full conversation
            const result = await getDailyInsights()

            if (result?.success) {
                addMessage('assistant', result.content)
            } else {
                addMessage('assistant', `⚠️ ${result?.error ?? 'Konsey yanıt veremedi'}`)
            }
        } catch (error) {
            console.error('[Send Message Error]:', error)
            addMessage('assistant', '⚠️ Mesaj gönderilemedi.')
        } finally {
            setIsLoading(false)
            setActiveMember(null)
        }
    }, [addMessage])

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Panel */}
                    <motion.div
                        className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] md:max-h-[70vh] flex flex-col ethereal-glass rounded-t-3xl overflow-hidden"
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        drag="y"
                        dragConstraints={{ top: 0 }}
                        dragElastic={0.2}
                        onDragEnd={(_, info) => {
                            if (info.offset.y > 100) onClose()
                        }}
                    >
                        {/* Drag handle */}
                        <div className="flex justify-center py-2">
                            <div className="w-12 h-1.5 bg-slate-300/50 rounded-full" />
                        </div>

                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition-colors"
                            aria-label="Kapat"
                        >
                            <X className="w-5 h-5 text-slate-600" />
                        </button>

                        {/* Header with avatars */}
                        <CouncilHeader
                            activeMember={activeMember}
                            onQuickAction={handleQuickAction}
                            hasActiveEvent={!!activeEventId}
                        />

                        {/* Chat area */}
                        <CouncilChat
                            messages={messages}
                            isLoading={isLoading}
                        />

                        {/* Input */}
                        <CouncilInput
                            onSend={handleSendMessage}
                            isLoading={isLoading}
                        />
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
