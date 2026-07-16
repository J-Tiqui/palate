import 'server-only'

import { getOptionalUser } from '@/lib/auth/server'
import { hasSupabaseEnv } from '@/lib/env/public'
import { demoRestaurants, images, type PalateRestaurant } from '@/lib/palate/demo-data'
import { getRestaurantCards } from '@/lib/restaurants/queries'
import type { RestaurantCardData } from '@/lib/restaurants/queries'
import { createClient } from '@/lib/supabase/server'

export type DiscoveryData = {
  restaurants: PalateRestaurant[]
  savedIds: Set<string>
  isDemo: boolean
  error: string | null
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
  }
}

export async function getDiscoveryData({ search = '', limit = 30 }: { search?: string; limit?: number } = {}): Promise<DiscoveryData> {
  if (!hasSupabaseEnv()) {
    const filtered = search
      ? demoRestaurants.filter((restaurant) => restaurant.name.toLowerCase().includes(search.toLowerCase()))
      : demoRestaurants
    return { restaurants: filtered.slice(0, limit), savedIds: new Set(), isDemo: true, error: null }
  }

  const supabase = await createClient()
  const [{ restaurants, error }, user] = await Promise.all([
    getRestaurantCards(supabase, { limit, search }),
    getOptionalUser(),
  ])

  if (error) return { restaurants: [], savedIds: new Set(), isDemo: false, error }
  if (!restaurants.length) return { restaurants: [], savedIds: new Set(), isDemo: false, error: null }

  const { data: savedRows } = user
    ? await supabase.from('saved_restaurants').select('restaurant_id').eq('user_id', user.id)
    : { data: [] }

  return {
    restaurants: restaurants.map(toPalateRestaurant),
    savedIds: new Set((savedRows ?? []).map((row) => row.restaurant_id)),
    isDemo: restaurants.every((restaurant) => restaurant.provider === 'seed'),
    error: null,
  }
}
