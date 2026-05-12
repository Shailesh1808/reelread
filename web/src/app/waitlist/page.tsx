'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function WaitlistContent() {
  const params = useSearchParams()
  const position = params.get('position') ?? '?'

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12 text-center">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-accent/5 blur-[120px] rounded-full pointer-events-none" />

      <Link href="/" className="text-accent font-bold text-xl mb-10">
        ReelRead
      </Link>

      <div className="relative w-full max-w-sm bg-card border border-border rounded-2xl p-8 space-y-4">
        <div className="text-4xl">🙏</div>
        <h1 className="text-2xl font-bold">You&rsquo;re on the waitlist</h1>
        <p className="text-zinc-400 text-sm leading-relaxed">
          We&rsquo;re in a limited beta right now and every spot is taken.
        </p>

        <div className="bg-background border border-border rounded-xl py-4 px-6">
          <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Your position</p>
          <p className="text-3xl font-bold text-accent">#{position}</p>
        </div>

        <p className="text-zinc-500 text-sm">
          We&rsquo;ll text you on WhatsApp when a spot opens up. No action needed.
        </p>
      </div>

      <p className="text-zinc-700 text-xs mt-8">
        <Link href="/" className="text-zinc-500 hover:text-white transition-colors">
          ← Back to home
        </Link>
      </p>
    </main>
  )
}

export default function WaitlistPage() {
  return (
    <Suspense>
      <WaitlistContent />
    </Suspense>
  )
}
