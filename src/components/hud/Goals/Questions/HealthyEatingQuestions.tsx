'use client'

// =====================================================
// Healthy Eating Questions
// Collects eating habits for personalized quests
// =====================================================

import QuestionCard from './QuestionCard'
import type { Question, HealthyEatingQuestionData } from '@/types/goalQuestions.types'

// =====================================================
// Question Definitions
// =====================================================

export const HEALTHY_EATING_QUESTIONS: Question[] = [
    {
        id: 'meals_per_day',
        type: 'single',
        label: 'Günde kaç öğün yiyorsun?',
        emoji: '🍽️',
        required: true,
        options: [
            { value: '1-2', label: '1-2 öğün', emoji: '🍽️' },
            { value: '3', label: '3 öğün', emoji: '🍽️' },
            { value: '4-5', label: '4-5 öğün', emoji: '🍽️' }
        ]
    },
    {
        id: 'cooks_at_home',
        type: 'single',
        label: 'Evde yemek yapıyor musun?',
        emoji: '👩‍🍳',
        required: true,
        options: [
            { value: 'rarely', label: 'Nadiren', emoji: '📦' },
            { value: 'sometimes', label: 'Bazen', emoji: '🍳' },
            { value: 'often', label: 'Çoğunlukla', emoji: '👨‍🍳' },
            { value: 'always', label: 'Her zaman', emoji: '🏠' }
        ]
    },
    {
        id: 'daily_vegetables',
        type: 'single',
        label: 'Günlük sebze tüketiyor musun?',
        emoji: '🥦',
        required: true,
        options: [
            { value: 'never', label: 'Hayır', emoji: '❌' },
            { value: 'sometimes', label: 'Bazen', emoji: '🤔' },
            { value: 'most_days', label: 'Çoğu gün', emoji: '👍' },
            { value: 'everyday', label: 'Her gün', emoji: '✅' }
        ]
    },
    {
        id: 'biggest_challenge',
        type: 'multi',
        label: 'En çok zorlandığın şey ne?',
        emoji: '🚧',
        options: [
            { value: 'time', label: 'Zaman yok', emoji: '⏰' },
            { value: 'knowledge', label: 'Bilgi eksikliği', emoji: '📚' },
            { value: 'cravings', label: 'Sağlıksız yeme isteği', emoji: '🍔' },
            { value: 'social', label: 'Sosyal ortamlar', emoji: '👥' },
            { value: 'budget', label: 'Bütçe', emoji: '💰' }
        ]
    },
    {
        id: 'fast_food_frequency',
        type: 'single',
        label: 'Fast food ne sıklıkla yiyorsun?',
        emoji: '🍟',
        options: [
            { value: 'never', label: 'Hiç', emoji: '✅' },
            { value: 'weekly', label: 'Haftada 1', emoji: '🍔' },
            { value: 'few_times', label: 'Haftada 2-3', emoji: '🍔🍔' },
            { value: 'often', label: 'Neredeyse her gün', emoji: '🍔🍔🍔' }
        ]
    },
    {
        id: 'has_breakfast',
        type: 'single',
        label: 'Kahvaltı yapıyor musun?',
        emoji: '🍳',
        required: true,
        options: [
            { value: 'skip', label: 'Atlıyorum', emoji: '⏭️' },
            { value: 'sometimes', label: 'Bazen', emoji: '🤷' },
            { value: 'everyday', label: 'Her gün', emoji: '☀️' }
        ]
    }
]

// =====================================================
// Props
// =====================================================

interface HealthyEatingQuestionsProps {
    data: Partial<HealthyEatingQuestionData>
    onChange: (field: keyof HealthyEatingQuestionData, value: string | string[] | boolean | number) => void
}

// =====================================================
// Component
// =====================================================

export default function HealthyEatingQuestions({ data, onChange }: HealthyEatingQuestionsProps) {
    const getQuestionValue = (questionId: string) => {
        return data[questionId as keyof HealthyEatingQuestionData]
    }

    return (
        <div className="space-y-6">
            <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-slate-800">🥗 Beslenme Alışkanlıkların</h3>
                <p className="text-sm text-slate-500">Sana özel beslenme önerileri için</p>
            </div>

            {HEALTHY_EATING_QUESTIONS.map((question) => (
                <QuestionCard
                    key={question.id}
                    question={question}
                    value={getQuestionValue(question.id)}
                    onChange={(value) => onChange(question.id as keyof HealthyEatingQuestionData, value)}
                />
            ))}
        </div>
    )
}
