import { PalateShell } from '@/components/palate/app-shell'
import { MapView } from '@/components/palate/map-view'
import { getDiscoveryData } from '@/lib/palate/restaurants'

export default async function MapPage() {
  const { restaurants, isDemo } = await getDiscoveryData({ limit: 30 })
  return <PalateShell><MapView restaurants={restaurants} isDemo={isDemo} /></PalateShell>
}
