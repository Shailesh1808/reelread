'use client'

import { useState, useEffect, useRef } from 'react'
import type { User, Summary } from '@/types'

interface Props {
  user: User
  summaries: Summary[]
  onSignOut: () => void
  onUserUpdate: (user: User) => void
}

function DefaultAvatar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className ?? 'w-7 h-7 text-gray-400'}>
      <path d="M12 12c2.67 0 8 1.34 8 4v2H4v-2c0-2.66 5.33-4 8-4zm0-2a4 4 0 100-8 4 4 0 000 8z" />
    </svg>
  )
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-white">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
      active ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'
    }`}>
      {active ? 'Activated' : 'Not activated'}
    </span>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <div className="text-sm text-gray-900 font-medium text-right">{children}</div>
    </div>
  )
}

function StarRating({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          className="text-2xl transition-transform hover:scale-110 focus:outline-none"
        >
          {n <= (hovered || value) ? '⭐' : '☆'}
        </button>
      ))}
    </div>
  )
}

export default function Profile({ user, summaries, onSignOut, onUserUpdate }: Props) {
  const [editMode, setEditMode] = useState(false)
  const [editName, setEditName] = useState(user.name ?? '')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [modeSaving, setModeSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [feedbackRating, setFeedbackRating] = useState(0)
  const [feedbackLiked, setFeedbackLiked] = useState('')
  const [feedbackWant, setFeedbackWant] = useState('')
  const [feedbackBugs, setFeedbackBugs] = useState('')
  const [feedbackSaving, setFeedbackSaving] = useState(false)
  const [feedbackSaved, setFeedbackSaved] = useState(false)
  const [feedbackExisting, setFeedbackExisting] = useState(false)

  useEffect(() => {
    setEditName(user.name ?? '')
  }, [user.name])

  useEffect(() => {
    fetch('/api/feedback')
      .then((r) => r.json())
      .then(({ feedback }) => {
        if (feedback) {
          setFeedbackExisting(true)
          setFeedbackRating(feedback.rating ?? 0)
          setFeedbackLiked(feedback.liked_most ?? '')
          setFeedbackWant(feedback.want_to_see ?? '')
          setFeedbackBugs(feedback.bugs ?? '')
        }
      })
      .catch(() => {})
  }, [])

  const joined = user.registered_at || user.created_at
  const joinDate = joined
    ? new Date(joined).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : ''

  const phone = user.whatsapp_number?.replace('whatsapp:', '') ?? ''

  const modeLabel: Record<string, string> = {
    snapshot: 'Snapshot',
    standard: 'Standard',
    deep_dive: 'Deep Dive',
  }

  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '14155238886'
  const waKeyword = process.env.NEXT_PUBLIC_WHATSAPP_KEYWORD || ''
  const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(waKeyword)}`
  const botActivated = user.onboarding_complete === true

  const displayAvatar = avatarPreview || user.avatar_url

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    if (!editName.trim()) return
    setSaving(true)
    setError(null)

    const formData = new FormData()
    formData.append('name', editName.trim())
    if (avatarFile) formData.append('avatar', avatarFile)

    try {
      const res = await fetch('/api/auth/profile', { method: 'PATCH', body: formData })
      if (res.ok) {
        const { user: updated } = await res.json()
        onUserUpdate(updated)
        setEditMode(false)
        setAvatarFile(null)
        if (avatarPreview) URL.revokeObjectURL(avatarPreview)
        setAvatarPreview(null)
      } else {
        const data = await res.json()
        setError(data.error ?? 'Failed to save')
      }
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  const handleModeChange = async (mode: string) => {
    if (mode === user.summary_mode || modeSaving) return
    setModeSaving(true)
    try {
      const formData = new FormData()
      formData.append('summary_mode', mode)
      const res = await fetch('/api/auth/profile', { method: 'PATCH', body: formData })
      if (res.ok) {
        const { user: updated } = await res.json()
        onUserUpdate(updated)
      }
    } finally {
      setModeSaving(false)
    }
  }

  const handleCancel = () => {
    setEditMode(false)
    setEditName(user.name ?? '')
    setAvatarFile(null)
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    setAvatarPreview(null)
    setError(null)
  }

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFeedbackSaving(true)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: feedbackRating || null,
          liked_most: feedbackLiked,
          want_to_see: feedbackWant,
          bugs: feedbackBugs,
        }),
      })
      if (res.ok) {
        setFeedbackSaved(true)
        setFeedbackExisting(true)
        setTimeout(() => setFeedbackSaved(false), 3000)
      }
    } finally {
      setFeedbackSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-lg">
      <h2 className="text-xl font-bold text-gray-900">Profile</h2>

      {/* Avatar + name card */}
      <div className="flex items-center gap-4 bg-white border border-gray-100 rounded-xl p-5">
        {/* Avatar */}
        <div
          className={`w-14 h-14 rounded-full bg-black flex items-center justify-center text-white text-xl font-bold shrink-0 overflow-hidden relative${editMode ? ' cursor-pointer' : ''}`}
          onClick={editMode ? () => fileInputRef.current?.click() : undefined}
        >
          {displayAvatar ? (
            <img src={displayAvatar} alt="" className="w-full h-full object-cover" />
          ) : (
            user.name?.charAt(0)?.toUpperCase() || <DefaultAvatar className="w-7 h-7 text-gray-400" />
          )}
          {editMode && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
              <CameraIcon />
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarChange}
        />

        {/* Name + phone */}
        <div className="flex-1 min-w-0">
          {editMode ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel() }}
              className="font-bold text-gray-900 text-lg leading-tight w-full border-b-2 border-black focus:outline-none bg-transparent pb-0.5"
              autoFocus
              maxLength={60}
            />
          ) : (
            <p className="font-bold text-gray-900 text-lg leading-tight">{user.name || ''}</p>
          )}
          <p className="text-gray-500 text-sm mt-1">{phone}</p>
        </div>

        {/* Edit / Save / Cancel */}
        {!editMode ? (
          <button
            onClick={() => setEditMode(true)}
            className="shrink-0 text-xs font-medium text-gray-400 hover:text-gray-800 border border-gray-200 hover:border-gray-400 rounded-lg px-3 py-1.5 transition-colors"
          >
            Edit
          </button>
        ) : (
          <div className="shrink-0 flex flex-col gap-1.5">
            <button
              onClick={handleSave}
              disabled={saving || !editName.trim()}
              className="text-xs font-medium bg-black text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-40"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              className="text-xs text-gray-400 hover:text-gray-700 transition-colors text-center"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {/* Summary mode selector */}
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Summary Mode</h3>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'snapshot', label: 'Snapshot', desc: 'Bullet points only. Quick read.' },
            { id: 'standard', label: 'Standard', desc: 'Key insights with context.' },
            { id: 'deep_dive', label: 'Deep Dive', desc: 'Full analysis and takeaways.' },
          ].map((m) => {
            const active = user.summary_mode === m.id
            return (
              <button
                key={m.id}
                onClick={() => handleModeChange(m.id)}
                disabled={modeSaving}
                className={`text-left p-4 rounded-xl border transition-colors ${
                  active
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-900 border-gray-100 hover:border-gray-300'
                } disabled:opacity-60`}
              >
                <p className={`text-sm font-semibold mb-1 ${active ? 'text-white' : 'text-gray-900'}`}>
                  {m.label}
                </p>
                <p className={`text-xs leading-snug ${active ? 'text-gray-300' : 'text-gray-400'}`}>
                  {m.desc}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Detail rows */}
      <div className="bg-white border border-gray-100 rounded-xl px-5">
        <Row label="Name">{user.name || ''}</Row>
        <Row label="Phone">{phone}</Row>
        <Row label="Member since">{joinDate}</Row>
        <Row label="Total summaries">{summaries.length}</Row>
        <Row label="WhatsApp bot">
          <StatusBadge active={botActivated} />
        </Row>
      </div>

      {/* Activation CTA */}
      {!botActivated && (
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-black text-white font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-gray-800 transition-colors"
        >
          Activate WhatsApp Bot
        </a>
      )}

      {/* Feedback form */}
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
          {feedbackExisting ? 'Update Your Feedback' : 'Share Feedback'}
        </h3>
        <form onSubmit={handleFeedbackSubmit} className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Overall rating</p>
            <StarRating value={feedbackRating} onChange={setFeedbackRating} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">What do you like most?</label>
            <textarea
              value={feedbackLiked}
              onChange={(e) => setFeedbackLiked(e.target.value)}
              rows={2}
              placeholder="The summaries are super clean…"
              className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">What would you like to see?</label>
            <textarea
              value={feedbackWant}
              onChange={(e) => setFeedbackWant(e.target.value)}
              rows={2}
              placeholder="Support for YouTube videos…"
              className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Any bugs or issues?</label>
            <textarea
              value={feedbackBugs}
              onChange={(e) => setFeedbackBugs(e.target.value)}
              rows={2}
              placeholder="Sometimes the summary cuts off…"
              className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 resize-none"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={feedbackSaving}
              className="text-sm font-medium bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-40"
            >
              {feedbackSaving ? 'Saving…' : feedbackExisting ? 'Update' : 'Submit'}
            </button>
            {feedbackSaved && (
              <span className="text-xs text-green-600 font-medium">Saved!</span>
            )}
          </div>
        </form>
      </div>

      {/* Sign out */}
      <div className="pt-2">
        <button
          onClick={onSignOut}
          className="text-sm text-gray-400 hover:text-red-500 transition-colors border border-gray-200 hover:border-red-200 rounded-lg px-4 py-2"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
