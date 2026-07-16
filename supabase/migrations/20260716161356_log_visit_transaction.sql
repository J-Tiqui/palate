create or replace function public.log_restaurant_visit(
  p_restaurant_id uuid,
  p_rating numeric,
  p_review_text text,
  p_visited_at timestamptz,
  p_tags text[],
  p_would_return boolean,
  p_occasion text,
  p_request_id uuid
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_review_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  insert into public.reviews (
    restaurant_id,
    user_id,
    rating,
    review_text,
    visit_date,
    tags,
    would_return,
    request_id
  ) values (
    p_restaurant_id,
    v_user_id,
    p_rating,
    coalesce(p_review_text, ''),
    (p_visited_at at time zone 'UTC')::date,
    coalesce(p_tags, '{}'::text[]),
    p_would_return,
    p_request_id
  )
  returning id into v_review_id;

  insert into public.visits (
    restaurant_id,
    user_id,
    visited_at,
    occasion,
    notes,
    source_review_id,
    request_id
  ) values (
    p_restaurant_id,
    v_user_id,
    p_visited_at,
    nullif(trim(coalesce(p_occasion, '')), ''),
    left(coalesce(p_review_text, ''), 2000),
    v_review_id,
    p_request_id
  );

  return v_review_id;
end;
$$;

revoke all on function public.log_restaurant_visit(uuid, numeric, text, timestamptz, text[], boolean, text, uuid) from public;
revoke all on function public.log_restaurant_visit(uuid, numeric, text, timestamptz, text[], boolean, text, uuid) from anon;
grant execute on function public.log_restaurant_visit(uuid, numeric, text, timestamptz, text[], boolean, text, uuid) to authenticated;

comment on function public.log_restaurant_visit(uuid, numeric, text, timestamptz, text[], boolean, text, uuid)
  is 'Atomically records a user-owned review and its linked visit under RLS.';
