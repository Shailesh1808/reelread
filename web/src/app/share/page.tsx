'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function ShareHandler() {
  const params = useSearchParams()
  const [status, setStatus] = useState<'redirecting' | 'no-url' | 'done'>('redirecting')

  useEffect(() => {
    // Platforms pass shared data differently:
    // Instagram: url param
    // TikTok: text param (often contains the URL inline)
    const urlParam = params.get('url') || ''
    const textParam = params.get('text') || ''

    // Pull the first URL out of whichever param has it
    const combined = urlParam || textParam
    const match = combined.match(/https?:\/\/[^\s]+/)
    const sharedUrl = match ? match[0] : ''

    if (!sharedUrl) {
      setStatus('no-url')
      return
    }

    const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '14155238886'
    const waHref = `https://wa.me/${waNumber}?text=${encodeURIComponent(sharedUrl)}`

    setStatus('done')
    window.location.href = waHref
  }, [params])

  if (status === 'no-url') {
    return (
      <div className="text-center">
        <p className="text-4xl mb-4">⚠️</p>
        <p className="text-white font-semibold mb-1">No link found</p>
        <p className="text-zinc-500 text-sm mb-6">
          Make sure you're sharing a Reel or TikTok link.
        </p>
        <a href="/dashboard" className="text-accent text-sm hover:underline">
          Back to dashboard
        </a>
      </div>
    )
  }

  return (
    <div className="text-center">
      <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-white font-semibold mb-1">Opening WhatsApp...</p>
      <p className="text-zinc-500 text-sm">Sending your link to ReelRead</p>
    </div>
  )
}

export default function SharePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-accent font-bold text-xl mb-10">ReelRead</div>
      <Suspense
        fallback={
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-zinc-500 text-sm">Loading...</p>
          </div>
        }
      >
        <ShareHandler />
      </Suspense>
    </main>
  )
}
