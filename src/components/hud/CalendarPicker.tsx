'use client'

import { useState, useMemo } from 'react'
import { X, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'

interface CalendarPickerProps {
    selectedDate: Date
    onSelect: (date: Date) => void
}

// Türkçe ay isimleri
const MONTH_NAMES = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
]

// Türkçe gün isimleri (Pazartesi başlangıç)
const DAY_NAMES = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

export default function CalendarPicker({ selectedDate, onSelect }: CalendarPickerProps) {
    const [isOpen, setIsOpen] = useState(false)
    const today = new Date()

    // Initial view based on selected date or today
    const [currentMonth, setCurrentMonth] = useState(selectedDate.getMonth())
    const [currentYear, setCurrentYear] = useState(selectedDate.getFullYear())

    // Aydaki günleri hesapla
    const calendarDays = useMemo(() => {
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1)
        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0)
        const daysInMonth = lastDayOfMonth.getDate()

        // Pazartesi = 0 olacak şekilde ayarla (JS'de Pazar = 0)
        let startDay = firstDayOfMonth.getDay() - 1
        if (startDay < 0) startDay = 6 // Pazar

        const days: Array<{ day: number; isCurrentMonth: boolean; date: Date }> = []

        // Önceki ayın günleri
        const prevMonth = new Date(currentYear, currentMonth, 0)
        const prevMonthDays = prevMonth.getDate()
        for (let i = startDay - 1; i >= 0; i--) {
            days.push({
                day: prevMonthDays - i,
                isCurrentMonth: false,
                date: new Date(currentYear, currentMonth - 1, prevMonthDays - i),
            })
        }

        // Bu ayın günleri
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({
                day: i,
                isCurrentMonth: true,
                date: new Date(currentYear, currentMonth, i),
            })
        }

        // Sonraki ayın günleri (6 satır tamamlamak için)
        const remainingDays = 42 - days.length
        for (let i = 1; i <= remainingDays; i++) {
            days.push({
                day: i,
                isCurrentMonth: false,
                date: new Date(currentYear, currentMonth + 1, i),
            })
        }

        return days
    }, [currentMonth, currentYear])

    // Ay navigasyonu
    const goToPrevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11)
            setCurrentYear(currentYear - 1)
        } else {
            setCurrentMonth(currentMonth - 1)
        }
    }

    const goToNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0)
            setCurrentYear(currentYear + 1)
        } else {
            setCurrentMonth(currentMonth + 1)
        }
    }

    // Tarih seç
    const handleDateClick = (date: Date) => {
        // Geçmiş tarihleri engelleme (sadece bugün ve sonrası)
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
        // if (date < todayStart) return // Opsiyonel: Geçmiş tarih seçimi engeli

        onSelect(date)
        setIsOpen(false)
    }

    // Tarihleri karşılaştır
    const isSameDay = (d1: Date, d2: Date) =>
        d1.getDate() === d2.getDate() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getFullYear() === d2.getFullYear()

    const isToday = (date: Date) => isSameDay(date, today)
    const isSelected = (date: Date) => isSameDay(date, selectedDate)
    const isPast = (date: Date) => {
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
        return date < todayStart
    }

    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-200 
                           text-slate-700 font-medium hover:bg-slate-50 hover:border-indigo-200 transition-all 
                           active:scale-95 group"
            >
                <CalendarIcon className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform" />
                <span>
                    {selectedDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                </span>
            </button>

            {/* Modal */}
            {isOpen && (
                <>
                    {/* Backdrop - Ethereal blur */}
                    <div
                        className="fixed inset-0 z-50 bg-slate-900/10 backdrop-blur-md"
                        onClick={() => setIsOpen(false)}
                        aria-hidden="true"
                    />

                    {/* Calendar Modal - Glass Surface */}
                    <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 animate-in fade-in zoom-in duration-200">
                        {/* Glow border wrapper */}
                        <div className="relative rounded-3xl p-[1px] bg-gradient-to-b from-white/80 via-white/50 to-transparent shadow-xl shadow-blue-500/10">
                            {/* Inner glass panel */}
                            <div className="rounded-3xl bg-white/90 p-6 backdrop-blur-2xl shadow-inner border border-white/60">

                                {/* Header with navigation */}
                                <div className="mb-5 flex items-center justify-between">
                                    <button
                                        onClick={goToPrevMonth}
                                        className="group relative rounded-xl p-2.5 text-slate-400 transition-all duration-300 hover:text-slate-800 hover:bg-slate-100"
                                    >
                                        <ChevronLeft className="relative h-5 w-5" />
                                    </button>

                                    <h2 className="text-xl font-bold tracking-tight text-slate-800">
                                        {MONTH_NAMES[currentMonth]} {currentYear}
                                    </h2>

                                    <button
                                        onClick={goToNextMonth}
                                        className="group relative rounded-xl p-2.5 text-slate-400 transition-all duration-300 hover:text-slate-800 hover:bg-slate-100"
                                    >
                                        <ChevronRight className="relative h-5 w-5" />
                                    </button>
                                </div>

                                {/* Close button - Minimalist */}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition-all duration-300 hover:bg-slate-100 hover:text-slate-600 hover:rotate-90"
                                >
                                    <X className="h-4 w-4" />
                                </button>

                                {/* Days of week header */}
                                <div className="mb-3 grid grid-cols-7 text-center border-b border-slate-100 pb-3">
                                    {DAY_NAMES.map((day) => (
                                        <div key={day} className="py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                {/* Calendar grid - Enhanced */}
                                <div className="grid grid-cols-7 gap-1">
                                    {calendarDays.map(({ day, isCurrentMonth, date }, index) => {
                                        const past = isPast(date)
                                        const todayDate = isToday(date)
                                        const selected = isSelected(date)

                                        return (
                                            <button
                                                key={index}
                                                onClick={() => handleDateClick(date)}
                                                // disabled={past}
                                                className={`
                                                    group relative flex h-11 w-11 items-center justify-center rounded-2xl text-[13px] font-medium transition-all duration-200
                                                    ${!isCurrentMonth ? 'text-slate-300' : ''}
                                                    ${isCurrentMonth && !past && !selected && !todayDate ? 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 hover:scale-105' : ''}
                                                    ${past ? 'text-slate-300' : ''}
                                                    ${todayDate && !selected ? 'text-blue-600 font-bold bg-blue-50' : ''}
                                                    ${selected ? 'text-white animate-spring-select' : ''}
                                                `}
                                            >
                                                {/* Selected day - Glowing pill background */}
                                                {selected && (
                                                    <>
                                                        <span className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30" />
                                                        <span className="absolute inset-[1px] rounded-2xl bg-gradient-to-b from-white/20 to-transparent" />
                                                    </>
                                                )}

                                                <span className="relative z-10">{day}</span>
                                            </button>
                                        )
                                    })}
                                </div>

                                {/* Today shortcut */}
                                <div className="mt-5 flex justify-center">
                                    <button
                                        onClick={() => {
                                            const t = new Date()
                                            setCurrentMonth(t.getMonth())
                                            setCurrentYear(t.getFullYear())
                                            handleDateClick(t)
                                        }}
                                        className="group relative overflow-hidden rounded-xl px-6 py-2.5 text-sm font-semibold text-slate-500 transition-all duration-300 hover:text-blue-600 hover:bg-blue-50"
                                    >
                                        <span className="relative">Bugün</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    )
}
