"use client";

import { useState } from "react";
import StatusBar from "@/components/hud/StatusBar";
import LogDrawer from "@/components/hud/LogDrawer";
import EventTimeline from "@/components/hud/EventTimeline";
import LoggerModal from "@/components/hud/LoggerModal";
import EventModal from "@/components/hud/EventModal";
import CalendarPicker from "@/components/hud/CalendarPicker";
import { AnimatePresence } from "framer-motion";
import { CategorySlug } from '@/types/database.types'

// Mock Data for StatusBar
const MOCK_DAILY_STATUS = {
  trade: false,
  food: true,
  sport: false,
  dev: true,
  etsy: false,
  gaming: false,
}

// Mock logs for LogDrawer
const MOCK_LOGS = [
  {
    id: '1',
    category: 'food' as CategorySlug,
    data: { meal_type: 'lunch', calories: 650 },
    sentiment: 7,
    timestamp: new Date(new Date().setHours(12, 30))
  },
  {
    id: '2',
    category: 'dev' as CategorySlug,
    data: { project: 'LifeNexus', task: 'UI Refactor' },
    sentiment: 9,
    timestamp: new Date(new Date().setHours(14, 0))
  }
]

export default function Home() {
  const [isLoggerOpen, setIsLoggerOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [logs, setLogs] = useState<any[]>(MOCK_LOGS);

  const handleLogSubmit = (category: CategorySlug, data: Record<string, unknown>, sentiment: number) => {
    const newLog = {
      id: crypto.randomUUID(),
      category,
      data,
      sentiment,
      timestamp: new Date()
    }
    setLogs([newLog, ...logs])
  }

  return (
    <main className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-100 text-slate-800">

      {/* 3D SCENE KALDIRILDI. 
        Yerine yukarıdaki 'bg-gradient...' sınıfları ile modern, aydınlık bir zemin sağlandı.
      */}

      {/* HEADS-UP DISPLAY (HUD) LAYER */}
      <div className="relative z-10 w-full h-full flex flex-col p-4 md:p-6 pointer-events-none">

        {/* Üst Bar (Status & Date) */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pointer-events-auto">
          {/* Mock Daily Status passed explicitly */}
          <StatusBar dailyStatus={MOCK_DAILY_STATUS} />
          {/* Takvim Bileşeni artık sağ üstte daha erişilebilir durabilir */}
          <div className="hidden md:block">
            <CalendarPicker
              selectedDate={selectedDate}
              onSelect={setSelectedDate}
            />
          </div>
        </div>

        {/* Orta Alan (Boşluk veya İleride Eklenecek Widgetlar) */}
        <div className="flex-1 flex items-center justify-center pointer-events-none">
          {/* Buraya şimdilik hoş bir "Empty State" veya günün özeti gelebilir */}
          <div className="opacity-10 text-center select-none">
            <h1 className="text-6xl font-light tracking-widest uppercase">LifeNexus</h1>
            <p className="mt-2 text-xl tracking-wide">Focus Mode Active</p>
          </div>
        </div>

        {/* Alt Kontroller (Mobil için Takvim vb.) */}
        <div className="md:hidden mt-auto pointer-events-auto">
          <CalendarPicker
            selectedDate={selectedDate}
            onSelect={setSelectedDate}
          />
        </div>
      </div>

      {/* MODALS & PANELS (Etkileşim Katmanı) */}
      <AnimatePresence>
        {/* Yan Paneller (Drawers) */}
        <LogDrawer
          key="log-drawer"
          logs={logs}
          isOpen={true} // Test için açık, normalde state ile kontrol edilir
          onOpenLogger={() => setIsLoggerOpen(true)}
        />

        <EventTimeline
          key="event-timeline"
          isOpen={true}
          onClose={() => { }} // Always open for now
          onOpenEventModal={() => setIsEventModalOpen(true)}
        />

        {/* Pop-up Modallar */}
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
            selectedDate={selectedDate}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
