import Link from 'next/link'
import { MailCheck } from 'lucide-react'
import { AuthShell } from '@/components/auth/auth-shell'

export default function VerifyEmailPage() {
  return (
    <AuthShell
      eyebrow="One last step"
      title="Check your inbox"
      description="We sent a verification link if the address can be registered. Open it in this browser to continue onboarding."
    >
      <div className="rounded-2xl bg-[#e5efe9] p-5 text-[#1f3a31]">
        <MailCheck size={28} />
        <p className="mt-3 text-sm leading-6">The link expires for your protection. Check spam or wait before requesting another message.</p>
      </div>
      <Link href="/login" className="mt-5 block text-center text-sm font-semibold text-[#6b2637]">
        Return to sign in
      </Link>
    </AuthShell>
  )
}
