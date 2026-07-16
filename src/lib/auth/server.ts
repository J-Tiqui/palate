import 'server-only'

import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { hasSupabaseEnv } from '@/lib/env/public'
import { getSafeRedirectPath } from '@/lib/security/redirects'
import { createClient } from '@/lib/supabase/server'

export async function getOptionalUser(): Promise<User | null> {
  if (!hasSupabaseEnv()) return null
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  if (error) return null
  return data.user
}

export async function requireUser(nextPath = '/discover'): Promise<User> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    const safeNext = getSafeRedirectPath(nextPath)
    redirect(`/login?next=${encodeURIComponent(safeNext)}`)
  }

  return data.user
}
