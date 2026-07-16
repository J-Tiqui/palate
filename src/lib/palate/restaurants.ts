import 'server-only'

import { getOptionalUser } from '@/lib/auth/server'
import { hasSupabaseEnv } from '@/lib/env/public'
import { demoRestaurants, images, type PalateRestaurant } from '@/lib/palate/demo-data'
import { getRestaurantProvider } from '@/lib/restaurants/google-places'
import { getGooglePhotoUrl } from '@/lib/restaurants/google-photo'
import { getRestaurantCards } from '@/lib/restaurants/queries'
import type { RestaurantCardData } from '@/lib/restaurants/queries'
import { RestaurantProviderError, type ProviderRestaurant } from '@/lib/restaurants/provider'
import { createClient } from '@/lib/supabase/server'

const TORONTO_CENTER = { latitude: 43.6532, longitude: -79.3832 }

export type DiscoveryData = {
  restaurants: PalateRestaurant[]
  googleRestaurants: PalateRestaurant[]
  savedIds: Set<string>
  isDemo: boolean
  error: string | null
  googleError: string | null
  googleConfigured: boolean
}

function toPalateRestaurant(restaurant: RestaurantCardData): PalateRestaurant {
  return {
    id: restaurant.id,
    slug: restaurant.slug,
    name: restaurant.name,
    cuisine: restaurant.cuisines.join(' · ') || 'Restaurant',
    neighbourhood: restaurant.neighbourhood || restaurant.city,
    address: restaurant.city,
    price: '$'.repeat(restaurant.price_level),
    rating: restaurant.review_count > 0 ? restaurant.average_rating : 0,
    image: restaurant.hero_image_url || images.room,
    image2: restaurant.hero_image_url || images.plate,
    vibe: restaurant.vibes,
    dietary: [],
    description: '',
    reason: restaurant.provider === 'seed'
      ? 'Development sample · not live provider data'
      : restaurant.review_count > 0
        ? `Rated by ${restaurant.review_count} ${restaurant.review_count === 1 ? 'Palate member' : 'Palate members'}`
        : 'New to the Palate community',
    recognition: restaurant.provider === 'seed' ? 'Development sample' : undefined,
    distance: 'Toronto',
    friends: [],
    source: restaurant.provider === 'seed' ? 'seeded' : 'database',
    ratingSource: restaurant.provider === 'seed' ? 'Sample' : 'Palate',
    latitude: restaurant.latitude ?? undefined,
    longitude: restaurant.longitude ?? undefined,
  }
}

function toGoogleRestaurant(restaurant: ProviderRestaurant): PalateRestaurant {
  const primaryPhoto = restaurant.photos[0]
  const secondaryPhoto = restaurant.photos[1]
  const primaryImage = primaryPhoto ? getGooglePhotoUrl(primaryPhoto.reference, 900) : null
  const secondaryImage = secondaryPhoto ? getGooglePhotoUrl(secondaryPhoto.reference, 700) : null
  const cuisine = restaurant.primaryTypeDisplayName
    ?? restaurant.primaryType?.split('_').map((part) => `${part[0]?.toUpperCase() ?? ''}${part.slice(1)}`).join(' ')
    ?? 'Restaurant'
  const ratingReason = restaurant.providerRating
    ? `${restaurant.providerRating.toFixed(1)} on Google${restaurant.providerReviewCount ? ` · ${restaurant.providerReviewCount.toLocaleString()} reviews` : ''}`
    : 'Live listing from Google Places'

  return {
    id: `google:${restaurant.providerPlaceId}`,
    slug: 'google',
    detailsHref: `/restaurants/google?placeId=${encodeURIComponent(restaurant.providerPlaceId)}`,
    name: restaurant.name,
    cuisine,
    neighbourhood: restaurant.neighbourhood || restaurant.city || 'Toronto',
    address: restaurant.formattedAddress || [restaurant.city, restaurant.region].filter(Boolean).join(', '),
    price: '$'.repeat(restaurant.priceLevel ?? 2),
    rating: restaurant.providerRating ?? 0,
    ratingSource: 'Google',
    image: primaryImage ?? images.room,
    image2: secondaryImage ?? primaryImage ?? images.plate,
    photoAttribution: primaryPhoto?.attribution ?? null,
    vibe: restaurant.types
      .filter((type) => !['restaurant', 'food', 'point_of_interest', 'establishment'].includes(type))
      .slice(0, 3)
      .map((type) => type.replaceAll('_', ' ')),
    dietary: [],
    description: 'Live restaurant information supplied by Google Places. Verify important details before visiting.',
    reason: ratingReason,
    recognition: 'Google Places',
    distance: restaurant.city || 'Toronto',
    friends: [],
    source: 'google',
    latitude: restaurant.latitude ?? undefined,
    longitude: restaurant.longitude ?? undefined,
  }
}

