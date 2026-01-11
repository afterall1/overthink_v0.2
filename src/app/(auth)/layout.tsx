'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

interface AuthLayoutProps {
    children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
            {/* Ambient background effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md relative z-10"
            >
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-block">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                            LifeNexus
                        </h1>
                    </Link>
                    <p className="text-sm text-white/50 mt-2">Your personal life command center</p>
                </div>

                {/* Auth Card */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                    {children}
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-white/30 mt-6">
                    © 2026 LifeNexus. All rights reserved.
                </p>
            </motion.div>
        </div>
    )
}
