'use client'

import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface CategoryData {
    category: string
    count: number
    color: string
}

interface CategoryBreakdownProps {
    data: CategoryData[]
}

export default function CategoryBreakdown({ data }: CategoryBreakdownProps) {
    const total = useMemo(() => data.reduce((sum, item) => sum + item.count, 0), [data])

    return (
        <div className="space-y-4">
            {/* Bar Chart */}
            <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={false} />
                        <XAxis type="number" stroke="#6b7280" fontSize={12} />
                        <YAxis
                            type="category"
                            dataKey="category"
                            stroke="#6b7280"
                            fontSize={12}
                            width={60}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '8px',
                            }}
                            cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                        />
                        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                            {data.map((entry, index) => (
                                <Cell key={index} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
                {data.slice(0, 3).map((item, index) => (
                    <div
                        key={index}
                        className="p-3 rounded-xl bg-white/5 border border-white/5 text-center"
                    >
                        <p className="text-2xl font-bold" style={{ color: item.color }}>
                            {item.count}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">{item.category}</p>
                        <p className="text-xs text-gray-600">
                            {total > 0 ? Math.round((item.count / total) * 100) : 0}%
                        </p>
                    </div>
                ))}
            </div>
        </div>
    )
}
