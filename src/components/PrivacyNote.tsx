'use client'

import { motion } from 'framer-motion'

export function PrivacyNote() {
  return (
    <section className="py-16 px-6">
      <motion.div
        className="max-w-2xl mx-auto text-center"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-hinge-accent/10 border border-hinge-accent/20">
          <svg
            className="w-5 h-5 text-hinge-accent"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <span className="text-sm text-gray-600">
            Your data never leaves your device. All processing happens locally.
          </span>
        </div>
      </motion.div>
    </section>
  )
}
