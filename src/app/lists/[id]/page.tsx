import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'
import { PalateShell } from '@/components/palate/app-shell'
import { hasSupabaseEnv } from '@/lib/env/public'
import { demoRestaurants, type PalateRestaurant } from '@/lib/palate/demo-data'
import { getRestaurantCardsByIds } from '@/lib/restaurants/queries'
import { createClient } from '@/lib/supabase/server'
import { uuidSchema } from '@/lib/validation/schemas'

export default async function ListDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let title = 'Want to Try'
  let description = 'Places saved for the right night.'
  let restaurants: PalateRestaurant[] = []
  let sample = true

  if (id === 'michelin-toronto') {
    title = 'Michelin Toronto'
    description = 'A prototype collection for following recognised restaurants. Guide designations should be verified before production use.'
    restaurants = demoRestaurants.filter((restaurant) => restaurant.recognition?.includes('Michelin'))
  } else if (id === 'want-to-try') {
    restaurants = demoRestaurants.slice(0, 5)
  } else if (hasSupabaseEnv()) {
    const parsed = uuidSchema.safeParse(id)
    if (!parsed.success) notFound()
    const supabase = await createClient()
    const { data: list } = await supabase.from('lists').select('id, name, description').eq('id', parsed.data).maybeSingle()
    if (!list) notFound()
    const { data: items } = await supabase.from('list_items').select('restaurant_id').eq('list_id', list.id).order('position')
    const cards = await getRestaurantCardsByIds(supabase, (items ?? []).map((item) => item.restaurant_id))
    title = list.name
    description = list.description
    sample = false
    restaurants = cards.map((restaurant) => ({
      id: restaurant.id,
      slug: restaurant.slug,
      name: restaurant.name,
      cuisine: restaurant.cuisines.join(' · ') || 'Restaurant',
      neighbourhood: restaurant.neighbourhood || restaurant.city,
      address: restaurant.city,
      price: '$'.repeat(restaurant.price_level),
      rating: restaurant.average_rating,
      image: restaurant.hero_image_url || demoRestaurants[0].image,
      image2: restaurant.hero_image_url || demoRestaurants[0].image2,
      vibe: restaurant.vibes,
      dietary: [],
      description: '',
      reason: 'Saved to this collection',
      distance: 'Toronto',
      friends: [],
      source: restaurant.provider === 'seed' ? 'seeded' : 'database',
    }))
  } else {
    notFound()
  }

  return (
    <PalateShell>
      <div className="collection-page">
        <Link className="back-link" href="/lists"><ArrowLeft />All lists</Link>
        <section className="collection-hero">
          <div><p className="eyebrow">{sample ? 'Manually seeded sample · Not affiliated' : 'Your collection'}</p><h1>{title === 'Michelin Toronto' ? <>Michelin <em>Toronto</em></> : title}</h1><p>{description}</p></div>
          <div className="collection-ring"><strong>{sample ? '23%' : restaurants.length}</strong><span>{sample ? '7 of 32 visited' : 'restaurants'}</span></div>
        </section>
        <div className="collection-tabs"><button className="active">All</button><button>Stars</button><button>Bib Gourmand</button><button>Selected</button></div>
        <div className="collection-list">
          {restaurants.map((restaurant) => (
            <article key={restaurant.id}>
              <Link href={`/restaurants/${restaurant.slug}`}><Image src={restaurant.image} alt={restaurant.name} width={260} height={220} /></Link>
              <div><span>{restaurant.recognition || (sample ? 'Sample restaurant' : 'Palate restaurant')}</span><h2>{restaurant.name}</h2><p>{restaurant.cuisine} · {restaurant.neighbourhood} · {restaurant.price}</p></div>
              <select defaultValue="Not marked" aria-label={`Status for ${restaurant.name}`}><option>Not marked</option><option>Visited</option><option>Reviewed</option><option>Want to Try</option></select>
            </article>
          ))}
        </div>
      </div>
    </PalateShell>
  )
}
