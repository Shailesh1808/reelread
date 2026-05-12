export interface User {
  whatsapp_number: string
  name: string | null
  avatar_url: string | null
  summary_mode: string | null
  onboarding_complete: boolean | null
  terms_accepted: boolean | null
  violation_count: number | null
  blocked: boolean | null
  pending_action: string | null
  created_at: string | null
  registered_at: string | null
}

export interface Summary {
  id: string
  whatsapp_number: string
  platform: string | null
  content_type: string | null
  source_url: string | null
  creator_name: string | null
  summary_text: string | null
  mode: string | null
  heading: string | null
  saved: boolean | null
  created_at: string | null
}

export interface Session {
  id: string
  whatsapp_number: string
  session_token: string
  expires_at: string
  created_at: string
}
