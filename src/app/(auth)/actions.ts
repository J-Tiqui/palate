'use server'

import { redirect } from 'next/navigation'
import { publicFeatureFlags } from '@/lib/env/public'
import { getSiteUrl } from '@/lib/env/site-url'
import { isSignupAccessPasswordRequired, verifySignupAccessPassword } from '@/lib/auth/early-access'
import { getPublicAuthError } from '@/lib/auth/errors'
import { getSafeRedirectPath } from '@/lib/security/redirects'
import { createClient } from '@/lib/supabase/server'
import {
  firstValidationMessage,
  forgotPasswordSchema,
  loginSchema,
  oauthProviderSchema,
  resetPasswordSchema,
  signupSchema,
} from '@/lib/validation/schemas'

export type AuthActionState = {
  status: 'idle' | 'error' | 'success'
  message: string
}

function optionalFormString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key)
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    next: optionalFormString(formData, 'next'),
    captchaToken: optionalFormString(formData, 'captchaToken'),
  })

  if (!parsed.success) {
    return { status: 'error', message: firstValidationMessage(parsed.error) }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
    options: parsed.data.captchaToken ? { captchaToken: parsed.data.captchaToken } : undefined,
  })

  if (error) return { status: 'error', message: getPublicAuthError(error) }

  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id
  if (!userId) return { status: 'error', message: 'We could not verify your account. Please sign in again.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', userId)
    .maybeSingle()

  if (!profile?.onboarding_completed) redirect('/onboarding')
  redirect(getSafeRedirectPath(parsed.data.next))
}

export async function signupAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signupSchema.safeParse({
    accessPassword: optionalFormString(formData, 'accessPassword'),
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
    terms: formData.get('terms'),
    captchaToken: optionalFormString(formData, 'captchaToken'),
  })

  if (!parsed.success) {
    return { status: 'error', message: firstValidationMessage(parsed.error) }
  }

  const accessResult = verifySignupAccessPassword(parsed.data.accessPassword)
  if (accessResult === 'misconfigured') {
    return { status: 'error', message: 'New account creation is temporarily paused. Please contact the Palate team.' }
  }
  if (accessResult === 'rejected') {
    return { status: 'error', message: 'That early access password is incorrect.' }
  }

  const supabase = await createClient()
  const callbackUrl = new URL('/auth/callback', getSiteUrl())
  callbackUrl.searchParams.set('next', '/onboarding')

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: callbackUrl.toString(),
      captchaToken: parsed.data.captchaToken,
    },
  })

  if (error) return { status: 'error', message: getPublicAuthError(error) }
  if (data.session) redirect('/onboarding')
  redirect('/verify-email')
}

export async function forgotPasswordAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get('email'),
    captchaToken: optionalFormString(formData, 'captchaToken'),
  })

  if (!parsed.success) {
    return { status: 'error', message: firstValidationMessage(parsed.error) }
  }

  const supabase = await createClient()
  const callbackUrl = new URL('/auth/callback', getSiteUrl())
  callbackUrl.searchParams.set('next', '/reset-password')
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: callbackUrl.toString(),
    captchaToken: parsed.data.captchaToken,
  })

  if (error?.code === 'over_email_send_rate_limit' || error?.code === 'over_request_rate_limit') {
    return { status: 'error', message: getPublicAuthError(error) }
  }

  return {
    status: 'success',
    message: 'If an account exists for that email, a password-reset link is on its way.',
  }
}

export async function resetPasswordAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  })

  if (!parsed.success) {
    return { status: 'error', message: firstValidationMessage(parsed.error) }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error) return { status: 'error', message: getPublicAuthError(error) }

  await supabase.auth.signOut({ scope: 'local' })
  redirect('/login?message=password-updated')
}

export async function oauthAction(formData: FormData): Promise<void> {
  if (isSignupAccessPasswordRequired()) redirect('/auth/error?reason=early-access-password')

  const provider = oauthProviderSchema.safeParse(formData.get('provider'))
  if (!provider.success) redirect('/auth/error?reason=provider')

  if (
    (provider.data === 'google' && !publicFeatureFlags.googleAuth)
    || (provider.data === 'apple' && !publicFeatureFlags.appleAuth)
  ) {
    redirect('/auth/error?reason=provider-unavailable')
  }

  const next = getSafeRedirectPath(optionalFormString(formData, 'next'), '/discover')
  const callbackUrl = new URL('/auth/callback', getSiteUrl())
  callbackUrl.searchParams.set('next', next)

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider.data,
    options: { redirectTo: callbackUrl.toString() },
  })

  if (error || !data.url) redirect('/auth/error?reason=oauth-start')
  redirect(data.url)
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut({ scope: 'local' })
  redirect('/')
}
