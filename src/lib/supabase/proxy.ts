import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabasePublicEnv, hasSupabaseEnv } from '@/lib/env/public'
import { getSafeRedirectPath } from '@/lib/security/redirects'
import type { Database } from '@/types/database'

const protectedPrefixes = [
  '/activity',
  '/blend',
  '/goals',
  '/lists',
  '/onboarding',
  '/profile/edit',
  '/recap',
  '/saved',
  '/settings',
]

function isProtectedPath(pathname: string): boolean {
  return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
    || /^\/restaurants\/[^/]+\/review(?:\/|$)/.test(pathname)
}

function copyCookies(source: NextResponse, destination: NextResponse): void {
  source.cookies.getAll().forEach((cookie) => destination.cookies.set(cookie))
}

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  if (!hasSupabaseEnv()) return NextResponse.next({ request })

  const env = getSupabasePublicEnv()
  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(env.url, env.publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  const { data } = await supabase.auth.getClaims()
  const protectedPath = isProtectedPath(request.nextUrl.pathname)

  if (protectedPath && !data?.claims?.sub) {
    const destination = request.nextUrl.clone()
    destination.pathname = '/login'
    destination.search = ''
    destination.searchParams.set(
      'next',
      getSafeRedirectPath(`${request.nextUrl.pathname}${request.nextUrl.search}`, '/discover'),
    )
    const redirectResponse = NextResponse.redirect(destination)
    copyCookies(response, redirectResponse)
    return redirectResponse
  }

  if (protectedPath) {
    response.headers.set('Cache-Control', 'private, no-store, max-age=0')
  }

  return response
}
