import Image from 'next/image'
import Link from 'next/link'
import { MapPin } from 'lucide-react'
import type { RestaurantCardData } from '@/lib/restaurants/queries'

function isSupportedImage(url: string | null): url is string {
  if (!url) return false
  try {
    const hostname = new URL(url).hostname
    return hostname === 'images.unsplash.com' || hostname.endsWith('.supabase.co')
  } catch {
    return false
  }
}

export function RestaurantCard({ restaurant }: { restaurant: RestaurantCardData }) {
  return (
    <article className="group overflow-hidden rounded-[1.6rem] bg-white shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-lg">
      <Link href={`/restaurants/${restaurant.slug}`} className="block">
        <div className="relative aspect-[4/3] bg-[#ded6c8]">
          {isSupportedImage(restaurant.hero_image_url) && (
            <Image
              src={restaurant.hero_image_url}
              alt={restaurant.name}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition duration-500 group-hover:scale-[1.02]"
            />
          )}
          <div className="absolute right-3 top-3 rounded-full bg-white px-3 py-1.5 text-sm font-bold text-[#1f3a31]">
            {restaurant.review_count > 0 ? restaurant.average_rating.toFixed(1) : 'New'}
          </div>
          {restaurant.provider === 'seed' && (
            <div className="absolute bottom-3 left-3 rounded-full bg-[#201c18]/80 px-3 py-1 text-xs font-medium text-white">
              Development sample
            </div>
          )}
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-xl font-semibold tracking-[-0.03em]">{restaurant.name}</h3>
            <span className="text-sm text-black/45">{'$'.repeat(restaurant.price_level)}</span>
          </div>
          <p className="mt-2 min-h-5 text-sm text-black/55">
            {restaurant.cuisines.length ? restaurant.cuisines.join(' · ') : 'Cuisine details coming soon'}
          </p>
          <div className="mt-4 flex items-center gap-2 text-sm text-black/45">
            <MapPin size={15} />
            {restaurant.neighbourhood ?? restaurant.city} · {restaurant.review_count} {restaurant.review_count === 1 ? 'review' : 'reviews'}
          </div>
        </div>
      </Link>
    </article>
  )
}
