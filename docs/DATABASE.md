# Database, storage, and authorization

Checked-in files under `supabase/migrations` are the schema source of truth; `src/types/database.ts` mirrors the resulting schema for application code.

## Model

- `profiles` is one-to-one with `auth.users`; a security-definer trigger creates safe defaults from trusted auth metadata.
- `restaurants` owns `restaurant_photos` and normalized many-to-many `restaurant_cuisines`/`cuisine_categories` and `restaurant_vibes`/`vibe_tags`.
- `reviews` owns `review_companions`; `visits` records logs; `saved_restaurants` prevents duplicate user/restaurant saves.
- `user_taste_preferences` stores safety-sensitive onboarding and recommendation inputs per user. Price is intentionally a per-search map/Blend constraint, not an account preference.
- `lists` owns ordered `list_items`; `list_collaborators` grants explicit editor/viewer membership.
- `goals` owns `goal_progress`.
- `follows` models directed requests/relationships.
- `blend_sessions` owns participants and ranked results. Participants store declared constraints; results store a score snapshot and human-readable reasons.
- `recommendation_explanations` records why a candidate was recommended without conflating provider and Palate ratings.

Ratings are constrained to half-star increments from 0.5–5.0. Usernames use case-insensitive `citext`, normalized characters, length checks, reserved-name rejection, and a unique constraint. Foreign keys, bounded text/array checks, update timestamps, aggregate rating maintenance, maximum Blend membership, and useful ownership/feed/search indexes are enforced in PostgreSQL.

## RLS boundary

RLS is enabled on every exposed table. Policies provide:

- privacy-aware profile reads; self-only profile and taste updates;
- public restaurant/taxonomy reads with trusted-server writes;
- published review reads and author-only review/companion mutation;
- self-only visit and saved-place access;
- owner/collaborator list access with private lists hidden from other users;
- owner-visible/private goal access;
- public-profile-aware follow reads with self-controlled request mutations;
- host/participant-only Blend access, self-only participant preference changes, immutable participant identity, and trusted-server result writes;
- owner-only recommendation explanation reads and trusted-server writes.

Helper functions live in a non-exposed `private` schema, use fixed empty `search_path` values, and have narrowly granted execute permissions. Column-level grants prevent ownership fields from being reassigned even when a row update is allowed. Server Actions still authenticate and validate before reaching RLS; both layers are intentional.

The public `complete_onboarding` function is a narrowly granted, security-invoker transaction. It verifies `auth.uid()`, saves the user's profile and taste constraints together, and remains subject to the same grants and RLS policies as direct writes.

## Storage

- `avatars`: private, owner-path writes only. A signed-URL delivery flow should be used when avatar upload UI is added.
- `restaurant-photos`: public read, trusted ingestion writes only.

Storage policies require the first path segment for avatars to match `auth.uid()`. Keep hosted bucket size and MIME restrictions aligned with the migration before enabling uploads.

## Local migrations and tests

```bash
npm run supabase:start
npm run supabase:reset
npm run supabase:test
npm exec --yes --package=supabase@2.109.1 -- supabase db lint
```

The pgTAP suite in `supabase/tests/database/rls.test.sql` creates multiple users and verifies anonymous restrictions, automatic profile creation, ownership, private lists, saved restaurants, reviews, and Blend participant isolation. Run it against a disposable local or test project, never the production database.

For a new migration, use `npm exec --yes --package=supabase@2.109.1 -- supabase migration new NAME`, edit the generated file, reset locally, rerun tests, regenerate TypeScript types, and review the SQL before pushing.

Seed records use `provider = 'seed'`, deterministic UUIDs, and explicit development labels. They are not live Google or Michelin data and must not be presented as such.
