'use client'

import { useCallback, useRef } from 'react'
import { motion } from 'framer-motion'

interface UploadSectionProps {
  onFileUpload: (file: File) => Promise<void>
  onFilesUpload?: (files: File[]) => Promise<void>
  loading: boolean
  error: string | null
}

export function UploadSection({ onFileUpload, onFilesUpload, loading, error }: UploadSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const processFiles = useCallback(
    (files: FileList | File[]) => {
      const arr = Array.from(files)
      const valid = arr.filter((f) => f.name.toLowerCase().endsWith('.json') || f.name.toLowerCase().endsWith('.zip'))
      if (valid.length === 0) return
      if (valid.length === 1 && valid[0].name.toLowerCase().endsWith('.zip')) {
        onFileUpload(valid[0])
      } else if (valid.length > 1 && onFilesUpload) {
        onFilesUpload(valid)
      } else {
        onFileUpload(valid[0])
      }
    },
    [onFileUpload, onFilesUpload]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files)
    },
    [processFiles]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files?.length) processFiles(files)
      e.target.value = ''
    },
    [processFiles]
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
            ${loading ? 'border-gray-300 cursor-not-allowed opacity-70' : 'border-gray-300 hover:border-hinge-accent/50 hover:bg-hinge-card'}
          `}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".json,.zip"
            onChange={handleFileSelect}
            className="hidden"
            multiple
          />

          {loading ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-2 border-hinge-accent border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-500">Processing your data...</p>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-hinge-accent/20 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-hinge-accent"
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
              <p className="text-gray-500 mb-4">
                or click to browse • ZIP (full export) or multiple JSON files
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
            className="mt-4 text-red-500 text-center"
          >
            {error}
          </motion.p>
        )}
      </motion.div>
    </section>
  )
}
