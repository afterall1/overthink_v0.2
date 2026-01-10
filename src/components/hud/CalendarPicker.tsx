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
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Calendar Modal */}
            <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-black/90 p-5 backdrop-blur-xl">
                {/* Header */}
                <div className="mb-4 flex items-center justify-between">
                    <button
                        onClick={goToPrevMonth}
                        className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                        aria-label="Önceki ay"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>

                    <h2 className="text-lg font-semibold text-white">
                        {MONTH_NAMES[currentMonth]} {currentYear}
                    </h2>

                    <button
                        onClick={goToNextMonth}
                        className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                        aria-label="Sonraki ay"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute right-3 top-3 rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-white/10 hover:text-white"
                    aria-label="Kapat"
                >
                    <X className="h-4 w-4" />
                </button>

                {/* Days of week header */}
                <div className="mb-2 grid grid-cols-7 text-center">
                    {DAY_NAMES.map((day) => (
                        <div key={day} className="py-2 text-xs font-medium text-gray-500">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map(({ day, isCurrentMonth, date }, index) => {
                        const past = isPast(date)
                        const todayDate = isToday(date)
                        const selected = isSelected(date)

                        return (
                            <button
                                key={index}
                                onClick={() => handleDateClick(date)}
                                disabled={past}
                                className={`
                                    flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-all
                                    ${!isCurrentMonth ? 'text-gray-700' : ''}
                                    ${isCurrentMonth && !past ? 'text-gray-200 hover:bg-white/10' : ''}
                                    ${past ? 'cursor-not-allowed text-gray-700' : ''}
                                    ${todayDate && !selected ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-black' : ''}
                                    ${selected ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg' : ''}
                                `}
                                aria-label={`${day} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`}
                            >
                                {day}
                            </button>
                        )
                    })}
                </div>

                {/* Today shortcut */}
                <div className="mt-4 flex justify-center">
                    <button
                        onClick={() => {
                            setCurrentMonth(today.getMonth())
                            setCurrentYear(today.getFullYear())
                            handleDateClick(today)
                        }}
                        className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-white/20"
                    >
                        Bugün
                    </button>
                </div>

                {/* Selected date display */}
                {selectedDate && (
                    <div className="mt-3 text-center text-sm text-gray-400">
                        Seçili: {selectedDate.getDate()} {MONTH_NAMES[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                    </div>
                )}
            </div>
        </>
    )
}
