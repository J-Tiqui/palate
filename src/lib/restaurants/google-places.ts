import 'server-only'

import { z } from 'zod'
import { getServerEnv } from '@/lib/env/server'
import { googlePlaceSchema, googlePlacesResponseSchema, mapGooglePlace } from './google-places-data'
import {
  RestaurantProviderError,
  type ProviderLocation,
  type ProviderRestaurant,
  type ProviderSearchOptions,
  type RestaurantProvider,
} from './provider'

const GOOGLE_PLACES_API_ROOT = 'https://places.googleapis.com/v1'
const GOOGLE_PLACES_BASE_URL = `${GOOGLE_PLACES_API_ROOT}/places`
const TORONTO_CENTER: ProviderLocation = { latitude: 43.6532, longitude: -79.3832 }
const SEARCH_FIELDS = [
  'id',
  'displayName',
  'formattedAddress',
  'addressComponents',
  'location',
  'types',
  'primaryType',
  'primaryTypeDisplayName',
  'priceLevel',
  'rating',
  'userRatingCount',
  'businessStatus',
  'googleMapsUri',
  'photos',
]
const DETAIL_FIELDS = [
  ...SEARCH_FIELDS,
  'websiteUri',
  'nationalPhoneNumber',
  'regularOpeningHours',
]
const SEARCH_FIELD_MASK = SEARCH_FIELDS.map((field) => `places.${field}`).join(',')
const DETAIL_FIELD_MASK = DETAIL_FIELDS.join(',')

export const providerPlaceIdPattern = /^[A-Za-z0-9_-]+$/
export const providerPhotoReferencePattern = /^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/

function validatePlaceId(rawPlaceId: string): string {
  const placeId = rawPlaceId.trim()
  if (placeId.length < 3 || placeId.length > 255 || !providerPlaceIdPattern.test(placeId)) {
    throw new RestaurantProviderError('Invalid provider place ID.', 400)
  }
  return placeId
}

function validatePhotoReference(rawReference: string): string {
  const reference = rawReference.trim()
  if (reference.length > 1200 || !providerPhotoReferencePattern.test(reference)) {
    throw new RestaurantProviderError('Invalid provider photo reference.', 400)
  }
  return reference
}

function validateLocation(location: ProviderLocation): ProviderLocation {
  if (
    !Number.isFinite(location.latitude)
    || !Number.isFinite(location.longitude)
    || location.latitude < -90
    || location.latitude > 90
    || location.longitude < -180
    || location.longitude > 180
  ) {
    throw new RestaurantProviderError('Invalid search location.', 400)
  }
  return location
}

function getApiKey(): string {
  const apiKey = getServerEnv().googlePlacesApiKey
  if (!apiKey) throw new RestaurantProviderError('Google Places is not configured.', 503)
  return apiKey
}

async function googleFetch(url: string, init: RequestInit, fieldMask?: string): Promise<Response> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': getApiKey(),
      ...(fieldMask ? { 'X-Goog-FieldMask': fieldMask } : {}),
      ...init.headers,
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  })

  if (!response.ok) {
    throw new RestaurantProviderError('The restaurant provider request failed.', response.status)
  }
  return response
}

function normalizeSearchOptions(options: ProviderSearchOptions = {}) {
  const maxResults = Math.min(Math.max(options.maxResults ?? 12, 1), 20)
  const radiusMeters = Math.min(Math.max(options.radiusMeters ?? 25_000, 100), 50_000)
  return {
    location: validateLocation(options.location ?? TORONTO_CENTER),
    maxResults,
    radiusMeters,
  }
}

export class GooglePlacesProvider implements RestaurantProvider {
  async getPlace(rawPlaceId: string): Promise<ProviderRestaurant> {
    const placeId = validatePlaceId(rawPlaceId)
    const response = await googleFetch(
      `${GOOGLE_PLACES_BASE_URL}/${encodeURIComponent(placeId)}`,
      { method: 'GET' },
      DETAIL_FIELD_MASK,
    )
    const payload: unknown = await response.json()
    const parsed = googlePlaceSchema.safeParse(payload)
    if (!parsed.success) throw new RestaurantProviderError('The restaurant provider returned malformed data.', 502)
    return mapGooglePlace(parsed.data)
  }

  async searchText(rawQuery: string, options: ProviderSearchOptions = {}): Promise<ProviderRestaurant[]> {
    const query = rawQuery.trim()
    if (query.length < 2 || query.length > 100) {
      throw new RestaurantProviderError('Search for at least two characters.', 400)
    }
    const normalized = normalizeSearchOptions(options)
    const response = await googleFetch(
      `${GOOGLE_PLACES_BASE_URL}:searchText`,
      {
        method: 'POST',
        body: JSON.stringify({
          textQuery: query,
          includedType: 'restaurant',
          strictTypeFiltering: true,
          languageCode: 'en',
          regionCode: 'CA',
          locationBias: {
            circle: {
              center: normalized.location,
              radius: normalized.radiusMeters,
            },
          },
        }),
      },
      SEARCH_FIELD_MASK,
    )
    return this.parseSearchResponse(await response.json(), normalized.maxResults)
  }

  async searchNearby(
    rawLocation: ProviderLocation,
    options: Omit<ProviderSearchOptions, 'location'> = {},
  ): Promise<ProviderRestaurant[]> {
    const normalized = normalizeSearchOptions({ ...options, location: rawLocation })
    const response = await googleFetch(
      `${GOOGLE_PLACES_BASE_URL}:searchNearby`,
      {
        method: 'POST',
        body: JSON.stringify({
          includedTypes: ['restaurant'],
          maxResultCount: normalized.maxResults,
          rankPreference: 'POPULARITY',
          languageCode: 'en',
          regionCode: 'CA',
          locationRestriction: {
            circle: {
              center: normalized.location,
              radius: normalized.radiusMeters,
            },
          },
        }),
      },
      SEARCH_FIELD_MASK,
    )
    return this.parseSearchResponse(await response.json(), normalized.maxResults)
  }

  async getPhoto(rawPhotoReference: string, rawMaxWidth: number): Promise<string> {
    const photoReference = validatePhotoReference(rawPhotoReference)
    const maxWidth = Math.min(Math.max(Math.round(rawMaxWidth), 1), 1600)
    const metadataResponse = await googleFetch(
      `${GOOGLE_PLACES_API_ROOT}/${photoReference}/media?maxWidthPx=${maxWidth}&skipHttpRedirect=true`,
      { method: 'GET' },
    )
    const metadata = z.object({ photoUri: z.string().url() }).safeParse(await metadataResponse.json())
    if (!metadata.success) throw new RestaurantProviderError('The photo provider returned malformed data.', 502)

    const photoUrl = new URL(metadata.data.photoUri)
    if (photoUrl.protocol !== 'https:' || !photoUrl.hostname.endsWith('.googleusercontent.com')) {
      throw new RestaurantProviderError('The photo provider returned an invalid location.', 502)
    }
    return photoUrl.toString()
  }

  private parseSearchResponse(payload: unknown, maxResults: number): ProviderRestaurant[] {
    const parsed = googlePlacesResponseSchema.safeParse(payload)
    if (!parsed.success) throw new RestaurantProviderError('The restaurant provider returned malformed data.', 502)
    return parsed.data.places.slice(0, maxResults).map((place) => mapGooglePlace(place))
  }
}

export function getRestaurantProvider(): RestaurantProvider | null {
  return getServerEnv().googlePlacesApiKey ? new GooglePlacesProvider() : null
}
