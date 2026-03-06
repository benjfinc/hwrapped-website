'use client'

import { useState, useRef } from 'react'
import { WrappedSlide } from './WrappedSlide'
import type { SlideData, HingeStats } from '@/lib/types'

interface WrappedSlidesProps {
  slides: SlideData[]
  stats: HingeStats
  onReset: () => void
}

async function downloadBlob(blob: Blob, filename: string): Promise<void> {
  const nav = navigator as Navigator & {
    canShare?: (data: { files: File[] }) => boolean
    share?: (data: { files: File[]; title?: string }) => Promise<void>
  }

  const file = new File([blob], filename, { type: blob.type || 'application/octet-stream' })
  if (nav.canShare && nav.share && nav.canShare({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: 'Hinge Wrapped' })
      return
    } catch {
      // Fall back to regular download.
    }
  }

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Mobile fallback when download behavior is blocked.
  setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 1500)
}

export function WrappedSlides({ slides, stats, onReset }: WrappedSlidesProps) {
  const exportReportRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)

  const captureReport = async () => {
    if (!exportReportRef.current) return null
    const html2canvas = (await import('html2canvas')).default
    return html2canvas(exportReportRef.current, {
      backgroundColor: '#FFFFFF',
      scale: 2,
      useCORS: true,
      windowWidth: exportReportRef.current.scrollWidth,
      windowHeight: exportReportRef.current.scrollHeight,
    })
  }

  const handleExportImage = async () => {
    setIsExporting(true)
    try {
      const canvas = await captureReport()
      if (!canvas) return
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
      if (!blob) return
      await downloadBlob(blob, `hinge-wrapped-full-${Date.now()}.png`)
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportPdf = async () => {
    setIsExporting(true)
    try {
      const canvas = await captureReport()
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

      const blob = pdf.output('blob')
      await downloadBlob(blob, `hinge-wrapped-full-${Date.now()}.pdf`)
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
      <div className="pt-16">
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

      {/* Hidden export sheet: one clean artifact for PNG/PDF */}
      <div className="fixed -left-[99999px] top-0">
        <div
          ref={exportReportRef}
          className="w-[1080px] bg-white text-black p-14"
        >
          <h1 className="text-6xl font-bold mb-3">Hinge Wrapped</h1>
          <p className="text-2xl text-gray-600 mb-10">Your year in dating</p>

          <div className="grid grid-cols-3 gap-4 mb-10">
            <div className="rounded-2xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500">Likes/interactions</p>
              <p className="text-4xl font-bold">{stats.totalLikes}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500">Matches</p>
              <p className="text-4xl font-bold">{stats.totalMatches}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500">Chats</p>
              <p className="text-4xl font-bold">{stats.totalConversations}</p>
            </div>
          </div>

          <div className="space-y-4 text-xl mb-10">
            <p>Match rate from likes: <strong>{stats.matchRateFromLikes.toFixed(1)}%</strong></p>
            <p>Conversation rate from matches: <strong>{stats.conversationRate.toFixed(1)}%</strong></p>
            <p>Busiest month: <strong>{stats.mostActiveMonth}</strong></p>
            <p>Most active day/time: <strong>{stats.mostActiveDayOfWeek}</strong> at <strong>{stats.mostActiveTimeOfDay}</strong></p>
            <p>Longest conversation: <strong>{stats.longestConversationMessages} messages</strong> over <strong>{stats.longestConversation.days} days</strong></p>
            <p>Top opener: <strong>&quot;{stats.mostUsedOpener}&quot;</strong></p>
            <p>
              Account age:{' '}
              <strong>{stats.accountAgeDays ? `${Math.round(stats.accountAgeDays / 30)} months` : 'Unavailable'}</strong>
            </p>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-semibold mb-4">Top 5 emojis</h2>
            {stats.topEmojis.length > 0 ? (
              <p
                className="text-5xl leading-relaxed"
                style={{ fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif' }}
              >
                {stats.topEmojis.map((item) => item.emoji).join('  ')}
              </p>
            ) : (
              <p className="text-gray-500">No emojis found in messages.</p>
            )}
          </div>

          <div>
            <h2 className="text-3xl font-semibold mb-4">Monthly conversation activity</h2>
            <div className="space-y-2">
              {stats.messagesByMonth.map((item) => (
                <div key={item.month} className="flex items-center gap-4">
                  <span className="w-28 text-sm text-gray-600">{item.month}</span>
                  <div
                    className="h-4 rounded bg-hinge-accent"
                    style={{ width: `${Math.max(8, item.count * 10)}px` }}
                  />
                  <span className="text-sm text-gray-700">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
