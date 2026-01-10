'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
}

interface CouncilChatProps {
    messages: Message[]
    isLoading: boolean
}

/**
 * Chat interface with markdown-like rendering
 */
export default function CouncilChat({ messages, isLoading }: CouncilChatProps) {
    const scrollRef = useRef<HTMLDivElement>(null)

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages, isLoading])

    return (
        <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
        >
            {/* Empty state */}
            {messages.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <span className="text-5xl mb-4">🏛️</span>
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">
                        Konsey Hazır
                    </h3>
                    <p className="text-sm text-slate-500 max-w-xs">
                        Yukarıdaki hızlı aksiyonları kullan veya aşağıya bir soru yaz
                    </p>
                </div>
            )}

            {/* Messages */}
            {messages.map((message, index) => (
                <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                    <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 ${message.role === 'user'
                                ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                                : 'bg-white/70 border border-slate-200/50 text-slate-800'
                            }`}
                    >
                        {message.role === 'assistant' ? (
                            <CouncilResponse content={message.content} />
                        ) : (
                            <p className="text-sm">{message.content}</p>
                        )}
                    </div>
                </motion.div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                >
                    <div className="bg-white/70 border border-slate-200/50 rounded-2xl px-4 py-3">
                        <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                            <span className="text-sm text-slate-500">Konsey tartışıyor...</span>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    )
}

/**
 * Renders AI response with basic markdown-like formatting
 */
function CouncilResponse({ content }: { content: string }) {
    // Parse content into sections
    const sections = content.split('\n').map((line, i) => {
        // Headers (### )
        if (line.startsWith('### ')) {
            return (
                <h3 key={i} className="text-base font-bold text-purple-700 mt-4 mb-2 first:mt-0">
                    {line.replace('### ', '')}
                </h3>
            )
        }

        // Bold headers (** **)
        if (line.startsWith('**') && line.endsWith('**')) {
            return (
                <h4 key={i} className="text-sm font-semibold text-slate-800 mt-3 mb-1">
                    {line.replace(/\*\*/g, '')}
                </h4>
            )
        }

        // Bullet points
        if (line.startsWith('* ') || line.startsWith('- ')) {
            const text = line.slice(2)
            // Check for bold within bullet
            const parts = text.split(/(\*\*[^*]+\*\*)/)
            return (
                <li key={i} className="text-sm text-slate-700 ml-4 mb-1 list-disc">
                    {parts.map((part, j) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={j} className="font-semibold">{part.replace(/\*\*/g, '')}</strong>
                        }
                        return <span key={j}>{part}</span>
                    })}
                </li>
            )
        }

        // Numbered lists
        if (/^\d+\.\s/.test(line)) {
            return (
                <li key={i} className="text-sm text-slate-700 ml-4 mb-1 list-decimal">
                    {line.replace(/^\d+\.\s/, '')}
                </li>
            )
        }

        // Empty line
        if (!line.trim()) {
            return <div key={i} className="h-2" />
        }

        // Regular paragraph
        return (
            <p key={i} className="text-sm text-slate-700 mb-1">
                {line}
            </p>
        )
    })

    return <div className="council-response">{sections}</div>
}
