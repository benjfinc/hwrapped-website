'use client'

import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface PieChartSlideProps {
  data: { name: string; value: number }[]
  colors?: string[]
}

const DEFAULT_COLORS = ['#1DB954', '#333', '#555', '#777']

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
              backgroundColor: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '8px',
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </motion.div>
  )
}
