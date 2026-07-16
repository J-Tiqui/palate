'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Bell,
  Bookmark,
  ChevronRight,
  Compass,
  Heart,
  List,
  Map,
  Menu,
  Moon,
  Search,
  Sparkles,
  Star,
  Sun,
  Target,
  UserRound,
  X,
} from 'lucide-react'
import { useState } from 'react'

const desktopNavigation = [
  { href: '/discover', label: 'Discover', icon: Compass },
  { href: '/map', label: 'Map', icon: Map },
  { href: '/blend', label: 'Blend', icon: Sparkles, badge: 'New' },
  { href: '/activity', label: 'Activity', icon: Heart },
  { href: '/lists', label: 'Lists', icon: List },
  { href: '/goals', label: 'Goals', icon: Target },
  { href: '/profile/julian', label: 'Profile', icon: UserRound },
] as const

const mobileNavigation = desktopNavigation.slice(0, 4)

function Avatar({ initials = 'JT', tone = 'olive', small = false }: { initials?: string; tone?: string; small?: boolean }) {
  return <span className={`avatar ${tone} ${small ? 'small' : ''}`}>{initials}</span>
}

function isActivePath(pathname: string, href: string) {
  if (href === '/discover') return pathname === '/' || pathname.startsWith('/discover')
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function PalateShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)
  const [notice, setNotice] = useState('')

  function toggleTheme() {
    const currentTheme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
    const nextTheme = currentTheme === 'light' ? 'dark' : 'light'
    document.documentElement.dataset.theme = nextTheme
    window.localStorage.setItem('palate-theme', nextTheme)
  }

  function showNotice(message: string) {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 2600)
  }

  const moreIsActive = ['/lists', '/goals', '/profile', '/recap', '/saved'].some((route) => pathname.startsWith(route))

  return (
    <div className="app-shell">
      <aside className="side-nav">
        <Link className="wordmark" href="/discover" aria-label="Palate home">
          Palate<span>.</span>
        </Link>
        <nav aria-label="Main navigation">
          {desktopNavigation.map(({ href, label, icon: Icon, ...item }) => (
            <Link key={href} href={href} className={isActivePath(pathname, href) ? 'active' : ''}>
              <Icon aria-hidden="true" />
              <span>{label}</span>
              {'badge' in item && item.badge ? <em>{item.badge}</em> : null}
            </Link>
          ))}
        </nav>
        <div className="side-profile">
          <Avatar />
          <div>
            <strong>Julian</strong>
            <span>Premium Casual Explorer</span>
          </div>
          <Link href="/profile/julian" aria-label="Open your profile">
            <Menu aria-hidden="true" />
          </Link>
        </div>
      </aside>

      <div className="app-column">
        <header className="app-header">
          <Link className="mobile-wordmark" href="/discover">
            Palate<span>.</span>
          </Link>
          <form className="search-box" action="/discover">
            <Search aria-hidden="true" size={18} />
            <input name="q" aria-label="Search restaurants, cuisines, or friends" placeholder="Search restaurants, cuisines, or friends" />
          </form>
          <div className="header-actions">
            <button className="icon-button" type="button" onClick={toggleTheme} aria-label="Toggle colour theme">
              <Moon className="theme-icon-moon" aria-hidden="true" />
              <Sun className="theme-icon-sun" aria-hidden="true" />
            </button>
            <button className="icon-button notification" type="button" onClick={() => showNotice('You’re all caught up')} aria-label="Notifications">
              <Bell aria-hidden="true" />
              <span />
            </button>
            <Link href="/profile/julian" aria-label="Your profile"><Avatar small /></Link>
          </div>
        </header>
        <main className={`app-main page-${pathname.split('/')[1] || 'discover'}`}>{children}</main>
      </div>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {mobileNavigation.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={`${isActivePath(pathname, href) ? 'active' : ''} ${href === '/blend' ? 'blend-tab' : ''}`}>
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
            <MoreLink href="/profile/julian" icon={UserRound} title="Profile" description="Taste profile, stats, and recap" onClick={() => setMoreOpen(false)} />
            <MoreLink href="/saved" icon={Bookmark} title="Saved" description="Restaurants you want to remember" onClick={() => setMoreOpen(false)} />
            <MoreLink href="/recap" icon={Star} title="2026 Food Recap" description="Your year at the table" onClick={() => setMoreOpen(false)} />
          </section>
        </div>
      ) : null}

      {notice ? <div className="toast"><Sparkles aria-hidden="true" size={17} />{notice}</div> : null}
    </div>
  )
}

function MoreLink({ href, icon: Icon, title, description, onClick }: {
  href: string
  icon: typeof List
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

export { Avatar }
