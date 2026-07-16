import 'server-only'

import { z } from 'zod'

const serverEnvSchema = z.object({
  serviceRoleKey: z.string().min(20).optional(),
  googlePlacesApiKey: z.string().min(10).optional(),
  turnstileSecretKey: z.string().min(10).optional(),
})

export type ServerEnv = z.infer<typeof serverEnvSchema>

export function getServerEnv(): ServerEnv {
  const result = serverEnvSchema.safeParse({
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || undefined,
    googlePlacesApiKey: process.env.GOOGLE_PLACES_API_KEY || undefined,
    turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY || undefined,
  })

  if (!result.success) {
    throw new Error('One or more private server environment variables are malformed.')
  }

  return result.data
}
