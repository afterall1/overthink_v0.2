'use client'

import { motion } from 'framer-motion'
import { Target } from 'lucide-react'

interface GoalsFABProps {
    onClick: () => void
}

export default function GoalsFAB({ onClick }: GoalsFABProps) {
    return (
        <motion.button
            onClick={onClick}
            className="goals-fab group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            aria-label="Hedefler panelini aç"
        >
            <Target className="w-5 h-5 text-white" />
            <span className="text-white font-semibold text-sm">Hedefler</span>
        </motion.button>
    )
}
