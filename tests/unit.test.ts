import assert from 'node:assert/strict'
import test from 'node:test'
import { isSignupAccessPasswordRequired, verifySignupAccessPassword } from '../src/lib/auth/early-access.ts'
import { getPublicAuthError } from '../src/lib/auth/errors.ts'
import { getFirstName, getProfileHref, getProfileInitials } from '../src/lib/auth/profile.ts'
import {
  rankBlendCandidates,
  scoreBlendCandidate,
  type BlendCandidate,
  type BlendMemberPreferences,
} from '../src/lib/blend/scoring.ts'
import { getSafeRedirectPath } from '../src/lib/security/redirects.ts'
import {
  forgotPasswordSchema,
  loginSchema,
  onboardingSchema,
  oauthProviderSchema,
  resetPasswordSchema,
  reviewSchema,
  signupSchema,
  usernameSchema,
} from '../src/lib/validation/schemas.ts'

const members: BlendMemberPreferences[] = [
  {
    memberId: 'a',
    dietaryRestrictions: ['vegetarian'],
    allergies: ['peanuts'],
    cuisineWeights: { japanese: 1, italian: -0.4 },
    vibeWeights: { cozy: 0.8 },
    priceMax: 3,
    maxDistanceKm: 8,
  },
  {
    memberId: 'b',
    dietaryRestrictions: [],
    allergies: ['shellfish'],
    cuisineWeights: { thai: 1, japanese: 0.6 },
    vibeWeights: { lively: 1 },
    priceMax: 2,
    maxDistanceKm: 5,
  },
]

const candidate: BlendCandidate = {
  restaurantId: 'restaurant-a',
  name: 'Kumo House',
  cuisines: ['Japanese'],
  vibes: ['Cozy'],
  supportedDiets: ['Vegetarian'],
  allergens: [],
  priceLevel: 2,
  distanceKm: 3,
  palateRating: 4.5,
}

test('signup validation accepts a strong matching password', () => {
  const result = signupSchema.safeParse({
    email: 'Diner@Example.com',
    password: 'StrongPalate123',
    confirmPassword: 'StrongPalate123',
    terms: 'on',
  })
  assert.equal(result.success, true)
  if (result.success) assert.equal(result.data.email, 'diner@example.com')
})

test('signup validation rejects weak or mismatched passwords', () => {
  assert.equal(signupSchema.safeParse({
    email: 'diner@example.com',
    password: 'short',
    confirmPassword: 'different',
    terms: 'on',
  }).success, false)
})

test('temporary signup access password is enforced before account creation', () => {
  const configured = { NODE_ENV: 'production', SIGNUP_ACCESS_PASSWORD: 'test-startup-code' }
  assert.equal(isSignupAccessPasswordRequired(configured), true)
  assert.equal(verifySignupAccessPassword('test-startup-code', configured), 'accepted')
  assert.equal(verifySignupAccessPassword('wrong', configured), 'rejected')
  assert.equal(verifySignupAccessPassword('', { NODE_ENV: 'production' }), 'misconfigured')
  assert.equal(isSignupAccessPasswordRequired({ NODE_ENV: 'development' }), false)
})

test('login rejects malformed payloads before an auth request', () => {
  assert.equal(loginSchema.safeParse({ email: 'not-email', password: '' }).success, false)
})

test('password-reset schemas validate the request and replacement password', () => {
  assert.equal(forgotPasswordSchema.safeParse({ email: 'DINER@example.com' }).success, true)
  assert.equal(forgotPasswordSchema.safeParse({ email: 'not-email' }).success, false)
  assert.equal(resetPasswordSchema.safeParse({
    password: 'NewStrongPalate123',
    confirmPassword: 'NewStrongPalate123',
  }).success, true)
  assert.equal(resetPasswordSchema.safeParse({
    password: 'NewStrongPalate123',
    confirmPassword: 'DifferentPalate123',
  }).success, false)
})

test('OAuth provider validation allows only configured provider names', () => {
  assert.equal(oauthProviderSchema.safeParse('google').success, true)
  assert.equal(oauthProviderSchema.safeParse('apple').success, true)
  assert.equal(oauthProviderSchema.safeParse('attacker-controlled').success, false)
})

