import { z } from 'zod'

const supabasePublicSchema = z.object({
  url: z.string().url().refine((value) => value.startsWith('https://') || value.startsWith('http://127.0.0.1') || value.startsWith('http://localhost'), {
    message: 'Supabase URL must use HTTPS outside local development.',
  }),
  publishableKey: z.string().min(20),
})

export type SupabasePublicEnv = z.infer<typeof supabasePublicSchema>

export function hasSupabaseEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL
      && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  )
}

export function getSupabasePublicEnv(): SupabasePublicEnv {
  const result = supabasePublicSchema.safeParse({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  })

  if (!result.success) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.',
    )
  }

  return result.data
}

export const publicFeatureFlags = {
  googleAuth: process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === 'true',
  appleAuth: process.env.NEXT_PUBLIC_APPLE_AUTH_ENABLED === 'true',
  turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
} as const
