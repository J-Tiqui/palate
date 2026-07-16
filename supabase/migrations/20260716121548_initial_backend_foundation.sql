-- Palate initial production backend foundation.
-- All browser-accessible tables have explicit grants and row-level security.

create extension if not exists pgcrypto with schema extensions;
create extension if not exists citext with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create type public.profile_visibility as enum ('public', 'followers', 'private');
create type public.list_visibility as enum ('public', 'followers', 'private');
create type public.collaborator_role as enum ('viewer', 'editor');
create type public.follow_status as enum ('pending', 'accepted', 'blocked');
create type public.goal_kind as enum ('personal', 'challenge');
create type public.goal_status as enum ('draft', 'active', 'completed', 'cancelled');
create type public.blend_status as enum ('draft', 'open', 'locked', 'completed', 'cancelled');
create type public.blend_participant_status as enum ('invited', 'joined', 'declined');
create type public.recommendation_source as enum ('personal', 'blend', 'editorial');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username extensions.citext unique,
  display_name text not null default '',
  avatar_url text,
  bio text not null default '',
  home_city text,
  preferred_neighbourhoods text[] not null default '{}',
  favourite_cuisines text[] not null default '{}',
  disliked_cuisines text[] not null default '{}',
  preferred_vibes text[] not null default '{}',
  price_preference smallint[] not null default '{}',
  privacy public.profile_visibility not null default 'public',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (
    username is null or (
      username::text = lower(username::text)
      and username::text ~ '^[a-z0-9](?:[a-z0-9_]{1,28}[a-z0-9])?$'
      and username::text not in (
        'admin', 'api', 'auth', 'blend', 'discover', 'help', 'lists', 'login',
        'moderator', 'onboarding', 'palate', 'profile', 'restaurants', 'saved',
        'settings', 'signup', 'staff', 'support', 'system', 'www'
      )
    )
  ),
  constraint profiles_display_name_length check (char_length(display_name) <= 80),
  constraint profiles_bio_length check (char_length(bio) <= 500),
  constraint profiles_home_city_length check (home_city is null or char_length(home_city) <= 120),
  constraint profiles_neighbourhood_limit check (cardinality(preferred_neighbourhoods) <= 25),
  constraint profiles_favourite_cuisine_limit check (cardinality(favourite_cuisines) <= 25),
  constraint profiles_disliked_cuisine_limit check (cardinality(disliked_cuisines) <= 25),
  constraint profiles_vibe_limit check (cardinality(preferred_vibes) <= 25),
  constraint profiles_price_values check (price_preference <@ array[1, 2, 3, 4]::smallint[])
);

create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  slug extensions.citext not null unique,
  name text not null,
  description text,
  address_line1 text,
  city text not null,
  region text,
  country_code text not null default 'CA',
  neighbourhood text,
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  price_level smallint not null default 2,
  provider text not null default 'manual',
  provider_place_id text,
  provider_payload jsonb not null default '{}'::jsonb,
  google_rating numeric(2, 1),
  google_review_count integer,
  average_rating numeric(3, 2) not null default 0,
  review_count integer not null default 0,
  hero_image_url text,
  is_active boolean not null default true,
  provider_refreshed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint restaurants_slug_format check (slug::text ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint restaurants_name_length check (char_length(name) between 1 and 160),
  constraint restaurants_description_length check (description is null or char_length(description) <= 4000),
  constraint restaurants_country_code check (country_code ~ '^[A-Z]{2}$'),
  constraint restaurants_price_level check (price_level between 1 and 4),
  constraint restaurants_google_rating check (google_rating is null or google_rating between 0 and 5),
  constraint restaurants_google_reviews check (google_review_count is null or google_review_count >= 0),
  constraint restaurants_palate_rating check (average_rating between 0 and 5),
  constraint restaurants_review_count check (review_count >= 0),
  constraint restaurants_provider_payload_object check (jsonb_typeof(provider_payload) = 'object'),
  constraint restaurants_latitude check (latitude is null or latitude between -90 and 90),
  constraint restaurants_longitude check (longitude is null or longitude between -180 and 180)
);

create unique index restaurants_provider_identity_idx
  on public.restaurants (provider, provider_place_id)
  where provider_place_id is not null;
create index restaurants_active_city_rating_idx
  on public.restaurants (city, average_rating desc)
  where is_active;
create index restaurants_location_idx on public.restaurants (latitude, longitude);

