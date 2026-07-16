import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { getRestaurantProvider, providerPhotoReferencePattern } from '@/lib/restaurants/google-places'
import { verifyGooglePhotoSignature } from '@/lib/restaurants/google-photo'
import { RestaurantProviderError } from '@/lib/restaurants/provider'

const photoQuerySchema = z.object({
  name: z.string().max(1200).regex(providerPhotoReferencePattern),
  width: z.coerce.number().int().min(1).max(1600),
  signature: z.string().min(20).max(200),
})

export async function GET(request: NextRequest) {
  const parsed = photoQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid photo request.' }, { status: 400 })
  const { name, width, signature } = parsed.data
  if (!verifyGooglePhotoSignature(name, width, signature)) {
    return NextResponse.json({ error: 'Invalid photo signature.' }, { status: 403 })
  }

  const provider = getRestaurantProvider()
  if (!provider) return NextResponse.json({ error: 'Restaurant photos are unavailable.' }, { status: 503 })

  try {
    const photoUri = await provider.getPhoto(name, width)
    const response = NextResponse.redirect(new URL(photoUri), 307)
    response.headers.set('Cache-Control', 'private, no-store, max-age=0')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    return response
  } catch (error) {
    console.error('[places] Restaurant photo request failed', {
      status: error instanceof RestaurantProviderError ? error.status : undefined,
      kind: error instanceof Error ? error.name : 'unknown',
      message: error instanceof RestaurantProviderError ? error.message : 'Unexpected photo error',
    })
    const status = error instanceof RestaurantProviderError && error.status && error.status >= 400 && error.status < 600
      ? error.status
      : 502
    return NextResponse.json({ error: 'Restaurant photo unavailable.' }, { status })
  }
}
