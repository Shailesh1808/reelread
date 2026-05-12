import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { createServerClient } from '@/lib/supabase'
import { makeSessionCookie } from '@/lib/auth'
import twilio from 'twilio'
import { v4 as uuidv4 } from 'uuid'

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

const BETA_LIMIT = parseInt(process.env.BETA_LIMIT ?? '20', 10)

export async function POST(request: NextRequest) {
  try {
    const { phone, code, name } = await request.json()

    if (!phone?.trim() || !code?.trim()) {
      return NextResponse.json({ error: 'Phone and code are required' }, { status: 400 })
    }

    const verification = await twilioClient.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
      .verificationChecks.create({ to: phone, code })

    if (verification.status !== 'approved') {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 })
    }

    const whatsappNumber = `whatsapp:${phone}`
    const db = createServerClient()

    let { data: user } = await db
      .from('users')
      .select('*')
      .eq('whatsapp_number', whatsappNumber)
      .single()

    if (!user) {
      // Final beta capacity check (guards against race conditions)
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

      // Reserve beta slot and create user
      await db.from('beta_testers').upsert(
        { whatsapp_number: whatsappNumber, is_active: true },
        { onConflict: 'whatsapp_number' }
      )

      const { data: newUser, error: insertError } = await db
        .from('users')
        .insert({
          whatsapp_number: whatsappNumber,
          name: name?.trim() || null,
        })
        .select('*')
        .single()

      if (insertError) throw insertError
      user = newUser
    }

    const sessionToken = uuidv4()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    await db.from('sessions').insert({
      whatsapp_number: whatsappNumber,
      session_token: sessionToken,
      expires_at: expiresAt.toISOString(),
    })

    const response = NextResponse.json({ success: true, user })
    response.cookies.set(makeSessionCookie(sessionToken))
    return response
  } catch (error) {
    console.error('verify-otp error:', error)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
