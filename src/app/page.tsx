'use client'

import { useState, useEffect, useCallback } from "react"
import { List, Calendar as CalendarIcon, Plus } from "lucide-react"
import StatusBar from "@/components/hud/StatusBar"
import LogDrawer from "@/components/hud/LogDrawer"
import EventTimeline from "@/components/hud/EventTimeline"
import LoggerModal from "@/components/hud/LoggerModal"
import EventModal from "@/components/hud/EventModal"
import EventDetailModal from "@/components/hud/EventDetailModal"
import CalendarPicker from "@/components/hud/CalendarPicker"
import TodayFocus from "@/components/hud/TodayFocus"
import UpcomingStream from "@/components/hud/UpcomingStream"
import ControlDock from "@/components/hud/ControlDock"
import { CouncilFAB, CouncilPanel } from "@/components/hud/AICouncil"
import { AnimatePresence } from "framer-motion"
import { CategorySlug, Event, EventInsert, EventUpdate, EventWithCategory, Log } from '@/types/database.types'
import { getEventsByDateRange, createEvent, updateEventStatus, updateEvent, deleteEvent } from "@/actions/events"
import { getLogsByDateRange, createLog, deleteLog } from "@/actions/logs"
import { startOfDay, endOfDay, addDays, isSameDay } from 'date-fns'

const MOCK_DAILY_STATUS = {
  trade: false,
  food: true,
  sport: false,
  dev: true,
  etsy: false,
  gaming: false,
}

// Transform Supabase Log to LogDrawer format
interface LogDrawerEntry {
  id: string
  category: CategorySlug
  data: Record<string, unknown>
  sentiment: number
  timestamp: Date
}

function transformLogForDrawer(log: Log & { categories?: { slug: string } }): LogDrawerEntry {
  return {
    id: log.id,
    category: (log.categories?.slug || 'dev') as CategorySlug,
    data: log.data as Record<string, unknown>,
    sentiment: log.sentiment || 5,
    timestamp: new Date(log.logged_at)
  }
}

