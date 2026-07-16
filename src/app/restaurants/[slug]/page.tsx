import Image from 'next/image'
import Link from 'next/link'
import { Bookmark, Check, List, Map as MapIcon, MapPin, Plus, Sparkles, X } from 'lucide-react'
import { notFound } from 'next/navigation'
import { toggleSavedRestaurantAction } from '@/app/actions/product'
import { PalateShell } from '@/components/palate/app-shell'
import { Avatar } from '@/components/palate/avatar'
import { getOptionalUser } from '@/lib/auth/server'
import { hasSupabaseEnv } from '@/lib/env/public'
import { getDemoRestaurant, images } from '@/lib/palate/demo-data'
import { createClient } from '@/lib/supabase/server'
import { slugSchema } from '@/lib/validation/schemas'

type ReviewPreview = { id: string; rating: number; review_text: string; user_id: string }

function supportedImage(url: string | null): url is string {
  if (!url) return false
  try {
    const host = new URL(url).hostname
    return host === 'images.unsplash.com' || host.endsWith('.supabase.co')
  } catch {
    return false
  }
}

export default async function RestaurantPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: rawSlug } = await params
  const parsed = slugSchema.safeParse(rawSlug)
  if (!parsed.success) notFound()

  let restaurant = getDemoRestaurant(parsed.data)
  let reviews: ReviewPreview[] = []
  let saved = false
  let googleRating: number | null = null

  if (hasSupabaseEnv()) {
    const supabase = await createClient()
    const { data: row } = await supabase
      .from('restaurants')
      .select('id, slug, name, description, address_line1, city, neighbourhood, price_level, provider, average_rating, review_count, google_rating, hero_image_url')
      .eq('slug', parsed.data)
      .maybeSingle()
    if (row) {
      const [cuisineLinks, cuisines, vibeLinks, vibes, reviewRows, user] = await Promise.all([
        supabase.from('restaurant_cuisines').select('cuisine_id, is_primary').eq('restaurant_id', row.id),
        supabase.from('cuisine_categories').select('id, name'),
        supabase.from('restaurant_vibes').select('vibe_id').eq('restaurant_id', row.id),
        supabase.from('vibe_tags').select('id, name'),
        supabase.from('reviews').select('id, rating, review_text, user_id').eq('restaurant_id', row.id).order('created_at', { ascending: false }).limit(10),
        getOptionalUser(),
      ])
      const cuisineNames = new Map((cuisines.data ?? []).map((item) => [item.id, item.name]))
      const vibeNames = new Map((vibes.data ?? []).map((item) => [item.id, item.name]))
      restaurant = {
        id: row.id,
        slug: row.slug,
        name: row.name,
        cuisine: (cuisineLinks.data ?? []).sort((a, b) => Number(b.is_primary) - Number(a.is_primary)).map((item) => cuisineNames.get(item.cuisine_id)).filter((name): name is string => Boolean(name)).join(' · ') || 'Restaurant',
        neighbourhood: row.neighbourhood || row.city,
        address: [row.address_line1, row.city].filter(Boolean).join(', '),
        price: '$'.repeat(row.price_level),
        rating: row.review_count > 0 ? row.average_rating : 0,
        image: supportedImage(row.hero_image_url) ? row.hero_image_url : images.room,
        image2: supportedImage(row.hero_image_url) ? row.hero_image_url : images.plate,
        vibe: (vibeLinks.data ?? []).map((item) => vibeNames.get(item.vibe_id)).filter((name): name is string => Boolean(name)),
        dietary: [],
        description: row.description || 'Restaurant details are being completed by the Palate community.',
        reason: row.review_count > 0 ? `Rated by ${row.review_count} Palate members` : 'New to the Palate community',
        recognition: row.provider === 'seed' ? 'Development sample · not live provider data' : undefined,
        distance: row.city,
        friends: [],
        source: row.provider === 'seed' ? 'seeded' : 'database',
      }
      googleRating = row.google_rating
      reviews = reviewRows.data ?? []
      if (user) {
        const { data: savedRow } = await supabase.from('saved_restaurants').select('restaurant_id').eq('user_id', user.id).eq('restaurant_id', row.id).maybeSingle()
        saved = Boolean(savedRow)
      }
    }
  }

  if (!restaurant) notFound()
  const isDatabase = restaurant.source === 'database'
  const detailsPath = `/restaurants/${restaurant.slug}`

  return (
    <PalateShell>
      <div className="modal-backdrop restaurant-backdrop route-detail">
        <article className="restaurant-modal">
          <Link className="floating-close" href="/discover" aria-label="Close restaurant"><X /></Link>
          <div className="restaurant-gallery">
            <Image src={restaurant.image} alt={`${restaurant.name} interior`} width={1200} height={800} priority />
            <Image src={restaurant.image2} alt={`${restaurant.name} food`} width={800} height={800} />
            <div><Image src={images.plate} alt="Restaurant dish" width={500} height={500} /></div>
          </div>
          <div className="restaurant-content">
            <div className="restaurant-lead">
              <div><div className="meta-row">{restaurant.recognition ? <span className="guide-label">✦ {restaurant.recognition}</span> : <span className="google-source">Palate community listing</span>}<span>{restaurant.neighbourhood}</span></div><h1>{restaurant.name}</h1><p>{restaurant.cuisine} · {restaurant.price} · {restaurant.distance}</p></div>
              <div className="big-rating"><strong>{restaurant.rating > 0 ? restaurant.rating.toFixed(1) : 'New'}</strong><span>{restaurant.rating > 0 ? '★★★★★' : 'No ratings'}</span><small>{restaurant.source === 'seeded' ? 'Sample rating' : 'Palate community rating'}</small>{googleRating ? <small>Google rating: {googleRating.toFixed(1)}</small> : null}</div>
            </div>
            <div className="action-row">
              {isDatabase ? <form action={toggleSavedRestaurantAction}><input type="hidden" name="restaurantId" value={restaurant.id} /><input type="hidden" name="restaurantSlug" value={restaurant.slug} /><input type="hidden" name="returnTo" value={detailsPath} /><button>{saved ? <Check /> : <Bookmark />}{saved ? 'Saved' : 'Save'}</button></form> : <Link href={`/login?next=${encodeURIComponent(detailsPath)}`}><Bookmark />Save</Link>}
              <Link href={isDatabase ? `${detailsPath}/review` : `/login?next=${encodeURIComponent(`${detailsPath}/review`)}`}><Plus />Log Visit</Link>
              <Link href="/lists"><List />Add to List</Link>
              <Link href="/blend"><Sparkles />Blend</Link>
            </div>
            <div className="why-panel"><span>✦</span><div><strong>Why Palate recommended it</strong><p>{restaurant.reason}. It also matches your preference for anniversary and date-night rooms.</p></div><b>93% fit</b></div>
            <div className="restaurant-columns">
              <div>
                <section><h3>About</h3><p>{restaurant.description}</p><div className="tags">{restaurant.vibe.map((vibe) => <span className="tag" key={vibe}>{vibe}</span>)}</div></section>
                <section><h3>Dietary notes</h3><div className="diet-list">{restaurant.dietary.length ? restaurant.dietary.map((note) => <span key={note}><Check />{note}</span>) : <span><Check />Confirm options directly</span>}</div><small>Always confirm allergies directly with the restaurant.</small></section>
                <section><div className="section-heading compact"><div><h3>Friend notes</h3><p>{restaurant.friends.length || reviews.length} friends have been here</p></div></div><div className="friend-review"><Avatar initials="MC" tone="wine" /><div><strong>Maya rated it 4.9</strong><p>“{reviews[0]?.review_text || 'Warm service, confident food, and not a single weak plate.'}”</p></div></div></section>
              </div>
              <aside>
                <div className="detail-map"><div className="mini-map-lines" /><span className="map-pin active"><MapPin /></span></div>
                <h3>{restaurant.address}</h3><p>{restaurant.neighbourhood}</p><Link className="button ghost full" href="/map"><MapIcon />View on Palate map</Link>
                <div className="hours"><span>Listing status</span><strong>{restaurant.source === 'seeded' ? 'Sample details only' : 'Verify hours before visiting'}</strong></div>
                <Link className="button wine full" href="/blend"><Sparkles />Consider in a Blend</Link>
              </aside>
            </div>
          </div>
        </article>
      </div>
    </PalateShell>
  )
}
