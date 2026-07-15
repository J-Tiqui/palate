# Palate project guide

## Scope

These instructions apply to the entire repository. Palate is a production-oriented, premium social restaurant discovery app: “Letterboxd for restaurants.” Preserve working code and evolve the product incrementally rather than replacing the application wholesale.

## Current repository state

- Next.js App Router application under `src/app`.
- TypeScript is strict and uses the `@/*` alias for `src/*`.
- Tailwind CSS 4 is loaded from `src/app/globals.css`.
- Supabase browser and server clients live in `src/lib/supabase` and use `@supabase/ssr`.
- The current implementation is an early homepage backed by a `restaurants` query. Most authenticated product routes, database migrations, tests, and provider integrations are not present yet.
- `README.md` is still the create-next-app starter and should be replaced as the product matures.

## Common commands

```bash
npm install
npm run dev
npm run lint
npm run build
```

Use the npm lockfile. Add explicit scripts for type checking and test suites when those tools are introduced. Before completing meaningful changes, run lint, the relevant tests, and a production build; fix failures rather than suppressing them.

## Architecture and implementation rules

- Prefer Server Components. Add Client Components only for browser APIs, local interaction, or hooks.
- Use Server Actions and Route Handlers for trusted mutations and integrations where appropriate.
- Keep shared product logic separate from UI components. In particular, recommendation and Blend scoring must be modular, deterministic, explainable, and unit tested.
- Validate external and form input with Zod or an equivalent schema library.
- Keep strict TypeScript. Avoid `any`; if it is unavoidable, document why at the narrowest scope.
- Maintain clear loading, empty, success, and error states. Build accessible, keyboard-usable controls and mobile-first layouts.
- Preserve the warm Palate identity: cream, charcoal, soft white, muted green, wine, and espresso tones; mature rounded components; strong typography. Avoid generic SaaS gradients and dashboard-heavy layouts.
- Do not present seeded, cached, or placeholder restaurant information as live provider data.

## Supabase and data safety

- Never commit `.env*`, API keys, service-role keys, Google Maps keys, database passwords, or credentials. Commit only a value-free `.env.example` when documenting configuration.
- Expected public variables are `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`. Keep `SUPABASE_SERVICE_ROLE_KEY` and any unrestricted Places key on trusted server code only.
- Use the modern `@supabase/ssr` clients. For authorization, verify the user server-side; do not authorize from an unverified session.
- Every schema change must have a checked-in migration. Keep generated database types synchronized with migrations.
- Enable and verify RLS on every user-owned or sensitive table. Users may mutate only their own data; private content and Blend sessions must not be accessible by guessed identifiers.
- Add indexes, foreign keys, uniqueness and check constraints, safe functions, and updated-at triggers where appropriate.
- Storage policies must restrict uploads to the owning user. Never expose service-role access to browser code.
- Do not make destructive production changes without identifying the target and obtaining explicit approval.

## Product priorities

The product must grow beyond a landing page into an authenticated experience for discovery, saving, visits, reviews, taste profiles, follows, activity, lists, goals, recommendations, and group Blend sessions. Planned routes include:

`/`, `/login`, `/signup`, `/onboarding`, `/discover`, `/restaurants/[slug]`, `/restaurants/[slug]/review`, `/profile/[username]`, `/profile/edit`, `/activity`, `/saved`, `/lists`, `/lists/[id]`, `/goals`, `/blend`, `/blend/[id]`, and `/settings`.

Use a provider layer for Google Places so provider IDs, attribution, caching, and refresh timestamps remain explicit. Palate ratings must remain distinct from Google ratings. Michelin collections must use curated or properly licensed data, never unlawful scraping.

Blend is the primary differentiator. Its scoring must apply hard dietary and allergy constraints, balance all members rather than overfitting to one person, persist ranked results and the final pick, and return human-readable match reasons.

## Testing and review

- Add unit tests for recommendation scoring, Blend scoring, and hard constraints.
- Add practical authentication, authorization, RLS, and key-flow integration coverage.
- Add Playwright smoke coverage for registration/login, onboarding, saving a restaurant, posting a review, creating a Blend, and selecting a result.
- Review final diffs for broken routes, accidental secrets, unsafe authorization, stale migrations/types, fabricated data, and placeholder UI.
- Keep `README.md` current with local setup, environment variable names, migrations, tests, deployment, Supabase redirect URLs, and Google API restriction guidance.
