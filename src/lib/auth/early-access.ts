import { createHash, timingSafeEqual } from 'node:crypto'

type SignupAccessEnvironment = {
  NODE_ENV?: string
  SIGNUP_ACCESS_PASSWORD?: string
}

export type SignupAccessResult = 'not-required' | 'accepted' | 'rejected' | 'misconfigured'

function digest(value: string): Buffer {
  return createHash('sha256').update(value, 'utf8').digest()
}

export function isSignupAccessPasswordRequired(
  environment: SignupAccessEnvironment = process.env,
): boolean {
  return environment.NODE_ENV === 'production' || Boolean(environment.SIGNUP_ACCESS_PASSWORD)
}

export function verifySignupAccessPassword(
  candidate: string,
  environment: SignupAccessEnvironment = process.env,
): SignupAccessResult {
  if (!isSignupAccessPasswordRequired(environment)) return 'not-required'

  const expected = environment.SIGNUP_ACCESS_PASSWORD
  if (!expected) return 'misconfigured'

  return timingSafeEqual(digest(candidate), digest(expected)) ? 'accepted' : 'rejected'
}
