# Palate backend foundation implementation plan

## Repository audit (before implementation)

- Framework: Next.js 16.2 App Router with strict TypeScript, React 19.2, Tailwind CSS 4, and npm.
- Existing frontend: one server-rendered homepage in `src/app/page.tsx`; its warm cream, wine, green, and espresso visual language will be preserved.
- Existing data access: the homepage reads six rows from `restaurants`; there is no loading/error/empty explanation beyond an empty grid.
- Existing Supabase code: browser and server clients use `@supabase/ssr`, but there is no session-refresh proxy, typed schema, environment validation, migration, seed, or authorization helper.
- Authentication: no pages, actions, callback, logout, verification, reset-password, onboarding, or provider integration exists.
- Product routes: homepage links to `/login`, `/discover`, and `/blend`, but none exists. “Pick for us” is a dead button and restaurant cards are not linked.
- Server surface: no Route Handlers, Server Actions, API routes, middleware/proxy, or tests exist.
- Deployment: no Vercel configuration or deployment documentation exists. The README is still the create-next-app starter.
- Environment: tracked source references only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; no tracked environment file exists.
- Repository safety: the untracked `local-before-github-pull-20260715-170619/` directory is user-owned backup material and is intentionally excluded from this implementation.

## Incremental implementation

1. Add validated public/server environment modules, typed Supabase clients, verified-user authorization helpers, and the Next.js session-refresh proxy.
2. Add a checked-in Supabase project configuration, one reviewed foundation migration, safe development seed data, generated-style database types, RLS policies, storage policies, constraints, and indexes.
3. Add polished email/password and OAuth authentication flows, callback/error handling, logout, password recovery, profile creation, username selection, and onboarding.
4. Connect the existing homepage controls to real discovery, restaurant, saved, review, and Blend-foundation routes; protected operations will re-check identity server-side and validate all input with Zod.
5. Add application hardening, safe redirects, no-store handling for authenticated routes, provider/deployment/DNS documentation, dependency/secret-scanning CI, and tests for validation and authorization boundaries.
6. Run type checking, lint, unit tests, build, dependency audit, and a redacted secret scan. Database/RLS and OAuth tests that require external Supabase/provider credentials will be documented as manual gates rather than reported as completed.
