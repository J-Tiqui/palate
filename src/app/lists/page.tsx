import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, MoreHorizontal, Plus } from 'lucide-react'
import { PalateShell } from '@/components/palate/app-shell'
import { Avatar } from '@/components/palate/avatar'
import { getOptionalViewerProfile } from '@/lib/auth/server'
import { hasSupabaseEnv } from '@/lib/env/public'
import { DEMO_NOTICE, demoLists, images } from '@/lib/palate/demo-data'
import { createClient } from '@/lib/supabase/server'

type ListCard = {
  id: string
  title: string
  count: number
  privacy: string
  images: readonly string[]
  shared: boolean
}

export default async function ListsPage() {
  const viewer = hasSupabaseEnv() ? await getOptionalViewerProfile() : null
  let cards: ListCard[] = []

  if (viewer) {
    const supabase = await createClient()
    const { data: lists } = await supabase
      .from('lists')
      .select('id, name, visibility, cover_url')
      .eq('owner_id', viewer.id)
      .order('updated_at', { ascending: false })
    const ids = (lists ?? []).map((list) => list.id)
    const { data: items } = ids.length
      ? await supabase.from('list_items').select('list_id').in('list_id', ids)
      : { data: [] }
    cards = (lists ?? []).map((list) => ({
      id: list.id,
      title: list.name,
      privacy: list.visibility,
      count: (items ?? []).filter((item) => item.list_id === list.id).length,
      images: list.cover_url ? [list.cover_url, images.dining, images.italian] : [images.japanese, images.grill, images.italian],
      shared: list.visibility === 'followers',
    }))
  }

  const isDemo = cards.length === 0
  const visibleCards = isDemo
    ? demoLists.map((list, index) => ({ ...list, id: `demo-${index + 1}`, shared: list.privacy === 'Shared' }))
    : cards

  return (
    <PalateShell viewer={viewer}>
      <div className="page-wrap lists-page">
        {isDemo ? <p className="mb-5 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-xs text-[var(--muted)]"><strong className="text-[var(--ink)]">Sample collections.</strong> {DEMO_NOTICE}</p> : null}
        <section className="page-title">
          <div><p className="eyebrow">Curated by you</p><h1>Lists &amp; collections</h1><p>Keep the places worth remembering — for tonight, someday, or a very specific mood.</p></div>
          <Link className="button wine" href={viewer ? '/lists/new' : '/login?next=/lists'}><Plus />New list</Link>
        </section>
        <div className="list-grid">
          {visibleCards.map((list) => (
            <article className="list-card" key={list.id}>
              <Link className="list-images" href={isDemo ? '/lists/want-to-try' : `/lists/${list.id}`}>
                {list.images.map((image, index) => <Image key={`${list.id}-${image}-${index}`} src={image} alt="" width={500} height={360} style={{ zIndex: 3 - index }} />)}
              </Link>
              <div>
                <span>{list.privacy}</span><h2>{list.title}</h2><p>{list.count} restaurants</p>
                <footer><div className="avatar-stack"><Avatar initials={viewer?.initials ?? 'YOU'} tone="olive" small />{list.shared ? <Avatar initials="MC" tone="wine" small /> : null}</div><button aria-label={`More options for ${list.title}`}><MoreHorizontal /></button></footer>
              </div>
            </article>
          ))}
        </div>
        <Link className="collection-card" href="/lists/michelin-toronto">
          <div><p className="eyebrow">Official-guide sample · Unaffiliated</p><h2>Michelin Toronto</h2><p>Keep track of recognised restaurants across the city.</p><div className="collection-progress"><span style={{ width: '23%' }} /></div><small>7 of 32 marked visited</small></div>
          <div className="collection-stat"><strong>23%</strong><span>complete</span></div><ArrowRight />
        </Link>
      </div>
    </PalateShell>
  )
}
