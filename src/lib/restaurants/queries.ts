import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, RestaurantRow } from '@/types/database'

export type RestaurantCardData = Pick<
  RestaurantRow,
  'id' | 'slug' | 'name' | 'neighbourhood' | 'city' | 'price_level' | 'average_rating' | 'review_count' | 'hero_image_url' | 'provider'
> & {
  cuisines: string[]
  vibes: string[]
}

type RestaurantBase = Omit<RestaurantCardData, 'cuisines' | 'vibes'>

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`)
}

export async function getRestaurantCards(
  supabase: SupabaseClient<Database>,
  { limit = 24, search = '' }: { limit?: number; search?: string } = {},
): Promise<{ restaurants: RestaurantCardData[]; error: string | null }> {
  let query = supabase
    .from('restaurants')
    .select('id, slug, name, neighbourhood, city, price_level, average_rating, review_count, hero_image_url, provider')
    .order('average_rating', { ascending: false })
    .order('name', { ascending: true })
    .limit(Math.min(Math.max(limit, 1), 50))

  if (search) query = query.ilike('name', `%${escapeLike(search)}%`)

  const { data: rows, error } = await query
  if (error) return { restaurants: [], error: 'Restaurant discovery is temporarily unavailable.' }
  if (!rows?.length) return { restaurants: [], error: null }
  return { restaurants: await hydrateRestaurantCards(supabase, rows), error: null }
}

async function hydrateRestaurantCards(
  supabase: SupabaseClient<Database>,
  rows: RestaurantBase[],
): Promise<RestaurantCardData[]> {
  const restaurantIds = rows.map((restaurant) => restaurant.id)
  const [restaurantCuisines, cuisineCategories, restaurantVibes, vibeTags] = await Promise.all([
    supabase.from('restaurant_cuisines').select('restaurant_id, cuisine_id, is_primary').in('restaurant_id', restaurantIds),
    supabase.from('cuisine_categories').select('id, name'),
    supabase.from('restaurant_vibes').select('restaurant_id, vibe_id').in('restaurant_id', restaurantIds),
    supabase.from('vibe_tags').select('id, name'),
  ])

  const cuisineNames = new Map((cuisineCategories.data ?? []).map((item) => [item.id, item.name]))
  const vibeNames = new Map((vibeTags.data ?? []).map((item) => [item.id, item.name]))
  const cuisinesByRestaurant = new Map<string, string[]>()
  const vibesByRestaurant = new Map<string, string[]>()

  ;(restaurantCuisines.data ?? [])
    .sort((left, right) => Number(right.is_primary) - Number(left.is_primary))
    .forEach((item) => {
      const name = cuisineNames.get(item.cuisine_id)
      if (!name) return
      cuisinesByRestaurant.set(item.restaurant_id, [
        ...(cuisinesByRestaurant.get(item.restaurant_id) ?? []),
        name,
      ])
    })

  ;(restaurantVibes.data ?? []).forEach((item) => {
    const name = vibeNames.get(item.vibe_id)
    if (!name) return
    vibesByRestaurant.set(item.restaurant_id, [
      ...(vibesByRestaurant.get(item.restaurant_id) ?? []),
      name,
    ])
  })

  return rows.map((restaurant) => ({
    ...restaurant,
    cuisines: cuisinesByRestaurant.get(restaurant.id) ?? [],
    vibes: vibesByRestaurant.get(restaurant.id) ?? [],
  }))
}

export async function getRestaurantCardsByIds(
  supabase: SupabaseClient<Database>,
  restaurantIds: string[],
): Promise<RestaurantCardData[]> {
  if (!restaurantIds.length) return []
  const { data } = await supabase
    .from('restaurants')
    .select('id, slug, name, neighbourhood, city, price_level, average_rating, review_count, hero_image_url, provider')
    .in('id', restaurantIds.slice(0, 100))

  if (!data) return []
  const order = new Map(restaurantIds.map((id, index) => [id, index]))
  const sorted = [...data].sort(
    (left, right) => (order.get(left.id) ?? 0) - (order.get(right.id) ?? 0),
  )
  return hydrateRestaurantCards(supabase, sorted)
}
