import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'VAPI AI Voice Integration',
  description: 'Record voice and integrate with VAPI AI using Next.js and TypeScript',
  keywords: ['VAPI', 'AI', 'Voice', 'Recording', 'Next.js', 'TypeScript'],
  authors: [{ name: 'VAPI Integration' }],
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-gradient-primary`}>
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  )
}
