'use client'

import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'

interface BarChartSlideProps {
  data: { name: string; value: number }[]
  color?: string
}

export function BarChartSlide({ data, color = '#994EA8' }: BarChartSlideProps) {
  if (!data || data.length === 0) return null

  return (
    <motion.div
      className="w-full h-64 mt-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="name"
            stroke="#6B7280"
            tick={{ fill: '#4B5563', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            stroke="#6B7280"
            tick={{ fill: '#4B5563', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              color: '#1F2937',
            }}
            labelStyle={{ color: '#1F2937' }}
          />
          <Bar
            dataKey="value"
            fill={color}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  )
}
