import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Sparkles, Users, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

type Restaurant = {
  id: string
  slug: string
  name: string
  cuisines: string[]
  neighbourhood: string | null
  price_level: number
  average_rating: number
  review_count: number
  hero_image_url: string | null
  vibe_tags: string[]
}

export default async function Home() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('restaurants')
    .select('id, slug, name, cuisines, neighbourhood, price_level, average_rating, review_count, hero_image_url, vibe_tags')
    .order('average_rating', { ascending: false })
    .limit(6)

  const restaurants = (data ?? []) as Restaurant[]

  return (
    <main className="min-h-screen bg-[#f4efe6] text-[#201c18]">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-8">
        <Link href="/" className="text-2xl font-semibold tracking-[-0.04em]">Palate.</Link>
        <div className="flex items-center gap-3">
          <Link href="/login" className="rounded-full border border-black/10 bg-white/70 px-4 py-2 text-sm font-medium">Sign in</Link>
          <Link href="/blend" className="rounded-full bg-[#1f3a31] px-4 py-2 text-sm font-medium text-white">Start a Blend</Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 pb-10 pt-8 md:grid-cols-[1.2fr_.8fr] md:px-8 md:pb-16 md:pt-16">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#eadfcf] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#6f4b3e]">
            <Sparkles size={14} /> Taste, together
          </div>
          <h1 className="max-w-3xl text-5xl font-semibold leading-[0.95] tracking-[-0.055em] md:text-7xl">Find restaurants your whole table will love.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-black/60">Log every meal, build your taste profile, follow friends, and blend everyone’s preferences when nobody can decide where to eat.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/discover" className="inline-flex items-center gap-2 rounded-full bg-[#6b2637] px-5 py-3 font-medium text-white">Discover restaurants <ArrowRight size={18} /></Link>
            <Link href="/blend" className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-5 py-3 font-medium"><Users size={18} /> Blend tastes</Link>
          </div>
        </div>
        <div className="rounded-[2rem] bg-[#1f3a31] p-5 text-white shadow-2xl shadow-black/10 md:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">Tonight’s blend</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">Julian + Omar + Sarah</h2>
          <div className="mt-8 space-y-3">
            {['Japanese · Premium casual', 'Under 8 km', 'Great for groups'].map((item, index) => (
              <div key={item} className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
                <span>{item}</span><span className="text-white/50">0{index + 1}</span>
              </div>
            ))}
          </div>
          <button className="mt-6 w-full rounded-2xl bg-[#e7c98b] px-5 py-4 font-semibold text-[#201c18]">Pick for us</button>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-20 md:px-8">
        <div className="mb-6 flex items-end justify-between">
          <div><p className="text-sm text-black/45">Personalized for Toronto</p><h2 className="text-3xl font-semibold tracking-[-0.04em]">Top picks right now</h2></div>
          <Link href="/discover" className="text-sm font-semibold">View all</Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {restaurants.map((restaurant) => (
            <article key={restaurant.id} className="overflow-hidden rounded-[1.6rem] bg-white shadow-sm ring-1 ring-black/5">
              <div className="relative aspect-[4/3] bg-[#ded6c8]">
                {restaurant.hero_image_url && <Image src={restaurant.hero_image_url} alt={restaurant.name} fill className="object-cover" />}
                <div className="absolute right-3 top-3 rounded-full bg-white px-3 py-1.5 text-sm font-bold text-[#1f3a31]">{restaurant.average_rating}</div>
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-4"><h3 className="text-xl font-semibold tracking-[-0.03em]">{restaurant.name}</h3><span className="text-sm text-black/45">{'$'.repeat(restaurant.price_level)}</span></div>
                <p className="mt-2 text-sm text-black/55">{restaurant.cuisines.join(' · ')}</p>
                <div className="mt-4 flex items-center gap-2 text-sm text-black/45"><MapPin size={15} />{restaurant.neighbourhood ?? 'Toronto'} · {restaurant.review_count} reviews</div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
