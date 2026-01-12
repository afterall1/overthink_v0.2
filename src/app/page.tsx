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
// REMOVED: TodayFocus and UpcomingStream - Dashboard simplified
import ControlDock from "@/components/hud/ControlDock"
import { CouncilFAB, CouncilPanel } from "@/components/hud/AICouncil"
import { GoalsFAB, GoalsPanel, GoalModal, GoalsStrip, GoalCreationWizard } from "@/components/hud/Goals"
import { DailyQuestsPanel, QuestCreationModal } from "@/components/hud/Quests"
import { AnimatePresence } from "framer-motion"
import { CategorySlug, Category, Event, EventInsert, EventUpdate, EventWithCategory, Log, GoalWithDetails, DailyQuest, UserXpStats } from '@/types/database.types'
import { getEventsByDateRange, createEvent, updateEventStatus, updateEvent, deleteEvent } from "@/actions/events"
import { getLogsByDateRange, createLog, deleteLog } from "@/actions/logs"
import { getActiveGoals, createGoal, updateGoal, deleteGoal, toggleMilestone, logProgress } from "@/actions/goals"
import { getCategories } from "@/actions/categories"
import { getQuestsForToday, completeQuest, skipQuest, getUserXpStats } from "@/actions/quests"
import { startOfDay, endOfDay, addDays } from 'date-fns'

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
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false) // Legacy modal for edit
  const [isGoalWizardOpen, setIsGoalWizardOpen] = useState(false) // New wizard for create
  const [editingGoal, setEditingGoal] = useState<GoalWithDetails | null>(null) // Goal being edited
  const [goals, setGoals] = useState<GoalWithDetails[]>([])
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null) // [NEW] Lifted State
  const [categories, setCategories] = useState<Pick<Category, 'id' | 'name' | 'slug' | 'color_code' | 'icon_slug'>[]>([])
  const [isGoalsLoading, setIsGoalsLoading] = useState(false)

  // Quest state
  const [quests, setQuests] = useState<DailyQuest[]>([])
  const [xpStats, setXpStats] = useState<UserXpStats | null>(null)
  const [isQuestsLoading, setIsQuestsLoading] = useState(false)
  const [isQuestCreationModalOpen, setIsQuestCreationModalOpen] = useState(false)

  const fetchQuests = useCallback(async () => {
    setIsQuestsLoading(true)
    try {
      const [questsResult, xpResult] = await Promise.all([
        getQuestsForToday(),
        getUserXpStats()
      ])
      if (questsResult.data) setQuests(questsResult.data)
      if (xpResult.data) setXpStats(xpResult.data)
    } catch (error) {
      console.error('Failed to fetch quests:', error)
    } finally {
      setIsQuestsLoading(false)
    }
  }, [])

  const fetchGoals = useCallback(async () => {
    setIsGoalsLoading(true)
    try {
      const [goalsData, categoriesData] = await Promise.all([
        getActiveGoals(),
        getCategories()
      ])

      setGoals(goalsData)
      setCategories(categoriesData)
    } catch (error) {
      console.error("Failed to fetch goals", error)
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
    fetchQuests()
  }, [fetchData, fetchGoals, fetchQuests])

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
              setSelectedGoalId(goal.id)
            }}
            onCreateClick={() => setIsGoalWizardOpen(true)}
            onViewAllClick={() => setIsGoalsOpen(true)}
            isLoading={isGoalsLoading}
          />
        </div>

        {/* Daily Quests Panel - Full Width */}
        <div className="flex-1 overflow-hidden relative mx-2 mb-2">
          <div className="h-full overflow-y-auto custom-scrollbar p-2">
            <DailyQuestsPanel
              quests={quests}
              goals={goals.map(g => ({ id: g.id, title: g.title, period: g.period }))}
              xpStats={xpStats}
              onCompleteQuest={async (questId) => {
                try {
                  await completeQuest(questId)
                  await fetchQuests()
                } catch (error) {
                  console.error('Failed to complete quest:', error)
                }
              }}
              onSkipQuest={async (questId) => {
                try {
                  await skipQuest(questId)
                  await fetchQuests()
                } catch (error) {
                  console.error('Failed to skip quest:', error)
                }
              }}
              onRefresh={fetchQuests}
              onCreateQuest={() => setIsQuestCreationModalOpen(true)}
              isLoading={isQuestsLoading}
              className="h-full min-h-[500px]"
            />
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
        onCreateClick={() => setIsGoalWizardOpen(true)}
        selectedGoalId={selectedGoalId}
        onGoalSelect={setSelectedGoalId}
        onDeleteGoal={async (goalId) => {
          try {
            await deleteGoal(goalId)
            setSelectedGoalId(null) // Clear selection after delete
            await fetchGoals()
          } catch (error) {
            console.error('Failed to delete goal:', error)
            throw error // Re-throw for modal to handle
          }
        }}
        onEditGoal={(goal) => {
          // Close detail modal and open GoalModal in edit mode
          setSelectedGoalId(null)
          setEditingGoal(goal)
          setIsGoalModalOpen(true)
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
      {/* Goal Creation Wizard - New Enhanced Flow */}
      <GoalCreationWizard
        isOpen={isGoalWizardOpen}
        onClose={() => setIsGoalWizardOpen(false)}
        onSubmit={async (data) => {
          try {
            const goalPayload = {
              title: data.title,
              description: data.description || null,
              target_value: data.target_value ?? null,
              unit: data.unit || null,
              period: data.period,
              category_id: data.category_id || null,
              start_date: data.start_date,
              end_date: data.end_date || null,
              // New psychological fields
              motivation: data.motivation || null,
              identity_statement: data.identity_statement || null,
              best_time_of_day: data.best_time_of_day || 'anytime',
              difficulty_level: data.difficulty_level || 'medium'
            }
            // Create the goal first
            const newGoal = await createGoal(goalPayload)

            // If quest templates were selected, create quests linked to this goal
            if (data.selected_quest_template_ids && data.selected_quest_template_ids.length > 0 && newGoal) {
              const { createQuestFromTemplate } = await import('@/actions/quests')

              // Create quests from each selected template
              await Promise.all(
                data.selected_quest_template_ids.map(templateId =>
                  createQuestFromTemplate(templateId, newGoal.id)
                )
              )

              // Refresh quests panel
              await fetchQuests()
            }

            await fetchGoals()
          } catch (error) {
            console.error('Failed to create goal:', error)
            throw error
          }
        }}
        categories={categories}
      />

      {/* GoalModal - For editing goals */}
      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => {
          setIsGoalModalOpen(false)
          setEditingGoal(null)
        }}
        onSubmit={async (data) => {
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
            if (editingGoal) {
              // Update existing goal
              await updateGoal(editingGoal.id, goalPayload)
            } else {
              // Create new goal (legacy fallback)
              await createGoal(goalPayload)
            }
            await fetchGoals()
            setEditingGoal(null)
          } catch (error) {
            console.error('Failed to save goal:', error)
            throw error
          }
        }}
        categories={categories}
        editingGoal={editingGoal}
      />

      {/* AI Council */}
      <CouncilFAB onClick={() => setIsCouncilOpen(true)} />
      <CouncilPanel
        isOpen={isCouncilOpen}
        onClose={() => setIsCouncilOpen(false)}
        activeEventId={selectedEvent?.id}
      />

      {/* Quest Creation Modal */}
      <QuestCreationModal
        isOpen={isQuestCreationModalOpen}
        onClose={() => setIsQuestCreationModalOpen(false)}
        goals={goals}
        onQuestCreated={(quest) => {
          setQuests(prev => [...prev, quest])
        }}
      />
    </main>
  )
}
