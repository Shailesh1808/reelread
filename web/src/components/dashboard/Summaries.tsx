'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import type { Summary } from '@/types'
import SummaryCard from './SummaryCard'

interface Props {
  summaries: Summary[]
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
      fill="none" viewBox="0 0 24 24" stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}

function FilterDropdown({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 bg-black text-white text-sm font-medium px-3 py-2.5 rounded-lg border border-gray-800 hover:border-gray-600 transition-colors whitespace-nowrap"
      >
        {selected?.label}
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 min-w-full bg-black border border-gray-800 rounded-lg shadow-xl overflow-hidden">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => { onChange(option.value); setOpen(false) }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors whitespace-nowrap ${
                value === option.value
                  ? 'text-white bg-white/10'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function EmptyState() {
  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '14155238886'
  return (
    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-100 text-center px-6">
      <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7 text-gray-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 className="font-semibold text-gray-900 mb-1">No summaries yet</h3>
      <p className="text-sm text-gray-500 mb-5 max-w-xs">
        Send your first Instagram Reel or TikTok link on WhatsApp to get started.
      </p>
      <a
        href={`https://wa.me/${waNumber}`}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-black text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
      >
        Open WhatsApp
      </a>
    </div>
  )
}

function NoResults() {
  return (
    <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-100 text-center px-6">
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 text-gray-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <h3 className="font-semibold text-gray-900 mb-1">No results</h3>
      <p className="text-sm text-gray-400">Try adjusting your filters or search term</p>
    </div>
  )
}

const PLATFORM_OPTIONS = [
  { value: 'all', label: 'All platforms' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
]

const MODE_OPTIONS = [
  { value: 'all', label: 'All modes' },
  { value: 'snapshot', label: 'Snapshot' },
  { value: 'standard', label: 'Standard' },
  { value: 'deep_dive', label: 'Deep Dive' },
]

export default function Summaries({ summaries }: Props) {
  const [platformFilter, setPlatformFilter] = useState('all')
  const [modeFilter, setModeFilter] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    return summaries.filter((s) => {
      if (platformFilter !== 'all' && s.platform?.toLowerCase() !== platformFilter) return false
      if (modeFilter !== 'all' && s.mode !== modeFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          s.creator_name?.toLowerCase().includes(q) ||
          s.summary_text?.toLowerCase().includes(q) ||
          s.source_url?.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [summaries, platformFilter, modeFilter, search])

  return (
    <div className="space-y-5">
      {/* Header row: title left, count right */}
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-bold text-gray-900">Summaries</h2>
        <span className="text-xs text-gray-400">
          {filtered.length} of {summaries.length} summar{summaries.length === 1 ? 'y' : 'ies'}
        </span>
      </div>

      {/* Filters + search */}
      <div className="flex items-center gap-2">
        <FilterDropdown value={platformFilter} onChange={setPlatformFilter} options={PLATFORM_OPTIONS} />
        <FilterDropdown value={modeFilter} onChange={setModeFilter} options={MODE_OPTIONS} />

        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
          />
        </div>
      </div>

      {summaries.length === 0 ? (
        <EmptyState />
      ) : filtered.length === 0 ? (
        <NoResults />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filtered.map((s) => (
            <SummaryCard key={s.id} summary={s} />
          ))}
        </div>
      )}
    </div>
  )
}
