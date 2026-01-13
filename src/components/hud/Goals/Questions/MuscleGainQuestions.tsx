'use client'

// =====================================================
// Muscle Gain Questions
// Collects training and lifestyle data for personalized quests
// =====================================================

import QuestionCard from './QuestionCard'
import type { Question, MuscleGainQuestionData } from '@/types/goalQuestions.types'

// =====================================================
// Question Definitions
// =====================================================

export const MUSCLE_GAIN_QUESTIONS: Question[] = [
    {
        id: 'current_training',
        type: 'single',
        label: 'Şu an spor yapıyor musun?',
        emoji: '🏋️',
        required: true,
        options: [
            { value: 'none', label: 'Hayır', emoji: '❌' },
            { value: '1-2', label: 'Haftada 1-2 gün', emoji: '🌱' },
            { value: '3-4', label: 'Haftada 3-4 gün', emoji: '💪' },
            { value: '5+', label: 'Haftada 5+ gün', emoji: '🔥' }
        ]
    },
    {
        id: 'training_types',
        type: 'multi',
        label: 'Ne tür antrenman yapıyorsun veya yapmak istiyorsun?',
        emoji: '🎯',
        required: true,
        options: [
            { value: 'weights', label: 'Ağırlık/Fitness', emoji: '🏋️' },
            { value: 'crossfit', label: 'CrossFit', emoji: '⚡' },
            { value: 'calisthenics', label: 'Vücut Ağırlığı', emoji: '🤸' },
            { value: 'running', label: 'Koşu', emoji: '🏃' },
            { value: 'swimming', label: 'Yüzme', emoji: '🏊' },
            { value: 'martial_arts', label: 'Dövüş Sporu', emoji: '🥊' },
            { value: 'team_sport', label: 'Takım Sporu', emoji: '⚽' }
        ]
    },
    {
        id: 'training_experience',
        type: 'single',
        label: 'Spor deneyimin ne kadar?',
        emoji: '📊',
        required: true,
        options: [
            { value: 'beginner', label: 'Yeni başladım', emoji: '🌱', description: '< 6 ay' },
            { value: 'intermediate', label: 'Orta seviye', emoji: '🌿', description: '6 ay - 2 yıl' },
            { value: 'advanced', label: 'Deneyimli', emoji: '🌳', description: '2+ yıl' }
        ]
    },
    {
        id: 'available_times',
        type: 'multi',
        label: 'Spor yapabileceğin saatler?',
        emoji: '⏰',
        required: true,
        options: [
            { value: 'early_morning', label: 'Sabah erken', emoji: '🌅', description: '06:00-09:00' },
            { value: 'lunch', label: 'Öğle arası', emoji: '☀️', description: '12:00-14:00' },
            { value: 'evening', label: 'Akşam', emoji: '🌆', description: '17:00-21:00' },
            { value: 'weekend', label: 'Hafta sonu', emoji: '📅' }
        ]
    },
    {
        id: 'gym_access',
        type: 'single',
        label: 'Spor salonu erişimin var mı?',
        emoji: '🏢',
        required: true,
        options: [
            { value: 'gym', label: 'Evet, üyeliğim var', emoji: '✅' },
            { value: 'home', label: 'Hayır, evde yapıyorum', emoji: '🏠' },
            { value: 'outdoor', label: 'Park/açık alan', emoji: '🌳' }
        ]
    },
    {
        id: 'meals_per_day',
        type: 'single',
        label: 'Günde kaç öğün yiyorsun?',
        emoji: '🍽️',
        options: [
            { value: '2', label: '2 öğün', emoji: '🍽️' },
            { value: '3', label: '3 öğün', emoji: '🍽️' },
            { value: '4', label: '4 öğün', emoji: '🍽️' },
            { value: '5+', label: '5+ öğün', emoji: '🍽️' }
        ]
    },
    {
        id: 'uses_protein_powder',
        type: 'boolean',
        label: 'Protein tozu kullanıyor musun?',
        emoji: '🥛',
        trueLabel: 'Evet, kullanıyorum',
        falseLabel: 'Hayır, kullanmıyorum'
    },
    {
        id: 'sleep_quality',
        type: 'single',
        label: 'Uyku düzenin nasıl?',
        emoji: '😴',
        required: true,
        options: [
            { value: 'poor', label: 'Kötü', emoji: '😫', description: '< 6 saat' },
            { value: 'fair', label: 'Orta', emoji: '😐', description: '6-7 saat' },
            { value: 'good', label: 'İyi', emoji: '😊', description: '7-8 saat' },
            { value: 'excellent', label: 'Mükemmel', emoji: '😁', description: '8+ saat' }
        ]
    }
]

// =====================================================
// Props
// =====================================================

interface MuscleGainQuestionsProps {
    data: Partial<MuscleGainQuestionData>
    onChange: (field: keyof MuscleGainQuestionData, value: string | string[] | boolean | number) => void
}

// =====================================================
// Component
// =====================================================

export default function MuscleGainQuestions({ data, onChange }: MuscleGainQuestionsProps) {
    const getQuestionValue = (questionId: string) => {
        return data[questionId as keyof MuscleGainQuestionData]
    }

    return (
        <div className="space-y-6">
            <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-slate-800">💪 Antrenman Profili</h3>
                <p className="text-sm text-slate-500">Sana özel egzersiz ve beslenme görevleri için</p>
            </div>

            {MUSCLE_GAIN_QUESTIONS.map((question) => (
                <QuestionCard
                    key={question.id}
                    question={question}
                    value={getQuestionValue(question.id)}
                    onChange={(value) => onChange(question.id as keyof MuscleGainQuestionData, value)}
                />
            ))}
        </div>
    )
}
