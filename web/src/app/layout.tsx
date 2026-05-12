import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ReelRead: Career advice from Reels, delivered to WhatsApp',
  description:
    'Send any Instagram Reel or TikTok to ReelRead on WhatsApp and get every tip, formatted as structured text, in seconds.',
  manifest: '/manifest.json',
  openGraph: {
    title: 'ReelRead',
    description: 'Career advice from Reels, delivered to WhatsApp.',
    type: 'website',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'ReelRead',
    'theme-color': '#0a0a0a',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} bg-background text-white`}>
        {children}
      </body>
    </html>
  )
}
