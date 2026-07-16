import { z } from 'zod'
import type { ProviderRestaurant } from './provider'

const authorAttributionSchema = z.object({
  displayName: z.string().optional(),
  uri: z.string().url().optional(),
  photoUri: z.string().url().optional(),
})

export const googlePlaceSchema = z.object({
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
  primaryType: z.string().optional(),
  primaryTypeDisplayName: z.object({ text: z.string() }).optional(),
  priceLevel: z.enum([
    'PRICE_LEVEL_FREE',
    'PRICE_LEVEL_INEXPENSIVE',
    'PRICE_LEVEL_MODERATE',
    'PRICE_LEVEL_EXPENSIVE',
    'PRICE_LEVEL_VERY_EXPENSIVE',
  ]).optional(),
  rating: z.number().min(0).max(5).optional(),
  userRatingCount: z.number().int().nonnegative().optional(),
  businessStatus: z.enum([
    'OPERATIONAL',
    'CLOSED_TEMPORARILY',
    'CLOSED_PERMANENTLY',
    'FUTURE_OPENING',
  ]).optional(),
  googleMapsUri: z.string().url().optional(),
  websiteUri: z.string().url().optional(),
  nationalPhoneNumber: z.string().max(100).optional(),
  regularOpeningHours: z.object({
    openNow: z.boolean().optional(),
    weekdayDescriptions: z.array(z.string().max(200)).max(7).optional(),
  }).optional(),
  photos: z.array(z.object({
    name: z.string(),
    authorAttributions: z.array(authorAttributionSchema).optional(),
  })).optional(),
})

export const googlePlacesResponseSchema = z.object({
  places: z.array(googlePlaceSchema).optional().default([]),
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

export function mapGooglePlace(
  place: z.infer<typeof googlePlaceSchema>,
  refreshedAt = new Date().toISOString(),
): ProviderRestaurant {
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
    primaryType: place.primaryType ?? null,
    primaryTypeDisplayName: place.primaryTypeDisplayName?.text ?? null,
    businessStatus: place.businessStatus ?? null,
    googleMapsUri: place.googleMapsUri ?? null,
    websiteUri: place.websiteUri ?? null,
    nationalPhoneNumber: place.nationalPhoneNumber ?? null,
    openingHours: place.regularOpeningHours ? {
      openNow: place.regularOpeningHours.openNow ?? null,
      weekdayDescriptions: place.regularOpeningHours.weekdayDescriptions ?? [],
    } : null,
    photos: (place.photos ?? []).slice(0, 10).map((photo) => ({
      reference: photo.name,
      attribution: photo.authorAttributions
        ?.map((item) => item.displayName)
        .filter(Boolean)
        .join(', ') || null,
    })),
    refreshedAt,
  }
}
