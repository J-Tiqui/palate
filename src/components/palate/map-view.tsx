'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Filter, Search, Star } from 'lucide-react'
import { useMemo, useState } from 'react'
import { DEMO_NOTICE, demoRestaurants, type PalateRestaurant } from '@/lib/palate/demo-data'

const filters = ['All', 'Saved', 'Michelin', 'Date night'] as const
const priceLevels = [1, 2, 3, 4] as const

type MapViewProps = {
  restaurants: PalateRestaurant[]
  savedIds: string[]
  isDemo: boolean
  error?: string | null
}

export function MapView({ restaurants, savedIds, isDemo, error }: MapViewProps) {
  const catalogue = restaurants.length ? restaurants : demoRestaurants
  const isSampleMap = isDemo || restaurants.length === 0
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]>('All')
  const [query, setQuery] = useState('')
  const [priceMin, setPriceMin] = useState(1)
  const [priceMax, setPriceMax] = useState(4)
  const [selectedId, setSelectedId] = useState(catalogue[2]?.id ?? catalogue[0]?.id)
  const savedIdSet = useMemo(() => new Set(savedIds), [savedIds])
  const visible = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return catalogue.filter((restaurant) => {
      const priceLevel = restaurant.price.length
      const matchesPrice = priceLevel >= priceMin && priceLevel <= priceMax
      const matchesQuery = !normalizedQuery || [
        restaurant.name,
        restaurant.cuisine,
        restaurant.neighbourhood,
        ...restaurant.vibe,
      ].some((value) => value.toLowerCase().includes(normalizedQuery))
      const matchesCategory = activeFilter === 'All'
        || (activeFilter === 'Saved' && savedIdSet.has(restaurant.id))
        || (activeFilter === 'Michelin' && restaurant.recognition?.includes('Michelin'))
        || (activeFilter === 'Date night' && restaurant.vibe.some((vibe) => {
          const normalizedVibe = vibe.toLowerCase()
          return normalizedVibe.includes('date') || normalizedVibe.includes('intimate')
        }))
      return matchesPrice && matchesQuery && matchesCategory
    })
  }, [activeFilter, catalogue, priceMax, priceMin, query, savedIdSet])
  const selected = visible.find((restaurant) => restaurant.id === selectedId) ?? visible[0]

  function updateMinimum(value: number) {
    setPriceMin(value)
    if (value > priceMax) setPriceMax(value)
  }

  function updateMaximum(value: number) {
    setPriceMax(value)
    if (value < priceMin) setPriceMin(value)
  }

  return (
    <div className="map-page">
      <section className="map-toolbar">
        <div><p className="eyebrow">Live discovery</p><h1>Toronto map</h1></div>
        <form className="map-search" onSubmit={(event) => event.preventDefault()}>
          <Search aria-hidden="true" />
          <input
            name="q"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search Toronto restaurants"
            placeholder="Search restaurants, cuisines, neighbourhoods…"
          />
          <button>Search</button>
        </form>
        <div className="map-filters">
          {filters.map((filter) => (
            <button type="button" key={filter} className={activeFilter === filter ? 'active' : ''} onClick={() => setActiveFilter(filter)}>
              {filter === 'All' ? <Filter aria-hidden="true" size={13} /> : null}{filter}
            </button>
          ))}
          <div className="map-price-filter" aria-label="Price range filter">
            <label>
              <span>Min price</span>
              <select value={priceMin} onChange={(event) => updateMinimum(Number(event.target.value))}>
                {priceLevels.map((value) => <option key={value} value={value}>{'$'.repeat(value)}</option>)}
              </select>
            </label>
            <span aria-hidden="true">to</span>
            <label>
              <span>Max price</span>
              <select value={priceMax} onChange={(event) => updateMaximum(Number(event.target.value))}>
                {priceLevels.map((value) => <option key={value} value={value}>{'$'.repeat(value)}</option>)}
              </select>
            </label>
          </div>
        </div>
      </section>

      {isSampleMap ? (
        <p className="map-notice"><strong>Map preview.</strong> {DEMO_NOTICE}</p>
      ) : null}
      {error ? <p role="alert" className="map-error">The live catalogue is unavailable, so sample places are shown.</p> : null}

      <div className="map-layout">
        <aside className="map-panel">
          <p><strong>{visible.length}</strong> places in this view</p>
          <div className="live-source-row">
            <span className="live-dot" />
            <p><strong>{isSampleMap ? 'Sample map preview' : 'Palate catalogue'}</strong><small>{isSampleMap ? 'Not live provider data' : 'Community and provider records remain distinct'}</small></p>
            <em>{isSampleMap ? 'DEMO' : 'LIVE'}</em>
          </div>
          {visible.map((restaurant) => (
            <button type="button" key={restaurant.id} className={selected?.id === restaurant.id ? 'active' : ''} onClick={() => setSelectedId(restaurant.id)}>
              <Image src={restaurant.image} alt="" width={140} height={130} />
              <div><strong>{restaurant.name}</strong><span>{restaurant.cuisine}</span><small><Star aria-hidden="true" size={10} fill="currentColor" /> {restaurant.rating.toFixed(1)} · {restaurant.distance}</small></div>
            </button>
          ))}
          {!visible.length ? <p className="map-empty">No places match these filters. Try a wider price range.</p> : null}
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
            <button type="button" key={restaurant.id} className={`restaurant-marker marker-${index + 1} ${restaurant.id === selected?.id ? 'active' : ''} ${restaurant.recognition ? 'guide' : ''}`} onClick={() => setSelectedId(restaurant.id)} aria-label={`Select ${restaurant.name}`}>
              <span>{restaurant.rating.toFixed(1)}</span>
            </button>
          ))}
          <span className="user-location"><i />You</span>

          {selected ? (
            <article className="map-preview">
              <Link className="map-preview-img" href={`/restaurants/${selected.slug}`}><Image src={selected.image} alt={selected.name} width={380} height={320} loading="eager" /></Link>
              <div>
                <span className="map-preview-top"><small>{selected.cuisine}</small><span className="rating"><Star size={12} fill="currentColor" /> {selected.rating.toFixed(1)}</span></span>
                <h3>{selected.name}</h3>
                <p>{selected.neighbourhood} · {selected.price} · {selected.distance}</p>
                <div className="card-reason"><span>✦</span>{selected.reason}</div>
                <Link href={`/restaurants/${selected.slug}`}>View details <ArrowRight aria-hidden="true" size={15} /></Link>
              </div>
            </article>
          ) : (
            <div className="map-empty-overlay">
              <strong>No places found</strong>
              <span>Clear a filter or widen the price range.</span>
            </div>
          )}
          <div className="map-legend"><span><i className="legend-high" />4.5+ great</span><span><i className="legend-mid" />4.0+ good</span><span><i className="legend-low" />Under 4.0</span></div>
        </section>
      </div>
    </div>
  )
}
