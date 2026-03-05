'use client'

import { motion } from 'framer-motion'

const steps = [
  {
    num: 1,
    title: 'Open Hinge',
    desc: 'Go to your profile and tap the settings gear.',
  },
  {
    num: 2,
    title: 'Request your data',
    desc: 'Tap "Download My Data" and submit the request.',
  },
  {
    num: 3,
    title: 'Wait for export',
    desc: 'Hinge typically takes 24-48 hours to prepare your export.',
  },
  {
    num: 4,
    title: 'Download & upload',
    desc: 'Download the ZIP when ready and upload it here.',
  },
]

export function HowToSection() {
  return (
    <section className="py-24 px-6 bg-hinge-surface">
      <motion.div
        className="max-w-3xl mx-auto"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl md:text-3xl font-bold mb-12 text-center">
          How to get your Hinge data
        </h2>

        <div className="space-y-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              className="flex gap-6 items-start"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
            >
              <div className="w-12 h-12 rounded-full bg-hinge-accent/20 flex items-center justify-center flex-shrink-0 font-bold text-hinge-accent">
                {step.num}
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">{step.title}</h3>
                <p className="text-gray-600">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
