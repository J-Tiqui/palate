-- Remove broad object-listing access from the public restaurant photo bucket.
-- Public object URLs continue to work because the bucket itself is public.
drop policy if exists restaurant_photo_objects_public_read on storage.objects;

-- Cover foreign keys that participate in joins and cascading integrity checks.
create index if not exists blend_participants_invited_by_idx
  on public.blend_participants (invited_by);

create index if not exists blend_results_restaurant_idx
  on public.blend_results (restaurant_id);

create index if not exists blend_sessions_selected_restaurant_idx
  on public.blend_sessions (selected_restaurant_id);

create index if not exists goal_progress_review_idx
  on public.goal_progress (review_id);

create index if not exists goal_progress_user_idx
  on public.goal_progress (user_id);

create index if not exists goal_progress_visit_idx
  on public.goal_progress (visit_id);

create index if not exists list_collaborators_invited_by_idx
  on public.list_collaborators (invited_by);

create index if not exists list_items_added_by_idx
  on public.list_items (added_by);

create index if not exists list_items_restaurant_idx
  on public.list_items (restaurant_id);

create index if not exists recommendation_explanations_blend_result_idx
  on public.recommendation_explanations (blend_result_id);

create index if not exists recommendation_explanations_restaurant_idx
  on public.recommendation_explanations (restaurant_id);

create index if not exists saved_restaurants_restaurant_idx
  on public.saved_restaurants (restaurant_id);
