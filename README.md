# Palate

Palate is a premium social restaurant-discovery application: restaurant logging, reviews, saved places, taste profiles, lists, goals, recommendations, and fair group **Blend** matching. The application uses Next.js App Router, strict TypeScript, Supabase, and Tailwind CSS.

The canonical production URL is `https://palateblend.com`.

## Architecture

- **Web:** Next.js 16 App Router. Server Components render data; Server Actions own trusted mutations.
- **Identity/data:** Supabase Auth and PostgreSQL through typed `@supabase/ssr` browser/server clients.
- **Authorization:** PostgreSQL RLS is the final data boundary. Server actions also derive the current user server-side and accept no ownership IDs.
- **Files:** Supabase Storage has a private avatar bucket and public restaurant-photo bucket with explicit policies.
- **Providers:** Live text/nearby discovery, details, and signed photo delivery use a server-only Google Places (New) provider. Seed records are visibly marked as development samples, and Google ratings remain separate from Palate ratings.
- **Hosting:** Vercel, with Cloudflare managing DNS for `palateblend.com`.

## Local development

Requirements: Node.js 20.9+, npm, Docker Desktop, and the npm lockfile.

```bash
npm ci
Copy-Item .env.example .env.local
npm run supabase:start
npm run supabase:reset
npm run dev
```

After `supabase:start`, copy its local API URL and publishable/anon key into `.env.local`. Do not copy a service-role key into a `NEXT_PUBLIC_` variable. The local application is `http://localhost:3000`; Supabase Studio is normally `http://127.0.0.1:54323`, and captured development email is at `http://127.0.0.1:54324`.

The reset command reapplies all checked-in migrations and loads clearly labelled sample restaurants from `supabase/seed.sql`. It destroys only the local Supabase database unless you intentionally link and target another project.

## Environment variables

Start from `.env.example`; keep all values untracked.

| Variable | Scope | Required | Purpose |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser + server | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser + server | Yes | Public Supabase key; legacy anon key is not used by this code |
| `NEXT_PUBLIC_SITE_URL` | Browser + server | Production | Canonical URL; omit in Vercel previews to use `VERCEL_URL` |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Browser | Optional | Interactive map rendering; use a website-restricted Maps JavaScript API key |
| `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED` | Browser | Optional | Show Google only after provider configuration |
| `NEXT_PUBLIC_APPLE_AUTH_ENABLED` | Browser | Optional | Show Apple only after provider configuration |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Browser | Optional | Enable Turnstile on sign-up |
| `GOOGLE_PLACES_API_KEY` | Server only | Optional | Places API (New) text/nearby search, details, and photos; use a separate API-restricted server key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Not currently needed | Reserved for isolated administrative jobs; never import into client code |
| `TURNSTILE_SECRET_KEY` | Server only | Supabase-managed in production | Included for future direct verification; configure Supabase CAPTCHA for current auth flow |
| `SIGNUP_ACCESS_PASSWORD` | Server only | Temporary startup | Shared early-access password checked before Supabase creates a new account; never prefix with `NEXT_PUBLIC_` |

During the initial private launch, set `SIGNUP_ACCESS_PASSWORD` to enable the early-access field. Production fails closed if the variable is missing, so new accounts cannot bypass the gate. Remove the variable and the temporary gate code together when sign-up opens publicly. OAuth buttons are hidden while the gate is active because provider sign-in can create a new Supabase user.

The browser Maps key and server Places key should be separate even if both belong to the same Google Cloud project. The browser key is visible to visitors and must use website restrictions; the Places key must remain server-only. Live discovery defaults to restaurants near central Toronto, while a query uses Google Text Search constrained to restaurants in the Toronto area. Google results are fetched on demand and are not silently persisted as Palate records.

## Commands

```bash
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run build
npm run supabase:test
```

Playwright’s public smoke cases run without credentials. Supabase-dependent cases run when the public Supabase variables are present; the successful-login case additionally requires dedicated `E2E_USER_EMAIL` and `E2E_USER_PASSWORD` CI secrets. Never point automated tests at production.

## Supabase workflow

Create schema changes as new, immutable files in `supabase/migrations`. Apply locally with `npm run supabase:reset`, test RLS with `npm run supabase:test`, then deploy through a controlled Supabase CLI/CI workflow. Regenerate `src/types/database.ts` whenever the hosted schema changes.

Detailed references:

- [Database and RLS](docs/DATABASE.md)
- [Google and Apple authentication](docs/AUTH_PROVIDERS.md)
- [Vercel and Cloudflare deployment](docs/DEPLOYMENT.md)
- [Security, secret rotation, backups, and troubleshooting](docs/SECURITY.md)
- [Implementation audit and plan](docs/IMPLEMENTATION_PLAN.md)

## Production readiness checklist

1. Create separate Supabase projects for non-production and production.
2. Apply migrations and run RLS tests against a disposable/test database.
3. Configure production URL allowlists, custom SMTP, CAPTCHA, and desired OAuth providers.
4. Add Vercel environment variables by environment; do not reuse production credentials in preview tests.
5. Add and verify both domains in Vercel, then create the exact DNS records Vercel displays in Cloudflare.
6. Enable GitHub secret scanning and branch protection for the included CI checks.
7. Verify registration, email confirmation, reset, OAuth, save, review, and Blend flows on the deployment.
8. Configure backups/PITR and practice a restore before launch.
