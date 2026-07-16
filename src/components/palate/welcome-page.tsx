import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import { logoutAction } from '@/app/(auth)/actions'
import { Avatar } from '@/components/palate/avatar'
import { ThemeToggle } from '@/components/palate/theme-toggle'
import { getFirstName, type ViewerProfile } from '@/lib/auth/profile'
import { images } from '@/lib/palate/demo-data'

export function WelcomePage({ viewer }: { viewer: ViewerProfile | null }) {
  const continueHref = viewer?.onboardingCompleted ? '/discover' : '/onboarding'
  const profileHref = viewer?.onboardingCompleted ? viewer.profileHref : '/onboarding'

  return (
    <div className="landing">
      <header className="landing-nav">
        <Link className="wordmark" href="/" aria-label="Palate welcome page">Palate<span>.</span></Link>
        <nav aria-label="Account navigation">
          {viewer ? (
            <form action={logoutAction}>
              <button className="text-button" type="submit">Sign out</button>
            </form>
          ) : (
            <Link className="text-button" href="/login">Sign in</Link>
          )}
          <Link className="button dark small-button" href={viewer ? continueHref : '/signup'}>
            {viewer ? `Continue as ${getFirstName(viewer.displayName)}` : 'Create profile'}
          </Link>
          <ThemeToggle />
        </nav>
      </header>

      <main className="landing-hero">
        <section className="hero-copy">
          <p className="eyebrow">Your city, through your taste</p>
          <h1>Good<br />restaurants.<br /><em>Better reasons.</em></h1>
          <p>Discover places you’ll actually love, remember every table, and find the one restaurant your whole group can agree on.</p>
          <div className="hero-buttons">
            <Link className="button wine" href="/discover">Explore the demo <ArrowRight aria-hidden="true" /></Link>
            <Link className="button ghost" href={viewer ? profileHref : '/signup'}>
              {viewer ? 'Open your taste profile' : 'Build your taste profile'}
            </Link>
          </div>
          <div className="hero-trust">
            <div className="avatar-stack" aria-hidden="true">
              <Avatar initials={viewer?.initials ?? 'MC'} tone="wine" small />
              <Avatar initials="EB" tone="olive" small />
              <Avatar initials="PS" tone="amber" small />
            </div>
            <span>Built around <strong>your taste</strong>, not generic rankings.</span>
          </div>
        </section>

        <section className="hero-visual" aria-label="A sample Palate recommendation">
          <div className="hero-photo">
            <Image src={images.plate} alt="A colourful restaurant dish" width={1200} height={1500} priority />
          </div>
          <div className="hero-dots" aria-hidden="true"><span /><span /><span /><span /></div>
          <div className="floating-note">
            <Sparkles className="note-icon" aria-hidden="true" size={18} />
            <p><strong>Why it fits</strong><br />Warm date-night energy, excellent pasta, and everyone’s within budget.</p>
          </div>
          <div className="floating-match">
            <div className="match-ring"><strong>94%</strong><span>match</span></div>
            <div><span>Friday’s Blend</span><strong>Giulietta</strong><small>Italian · Little Italy · $$$</small></div>
          </div>
        </section>
      </main>

      <div className="landing-strip" aria-label="Palate features">
        <span>DISCOVER</span><i /><span>REMEMBER</span><i /><span>REVIEW</span><i /><span>BLEND</span><i /><span>DECIDE</span>
      </div>
    </div>
  )
}