create table public.restaurant_photos (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  storage_path text,
  source_url text,
  provider_photo_reference text,
  attribution text,
  alt_text text not null default '',
  sort_order smallint not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  constraint restaurant_photos_source check (storage_path is not null or source_url is not null),
  constraint restaurant_photos_alt_length check (char_length(alt_text) <= 240),
  constraint restaurant_photos_attribution_length check (attribution is null or char_length(attribution) <= 500),
  constraint restaurant_photos_sort_order check (sort_order >= 0)
);
create index restaurant_photos_restaurant_sort_idx
  on public.restaurant_photos (restaurant_id, is_primary desc, sort_order);
create unique index restaurant_photos_one_primary_idx
  on public.restaurant_photos (restaurant_id)
  where is_primary;

create table public.cuisine_categories (
  id smallint generated always as identity primary key,
  slug extensions.citext not null unique,
  name text not null unique,
  created_at timestamptz not null default now(),
  constraint cuisine_categories_slug_format check (slug::text ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint cuisine_categories_name_length check (char_length(name) between 1 and 80)
);

create table public.restaurant_cuisines (
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  cuisine_id smallint not null references public.cuisine_categories(id) on delete restrict,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (restaurant_id, cuisine_id)
);
create index restaurant_cuisines_cuisine_idx on public.restaurant_cuisines (cuisine_id, restaurant_id);

create table public.vibe_tags (
  id smallint generated always as identity primary key,
  slug extensions.citext not null unique,
  name text not null unique,
  created_at timestamptz not null default now(),
  constraint vibe_tags_slug_format check (slug::text ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint vibe_tags_name_length check (char_length(name) between 1 and 80)
);

create table public.restaurant_vibes (
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  vibe_id smallint not null references public.vibe_tags(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (restaurant_id, vibe_id)
);
create index restaurant_vibes_vibe_idx on public.restaurant_vibes (vibe_id, restaurant_id);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete restrict,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating numeric(2, 1) not null,
  review_text text not null default '',
  visit_date date not null default current_date,
  tags text[] not null default '{}',
  would_return boolean,
  request_id uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reviews_rating_range check (rating between 0.5 and 5),
  constraint reviews_rating_increment check (rating * 2 = trunc(rating * 2)),
  constraint reviews_text_length check (char_length(review_text) <= 5000),
  constraint reviews_tag_limit check (cardinality(tags) <= 12),
  constraint reviews_tag_lengths check (array_to_string(tags, '') = '' or char_length(array_to_string(tags, ',')) <= 600),
  unique (user_id, request_id)
);
create unique index reviews_one_per_restaurant_day_idx
  on public.reviews (user_id, restaurant_id, visit_date);
create index reviews_restaurant_recent_idx on public.reviews (restaurant_id, created_at desc);
create index reviews_user_recent_idx on public.reviews (user_id, created_at desc);

create table public.review_companions (
  review_id uuid not null references public.reviews(id) on delete cascade,
  companion_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (review_id, companion_id)
);
create index review_companions_companion_idx on public.review_companions (companion_id, created_at desc);

create table public.visits (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete restrict,
  user_id uuid not null references public.profiles(id) on delete cascade,
  visited_at timestamptz not null,
  occasion text,
  notes text not null default '',
  source_review_id uuid unique references public.reviews(id) on delete set null,
  request_id uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint visits_occasion_length check (occasion is null or char_length(occasion) <= 80),
  constraint visits_notes_length check (char_length(notes) <= 2000),
  unique (user_id, request_id)
);
create index visits_user_recent_idx on public.visits (user_id, visited_at desc);
create index visits_restaurant_recent_idx on public.visits (restaurant_id, visited_at desc);

create table public.saved_restaurants (
  user_id uuid not null references public.profiles(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, restaurant_id),
  constraint saved_restaurants_notes_length check (char_length(notes) <= 1000)
);
create index saved_restaurants_user_recent_idx on public.saved_restaurants (user_id, created_at desc);

create table public.user_taste_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  cuisine_weights jsonb not null default '{}'::jsonb,
  vibe_weights jsonb not null default '{}'::jsonb,
  dietary_restrictions text[] not null default '{}',
  allergies text[] not null default '{}',
  excluded_ingredients text[] not null default '{}',
  price_min smallint not null default 1,
  price_max smallint not null default 4,
  max_distance_km numeric(6, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint taste_cuisine_weights_object check (jsonb_typeof(cuisine_weights) = 'object'),
  constraint taste_vibe_weights_object check (jsonb_typeof(vibe_weights) = 'object'),
  constraint taste_dietary_limit check (cardinality(dietary_restrictions) <= 30),
  constraint taste_allergy_limit check (cardinality(allergies) <= 30),
  constraint taste_exclusion_limit check (cardinality(excluded_ingredients) <= 50),
  constraint taste_price_range check (price_min between 1 and 4 and price_max between 1 and 4 and price_min <= price_max),
  constraint taste_distance check (max_distance_km is null or max_distance_km between 0.1 and 500)
);

create table public.lists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text not null default '',
  visibility public.list_visibility not null default 'public',
  cover_url text,
  collaborators_can_edit boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lists_name_length check (char_length(name) between 1 and 120),
  constraint lists_description_length check (char_length(description) <= 2000)
);
create index lists_owner_recent_idx on public.lists (owner_id, created_at desc);
create index lists_public_recent_idx on public.lists (created_at desc) where visibility = 'public';

create table public.list_collaborators (
  list_id uuid not null references public.lists(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.collaborator_role not null default 'viewer',
  invited_by uuid not null references public.profiles(id) on delete restrict,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (list_id, user_id)
);
create index list_collaborators_user_idx on public.list_collaborators (user_id, accepted_at);

create table public.list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  added_by uuid not null references public.profiles(id) on delete restrict,
  position integer not null default 0,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (list_id, restaurant_id),
  constraint list_items_position check (position >= 0),
  constraint list_items_notes_length check (char_length(notes) <= 1000)
);
create index list_items_list_position_idx on public.list_items (list_id, position, created_at);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  kind public.goal_kind not null default 'personal',
  status public.goal_status not null default 'draft',
  title text not null,
  description text not null default '',
  metric text not null,
  target_count integer not null,
  starts_on date,
  ends_on date,
  visibility public.list_visibility not null default 'public',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint goals_title_length check (char_length(title) between 1 and 140),
  constraint goals_description_length check (char_length(description) <= 2000),
  constraint goals_metric_format check (metric ~ '^[a-z][a-z0-9_]{1,49}$'),
  constraint goals_target_positive check (target_count > 0),
  constraint goals_dates check (ends_on is null or starts_on is null or ends_on >= starts_on)
);
create index goals_owner_status_idx on public.goals (owner_id, status, created_at desc);

