'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Mail, Lock, User, ArrowRight, CheckCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const registerSchema = z.object({
    fullName: z.string().min(2, 'İsim en az 2 karakter olmalı'),
    email: z.email('Geçerli bir e-posta adresi girin'),
    password: z.string()
        .min(8, 'Şifre en az 8 karakter olmalı')
        .regex(/[A-Z]/, 'Şifre en az bir büyük harf içermeli')
        .regex(/[a-z]/, 'Şifre en az bir küçük harf içermeli')
        .regex(/[0-9]/, 'Şifre en az bir rakam içermeli'),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Şifreler eşleşmiyor',
    path: ['confirmPassword']
})

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            fullName: '',
            email: '',
            password: '',
            confirmPassword: ''
        }
    })

    const password = watch('password')

    // Password strength indicators
    const passwordChecks = {
        length: password?.length >= 8,
        uppercase: /[A-Z]/.test(password || ''),
        lowercase: /[a-z]/.test(password || ''),
        number: /[0-9]/.test(password || '')
    }

    const onSubmit = async (data: RegisterFormData) => {
        setIsLoading(true)
        setErrorMessage(null)

        try {
            const supabase = createClient()

            const { error } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    data: {
                        full_name: data.fullName
                    },
                    emailRedirectTo: `${window.location.origin}/auth/callback`
                }
            })

            if (error) {
                if (error.message.includes('already registered')) {
                    setErrorMessage('Bu e-posta adresi zaten kayıtlı')
                } else {
                    setErrorMessage(error.message)
                }
                return
            }

            setSuccessMessage('Kayıt başarılı! E-posta adresinizi doğrulamak için gelen kutunuzu kontrol edin.')

            // In dev mode without email confirmation, redirect immediately
            setTimeout(() => {
                router.push('/login')
            }, 3000)
        } catch {
            setErrorMessage('Bir hata oluştu. Lütfen tekrar deneyin.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div>
            <h2 className="text-2xl font-bold text-white mb-2">Kayıt Ol</h2>
            <p className="text-white/50 text-sm mb-6">
                LifeNexus ailesine katılın
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
                            <CheckCircle className="w-5 h-5 text-emerald-400" />
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

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Full Name Field */}
                <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-white/70 mb-2">
                        Ad Soyad
                    </label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                        <input
                            id="fullName"
                            type="text"
                            autoComplete="name"
                            {...register('fullName')}
                            className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
                            placeholder="Adınız Soyadınız"
                        />
                    </div>
                    {errors.fullName && (
                        <p className="text-red-400 text-xs mt-1">{errors.fullName.message}</p>
                    )}
                </div>

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

                {/* Password Field */}
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-white/70 mb-2">
                        Şifre
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                        <input
                            id="password"
                            type="password"
                            autoComplete="new-password"
                            {...register('password')}
                            className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
                            placeholder="••••••••"
                        />
                    </div>
                    {errors.password && (
                        <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>
                    )}

                    {/* Password Strength Indicators */}
                    {password && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-3 grid grid-cols-2 gap-2"
                        >
                            <PasswordCheck label="8+ karakter" checked={passwordChecks.length} />
                            <PasswordCheck label="Büyük harf" checked={passwordChecks.uppercase} />
                            <PasswordCheck label="Küçük harf" checked={passwordChecks.lowercase} />
                            <PasswordCheck label="Rakam" checked={passwordChecks.number} />
                        </motion.div>
                    )}
                </div>

                {/* Confirm Password Field */}
                <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/70 mb-2">
                        Şifre Tekrar
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                        <input
                            id="confirmPassword"
                            type="password"
                            autoComplete="new-password"
                            {...register('confirmPassword')}
                            className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
                            placeholder="••••••••"
                        />
                    </div>
                    {errors.confirmPassword && (
                        <p className="text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>
                    )}
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isLoading || !!successMessage}
                    className="w-full bg-gradient-to-r from-violet-500 to-cyan-500 text-white font-medium py-3 px-4 rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
                >
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            Kayıt Ol
                            <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
                <p className="text-sm text-white/50">
                    Zaten hesabınız var mı?{' '}
                    <Link
                        href="/login"
                        className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
                    >
                        Giriş Yap
                    </Link>
                </p>
            </div>
        </div>
    )
}

function PasswordCheck({ label, checked }: { label: string; checked: boolean }) {
    return (
        <div className={`flex items-center gap-2 text-xs ${checked ? 'text-emerald-400' : 'text-white/30'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${checked ? 'bg-emerald-400' : 'bg-white/20'}`} />
            {label}
        </div>
    )
}
