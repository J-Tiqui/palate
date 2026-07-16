import { Apple, Globe2 } from 'lucide-react'
import { oauthAction } from '@/app/(auth)/actions'
import { publicFeatureFlags } from '@/lib/env/public'

export function OAuthButtons({ next }: { next?: string }) {
  if (!publicFeatureFlags.googleAuth && !publicFeatureFlags.appleAuth) return null

  return (
    <div className="mt-5">
      <div className="mb-4 flex items-center gap-3 text-xs uppercase tracking-[0.16em] text-black/35">
        <span className="h-px flex-1 bg-black/10" />or<span className="h-px flex-1 bg-black/10" />
      </div>
      <div className="space-y-3">
        {publicFeatureFlags.googleAuth && (
          <form action={oauthAction}>
            <input type="hidden" name="provider" value="google" />
            {next && <input type="hidden" name="next" value={next} />}
            <button className="flex w-full items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-5 py-3 font-semibold">
              <Globe2 size={18} /> Continue with Google
            </button>
          </form>
        )}
        {publicFeatureFlags.appleAuth && (
          <form action={oauthAction}>
            <input type="hidden" name="provider" value="apple" />
            {next && <input type="hidden" name="next" value={next} />}
            <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-black px-5 py-3 font-semibold text-white">
              <Apple size={18} /> Continue with Apple
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
