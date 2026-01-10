'use client'

import { motion } from 'framer-motion'
import { Building2 } from 'lucide-react'

interface CouncilFABProps {
    onClick: () => void
    hasUnread?: boolean
}

/**
 * Floating Action Button for AI Council
 * Fixed position at bottom-right, opens the council panel
 */
export default function CouncilFAB({ onClick, hasUnread = false }: CouncilFABProps) {
    return (
        <motion.button
            onClick={onClick}
            className="council-fab group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            aria-label="AI Council'ı aç"
        >
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 opacity-50 blur-lg group-hover:opacity-70 transition-opacity" />

            {/* Button content */}
            <div className="relative flex items-center gap-2 text-white font-medium">
                <Building2 className="w-5 h-5" />
                <span className="text-sm hidden sm:inline">AI Council</span>
            </div>

            {/* Unread indicator */}
            {hasUnread && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            )}
        </motion.button>
    )
}
