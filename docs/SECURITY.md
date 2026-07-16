# Security operations

## Controls in this repository

- Supabase SSR cookies are refreshed in `src/proxy.ts`; trusted authorization uses server-side `getUser()` rather than browser session metadata.
- Mutations derive `auth.uid()` on the server, validate FormData with Zod, restrict redirects to local paths, and expose normal-user-safe error text.
- PostgreSQL constraints and RLS enforce ownership even if a caller bypasses the UI.
- CSP, HSTS in production, frame denial, MIME sniffing protection, a restrictive referrer policy, permissions policy, disabled browser production source maps, and no-store headers on sensitive routes are configured in `next.config.ts`.
- Auth signup supports Cloudflare Turnstile through Supabase CAPTCHA verification. Password rules, email verification, and local auth rate limits are configured in `supabase/config.toml`; mirror and tune them in the hosted dashboard.
- CI type-checks, lints, tests, builds, audits dependencies, and scans full Git history with Gitleaks. Dependabot covers npm and Actions.

Review the CSP whenever adding maps, analytics, image hosts, payment widgets, or third-party scripts. Prefer nonces when Next.js deployment constraints permit removing inline script/style allowances.

## Secret handling and rotation

Real credentials belong in Supabase/Vercel/Cloudflare secret stores, not `.env.example`, source, logs, screenshots, or issues. `.gitignore` excludes local environment files and common private-key forms. Keep service-role, database, provider-secret, Turnstile-secret, Vercel-token, and Cloudflare-token values server-only.

If a credential may have been committed:

1. Revoke/rotate it at the issuer immediately; repository cleanup does not invalidate it.
2. Remove it from the current tree and replace it with an environment variable.
3. Use `git filter-repo` or BFG on a reviewed clone to purge history, coordinate a force-push, and have every collaborator re-clone.
4. Review access/audit logs and dependent deployments, then update secret stores.
5. Re-run Gitleaks across all refs and tags. Never paste the discovered value into a ticket or terminal transcript.

Enable GitHub push protection/secret scanning where the repository plan supports it. Protect `main`, require CI, and restrict who can change workflows, environments, domains, and production database settings.

## Abuse and data safety

Hosted Supabase must enforce email confirmation, strong passwords, SMTP limits, sign-in/sign-up rate limits, refresh-token rotation, and Turnstile for sign-up. Add application-level durable rate limits before opening high-volume review creation, invites, uploads, or provider search to the public. The schema currently limits duplicate saves/reviews and Blend membership; the UI does not yet expose public invitations.

Render reviews as React text only—no arbitrary HTML. Keep Google provider field masks narrow, cache refresh times explicit, show required attribution, and never represent seed/cached data as live provider data.

## Backups and recovery

Enable Supabase production backups and Point-in-Time Recovery where the plan and recovery objectives require it. Record RPO/RTO, encrypt exports, restrict restore access, and regularly restore into an isolated project to verify both data and auth/storage assumptions. Database backups alone may not cover Storage objects; include and test an object-storage recovery plan. Export schema/migrations to source control, not production rows.

## Incident and auth troubleshooting

- Suspected session leak: revoke affected sessions/keys, rotate signing/provider secrets when applicable, inspect auth logs, and notify affected users under the incident policy.
- Unexpected private data: reproduce as anonymous and a second user, stop the affected feature, inspect grants plus RLS, add a pgTAP regression, then deploy the policy fix before re-enabling.
- Auth callback loop: verify canonical URL, proxy cookie propagation, Supabase redirect allowlist, Cloudflare redirect rules, and HTTPS mode.
- Production-only CAPTCHA/email failure: compare the production widget hostnames, Supabase CAPTCHA secret, SMTP sender, rate limits, and email template URLs without logging tokens.
- Migration failure: stop deployment, preserve the error ID and migration name, test a forward corrective migration on a restored copy, and never edit an already-applied production migration in place.
