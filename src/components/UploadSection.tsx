'use client'

import { useCallback, useRef } from 'react'
import { motion } from 'framer-motion'

interface UploadSectionProps {
  onFileUpload: (file: File) => Promise<void>
  onUseMock: () => void
  loading: boolean
  error: string | null
}

export function UploadSection({ onFileUpload, onUseMock, loading, error }: UploadSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (file && (file.name.endsWith('.json') || file.name.endsWith('.zip'))) {
        onFileUpload(file)
      } else {
        // Could set error here
      }
    },
    [onFileUpload]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) onFileUpload(file)
      e.target.value = ''
    },
    [onFileUpload]
  )

  const handleClick = () => inputRef.current?.click()

  return (
    <section id="upload" className="py-24 px-6">
      <motion.div
        className="max-w-2xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div
          onClick={loading ? undefined : handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={`
            relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
            transition-all duration-200
            ${loading ? 'border-gray-600 cursor-not-allowed opacity-70' : 'border-gray-600 hover:border-hinge-green/50 hover:bg-hinge-card/50'}
          `}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".json,.zip"
            onChange={handleFileSelect}
            className="hidden"
          />

          {loading ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-2 border-hinge-green border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400">Processing your data...</p>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-hinge-green/20 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-hinge-green"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Drop your Hinge data here</h3>
              <p className="text-gray-400 mb-4">
                or click to browse • JSON or ZIP files from Hinge export
              </p>
              <p className="text-sm text-gray-500">
                Settings → Download My Data in the Hinge app
              </p>
            </>
          )}
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 text-red-400 text-center"
          >
            {error}
          </motion.p>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={onUseMock}
            disabled={loading}
            className="text-gray-500 hover:text-gray-300 text-sm underline underline-offset-2 transition-colors"
          >
            Try with demo data instead
          </button>
        </div>
      </motion.div>
    </section>
  )
}
