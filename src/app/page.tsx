'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HeroSection } from '@/components/HeroSection'
import { UploadSection } from '@/components/UploadSection'
import { HowToSection } from '@/components/HowToSection'
import { PrivacyNote } from '@/components/PrivacyNote'
import { WrappedSlides } from '@/components/WrappedSlides'
import { parseHingeFile, mergeParsedData } from '@/lib/data-parser'
import { computeStats } from '@/lib/compute-stats'
import { generateSlides } from '@/lib/generate-slides'
import type { ParsedHingeData, HingeStats, SlideData } from '@/lib/types'

export default function Home() {
  const [data, setData] = useState<ParsedHingeData | null>(null)
  const [stats, setStats] = useState<HingeStats | null>(null)
  const [slides, setSlides] = useState<SlideData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const processData = (parsed: ParsedHingeData) => {
    const computed = computeStats(parsed)
    const generated = generateSlides(computed)
    setData(parsed)
    setStats(computed)
    setSlides(generated)
  }

  const handleFileUpload = async (file: File) => {
    setLoading(true)
    setError(null)
    try {
      const parsed = await parseHingeFile(file)
      processData(parsed)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file')
    } finally {
      setLoading(false)
    }
  }

  const handleFilesUpload = async (files: File[]) => {
    setLoading(true)
    setError(null)
    try {
      const parsed = await Promise.all(files.map((f) => parseHingeFile(f)))
      const merged = mergeParsedData(...parsed)
      processData(merged)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse files')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setData(null)
    setStats(null)
    setSlides([])
    setError(null)
  }

  const showWrapped = slides.length > 0

  return (
    <main className="min-h-screen bg-hinge-bg">
      <AnimatePresence mode="wait">
        {!showWrapped ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen"
          >
            <HeroSection />
            <UploadSection
              onFileUpload={handleFileUpload}
              onFilesUpload={handleFilesUpload}
              loading={loading}
              error={error}
            />
            <HowToSection />
            <PrivacyNote />
          </motion.div>
        ) : (
          <motion.div
            key="wrapped"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <WrappedSlides
              slides={slides}
              onReset={handleReset}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
