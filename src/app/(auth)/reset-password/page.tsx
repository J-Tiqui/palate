import { AuthForm } from '@/components/auth/auth-form'
import { AuthShell } from '@/components/auth/auth-shell'
import { requireUser } from '@/lib/auth/server'
import { resetPasswordAction } from '../actions'

export default async function ResetPasswordPage() {
  await requireUser('/reset-password')
  return (
    <AuthShell
      eyebrow="Choose a new password"
      title="Secure your account"
      description="Use at least 12 characters with uppercase, lowercase, and a number."
    >
      <AuthForm mode="reset" action={resetPasswordAction} />
    </AuthShell>
  )
}
