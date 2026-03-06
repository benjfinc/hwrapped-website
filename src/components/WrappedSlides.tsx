'use client'

import { useState, useRef } from 'react'
import { WrappedSlide } from './WrappedSlide'
import type { SlideData } from '@/lib/types'

interface WrappedSlidesProps {
  slides: SlideData[]
  onReset: () => void
}

export function WrappedSlides({ slides, onReset }: WrappedSlidesProps) {
  const slidesContainerRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)

  const captureAllSlides = async () => {
    if (!slidesContainerRef.current) return null
    const html2canvas = (await import('html2canvas')).default
    return html2canvas(slidesContainerRef.current, {
      backgroundColor: '#FAF9F8',
      scale: 2,
      useCORS: true,
      windowWidth: slidesContainerRef.current.scrollWidth,
      windowHeight: slidesContainerRef.current.scrollHeight,
    })
  }

  const handleExportImage = async () => {
    setIsExporting(true)
    try {
      const canvas = await captureAllSlides()
      if (!canvas) return
      const link = document.createElement('a')
      link.download = `hinge-wrapped-full-${Date.now()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportPdf = async () => {
    setIsExporting(true)
    try {
      const canvas = await captureAllSlides()
      if (!canvas) return

      const { jsPDF } = await import('jspdf')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const imageData = canvas.toDataURL('image/png')

      const renderedWidth = pageWidth
      const renderedHeight = (canvas.height * renderedWidth) / canvas.width
      let remainingHeight = renderedHeight
      let yOffset = 0

      pdf.addImage(imageData, 'PNG', 0, yOffset, renderedWidth, renderedHeight, undefined, 'FAST')
      remainingHeight -= pageHeight

      while (remainingHeight > 0) {
        yOffset -= pageHeight
        pdf.addPage()
        pdf.addImage(imageData, 'PNG', 0, yOffset, renderedWidth, renderedHeight, undefined, 'FAST')
        remainingHeight -= pageHeight
      }

      pdf.save(`hinge-wrapped-full-${Date.now()}.pdf`)
    } finally {
      setIsExporting(false)
    }
  }

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
      <div ref={slidesContainerRef} className="pt-16">
        {slides.map((slide, index) => (
          <WrappedSlide
            key={slide.id}
            slide={slide}
            index={index}
            total={slides.length}
          />
        ))}
      </div>

      <section className="px-6 py-12 border-t border-gray-200 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h3 className="text-2xl font-bold mb-3">Export full Wrapped</h3>
          <p className="text-gray-600 mb-6">
            Save all stats shown above as one shareable file.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleExportImage}
              disabled={isExporting}
              className="px-6 py-3 bg-hinge-accent hover:bg-hinge-accent-light text-white font-semibold rounded-full transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isExporting ? 'Exporting...' : 'Export all as image'}
            </button>
            <button
              onClick={handleExportPdf}
              disabled={isExporting}
              className="px-6 py-3 border border-gray-300 hover:border-gray-400 text-gray-700 font-medium rounded-full transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isExporting ? 'Exporting...' : 'Export all as PDF'}
            </button>
            <button
              onClick={onReset}
              disabled={isExporting}
              className="px-6 py-3 text-gray-600 hover:text-gray-900 font-medium rounded-full transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              Try different data
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
