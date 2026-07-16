import { PalateShell } from '@/components/palate/app-shell'
import { BlendBuilder } from '@/components/palate/blend-builder'
import { getOptionalViewerProfile } from '@/lib/auth/server'

export default async function BlendPage() {
  const viewer = await getOptionalViewerProfile()
  return <PalateShell viewer={viewer}><BlendBuilder authenticated={Boolean(viewer)} viewer={viewer} /></PalateShell>
}
