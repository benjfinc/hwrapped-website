import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Hinge Wrapped | Your Year in Dating',
  description: 'Upload your Hinge data export and see insights about your dating life. Your year in dating.',
  openGraph: {
    title: 'Hinge Wrapped | Your Year in Dating',
    description: 'Upload your Hinge data export and see insights about your dating life.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hinge Wrapped | Your Year in Dating',
    description: 'Upload your Hinge data export and see insights about your dating life.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
