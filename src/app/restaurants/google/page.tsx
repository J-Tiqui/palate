import Image from 'next/image'
import Link from 'next/link'
import { ExternalLink, Globe, Map as MapIcon, MapPin, Phone, Sparkles, X } from 'lucide-react'
import { notFound } from 'next/navigation'
import { PalateShell } from '@/components/palate/app-shell'
import { images } from '@/lib/palate/demo-data'
import { getRestaurantProvider, providerPlaceIdPattern } from '@/lib/restaurants/google-places'
import { getGooglePhotoUrl } from '@/lib/restaurants/google-photo'

export const dynamic = 'force-dynamic'

function statusLabel(status: string | null): string {
  switch (status) {
    case 'OPERATIONAL': return 'Open for business'
    case 'CLOSED_TEMPORARILY': return 'Temporarily closed'
    case 'CLOSED_PERMANENTLY': return 'Permanently closed'
    case 'FUTURE_OPENING': return 'Opening soon'
    default: return 'Confirm before visiting'
  }
}

export default async function GoogleRestaurantPage({ searchParams }: {
  searchParams: Promise<{ placeId?: string }>
}) {
  const { placeId: rawPlaceId } = await searchParams
  const placeId = rawPlaceId?.trim() ?? ''
  if (placeId.length < 3 || placeId.length > 255 || !providerPlaceIdPattern.test(placeId)) notFound()

  const provider = getRestaurantProvider()
  if (!provider) notFound()

  const restaurant = await provider.getPlace(placeId).catch(() => null)
  if (!restaurant) notFound()

  const photoUrls = restaurant.photos
    .slice(0, 3)
    .map((photo, index) => ({
      url: getGooglePhotoUrl(photo.reference, index === 0 ? 1200 : 800),
      attribution: photo.attribution,
    }))
    .filter((photo): photo is { url: string; attribution: string | null } => Boolean(photo.url))
  const primaryImage = photoUrls[0]?.url ?? images.room
  const secondaryImage = photoUrls[1]?.url ?? primaryImage
  const thirdImage = photoUrls[2]?.url ?? images.plate
  const cuisine = restaurant.primaryTypeDisplayName
    ?? restaurant.primaryType?.replaceAll('_', ' ')
    ?? 'Restaurant'

  return (
    <PalateShell>
      <div className="modal-backdrop restaurant-backdrop route-detail">
        <article className="restaurant-modal">
          <Link className="floating-close" href="/discover" aria-label="Close restaurant"><X /></Link>
          <div className="restaurant-gallery">
            <Image src={primaryImage} alt={`${restaurant.name} restaurant`} width={1200} height={800} priority unoptimized={photoUrls.length > 0} />
            <Image src={secondaryImage} alt={`${restaurant.name} dining`} width={800} height={800} unoptimized={photoUrls.length > 0} />
            <div><Image src={thirdImage} alt={`${restaurant.name} food`} width={500} height={500} unoptimized={photoUrls.length > 2} /></div>
          </div>
          <div className="restaurant-content">
            <div className="restaurant-lead">
              <div>
                <div className="meta-row"><span className="google-source">Google Places live listing</span><span>{restaurant.neighbourhood || restaurant.city || 'Toronto'}</span></div>
                <h1>{restaurant.name}</h1>
                <p>{cuisine} · {'$'.repeat(restaurant.priceLevel ?? 2)} · {restaurant.city || 'Toronto'}</p>
              </div>
              <div className="big-rating">
                <strong>{restaurant.providerRating?.toFixed(1) ?? 'New'}</strong>
                <span>{restaurant.providerRating ? '★★★★★' : 'No rating'}</span>
                <small>Google rating</small>
                {restaurant.providerReviewCount ? <small>{restaurant.providerReviewCount.toLocaleString()} Google reviews</small> : null}
              </div>
            </div>

            <div className="action-row google-actions">
              {restaurant.googleMapsUri ? <Link href={restaurant.googleMapsUri} target="_blank" rel="noreferrer"><MapIcon />Open in Google Maps</Link> : null}
              {restaurant.websiteUri ? <Link href={restaurant.websiteUri} target="_blank" rel="noreferrer"><Globe />Website</Link> : null}
              {restaurant.nationalPhoneNumber ? <Link href={`tel:${restaurant.nationalPhoneNumber.replace(/[^+\d]/g, '')}`}><Phone />Call</Link> : null}
              <Link href="/blend"><Sparkles />Consider in Blend</Link>
            </div>

            <div className="why-panel"><span>G</span><div><strong>Live provider information</strong><p>This listing, rating, address, hours, and photos come from Google Places. Palate community ratings remain separate.</p></div><b>Google</b></div>
            <div className="restaurant-columns">
              <div>
                <section>
                  <h3>About</h3>
                  <p>Current restaurant information supplied by Google Places. Verify dietary, accessibility, reservation, and allergy information directly with the restaurant.</p>
                  <div className="tags">{restaurant.types.slice(0, 6).map((type) => <span className="tag" key={type}>{type.replaceAll('_', ' ')}</span>)}</div>
                </section>
                {restaurant.openingHours?.weekdayDescriptions.length ? (
                  <section>
                    <h3>Hours</h3>
                    <div className="provider-hours">{restaurant.openingHours.weekdayDescriptions.map((day) => <p key={day}>{day}</p>)}</div>
                    <small>Hours can change; confirm before visiting.</small>
                  </section>
                ) : null}
                {photoUrls.some((photo) => photo.attribution) ? (
                  <section className="provider-attribution"><h3>Photo credits</h3>{photoUrls.map((photo, index) => photo.attribution ? <p key={`${photo.attribution}-${index}`}>{photo.attribution}</p> : null)}</section>
                ) : null}
              </div>
              <aside>
                <div className="detail-map"><div className="mini-map-lines" /><span className="map-pin active"><MapPin /></span></div>
                <h3>{restaurant.formattedAddress || [restaurant.city, restaurant.region].filter(Boolean).join(', ')}</h3>
                <p>{restaurant.neighbourhood || restaurant.city}</p>
                {restaurant.googleMapsUri ? <Link className="button ghost full" href={restaurant.googleMapsUri} target="_blank" rel="noreferrer"><ExternalLink />Directions on Google</Link> : <Link className="button ghost full" href="/map"><MapIcon />View on Palate map</Link>}
                <div className="hours"><span>Google listing status</span><strong>{restaurant.openingHours?.openNow === true ? 'Open now' : restaurant.openingHours?.openNow === false ? 'Closed now' : statusLabel(restaurant.businessStatus)}</strong></div>
                <Link className="button wine full" href="/blend"><Sparkles />Consider in a Blend</Link>
              </aside>
            </div>
          </div>
        </article>
      </div>
    </PalateShell>
  )
}
