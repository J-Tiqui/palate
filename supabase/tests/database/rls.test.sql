begin;

create extension if not exists pgtap with schema extensions;
select plan(36);

select has_function(
  'public',
  'complete_onboarding',
  array['uuid', 'text', 'text', 'text', 'text[]', 'text[]', 'text[]', 'text[]', 'text[]'],
  'atomic onboarding function exists'
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.complete_onboarding(uuid,text,text,text,text[],text[],text[],text[],text[])',
    'EXECUTE'
  ),
  'authenticated users can execute atomic onboarding'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.complete_onboarding(uuid,text,text,text,text[],text[],text[],text[],text[])',
    'EXECUTE'
  ),
  'anonymous users cannot execute atomic onboarding'
);

select has_function(
  'public',
  'log_restaurant_visit',
  array['uuid', 'numeric', 'text', 'timestamptz', 'text[]', 'boolean', 'text', 'uuid'],
  'atomic restaurant visit function exists'
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.log_restaurant_visit(uuid,numeric,text,timestamptz,text[],boolean,text,uuid)',
    'EXECUTE'
  ),
  'authenticated users can execute atomic visit logging'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.log_restaurant_visit(uuid,numeric,text,timestamptz,text[],boolean,text,uuid)',
    'EXECUTE'
  ),
  'anonymous users cannot execute atomic visit logging'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.profiles'::regclass),
  'profiles has RLS enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.reviews'::regclass),
  'reviews has RLS enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.saved_restaurants'::regclass),
  'saved restaurants has RLS enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.blend_sessions'::regclass),
  'Blend sessions has RLS enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.lists'::regclass),
  'lists has RLS enabled'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'authenticated', 'authenticated', 'alice@example.test', crypt('StrongPassword123', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{"full_name":"Alice"}', now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'authenticated', 'authenticated', 'bob@example.test', crypt('StrongPassword123', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{"full_name":"Bob"}', now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    'authenticated', 'authenticated', 'charlie@example.test', crypt('StrongPassword123', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{"full_name":"Charlie"}', now(), now(), '', '', '', ''
  );

select is((select count(*)::integer from public.profiles), 3, 'auth trigger creates one profile per user');

update public.profiles set username = 'alice', privacy = 'private' where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
update public.profiles set username = 'bob', privacy = 'public' where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
update public.profiles set username = 'charlie', privacy = 'private' where id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

select throws_ok(
  $$update public.profiles set username = 'ALICE' where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'$$,
  'username uniqueness is case-insensitive'
);

insert into public.restaurants (id, slug, name, city, provider)
values ('10000000-0000-4000-8000-000000000099', 'rls-test-restaurant', 'RLS Test Restaurant', 'Toronto', 'test');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', true);
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}', true);

select results_eq(
  $$select username::text from public.profiles order by username::text$$,
  array['alice', 'bob']::text[],
  'a user sees their own private profile and public profiles, not other private profiles'
);

select results_eq(
  $$update public.profiles set display_name = 'Impersonated' where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' returning id$$,
  array[]::uuid[],
  'a user cannot update another profile'
);

select results_eq(
  $$update public.profiles set display_name = 'Alice Updated' where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' returning id$$,
  array['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa']::uuid[],
  'a user can update their own profile'
);

select lives_ok(
  $$select public.complete_onboarding(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'alice_eats',
    'Alice Eats',
    'Toronto',
    array['Japanese', 'Thai']::text[],
    array['French']::text[],
    array['Date night']::text[],
    array['Vegetarian']::text[],
    array['Peanuts']::text[]
  )$$,
  'a user can atomically complete their own onboarding'
);

