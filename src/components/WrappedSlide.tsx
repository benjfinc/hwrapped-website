'use client'

import { motion } from 'framer-motion'
import { BarChartSlide } from './charts/BarChartSlide'
import { PieChartSlide } from './charts/PieChartSlide'
import { HeatmapSlide } from './charts/HeatmapSlide'
import type { SlideData } from '@/lib/types'

interface WrappedSlideProps {
  slide: SlideData
  index: number
  total: number
}

export function WrappedSlide({
  slide,
  index,
  total,
}: WrappedSlideProps) {
  const isEmojiSlide = slide.id === 'emoji-top5'

  const renderChart = () => {
    if (slide.chartType === 'bar' && slide.chartData) {
      return <BarChartSlide data={slide.chartData as { name: string; value: number }[]} />
    }
    if (slide.chartType === 'pie' && slide.chartData) {
      return <PieChartSlide data={slide.chartData as { name: string; value: number }[]} />
    }
    if (slide.chartType === 'heatmap' && slide.chartData) {
      return <HeatmapSlide data={slide.chartData as Record<string, number>} />
    }
    return null
  }

  return (
    <motion.section
      className="min-h-screen flex flex-col items-center justify-center px-6 py-20 relative"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.6 }}
    >
      {/* Slide number */}
      <div className="absolute top-8 left-6 text-sm text-gray-500">
        {index + 1} / {total}
      </div>

      <div className="text-center max-w-2xl mx-auto">
        <motion.h2
          className="text-3xl md:text-4xl font-bold mb-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          {slide.title}
        </motion.h2>

        {slide.stat !== '' && (
          <motion.div
            className={`font-bold text-hinge-accent mb-4 ${isEmojiSlide ? 'text-4xl md:text-6xl leading-relaxed' : 'text-6xl md:text-8xl'}`}
            style={isEmojiSlide ? { fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif' } : undefined}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 100 }}
          >
            {slide.stat}
          </motion.div>
        )}

        {slide.subtitle && (
          <motion.p
            className="text-xl text-gray-600 mb-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            {slide.subtitle}
          </motion.p>
        )}

        {renderChart()}
      </div>
    </motion.section>
  )
}
