'use client'

import { useMemo } from 'react'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'
import { format } from 'date-fns'

interface TradeLog {
    date: string
    pnl: number
}

interface PnLChartProps {
    data: TradeLog[]
}

export default function PnLChart({ data }: PnLChartProps) {
    // Calculate cumulative PnL
    const chartData = useMemo(() => {
        let cumulative = 0
        return data.map(item => {
            cumulative += item.pnl
            return {
                date: item.date,
                pnl: item.pnl,
                cumulative,
            }
        })
    }, [data])

    const isProfit = chartData.length > 0 && chartData[chartData.length - 1].cumulative >= 0

    return (
        <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                        dataKey="date"
                        stroke="#6b7280"
                        fontSize={12}
                        tickFormatter={(value) => format(new Date(value), 'dd/MM')}
                    />
                    <YAxis
                        stroke="#6b7280"
                        fontSize={12}
                        tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            backdropFilter: 'blur(10px)',
                        }}
                        labelStyle={{ color: '#9ca3af' }}
                        formatter={(value) => [`$${(value as number)?.toFixed(2) ?? '0.00'}`, 'Kümülatif PnL']}
                        labelFormatter={(label) => format(new Date(label as string), 'dd MMMM yyyy')}
                    />
                    <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="3 3" />
                    <Area
                        type="monotone"
                        dataKey="cumulative"
                        stroke={isProfit ? '#22c55e' : '#ef4444'}
                        strokeWidth={2}
                        fill={isProfit ? 'url(#colorProfit)' : 'url(#colorLoss)'}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}
