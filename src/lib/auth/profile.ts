export type ViewerProfile = {
  id: string
  username: string | null
  displayName: string
  initials: string
  profileHref: string
  onboardingCompleted: boolean
}

export function getProfileInitials(displayName: string, email?: string | null): string {
  const source = displayName.trim() || email?.split('@')[0]?.trim() || 'Palate member'
  const words = source.split(/\s+/).filter(Boolean)

  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return `${words[0][0]}${words.at(-1)?.[0] ?? ''}`.toUpperCase()
}

export function getProfileHref(username: string | null): string {
  return username ? `/profile/${encodeURIComponent(username)}` : '/onboarding'
}

export function getFirstName(displayName: string): string {
  return displayName.trim().split(/\s+/)[0] || 'friend'
}
