import { redirect } from 'next/navigation'
import { AuthForm } from '@/components/auth/auth-form'
import { AuthShell } from '@/components/auth/auth-shell'
import { OAuthButtons } from '@/components/auth/oauth-buttons'
import { getOptionalUser } from '@/lib/auth/server'
import { getSafeRedirectPath } from '@/lib/security/redirects'
import { loginAction } from '../actions'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; message?: string }>
}) {
  const params = await searchParams
  const next = getSafeRedirectPath(params.next)
  const user = await getOptionalUser()
  if (user) redirect(next)

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to Palate"
      description="Pick up your restaurant diary, lists, recommendations, and Blends."
    >
      {params.message === 'password-updated' && (
        <p role="status" className="mb-4 rounded-2xl bg-[#e5efe9] px-4 py-3 text-sm text-[#1f3a31]">
          Your password was updated. Sign in with the new one.
        </p>
      )}
      <AuthForm mode="login" action={loginAction} next={next} />
      <OAuthButtons next={next} />
    </AuthShell>
  )
}