create table public.goal_progress (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  review_id uuid references public.reviews(id) on delete set null,
  visit_id uuid references public.visits(id) on delete set null,
  amount integer not null default 1,
  recorded_on date not null default current_date,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint goal_progress_amount check (amount > 0),
  constraint goal_progress_note_length check (char_length(note) <= 500),
  constraint goal_progress_source check (num_nonnulls(review_id, visit_id) <= 1)
);
create index goal_progress_goal_date_idx on public.goal_progress (goal_id, recorded_on desc);

create table public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  status public.follow_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_not_self check (follower_id <> following_id)
);
create index follows_following_status_idx on public.follows (following_id, status, created_at desc);

create table public.blend_sessions (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'Dinner Blend',
  status public.blend_status not null default 'draft',
  constraints jsonb not null default '{}'::jsonb,
  selected_restaurant_id uuid references public.restaurants(id) on delete set null,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blend_sessions_title_length check (char_length(title) between 1 and 120),
  constraint blend_sessions_constraints_object check (jsonb_typeof(constraints) = 'object')
);
create index blend_sessions_host_recent_idx on public.blend_sessions (host_id, created_at desc);

create table public.blend_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.blend_sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  invited_by uuid not null references public.profiles(id) on delete restrict,
  status public.blend_participant_status not null default 'invited',
  preferences jsonb not null default '{}'::jsonb,
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, user_id),
  constraint blend_participants_preferences_object check (jsonb_typeof(preferences) = 'object')
);
create index blend_participants_user_status_idx on public.blend_participants (user_id, status, created_at desc);

