'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import type { AuthActionState } from '@/app/(auth)/actions'
import { publicFeatureFlags } from '@/lib/env/public'
import { SubmitButton } from './submit-button'
import { TurnstileField } from './turnstile-field'

type AuthFormMode = 'login' | 'signup' | 'forgot' | 'reset'
type AuthFormAction = (state: AuthActionState, formData: FormData) => Promise<AuthActionState>

const initialAuthState: AuthActionState = { status: 'idle', message: '' }

const labels: Record<AuthFormMode, string> = {
  login: 'Sign in',
  signup: 'Create account',
  forgot: 'Send reset link',
  reset: 'Set new password',
}

export function AuthForm({ mode, action, next, requireAccessPassword = false }: {
  mode: AuthFormMode
  action: AuthFormAction
  next?: string
  requireAccessPassword?: boolean
}) {
  const [state, formAction] = useActionState(action, initialAuthState)
  const asksForEmail = mode !== 'reset'
  const asksForPassword = mode === 'login' || mode === 'signup' || mode === 'reset'

  return (
    <form action={formAction} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      {mode === 'signup' && requireAccessPassword && (
        <label className="block text-sm font-medium">
          Early access password
          <input
            required
            name="accessPassword"
            type="password"
            autoComplete="off"
            maxLength={128}
            className="mt-2 w-full rounded-2xl border border-black/10 bg-[#fffdf9] px-4 py-3 outline-none ring-[#6b2637]/20 transition focus:ring-4"
          />
          <span className="mt-2 block text-xs font-normal leading-5 text-black/45">Temporary startup access for new Palate accounts.</span>
        </label>
      )}
      {asksForEmail && (
        <label className="block text-sm font-medium">
          Email
          <input
            required
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            className="mt-2 w-full rounded-2xl border border-black/10 bg-[#fffdf9] px-4 py-3 outline-none ring-[#6b2637]/20 transition focus:ring-4"
          />
        </label>
      )}
      {asksForPassword && (
        <label className="block text-sm font-medium">
          {mode === 'reset' ? 'New password' : 'Password'}
          <input
            required
            name="password"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            minLength={mode === 'login' ? 1 : 12}
            maxLength={72}
            className="mt-2 w-full rounded-2xl border border-black/10 bg-[#fffdf9] px-4 py-3 outline-none ring-[#6b2637]/20 transition focus:ring-4"
          />
        </label>
      )}
      {(mode === 'signup' || mode === 'reset') && (
        <label className="block text-sm font-medium">
          Confirm password
          <input
            required
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={12}
            maxLength={72}
            className="mt-2 w-full rounded-2xl border border-black/10 bg-[#fffdf9] px-4 py-3 outline-none ring-[#6b2637]/20 transition focus:ring-4"
          />
        </label>
      )}
      {mode === 'signup' && (
        <label className="flex items-start gap-3 text-sm leading-6 text-black/60">
          <input required name="terms" type="checkbox" className="mt-1 size-4 accent-[#6b2637]" />
          <span>I agree to Palate’s terms and privacy policy.</span>
        </label>
      )}
      {(mode === 'login' || mode === 'signup' || mode === 'forgot') && (
        <TurnstileField siteKey={publicFeatureFlags.turnstileSiteKey} />
      )}
      {state.message && (
        <p
          role={state.status === 'error' ? 'alert' : 'status'}
          className={`rounded-2xl px-4 py-3 text-sm ${
            state.status === 'error' ? 'bg-[#f8e5e5] text-[#7a2432]' : 'bg-[#e5efe9] text-[#1f3a31]'
          }`}
        >
          {state.message}
        </p>
      )}
      <SubmitButton>{labels[mode]}</SubmitButton>
      {mode === 'login' && (
        <div className="flex justify-between text-sm text-black/55">
          <Link href="/forgot-password" className="hover:text-black">Forgot password?</Link>
          <Link href="/signup" className="font-semibold text-[#6b2637]">Create account</Link>
        </div>
      )}
      {mode === 'signup' && (
        <p className="text-center text-sm text-black/55">
          Already a member? <Link href="/login" className="font-semibold text-[#6b2637]">Sign in</Link>
        </p>
      )}
      {(mode === 'forgot' || mode === 'reset') && (
        <p className="text-center text-sm text-black/55">
          <Link href="/login" className="font-semibold text-[#6b2637]">Back to sign in</Link>
        </p>
      )}
    </form>
  )
}
