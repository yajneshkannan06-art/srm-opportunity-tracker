import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

// Lazy singleton — deferred until first use so it is never called during SSR
// module evaluation (where NEXT_PUBLIC_* vars are not yet substituted).
let _client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!_client) {
    _client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return _client
}

// Convenience re-export so existing `import { supabase }` calls still work.
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabase()
    const targetValue = (client as unknown as Record<string | symbol, unknown>)[prop]
    if (typeof targetValue === 'function') {
      return targetValue.bind(client)
    }
    return targetValue
  },
})
