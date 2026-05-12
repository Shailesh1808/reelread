import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

import { createServerClient } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const db = createServerClient()
    const updates: Record<string, string> = {}

    const formData = await request.formData()

    const name = formData.get('name')
    if (typeof name === 'string' && name.trim()) {
      updates.name = name.trim()
    }

    const summary_mode = formData.get('summary_mode')
    const VALID_MODES = ['snapshot', 'standard', 'deep_dive']
    if (typeof summary_mode === 'string' && VALID_MODES.includes(summary_mode)) {
      updates.summary_mode = summary_mode
    }

    const avatar = formData.get('avatar') as File | null
    if (avatar && avatar.size > 0) {
      const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
      if (!ALLOWED_TYPES.includes(avatar.type)) {
        return NextResponse.json({ error: 'Avatar must be a JPEG, PNG, or WebP image' }, { status: 400 })
      }
      const MAX_BYTES = 5 * 1024 * 1024
      if (avatar.size > MAX_BYTES) {
        return NextResponse.json({ error: 'Avatar must be 5 MB or smaller' }, { status: 400 })
      }

      const bytes = await avatar.arrayBuffer()
      const buffer = Buffer.from(bytes)

      const ext = avatar.type === 'image/png' ? 'png' : avatar.type === 'image/webp' ? 'webp' : 'jpg'
      const filename = `${session.whatsapp_number.replace(/[^a-z0-9]/gi, '_')}.${ext}`

      const { error: uploadError } = await db.storage
        .from('avatars')
        .upload(filename, buffer, { contentType: avatar.type, upsert: true })

      if (uploadError) {
        console.error('avatar upload error:', uploadError)
        return NextResponse.json({ error: uploadError.message }, { status: 500 })
      }

      const { data: urlData } = db.storage.from('avatars').getPublicUrl(filename)
      updates.avatar_url = urlData.publicUrl
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    const { data: user, error } = await db
      .from('users')
      .update(updates)
      .eq('whatsapp_number', session.whatsapp_number)
      .select()
      .single()

    if (error) {
      console.error('profile update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ user })
  } catch (err) {
    console.error('profile route error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
