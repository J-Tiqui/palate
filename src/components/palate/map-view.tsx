'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Filter, Search, Star } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { PalateRestaurant } from '@/lib/palate/demo-data'

const filters = ['All', 'Saved', 'Michelin', 'Blend picks', '$$', 'Date night'] as const

export function MapView({ restaurants, isDemo }: { restaurants: PalateRestaurant[]; isDemo: boolean }) {
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]>('All')
  const [selectedId, setSelectedId] = useState(restaurants[2]?.id ?? restaurants[0]?.id)
  const selected = restaurants.find((restaurant) => restaurant.id === selectedId) ?? restaurants[0]
  const visible = useMemo(() => {
    if (activeFilter === 'Michelin') return restaurants.filter((restaurant) => restaurant.recognition?.includes('Michelin'))
    if (activeFilter === '$$') return restaurants.filter((restaurant) => restaurant.price === '$$')
    if (activeFilter === 'Date night') return restaurants.filter((restaurant) => restaurant.vibe.some((vibe) => vibe.toLowerCase().includes('date') || vibe.toLowerCase().includes('intimate')))
    return restaurants
  }, [activeFilter, restaurants])

  if (!selected) return null

  return (
    <div className="map-page">
      <section className="map-toolbar">
        <div><p className="eyebrow">Live discovery</p><h1>Toronto map</h1></div>
        <form className="map-search" action="/map">
          <Search aria-hidden="true" />
          <input name="q" aria-label="Search Toronto restaurants" placeholder="Search ramen, patios, neighbourhoods…" />
          <button>Search</button>
        </form>
        <div className="map-filters">
          {filters.map((filter) => (
            <button type="button" key={filter} className={activeFilter === filter ? 'active' : ''} onClick={() => setActiveFilter(filter)}>
              {filter === 'All' ? <Filter aria-hidden="true" size={13} /> : null}{filter}
            </button>
          ))}
        </div>
      </section>

      <div className="map-layout">
        <aside className="map-panel">
          <p><strong>{visible.length}</strong> places in this view</p>
          <div className="live-source-row">
            <span className="live-dot" />
            <p><strong>{isDemo ? 'Sample map preview' : 'Palate catalogue'}</strong><small>{isDemo ? 'Not live provider data' : 'Community and provider records remain distinct'}</small></p>
            <em>{isDemo ? 'DEMO' : 'LIVE'}</em>
          </div>
          {visible.map((restaurant) => (
            <button type="button" key={restaurant.id} className={selected.id === restaurant.id ? 'active' : ''} onClick={() => setSelectedId(restaurant.id)}>
              <Image src={restaurant.image} alt="" width={140} height={130} />
              <div><strong>{restaurant.name}</strong><span>{restaurant.cuisine}</span><small><Star aria-hidden="true" size={10} fill="currentColor" /> {restaurant.rating.toFixed(1)} · {restaurant.distance}</small></div>
            </button>
          ))}
        </aside>

        <section className="custom-map" aria-label="Map of Toronto restaurants">
          <div className="map-grid" aria-hidden="true" />
          <span className="neighbourhood-label n1">LITTLE ITALY</span>
          <span className="neighbourhood-label n2">DOWNTOWN</span>
          <span className="neighbourhood-label n3">HARBOURFRONT</span>
          <span className="road-label r1">Spadina Ave.</span>
          <span className="road-label r2">College St.</span>
          <span className="water-label">LAKE ONTARIO</span>
          {visible.slice(0, 7).map((restaurant, index) => (
            <button type="button" key={restaurant.id} className={`restaurant-marker marker-${index + 1} ${restaurant.id === selected.id ? 'active' : ''} ${restaurant.recognition ? 'guide' : ''}`} onClick={() => setSelectedId(restaurant.id)} aria-label={`Select ${restaurant.name}`}>
              <span>{restaurant.rating.toFixed(1)}</span>
            </button>
          ))}
          <span className="user-location"><i />You</span>

          <article className="map-preview">
            <Link className="map-preview-img" href={`/restaurants/${selected.slug}`}><Image src={selected.image} alt={selected.name} width={380} height={320} /></Link>
            <div>
              <span className="map-preview-top"><small>{selected.cuisine}</small><span className="rating"><Star size={12} fill="currentColor" /> {selected.rating.toFixed(1)}</span></span>
              <h3>{selected.name}</h3>
              <p>{selected.neighbourhood} · {selected.price} · {selected.distance}</p>
              <div className="card-reason"><span>✦</span>{selected.reason}</div>
              <Link href={`/restaurants/${selected.slug}`}>View details <ArrowRight aria-hidden="true" size={15} /></Link>
            </div>
          </article>
          <div className="map-legend"><span><i className="legend-high" />4.5+ great</span><span><i className="legend-mid" />4.0+ good</span><span><i className="legend-low" />Under 4.0</span></div>
        </section>
      </div>
    </div>
  )
}
