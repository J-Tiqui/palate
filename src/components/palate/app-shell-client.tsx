'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'
import {
  Bell,
  Bookmark,
  ChevronRight,
  Compass,
  Heart,
  List,
  LogIn,
  LogOut,
  Map,
  Menu,
  Search,
  Sparkles,
  Star,
  Target,
  UserRound,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { logoutAction } from '@/app/(auth)/actions'
import { Avatar } from '@/components/palate/avatar'
import { ThemeToggle } from '@/components/palate/theme-toggle'
import { getFirstName, type ViewerProfile } from '@/lib/auth/profile'

function getDesktopNavigation(profileHref: string) {
  return [
    { href: '/discover', label: 'Discover', icon: Compass },
    { href: '/map', label: 'Map', icon: Map },
    { href: '/blend', label: 'Blend', icon: Sparkles, badge: 'New' },
    { href: '/activity', label: 'Activity', icon: Heart },
    { href: '/lists', label: 'Lists', icon: List },
    { href: '/goals', label: 'Goals', icon: Target },
    { href: profileHref, label: 'Profile', icon: UserRound },
  ]
}

function isActivePath(pathname: string, href: string) {
  if (href === '/discover') return pathname.startsWith('/discover')
  if (href.startsWith('/login')) return false
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function PalateShellClient({ children, viewer }: { children: ReactNode; viewer: ViewerProfile | null }) {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const noticeTimer = useRef<number | null>(null)
  const profileHref = viewer?.profileHref ?? '/login?next=%2Fonboarding'
  const desktopNavigation = getDesktopNavigation(profileHref)
  const mobileNavigation = desktopNavigation.slice(0, 4)

  useEffect(() => () => {
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current)
  }, [])

  function showNotice(message: string) {
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current)
    setNotice(message)
    noticeTimer.current = window.setTimeout(() => setNotice(''), 2600)
  }

  const moreIsActive = ['/lists', '/goals', '/profile', '/recap', '/saved'].some((route) => pathname.startsWith(route))

  return (
    <div className="app-shell">
      <aside className="side-nav">
        <Link className="wordmark" href="/" aria-label="Palate welcome page">
          Palate<span>.</span>
        </Link>
        <nav aria-label="Main navigation">
          {desktopNavigation.map(({ href, label, icon: Icon, ...item }) => (
            <Link key={label} href={href} className={isActivePath(pathname, href) ? 'active' : ''}>
              <Icon aria-hidden="true" />
              <span>{label}</span>
              {'badge' in item && item.badge ? <em>{item.badge}</em> : null}
            </Link>
          ))}
        </nav>
        <div className="side-profile">
          <Avatar initials={viewer?.initials ?? 'P'} />
          <div>
            <strong>{viewer ? getFirstName(viewer.displayName) : 'Guest'}</strong>
            <span>{viewer?.username ? `@${viewer.username}` : viewer ? 'Finish your taste profile' : 'Sign in to personalize'}</span>
          </div>
          {viewer ? (
            <form action={logoutAction}>
              <button type="submit" aria-label="Sign out and switch profile"><LogOut aria-hidden="true" /></button>
            </form>
          ) : (
            <Link href="/login?next=%2Fdiscover" aria-label="Sign in"><LogIn aria-hidden="true" /></Link>
          )}
        </div>
      </aside>

      <div className="app-column">
        <header className="app-header">
          <Link className="mobile-wordmark" href="/">
            Palate<span>.</span>
          </Link>
          <form className="search-box" action="/discover">
            <Search aria-hidden="true" size={18} />
            <input name="q" aria-label="Search restaurants, cuisines, or friends" placeholder="Search restaurants, cuisines, or friends" />
          </form>
          <div className="header-actions">
            <ThemeToggle />
            <button className="icon-button notification" type="button" onClick={() => showNotice('You’re all caught up')} aria-label="Notifications">
              <Bell aria-hidden="true" />
              <span />
            </button>
            {viewer ? (
              <Link href={profileHref} aria-label={`Open ${viewer.displayName}'s profile`}><Avatar initials={viewer.initials} small /></Link>
            ) : (
              <Link className="icon-button" href="/login?next=%2Fdiscover" aria-label="Sign in"><LogIn aria-hidden="true" /></Link>
            )}
          </div>
        </header>
        <main className={`app-main page-${pathname.split('/')[1] || 'discover'}`}>{children}</main>
      </div>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {mobileNavigation.map(({ href, label, icon: Icon }) => (
          <Link key={label} href={href} className={`${isActivePath(pathname, href) ? 'active' : ''} ${href === '/blend' ? 'blend-tab' : ''}`}>
            <span className="mobile-icon"><Icon aria-hidden="true" /></span>
            <em>{label}</em>
          </Link>
        ))}
        <button type="button" className={moreOpen || moreIsActive ? 'active' : ''} onClick={() => setMoreOpen(true)}>
          <span className="mobile-icon"><Menu aria-hidden="true" /></span>
          <em>More</em>
        </button>
      </nav>

      {moreOpen ? (
        <div className="sheet-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setMoreOpen(false)}>
          <section className="more-sheet" aria-modal="true" role="dialog" aria-labelledby="more-title">
            <div className="sheet-handle" />
            <div className="sheet-title">
              <div><p>Your Palate</p><h2 id="more-title">More</h2></div>
              <button className="icon-button" type="button" onClick={() => setMoreOpen(false)} aria-label="Close menu"><X /></button>
            </div>
            <MoreLink href="/lists" icon={List} title="Lists" description="Saved collections and Want to Try" onClick={() => setMoreOpen(false)} />
            <MoreLink href="/goals" icon={Target} title="Goals" description="Track your dining milestones" onClick={() => setMoreOpen(false)} />
            <MoreLink href={profileHref} icon={UserRound} title={viewer ? 'Profile' : 'Sign in'} description={viewer ? 'Taste profile, stats, and recap' : 'Open your own Palate profile'} onClick={() => setMoreOpen(false)} />
            <MoreLink href="/saved" icon={Bookmark} title="Saved" description="Restaurants you want to remember" onClick={() => setMoreOpen(false)} />
            {viewer ? <MoreLink href="/recap" icon={Star} title="2026 Food Recap" description="Your year at the table" onClick={() => setMoreOpen(false)} /> : null}
            {viewer ? (
              <form action={logoutAction}>
                <button className="more-link" type="submit">
                  <span><LogOut aria-hidden="true" /></span>
                  <div><strong>Switch profile</strong><small>Sign out and use another account</small></div>
                  <ChevronRight aria-hidden="true" />
                </button>
              </form>
            ) : null}
          </section>
        </div>
      ) : null}

      {notice ? <div className="toast"><Sparkles aria-hidden="true" size={17} />{notice}</div> : null}
    </div>
  )
}

function MoreLink({ href, icon: Icon, title, description, onClick }: {
  href: string
  icon: LucideIcon
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <Link className="more-link" href={href} onClick={onClick}>
      <span><Icon aria-hidden="true" /></span>
      <div><strong>{title}</strong><small>{description}</small></div>
      <ChevronRight aria-hidden="true" />
    </Link>
  )
}
