import { PalateShell } from '@/components/palate/app-shell'
import { DiscoverView } from '@/components/palate/discover-view'
import { getDiscoveryData } from '@/lib/palate/restaurants'
import { searchQuerySchema } from '@/lib/validation/schemas'

export default async function DiscoverPage({ searchParams }: {
  searchParams: Promise<{ q?: string }>
}) {
  const params = await searchParams
  const search = searchQuerySchema.parse(params.q ?? '')
  const data = await getDiscoveryData({ search, limit: 30 })
  return <PalateShell><DiscoverView {...data} /></PalateShell>
}
