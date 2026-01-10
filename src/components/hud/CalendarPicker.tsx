'use client'

import { useState, useMemo } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface CalendarPickerProps {
    isOpen: boolean
    onClose: () => void
    onDateSelect: (date: Date) => void
    initialDate?: Date
}

// Türkçe ay isimleri
const MONTH_NAMES = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
]

// Türkçe gün isimleri (Pazartesi başlangıç)
const DAY_NAMES = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

export default function CalendarPicker({ isOpen, onClose, onDateSelect, initialDate }: CalendarPickerProps) {
    const today = new Date()
    const [currentMonth, setCurrentMonth] = useState(initialDate?.getMonth() ?? today.getMonth())
    const [currentYear, setCurrentYear] = useState(initialDate?.getFullYear() ?? today.getFullYear())
    const [selectedDate, setSelectedDate] = useState<Date | null>(initialDate ?? null)

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
        if (date < todayStart) return

        setSelectedDate(date)
        onDateSelect(date)
    }

    // Tarihleri karşılaştır
    const isSameDay = (d1: Date, d2: Date) =>
        d1.getDate() === d2.getDate() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getFullYear() === d2.getFullYear()

    const isToday = (date: Date) => isSameDay(date, today)
    const isSelected = (date: Date) => selectedDate && isSameDay(date, selectedDate)
    const isPast = (date: Date) => {
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
        return date < todayStart
    }

    if (!isOpen) return null

    return (
        <>
            {/* Backdrop - Ethereal blur */}
            <div
                className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Calendar Modal - Glass Surface */}
            <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 animate-in">
                {/* Glow border wrapper */}
                <div className="relative rounded-3xl p-[1px] bg-gradient-to-b from-white/20 via-white/5 to-transparent">
                    {/* Inner glass panel */}
                    <div className="rounded-3xl bg-gradient-to-b from-gray-900/95 to-black/95 p-6 backdrop-blur-2xl shadow-2xl shadow-purple-500/10">

                        {/* Header with navigation */}
                        <div className="mb-5 flex items-center justify-between">
                            {/* Previous Month Button */}
                            <button
                                onClick={goToPrevMonth}
                                className="group relative rounded-xl p-2.5 text-gray-400 transition-all duration-300 hover:text-white"
                                aria-label="Önceki ay"
                            >
                                {/* Hover glow effect */}
                                <span className="absolute inset-0 rounded-xl bg-white/0 transition-all duration-300 group-hover:bg-white/10 group-hover:shadow-lg group-hover:shadow-white/5" />
                                <ChevronLeft className="relative h-5 w-5 transition-transform duration-200 group-hover:-translate-x-0.5" />
                            </button>

                            {/* Month/Year Title */}
                            <h2 className="text-xl font-semibold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">
                                {MONTH_NAMES[currentMonth]} {currentYear}
                            </h2>

                            {/* Next Month Button */}
                            <button
                                onClick={goToNextMonth}
                                className="group relative rounded-xl p-2.5 text-gray-400 transition-all duration-300 hover:text-white"
                                aria-label="Sonraki ay"
                            >
                                <span className="absolute inset-0 rounded-xl bg-white/0 transition-all duration-300 group-hover:bg-white/10 group-hover:shadow-lg group-hover:shadow-white/5" />
                                <ChevronRight className="relative h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5" />
                            </button>
                        </div>

                        {/* Close button - Minimalist */}
                        <button
                            onClick={onClose}
                            className="absolute right-4 top-4 rounded-full p-2 text-gray-500 transition-all duration-300 hover:bg-white/10 hover:text-white hover:rotate-90"
                            aria-label="Kapat"
                        >
                            <X className="h-4 w-4" />
                        </button>

                        {/* Days of week header - Subtle */}
                        <div className="mb-3 grid grid-cols-7 text-center border-b border-white/5 pb-3">
                            {DAY_NAMES.map((day) => (
                                <div key={day} className="py-1 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
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

                                // Mock: Demo etkinlik günleri (gerçek verilerle değiştirilecek)
                                const hasEvent = isCurrentMonth && [3, 7, 12, 15, 22, 28].includes(day)

                                return (
                                    <button
                                        key={index}
                                        onClick={() => handleDateClick(date)}
                                        disabled={past}
                                        className={`
                                            group relative flex h-11 w-11 items-center justify-center rounded-2xl text-[13px] font-medium transition-all duration-200
                                            ${!isCurrentMonth ? 'text-gray-700/50' : ''}
                                            ${isCurrentMonth && !past && !selected && !todayDate ? 'text-gray-300 hover:bg-white/10 hover:text-white hover:scale-105' : ''}
                                            ${past ? 'cursor-not-allowed text-gray-800/40' : ''}
                                            ${todayDate && !selected ? 'text-purple-300 animate-pulse-ring' : ''}
                                            ${selected ? 'text-white animate-spring-select' : ''}
                                        `}
                                        aria-label={`${day} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`}
                                    >
                                        {/* Selected day - Glowing pill background */}
                                        {selected && (
                                            <>
                                                {/* Outer glow */}
                                                <span className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/40 to-blue-600/40 blur-lg" />
                                                {/* Main gradient fill */}
                                                <span className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 shadow-lg shadow-purple-500/40" />
                                                {/* Inner highlight */}
                                                <span className="absolute inset-[1px] rounded-2xl bg-gradient-to-b from-white/20 to-transparent" />
                                            </>
                                        )}

                                        {/* Today indicator - Pulsing ring (when not selected) */}
                                        {todayDate && !selected && (
                                            <span className="absolute inset-0 rounded-2xl ring-2 ring-purple-500/60" />
                                        )}

                                        {/* Day number */}
                                        <span className="relative z-10">{day}</span>

                                        {/* Event indicator dot */}
                                        {hasEvent && !selected && (
                                            <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-purple-400 animate-glow-dot" />
                                        )}

                                        {/* Event indicator for selected day (white version) */}
                                        {hasEvent && selected && (
                                            <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-white/90" />
                                        )}
                                    </button>
                                )
                            })}
                        </div>

                        {/* Today shortcut - Glass button */}
                        <div className="mt-5 flex justify-center">
                            <button
                                onClick={() => {
                                    setCurrentMonth(today.getMonth())
                                    setCurrentYear(today.getFullYear())
                                    handleDateClick(today)
                                }}
                                className="group relative overflow-hidden rounded-xl px-6 py-2.5 text-sm font-medium text-gray-300 transition-all duration-300 hover:text-white"
                            >
                                {/* Button glass background */}
                                <span className="absolute inset-0 bg-white/5 transition-all duration-300 group-hover:bg-white/10" />
                                {/* Border glow on hover */}
                                <span className="absolute inset-0 rounded-xl border border-white/10 transition-all duration-300 group-hover:border-white/20 group-hover:shadow-lg group-hover:shadow-purple-500/10" />
                                <span className="relative">Bugün</span>
                            </button>
                        </div>

                        {/* Selected date display - Refined */}
                        {selectedDate && (
                            <div className="mt-4 text-center">
                                <span className="inline-flex items-center gap-2 rounded-full bg-purple-500/10 px-4 py-1.5 text-sm font-medium text-purple-300">
                                    <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
                                    {selectedDate.getDate()} {MONTH_NAMES[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}
