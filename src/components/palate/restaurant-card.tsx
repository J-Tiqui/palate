import Image from 'next/image'
import Link from 'next/link'
import { Bookmark, Check, Sparkles, Star } from 'lucide-react'
import { toggleSavedRestaurantAction } from '@/app/actions/product'
import type { PalateRestaurant } from '@/lib/palate/demo-data'

export function PalateRestaurantCard({
  restaurant,
  saved = false,
  returnTo = '/discover',
}: {
  restaurant: PalateRestaurant
  saved?: boolean
  returnTo?: string
}) {
  const detailsHref = `/restaurants/${restaurant.slug}`
  const recognition = restaurant.recognition?.split(' ·')[0]

  return (
    <article className="restaurant-card">
      {restaurant.source === 'database' ? (
        <form action={toggleSavedRestaurantAction}>
          <input type="hidden" name="restaurantId" value={restaurant.id} />
          <input type="hidden" name="restaurantSlug" value={restaurant.slug} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <button className={`save-button ${saved ? 'saved' : ''}`} aria-label={`${saved ? 'Remove' : 'Save'} ${restaurant.name}`}>
            {saved ? <Check aria-hidden="true" /> : <Bookmark aria-hidden="true" />}
          </button>
        </form>
      ) : (
        <Link className="save-button" href={`/login?next=${encodeURIComponent(detailsHref)}`} aria-label={`Sign in to save ${restaurant.name}`}>
          <Bookmark aria-hidden="true" />
        </Link>
      )}
      <Link className="card-hit" href={detailsHref}>
        <div className="card-image">
          <Image src={restaurant.image} alt={`${restaurant.name} dining`} width={720} height={520} sizes="(max-width: 640px) 82vw, 320px" />
          {recognition ? <span className="recognition"><Sparkles aria-hidden="true" size={13} /> {recognition}</span> : null}
        </div>
        <div className="card-body">
          <div className="card-title">
            <h3>{restaurant.name}</h3>
            <span className="rating"><Star aria-hidden="true" size={13} fill="currentColor" /> {restaurant.rating.toFixed(1)}</span>
          </div>
          <p>{restaurant.cuisine} · {restaurant.neighbourhood} · {restaurant.price}</p>
          <div className="card-reason"><span>✦</span>{restaurant.reason}</div>
        </div>
      </Link>
    </article>
  )
}
