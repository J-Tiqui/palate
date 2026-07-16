import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Edit3, Share2, Sparkles } from 'lucide-react'
import { notFound } from 'next/navigation'
import { PalateShell } from '@/components/palate/app-shell'
import { Avatar } from '@/components/palate/avatar'
import { getProfileInitials } from '@/lib/auth/profile'
import { getOptionalViewerProfile } from '@/lib/auth/server'
import { hasSupabaseEnv } from '@/lib/env/public'
import { demoFriends } from '@/lib/palate/demo-data'
import { createClient } from '@/lib/supabase/server'

type RecentReview = {
  id: string
  restaurantName: string
  restaurantSlug: string
  restaurantImage: string | null
  rating: number
  reviewText: string
  visitDate: string
  wouldReturn: boolean | null
}

type ProfileData = {
  id: string
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
  recentReviews: RecentReview[]
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const viewer = await getOptionalViewerProfile()
  let profile: ProfileData | null = null

  if (hasSupabaseEnv()) {
    const supabase = await createClient()
    const { data: row } = await supabase
      .from('profiles')
      .select('id, username, display_name, home_city, favourite_cuisines, preferred_vibes, created_at')
      .eq('username', username)
      .maybeSingle()

    if (row?.username) {
      const [visits, saved, reviews, lists, recentReviewResult] = await Promise.all([
        supabase.from('visits').select('id', { count: 'exact', head: true }).eq('user_id', row.id),
        supabase.from('saved_restaurants').select('restaurant_id', { count: 'exact', head: true }).eq('user_id', row.id),
        supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('user_id', row.id),
        supabase.from('lists').select('id', { count: 'exact', head: true }).eq('owner_id', row.id),
        supabase
          .from('reviews')
          .select('id, restaurant_id, rating, review_text, visit_date, would_return')
          .eq('user_id', row.id)
          .order('visit_date', { ascending: false })
          .limit(2),
      ])

      const reviewRows = recentReviewResult.data ?? []
      const restaurantIds = [...new Set(reviewRows.map((review) => review.restaurant_id))]
      const { data: restaurants } = restaurantIds.length
        ? await supabase
          .from('restaurants')
          .select('id, slug, name, hero_image_url')
          .in('id', restaurantIds)
        : { data: [] }
      const restaurantById = new Map((restaurants ?? []).map((restaurant) => [restaurant.id, restaurant]))
      const recentReviews = reviewRows.flatMap((review) => {
        const restaurant = restaurantById.get(review.restaurant_id)
        if (!restaurant) return []
        return [{
          id: review.id,
          restaurantName: restaurant.name,
          restaurantSlug: restaurant.slug,
          restaurantImage: restaurant.hero_image_url,
          rating: review.rating,
          reviewText: review.review_text,
          visitDate: review.visit_date,
          wouldReturn: review.would_return,
        }]
      })

      profile = {
        id: row.id,
        username: row.username,
        displayName: row.display_name,
        city: row.home_city || 'Toronto',
        joined: new Date(row.created_at).toLocaleDateString('en-CA', { month: 'long', year: 'numeric' }),
        cuisines: row.favourite_cuisines,
        vibes: row.preferred_vibes,
        visited: visits.count ?? 0,
        saved: saved.count ?? 0,
        reviews: reviews.count ?? 0,
        lists: lists.count ?? 0,
        recentReviews,
      }
    }
  }

  if (!profile) notFound()

  const isOwner = viewer?.id === profile.id
  const initials = getProfileInitials(profile.displayName)
  const personality = profile.cuisines[0] ? `${profile.cuisines[0]} Explorer` : 'Taste Explorer'
  const tasteDescription = [
    profile.cuisines.slice(0, 3).join(', '),
    profile.vibes.slice(0, 2).join(' and '),
  ].filter(Boolean).join(' · ') || 'This member is still building their taste profile.'

  return (
    <PalateShell viewer={viewer}>
      <div className="profile-page">
        <section className="profile-hero">
          <div className="profile-avatar">{initials}<span>✦</span></div>
          <div className="profile-title">
            <p className="eyebrow">{isOwner ? 'Your Palate' : `@${profile.username}`}</p>
            <h1>{profile.displayName}</h1>
            <p>{profile.city} · Joined {profile.joined}</p>
            <div className="profile-actions">
              {isOwner ? <Link className="button cream" href="/profile/edit"><Edit3 />Edit profile</Link> : null}
              <button className="button light-button" aria-label={`Share ${profile.displayName}'s profile`}><Share2 /></button>
            </div>
          </div>
          <div className="personality-card">
            <span>FOOD PERSONALITY</span><h2>{personality}</h2><p>{tasteDescription}</p>
            {isOwner ? <Link href="/onboarding">Update taste profile <ArrowRight size={14} /></Link> : null}
          </div>
        </section>
        <section className="profile-stats">
          <div><strong>{profile.visited}</strong><span>visited</span></div><div><strong>{profile.saved}</strong><span>want to try</span></div><div><strong>{profile.reviews}</strong><span>reviews</span></div><div><strong>{profile.lists}</strong><span>lists</span></div>
        </section>
        <div className={`profile-body ${isOwner ? '' : 'profile-body-public'}`}>
          <div className="profile-main">
            <section>
              <div className="section-heading compact">
                <div><p className="eyebrow">Taste at a glance</p><h2>What {isOwner ? 'you' : profile.displayName} comes back to</h2></div>
                {isOwner ? <Link href="/profile/edit">Edit</Link> : null}
              </div>
              <div className="taste-grid">
                <div><span>TOP CUISINES</span>{profile.cuisines.length ? profile.cuisines.slice(0, 3).map((cuisine) => <strong key={cuisine}>{cuisine}</strong>) : <strong>Still exploring</strong>}</div>
                <div><span>FAVOURITE VIBES</span>{profile.vibes.length ? profile.vibes.slice(0, 3).map((vibe) => <strong key={vibe}>{vibe}</strong>) : <strong>Still exploring</strong>}</div>
                <div><span>HOME BASE</span><strong>{profile.city}</strong><strong>{profile.cuisines.length} favourite cuisines</strong><strong>{profile.vibes.length} saved vibes</strong></div>
              </div>
            </section>
            <section>
              <div className="section-heading compact"><div><h2>Recent reviews</h2><p>{isOwner ? 'Your latest notes' : `${profile.displayName}’s latest notes`} from around {profile.city}</p></div>{isOwner ? <Link href="/activity">See all</Link> : null}</div>
              {profile.recentReviews.length ? (
                <div className="profile-reviews">
                  {profile.recentReviews.map((review) => (
                    <article key={review.id}>
                      <Link href={`/restaurants/${review.restaurantSlug}`}>
                        {review.restaurantImage
                          ? <Image src={review.restaurantImage} alt={review.restaurantName} width={200} height={180} />
                          : <span className="review-image-placeholder" aria-hidden="true">✦</span>}
                      </Link>
                      <div><div><h3>{review.restaurantName}</h3><span className="rating">★ {review.rating.toFixed(1)}</span></div><p>{review.reviewText}</p><small>{new Date(review.visitDate).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })} · {review.wouldReturn === true ? 'Would return' : review.wouldReturn === false ? 'Would not return' : 'Return undecided'}</small></div>
                    </article>
                  ))}
                </div>
              ) : <p className="empty-profile-copy">No reviews shared yet.</p>}
            </section>
          </div>
          {isOwner ? (
            <aside className="profile-aside">
              <Link className="recap-teaser" href="/recap"><span className="recap-year">20<br />26</span><div><p>YOUR FOOD YEAR</p><h3>So far, you’ve had excellent taste.</h3><span>Open recap <ArrowRight size={14} /></span></div></Link>
              <section className="compatibility-card"><p className="eyebrow">Preview</p><h3>Friend compatibility</h3>{demoFriends.slice(0, 3).map((friend) => <div key={friend.name}><Avatar initials={friend.initials} tone={friend.tone} small /><span><strong>{friend.name}</strong><small>{friend.taste}</small></span><b>{friend.compatibility}%</b></div>)}</section>
              <section className="active-goal-mini"><Sparkles /><h3>One dinner can move four goals.</h3><Link href="/goals">See your next best move <ArrowRight size={14} /></Link></section>
            </aside>
          ) : null}
        </div>
      </div>
    </PalateShell>
  )
}