create table public.blend_results (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.blend_sessions(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete restrict,
  rank integer not null,
  score numeric(6, 3) not null,
  member_scores jsonb not null default '{}'::jsonb,
  match_reasons text[] not null default '{}',
  hard_constraints_passed boolean not null,
  created_at timestamptz not null default now(),
  unique (session_id, restaurant_id),
  unique (session_id, rank),
  constraint blend_results_rank check (rank > 0),
  constraint blend_results_score check (score between 0 and 100),
  constraint blend_results_member_scores_object check (jsonb_typeof(member_scores) = 'object'),
  constraint blend_results_reason_limit check (cardinality(match_reasons) <= 20)
);
create index blend_results_session_rank_idx on public.blend_results (session_id, rank);

create table public.recommendation_explanations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  blend_result_id uuid references public.blend_results(id) on delete cascade,
  source public.recommendation_source not null,
  score numeric(6, 3) not null,
  reasons text[] not null default '{}',
  factors jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint recommendation_subject check (num_nonnulls(user_id, blend_result_id) = 1),
  constraint recommendation_score check (score between 0 and 100),
  constraint recommendation_reason_limit check (cardinality(reasons) <= 20),
  constraint recommendation_factors_object check (jsonb_typeof(factors) = 'object')
);
create index recommendation_explanations_user_recent_idx
  on public.recommendation_explanations (user_id, created_at desc)
  where user_id is not null;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function private.normalize_profile_username()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.username is null or btrim(new.username::text) = '' then
    new.username := null;
  else
    new.username := lower(btrim(new.username::text))::extensions.citext;
  end if;
  return new;
end;
$$;

create trigger normalize_profile_username_before_write
before insert or update of username on public.profiles
for each row execute function private.normalize_profile_username();

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  initial_name text;
  initial_avatar text;
begin
  initial_name := left(coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'New diner'
  ), 80);

  initial_avatar := nullif(btrim(new.raw_user_meta_data ->> 'avatar_url'), '');
  if initial_avatar is not null and initial_avatar !~ '^https://' then
    initial_avatar := null;
  end if;

  insert into public.profiles (id, display_name, avatar_url)
  values (new.id, initial_name, initial_avatar)
  on conflict (id) do nothing;

  insert into public.user_taste_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

-- Backfill safely when this migration is applied to a project that already has users.
insert into public.profiles (id, display_name, avatar_url)
select
  auth_user.id,
  left(coalesce(
    nullif(btrim(auth_user.raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(auth_user.raw_user_meta_data ->> 'name'), ''),
    nullif(split_part(coalesce(auth_user.email, ''), '@', 1), ''),
    'New diner'
  ), 80),
  case
    when nullif(btrim(auth_user.raw_user_meta_data ->> 'avatar_url'), '') ~ '^https://'
      then nullif(btrim(auth_user.raw_user_meta_data ->> 'avatar_url'), '')
    else null
  end
from auth.users as auth_user
on conflict (id) do nothing;

insert into public.user_taste_preferences (user_id)
select id from public.profiles
on conflict (user_id) do nothing;

create or replace function private.sync_restaurant_rating()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_id uuid;
begin
  if tg_op = 'DELETE' then
    target_id := old.restaurant_id;
  else
    target_id := new.restaurant_id;
  end if;

  update public.restaurants as restaurant
  set average_rating = coalesce(summary.average_rating, 0),
      review_count = coalesce(summary.review_count, 0),
      updated_at = now()
  from (
    select round(avg(review.rating)::numeric, 2) as average_rating,
           count(*)::integer as review_count
    from public.reviews as review
    where review.restaurant_id = target_id
  ) as summary
  where restaurant.id = target_id;

  if tg_op = 'UPDATE' and old.restaurant_id <> new.restaurant_id then
    update public.restaurants as restaurant
    set average_rating = coalesce(summary.average_rating, 0),
        review_count = coalesce(summary.review_count, 0),
        updated_at = now()
    from (
      select round(avg(review.rating)::numeric, 2) as average_rating,
             count(*)::integer as review_count
      from public.reviews as review
      where review.restaurant_id = old.restaurant_id
    ) as summary
    where restaurant.id = old.restaurant_id;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger sync_restaurant_rating_after_review
after insert or update of rating, restaurant_id or delete on public.reviews
for each row execute function private.sync_restaurant_rating();

create or replace function private.add_blend_host_as_participant()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.blend_participants (
    session_id, user_id, invited_by, status, preferences, joined_at
  ) values (
    new.id, new.host_id, new.host_id, 'joined', '{}'::jsonb, now()
  );
  return new;
end;
$$;

create trigger add_blend_host_after_session_create
after insert on public.blend_sessions
for each row execute function private.add_blend_host_as_participant();

create or replace function private.enforce_blend_participant_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.blend_participants where session_id = new.session_id) >= 20 then
    raise exception 'A Blend can include at most 20 participants' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger enforce_blend_participant_limit_before_insert
