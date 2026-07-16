import { redirect } from 'next/navigation'
import { OnboardingForm } from '@/components/onboarding-form'
import { requireUser } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'

export default async function OnboardingPage() {
  const user = await requireUser('/onboarding')
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, home_city, onboarding_completed')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.onboarding_completed) redirect('/discover')

  return (
    <main className="min-h-screen bg-[#f4efe6] px-5 py-10 text-[#201c18]">
      <section className="mx-auto max-w-3xl rounded-[2rem] bg-white/80 p-6 shadow-xl shadow-black/5 sm:p-9">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6b2637]">Set your table</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">What tastes like you?</h1>
        <p className="mb-8 mt-4 max-w-2xl leading-7 text-black/55">
          These basics make discovery useful now. You can refine every preference later.
        </p>
        <OnboardingForm
          displayName={profile?.display_name || user.email?.split('@')[0] || ''}
          homeCity={profile?.home_city || 'Toronto'}
        />
      </section>
    </main>
  )
}
