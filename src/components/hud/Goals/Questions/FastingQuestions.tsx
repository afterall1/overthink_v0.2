'use client'

// =====================================================
// Fasting Questions
// Collects intermittent fasting preferences for personalized quests
// =====================================================

import QuestionCard from './QuestionCard'
import type { Question, FastingQuestionData } from '@/types/goalQuestions.types'

// =====================================================
// Question Definitions
// =====================================================

export const FASTING_QUESTIONS: Question[] = [
    {
        id: 'preferred_protocol',
        type: 'single',
        label: 'Hangi oruç protokolünü denemek istiyorsun?',
        emoji: '⏰',
        required: true,
        options: [
            { value: '16:8', label: '16:8', emoji: '🌱', description: 'Başlangıç - 8 saatlik yeme penceresi' },
            { value: '18:6', label: '18:6', emoji: '🌿', description: 'Orta - 6 saatlik yeme penceresi' },
            { value: '20:4', label: '20:4', emoji: '🌳', description: 'İleri - 4 saatlik yeme penceresi' },
            { value: '5:2', label: '5:2', emoji: '📅', description: 'Haftada 2 gün düşük kalori' }
        ]
    },
    {
        id: 'eating_window_start',
        type: 'time',
        label: 'İlk yemeğini genelde saat kaçta yiyorsun?',
        emoji: '🍳',
        required: true,
        defaultValue: '12:00'
    },
    {
        id: 'eating_window_end',
        type: 'time',
        label: 'Son yemeğini genelde saat kaçta yiyorsun?',
        emoji: '🌙',
        required: true,
        defaultValue: '20:00'
    },
    {
        id: 'fasting_experience',
        type: 'single',
        label: 'Daha önce oruç denedin mi?',
        emoji: '📊',
        required: true,
        options: [
            { value: 'never', label: 'Hayır, ilk kez', emoji: '🆕' },
            { value: 'tried', label: 'Evet ama bıraktım', emoji: '🔄' },
            { value: 'sometimes', label: 'Ara sıra yapıyorum', emoji: '⏳' }
        ]
    },
    {
        id: 'allows_zero_cal',
        type: 'boolean',
        label: 'Oruçluyken sıfır kalorili içecek içebilir misin?',
        emoji: '☕',
        trueLabel: 'Evet (siyah kahve, çay)',
        falseLabel: 'Hayır, sadece su'
    },
    {
        id: 'morning_hunger',
        type: 'single',
        label: 'Sabahları çok acıkır mısın?',
        emoji: '🍳',
        options: [
            { value: 'very', label: 'Evet, çok acıkırım', emoji: '😩' },
            { value: 'moderate', label: 'Orta seviye', emoji: '😐' },
            { value: 'not_really', label: 'Hayır, sorun değil', emoji: '😊' }
        ]
    },
    {
        id: 'main_motivation',
        type: 'single',
        label: 'Oruç tutmak için ana motivasyonun ne?',
        emoji: '🎯',
        required: true,
        options: [
            { value: 'weight_loss', label: 'Kilo vermek', emoji: '⚖️' },
            { value: 'health', label: 'Sağlık faydaları', emoji: '❤️' },
            { value: 'simplicity', label: 'Yemek planını basitleştirmek', emoji: '✨' },
            { value: 'clarity', label: 'Zihinsel netlik', emoji: '🧠' }
        ]
    }
]

// =====================================================
// Props
// =====================================================

interface FastingQuestionsProps {
    data: Partial<FastingQuestionData>
    onChange: (field: keyof FastingQuestionData, value: string | string[] | boolean | number) => void
}

// =====================================================
// Component
// =====================================================

export default function FastingQuestions({ data, onChange }: FastingQuestionsProps) {
    const getQuestionValue = (questionId: string) => {
        return data[questionId as keyof FastingQuestionData]
    }

    return (
        <div className="space-y-6">
            <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-slate-800">⏰ Oruç Tercihlerin</h3>
                <p className="text-sm text-slate-500">Sana uygun oruç programı için</p>
            </div>

            {FASTING_QUESTIONS.map((question) => (
                <QuestionCard
                    key={question.id}
                    question={question}
                    value={getQuestionValue(question.id)}
                    onChange={(value) => onChange(question.id as keyof FastingQuestionData, value)}
                />
            ))}
        </div>
    )
}
