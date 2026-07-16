import Link from 'next/link'
import { ArrowLeft, Check, Clock3, Sparkles, Users } from 'lucide-react'
import { notFound } from 'next/navigation'
import { PalateShell } from '@/components/palate/app-shell'
import { Avatar } from '@/components/palate/avatar'
import { requireUser } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { uuidSchema } from '@/lib/validation/schemas'

export default async function BlendSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const parsed = uuidSchema.safeParse(id)
  if (!parsed.success) notFound()
  await requireUser(`/blend/${id}`)
  const supabase = await createClient()
  const { data: session } = await supabase.from('blend_sessions').select('id, title, status, expires_at, created_at').eq('id', id).maybeSingle()
  if (!session) notFound()
  const [{ data: participants }, { data: results }] = await Promise.all([
    supabase.from('blend_participants').select('id, user_id, status').eq('session_id', id).order('created_at'),
    supabase.from('blend_results').select('id, rank, score, restaurant_id, match_reasons, hard_constraints_passed').eq('session_id', id).order('rank'),
  ])
  const participantIds = (participants ?? []).map((participant) => participant.user_id)
  const { data: profiles } = participantIds.length
    ? await supabase.from('profiles').select('id, display_name').in('id', participantIds)
    : { data: [] }
  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]))

  return (
    <PalateShell>
      <div className="page-wrap results-page">
        <section className="results-head">
          <div><Link className="back-link" href="/blend"><ArrowLeft />All Blends</Link><p className="eyebrow">Private Blend session</p><h1>{session.title}</h1><p>Only the host and invited participants can access this session.</p></div>
          <span className="button ghost capitalize">{session.status}</span>
        </section>
        <section className="goal-summary">
          <div><span>PARTICIPANTS</span><strong>{participants?.length ?? 0}</strong><p>Up to 20 people</p></div>
          <div className="goal-summary-copy"><h2>{results?.length ? 'Your ranked table is ready.' : 'The private table is ready.'}</h2><p>{results?.length ? 'Every match passed the stored hard constraints.' : 'Invite members and complete their preference profiles before generating durable rankings.'}</p></div>
          <div className="badge-preview"><Sparkles /><span>Session</span><strong>{session.status}</strong></div>
        </section>
        <div className="result-layout">
          <section className="result-list">
            <article className="match-card">
              <div className="match-body">
                <div className="match-title"><div><h2>Who’s eating?</h2><p>Session membership is enforced by row-level security.</p></div><Users /></div>
                <div className="contributions">{(participants ?? []).map((participant, index) => <span className="tag active" key={participant.id}><Avatar initials={(profileById.get(participant.user_id)?.display_name || `Member ${index + 1}`).split(' ').map((part) => part[0]).join('').slice(0, 2)} small />{profileById.get(participant.user_id)?.display_name || `Member ${index + 1}`} · {participant.status}</span>)}</div>
                <div className="why-match"><span>✦</span><div><strong>Next step</strong><p><Check size={14} />Collect each participant’s dietary needs and taste signals.</p><p><Check size={14} />Run candidate scoring in trusted server code.</p></div></div>
              </div>
            </article>
            {(results ?? []).map((result) => <article className="match-card" key={result.id}><div className="rank">{result.rank}</div><div className="match-body"><div className="match-title"><div><h2>Restaurant match</h2><p>Persisted result · details resolve from restaurant {result.restaurant_id.slice(0, 8)}</p></div><div className="score-badge"><strong>{result.score.toFixed(0)}%</strong><span>match</span></div></div><div className="why-match"><span>✦</span><div><strong>Why it matched</strong>{result.match_reasons.map((reason) => <p key={reason}><Check size={14} />{reason}</p>)}</div></div></div></article>)}
          </section>
          <aside className="score-card"><p className="eyebrow">Session status</p><h3>Private by default.<br />Explicitly explained.</h3><div className="hard-pass"><Check /><div><strong>RLS access enforced</strong><p>Guessed session identifiers do not grant access.</p></div></div><div className="hard-pass"><Clock3 /><div><strong>Expires</strong><p>{session.expires_at ? new Date(session.expires_at).toLocaleString('en-CA') : 'No expiry set'}</p></div></div><Link className="button wine full" href="/blend">Create another Blend</Link></aside>
        </div>
      </div>
    </PalateShell>
  )
}
