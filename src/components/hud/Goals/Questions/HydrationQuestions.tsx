'use client'

// =====================================================
// Hydration Questions
// Collects water intake habits for personalized quests
// =====================================================

import QuestionCard from './QuestionCard'
import type { Question, HydrationQuestionData } from '@/types/goalQuestions.types'

// =====================================================
// Question Definitions
// =====================================================

export const HYDRATION_QUESTIONS: Question[] = [
    {
        id: 'current_intake_liters',
        type: 'slider',
        label: 'Günde yaklaşık kaç litre su içiyorsun?',
        emoji: '💧',
        required: true,
        min: 0.5,
        max: 4,
        step: 0.5,
        unit: 'L',
        defaultValue: 1.5
    },
    {
        id: 'barriers',
        type: 'multi',
        label: 'Su içmeyi neden zor buluyorsun?',
        emoji: '🚧',
        options: [
            { value: 'forget', label: 'Unutuyorum', emoji: '🤔' },
            { value: 'taste', label: 'Tadı sıkıcı', emoji: '😐' },
            { value: 'no_bottle', label: 'Yanımda taşımıyorum', emoji: '🎒' },
            { value: 'no_habit', label: 'Alışkanlık yok', emoji: '🔄' },
            { value: 'bathroom', label: 'Tuvalet endişesi', emoji: '🚽' }
        ]
    },
    {
        id: 'forget_when',
        type: 'single',
        label: 'Su içmeyi en çok ne zaman unutuyorsun?',
        emoji: '⏰',
        required: true,
        options: [
            { value: 'morning', label: 'Sabahları', emoji: '🌅' },
            { value: 'work', label: 'İş/okul saatlerinde', emoji: '💼' },
            { value: 'evening', label: 'Akşamları', emoji: '🌆' }
        ]
    },
    {
        id: 'has_water_bottle',
        type: 'boolean',
        label: 'Matara veya su şişen var mı?',
        emoji: '🍼',
        trueLabel: 'Evet, var',
        falseLabel: 'Hayır, yok'
    },
    {
        id: 'coffee_tea_cups',
        type: 'single',
        label: 'Günde kaç fincan kahve veya çay içiyorsun?',
        emoji: '☕',
        options: [
            { value: '0', label: 'İçmiyorum', emoji: '❌' },
            { value: '1-2', label: '1-2 fincan', emoji: '☕' },
            { value: '3-4', label: '3-4 fincan', emoji: '☕☕' },
            { value: '5+', label: '5+ fincan', emoji: '☕☕☕' }
        ]
    },
    {
        id: 'sweat_level',
        type: 'single',
        label: 'Günlük aktivitende ne kadar terliyorsun?',
        emoji: '💦',
        required: true,
        options: [
            { value: 'low', label: 'Az', emoji: '🧊', description: 'Çoğunlukla masa başı' },
            { value: 'medium', label: 'Orta', emoji: '💧', description: 'Aktif yaşam' },
            { value: 'high', label: 'Çok', emoji: '💦', description: 'Spor veya fiziksel iş' }
        ]
    }
]

// =====================================================
// Props
// =====================================================

interface HydrationQuestionsProps {
    data: Partial<HydrationQuestionData>
    onChange: (field: keyof HydrationQuestionData, value: string | string[] | boolean | number) => void
}

// =====================================================
// Component
// =====================================================

export default function HydrationQuestions({ data, onChange }: HydrationQuestionsProps) {
    const getQuestionValue = (questionId: string) => {
        return data[questionId as keyof HydrationQuestionData]
    }

    return (
        <div className="space-y-6">
            <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-slate-800">💧 Su İçme Alışkanlıkların</h3>
                <p className="text-sm text-slate-500">Sana özel hidrasyon hedefi için</p>
            </div>

            {HYDRATION_QUESTIONS.map((question) => (
                <QuestionCard
                    key={question.id}
                    question={question}
                    value={getQuestionValue(question.id)}
                    onChange={(value) => onChange(question.id as keyof HydrationQuestionData, value)}
                />
            ))}
        </div>
    )
}
