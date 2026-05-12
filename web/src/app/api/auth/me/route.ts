import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { createServerClient } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function GET(_request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = createServerClient()

    const [userResult, summariesResult] = await Promise.all([
      db.from('users').select('*').eq('whatsapp_number', session.whatsapp_number).single(),
      db
        .from('summaries')
        .select('*')
        .eq('whatsapp_number', session.whatsapp_number)
        .order('created_at', { ascending: false })
        .limit(100),
    ])

    return NextResponse.json({
      user: userResult.data,
      summaries: summariesResult.data ?? [],
    })
  } catch (error) {
    console.error('me error:', error)
    return NextResponse.json({ error: 'Failed to load user data' }, { status: 500 })
  }
}