export default function Home() {
  const [isLoggerOpen, setIsLoggerOpen] = useState(false)
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [isTimelineOpen, setIsTimelineOpen] = useState(false)
  const [isLogDrawerOpen, setIsLogDrawerOpen] = useState(false)

  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [dayEvents, setDayEvents] = useState<EventWithCategory[]>([])
  const [dayLogs, setDayLogs] = useState<LogDrawerEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Event Detail Modal state
  const [selectedEvent, setSelectedEvent] = useState<EventWithCategory | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  // AI Council state
  const [isCouncilOpen, setIsCouncilOpen] = useState(false)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const start = startOfDay(selectedDate).toISOString()
      const end = endOfDay(addDays(selectedDate, 7)).toISOString() // Fetch 7 days for Agenda Stream

      // Fetch both events and logs in parallel
      const [events, logs] = await Promise.all([
        getEventsByDateRange(start, end),
        getLogsByDateRange(start, end)
      ])

      setDayEvents(events)
      setDayLogs(logs.map(transformLogForDrawer))
    } catch (error) {
      console.error("Failed to fetch data", error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedDate])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleEventCreate = async (eventData: EventInsert) => {
    try {
      await createEvent(eventData)

      // Navigate to the event's date after creation
      if (eventData.scheduled_at) {
        const eventDate = new Date(eventData.scheduled_at)
        setSelectedDate(eventDate)
      }

      setIsEventModalOpen(false)
    } catch (error) {
      console.error("Create event failed", error)
    }
  }

  const handleStatusChange = async (id: string, status: Event['status']) => {
    setDayEvents(prev => prev.map(e => e.id === id ? { ...e, status } : e))
    try {
      await updateEventStatus(id, status)
    } catch (error) {
      console.error("Status update failed", error)
      fetchData()
    }
  }

  const handleLogSubmit = async (category: CategorySlug, data: Record<string, unknown>, sentiment: number) => {
    try {
      await createLog(category, data, sentiment)
      fetchData() // Refresh logs from server
      setIsLoggerOpen(false)
    } catch (error) {
      console.error("Create log failed", error)
    }
  }

  const handleLogDelete = async (id: string) => {
    try {
      await deleteLog(id)
      setDayLogs(prev => prev.filter(log => log.id !== id))
    } catch (error) {
      console.error("Delete log failed", error)
      fetchData()
    }
  }

  // Event Detail Modal handlers
  const handleEventClick = (event: EventWithCategory) => {
    setSelectedEvent(event)
    setIsDetailModalOpen(true)
  }

  const handleEventUpdate = async (id: string, data: EventUpdate) => {
    try {
      await updateEvent(id, data)
      await fetchData() // Re-fetch to reposition in timeline
      setIsDetailModalOpen(false)
      setSelectedEvent(null)
    } catch (error) {
      console.error("Update event failed", error)
    }
  }

  const handleEventDelete = async (id: string) => {
    try {
      await deleteEvent(id)
      await fetchData()
      setIsDetailModalOpen(false)
      setSelectedEvent(null)
    } catch (error) {
      console.error("Delete event failed", error)
    }
  }

  return (
    <main className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-100 text-slate-800 flex flex-col transition-colors duration-500">

      {/* Central Playground Container */}
      <div className="w-full max-w-3xl mx-auto h-full flex flex-col relative z-0">

        {/* Header Section */}
        <div className="flex-none p-4 pt-6 space-y-4">
          <StatusBar dailyStatus={MOCK_DAILY_STATUS} />

          <div className="flex items-center justify-between px-2">
            <div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
                LifeNexus
              </h1>
              <p className="text-xs text-slate-500 font-medium">Daily Operations Playground</p>
            </div>

            <CalendarPicker
              selectedDate={selectedDate}
              onSelect={setSelectedDate}
            />
          </div>
        </div>

        {/* Dual Horizon Grid Stage */}
        <div className="flex-1 overflow-hidden relative mx-2 mb-2">
          <div className="h-full grid grid-cols-1 md:grid-cols-12 gap-6 overflow-y-auto custom-scrollbar p-2">

            {/* Left Panel: Today Focus (Mobile: Top, Desktop: Left 7 cols) */}
            <div className="md:col-span-7 lg:col-span-8 flex flex-col">
              <div className="bg-white/40 backdrop-blur-xl border border-white/40 rounded-3xl shadow-lg ring-1 ring-white/50 p-6 min-h-[400px]">
                <TodayFocus
                  date={selectedDate}
                  events={dayEvents.filter(e => isSameDay(new Date(e.scheduled_at), selectedDate))}
                  onStatusChange={handleStatusChange}
                  onEventClick={handleEventClick}
                  onCreateClick={() => setIsEventModalOpen(true)}
                />
              </div>
            </div>

            {/* Right Panel: Upcoming Stream (Mobile: Bottom, Desktop: Right 5 cols) */}
            <div className="md:col-span-5 lg:col-span-4 flex flex-col">
              <div className="bg-white/30 backdrop-blur-lg border border-white/20 rounded-3xl p-6 h-full overflow-y-auto custom-scrollbar">
                <UpcomingStream
                  anchorDate={selectedDate}
                  events={dayEvents}
                  onStatusChange={handleStatusChange}
                  onEventClick={handleEventClick}
                />
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Control Dock */}
        <div className="flex-none p-4 pb-8 flex justify-center z-20">
          <ControlDock
            onOpenLogDrawer={() => setIsLogDrawerOpen(true)}
            onOpenTimeline={() => setIsTimelineOpen(true)}
            onOpenEventModal={() => setIsEventModalOpen(true)}
            className="w-full max-w-md mx-auto"
          />
        </div>

      </div>

      {/* Overlays */}
      <AnimatePresence>
        <LogDrawer
          key="log-drawer"
          logs={dayLogs}
          isOpen={isLogDrawerOpen}
          onOpenLogger={() => setIsLoggerOpen(true)}
          onDeleteLog={handleLogDelete}
        />

        <EventTimeline
          key="event-timeline"
          isOpen={isTimelineOpen}
          onClose={() => setIsTimelineOpen(false)}
          onOpenEventModal={() => setIsEventModalOpen(true)}
        />

        {isLoggerOpen && (
          <LoggerModal
            key="logger-modal"
            isOpen={isLoggerOpen}
            onClose={() => setIsLoggerOpen(false)}
            onSubmit={handleLogSubmit}
          />
        )}

        {isEventModalOpen && (
          <EventModal
            key="event-modal"
            isOpen={isEventModalOpen}
            onClose={() => setIsEventModalOpen(false)}
            onEventCreated={handleEventCreate}
            selectedDate={selectedDate}
          />
        )}

        <EventDetailModal
          isOpen={isDetailModalOpen}
          event={selectedEvent}
          onClose={() => {
            setIsDetailModalOpen(false)
            setSelectedEvent(null)
          }}
          onUpdate={handleEventUpdate}
          onDelete={handleEventDelete}
        />
      </AnimatePresence>

      {/* AI Council */}
      <CouncilFAB onClick={() => setIsCouncilOpen(true)} />
      <CouncilPanel
        isOpen={isCouncilOpen}
        onClose={() => setIsCouncilOpen(false)}
        activeEventId={selectedEvent?.id}
      />
    </main>
  )
}
