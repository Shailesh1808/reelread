'use client'

import { useState, useEffect } from 'react'
import type { User, Summary } from '@/types'
import SummaryCard from './SummaryCard'

interface Props {
  user: User
  summaries: Summary[]
}

const statIcons = {
  total: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-gray-400">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  saved: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-gray-400">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 3H7a2 2 0 00-2 2v16l7-3 7 3V5a2 2 0 00-2-2z" />
    </svg>
  ),
  today: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-gray-400">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  mode: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-gray-400">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
    </svg>
  ),
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5">
      <div className="mb-3">{icon}</div>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
    </div>
  )
}

function SendReelCard({ botActivated }: { botActivated: boolean }) {
  const [tab, setTab] = useState<'share' | 'activate'>(!botActivated ? 'activate' : 'share')
  const [canInstall, setCanInstall] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '14155238886'
  const waKeyword = process.env.NEXT_PUBLIC_WHATSAPP_KEYWORD || ''
  const activateLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(waKeyword)}`
  const sendLink = `https://wa.me/${waNumber}`

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setCanInstall(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setCanInstall(false)
    setDeferredPrompt(null)
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
      <div className="flex border-b border-gray-100">
        {!botActivated && (
          <button
            onClick={() => setTab('activate')}
            className={`flex-1 text-sm font-medium py-3 transition-colors ${
              tab === 'activate' ? 'text-gray-900 border-b-2 border-black' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Activate bot
          </button>
        )}
        <button
          onClick={() => setTab('share')}
          className={`flex-1 text-sm font-medium py-3 transition-colors ${
            tab === 'share' ? 'text-gray-900 border-b-2 border-black' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Send a Reel
        </button>
      </div>

      <div className="p-5">
        {tab === 'activate' && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <p className="font-semibold text-gray-900 mb-1">Activate your WhatsApp bot</p>
              <p className="text-sm text-gray-500">Open WhatsApp and send the activation message. Takes 5 seconds.</p>
            </div>
            <a href={activateLink} target="_blank" rel="noopener noreferrer"
              className="shrink-0 bg-black text-white font-semibold text-sm px-4 py-2.5 rounded-lg hover:bg-gray-800 transition-colors">
              Activate on WhatsApp
            </a>
          </div>
        )}

        {tab === 'share' && (
          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                Share directly from Instagram or TikTok
              </p>
              <ol className="text-sm text-gray-600 space-y-2.5 mb-4">
                <li className="flex gap-3">
                  <span className="font-bold text-black shrink-0">1.</span>
                  <span>
                    Install ReelRead as an app
                    {canInstall
                      ? <button onClick={handleInstall} className="ml-2 text-black font-semibold underline">Install now</button>
                      : <span className="text-gray-400 ml-1">(Share → Add to Home Screen)</span>
                    }
                  </span>
                </li>
                <li className="flex gap-3"><span className="font-bold text-black shrink-0">2.</span>Open any Reel or TikTok</li>
                <li className="flex gap-3"><span className="font-bold text-black shrink-0">3.</span>Tap <strong>Share</strong> → select <strong>ReelRead</strong></li>
                <li className="flex gap-3"><span className="font-bold text-black shrink-0">4.</span>WhatsApp opens with the link ready. Just tap Send.</li>
              </ol>
              <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2.5">
                <span>Instagram</span><span>→</span>
                <span className="font-semibold text-gray-700">Share</span><span>→</span>
                <span className="font-semibold text-black">ReelRead</span><span>→</span>
                <span className="font-semibold text-gray-700">WhatsApp</span><span>→</span>
                <span className="font-semibold text-black">Send</span>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-3">Or open WhatsApp directly:</p>
              <a href={sendLink} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-black text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
                Open ReelRead on WhatsApp
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Overview({ user, summaries }: Props) {
  const today = new Date().toDateString()
  const todayCount = summaries.filter(
    (s) => s.created_at && new Date(s.created_at).toDateString() === today
  ).length
  const savedCount = summaries.filter((s) => s.saved).length
  const botActivated = user.onboarding_complete === true
  const recent = summaries.slice(0, 5)

  const modeLabel =
    user.summary_mode === 'deep_dive' ? 'Deep Dive'
    : user.summary_mode === 'snapshot' ? 'Snapshot'
    : user.summary_mode === 'standard' ? 'Standard'
    : ''

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Overview</h2>

      <SendReelCard botActivated={botActivated} />

      {/* Stats: 2x2 mobile, 4 across desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total" value={summaries.length} icon={statIcons.total} />
        <StatCard label="Saved" value={savedCount} icon={statIcons.saved} />
        <StatCard label="Today" value={todayCount} icon={statIcons.today} />
        <StatCard label="Mode" value={modeLabel} icon={statIcons.mode} />
      </div>

      {/* Recent summaries */}
      {recent.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Recent
          </h3>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {recent.map((s) => (
              <SummaryCard key={s.id} summary={s} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
