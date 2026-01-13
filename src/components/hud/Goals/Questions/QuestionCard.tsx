'use client'

// =====================================================
// QuestionCard - Reusable Goal Question Component
// Renders different question types with consistent styling
// =====================================================

import { useState } from 'react'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import { Check, Clock } from 'lucide-react'
import type {
    Question,
    SingleChoiceQuestion,
    MultiChoiceQuestion,
    BooleanQuestion,
    SliderQuestion,
    TimeQuestion
} from '@/types/goalQuestions.types'

// =====================================================
// Props
// =====================================================

interface QuestionCardProps {
    question: Question
    value: string | string[] | boolean | number | undefined
    onChange: (value: string | string[] | boolean | number) => void
    error?: string
}

// =====================================================
// Main Component
// =====================================================

export default function QuestionCard({
    question,
    value,
    onChange,
    error
}: QuestionCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
        >
            {/* Question Label */}
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                {question.emoji && <span className="text-lg">{question.emoji}</span>}
                {question.label}
                {question.required && <span className="text-red-500">*</span>}
            </label>

            {/* Question Content */}
            {question.type === 'single' && (
                <SingleChoice
                    question={question}
                    value={value as string | undefined}
                    onChange={(v) => onChange(v)}
                />
            )}

            {question.type === 'multi' && (
                <MultiChoice
                    question={question}
                    value={value as string[] | undefined}
                    onChange={(v) => onChange(v)}
                />
            )}

            {question.type === 'boolean' && (
                <BooleanToggle
                    question={question}
                    value={value as boolean | undefined}
                    onChange={(v) => onChange(v)}
                />
            )}

            {question.type === 'slider' && (
                <SliderInput
                    question={question}
                    value={value as number | undefined}
                    onChange={(v) => onChange(v)}
                />
            )}

            {question.type === 'time' && (
                <TimeInput
                    question={question}
                    value={value as string | undefined}
                    onChange={(v) => onChange(v)}
                />
            )}

            {/* Error Message */}
            {error && (
                <p className="text-xs text-red-500 mt-1">{error}</p>
            )}
        </motion.div>
    )
}

// =====================================================
// Single Choice (Radio-like buttons)
// =====================================================

function SingleChoice({
    question,
    value,
    onChange
}: {
    question: SingleChoiceQuestion
    value: string | undefined
    onChange: (value: string) => void
}) {
    const optionCount = question.options.length
    const useGrid = optionCount <= 4

    return (
        <div className={clsx(
            useGrid
                ? 'grid gap-2'
                : 'flex flex-col gap-2',
            useGrid && optionCount === 2 && 'grid-cols-2',
            useGrid && optionCount === 3 && 'grid-cols-3',
            useGrid && optionCount === 4 && 'grid-cols-2 sm:grid-cols-4'
        )}>
            {question.options.map((option) => {
                const isSelected = value === option.value
                return (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => onChange(option.value)}
                        className={clsx(
                            'p-3 rounded-xl border-2 transition-all text-left',
                            isSelected
                                ? 'border-violet-500 bg-violet-50'
                                : 'border-slate-200 hover:border-slate-300'
                        )}
                    >
                        <div className="flex items-center gap-2">
                            {option.emoji && (
                                <span className="text-lg">{option.emoji}</span>
                            )}
                            <span className={clsx(
                                'text-sm font-medium',
                                isSelected ? 'text-violet-700' : 'text-slate-700'
                            )}>
                                {option.label}
                            </span>
                        </div>
                        {option.description && (
                            <p className="text-xs text-slate-500 mt-1 ml-7">
                                {option.description}
                            </p>
                        )}
                    </button>
                )
            })}
        </div>
    )
}

// =====================================================
// Multi Choice (Checkboxes as tags)
// =====================================================

