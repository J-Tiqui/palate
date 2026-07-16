import { AuthForm } from '@/components/auth/auth-form'
import { AuthShell } from '@/components/auth/auth-shell'
import { forgotPasswordAction } from '../actions'

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Reset your password"
      description="Enter your email. For privacy, the response is the same whether or not an account exists."
    >
      <AuthForm mode="forgot" action={forgotPasswordAction} />
    </AuthShell>
  )
}