before insert on public.blend_participants
for each row execute function private.enforce_blend_participant_limit();

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function private.set_updated_at();
create trigger restaurants_set_updated_at before update on public.restaurants
for each row execute function private.set_updated_at();
create trigger reviews_set_updated_at before update on public.reviews
for each row execute function private.set_updated_at();
create trigger visits_set_updated_at before update on public.visits
for each row execute function private.set_updated_at();
create trigger saved_restaurants_set_updated_at before update on public.saved_restaurants
for each row execute function private.set_updated_at();
create trigger taste_preferences_set_updated_at before update on public.user_taste_preferences
for each row execute function private.set_updated_at();
create trigger lists_set_updated_at before update on public.lists
for each row execute function private.set_updated_at();
create trigger list_items_set_updated_at before update on public.list_items
for each row execute function private.set_updated_at();
create trigger goals_set_updated_at before update on public.goals
for each row execute function private.set_updated_at();
create trigger goal_progress_set_updated_at before update on public.goal_progress
for each row execute function private.set_updated_at();
create trigger follows_set_updated_at before update on public.follows
for each row execute function private.set_updated_at();
create trigger blend_sessions_set_updated_at before update on public.blend_sessions
for each row execute function private.set_updated_at();
create trigger blend_participants_set_updated_at before update on public.blend_participants
for each row execute function private.set_updated_at();

create or replace function private.can_view_profile(target_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles as profile
    where profile.id = target_profile_id
      and (
        profile.privacy = 'public'
        or profile.id = (select auth.uid())
        or (
          profile.privacy = 'followers'
          and exists (
            select 1 from public.follows as follow
            where follow.follower_id = (select auth.uid())
              and follow.following_id = profile.id
              and follow.status = 'accepted'
          )
        )
      )
  );
$$;

create or replace function private.can_view_list(target_list_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.lists as restaurant_list
    where restaurant_list.id = target_list_id
      and (
        restaurant_list.visibility = 'public'
        or restaurant_list.owner_id = (select auth.uid())
        or exists (
          select 1 from public.list_collaborators as collaborator
          where collaborator.list_id = restaurant_list.id
            and collaborator.user_id = (select auth.uid())
            and collaborator.accepted_at is not null
        )
        or (
          restaurant_list.visibility = 'followers'
          and exists (
            select 1 from public.follows as follow
            where follow.follower_id = (select auth.uid())
              and follow.following_id = restaurant_list.owner_id
              and follow.status = 'accepted'
          )
        )
      )
  );
$$;

create or replace function private.can_edit_list(target_list_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.lists as restaurant_list
    where restaurant_list.id = target_list_id
      and (
        restaurant_list.owner_id = (select auth.uid())
        or (
          restaurant_list.collaborators_can_edit
          and exists (
            select 1 from public.list_collaborators as collaborator
            where collaborator.list_id = restaurant_list.id
              and collaborator.user_id = (select auth.uid())
              and collaborator.role = 'editor'
              and collaborator.accepted_at is not null
          )
        )
      )
  );
$$;

create or replace function private.can_view_goal(target_goal_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.goals as goal
    where goal.id = target_goal_id
      and (
        goal.owner_id = (select auth.uid())
        or (goal.visibility = 'public' and private.can_view_profile(goal.owner_id))
        or (
          goal.visibility = 'followers'
          and exists (
            select 1 from public.follows as follow
            where follow.follower_id = (select auth.uid())
              and follow.following_id = goal.owner_id
              and follow.status = 'accepted'
          )
        )
      )
  );
$$;

create or replace function private.can_access_blend(target_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.blend_sessions as blend
    where blend.id = target_session_id
      and (
        blend.host_id = (select auth.uid())
        or exists (
          select 1 from public.blend_participants as participant
          where participant.session_id = blend.id
            and participant.user_id = (select auth.uid())
            and participant.status in ('invited', 'joined')
        )
      )
  );
$$;

create or replace function private.storage_owner_id(object_name text)
returns uuid
language plpgsql
immutable
set search_path = ''
as $$
declare
  first_folder text;
begin
  first_folder := (storage.foldername(object_name))[1];
  if first_folder is null or first_folder !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    return null;
  end if;
  return first_folder::uuid;
end;
$$;

