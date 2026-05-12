'use client'

import Link from 'next/link'

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-accent font-bold text-lg tracking-tight">ReelRead</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/register"
            className="text-sm font-medium bg-black text-white px-4 py-1.5 rounded-md hover:bg-gray-800 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  )
}