test('username normalization, format, and reserved-name checks are enforced', () => {
  const valid = usernameSchema.safeParse('  Jules_Eats  ')
  assert.equal(valid.success, true)
  if (valid.success) assert.equal(valid.data, 'jules_eats')
  assert.equal(usernameSchema.safeParse('admin').success, false)
  assert.equal(usernameSchema.safeParse('_starts_wrong').success, false)
})

test('onboarding accepts multi-select preferences without an account price range', () => {
  const result = onboardingSchema.safeParse({
    username: 'jules_eats',
    displayName: 'Jules',
    homeCity: 'Toronto',
    favouriteCuisines: 'Japanese,Thai',
    dislikedCuisines: 'French',
    preferredVibes: 'Date night,Cozy',
    dietaryRestrictions: 'Vegetarian',
    allergies: 'Peanuts,Shellfish',
  })

  assert.equal(result.success, true)
  if (result.success) {
    assert.deepEqual(result.data.favouriteCuisines, ['Japanese', 'Thai'])
    assert.deepEqual(result.data.dislikedCuisines, ['French'])
    assert.equal('priceMin' in result.data, false)
  }
})

test('review validation enforces rating bounds and half-star increments', () => {
  const base = {
    restaurantId: '10000000-0000-4000-8000-000000000001',
    restaurantSlug: 'kumo-house',
    reviewText: 'Excellent.',
    visitDate: '2026-01-01',
    tags: 'date-night, cozy',
    wouldReturn: 'yes',
  }
  assert.equal(reviewSchema.safeParse({ ...base, rating: '4.5' }).success, true)
  assert.equal(reviewSchema.safeParse({ ...base, rating: '4.2' }).success, false)
  assert.equal(reviewSchema.safeParse({ ...base, rating: '6' }).success, false)
})

test('safe redirects allow local paths and block open-redirect variants', () => {
  assert.equal(getSafeRedirectPath('/restaurants/kumo-house?from=saved'), '/restaurants/kumo-house?from=saved')
  assert.equal(getSafeRedirectPath('https://evil.example/steal'), '/discover')
  assert.equal(getSafeRedirectPath('//evil.example/steal'), '/discover')
  assert.equal(getSafeRedirectPath('/\\evil.example'), '/discover')
  assert.equal(getSafeRedirectPath('%2F%2Fevil.example'), '/discover')
})

test('auth errors are mapped without exposing provider details', () => {
  assert.equal(getPublicAuthError({ code: 'invalid_credentials', message: 'sensitive backend detail' }), 'The email or password is incorrect.')
  assert.equal(getPublicAuthError({ code: 'unknown', message: 'database host db.internal failed' }), 'We could not complete that request. Please try again.')
})

test('profile identity helpers derive account-specific labels and routes', () => {
  assert.equal(getProfileInitials('Maya Chen'), 'MC')
  assert.equal(getProfileInitials('', 'ethan@example.com'), 'ET')
  assert.equal(getProfileHref('maya_eats'), '/profile/maya_eats')
  assert.equal(getProfileHref(null), '/onboarding')
  assert.equal(getFirstName('  Priya Shah  '), 'Priya')
})

test('Blend rejects any candidate that violates one member allergy', () => {
  const score = scoreBlendCandidate({ ...candidate, allergens: ['Shellfish'] }, members)
  assert.equal(score.eligible, false)
  assert.equal(score.score, 0)
  assert.deepEqual(score.rejectedBy, ['b:allergy:shellfish'])
})

test('Blend rejects any candidate missing a required diet', () => {
  const score = scoreBlendCandidate({ ...candidate, supportedDiets: [] }, members)
  assert.equal(score.eligible, false)
  assert.deepEqual(score.rejectedBy, ['a:diet:vegetarian'])
})

test('Blend returns explainable per-member scores without overfitting to one member', () => {
  const score = scoreBlendCandidate(candidate, members)
  assert.equal(score.eligible, true)
  assert.deepEqual(Object.keys(score.memberScores), ['a', 'b'])
  assert.ok(score.score <= Math.max(...Object.values(score.memberScores)))
  assert.ok(score.reasons.some((reason) => reason.includes('dietary and allergy')))
})

test('Blend ranking is deterministic when scores tie', () => {
  const rankings = rankBlendCandidates([
    { ...candidate, restaurantId: 'restaurant-b' },
    { ...candidate, restaurantId: 'restaurant-a' },
  ], members)
  assert.deepEqual(rankings.map((result) => result.restaurantId), ['restaurant-a', 'restaurant-b'])
})