revoke all on all functions in schema private from public, anon, authenticated;
grant usage on schema private to anon, authenticated;
grant execute on function private.can_view_profile(uuid) to anon, authenticated;
grant execute on function private.can_view_list(uuid) to anon, authenticated;
grant execute on function private.can_edit_list(uuid) to authenticated;
grant execute on function private.can_view_goal(uuid) to anon, authenticated;
grant execute on function private.can_access_blend(uuid) to authenticated;
grant execute on function private.storage_owner_id(text) to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.restaurants enable row level security;
alter table public.restaurant_photos enable row level security;
alter table public.cuisine_categories enable row level security;
alter table public.restaurant_cuisines enable row level security;
alter table public.vibe_tags enable row level security;
alter table public.restaurant_vibes enable row level security;
alter table public.reviews enable row level security;
alter table public.review_companions enable row level security;
alter table public.visits enable row level security;
alter table public.saved_restaurants enable row level security;
alter table public.user_taste_preferences enable row level security;
alter table public.lists enable row level security;
alter table public.list_collaborators enable row level security;
alter table public.list_items enable row level security;
alter table public.goals enable row level security;
alter table public.goal_progress enable row level security;
alter table public.follows enable row level security;
alter table public.blend_sessions enable row level security;
alter table public.blend_participants enable row level security;
alter table public.blend_results enable row level security;
alter table public.recommendation_explanations enable row level security;

create policy profiles_select_visible on public.profiles
for select to anon, authenticated
using (private.can_view_profile(id));
create policy profiles_update_own on public.profiles
for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy restaurants_select_active on public.restaurants
for select to anon, authenticated using (is_active);
create policy restaurant_photos_select_active on public.restaurant_photos
for select to anon, authenticated
using (exists (select 1 from public.restaurants where restaurants.id = restaurant_id and restaurants.is_active));
create policy cuisine_categories_select on public.cuisine_categories
for select to anon, authenticated using (true);
create policy restaurant_cuisines_select_active on public.restaurant_cuisines
for select to anon, authenticated
using (exists (select 1 from public.restaurants where restaurants.id = restaurant_id and restaurants.is_active));
create policy vibe_tags_select on public.vibe_tags
for select to anon, authenticated using (true);
create policy restaurant_vibes_select_active on public.restaurant_vibes
for select to anon, authenticated
using (exists (select 1 from public.restaurants where restaurants.id = restaurant_id and restaurants.is_active));

create policy reviews_select_visible_author on public.reviews
for select to anon, authenticated using (private.can_view_profile(user_id));
create policy reviews_insert_own on public.reviews
for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.restaurants where restaurants.id = restaurant_id and restaurants.is_active)
);
create policy reviews_update_own on public.reviews
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy reviews_delete_own on public.reviews
for delete to authenticated using ((select auth.uid()) = user_id);

create policy review_companions_select_visible_review on public.review_companions
for select to anon, authenticated
using (exists (select 1 from public.reviews where reviews.id = review_id));
create policy review_companions_insert_review_owner on public.review_companions
for insert to authenticated
with check (exists (
  select 1 from public.reviews
  where reviews.id = review_id and reviews.user_id = (select auth.uid())
));
create policy review_companions_delete_review_owner on public.review_companions
for delete to authenticated
using (exists (
  select 1 from public.reviews
  where reviews.id = review_id and reviews.user_id = (select auth.uid())
));

create policy visits_select_own on public.visits
for select to authenticated using ((select auth.uid()) = user_id);
create policy visits_insert_own on public.visits
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy visits_update_own on public.visits
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy visits_delete_own on public.visits
for delete to authenticated using ((select auth.uid()) = user_id);

create policy saved_restaurants_select_own on public.saved_restaurants
for select to authenticated using ((select auth.uid()) = user_id);
create policy saved_restaurants_insert_own on public.saved_restaurants
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy saved_restaurants_update_own on public.saved_restaurants
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy saved_restaurants_delete_own on public.saved_restaurants
for delete to authenticated using ((select auth.uid()) = user_id);

create policy taste_preferences_select_own on public.user_taste_preferences
for select to authenticated using ((select auth.uid()) = user_id);
create policy taste_preferences_insert_own on public.user_taste_preferences
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy taste_preferences_update_own on public.user_taste_preferences
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy lists_select_visible on public.lists
for select to anon, authenticated using (private.can_view_list(id));
create policy lists_insert_own on public.lists
for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy lists_update_owner on public.lists
for update to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);
create policy lists_delete_owner on public.lists
for delete to authenticated using ((select auth.uid()) = owner_id);

create policy list_collaborators_select_involved on public.list_collaborators
for select to authenticated
using (
  user_id = (select auth.uid())
  or exists (select 1 from public.lists where lists.id = list_id and lists.owner_id = (select auth.uid()))
);
create policy list_collaborators_insert_owner on public.list_collaborators
for insert to authenticated
with check (
  invited_by = (select auth.uid())
  and exists (select 1 from public.lists where lists.id = list_id and lists.owner_id = (select auth.uid()))
);
create policy list_collaborators_delete_involved on public.list_collaborators
for delete to authenticated
using (
  user_id = (select auth.uid())
  or exists (select 1 from public.lists where lists.id = list_id and lists.owner_id = (select auth.uid()))
);

