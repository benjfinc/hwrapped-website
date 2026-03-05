'use client'

import { useRef } from 'react'
import { motion } from 'framer-motion'
import { BarChartSlide } from './charts/BarChartSlide'
import { PieChartSlide } from './charts/PieChartSlide'
import { HeatmapSlide } from './charts/HeatmapSlide'
import type { SlideData } from '@/lib/types'

async function exportSlide(element: HTMLElement): Promise<void> {
  const html2canvas = (await import('html2canvas')).default
  const canvas = await html2canvas(element, {
    backgroundColor: '#0a0a0a',
    scale: 2,
    useCORS: true,
  })
  const link = document.createElement('a')
  link.download = `hinge-wrapped-${Date.now()}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

interface WrappedSlideProps {
  slide: SlideData
  index: number
  total: number
  onExport?: (element: HTMLElement) => void
  onReset?: () => void
  useMock?: boolean
  isShareSlide?: boolean
}

export function WrappedSlide({
  slide,
  index,
  total,
  onExport,
  onReset,
  useMock,
  isShareSlide,
}: WrappedSlideProps) {
  const slideRef = useRef<HTMLDivElement>(null)

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

  // Share slide has custom content with buttons
  if (isShareSlide) {
    return (
      <motion.section
        ref={slideRef}
        className="min-h-screen flex flex-col items-center justify-center px-6 py-20 relative"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.6 }}
      >
        <div className="absolute top-8 left-6 text-sm text-gray-500">
          {index + 1} / {total}
        </div>

        <div className="text-center max-w-xl mx-auto">
          <motion.h2
            className="text-3xl md:text-4xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            {slide.title}
          </motion.h2>

          <motion.div
            className="text-6xl mb-4"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            {slide.stat}
          </motion.div>

          <motion.p
            className="text-xl text-gray-600 mb-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            {slide.subtitle}
          </motion.p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => slideRef.current && exportSlide(slideRef.current)}
              className="px-8 py-4 bg-hinge-accent hover:bg-hinge-accent-light text-white font-semibold rounded-full transition-all hover:scale-105"
            >
              Export as image
            </button>
            {onReset && (
              <button
                onClick={onReset}
                className="px-8 py-4 border border-gray-300 hover:border-gray-400 text-gray-700 font-medium rounded-full transition-all"
              >
                Try different data
              </button>
            )}
          </div>

          {useMock && (
            <p className="mt-8 text-sm text-gray-500">
              You&apos;re viewing demo data. Upload your real Hinge export for personalized insights!
            </p>
          )}
        </div>
      </motion.section>
    )
  }

  return (
    <motion.section
      ref={slideRef}
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
            className="text-6xl md:text-8xl font-bold text-hinge-accent mb-4"
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

      {onExport && (
        <motion.button
          className="absolute bottom-8 right-6 px-4 py-2 text-sm text-gray-500 hover:text-hinge-accent transition-colors"
          onClick={() => slideRef.current && onExport(slideRef.current)}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          Export as image
        </motion.button>
      )}
    </motion.section>
  )
}
