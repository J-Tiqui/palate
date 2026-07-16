import { WelcomePage } from '@/components/palate/welcome-page'
import { getOptionalViewerProfile } from '@/lib/auth/server'

export default async function HomePage() {
  const viewer = await getOptionalViewerProfile()
  return <WelcomePage viewer={viewer} />
}