function MultiChoice({
    question,
    value,
    onChange
}: {
    question: MultiChoiceQuestion
    value: string[] | undefined
    onChange: (value: string[]) => void
}) {
    const selected = value || []

    const toggleOption = (optionValue: string) => {
        if (selected.includes(optionValue)) {
            onChange(selected.filter(v => v !== optionValue))
        } else {
            if (question.maxSelections && selected.length >= question.maxSelections) {
                return
            }
            onChange([...selected, optionValue])
        }
    }

    return (
        <div className="flex flex-wrap gap-2">
            {question.options.map((option) => {
                const isSelected = selected.includes(option.value)
                return (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => toggleOption(option.value)}
                        className={clsx(
                            'px-3 py-2 rounded-full text-sm transition-all flex items-center gap-1.5',
                            isSelected
                                ? 'bg-violet-500 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        )}
                    >
                        {option.emoji && <span>{option.emoji}</span>}
                        <span>{option.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                    </button>
                )
            })}
        </div>
    )
}

// =====================================================
// Boolean Toggle
// =====================================================

function BooleanToggle({
    question,
    value,
    onChange
}: {
    question: BooleanQuestion
    value: boolean | undefined
    onChange: (value: boolean) => void
}) {
    const trueLabel = question.trueLabel || 'Evet'
    const falseLabel = question.falseLabel || 'Hayır'

    return (
        <div className="grid grid-cols-2 gap-3">
            <button
                type="button"
                onClick={() => onChange(true)}
                className={clsx(
                    'p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2',
                    value === true
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 hover:border-slate-300'
                )}
            >
                <span className="text-lg">✅</span>
                <span className={clsx(
                    'font-medium',
                    value === true ? 'text-emerald-700' : 'text-slate-600'
                )}>
                    {trueLabel}
                </span>
            </button>
            <button
                type="button"
                onClick={() => onChange(false)}
                className={clsx(
                    'p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2',
                    value === false
                        ? 'border-red-500 bg-red-50'
                        : 'border-slate-200 hover:border-slate-300'
                )}
            >
                <span className="text-lg">❌</span>
                <span className={clsx(
                    'font-medium',
                    value === false ? 'text-red-700' : 'text-slate-600'
                )}>
                    {falseLabel}
                </span>
            </button>
        </div>
    )
}

// =====================================================
// Slider Input
// =====================================================

function SliderInput({
    question,
    value,
    onChange
}: {
    question: SliderQuestion
    value: number | undefined
    onChange: (value: number) => void
}) {
    const [localValue, setLocalValue] = useState(value ?? question.defaultValue ?? question.min)

    const handleChange = (newValue: number) => {
        setLocalValue(newValue)
        onChange(newValue)
    }

    const percentage = ((localValue - question.min) / (question.max - question.min)) * 100

    return (
        <div className="space-y-3">
            {/* Current Value Display */}
            <div className="flex justify-center">
                <div className="px-4 py-2 rounded-xl bg-violet-100 border border-violet-200">
                    <span className="text-2xl font-bold text-violet-700">
                        {localValue}
                    </span>
                    <span className="text-sm text-violet-600 ml-1">
                        {question.unit}
                    </span>
                </div>
            </div>

            {/* Slider */}
            <div className="relative px-2">
                <input
                    type="range"
                    min={question.min}
                    max={question.max}
                    step={question.step}
                    value={localValue}
                    onChange={(e) => handleChange(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-violet-500"
                    style={{
                        background: `linear-gradient(to right, rgb(139, 92, 246) 0%, rgb(139, 92, 246) ${percentage}%, rgb(226, 232, 240) ${percentage}%, rgb(226, 232, 240) 100%)`
                    }}
                />
                <div className="flex justify-between mt-1">
                    <span className="text-xs text-slate-400">{question.min}{question.unit}</span>
                    <span className="text-xs text-slate-400">{question.max}{question.unit}</span>
                </div>
            </div>
        </div>
    )
}

// =====================================================
// Time Input
// =====================================================

function TimeInput({
    question,
    value,
    onChange
}: {
    question: TimeQuestion
    value: string | undefined
    onChange: (value: string) => void
}) {
    return (
        <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
                type="time"
                value={value || question.defaultValue || '12:00'}
                onChange={(e) => onChange(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-500 focus:border-transparent text-lg font-medium"
            />
        </div>
    )
}
