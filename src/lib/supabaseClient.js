import { createClient } from '@supabase/supabase-js'

const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || '').trim()
const supabasePublishableKey = String(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim()

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey)

let supabaseClient = null

export function getSupabaseClient() {
  if (!isSupabaseConfigured) return null
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  }
  return supabaseClient
}

export function getAuthRedirectUrl() {
  return new URL(import.meta.env.BASE_URL || '/', window.location.origin).href
}
