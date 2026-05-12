import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServerClient()
  const { data } = await db
    .from('feedback')
    .select('*')
    .eq('whatsapp_number', session.whatsapp_number)
    .single()

  return NextResponse.json({ feedback: data ?? null })
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { rating, liked_most, want_to_see, bugs } = body

    if (rating !== undefined && (typeof rating !== 'number' || rating < 1 || rating > 5)) {
      return NextResponse.json({ error: 'Rating must be 1–5' }, { status: 400 })
    }

    const db = createServerClient()
    const { error } = await db.from('feedback').upsert(
      {
        whatsapp_number: session.whatsapp_number,
        rating: rating ?? null,
        liked_most: liked_most?.trim() || null,
        want_to_see: want_to_see?.trim() || null,
        bugs: bugs?.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'whatsapp_number' }
    )

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('feedback route error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
