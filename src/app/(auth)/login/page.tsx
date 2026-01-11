'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Mail, Lock, ArrowRight, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const loginSchema = z.object({
    email: z.email('Geçerli bir e-posta adresi girin'),
    password: z.string().min(6, 'Şifre en az 6 karakter olmalı')
})

type LoginFormData = z.infer<typeof loginSchema>

type AuthMode = 'password' | 'magic-link'

export default function LoginPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [authMode, setAuthMode] = useState<AuthMode>('password')
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        formState: { errors },
        getValues
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: ''
        }
    })

    const handlePasswordLogin = async (data: LoginFormData) => {
        setIsLoading(true)
        setErrorMessage(null)

        try {
            const supabase = createClient()
            const { error } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password
            })

            if (error) {
                if (error.message.includes('Invalid login credentials')) {
                    setErrorMessage('E-posta veya şifre hatalı')
                } else {
                    setErrorMessage(error.message)
                }
                return
            }

            router.push('/')
            router.refresh()
        } catch {
            setErrorMessage('Bir hata oluştu. Lütfen tekrar deneyin.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleMagicLink = async () => {
        const email = getValues('email')
        if (!email || !z.string().email().safeParse(email).success) {
            setErrorMessage('Lütfen geçerli bir e-posta adresi girin')
            return
        }

        setIsLoading(true)
        setErrorMessage(null)

        try {
            const supabase = createClient()
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`
                }
            })

            if (error) {
                setErrorMessage(error.message)
                return
            }

            setSuccessMessage('Giriş linki e-postanıza gönderildi. Lütfen e-postanızı kontrol edin.')
        } catch {
            setErrorMessage('Bir hata oluştu. Lütfen tekrar deneyin.')
        } finally {
            setIsLoading(false)
        }
    }

    const onSubmit = async (data: LoginFormData) => {
        if (authMode === 'password') {
            await handlePasswordLogin(data)
        } else {
            await handleMagicLink()
        }
    }

    return (
        <div>
            <h2 className="text-2xl font-bold text-white mb-2">Giriş Yap</h2>
            <p className="text-white/50 text-sm mb-6">
                Hesabınıza giriş yaparak devam edin
            </p>

            {/* Success Message */}
            <AnimatePresence>
                {successMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 mb-6"
                    >
                        <div className="flex items-center gap-3">
                            <Sparkles className="w-5 h-5 text-emerald-400" />
                            <p className="text-sm text-emerald-300">{successMessage}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error Message */}
            <AnimatePresence>
                {errorMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6"
                    >
                        <p className="text-sm text-red-300">{errorMessage}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Auth Mode Toggle */}
            <div className="flex gap-2 mb-6 p-1 bg-white/5 rounded-lg">
                <button
                    type="button"
                    onClick={() => setAuthMode('password')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${authMode === 'password'
                            ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                            : 'text-white/50 hover:text-white/70'
                        }`}
                >
                    Şifre ile
                </button>
                <button
                    type="button"
                    onClick={() => setAuthMode('magic-link')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${authMode === 'magic-link'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : 'text-white/50 hover:text-white/70'
                        }`}
                >
                    Magic Link
                </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Email Field */}
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-white/70 mb-2">
                        E-posta
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                        <input
                            id="email"
                            type="email"
                            autoComplete="email"
                            {...register('email')}
                            className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
                            placeholder="ornek@email.com"
                        />
                    </div>
                    {errors.email && (
                        <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
                    )}
                </div>

                {/* Password Field (only for password mode) */}
                <AnimatePresence>
                    {authMode === 'password' && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <label htmlFor="password" className="block text-sm font-medium text-white/70 mb-2">
                                Şifre
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                                <input
                                    id="password"
                                    type="password"
                                    autoComplete="current-password"
                                    {...register('password')}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                            {errors.password && (
                                <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>
                            )}
                            <div className="flex justify-end mt-2">
                                <Link
                                    href="/forgot-password"
                                    className="text-xs text-white/50 hover:text-violet-400 transition-colors"
                                >
                                    Şifremi unuttum
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-violet-500 to-cyan-500 text-white font-medium py-3 px-4 rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            {authMode === 'password' ? 'Giriş Yap' : 'Magic Link Gönder'}
                            <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </button>
            </form>

            {/* Register Link */}
            <div className="mt-6 text-center">
                <p className="text-sm text-white/50">
                    Hesabınız yok mu?{' '}
                    <Link
                        href="/register"
                        className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
                    >
                        Kayıt Ol
                    </Link>
                </p>
            </div>
        </div>
    )
}
