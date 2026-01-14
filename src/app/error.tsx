'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react'

interface ErrorProps {
    error: Error & { digest?: string }
    reset: () => void
}

/**
 * Next.js Error Boundary Component
 * Catches unhandled errors in the route segment and displays a fallback UI
 * 
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling
 */
export default function Error({ error, reset }: ErrorProps) {
    useEffect(() => {
        // Log error to monitoring service in production
        if (process.env.NODE_ENV === 'production') {
            // TODO: Send to error monitoring service (e.g., Sentry)
            console.error('Application error:', error)
        }
    }, [error])

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl border border-white/60 shadow-xl p-8 text-center">
                {/* Error Icon */}
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>

                {/* Error Title */}
                <h1 className="text-2xl font-bold text-slate-800 mb-2">
                    Bir Hata Oluştu
                </h1>

                {/* Error Message */}
                <p className="text-slate-600 mb-6">
                    Beklenmedik bir hata oluştu. Lütfen tekrar deneyin veya ana sayfaya dönün.
                </p>

                {/* Error Details (Development Only) */}
                {process.env.NODE_ENV === 'development' && (
                    <details className="mb-6 text-left">
                        <summary className="text-sm text-slate-500 cursor-pointer hover:text-slate-700">
                            Teknik Detaylar
                        </summary>
                        <pre className="mt-2 p-3 bg-slate-100 rounded-lg text-xs text-slate-600 overflow-auto max-h-40">
                            {error.message}
                            {error.stack && `\n\n${error.stack}`}
                        </pre>
                    </details>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 justify-center">
                    <button
                        onClick={reset}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl 
                                   hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/25
                                   focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        <RefreshCcw className="w-4 h-4" />
                        Tekrar Dene
                    </button>

                    <a
                        href="/"
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-200 text-slate-700 font-semibold rounded-xl 
                                   hover:bg-slate-300 transition-colors
                                   focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                    >
                        <Home className="w-4 h-4" />
                        Ana Sayfa
                    </a>
                </div>

                {/* Error Digest for Support */}
                {error.digest && (
                    <p className="mt-6 text-xs text-slate-400">
                        Hata Kodu: {error.digest}
                    </p>
                )}
            </div>
        </div>
    )
}
