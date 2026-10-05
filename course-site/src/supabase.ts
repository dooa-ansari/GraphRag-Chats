import type { SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const loginEnabled = Boolean(url && anonKey)

let client: Promise<SupabaseClient> | null = null

/**
 * Browser-only Supabase client, loaded on first use so readers who never log
 * in do not download it up front. Resolves to null when login is not set up.
 */
export async function getSupabase(): Promise<SupabaseClient | null> {
  if (!loginEnabled || typeof window === 'undefined') return null
  client ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(url!, anonKey!, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    }),
  )
  return client
}