create policy list_items_select_visible_list on public.list_items
for select to anon, authenticated using (private.can_view_list(list_id));
create policy list_items_insert_editor on public.list_items
for insert to authenticated
with check (private.can_edit_list(list_id) and added_by = (select auth.uid()));
create policy list_items_update_editor on public.list_items
for update to authenticated
using (private.can_edit_list(list_id))
with check (private.can_edit_list(list_id));
create policy list_items_delete_editor on public.list_items
for delete to authenticated using (private.can_edit_list(list_id));

create policy goals_select_visible on public.goals
for select to anon, authenticated using (private.can_view_goal(id));
create policy goals_insert_own on public.goals
for insert to authenticated with check (owner_id = (select auth.uid()));
create policy goals_update_own on public.goals
for update to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));
create policy goals_delete_own on public.goals
for delete to authenticated using (owner_id = (select auth.uid()));

create policy goal_progress_select_visible_goal on public.goal_progress
for select to anon, authenticated using (private.can_view_goal(goal_id));
create policy goal_progress_insert_owner on public.goal_progress
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (select 1 from public.goals where goals.id = goal_id and goals.owner_id = (select auth.uid()))
);
create policy goal_progress_update_owner on public.goal_progress
for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
create policy goal_progress_delete_owner on public.goal_progress
for delete to authenticated using (user_id = (select auth.uid()));

create policy follows_select_involved on public.follows
for select to authenticated
using (follower_id = (select auth.uid()) or following_id = (select auth.uid()));
create policy follows_insert_as_self_pending on public.follows
for insert to authenticated
with check (follower_id = (select auth.uid()) and status = 'pending');
create policy follows_update_recipient on public.follows
for update to authenticated
using (following_id = (select auth.uid()))
with check (following_id = (select auth.uid()));
create policy follows_delete_involved on public.follows
for delete to authenticated
using (follower_id = (select auth.uid()) or following_id = (select auth.uid()));

create policy blend_sessions_select_participant on public.blend_sessions
for select to authenticated using (private.can_access_blend(id));
create policy blend_sessions_insert_host on public.blend_sessions
for insert to authenticated with check (host_id = (select auth.uid()));
create policy blend_sessions_update_host on public.blend_sessions
for update to authenticated
using (host_id = (select auth.uid()))
with check (host_id = (select auth.uid()));
create policy blend_sessions_delete_host on public.blend_sessions
for delete to authenticated using (host_id = (select auth.uid()));

create policy blend_participants_select_session_member on public.blend_participants
for select to authenticated using (private.can_access_blend(session_id));
create policy blend_participants_insert_host_invite on public.blend_participants
for insert to authenticated
with check (
  invited_by = (select auth.uid())
  and status = 'invited'
  and exists (
    select 1 from public.blend_sessions
    where blend_sessions.id = session_id and blend_sessions.host_id = (select auth.uid())
  )
);
create policy blend_participants_update_self on public.blend_participants
for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
create policy blend_participants_delete_self_or_host on public.blend_participants
for delete to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1 from public.blend_sessions
    where blend_sessions.id = session_id and blend_sessions.host_id = (select auth.uid())
  )
);

create policy blend_results_select_session_member on public.blend_results
for select to authenticated using (private.can_access_blend(session_id));

create policy recommendation_explanations_select_subject on public.recommendation_explanations
for select to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1 from public.blend_results
    where blend_results.id = blend_result_id
      and private.can_access_blend(blend_results.session_id)
  )
);

revoke all on all tables in schema public from anon, authenticated;

grant select on table
  public.profiles,
  public.restaurants,
  public.restaurant_photos,
  public.cuisine_categories,
  public.restaurant_cuisines,
  public.vibe_tags,
  public.restaurant_vibes,
  public.reviews,
  public.review_companions,
  public.lists,
  public.list_items,
  public.goals,
  public.goal_progress
to anon, authenticated;

grant select on table
  public.visits,
  public.saved_restaurants,
  public.user_taste_preferences,
  public.list_collaborators,
  public.follows,
  public.blend_sessions,
  public.blend_participants,
  public.blend_results,
  public.recommendation_explanations
to authenticated;

