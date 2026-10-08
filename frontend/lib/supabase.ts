import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!_supabase) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
      if (!url || !key) {
        // During SSR / static build, env vars may be absent.
        // Return a no-op stub so pages can still render.
        if (typeof window === 'undefined') {
          return () => Promise.resolve({ data: null, error: null })
        }
        throw new Error(
          'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.',
        )
      }
      _supabase = createClient(url, key)
    }
    const value = (_supabase as any)[prop]
    if (typeof value === 'function') {
      return value.bind(_supabase)
    }
    return value
  },
})

