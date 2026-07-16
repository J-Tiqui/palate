import { NextResponse } from 'next/server'
import { getSiteUrl } from '@/lib/env/site-url'
import { getSafeRedirectPath } from '@/lib/security/redirects'
import { createClient } from '@/lib/supabase/server'

function authErrorUrl(reason: string): URL {
  const url = new URL('/auth/error', getSiteUrl())
  url.searchParams.set('reason', reason)
  return url
}

export async function GET(request: Request): Promise<NextResponse> {
  const requestUrl = new URL(request.url)
  if (requestUrl.searchParams.get('error')) {
    return NextResponse.redirect(authErrorUrl('oauth-callback'))
  }

  const code = requestUrl.searchParams.get('code')
  if (!code || code.length > 2048) {
    return NextResponse.redirect(authErrorUrl('missing-code'))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) return NextResponse.redirect(authErrorUrl('code-exchange'))

  const next = getSafeRedirectPath(requestUrl.searchParams.get('next'))
  if (next === '/reset-password') {
    return NextResponse.redirect(new URL(next, getSiteUrl()))
  }

  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return NextResponse.redirect(authErrorUrl('session'))

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', userData.user.id)
    .maybeSingle()

  const destination = profile?.onboarding_completed ? next : '/onboarding'
  return NextResponse.redirect(new URL(destination, getSiteUrl()))
}
