'use client'

import { importLibrary, setOptions } from '@googlemaps/js-api-loader'
import { LocateFixed } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { PalateRestaurant } from '@/lib/palate/demo-data'

const TORONTO_CENTER = { lat: 43.6532, lng: -79.3832 }

let configuredKey: string | null = null
let librariesPromise: Promise<{
  maps: google.maps.MapsLibrary
  marker: google.maps.MarkerLibrary
}> | null = null

function loadGoogleMaps(apiKey: string) {
  if (!librariesPromise || configuredKey !== apiKey) {
    configuredKey = apiKey
    setOptions({ key: apiKey, v: 'weekly' })
    librariesPromise = Promise.all([
      importLibrary('maps') as Promise<google.maps.MapsLibrary>,
      importLibrary('marker') as Promise<google.maps.MarkerLibrary>,
    ]).then(([maps, marker]) => ({ maps, marker }))
  }
  return librariesPromise
}

type GoogleMapCanvasProps = {
  apiKey: string
  restaurants: PalateRestaurant[]
  selectedId?: string
  onSelect: (restaurantId: string) => void
}

export function GoogleMapCanvas({ apiKey, restaurants, selectedId, onSelect }: GoogleMapCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const markerLibraryRef = useRef<google.maps.MarkerLibrary | null>(null)
  const markersRef = useRef(new Map<string, {
    marker: google.maps.marker.AdvancedMarkerElement
    pin: google.maps.marker.PinElement
  }>())
  const locationMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(apiKey ? 'loading' : 'error')
  const [locationMessage, setLocationMessage] = useState('')
  const mappedRestaurantCount = restaurants.filter(
    (restaurant) => restaurant.latitude != null && restaurant.longitude != null,
  ).length

  useEffect(() => {
    if (!apiKey || !canvasRef.current) return

    let active = true
    const markers = markersRef.current
    loadGoogleMaps(apiKey)
      .then(({ maps, marker }) => {
        if (!active || !canvasRef.current) return
        markerLibraryRef.current = marker
        mapRef.current = new maps.Map(canvasRef.current, {
          center: TORONTO_CENTER,
          zoom: 13,
          mapId: 'DEMO_MAP_ID',
          clickableIcons: false,
          fullscreenControl: true,
          gestureHandling: 'greedy',
          mapTypeControl: false,
          streetViewControl: false,
        })
        setStatus('ready')
      })
      .catch((error: unknown) => {
        console.error('[map] Google Maps failed to load', { error: String(error) })
        if (active) setStatus('error')
      })

    return () => {
      active = false
      markers.forEach(({ marker }) => { marker.map = null })
      markers.clear()
      if (locationMarkerRef.current) locationMarkerRef.current.map = null
      locationMarkerRef.current = null
      mapRef.current = null
    }
  }, [apiKey])

  useEffect(() => {
    const map = mapRef.current
    const markerLibrary = markerLibraryRef.current
    if (!map || !markerLibrary || status !== 'ready') return

    markersRef.current.forEach(({ marker }) => { marker.map = null })
    markersRef.current.clear()

    const bounds = new google.maps.LatLngBounds()
    let coordinateCount = 0
    restaurants.forEach((restaurant) => {
      if (restaurant.latitude == null || restaurant.longitude == null) return
      const position = { lat: restaurant.latitude, lng: restaurant.longitude }
      const pin = new markerLibrary.PinElement({
        background: '#762d3e',
        borderColor: '#fffdf8',
        glyphColor: '#fffdf8',
        glyphText: restaurant.rating > 0 ? restaurant.rating.toFixed(1) : 'New',
        scale: 1,
      })
      const mapMarker = new markerLibrary.AdvancedMarkerElement({
        map,
        position,
        title: restaurant.name,
        gmpClickable: true,
        zIndex: 1,
      })
      mapMarker.append(pin)
      mapMarker.addEventListener('gmp-click', () => onSelect(restaurant.id))
      markersRef.current.set(restaurant.id, { marker: mapMarker, pin })
      bounds.extend(position)
      coordinateCount += 1
    })

    if (coordinateCount > 1) {
      map.fitBounds(bounds, 54)
      google.maps.event.addListenerOnce(map, 'idle', () => {
        if ((map.getZoom() ?? 13) > 15) map.setZoom(15)
      })
    } else if (coordinateCount === 1) {
      map.setCenter(bounds.getCenter())
      map.setZoom(15)
    }
  }, [onSelect, restaurants, status])

  useEffect(() => {
    markersRef.current.forEach(({ marker, pin }, restaurantId) => {
      const selected = restaurantId === selectedId
      pin.background = selected ? '#54202d' : '#762d3e'
      pin.scale = selected ? 1.25 : 1
      marker.zIndex = selected ? 10 : 1
    })

    const selectedRestaurant = restaurants.find((restaurant) => restaurant.id === selectedId)
    if (selectedRestaurant?.latitude != null && selectedRestaurant.longitude != null) {
      mapRef.current?.panTo({ lat: selectedRestaurant.latitude, lng: selectedRestaurant.longitude })
    }
  }, [restaurants, selectedId, status])

  function locateUser() {
    if (!navigator.geolocation || !mapRef.current || !markerLibraryRef.current) {
      setLocationMessage('Location is not available in this browser.')
      return
    }

    setLocationMessage('Finding your location…')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const position = { lat: coords.latitude, lng: coords.longitude }
        const markerLibrary = markerLibraryRef.current
        if (!markerLibrary || !mapRef.current) return
        if (locationMarkerRef.current) locationMarkerRef.current.map = null
        const pin = new markerLibrary.PinElement({
          background: '#2f6fca',
          borderColor: '#ffffff',
          glyphColor: '#ffffff',
          glyphText: 'You',
        })
        locationMarkerRef.current = new markerLibrary.AdvancedMarkerElement({
          map: mapRef.current,
          position,
          title: 'Your location',
          zIndex: 20,
        })
        locationMarkerRef.current.append(pin)
        mapRef.current.setCenter(position)
        mapRef.current.setZoom(15)
        setLocationMessage('Map centred on your location.')
      },
      () => setLocationMessage('Allow location access to centre the map on you.'),
      { enableHighAccuracy: false, maximumAge: 300_000, timeout: 10_000 },
    )
  }

  return (
    <div className="google-map-shell" data-map-status={status} data-marker-count={mappedRestaurantCount}>
      <div ref={canvasRef} className="google-map-canvas" data-testid="google-map" aria-label="Interactive Google map of Toronto restaurants" />
      {status === 'loading' ? <div className="map-loading" role="status">Loading the map…</div> : null}
      {status === 'error' ? (
        <div className="map-service-error" role="alert">
          <strong>Google Maps could not load</strong>
          <span>Check the Maps JavaScript API and website restrictions for this domain.</span>
        </div>
      ) : null}
      {status === 'ready' && restaurants.length > 0 && mappedRestaurantCount === 0 ? (
        <div className="map-service-error" role="status">
          <strong>These listings are not mapped yet</strong>
          <span>Their coordinates need to be added before they can appear as pins.</span>
        </div>
      ) : null}
      {status === 'ready' ? (
        <button type="button" className="map-location-control" onClick={locateUser} aria-label="Centre map on my location">
          <LocateFixed aria-hidden="true" size={17} />
          <span>Locate me</span>
        </button>
      ) : null}
      <span className="sr-map-status" aria-live="polite">{locationMessage}</span>
    </div>
  )
}
