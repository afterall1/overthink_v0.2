'use client'

import { motion } from 'framer-motion'
import { HeartPulse } from 'lucide-react'

interface HealthFABProps {
    onClick: () => void
}

export default function HealthFAB({ onClick }: HealthFABProps) {
    return (
        <motion.button
            onClick={onClick}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.3 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="fixed bottom-36 right-4 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/30 transition-shadow hover:shadow-2xl hover:shadow-emerald-500/40"
            aria-label="Open Health Profile"
        >
            <HeartPulse className="w-7 h-7" />

            {/* Pulse ring animation */}
            <motion.span
                className="absolute inset-0 rounded-full bg-emerald-500"
                animate={{
                    scale: [1, 1.4, 1],
                    opacity: [0.4, 0, 0.4]
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut'
                }}
            />
        </motion.button>
    )
}
