'use client'

import { motion } from 'framer-motion'

export function HeroSection() {
  return (
    <section className="relative min-h-[70vh] flex flex-col items-center justify-center px-6 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-hinge-accent/10 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-hinge-accent/5 via-transparent to-transparent pointer-events-none" />

      <motion.div
        className="relative z-10 text-center max-w-3xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <motion.h1
          className="text-6xl md:text-8xl font-bold tracking-tight mb-4 bg-gradient-to-r from-white via-hinge-accent-light to-hinge-accent bg-clip-text text-transparent"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          Hinge Wrapped
        </motion.h1>

        <motion.p
          className="text-2xl md:text-3xl text-gray-300 font-medium mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          Your year in dating.
        </motion.p>

        <motion.p
          className="text-lg text-gray-400 mb-12 max-w-xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          Upload your Hinge data export and see insights about your dating life.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <a
            href="#upload"
            className="inline-flex items-center gap-2 px-8 py-4 bg-hinge-accent hover:bg-hinge-accent-light text-white font-semibold rounded-full text-lg transition-all duration-200 hover:scale-105 active:scale-95"
          >
            Upload your data
          </a>
        </motion.div>
      </motion.div>
    </section>
  )
}
