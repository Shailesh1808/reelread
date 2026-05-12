import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { createServerClient } from '@/lib/supabase'
import { getSession, clearSessionCookie } from '@/lib/auth'

export async function POST(_request: NextRequest) {
  try {
    const session = await getSession()
    if (session) {
      const db = createServerClient()
      await db.from('sessions').delete().eq('session_token', session.session_token)
    }

    const response = NextResponse.json({ success: true })
    response.cookies.set(clearSessionCookie())
    return response
  } catch (error) {
    console.error('signout error:', error)
    return NextResponse.json({ error: 'Failed to sign out' }, { status: 500 })
  }
}