async function getLiveGoogleRestaurants(search: string, limit: number): Promise<{
  restaurants: PalateRestaurant[]
  error: string | null
  configured: boolean
}> {
  const provider = getRestaurantProvider()
  if (!provider) return { restaurants: [], error: null, configured: false }

  try {
    const places = search
      ? await provider.searchText(`${search} restaurants in Toronto`, {
        location: TORONTO_CENTER,
        radiusMeters: 35_000,
        maxResults: Math.min(limit, 12),
      })
      : await provider.searchNearby(TORONTO_CENTER, {
        radiusMeters: 25_000,
        maxResults: Math.min(limit, 12),
      })
    return {
      restaurants: places
        .filter((place) => place.businessStatus !== 'CLOSED_PERMANENTLY')
        .map(toGoogleRestaurant),
      error: null,
      configured: true,
    }
  } catch (error) {
    console.error('[places] Live restaurant discovery failed', {
      status: error instanceof RestaurantProviderError ? error.status : undefined,
      kind: error instanceof Error ? error.name : 'unknown',
    })
    return {
      restaurants: [],
      error: 'Live Google restaurant results are temporarily unavailable.',
      configured: true,
    }
  }
}

function mergeRestaurants(
  googleRestaurants: PalateRestaurant[],
  databaseRestaurants: PalateRestaurant[],
  providerIds: Set<string>,
  limit: number,
): PalateRestaurant[] {
  const seenNames = new Set(databaseRestaurants.map((restaurant) => restaurant.name.trim().toLowerCase()))
  const uniqueGoogle = googleRestaurants.filter((restaurant) => {
    const placeId = restaurant.id.slice('google:'.length)
    if (providerIds.has(placeId) || seenNames.has(restaurant.name.trim().toLowerCase())) return false
    seenNames.add(restaurant.name.trim().toLowerCase())
    return true
  })
  return [...uniqueGoogle, ...databaseRestaurants].slice(0, Math.min(Math.max(limit, 1), 50))
}

export async function getDiscoveryData({ search = '', limit = 30 }: { search?: string; limit?: number } = {}): Promise<DiscoveryData> {
  const google = await getLiveGoogleRestaurants(search, limit)

  if (!hasSupabaseEnv()) {
    const filtered = search
      ? demoRestaurants.filter((restaurant) => restaurant.name.toLowerCase().includes(search.toLowerCase()))
      : demoRestaurants
    const databaseRestaurants = filtered.slice(0, limit)
    return {
      restaurants: mergeRestaurants(google.restaurants, databaseRestaurants, new Set(), limit),
      googleRestaurants: google.restaurants,
      savedIds: new Set(),
      isDemo: databaseRestaurants.length > 0,
      error: null,
      googleError: google.error,
      googleConfigured: google.configured,
    }
  }

  const supabase = await createClient()
  const [{ restaurants, error }, user] = await Promise.all([
    getRestaurantCards(supabase, { limit, search }),
    getOptionalUser(),
  ])

  if (error) {
    return {
      restaurants: google.restaurants,
      googleRestaurants: google.restaurants,
      savedIds: new Set(),
      isDemo: false,
      error,
      googleError: google.error,
      googleConfigured: google.configured,
    }
  }

  const databaseRestaurants = restaurants.map(toPalateRestaurant)
  const providerIds = new Set(
    restaurants
      .map((restaurant) => restaurant.provider_place_id)
      .filter((id): id is string => Boolean(id)),
  )
  const { data: savedRows } = user
    ? await supabase.from('saved_restaurants').select('restaurant_id').eq('user_id', user.id)
    : { data: [] }

  return {
    restaurants: mergeRestaurants(google.restaurants, databaseRestaurants, providerIds, limit),
    googleRestaurants: google.restaurants.filter((restaurant) => !providerIds.has(restaurant.id.slice('google:'.length))),
    savedIds: new Set((savedRows ?? []).map((row) => row.restaurant_id)),
    isDemo: databaseRestaurants.some((restaurant) => restaurant.source === 'seeded'),
    error: null,
    googleError: google.error,
    googleConfigured: google.configured,
  }
}
