import { cookies } from 'next/headers'
import { createServerClient } from './supabase'
import type { User } from '@/types'

const COOKIE_NAME = 'reelread_session'
const SESSION_DAYS = 30

export async function getSession() {
  const cookieStore = cookies()
  const token = (cookieStore as any).get(COOKIE_NAME)?.value
  if (!token) return null

  const db = createServerClient()
  const { data: session } = await db
    .from('sessions')
    .select('*')
    .eq('session_token', token)
    .gt('expires_at', new Date().toISOString())
    .single()

  return session ?? null
}

export async function getAuthUser(): Promise<User | null> {
  const session = await getSession()
  if (!session) return null

  const db = createServerClient()
  const { data: user } = await db
    .from('users')
    .select('*')
    .eq('whatsapp_number', session.whatsapp_number)
    .single()

  return user ?? null
}

export function makeSessionCookie(token: string) {
  const expires = new Date()
  expires.setDate(expires.getDate() + SESSION_DAYS)
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    expires,
    path: '/',
  }
}

export function clearSessionCookie() {
  return {
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 0,
    path: '/',
  }
}