select is(
  (select onboarding_completed from public.profiles where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  true,
  'atomic onboarding marks the profile complete'
);

select is(
  (select allergies from public.user_taste_preferences where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  array['Peanuts']::text[],
  'atomic onboarding saves private allergy constraints'
);

select throws_ok(
  $$select public.complete_onboarding(
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'bob_eats',
    'Bob Eats',
    'Toronto',
    '{}'::text[],
    '{}'::text[],
    '{}'::text[],
    '{}'::text[],
    '{}'::text[]
  )$$,
  'a user cannot complete onboarding for another user'
);

select lives_ok(
  $$insert into public.reviews (restaurant_id, user_id, rating, visit_date, request_id)
    values ('10000000-0000-4000-8000-000000000099', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 4.5, current_date, '11000000-0000-4000-8000-000000000001')$$,
  'a user can create their own review'
);

select lives_ok(
  $$select public.log_restaurant_visit(
    '10000000-0000-4000-8000-000000000099',
    4.0,
    'Atomic visit test',
    (current_date - 1)::timestamptz,
    array['friends']::text[],
    true,
    'Friends',
    '11000000-0000-4000-8000-000000000003'
  )$$,
  'a user can atomically create their own linked review and visit'
);

select is(
  (
    select count(*)::integer
    from public.visits
    join public.reviews on reviews.id = visits.source_review_id
    where visits.request_id = '11000000-0000-4000-8000-000000000003'
      and reviews.request_id = '11000000-0000-4000-8000-000000000003'
  ),
  1,
  'atomic visit logging links exactly one visit to its review'
);

select throws_ok(
  $$insert into public.reviews (restaurant_id, user_id, rating, visit_date, request_id)
    values ('10000000-0000-4000-8000-000000000099', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 4.5, current_date, '11000000-0000-4000-8000-000000000002')$$,
  'a user cannot create a review for another user'
);

select lives_ok(
  $$insert into public.saved_restaurants (user_id, restaurant_id)
    values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '10000000-0000-4000-8000-000000000099')$$,
  'a user can save a restaurant for themselves'
);

select throws_ok(
  $$insert into public.saved_restaurants (user_id, restaurant_id)
    values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '10000000-0000-4000-8000-000000000099')$$,
  'a user cannot save a restaurant for another user'
);

select lives_ok(
  $$insert into public.blend_sessions (id, host_id, title, status)
    values ('20000000-0000-4000-8000-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Private Blend', 'open')$$,
  'a user can host their own Blend'
);

select lives_ok(
  $$insert into public.lists (id, owner_id, name, visibility)
    values ('30000000-0000-4000-8000-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Alice Private List', 'private')$$,
  'a user can create their own private list'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', true);
select set_config('request.jwt.claims', '{"sub":"cccccccc-cccc-4ccc-8ccc-cccccccccccc","role":"authenticated"}', true);

select is(
  (select count(*)::integer from public.blend_sessions where id = '20000000-0000-4000-8000-000000000001'),
  0,
  'an unrelated user cannot read a private Blend by guessing its ID'
);

select is(
  (select count(*)::integer from public.lists where id = '30000000-0000-4000-8000-000000000001'),
  0,
  'an unrelated user cannot read a private list by guessing its ID'
);

select throws_ok(
  $$insert into public.blend_participants (session_id, user_id, invited_by, status)
    values ('20000000-0000-4000-8000-000000000001', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'joined')$$,
  'an unrelated user cannot add themselves to a private Blend'
);

select results_eq(
  $$update public.blend_participants set preferences = '{"allergies":["none"]}'::jsonb
    where session_id = '20000000-0000-4000-8000-000000000001'
      and user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    returning user_id$$,
  array[]::uuid[],
  'a user cannot update another Blend participant preferences'
);

select is(
  (select count(*)::integer from public.saved_restaurants),
  0,
  'a user cannot read another user saved restaurants'
);

reset role;
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select is((select count(*)::integer from public.saved_restaurants), 0, 'anonymous users cannot read private saved data');
select is((select count(*)::integer from public.profiles where username = 'alice'), 0, 'anonymous users cannot read private profiles');
select is((select count(*)::integer from public.lists), 0, 'anonymous users cannot read private lists');

select * from finish();
rollback;
