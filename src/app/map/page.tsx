import { PalateShell } from '@/components/palate/app-shell'
import { MapView } from '@/components/palate/map-view'
import { getDiscoveryData } from '@/lib/palate/restaurants'

export default async function MapPage() {
  const { restaurants, savedIds, isDemo, error } = await getDiscoveryData({ limit: 30 })
  return (
    <PalateShell>
      <MapView
        restaurants={restaurants}
        savedIds={[...savedIds]}
        isDemo={isDemo}
        error={error}
      />
    </PalateShell>
  )
}
