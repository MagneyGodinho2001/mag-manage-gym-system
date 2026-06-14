import { createClient } from '@supabase/supabase-js'

const fallbackSupabaseUrl = 'https://ehgmggcdjyznrnivivep.supabase.co'
const fallbackSupabaseAnonKey = 'sb_publishable_4JpyeubV3NaGec19E2Wo2g_SxF62YKP'

function isValidUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

const envSupabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || '').trim()
const envSupabaseAnonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

const supabaseUrl = isValidUrl(envSupabaseUrl)
  ? envSupabaseUrl
  : fallbackSupabaseUrl

const supabaseAnonKey =
  envSupabaseAnonKey && envSupabaseAnonKey !== 'VITE_SUPABASE_ANON_KEY'
    ? envSupabaseAnonKey
    : fallbackSupabaseAnonKey

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
