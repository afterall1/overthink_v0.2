import { Plus, List, Calendar as CalendarIcon, BarChart2 } from "lucide-react"

interface ControlDockProps {
    onOpenLogDrawer: () => void
    onOpenTimeline: () => void
    onOpenEventModal: () => void
    className?: string
}

export default function ControlDock({
    onOpenLogDrawer,
    onOpenTimeline,
    onOpenEventModal,
    className = ""
}: ControlDockProps) {
    return (
        <div className={`flex items-center justify-center gap-6 p-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl ${className}`}>
            <button
                onClick={onOpenLogDrawer}
                className="group relative p-3 text-slate-600 hover:text-indigo-600 transition-all hover:scale-110 active:scale-95"
                aria-label="Open Logs"
            >
                <div className="absolute inset-0 bg-white/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity blur-md" />
                <List className="w-6 h-6 relative z-10" />
            </button>

            <button
                onClick={onOpenEventModal}
                className="group relative p-4 -mt-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl shadow-xl shadow-indigo-500/40 transition-all hover:scale-110 active:scale-95 hover:rotate-90 duration-300"
                aria-label="Create Event"
            >
                <Plus className="w-8 h-8 relative z-10" />
            </button>

            <button
                onClick={onOpenTimeline}
                className="group relative p-3 text-slate-600 hover:text-indigo-600 transition-all hover:scale-110 active:scale-95"
                aria-label="Open Timeline"
            >
                <div className="absolute inset-0 bg-white/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity blur-md" />
                <CalendarIcon className="w-6 h-6 relative z-10" />
            </button>
        </div>
    )
}
