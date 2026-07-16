-- Development-only sample catalogue. These rows are intentionally marked provider = 'seed'
-- and must never be represented as live Google or Palate community data.

insert into public.cuisine_categories (slug, name)
values
  ('ethiopian', 'Ethiopian'),
  ('italian', 'Italian'),
  ('japanese', 'Japanese'),
  ('mexican', 'Mexican'),
  ('thai', 'Thai'),
  ('vietnamese', 'Vietnamese')
on conflict (slug) do update set name = excluded.name;

insert into public.vibe_tags (slug, name)
values
  ('date-night', 'Date night'),
  ('group-friendly', 'Group friendly'),
  ('neighbourhood-gem', 'Neighbourhood gem'),
  ('quick-bite', 'Quick bite'),
  ('special-occasion', 'Special occasion')
on conflict (slug) do update set name = excluded.name;

insert into public.restaurants (
  id, slug, name, description, address_line1, city, region, country_code,
  neighbourhood, price_level, provider, hero_image_url, is_active
)
values
  (
    '10000000-0000-4000-8000-000000000001', 'addis-table', 'Addis Table',
    'Development sample restaurant used to exercise Palate discovery flows.',
    '123 Sample Street', 'Toronto', 'ON', 'CA', 'Danforth', 2, 'seed',
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80', true
  ),
  (
    '10000000-0000-4000-8000-000000000002', 'bar-luna', 'Bar Luna',
    'Development sample restaurant used to exercise Palate discovery flows.',
    '45 Sample Avenue', 'Toronto', 'ON', 'CA', 'Little Italy', 3, 'seed',
    'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=80', true
  ),
  (
    '10000000-0000-4000-8000-000000000003', 'kumo-house', 'Kumo House',
    'Development sample restaurant used to exercise Palate discovery flows.',
    '88 Sample Road', 'Toronto', 'ON', 'CA', 'Yorkville', 4, 'seed',
    'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1200&q=80', true
  ),
  (
    '10000000-0000-4000-8000-000000000004', 'maiz-y-sol', 'Maíz y Sol',
    'Development sample restaurant used to exercise Palate discovery flows.',
    '201 Sample Lane', 'Toronto', 'ON', 'CA', 'Kensington Market', 2, 'seed',
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80', true
  ),
  (
    '10000000-0000-4000-8000-000000000005', 'sabai-room', 'Sabai Room',
    'Development sample restaurant used to exercise Palate discovery flows.',
    '17 Sample Crescent', 'Toronto', 'ON', 'CA', 'Leslieville', 2, 'seed',
    'https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=1200&q=80', true
  ),
  (
    '10000000-0000-4000-8000-000000000006', 'pho-lantern', 'Pho Lantern',
    'Development sample restaurant used to exercise Palate discovery flows.',
    '302 Sample Boulevard', 'Toronto', 'ON', 'CA', 'Chinatown', 1, 'seed',
    'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=1200&q=80', true
  )
on conflict (id) do update set
  slug = excluded.slug,
  name = excluded.name,
  description = excluded.description,
  address_line1 = excluded.address_line1,
  city = excluded.city,
  region = excluded.region,
  country_code = excluded.country_code,
  neighbourhood = excluded.neighbourhood,
  price_level = excluded.price_level,
  provider = excluded.provider,
  hero_image_url = excluded.hero_image_url,
  is_active = excluded.is_active;

with cuisine_map (restaurant_id, cuisine_slug, is_primary) as (
  values
    ('10000000-0000-4000-8000-000000000001'::uuid, 'ethiopian', true),
    ('10000000-0000-4000-8000-000000000002'::uuid, 'italian', true),
    ('10000000-0000-4000-8000-000000000003'::uuid, 'japanese', true),
    ('10000000-0000-4000-8000-000000000004'::uuid, 'mexican', true),
    ('10000000-0000-4000-8000-000000000005'::uuid, 'thai', true),
    ('10000000-0000-4000-8000-000000000006'::uuid, 'vietnamese', true)
)
insert into public.restaurant_cuisines (restaurant_id, cuisine_id, is_primary)
select cuisine_map.restaurant_id, cuisine.id, cuisine_map.is_primary
from cuisine_map
join public.cuisine_categories as cuisine on cuisine.slug = cuisine_map.cuisine_slug
on conflict (restaurant_id, cuisine_id) do update set is_primary = excluded.is_primary;

with vibe_map (restaurant_id, vibe_slug) as (
  values
    ('10000000-0000-4000-8000-000000000001'::uuid, 'group-friendly'),
    ('10000000-0000-4000-8000-000000000001'::uuid, 'neighbourhood-gem'),
    ('10000000-0000-4000-8000-000000000002'::uuid, 'date-night'),
    ('10000000-0000-4000-8000-000000000003'::uuid, 'special-occasion'),
    ('10000000-0000-4000-8000-000000000004'::uuid, 'group-friendly'),
    ('10000000-0000-4000-8000-000000000005'::uuid, 'neighbourhood-gem'),
    ('10000000-0000-4000-8000-000000000006'::uuid, 'quick-bite')
)
insert into public.restaurant_vibes (restaurant_id, vibe_id)
select vibe_map.restaurant_id, vibe.id
from vibe_map
join public.vibe_tags as vibe on vibe.slug = vibe_map.vibe_slug
on conflict (restaurant_id, vibe_id) do nothing;
