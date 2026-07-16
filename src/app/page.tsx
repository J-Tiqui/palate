import { PalateShell } from '@/components/palate/app-shell'
import { DiscoverView } from '@/components/palate/discover-view'
import { getDiscoveryData } from '@/lib/palate/restaurants'

export default async function HomePage() {
  const data = await getDiscoveryData({ limit: 30 })
  return <PalateShell><DiscoverView {...data} /></PalateShell>
}
