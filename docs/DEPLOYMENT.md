# Vercel and Cloudflare deployment

## Vercel

Import the repository into Vercel and keep the default Next.js framework settings. Use Node.js 20 or newer and `npm ci`; the application requires no custom runtime or `vercel.json`.

Configure variables separately:

| Variable | Development/Preview | Production |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Non-production Supabase project | Production project |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Matching public key | Matching public key |
| `NEXT_PUBLIC_SITE_URL` | Usually unset; app uses `VERCEL_URL` | `https://palateblend.com` |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Website-restricted preview key | Website-restricted production key |
| OAuth enabled flags | Only configured providers | Only configured providers |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Preview widget/site key | Production widget/site key |
| `GOOGLE_PLACES_API_KEY` | Test/restricted server key | Production/restricted server key |

Enable Maps JavaScript API on the browser key and Places API (New) on the server key. Restrict the browser key by HTTP referrer and allow the exact local, preview, and production origins. Keep the Places key out of every `NEXT_PUBLIC_` variable. The server provider uses explicit field masks, validates Google responses, proxies photo bytes through signed Palate URLs, and does not cache expiring photo references.

The current application does not need a service-role key. If a future administrative job needs it, add it only to the relevant server environment and isolate its import in a `server-only` module. Do not expose OAuth secrets in Vercel: Supabase owns those provider secrets.

Use a separate non-production Supabase project for previews and CI. Never run destructive migrations, seed resets, or browser tests against production. Add the exact production and preview callback patterns to Supabase as described in `AUTH_PROVIDERS.md`.

Before promotion, require CI, inspect the migration diff, deploy a preview, and verify security headers and auth. Production logs must use internal error IDs and safe messages, not tokens, session cookies, raw provider responses, or personal review content.

## Cloudflare DNS for `palateblend.com`

1. Add `palateblend.com` and `www.palateblend.com` to the Vercel project first.
2. Set `palateblend.com` as the primary/canonical domain and configure `www` to redirect to it in Vercel.
3. In Cloudflare DNS, create the **exact records Vercel currently displays**. Typically this is an apex A record and a `www` CNAME to a Vercel target, but Vercel may assign project-specific targets—do not copy stale generic values from documentation.
4. Start both records as **DNS only** (grey cloud) while Vercel verifies ownership and provisions certificates.
5. Wait for Vercel to show both domains as valid, then test DNS and HTTPS from outside the Cloudflare account.
6. If Cloudflare proxying is enabled later, use SSL/TLS **Full (strict)**. Keep one canonical redirect layer and check Cloudflare Redirect Rules/Page Rules so `www`, HTTP, and HTTPS do not bounce between Cloudflare and Vercel.

Verification checklist:

- `https://palateblend.com` returns the application with a valid certificate.
- `http://palateblend.com` upgrades once to HTTPS.
- `https://www.palateblend.com/path?query=1` redirects once to the same path/query on the apex domain.
- Vercel domain status is valid and Cloudflare has no conflicting AAAA, CNAME, forwarding, or redirect record.
- Supabase Site URL and production callback allowlist use the canonical apex URL.
- HSTS is enabled only after HTTPS works on every included subdomain; the app sends it in production.

If a redirect loop appears, temporarily set the Vercel DNS records to DNS-only, remove duplicate Cloudflare redirects, confirm Full (strict), and test Vercel’s canonical-domain redirect by itself.

Official references: [Vercel custom domains](https://vercel.com/docs/domains/working-with-domains/add-a-domain) and [Cloudflare Full (strict) SSL](https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/full-strict/).
