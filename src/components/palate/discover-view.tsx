import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Star } from 'lucide-react'
import { Avatar } from '@/components/palate/app-shell'
import { PalateRestaurantCard } from '@/components/palate/restaurant-card'
import { DEMO_NOTICE, demoActivity, demoRestaurants, images, type PalateRestaurant } from '@/lib/palate/demo-data'

export function DiscoverView({
  restaurants,
  savedIds = new Set<string>(),
  isDemo,
  error,
}: {
  restaurants: PalateRestaurant[]
  savedIds?: Set<string>
  isDemo: boolean
  error?: string | null
}) {
  const catalogue = restaurants.length >= 4 ? restaurants : demoRestaurants
  const topPick = catalogue.find((restaurant) => restaurant.slug === 'giulietta') ?? catalogue[0]
  const recommended = catalogue.slice(0, 4)
  const hiddenGems = [catalogue[3], catalogue[7], catalogue[6], catalogue[2]].filter(Boolean)

  return (
    <div className="page-wrap discover-page">
      {isDemo ? (
        <p className="mb-5 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-xs leading-5 text-[var(--muted)]">
          <strong className="text-[var(--ink)]">Interface preview.</strong> {DEMO_NOTICE}
        </p>
      ) : null}
      {error ? <p role="alert" className="mb-5 rounded-xl bg-[var(--wine)] px-4 py-3 text-sm text-white">{error}</p> : null}

      <section className="discover-intro">
        <div>
          <p className="eyebrow">Thursday, July 16 · Toronto</p>
          <h1>What sounds good,<br /><em>Julian?</em></h1>
        </div>
        <Link className="taste-chip" href="/profile/julian">
          <span className="taste-dot" />Premium Casual Explorer <ArrowRight aria-hidden="true" size={16} />
        </Link>
      </section>

      {topPick ? (
        <section className="feature-grid">
          <Link className="feature-card" href={`/restaurants/${topPick.slug}`}>
            <Image src={topPick.image} alt="Italian dining spread" width={1200} height={900} loading="eager" />
            <div className="image-shade" />
            <div className="feature-content">
              <div className="feature-top">
                <span>TOP PICK FOR YOU</span>
                <span className="rating"><Star aria-hidden="true" size={13} fill="currentColor" /> {topPick.rating.toFixed(1)}</span>
              </div>
              <div>
                <h2>{topPick.name}</h2>
                <p>{topPick.cuisine} · {topPick.neighbourhood} · {topPick.price}</p>
                <div className="reason"><span>✦</span> Fits your date-night taste and Maya rated it 4.9</div>
              </div>
            </div>
          </Link>
          <article className="quick-blend">
            <div className="blend-orb">
              <Avatar initials="JT" tone="olive" />
              <Avatar initials="MC" tone="wine" />
              <Avatar initials="EB" tone="amber" />
            </div>
            <p className="eyebrow">Quick Start</p>
            <h2>Three tastes.<br />One good answer.</h2>
            <p>Maya and Ethan are both free Friday. Blend your tastes in under a minute.</p>
            <Link className="button cream" href="/blend">Start a Blend <ArrowRight aria-hidden="true" /></Link>
            <small>Last Blend: 94% match at Miku</small>
          </article>
        </section>
      ) : null}

      <RestaurantRail title="Recommended for you" subtitle="Built from your ratings, saves, and taste profile" restaurants={recommended} savedIds={savedIds} />

      <section className="friend-pulse">
        <div className="section-heading">
          <div><p className="eyebrow">The people you trust</p><h2>Friends are loving</h2></div>
          <Link href="/activity">See activity <ArrowRight aria-hidden="true" size={16} /></Link>
        </div>
        <div className="pulse-grid">
          {demoActivity.slice(0, 2).map((activity, index) => (
            <article key={`${activity.person}-${activity.time}`}>
              <div className="pulse-image">
                <Image src={activity.image} alt="Restaurant dish" width={700} height={520} />
                <span>{index === 0 ? '4.8' : '3/5'}</span>
              </div>
              <div className="pulse-copy">
                <div>
                  <Avatar initials={activity.initials} tone={index ? 'amber' : 'wine'} small />
                  <p><strong>{activity.person}</strong> {activity.action}<br /><b>{activity.restaurant}</b></p>
                </div>
                <p>“{activity.text}”</p>
                <small>{activity.time} ago</small>
              </div>
            </article>
          ))}
        </div>
      </section>

      <RestaurantRail title="Hidden gems" subtitle="Excellent places that stay just under the radar" restaurants={hiddenGems} savedIds={savedIds} />

      <section className="michelin-banner">
        <div>
          <p className="eyebrow">Your Toronto collection</p>
          <h2>Michelin, at your pace.</h2>
          <p>3 visited · 8 want to try · 21 left to explore</p>
          <p className="text-xs opacity-70">Manually seeded sample · unaffiliated</p>
          <div className="collection-progress"><span style={{ width: '23%' }} /></div>
          <Link className="button dark" href="/lists/michelin-toronto">Open collection <ArrowRight aria-hidden="true" /></Link>
        </div>
        <div className="michelin-images">
          {[images.dining, images.grill, images.italian].map((image, index) => (
            <Image key={image} src={image} alt="Sample restaurant" width={420} height={420} style={{ transform: `rotate(${[-5, 4, -2][index]}deg)` }} />
          ))}
        </div>
      </section>
    </div>
  )
}

function RestaurantRail({ title, subtitle, restaurants, savedIds }: {
  title: string
  subtitle: string
  restaurants: PalateRestaurant[]
  savedIds: Set<string>
}) {
  return (
    <section className="rail-section">
      <div className="section-heading">
        <div><h2>{title}</h2><p>{subtitle}</p></div>
        <Link href={`/discover?collection=${encodeURIComponent(title)}`}>See all <ArrowRight aria-hidden="true" size={16} /></Link>
      </div>
      <div className="restaurant-rail">
        {restaurants.map((restaurant) => (
          <PalateRestaurantCard key={restaurant.id} restaurant={restaurant} saved={savedIds.has(restaurant.id)} />
        ))}
      </div>
    </section>
  )
}
