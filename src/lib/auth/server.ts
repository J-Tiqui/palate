import 'server-only'

import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { getProfileHref, getProfileInitials, type ViewerProfile } from '@/lib/auth/profile'
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

export async function getOptionalViewerProfile(): Promise<ViewerProfile | null> {
  if (!hasSupabaseEnv()) return null

  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, display_name, onboarding_completed')
    .eq('id', data.user.id)
    .maybeSingle()

  const metadataName = typeof data.user.user_metadata?.full_name === 'string'
    ? data.user.user_metadata.full_name.trim()
    : ''
  const emailName = data.user.email?.split('@')[0] ?? ''
  const displayName = profile?.display_name?.trim() || metadataName || emailName || 'Palate member'
  const username = profile?.username ?? null

  return {
    id: data.user.id,
    username,
    displayName,
    initials: getProfileInitials(displayName, data.user.email),
    profileHref: getProfileHref(username),
    onboardingCompleted: profile?.onboarding_completed ?? false,
  }
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
