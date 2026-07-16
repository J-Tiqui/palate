import { createBrowserClient } from '@supabase/ssr'
import { getSupabasePublicEnv } from '@/lib/env/public'
import type { Database } from '@/types/database'

export function createClient() {
  const env = getSupabasePublicEnv()
  return createBrowserClient<Database>(env.url, env.publishableKey)
}
