import { PalateShell } from '@/components/palate/app-shell'
import { BlendBuilder } from '@/components/palate/blend-builder'
import { getOptionalUser } from '@/lib/auth/server'

export default async function BlendPage() {
  const user = await getOptionalUser()
  return <PalateShell><BlendBuilder authenticated={Boolean(user)} /></PalateShell>
}
