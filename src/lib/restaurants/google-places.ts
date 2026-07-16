import 'server-only'

import { z } from 'zod'
import { getServerEnv } from '@/lib/env/server'
import {
  RestaurantProviderError,
  type ProviderRestaurant,
  type RestaurantProvider,
} from './provider'

const GOOGLE_PLACES_BASE_URL = 'https://places.googleapis.com/v1/places'
const FIELD_MASK = [
  'id',
  'displayName',
  'formattedAddress',
  'addressComponents',
  'location',
  'types',
  'priceLevel',
  'rating',
  'userRatingCount',
  'photos',
].join(',')

const placeIdSchema = z.string().trim().min(3).max(255).regex(/^[A-Za-z0-9_-]+$/)
const googlePlaceSchema = z.object({
  id: z.string(),
  displayName: z.object({ text: z.string().min(1).max(500) }),
  formattedAddress: z.string().optional(),
  addressComponents: z.array(z.object({
    longText: z.string().optional(),
    shortText: z.string().optional(),
    types: z.array(z.string()),
  })).optional(),
  location: z.object({ latitude: z.number(), longitude: z.number() }).optional(),
  types: z.array(z.string()).optional(),
  priceLevel: z.enum([
    'PRICE_LEVEL_FREE',
    'PRICE_LEVEL_INEXPENSIVE',
    'PRICE_LEVEL_MODERATE',
    'PRICE_LEVEL_EXPENSIVE',
    'PRICE_LEVEL_VERY_EXPENSIVE',
  ]).optional(),
  rating: z.number().min(0).max(5).optional(),
  userRatingCount: z.number().int().nonnegative().optional(),
  photos: z.array(z.object({
    name: z.string(),
    authorAttributions: z.array(z.object({ displayName: z.string().optional() })).optional(),
  })).optional(),
})

const priceLevels: Record<string, number> = {
  PRICE_LEVEL_FREE: 1,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
}

function addressValue(
  components: z.infer<typeof googlePlaceSchema>['addressComponents'],
  type: string,
  short = false,
): string | null {
  const component = components?.find((item) => item.types.includes(type))
  return (short ? component?.shortText : component?.longText) ?? null
}

export class GooglePlacesProvider implements RestaurantProvider {
  async getPlace(rawPlaceId: string): Promise<ProviderRestaurant> {
    const placeId = placeIdSchema.safeParse(rawPlaceId)
    if (!placeId.success) throw new RestaurantProviderError('Invalid provider place ID.')

    const apiKey = getServerEnv().googlePlacesApiKey
    if (!apiKey) throw new RestaurantProviderError('Google Places is not configured.')

    const response = await fetch(`${GOOGLE_PLACES_BASE_URL}/${encodeURIComponent(placeId.data)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': FIELD_MASK,
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    })

    if (!response.ok) {
      throw new RestaurantProviderError('The restaurant provider request failed.', response.status)
    }

    const payload: unknown = await response.json()
    const parsed = googlePlaceSchema.safeParse(payload)
    if (!parsed.success) throw new RestaurantProviderError('The restaurant provider returned malformed data.')

    const place = parsed.data
    return {
      provider: 'google_places',
      providerPlaceId: place.id,
      name: place.displayName.text,
      formattedAddress: place.formattedAddress ?? null,
      city: addressValue(place.addressComponents, 'locality'),
      region: addressValue(place.addressComponents, 'administrative_area_level_1', true),
      countryCode: addressValue(place.addressComponents, 'country', true),
      neighbourhood: addressValue(place.addressComponents, 'neighborhood')
        ?? addressValue(place.addressComponents, 'sublocality'),
      latitude: place.location?.latitude ?? null,
      longitude: place.location?.longitude ?? null,
      priceLevel: place.priceLevel ? priceLevels[place.priceLevel] ?? null : null,
      providerRating: place.rating ?? null,
      providerReviewCount: place.userRatingCount ?? null,
      types: place.types ?? [],
      photos: (place.photos ?? []).slice(0, 10).map((photo) => ({
        reference: photo.name,
        attribution: photo.authorAttributions?.map((item) => item.displayName).filter(Boolean).join(', ') || null,
      })),
      refreshedAt: new Date().toISOString(),
    }
  }
}

export function getRestaurantProvider(): RestaurantProvider | null {
  return getServerEnv().googlePlacesApiKey ? new GooglePlacesProvider() : null
}
