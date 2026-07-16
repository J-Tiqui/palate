import Link from 'next/link'
import { PalateShell } from '@/components/palate/app-shell'
import { PalateRestaurantCard } from '@/components/palate/restaurant-card'
import { requireUser } from '@/lib/auth/server'
import { images, type PalateRestaurant } from '@/lib/palate/demo-data'
import { getRestaurantCardsByIds } from '@/lib/restaurants/queries'
import { createClient } from '@/lib/supabase/server'

export default async function SavedRestaurantsPage() {
  const user = await requireUser('/saved')
  const supabase = await createClient()
  const { data: saved, error } = await supabase.from('saved_restaurants').select('restaurant_id').eq('user_id', user.id).order('created_at', { ascending: false })
  const cards = await getRestaurantCardsByIds(supabase, (saved ?? []).map((item) => item.restaurant_id))
  const restaurants: PalateRestaurant[] = cards.map((restaurant) => ({ id: restaurant.id, slug: restaurant.slug, name: restaurant.name, cuisine: restaurant.cuisines.join(' · ') || 'Restaurant', neighbourhood: restaurant.neighbourhood || restaurant.city, address: restaurant.city, price: '$'.repeat(restaurant.price_level), rating: restaurant.average_rating, image: restaurant.hero_image_url || images.room, image2: restaurant.hero_image_url || images.plate, vibe: restaurant.vibes, dietary: [], description: '', reason: 'Saved to your private Want to Try collection', distance: 'Toronto', friends: [], source: restaurant.provider === 'seed' ? 'seeded' : 'database' }))

  return <PalateShell><div className="page-wrap lists-page"><section className="page-title"><div><p className="eyebrow">Want to try</p><h1>Your saved tables.</h1><p>Private to your account until you intentionally add a place to a shared list.</p></div></section>{error ? <p role="alert">We could not load saved restaurants.</p> : null}{!error && restaurants.length === 0 ? <div className="empty-state"><h2>Nothing saved yet</h2><p>Save a restaurant to keep it here.</p><Link className="button wine" href="/discover">Explore restaurants</Link></div> : <div className="saved-grid">{restaurants.map((restaurant) => <PalateRestaurantCard key={restaurant.id} restaurant={restaurant} saved returnTo="/saved" />)}</div>}</div></PalateShell>
}
