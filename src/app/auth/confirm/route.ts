import { NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { getSiteUrl } from '@/lib/env/site-url'
import { getSafeRedirectPath } from '@/lib/security/redirects'
import { createClient } from '@/lib/supabase/server'

const allowedOtpTypes = new Set<EmailOtpType>([
  'email', 'email_change', 'invite', 'magiclink', 'recovery', 'signup',
])

export async function GET(request: Request): Promise<NextResponse> {
  const requestUrl = new URL(request.url)
  const tokenHash = requestUrl.searchParams.get('token_hash')
  const rawType = requestUrl.searchParams.get('type') as EmailOtpType | null
  const next = getSafeRedirectPath(requestUrl.searchParams.get('next'), '/onboarding')

  if (!tokenHash || tokenHash.length > 1024 || !rawType || !allowedOtpTypes.has(rawType)) {
    return NextResponse.redirect(new URL('/auth/error?reason=invalid-link', getSiteUrl()))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({ type: rawType, token_hash: tokenHash })
  if (error) return NextResponse.redirect(new URL('/auth/error?reason=invalid-link', getSiteUrl()))

  const destination = rawType === 'recovery' ? '/reset-password' : next
  return NextResponse.redirect(new URL(destination, getSiteUrl()))
}
