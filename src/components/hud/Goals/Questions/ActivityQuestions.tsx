'use client'

// =====================================================
// Activity Questions
// Collects activity/steps data for personalized quests
// =====================================================

import QuestionCard from './QuestionCard'
import type { Question, ActivityQuestionData } from '@/types/goalQuestions.types'

// =====================================================
// Question Definitions
// =====================================================

export const ACTIVITY_QUESTIONS: Question[] = [
    {
        id: 'current_steps',
        type: 'slider',
        label: 'Günde yaklaşık kaç adım atıyorsun?',
        emoji: '👟',
        required: true,
        min: 1000,
        max: 15000,
        step: 1000,
        unit: ' adım',
        defaultValue: 5000
    },
    {
        id: 'work_environment',
        type: 'single',
        label: 'İş/okul ortamın nasıl?',
        emoji: '💼',
        required: true,
        options: [
            { value: 'desk', label: 'Masa başı', emoji: '🪑' },
            { value: 'standing', label: 'Ayakta', emoji: '🧍' },
            { value: 'active', label: 'Hareketli', emoji: '🏃' },
            { value: 'remote', label: 'Evden çalışıyorum', emoji: '🏠' }
        ]
    },
    {
        id: 'commute_method',
        type: 'single',
        label: 'İşe/okula nasıl gidiyorsun?',
        emoji: '🚗',
        options: [
            { value: 'car', label: 'Araba', emoji: '🚗' },
            { value: 'public', label: 'Toplu taşıma', emoji: '🚇' },
            { value: 'walk', label: 'Yürüyerek', emoji: '🚶' },
            { value: 'bike', label: 'Bisiklet', emoji: '🚲' },
            { value: 'none', label: 'Evden çalışıyorum', emoji: '🏠' }
        ]
    },
    {
        id: 'best_activity_time',
        type: 'single',
        label: 'En aktif olduğun saat?',
        emoji: '⏰',
        required: true,
        options: [
            { value: 'morning', label: 'Sabah', emoji: '🌅' },
            { value: 'lunch', label: 'Öğle', emoji: '☀️' },
            { value: 'evening', label: 'Akşam', emoji: '🌆' }
        ]
    },
    {
        id: 'has_fitness_tracker',
        type: 'boolean',
        label: 'Fitness tracker veya akıllı saat kullanıyor musun?',
        emoji: '⌚',
        trueLabel: 'Evet, kullanıyorum',
        falseLabel: 'Hayır, kullanmıyorum'
    },
    {
        id: 'more_active_weekends',
        type: 'single',
        label: 'Hafta sonları daha mı aktifsin?',
        emoji: '📅',
        options: [
            { value: 'yes', label: 'Evet, daha aktif', emoji: '🏃' },
            { value: 'same', label: 'Aynı', emoji: '➡️' },
            { value: 'less', label: 'Daha az aktif', emoji: '🛋️' }
        ]
    }
]

// =====================================================
// Props
// =====================================================

interface ActivityQuestionsProps {
    data: Partial<ActivityQuestionData>
    onChange: (field: keyof ActivityQuestionData, value: string | string[] | boolean | number) => void
}

// =====================================================
// Component
// =====================================================

export default function ActivityQuestions({ data, onChange }: ActivityQuestionsProps) {
    const getQuestionValue = (questionId: string) => {
        return data[questionId as keyof ActivityQuestionData]
    }

    return (
        <div className="space-y-6">
            <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-slate-800">🚶 Aktivite Profili</h3>
                <p className="text-sm text-slate-500">Sana özel hareket hedefleri için</p>
            </div>

            {ACTIVITY_QUESTIONS.map((question) => (
                <QuestionCard
                    key={question.id}
                    question={question}
                    value={getQuestionValue(question.id)}
                    onChange={(value) => onChange(question.id as keyof ActivityQuestionData, value)}
                />
            ))}
        </div>
    )
}
