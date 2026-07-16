import { expect, test } from '@playwright/test'

const hasSupabase = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL
    && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
)

test('homepage exposes the Palate discovery routes', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /What sounds good, Julian/i })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Discover', exact: true })).toHaveAttribute('href', '/discover')
  await expect(page.getByRole('link', { name: 'Start a Blend', exact: true })).toHaveAttribute('href', '/blend')
})

test('login and signup forms expose accessible controls', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: 'Sign in to Palate' })).toBeVisible()
  await expect(page.getByLabel('Email')).toBeVisible()
  await expect(page.getByLabel('Password')).toBeVisible()

  await page.goto('/signup')
  await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible()
  await expect(page.getByLabel('Confirm password')).toBeVisible()
})

test('password recovery and an invalid OAuth callback fail safely', async ({ page }) => {
  await page.goto('/forgot-password')
  await expect(page.getByRole('heading', { name: 'Reset your password' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Send reset link' })).toBeVisible()

  await page.goto('/auth/callback')
  await expect(page).toHaveURL(/\/auth\/error\?reason=missing-code$/)
  await expect(page.getByText('The provider did not return a valid sign-in code.')).toBeVisible()
})

test('protected route redirects anonymous users back to the intended flow', async ({ page }) => {
  test.skip(!hasSupabase, 'Requires a configured non-production Supabase test project.')
  await page.goto('/saved')
  await expect(page).toHaveURL(/\/login\?next=%2Fsaved$/)
})

test('invalid credentials return a normal-user-safe message', async ({ page }) => {
  test.skip(!hasSupabase, 'Requires a configured non-production Supabase test project.')
  await page.goto('/login')
  await page.getByLabel('Email').fill(`missing-${Date.now()}@example.test`)
  await page.getByLabel('Password').fill('DefinitelyWrong123')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('alert')).toContainText('email or password is incorrect')
})

test('configured test account can sign in', async ({ page }) => {
  const email = process.env.E2E_USER_EMAIL
  const password = process.env.E2E_USER_PASSWORD
  test.skip(!hasSupabase || !email || !password, 'Requires dedicated non-production E2E credentials.')

  await page.goto('/login?next=/saved')
  await page.getByLabel('Email').fill(email!)
  await page.getByLabel('Password').fill(password!)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/\/(saved|onboarding)$/)
})
