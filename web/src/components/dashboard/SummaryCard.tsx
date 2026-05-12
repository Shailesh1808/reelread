'use client'

import { useState } from 'react'
import type { Summary } from '@/types'
import { renderWhatsAppMarkdown, cleanSummaryText } from '@/lib/markdown'

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gray-400">
      <path d="M12 12c2.67 0 8 1.34 8 4v2H4v-2c0-2.66 5.33-4 8-4zm0-2a4 4 0 100-8 4 4 0 000 8z" />
    </svg>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      fill="none" viewBox="0 0 24 24" stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}

function PlatformBadge({ platform }: { platform: string | null }) {
  const isIG = platform?.toLowerCase() === 'instagram'
  return (
    <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
      {isIG ? '📸 Instagram' : '🎵 TikTok'}
    </span>
  )
}

function ModeBadge({ mode }: { mode: string | null }) {
  const labels: Record<string, string> = {
    snapshot: 'Snapshot',
    standard: 'Standard',
    deep_dive: 'Deep Dive',
  }
  return (
    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
      {labels[mode ?? ''] ?? mode ?? ''}
    </span>
  )
}

interface Props {
  summary: Summary
}

export default function SummaryCard({ summary }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const isUnknown =
    !summary.creator_name || summary.creator_name.toLowerCase() === 'unknown creator'
  const initial = summary.creator_name?.charAt(0).toUpperCase() ?? ''

  const date = summary.created_at
    ? new Date(summary.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : ''

  const cleanText = cleanSummaryText(summary.summary_text ?? '')

  const copy = async () => {
    await navigator.clipboard.writeText(cleanText)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const renderedMarkdown = renderWhatsAppMarkdown(cleanText)

  return (
    <div className={`bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 transition-colors${expanded ? ' xl:col-span-2' : ''}`}>
      {/* Header row */}
      <button
        className="w-full flex items-start gap-4 p-6 text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
          {isUnknown ? (
            <PersonIcon />
          ) : (
            <span className="text-sm font-bold text-gray-600">{initial}</span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Heading as primary title */}
          <p className="text-sm font-bold text-gray-900 leading-snug mb-1">
            {summary.heading || (isUnknown ? 'Career Advice Summary' : summary.creator_name)}
          </p>

          {/* Creator + badges */}
          <div className="flex items-center flex-wrap gap-1.5">
            {!isUnknown && summary.heading && (
              <span className="text-xs text-gray-400">{summary.creator_name}</span>
            )}
            {summary.platform && <PlatformBadge platform={summary.platform} />}
            <ModeBadge mode={summary.mode} />
            {summary.saved && (
              <span className="text-[11px] text-gray-400 font-medium">💾</span>
            )}
          </div>
        </div>

        {/* Date + chevron */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className="text-[11px] text-gray-400">{date}</span>
          <ChevronIcon open={expanded} />
        </div>
      </button>

      {/* Expandable content */}
      <div
        style={{
          display: 'grid',
          gridTemplateRows: expanded ? '1fr' : '0fr',
          transition: 'grid-template-rows 200ms ease',
        }}
      >
        <div style={{ overflow: 'hidden' }}>
          <div className="border-t border-gray-100 xl:grid xl:grid-cols-5">
            {/* Left: full summary text (60%) */}
            <div className="xl:col-span-3 px-6 pt-4 pb-6">
              {summary.heading && (
                <h3 className="text-base font-bold text-gray-900 mb-3">{summary.heading}</h3>
              )}
              <div
                className="wm-content"
                dangerouslySetInnerHTML={{ __html: renderedMarkdown }}
              />
            </div>

            {/* Right: metadata + actions panel (40%) */}
            <div className="xl:col-span-2 border-t xl:border-t-0 xl:border-l border-gray-100 px-6 pt-4 pb-6 flex flex-col gap-4">
              <div className="space-y-3">
                {summary.source_url && (
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Source</p>
                    <a
                      href={summary.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-gray-600 hover:text-gray-900 truncate block transition-colors"
                    >
                      {summary.source_url.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
                {!isUnknown && (
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Creator</p>
                    <p className="text-xs text-gray-700">{summary.creator_name}</p>
                  </div>
                )}
                {date && (
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Date</p>
                    <p className="text-xs text-gray-700">{date}</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {summary.platform && <PlatformBadge platform={summary.platform} />}
                  <ModeBadge mode={summary.mode} />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-2 mt-auto">
                <button
                  onClick={(e) => { e.stopPropagation(); copy() }}
                  className="w-full text-sm font-medium bg-black text-white px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  {copied ? '✓ Copied' : 'Copy summary'}
                </button>
                {summary.source_url && (
                  <a
                    href={summary.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="w-full text-sm font-medium border border-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:border-gray-400 transition-colors flex items-center justify-center gap-1"
                  >
                    Open original ↗
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
