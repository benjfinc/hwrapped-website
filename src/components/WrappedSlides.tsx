'use client'

import { useCallback } from 'react'
import { WrappedSlide } from './WrappedSlide'
import type { SlideData, HingeStats } from '@/lib/types'

async function exportSlide(element: HTMLElement): Promise<void> {
  const html2canvas = (await import('html2canvas')).default
  const canvas = await html2canvas(element, {
    backgroundColor: '#FAF9F8',
    scale: 2,
    useCORS: true,
  })
  const link = document.createElement('a')
  link.download = `hinge-wrapped-${Date.now()}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

interface WrappedSlidesProps {
  slides: SlideData[]
  stats: HingeStats
  onReset: () => void
  useMock?: boolean
}

export function WrappedSlides({ slides, stats, onReset, useMock }: WrappedSlidesProps) {
  const handleExport = useCallback(async (element: HTMLElement) => {
    await exportSlide(element)
  }, [])

  return (
    <div className="relative">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-hinge-bg/90 backdrop-blur-md border-b border-gray-200">
        <span className="text-lg font-semibold text-gray-900">Hinge Wrapped</span>
        <button
          onClick={onReset}
          className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          Start over
        </button>
      </header>

      {/* Slides */}
      <div className="pt-16">
        {slides.map((slide, index) => (
          <WrappedSlide
            key={slide.id}
            slide={slide}
            index={index}
            total={slides.length}
            onExport={handleExport}
            onReset={onReset}
            useMock={useMock}
            isShareSlide={slide.id === 'share'}
          />
        ))}
      </div>
    </div>
  )
}
