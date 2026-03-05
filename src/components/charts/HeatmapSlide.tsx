'use client'

import { motion } from 'framer-motion'

interface HeatmapSlideProps {
  data: Record<string, number>
}

export function HeatmapSlide({ data }: HeatmapSlideProps) {
  const entries = Object.entries(data).sort(([a], [b]) => a.localeCompare(b))
  if (entries.length === 0) return null

  const maxVal = Math.max(...entries.map(([, v]) => v), 1)

  // Group by month for display
  const byMonth: Record<string, { date: string; count: number }[]> = {}
  for (const [date, count] of entries) {
    const month = date.slice(0, 7)
    if (!byMonth[month]) byMonth[month] = []
    byMonth[month].push({ date, count })
  }

  const months = Object.keys(byMonth).sort()

  return (
    <motion.div
      className="w-full mt-8 overflow-x-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.5 }}
    >
      <div className="flex flex-col gap-2 min-w-[400px]">
        {months.slice(-6).map((month) => (
          <div key={month} className="flex gap-1 items-center">
            <span className="text-xs text-gray-500 w-16 flex-shrink-0">{month}</span>
            <div className="flex gap-0.5 flex-wrap flex-1">
              {byMonth[month].map(({ date, count }) => (
                <div
                  key={date}
                  className="w-2 h-2 rounded-sm transition-colors"
                  style={{
                    backgroundColor: `rgba(29, 185, 84, ${0.2 + (count / maxVal) * 0.8})`,
                  }}
                  title={`${date}: ${count} messages`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-2">Each square = 1 day, darker = more messages</p>
    </motion.div>
  )
}
