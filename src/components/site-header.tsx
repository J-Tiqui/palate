import Link from 'next/link'
import { getOptionalUser } from '@/lib/auth/server'
import { logoutAction } from '@/app/(auth)/actions'

export async function SiteHeader() {
  const user = await getOptionalUser()

  return (
    <header className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 md:px-8">
      <Link href="/" className="text-2xl font-semibold tracking-[-0.04em]">Palate.</Link>
      <nav aria-label="Primary" className="flex items-center gap-2 sm:gap-3">
        <Link href="/discover" className="hidden rounded-full px-3 py-2 text-sm font-medium sm:block">Discover</Link>
        {user ? (
          <>
            <Link href="/saved" className="hidden rounded-full px-3 py-2 text-sm font-medium sm:block">Saved</Link>
            <form action={logoutAction}>
              <button className="rounded-full border border-black/10 bg-white/70 px-4 py-2 text-sm font-medium">Sign out</button>
            </form>
          </>
        ) : (
          <Link href="/login" className="rounded-full border border-black/10 bg-white/70 px-4 py-2 text-sm font-medium">Sign in</Link>
        )}
        <Link href="/blend" className="rounded-full bg-[#1f3a31] px-4 py-2 text-sm font-medium text-white">Start a Blend</Link>
      </nav>
    </header>
  )
}
