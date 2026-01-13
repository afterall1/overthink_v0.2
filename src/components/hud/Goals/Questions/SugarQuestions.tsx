'use client'

// =====================================================
// Sugar Reduction Questions
// Collects sugar-specific data for personalized quests
// =====================================================

import QuestionCard from './QuestionCard'
import type { Question, SugarQuestionData } from '@/types/goalQuestions.types'

// =====================================================
// Question Definitions
// =====================================================

export const SUGAR_QUESTIONS: Question[] = [
    {
        id: 'sugar_drinks_per_day',
        type: 'single',
        label: 'Günde kaç şekerli içecek içiyorsun?',
        emoji: '🥤',
        required: true,
        options: [
            { value: '0', label: 'Hiç', emoji: '✅' },
            { value: '1', label: '1 adet', emoji: '🥤' },
            { value: '2-3', label: '2-3 adet', emoji: '🥤🥤' },
            { value: '4+', label: '4 veya daha fazla', emoji: '🥤🥤🥤' }
        ]
    },
    {
        id: 'sugar_sources',
        type: 'multi',
        label: 'Şekeri en çok nereden alıyorsun?',
        emoji: '🍬',
        required: true,
        options: [
            { value: 'soft_drinks', label: 'Gazlı içecek', emoji: '🥤' },
            { value: 'juices', label: 'Meyve suyu', emoji: '🧃' },
            { value: 'coffee_tea', label: 'Şekerli kahve/çay', emoji: '☕' },
            { value: 'desserts', label: 'Tatlılar', emoji: '🍰' },
            { value: 'snacks', label: 'Atıştırmalık', emoji: '🍫' },
            { value: 'cereal', label: 'Kahvaltılık gevrek', emoji: '🥣' }
        ]
    },
    {
        id: 'biggest_trigger',
        type: 'single',
        label: 'Şeker yeme isteği en çok ne zaman geliyor?',
        emoji: '⏰',
        required: true,
        options: [
            { value: 'morning_coffee', label: 'Sabah kahvesi', emoji: '☕' },
            { value: 'after_lunch', label: 'Öğle sonrası', emoji: '🌞' },
            { value: 'after_dinner', label: 'Akşam yemeği sonu', emoji: '🍽️' },
            { value: 'late_night', label: 'Gece geç', emoji: '🌙' },
            { value: 'stress', label: 'Stresli anlar', emoji: '😰' }
        ]
    },
    {
        id: 'accepts_artificial_sweeteners',
        type: 'boolean',
        label: 'Yapay tatlandırıcı kullanabilir misin?',
        emoji: '🧪',
        trueLabel: 'Evet, kullanabilirim',
        falseLabel: 'Hayır, istemiyorum'
    },
    {
        id: 'previous_attempts',
        type: 'single',
        label: 'Daha önce şekeri azaltmayı denedin mi?',
        emoji: '🔄',
        options: [
            { value: 'never', label: 'Hayır, ilk kez', emoji: '🆕' },
            { value: 'failed', label: 'Evet ama başarısız', emoji: '😔' },
            { value: 'partial', label: 'Evet, kısmen başarılı', emoji: '🤔' }
        ]
    },
    {
        id: 'has_sugar_at_home',
        type: 'boolean',
        label: 'Evde şekerli ürünler bulunuyor mu?',
        emoji: '🏠',
        trueLabel: 'Evet, var',
        falseLabel: 'Hayır, yok'
    }
]

// =====================================================
// Props
// =====================================================

interface SugarQuestionsProps {
    data: Partial<SugarQuestionData>
    onChange: (field: keyof SugarQuestionData, value: string | string[] | boolean | number) => void
}

// =====================================================
// Component
// =====================================================

export default function SugarQuestions({ data, onChange }: SugarQuestionsProps) {
    const getQuestionValue = (questionId: string) => {
        return data[questionId as keyof SugarQuestionData]
    }

    return (
        <div className="space-y-6">
            <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-slate-800">🍬 Şeker Alışkanlıkların</h3>
                <p className="text-sm text-slate-500">Bu bilgiler kişiselleştirilmiş görevler için</p>
            </div>

            {SUGAR_QUESTIONS.map((question) => (
                <QuestionCard
                    key={question.id}
                    question={question}
                    value={getQuestionValue(question.id)}
                    onChange={(value) => onChange(question.id as keyof SugarQuestionData, value)}
                />
            ))}
        </div>
    )
}
