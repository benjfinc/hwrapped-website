'use client'

import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface PieChartSlideProps {
  data: { name: string; value: number }[]
  colors?: string[]
}

const DEFAULT_COLORS = ['#994EA8', '#B87AC4', '#9CA3AF', '#6B7280']

export function PieChartSlide({ data, colors = DEFAULT_COLORS }: PieChartSlideProps) {
  if (!data || data.length === 0) return null

  const filtered = data.filter((d) => d.value > 0)
  if (filtered.length === 0) return null

  return (
    <motion.div
      className="w-full h-64 mt-8"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5, duration: 0.5 }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={filtered}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {filtered.map((_, index) => (
              <Cell key={index} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              color: '#1F2937',
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </motion.div>
  )
}
