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

const envSupabaseUrl = import.meta.env.VITE_SUPABASE_URL
const envSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const supabaseUrl = isValidUrl(envSupabaseUrl)
  ? envSupabaseUrl
  : fallbackSupabaseUrl

const supabaseAnonKey = envSupabaseAnonKey || fallbackSupabaseAnonKey

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
