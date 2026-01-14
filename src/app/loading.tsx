import { Loader2 } from 'lucide-react'

/**
 * Next.js Loading UI Component
 * Provides a skeleton/loading state while route segments are loading
 * 
 * @see https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming
 */
export default function Loading() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-100 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                {/* Animated Loader */}
                <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-indigo-100 animate-pulse" />
                    <Loader2 className="w-8 h-8 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" />
                </div>

                {/* Loading Text */}
                <div className="text-center">
                    <h2 className="text-lg font-semibold text-slate-700">
                        LifeNexus
                    </h2>
                    <p className="text-sm text-slate-500 animate-pulse">
                        Yükleniyor...
                    </p>
                </div>

                {/* Skeleton Cards Preview */}
                <div className="w-full max-w-sm space-y-3 mt-4">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="h-16 bg-white/60 backdrop-blur-xl rounded-2xl border border-white/40 animate-pulse"
                            style={{ animationDelay: `${i * 100}ms` }}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}
