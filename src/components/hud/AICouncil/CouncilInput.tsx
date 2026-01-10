'use client'

import { useState, useCallback } from 'react'
import { Send } from 'lucide-react'

interface CouncilInputProps {
    onSend: (message: string) => void
    isLoading: boolean
}

/**
 * Input field with send button for council chat
 */
export default function CouncilInput({ onSend, isLoading }: CouncilInputProps) {
    const [message, setMessage] = useState('')

    const handleSubmit = useCallback(() => {
        if (message.trim() && !isLoading) {
            onSend(message.trim())
            setMessage('')
        }
    }, [message, isLoading, onSend])

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
        }
    }, [handleSubmit])

    return (
        <div className="p-4 border-t border-slate-200/30 bg-white/30">
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Konseye sor..."
                    disabled={isLoading}
                    className="flex-1 ethereal-input py-3"
                    aria-label="Mesajınızı yazın"
                />

                <button
                    onClick={handleSubmit}
                    disabled={!message.trim() || isLoading}
                    className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-purple-500/30 transition-all active:scale-95"
                    aria-label="Gönder"
                >
                    <Send className="w-5 h-5" />
                </button>
            </div>
        </div>
    )
}
