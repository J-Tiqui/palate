# Authentication provider setup

Palate uses Supabase Auth. Email/password works once the project, URL configuration, and mail delivery are configured. Google and Apple application support is implemented, but their buttons remain hidden until their public feature flags are set. Provider credentials live in Supabase, never in this repository or the browser.

## Supabase URL and email configuration

In **Authentication → URL Configuration**:

- Site URL: `https://palateblend.com`
- Production redirect URLs: `https://palateblend.com/auth/callback`, `https://palateblend.com/auth/confirm`, and `https://palateblend.com/reset-password`
- Local equivalents: the same paths under `http://localhost:3000`
- Preview: add only a narrowly scoped Vercel team/project wildcard such as `https://*-TEAM.vercel.app/**`, or list exact preview URLs. Do not allow arbitrary hosts.

Set email confirmation on, use custom SMTP for production, review the email templates, and make the templates redirect through `/auth/confirm` or `/reset-password` as appropriate. Local messages are captured by Mailpit. Configure Turnstile in **Authentication → Bot and Abuse Protection**; the sign-up form forwards the returned CAPTCHA token to Supabase.

## Google

1. In Google Cloud, configure an OAuth consent screen and create a **Web application** OAuth client.
2. Add authorized JavaScript origins: `http://localhost:3000` for local work and `https://palateblend.com` for production. Add exact preview origins only when testing a preview directly.
3. Add the Supabase Auth callback as an authorized redirect URI:
   - Hosted: `https://PROJECT_REF.supabase.co/auth/v1/callback`
   - Local Supabase: `http://127.0.0.1:54321/auth/v1/callback`
4. Paste the Google client ID and client secret into **Supabase → Authentication → Providers → Google**.
5. Set `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true` in the matching Vercel environment only after that provider is ready.

Google redirects to Supabase first; `/auth/callback` is the application’s post-authentication redirect. Vercel preview URLs belong in Supabase’s redirect allowlist, not as broad Google callback wildcards.

## Apple

Sign in with Apple requires a paid Apple Developer membership and manual external configuration:

1. Create or select the primary App ID and enable Sign in with Apple.
2. Create a **Services ID** for the website and associate it with the primary App ID.
3. Configure the web domain as the Supabase project hostname (`PROJECT_REF.supabase.co`) and the return URL as `https://PROJECT_REF.supabase.co/auth/v1/callback`.
4. Create a Sign in with Apple key, record its Key ID and Team ID, and download its `.p8` private key once.
5. Generate the Apple client secret outside this repository. Store the Services ID/client ID and generated secret in **Supabase → Authentication → Providers → Apple**. Apple client secrets expire (maximum six months), so schedule renewal.
6. Configure Apple’s domain verification exactly as the Apple/Supabase dashboards instruct, verify the production domain, then test the complete consent and callback flow.
7. Set `NEXT_PUBLIC_APPLE_AUTH_ENABLED=true` only in environments where the provider works.

Never commit the `.p8` file, generated client secret, Team credentials, or a script with embedded key material. Apple may return a name only on the first authorization; Palate’s onboarding flow therefore collects the durable username/display name.

## Flow verification

For each environment, verify: new email account → confirmation → onboarding; existing email login; logout; reset request → reset link → password change; Google consent/callback; Apple consent/callback; rejected/expired OAuth state; and a protected URL returning to its intended path after login.

Common failures:

- `redirect_uri_mismatch`: provider callback does not exactly match Supabase’s `/auth/v1/callback`.
- User returns to the wrong hostname: Supabase Site URL or additional redirect allowlist is wrong.
- Email link expired/invalid: inspect template token type and the `/auth/confirm` URL, then request a fresh email.
- OAuth button absent: its `NEXT_PUBLIC_*_AUTH_ENABLED` flag is intentionally unset.
- Turnstile rejects signup: site key, secret, hostname allowlist, and Supabase CAPTCHA provider must belong to the same widget.

Official references: [Supabase SSR for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs), [Google login](https://supabase.com/docs/guides/auth/social-login/auth-google), [Apple login](https://supabase.com/docs/guides/auth/social-login/auth-apple), and [redirect URL allowlists](https://supabase.com/docs/guides/auth/redirect-urls).
