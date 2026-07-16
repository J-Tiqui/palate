import Link from 'next/link'
import { ArrowRight, MoreHorizontal, Plus, Target } from 'lucide-react'
import { PalateShell } from '@/components/palate/app-shell'
import { getOptionalUser } from '@/lib/auth/server'
import { hasSupabaseEnv } from '@/lib/env/public'
import { DEMO_NOTICE, demoGoals } from '@/lib/palate/demo-data'
import { createClient } from '@/lib/supabase/server'

type GoalCard = {
  id: string
  title: string
  progress: number
  total: number
  next: string
  nextSlug: string
  badge: string
}

export default async function GoalsPage() {
  const user = hasSupabaseEnv() ? await getOptionalUser() : null
  let goals: GoalCard[] = []

  if (user) {
    const supabase = await createClient()
    const { data: rows } = await supabase.from('goals').select('id, title, target_count').eq('owner_id', user.id).eq('status', 'active').order('created_at')
    const ids = (rows ?? []).map((goal) => goal.id)
    const { data: progress } = ids.length
      ? await supabase.from('goal_progress').select('goal_id, amount').in('goal_id', ids).eq('user_id', user.id)
      : { data: [] }
    goals = (rows ?? []).map((goal, index) => ({
      id: goal.id,
      title: goal.title,
      total: goal.target_count,
      progress: (progress ?? []).filter((item) => item.goal_id === goal.id).reduce((sum, item) => sum + item.amount, 0),
      next: 'Discover a matching restaurant',
      nextSlug: '',
      badge: demoGoals[index % demoGoals.length].badge,
    }))
  }

  const isDemo = goals.length === 0
  const visibleGoals = isDemo ? demoGoals.map((goal, index) => ({ ...goal, id: `demo-goal-${index + 1}` })) : goals
  const totalProgress = visibleGoals.length
    ? Math.round(visibleGoals.reduce((sum, goal) => sum + goal.progress / goal.total, 0) / visibleGoals.length * 100)
    : 0

  return (
    <PalateShell>
      <div className="page-wrap">
        {isDemo ? <p className="mb-5 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-xs text-[var(--muted)]"><strong className="text-[var(--ink)]">Sample goal progress.</strong> {DEMO_NOTICE}</p> : null}
        <section className="page-title">
          <div><p className="eyebrow">A reason to go out</p><h1>Goals</h1><p>Turn “we should try that” into a year of places you’ll remember.</p></div>
          <Link className="button wine" href={user ? '/goals/new' : '/login?next=/goals'}><Plus />New goal</Link>
        </section>
        <section className="goal-summary">
          <div><span>2026 PROGRESS</span><strong>{totalProgress}%</strong><p>Across {visibleGoals.length} active goals</p></div>
          <div className="goal-summary-copy"><h2>You’re three visits from your next badge.</h2><p>A sushi dinner, one unfamiliar cuisine, and a west-end stop would move four goals at once.</p></div>
          <div className="badge-preview"><Target /><span>Next badge</span><strong>Open Palate</strong></div>
        </section>
        <div className="goals-grid">
          {visibleGoals.map((goal, index) => {
            const percent = Math.min(100, Math.round(goal.progress / goal.total * 100))
            return (
              <article className="goal-card" key={goal.id}>
                <span className={`goal-icon ${['wine', 'olive', 'amber', 'slate'][index % 4]}`}><Target /></span>
                <div className="goal-top"><span>ACTIVE GOAL</span><button aria-label={`More options for ${goal.title}`}><MoreHorizontal /></button></div>
                <h2>{goal.title}</h2>
                <div className="goal-numbers"><strong>{goal.progress}<small>/{goal.total}</small></strong><span>{percent}% complete</span></div>
                <div className="goal-progress"><span style={{ width: `${percent}%` }} /></div>
                <div className="completed-dots">{Array.from({ length: Math.min(goal.total, 8) }, (_, dot) => <i key={dot} className={dot < goal.progress ? 'done' : ''}>{dot + 1}</i>)}</div>
                <footer>
                  <div><span>Suggested next</span>{goal.nextSlug ? <Link href={`/restaurants/${goal.nextSlug}`}>{goal.next} <ArrowRight size={13} /></Link> : <Link href="/discover">{goal.next} <ArrowRight size={13} /></Link>}</div>
                  <div><span>Milestone</span><strong>{goal.badge}</strong></div>
                </footer>
              </article>
            )
          })}
        </div>
      </div>
    </PalateShell>
  )
}
