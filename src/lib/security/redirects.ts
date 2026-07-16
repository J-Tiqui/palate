const FALLBACK_PATH = '/discover'

function repeatedlyDecode(value: string): string {
  let decoded = value
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const next = decodeURIComponent(decoded)
      if (next === decoded) break
      decoded = next
    } catch {
      break
    }
  }
  return decoded
}

export function getSafeRedirectPath(
  value: string | null | undefined,
  fallback = FALLBACK_PATH,
): string {
  if (!value || value.length > 512 || /[\\\u0000-\u001f\u007f]/.test(value)) {
    return fallback
  }

  const decoded = repeatedlyDecode(value)
  if (!decoded.startsWith('/') || decoded.startsWith('//')) return fallback

  try {
    const base = new URL('https://palate.invalid')
    const destination = new URL(decoded, base)
    if (destination.origin !== base.origin) return fallback
    return `${destination.pathname}${destination.search}${destination.hash}`
  } catch {
    return fallback
  }
}
