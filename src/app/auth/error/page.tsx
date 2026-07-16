import Link from 'next/link'
import { AuthShell } from '@/components/auth/auth-shell'

const messages: Record<string, string> = {
  'code-exchange': 'That sign-in link is invalid or has expired.',
  'invalid-link': 'That email link is invalid or has expired.',
  'missing-code': 'The provider did not return a valid sign-in code.',
  'oauth-callback': 'The provider could not complete sign-in.',
  'oauth-start': 'We could not start provider sign-in.',
  provider: 'That sign-in provider is not supported.',
  'provider-unavailable': 'That sign-in provider has not been configured yet.',
  session: 'We could not verify the new session.',
}

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>
}) {
  const { reason = '' } = await searchParams
  const message = messages[reason] ?? 'We could not complete sign-in. No account changes were made.'

  return (
    <AuthShell eyebrow="Sign-in interrupted" title="Let’s try that again" description={message}>
      <div className="space-y-3">
        <Link href="/login" className="block rounded-2xl bg-[#6b2637] px-5 py-3 text-center font-semibold text-white">
          Return to sign in
        </Link>
        <Link href="/" className="block text-center text-sm text-black/55">Back to Palate</Link>
      </div>
    </AuthShell>
  )
}
