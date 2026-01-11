'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const forgotPasswordSchema = z.object({
    email: z.email('Geçerli bir e-posta adresi girin')
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            email: ''
        }
    })

    const onSubmit = async (data: ForgotPasswordFormData) => {
        setIsLoading(true)
        setErrorMessage(null)

        try {
            const supabase = createClient()

            const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
                redirectTo: `${window.location.origin}/auth/callback?type=recovery`
            })

            if (error) {
                setErrorMessage(error.message)
                return
            }

            setSuccessMessage('Şifre sıfırlama linki e-postanıza gönderildi. Lütfen gelen kutunuzu kontrol edin.')
        } catch {
            setErrorMessage('Bir hata oluştu. Lütfen tekrar deneyin.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div>
            <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white/70 transition-colors mb-6"
            >
                <ArrowLeft className="w-4 h-4" />
                Giriş sayfasına dön
            </Link>

            <h2 className="text-2xl font-bold text-white mb-2">Şifremi Unuttum</h2>
            <p className="text-white/50 text-sm mb-6">
                E-posta adresinizi girin, şifre sıfırlama linki gönderelim
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
                            <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
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

            {!successMessage && (
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

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-violet-500 to-cyan-500 text-white font-medium py-3 px-4 rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            'Sıfırlama Linki Gönder'
                        )}
                    </button>
                </form>
            )}

            {successMessage && (
                <Link
                    href="/login"
                    className="block w-full bg-white/5 border border-white/10 text-white font-medium py-3 px-4 rounded-lg hover:bg-white/10 transition-all text-center"
                >
                    Giriş Sayfasına Dön
                </Link>
            )}
        </div>
    )
}
