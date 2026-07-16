import { expect, test } from '@playwright/test'

const hasSupabase = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL
    && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
)

test('homepage welcomes visitors without impersonating a profile', async ({ page, isMobile }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Good restaurants.*Better reasons/i })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Sign in', exact: true })).toHaveAttribute('href', '/login')
  await expect(page.getByRole('link', { name: isMobile ? 'Build your taste profile' : 'Create profile', exact: true })).toHaveAttribute('href', '/signup')
  await expect(page.getByRole('link', { name: /Explore the demo/i })).toHaveAttribute('href', '/discover')
})

test('anonymous discovery uses a neutral identity', async ({ page }) => {
  await page.goto('/discover')
  await expect(page.getByRole('heading', { name: /What sounds good, tonight/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /Build your taste profile/i })).toHaveAttribute('href', '/signup')
  await expect(page.getByText('Julian', { exact: true })).toHaveCount(0)
})

test('login and signup forms expose accessible controls', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: 'Sign in to Palate' })).toBeVisible()
  await expect(page.getByLabel('Email')).toBeVisible()
  await expect(page.getByLabel('Password')).toBeVisible()

  await page.goto('/signup')
  await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible()
  await expect(page.getByLabel('Early access password')).toBeVisible()
  await expect(page.getByLabel('Confirm password')).toBeVisible()
})

test('new accounts require the temporary early access password', async ({ page }) => {
  await page.goto('/signup')
  await page.getByLabel('Early access password').fill('not-the-password')
  await page.getByLabel('Email').fill(`early-access-${Date.now()}@example.test`)
  await page.getByLabel('Password', { exact: true }).fill('TemporaryAccount123')
  await page.getByLabel('Confirm password').fill('TemporaryAccount123')
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page.getByText('That early access password is incorrect.', { exact: true })).toBeVisible()
})

test('map renders an interactive map with working search and price filters', async ({ page, isMobile }) => {
  await page.goto('/map')
  await expect(page.getByTestId('google-map')).toBeVisible()
  await expect(page.locator('.google-map-shell')).toHaveAttribute('data-map-status', 'ready', { timeout: 15_000 })
  await expect.poll(async () => Number(await page.locator('.google-map-shell').getAttribute('data-marker-count'))).toBeGreaterThan(0)
  await expect.poll(() => page.locator('.custom-map').evaluate((element) => getComputedStyle(element, '::after').display)).toBe('none')
  await expect(page.getByRole('button', { name: 'Centre map on my location' })).toBeVisible()
  if (!isMobile) {
    await expect(page.getByRole('heading', { name: 'Toronto map' })).toBeVisible()
    await expect(page.getByText('places in this view')).toBeVisible()
  }
  await page.getByLabel('Search Toronto restaurants').fill('no-such-palate-restaurant-zzzz')
  await expect(page.locator('.google-map-shell')).toHaveAttribute('data-marker-count', '0')
  await page.getByLabel('Search Toronto restaurants').fill('')
  await expect.poll(async () => Number(await page.locator('.google-map-shell').getAttribute('data-marker-count'))).toBeGreaterThan(0)
  const countBeforePriceFilter = Number(await page.locator('.google-map-shell').getAttribute('data-marker-count'))
  await page.getByLabel('Max price').selectOption('2')
  await expect.poll(async () => Number(await page.locator('.google-map-shell').getAttribute('data-marker-count'))).toBeLessThanOrEqual(countBeforePriceFilter)
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
