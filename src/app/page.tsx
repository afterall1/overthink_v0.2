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
import { GoalsFAB, GoalsPanel, GoalModal, GoalsStrip } from "@/components/hud/Goals"
import { AnimatePresence } from "framer-motion"
import { CategorySlug, Category, Event, EventInsert, EventUpdate, EventWithCategory, Log, GoalWithDetails } from '@/types/database.types'
import { getEventsByDateRange, createEvent, updateEventStatus, updateEvent, deleteEvent } from "@/actions/events"
import { getLogsByDateRange, createLog, deleteLog } from "@/actions/logs"
import { getActiveGoals, createGoal, deleteGoal, toggleMilestone, logProgress } from "@/actions/goals"
import { getCategories } from "@/actions/categories"
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

  // Goals state
  const [isGoalsOpen, setIsGoalsOpen] = useState(false)
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false)
  const [goals, setGoals] = useState<GoalWithDetails[]>([])
  const [categories, setCategories] = useState<Pick<Category, 'id' | 'name' | 'slug' | 'color_code' | 'icon_slug'>[]>([])
  const [isGoalsLoading, setIsGoalsLoading] = useState(false)

  const fetchGoals = useCallback(async () => {
    setIsGoalsLoading(true)
    console.log('[CLIENT DEBUG] fetchGoals started')
    try {
      const [goalsData, categoriesData] = await Promise.all([
        getActiveGoals(),
        getCategories()
      ])
      console.log('[CLIENT DEBUG] fetchGoals result:', {
        goalsData,
        goalsCount: goalsData?.length || 0,
        firstGoal: goalsData?.[0] || null,
        categoriesData
      })
      console.log('[CLIENT DEBUG] Goals count:', goalsData?.length || 0)

      // If goals are empty but categories work, it's an RLS issue
      if (goalsData?.length === 0 && categoriesData?.length > 0) {
        console.warn('[CLIENT DEBUG] ⚠️ POSSIBLE RLS ISSUE: Categories load but goals empty!')
      }

      setGoals(goalsData)
      setCategories(categoriesData)
    } catch (error) {
      console.error("[CLIENT DEBUG] Failed to fetch goals", error)
    } finally {
      setIsGoalsLoading(false)
    }
  }, [])

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
    fetchGoals()
  }, [fetchData, fetchGoals])

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
      <div className="w-full max-w-7xl mx-auto h-full flex flex-col relative z-0 transition-all duration-500 ease-in-out">

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

        {/* Goals Strip - Motivation Dashboard */}
        <div className="flex-none py-2">
          <GoalsStrip
            goals={goals}
            onGoalClick={(goal) => {
              setIsGoalsOpen(true)
            }}
            onCreateClick={() => setIsGoalModalOpen(true)}
            onViewAllClick={() => setIsGoalsOpen(true)}
            isLoading={isGoalsLoading}
          />
        </div>

        {/* Dual Horizon Grid Stage */}
        <div className="flex-1 overflow-hidden relative mx-2 mb-2">
          <div className="h-full grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto custom-scrollbar p-2">

            {/* Left Panel: Today Focus (50% width) */}
            <div className="col-span-1 flex flex-col h-full">
              <div className="bg-white/40 backdrop-blur-xl border border-white/40 rounded-3xl shadow-lg ring-1 ring-white/50 p-6 h-full min-h-[500px] flex flex-col transition-all duration-300 hover:bg-white/50">
                <TodayFocus
                  date={selectedDate}
                  events={dayEvents.filter(e => isSameDay(new Date(e.scheduled_at), selectedDate))}
                  onStatusChange={handleStatusChange}
                  onEventClick={handleEventClick}
                  onCreateClick={() => setIsEventModalOpen(true)}
                />
              </div>
            </div>

            {/* Right Panel: Upcoming Stream (50% width) */}
            <div className="col-span-1 flex flex-col h-full">
              <div className="bg-white/40 backdrop-blur-xl border border-white/40 rounded-3xl shadow-lg ring-1 ring-white/50 p-6 h-full overflow-y-auto custom-scrollbar transition-all duration-300 hover:bg-white/50">
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

      {/* Goals Panel */}
      <GoalsFAB onClick={() => setIsGoalsOpen(true)} />
      <GoalsPanel
        isOpen={isGoalsOpen}
        onClose={() => setIsGoalsOpen(false)}
        goals={goals}
        categories={categories}
        onCreateClick={() => setIsGoalModalOpen(true)}
        onGoalClick={(goal) => console.log('Goal clicked:', goal.id)}
        onDeleteGoal={async (goalId) => {
          try {
            await deleteGoal(goalId)
            await fetchGoals()
          } catch (error) {
            console.error('Failed to delete goal:', error)
          }
        }}
        onToggleMilestone={async (milestoneId) => {
          try {
            await toggleMilestone(milestoneId)
            await fetchGoals()
          } catch (error) {
            console.error('Failed to toggle milestone:', error)
          }
        }}
        onLogProgress={async (goalId, value, notes) => {
          try {
            await logProgress(goalId, value, notes)
            await fetchGoals()
          } catch (error) {
            console.error('Failed to log progress:', error)
          }
        }}
        isLoading={isGoalsLoading}
      />
      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        onSubmit={async (data) => {
          console.log('[CLIENT DEBUG] Goal form submitted with data:', data)
          try {
            const goalPayload = {
              title: data.title,
              description: data.description || null,
              target_value: data.target_value ?? null,
              unit: data.unit || null,
              period: data.period,
              category_id: data.category_id || null,
              start_date: data.start_date,
              end_date: data.end_date || null
            }
            console.log('[CLIENT DEBUG] Calling createGoal with:', goalPayload)
            const result = await createGoal(goalPayload)
            console.log('[CLIENT DEBUG] createGoal result:', result)
            console.log('[CLIENT DEBUG] Refreshing goals list...')
            await fetchGoals()
            console.log('[CLIENT DEBUG] Goals refreshed')
          } catch (error) {
            console.error('[CLIENT DEBUG] Failed to create goal:', error)
            throw error
          }
        }}
        categories={categories}
      />

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
