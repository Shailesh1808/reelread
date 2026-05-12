import { createClient } from '@supabase/supabase-js'

// WARNING: Uses the service role key. Bypasses all RLS.
// Only call from server-side API routes (app/api/**).
// NEVER import this in Client Components ('use client').
// The service role key would be bundled and exposed to the browser.
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export function createBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
