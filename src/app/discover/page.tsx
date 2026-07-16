import { PalateShell } from '@/components/palate/app-shell'
import { DiscoverView } from '@/components/palate/discover-view'
import { getOptionalViewerProfile } from '@/lib/auth/server'
import { getDiscoveryData } from '@/lib/palate/restaurants'
import { searchQuerySchema } from '@/lib/validation/schemas'

export default async function DiscoverPage({ searchParams }: {
  searchParams: Promise<{ q?: string }>
}) {
  const params = await searchParams
  const search = searchQuerySchema.parse(params.q ?? '')
  const [data, viewer] = await Promise.all([
    getDiscoveryData({ search, limit: 30 }),
    getOptionalViewerProfile(),
  ])
  return <PalateShell viewer={viewer}><DiscoverView {...data} viewer={viewer} /></PalateShell>
}
