import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSupabasePublicEnv } from '@/lib/env/public'
import type { Database } from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies()
  const env = getSupabasePublicEnv()
  return createServerClient<Database>(
    env.url,
    env.publishableKey,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // Server Components cannot write cookies. The root proxy refreshes them.
          }
        },
      },
    },
  )
}
