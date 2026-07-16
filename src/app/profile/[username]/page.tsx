import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Edit3, Share2, Sparkles } from 'lucide-react'
import { notFound } from 'next/navigation'
import { Avatar, PalateShell } from '@/components/palate/app-shell'
import { hasSupabaseEnv } from '@/lib/env/public'
import { demoFriends, demoRestaurants } from '@/lib/palate/demo-data'
import { createClient } from '@/lib/supabase/server'

type ProfileData = {
  id?: string
  username: string
  displayName: string
  city: string
  joined: string
  cuisines: string[]
  vibes: string[]
  visited: number
  saved: number
  reviews: number
  lists: number
  isDemo: boolean
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  let profile: ProfileData | null = null

  if (hasSupabaseEnv()) {
    const supabase = await createClient()
    const { data: row } = await supabase.from('profiles').select('id, username, display_name, home_city, favourite_cuisines, preferred_vibes, created_at').eq('username', username).maybeSingle()
    if (row) {
      const [visits, saved, reviews, lists] = await Promise.all([
        supabase.from('visits').select('id', { count: 'exact', head: true }).eq('user_id', row.id),
        supabase.from('saved_restaurants').select('restaurant_id', { count: 'exact', head: true }).eq('user_id', row.id),
        supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('user_id', row.id),
        supabase.from('lists').select('id', { count: 'exact', head: true }).eq('owner_id', row.id),
      ])
      profile = {
        id: row.id,
        username: row.username || username,
        displayName: row.display_name,
        city: row.home_city || 'Toronto',
        joined: new Date(row.created_at).toLocaleDateString('en-CA', { month: 'long', year: 'numeric' }),
        cuisines: row.favourite_cuisines,
        vibes: row.preferred_vibes,
        visited: visits.count ?? 0,
        saved: saved.count ?? 0,
        reviews: reviews.count ?? 0,
        lists: lists.count ?? 0,
        isDemo: false,
      }
    }
  }

  if (!profile && username !== 'julian') notFound()
  profile ??= {
    username: 'julian',
    displayName: 'Julian Tiqui',
    city: 'Toronto',
    joined: 'July 2026',
    cuisines: ['Japanese', 'Italian', 'Korean'],
    vibes: ['Date night', 'Premium casual', 'Neighbourhood'],
    visited: 47,
    saved: 18,
    reviews: 31,
    lists: 12,
    isDemo: true,
  }

  return (
    <PalateShell>
      <div className="profile-page">
        <section className="profile-hero">
          <div className="profile-avatar">JT<span>✦</span></div>
          <div className="profile-title">
            <p className="eyebrow">Your Palate</p><h1>{profile.displayName}</h1><p>{profile.city} · Joined {profile.joined}</p>
            <div className="profile-actions"><Link className="button cream" href="/profile/edit"><Edit3 />Edit profile</Link><button className="button light-button" aria-label="Share profile"><Share2 /></button></div>
          </div>
          <div className="personality-card"><span>FOOD PERSONALITY</span><h2>Premium Casual Explorer</h2><p>Polished Japanese, Italian, and Korean restaurants, neighbourhood gems, and date-night rooms with just enough energy.</p><Link href="/onboarding">View taste profile <ArrowRight size={14} /></Link></div>
        </section>
        <section className="profile-stats">
          <div><strong>{profile.visited}</strong><span>visited</span></div><div><strong>{profile.saved}</strong><span>want to try</span></div><div><strong>{profile.reviews}</strong><span>reviews</span></div><div><strong>{profile.lists}</strong><span>lists</span></div>
        </section>
        <div className="profile-body">
          <div className="profile-main">
            {profile.isDemo ? <p className="mb-6 text-xs text-[var(--muted)]">Prototype profile data is clearly separated from live account data.</p> : null}
            <section>
              <div className="section-heading compact"><div><p className="eyebrow">Taste at a glance</p><h2>What you come back to</h2></div><Link href="/profile/edit">Edit</Link></div>
              <div className="taste-grid">
                <div><span>TOP CUISINES</span>{profile.cuisines.slice(0, 3).map((cuisine) => <strong key={cuisine}>{cuisine}</strong>)}</div>
                <div><span>FAVOURITE VIBES</span>{profile.vibes.slice(0, 3).map((vibe) => <strong key={vibe}>{vibe}</strong>)}</div>
                <div><span>YOUR RANGE</span><strong>$$–$$$</strong><strong>Medium–high spice</strong><strong>Usually 2–4 people</strong></div>
              </div>
            </section>
            <section>
              <div className="section-heading compact"><div><h2>Recent reviews</h2><p>Your latest notes from around Toronto</p></div><Link href="/activity">See all</Link></div>
              <div className="profile-reviews">
                {demoRestaurants.filter((restaurant) => ['giulietta', 'pai'].includes(restaurant.slug)).map((restaurant) => (
                  <article key={restaurant.id}>
                    <Link href={`/restaurants/${restaurant.slug}`}><Image src={restaurant.image} alt={restaurant.name} width={200} height={180} /></Link>
                    <div><div><h3>{restaurant.name}</h3><span className="rating">★ {restaurant.slug === 'giulietta' ? '4.8' : '4.3'}</span></div><p>{restaurant.slug === 'giulietta' ? 'Warm, confident, and worth making a night of it. The pasta really was that good.' : 'Big flavours and properly lively. Best with a group that wants to share.'}</p><small>{restaurant.slug === 'giulietta' ? 'July 11' : 'June 28'} · Would return</small></div>
                  </article>
                ))}
              </div>
            </section>
          </div>
          <aside className="profile-aside">
            <Link className="recap-teaser" href="/recap"><span className="recap-year">20<br />26</span><div><p>YOUR FOOD YEAR</p><h3>So far, you’ve had excellent taste.</h3><span>Open recap <ArrowRight size={14} /></span></div></Link>
            <section className="compatibility-card"><p className="eyebrow">Your closest tastes</p><h3>Friend compatibility</h3>{demoFriends.slice(0, 3).map((friend) => <div key={friend.name}><Avatar initials={friend.initials} tone={friend.tone} small /><span><strong>{friend.name}</strong><small>{friend.taste}</small></span><b>{friend.compatibility}%</b></div>)}</section>
            <section className="active-goal-mini"><Sparkles /><h3>One dinner can move four goals.</h3><Link href="/goals">See your next best move <ArrowRight size={14} /></Link></section>
          </aside>
        </div>
      </div>
    </PalateShell>
  )
}
