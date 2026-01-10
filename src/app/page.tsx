'use client'

import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Calendar } from 'lucide-react'
import { DailyStatus } from '@/components/3d/types'
import { CategorySlug } from '@/types/database.types'
import { StatusBar, LoggerModal, LogDrawer, EventTimeline, EventModal, CalendarPicker } from '@/components/hud'

// Dynamic import to avoid SSR issues with Three.js
const Scene = dynamic(() => import('@/components/3d/Scene'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 flex items-center justify-center bg-[#0a0a0a]">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400 text-sm">Loading Habitat...</p>
      </div>
    </div>
  ),
})

interface LogEntry {
  id: string
  category: CategorySlug
  data: Record<string, unknown>
  sentiment: number
  timestamp: Date
}

// Mock daily status data
const INITIAL_STATUS: DailyStatus = {
  trade: false,
  food: false,
  sport: false,
  dev: false,
  etsy: false,
  gaming: false,
}

export default function Home() {
  const [dailyStatus, setDailyStatus] = useState<DailyStatus>(INITIAL_STATUS)
  const [selectedSector, setSelectedSector] = useState<CategorySlug | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])

  // Event/Calendar state
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [isTimelineOpen, setIsTimelineOpen] = useState(false)
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const handleSectorClick = (slug: CategorySlug) => {
    setSelectedSector(prev => prev === slug ? null : slug)
  }

  const handleLogSubmit = useCallback((category: CategorySlug, data: Record<string, unknown>, sentiment: number) => {
    const newLog: LogEntry = {
      id: crypto.randomUUID(),
      category,
      data,
      sentiment,
      timestamp: new Date(),
    }

    setLogs(prev => [newLog, ...prev])

    // Mark category as completed
    setDailyStatus(prev => ({
      ...prev,
      [category]: true
    }))

    // TODO: Save to Supabase
    console.log('New log:', newLog)
  }, [])

  const handleDeleteLog = useCallback((id: string) => {
    setLogs(prev => {
      const logToDelete = prev.find(l => l.id === id)
      const newLogs = prev.filter(l => l.id !== id)

      // Check if there are any remaining logs for that category
      if (logToDelete) {
        const hasRemainingLogs = newLogs.some(l => l.category === logToDelete.category)
        if (!hasRemainingLogs) {
          setDailyStatus(s => ({
            ...s,
            [logToDelete.category]: false
          }))
        }
      }

      return newLogs
    })
  }, [])

  // Calendar'dan tarih seçilince → EventModal aç
  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date)
    setIsCalendarOpen(false)
    setIsEventModalOpen(true)
  }, [])

  // Event oluşturulduğunda → Timeline aç
  const handleEventCreated = useCallback(() => {
    setIsEventModalOpen(false)
    setSelectedDate(null)
    setIsTimelineOpen(true)
  }, [])

  // Calendar FAB tıklandığında → Calendar aç
  const handleCalendarFabClick = () => {
    setIsCalendarOpen(true)
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* 3D Scene (background) */}
      <Scene dailyStatus={dailyStatus} onSectorClick={handleSectorClick} />

      {/* HUD Overlay */}
      <StatusBar dailyStatus={dailyStatus} />
      <LogDrawer logs={logs} onDeleteLog={handleDeleteLog} />
      <LoggerModal onSubmit={handleLogSubmit} />

      {/* Calendar Picker - Önce tarih seç */}
      <CalendarPicker
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        onDateSelect={handleDateSelect}
        initialDate={selectedDate ?? undefined}
      />

      {/* Event Modal - Tarih seçildikten sonra */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => {
          setIsEventModalOpen(false)
          setSelectedDate(null)
        }}
        onEventCreated={handleEventCreated}
        initialDate={selectedDate ?? undefined}
      />

      {/* Event Timeline - Planlananları görüntüle */}
      <EventTimeline isOpen={isTimelineOpen} onClose={() => setIsTimelineOpen(false)} />

      {/* Calendar FAB - Plan oluştur butonu */}
      <button
        onClick={handleCalendarFabClick}
        className="fixed bottom-6 right-24 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30 transition-all hover:scale-110 hover:shadow-blue-500/50 active:scale-95"
        aria-label="Yeni plan oluştur"
      >
        <Calendar className="h-6 w-6 text-white" />
      </button>

      {/* Timeline FAB - Planlananları gör */}
      <button
        onClick={() => setIsTimelineOpen(true)}
        className="fixed bottom-6 right-6 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-gray-400 backdrop-blur-sm transition-all hover:bg-white/20 hover:text-white"
        aria-label="Planlananları görüntüle"
      >
        <span className="text-xs">📋</span>
      </button>

      {/* Selected Sector Info */}
      {selectedSector && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30">
          <div className="bg-black/70 backdrop-blur-xl rounded-xl px-6 py-3 border border-white/10">
            <p className="text-white font-medium capitalize">{selectedSector}</p>
            <p className="text-gray-400 text-sm">
              Status: {dailyStatus[selectedSector] ? '✓ Completed' : '○ Pending'}
            </p>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="fixed bottom-6 right-44 text-right z-20">
        <p className="text-gray-600 text-xs">Drag to rotate</p>
        <p className="text-gray-600 text-xs">Click sector to focus</p>
      </div>
    </main>
  )
}