grant update (
  username, display_name, avatar_url, bio, home_city, preferred_neighbourhoods,
  favourite_cuisines, disliked_cuisines, preferred_vibes, price_preference,
  privacy, onboarding_completed
) on table public.profiles to authenticated;

grant insert (restaurant_id, user_id, rating, review_text, visit_date, tags, would_return, request_id)
  on table public.reviews to authenticated;
grant update (rating, review_text, visit_date, tags, would_return)
  on table public.reviews to authenticated;
grant delete on table public.reviews to authenticated;

grant insert (review_id, companion_id) on table public.review_companions to authenticated;
grant delete on table public.review_companions to authenticated;

grant insert (restaurant_id, user_id, visited_at, occasion, notes, source_review_id, request_id)
  on table public.visits to authenticated;
grant update (visited_at, occasion, notes) on table public.visits to authenticated;
grant delete on table public.visits to authenticated;

grant insert (user_id, restaurant_id, notes) on table public.saved_restaurants to authenticated;
grant update (notes) on table public.saved_restaurants to authenticated;
grant delete on table public.saved_restaurants to authenticated;

grant insert (user_id, cuisine_weights, vibe_weights, dietary_restrictions, allergies, excluded_ingredients, price_min, price_max, max_distance_km)
  on table public.user_taste_preferences to authenticated;
grant update (cuisine_weights, vibe_weights, dietary_restrictions, allergies, excluded_ingredients, price_min, price_max, max_distance_km)
  on table public.user_taste_preferences to authenticated;

grant insert (owner_id, name, description, visibility, cover_url, collaborators_can_edit)
  on table public.lists to authenticated;
grant update (name, description, visibility, cover_url, collaborators_can_edit)
  on table public.lists to authenticated;
grant delete on table public.lists to authenticated;

grant insert (list_id, user_id, role, invited_by, accepted_at)
  on table public.list_collaborators to authenticated;
grant delete on table public.list_collaborators to authenticated;

grant insert (list_id, restaurant_id, added_by, position, notes)
  on table public.list_items to authenticated;
grant update (position, notes) on table public.list_items to authenticated;
grant delete on table public.list_items to authenticated;

grant insert (owner_id, kind, status, title, description, metric, target_count, starts_on, ends_on, visibility)
  on table public.goals to authenticated;
grant update (kind, status, title, description, metric, target_count, starts_on, ends_on, visibility)
  on table public.goals to authenticated;
grant delete on table public.goals to authenticated;

grant insert (goal_id, user_id, review_id, visit_id, amount, recorded_on, note)
  on table public.goal_progress to authenticated;
grant update (review_id, visit_id, amount, recorded_on, note)
  on table public.goal_progress to authenticated;
grant delete on table public.goal_progress to authenticated;

grant insert (follower_id, following_id, status) on table public.follows to authenticated;
grant update (status) on table public.follows to authenticated;
grant delete on table public.follows to authenticated;

grant insert (host_id, title, status, constraints, selected_restaurant_id, expires_at)
  on table public.blend_sessions to authenticated;
grant update (title, status, constraints, selected_restaurant_id, expires_at)
  on table public.blend_sessions to authenticated;
grant delete on table public.blend_sessions to authenticated;

grant insert (session_id, user_id, invited_by, status, preferences, joined_at)
  on table public.blend_participants to authenticated;
grant update (status, preferences, joined_at) on table public.blend_participants to authenticated;
grant delete on table public.blend_participants to authenticated;

grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
grant usage on schema private to service_role;
grant execute on all functions in schema private to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('restaurant-photos', 'restaurant-photos', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy avatar_objects_select_visible_profile on storage.objects
for select to anon, authenticated
using (
  bucket_id = 'avatars'
  and (
    private.storage_owner_id(name) = (select auth.uid())
    or private.can_view_profile(private.storage_owner_id(name))
  )
);
create policy avatar_objects_insert_owner_path on storage.objects
for insert to authenticated
with check (bucket_id = 'avatars' and private.storage_owner_id(name) = (select auth.uid()));
create policy avatar_objects_update_owner_path on storage.objects
for update to authenticated
using (bucket_id = 'avatars' and private.storage_owner_id(name) = (select auth.uid()))
with check (bucket_id = 'avatars' and private.storage_owner_id(name) = (select auth.uid()));
create policy avatar_objects_delete_owner_path on storage.objects
for delete to authenticated
using (bucket_id = 'avatars' and private.storage_owner_id(name) = (select auth.uid()));
create policy restaurant_photo_objects_public_read on storage.objects
for select to anon, authenticated using (bucket_id = 'restaurant-photos');
