'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const COUNTRY_CODES = [
  { code: '+1', flag: '🇺🇸', label: 'US' },
  { code: '+1', flag: '🇨🇦', label: 'CA' },
  { code: '+44', flag: '🇬🇧', label: 'UK' },
  { code: '+61', flag: '🇦🇺', label: 'AU' },
  { code: '+91', flag: '🇮🇳', label: 'IN' },
  { code: '+65', flag: '🇸🇬', label: 'SG' },
  { code: '+971', flag: '🇦🇪', label: 'AE' },
  { code: '+27', flag: '🇿🇦', label: 'ZA' },
  { code: '+234', flag: '🇳🇬', label: 'NG' },
]

function OTPInput({ onComplete }: { onComplete: (code: string) => void }) {
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const refs = useRef<(HTMLInputElement | null)[]>([])

  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = digit
    setDigits(next)

    if (digit && index < 5) {
      refs.current[index + 1]?.focus()
    }

    const full = next.join('')
    if (full.length === 6) onComplete(full)
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setDigits(pasted.split(''))
      refs.current[5]?.focus()
      onComplete(pasted)
    }
  }

  return (
    <div className="flex gap-2 justify-center">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className="w-11 h-12 text-center text-lg font-bold bg-card border border-border rounded-lg text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
        />
      ))}
    </div>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [name, setName] = useState('')
  const [countryCode, setCountryCode] = useState('+1')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [otp, setOtp] = useState('')

  const fullPhone = `${countryCode}${phone.replace(/\D/g, '')}`

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim()) { setError('Please enter your name'); return }
    if (name.trim().length > 100) { setError('Name must be 100 characters or less'); return }
    const e164Regex = /^\+[1-9]\d{6,14}$/
    if (!e164Regex.test(fullPhone)) {
      setError('Enter a valid phone number with country code (e.g. +12125551234)')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone: fullPhone }),
      })
      const data = await res.json()
      if (data.waitlisted) {
        router.push(`/waitlist?position=${data.position}`)
        return
      }
      if (!res.ok) throw new Error(data.error || 'Failed to send code')
      setStep(2)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOTP(code: string) {
    setOtp(code)
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone, code, name: name.trim() }),
      })
      const data = await res.json()
      if (data.waitlisted) {
        router.push(`/waitlist?position=${data.position}`)
        return
      }
      if (!res.ok) throw new Error(data.error || 'Invalid code')
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Background glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-accent/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Logo */}
      <Link href="/" className="text-accent font-bold text-xl mb-10">
        ReelRead
      </Link>

      <div className="relative w-full max-w-sm bg-card border border-border rounded-2xl p-8">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          <div className={`flex-1 h-1 rounded-full transition-colors ${step >= 1 ? 'bg-accent' : 'bg-border'}`} />
          <div className={`flex-1 h-1 rounded-full transition-colors ${step >= 2 ? 'bg-accent' : 'bg-border'}`} />
        </div>

        {step === 1 ? (
          <>
            <h1 className="text-xl font-bold mb-1">Create your account</h1>
            <p className="text-zinc-500 text-sm mb-6">We'll send a code to verify your number.</p>

            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Your name
                </label>
                <input
                  type="text"
                  placeholder="Alex Johnson"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Phone number
                </label>
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="bg-background border border-border rounded-lg px-2 py-2.5 text-white focus:outline-none focus:border-accent text-sm w-20 shrink-0"
                  >
                    {COUNTRY_CODES.map((c, i) => (
                      <option key={i} value={c.code}>
                        {c.flag} {c.code}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    placeholder="555 000 1234"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="flex-1 bg-background border border-border rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors text-sm"
                  />
                </div>
              </div>

              {error && (
                <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-accent text-black font-semibold py-2.5 rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Verification Code'}
              </button>
            </form>

            <p className="text-zinc-600 text-xs text-center mt-6">
              Already registered?{' '}
              <button onClick={() => {}} className="text-zinc-400 hover:text-white transition-colors">
                Sign in
              </button>
            </p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold mb-1">Enter your code</h1>
            <p className="text-zinc-500 text-sm mb-6">
              Sent to <span className="text-white">{fullPhone}</span>
            </p>

            <OTPInput onComplete={handleVerifyOTP} />

            {loading && (
              <p className="text-center text-accent text-sm mt-4 animate-pulse">
                Verifying...
              </p>
            )}

            {error && (
              <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2 mt-4 text-center">
                {error}
              </p>
            )}

            <div className="mt-6 text-center space-y-2">
              <button
                onClick={() => { setStep(1); setError('') }}
                className="text-zinc-500 text-sm hover:text-white transition-colors"
              >
                ← Change number
              </button>
              <br />
              <button
                onClick={() => handleSendOTP({ preventDefault: () => {} } as any)}
                className="text-accent text-sm hover:text-accent/80 transition-colors"
                disabled={loading}
              >
                Resend code
              </button>
            </div>
          </>
        )}
      </div>

      <p className="text-zinc-700 text-xs mt-6 text-center max-w-xs">
        By continuing you agree to our{' '}
        <Link href="/terms" className="text-zinc-500 hover:text-white">Terms</Link>
        {' '}and{' '}
        <Link href="/privacy" className="text-zinc-500 hover:text-white">Privacy Policy</Link>
      </p>
    </main>
  )
}
