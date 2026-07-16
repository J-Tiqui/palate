type AuthErrorLike = {
  code?: string
  message?: string
}

const authMessages: Record<string, string> = {
  bad_code_verifier: 'That sign-in link is no longer valid. Please start again.',
  email_address_invalid: 'Enter a valid email address.',
  email_exists: 'An account with this email already exists. Try signing in instead.',
  email_not_confirmed: 'Check your inbox and verify your email before signing in.',
  flow_state_expired: 'That sign-in attempt expired. Please try again.',
  invalid_credentials: 'The email or password is incorrect.',
  oauth_provider_not_supported: 'That sign-in provider is not available yet.',
  over_email_send_rate_limit: 'Please wait before requesting another email.',
  over_request_rate_limit: 'Too many attempts. Please wait a few minutes and try again.',
  same_password: 'Choose a password you have not used for this account.',
  user_already_exists: 'An account with this email already exists. Try signing in instead.',
  weak_password: 'Use at least 12 characters with uppercase, lowercase, and a number.',
}

export function getPublicAuthError(error: AuthErrorLike | null | undefined): string {
  if (!error) return 'We could not complete that request. Please try again.'
  if (error.code && authMessages[error.code]) return authMessages[error.code]

  const normalized = error.message?.toLowerCase() ?? ''
  if (normalized.includes('invalid login credentials')) return authMessages.invalid_credentials
  if (normalized.includes('email not confirmed')) return authMessages.email_not_confirmed
  if (normalized.includes('rate limit')) return authMessages.over_request_rate_limit
  if (normalized.includes('already registered')) return authMessages.user_already_exists

  return 'We could not complete that request. Please try again.'
}
