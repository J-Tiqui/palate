-- Price is a per-search map filter, not an enduring account preference.
alter table public.profiles
  drop constraint if exists profiles_price_values,
  drop column if exists price_preference;

alter table public.user_taste_preferences
  drop constraint if exists taste_price_range,
  drop column if exists price_min,
  drop column if exists price_max;

-- Save the two onboarding records together. This also avoids an upsert attempting
-- to update the immutable user_id column on an existing taste-preference row.
create or replace function public.complete_onboarding(
  p_user_id uuid,
  p_username text,
  p_display_name text,
  p_home_city text,
  p_favourite_cuisines text[],
  p_disliked_cuisines text[],
  p_preferred_vibes text[],
  p_dietary_restrictions text[],
  p_allergies text[]
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or (select auth.uid()) <> p_user_id then
    raise exception 'You may only complete your own onboarding.' using errcode = '42501';
  end if;

  insert into public.user_taste_preferences (
    user_id,
    dietary_restrictions,
    allergies
  ) values (
    p_user_id,
    coalesce(p_dietary_restrictions, '{}'::text[]),
    coalesce(p_allergies, '{}'::text[])
  )
  on conflict (user_id) do update
  set dietary_restrictions = excluded.dietary_restrictions,
      allergies = excluded.allergies;

  update public.profiles
  set username = p_username,
      display_name = p_display_name,
      home_city = p_home_city,
      favourite_cuisines = coalesce(p_favourite_cuisines, '{}'::text[]),
      disliked_cuisines = coalesce(p_disliked_cuisines, '{}'::text[]),
      preferred_vibes = coalesce(p_preferred_vibes, '{}'::text[]),
      onboarding_completed = true
  where id = p_user_id;

  if not found then
    raise exception 'Profile not found.' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.complete_onboarding(uuid, text, text, text, text[], text[], text[], text[], text[])
  from public, anon;
grant execute on function public.complete_onboarding(uuid, text, text, text, text[], text[], text[], text[], text[])
  to authenticated;
