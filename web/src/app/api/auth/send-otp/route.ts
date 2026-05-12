import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { createServerClient } from '@/lib/supabase'
import twilio from 'twilio'

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

const BETA_LIMIT = parseInt(process.env.BETA_LIMIT ?? '20', 10)

// In-memory rate limiter: max 3 OTP requests per phone per 10 minutes.
// Resets on server restart; sufficient for beta.
const otpAttempts = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(phone: string): boolean {
  const now = Date.now()
  const entry = otpAttempts.get(phone)

  if (!entry || now >= entry.resetAt) {
    otpAttempts.set(phone, { count: 1, resetAt: now + 10 * 60 * 1000 })
    return true
  }
  if (entry.count >= 3) return false
  entry.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    const { name, phone } = await request.json()

    if (!name?.trim() || !phone?.trim()) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 })
    }
    if (name.trim().length > 100) {
      return NextResponse.json({ error: 'Name must be 100 characters or less' }, { status: 400 })
    }

    if (!checkRateLimit(phone)) {
      return NextResponse.json(
        { error: 'Too many attempts. Please wait 10 minutes and try again.' },
        { status: 429 }
      )
    }

    const whatsappNumber = `whatsapp:${phone}`
    const db = createServerClient()

    const { data: existing } = await db
      .from('users')
      .select('whatsapp_number')
      .eq('whatsapp_number', whatsappNumber)
      .single()

    // New user: check beta capacity before spending an OTP
    if (!existing) {
      const { count: betaCount } = await db
        .from('beta_testers')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      if ((betaCount ?? 0) >= BETA_LIMIT) {
        await db
          .from('waitlist')
          .upsert({ phone: whatsappNumber, source: 'web' }, { onConflict: 'phone' })

        const { data: waitlistRows } = await db
          .from('waitlist')
          .select('phone')
          .order('joined_at', { ascending: true })

        const position = (waitlistRows?.findIndex((r) => r.phone === whatsappNumber) ?? 0) + 1
        return NextResponse.json({ waitlisted: true, position })
      }
    }

    await twilioClient.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
      .verifications.create({ to: phone, channel: 'sms' })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('send-otp error:', error)
    return NextResponse.json({ error: 'Failed to send verification code' }, { status: 500 })
  }
}
