import 'server-only'

const PRODUCTION_URL = 'https://palateblend.com'
const LOCAL_URL = 'http://localhost:3000'

function normalizeOrigin(value: string): string | null {
  try {
    const withProtocol = value.startsWith('http://') || value.startsWith('https://')
      ? value
      : `https://${value}`
    const url = new URL(withProtocol)
    if (url.protocol !== 'https:' && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
      return null
    }
    return url.origin
  } catch {
    return null
  }
}

export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL
    ? normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL)
    : null

  if (configured) return configured

  const vercelUrl = process.env.VERCEL_URL
    ? normalizeOrigin(process.env.VERCEL_URL)
    : null

  if (vercelUrl) return vercelUrl
  return process.env.NODE_ENV === 'production' ? PRODUCTION_URL : LOCAL_URL
}
