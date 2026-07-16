import type { ReactNode } from 'react'
import { PalateShellClient } from '@/components/palate/app-shell-client'
import { getOptionalViewerProfile } from '@/lib/auth/server'
import type { ViewerProfile } from '@/lib/auth/profile'

export async function PalateShell({
  children,
  viewer: providedViewer,
}: {
  children: ReactNode
  viewer?: ViewerProfile | null
}) {
  const viewer = providedViewer === undefined
    ? await getOptionalViewerProfile()
    : providedViewer

  return <PalateShellClient viewer={viewer}>{children}</PalateShellClient>
}
