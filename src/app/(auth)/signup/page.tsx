import { redirect } from 'next/navigation'
import { AuthForm } from '@/components/auth/auth-form'
import { AuthShell } from '@/components/auth/auth-shell'
import { OAuthButtons } from '@/components/auth/oauth-buttons'
import { getOptionalUser } from '@/lib/auth/server'
import { signupAction } from '../actions'

export default async function SignupPage() {
  const user = await getOptionalUser()
  if (user) redirect('/discover')

  return (
    <AuthShell
      eyebrow="Join the table"
      title="Create your account"
      description="Start a private taste profile, log meals, and find places your friends will love."
    >
      <AuthForm mode="signup" action={signupAction} />
      <OAuthButtons next="/onboarding" />
    </AuthShell>
  )
}
