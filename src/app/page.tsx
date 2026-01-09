'use client'

import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { DailyStatus } from '@/components/3d/types'
import { CategorySlug } from '@/types/database.types'
import { StatusBar, LoggerModal, LogDrawer } from '@/components/hud'

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

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* 3D Scene (background) */}
      <Scene dailyStatus={dailyStatus} onSectorClick={handleSectorClick} />

      {/* HUD Overlay */}
      <StatusBar dailyStatus={dailyStatus} />
      <LogDrawer logs={logs} onDeleteLog={handleDeleteLog} />
      <LoggerModal onSubmit={handleLogSubmit} />

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
      <div className="fixed bottom-6 right-24 text-right z-30">
        <p className="text-gray-600 text-xs">Drag to rotate</p>
        <p className="text-gray-600 text-xs">Click sector to focus</p>
      </div>
    </main>
  )
}
