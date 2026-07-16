// Kept in sync with the applied files under supabase/migrations.
// Regenerate after applying migrations with:
//   supabase gen types typescript --local > src/types/database.generated.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ProfileVisibility = 'public' | 'followers' | 'private'
export type ListVisibility = 'public' | 'followers' | 'private'
export type CollaboratorRole = 'viewer' | 'editor'
export type FollowStatus = 'pending' | 'accepted' | 'blocked'
export type GoalKind = 'personal' | 'challenge'
export type GoalStatus = 'draft' | 'active' | 'completed' | 'cancelled'
export type BlendStatus = 'draft' | 'open' | 'locked' | 'completed' | 'cancelled'
export type BlendParticipantStatus = 'invited' | 'joined' | 'declined'
export type RecommendationSource = 'personal' | 'blend' | 'editorial'

export type ProfileRow = {
  id: string
  username: string | null
  display_name: string
  avatar_url: string | null
  bio: string
  home_city: string | null
  preferred_neighbourhoods: string[]
  favourite_cuisines: string[]
  disliked_cuisines: string[]
  preferred_vibes: string[]
  privacy: ProfileVisibility
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

export type RestaurantRow = {
  id: string
  slug: string
  name: string
  description: string | null
  address_line1: string | null
  city: string
  region: string | null
  country_code: string
  neighbourhood: string | null
  latitude: number | null
  longitude: number | null
  price_level: number
  provider: string
  provider_place_id: string | null
  provider_payload: Json
  google_rating: number | null
  google_review_count: number | null
  average_rating: number
  review_count: number
  hero_image_url: string | null
  is_active: boolean
  provider_refreshed_at: string | null
  created_at: string
  updated_at: string
}

export type RestaurantPhotoRow = {
  id: string
  restaurant_id: string
  storage_path: string | null
  source_url: string | null
  provider_photo_reference: string | null
  attribution: string | null
  alt_text: string
  sort_order: number
  is_primary: boolean
  created_at: string
}

export type CuisineCategoryRow = {
  id: number
  slug: string
  name: string
  created_at: string
}

export type RestaurantCuisineRow = {
  restaurant_id: string
  cuisine_id: number
  is_primary: boolean
  created_at: string
}

export type VibeTagRow = {
  id: number
  slug: string
  name: string
  created_at: string
}

export type RestaurantVibeRow = {
  restaurant_id: string
  vibe_id: number
  created_at: string
}

export type ReviewRow = {
  id: string
  restaurant_id: string
  user_id: string
  rating: number
  review_text: string
  visit_date: string
  tags: string[]
  would_return: boolean | null
  request_id: string
  created_at: string
  updated_at: string
}

export type ReviewCompanionRow = {
  review_id: string
  companion_id: string
  created_at: string
}

export type VisitRow = {
  id: string
  restaurant_id: string
  user_id: string
  visited_at: string
  occasion: string | null
  notes: string
  source_review_id: string | null
  request_id: string
  created_at: string
  updated_at: string
}

export type SavedRestaurantRow = {
  user_id: string
  restaurant_id: string
  notes: string
  created_at: string
  updated_at: string
}

export type UserTastePreferenceRow = {
  user_id: string
  cuisine_weights: Json
  vibe_weights: Json
  dietary_restrictions: string[]
  allergies: string[]
  excluded_ingredients: string[]
  max_distance_km: number | null
  created_at: string
  updated_at: string
}

export type ListRow = {
  id: string
  owner_id: string
  name: string
  description: string
  visibility: ListVisibility
  cover_url: string | null
  collaborators_can_edit: boolean
  created_at: string
  updated_at: string
}

export type ListCollaboratorRow = {
  list_id: string
  user_id: string
  role: CollaboratorRole
  invited_by: string
  accepted_at: string | null
  created_at: string
}

export type ListItemRow = {
  id: string
  list_id: string
  restaurant_id: string
  added_by: string
  position: number
  notes: string
  created_at: string
  updated_at: string
}

export type GoalRow = {
  id: string
  owner_id: string
  kind: GoalKind
  status: GoalStatus
  title: string
  description: string
  metric: string
  target_count: number
  starts_on: string | null
  ends_on: string | null
  visibility: ListVisibility
  created_at: string
  updated_at: string
}

export type GoalProgressRow = {
  id: string
  goal_id: string
  user_id: string
  review_id: string | null
  visit_id: string | null
  amount: number
  recorded_on: string
  note: string
  created_at: string
  updated_at: string
}

export type FollowRow = {
  follower_id: string
  following_id: string
  status: FollowStatus
  created_at: string
  updated_at: string
}

export type BlendSessionRow = {
  id: string
  host_id: string
  title: string
  status: BlendStatus
  constraints: Json
  selected_restaurant_id: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
}

export type BlendParticipantRow = {
  id: string
  session_id: string
  user_id: string
  invited_by: string
  status: BlendParticipantStatus
  preferences: Json
  joined_at: string | null
  created_at: string
  updated_at: string
}

export type BlendResultRow = {
  id: string
  session_id: string
  restaurant_id: string
  rank: number
  score: number
  member_scores: Json
  match_reasons: string[]
  hard_constraints_passed: boolean
  created_at: string
}

export type RecommendationExplanationRow = {
  id: string
  user_id: string | null
  restaurant_id: string
  blend_result_id: string | null
  source: RecommendationSource
  score: number
  reasons: string[]
  factors: Json
  created_at: string
}

type Insertable<Row, Required extends keyof Row = never> =
  Partial<Row> & Pick<Row, Required>
type Updatable<Row, Immutable extends keyof Row = never> = Partial<Omit<Row, Immutable>>
type TableDefinition<
  Row,
  Required extends keyof Row = never,
  Immutable extends keyof Row = never,
> = {
  Row: Row
  Insert: Insertable<Row, Required>
  Update: Updatable<Row, Immutable>
  Relationships: []
}

export type Database = {
  public: {
    Tables: {
      profiles: TableDefinition<ProfileRow, 'id', 'id' | 'created_at'>
      restaurants: TableDefinition<RestaurantRow, 'slug' | 'name' | 'city', 'id' | 'created_at'>
      restaurant_photos: TableDefinition<RestaurantPhotoRow, 'restaurant_id', 'id' | 'restaurant_id' | 'created_at'>
      cuisine_categories: TableDefinition<CuisineCategoryRow, 'slug' | 'name', 'id' | 'created_at'>
      restaurant_cuisines: TableDefinition<RestaurantCuisineRow, 'restaurant_id' | 'cuisine_id', 'restaurant_id' | 'cuisine_id' | 'created_at'>
      vibe_tags: TableDefinition<VibeTagRow, 'slug' | 'name', 'id' | 'created_at'>
      restaurant_vibes: TableDefinition<RestaurantVibeRow, 'restaurant_id' | 'vibe_id', 'restaurant_id' | 'vibe_id' | 'created_at'>
      reviews: TableDefinition<ReviewRow, 'restaurant_id' | 'user_id' | 'rating' | 'request_id', 'id' | 'restaurant_id' | 'user_id' | 'created_at'>
      review_companions: TableDefinition<ReviewCompanionRow, 'review_id' | 'companion_id', 'review_id' | 'companion_id' | 'created_at'>
      visits: TableDefinition<VisitRow, 'restaurant_id' | 'user_id' | 'visited_at' | 'request_id', 'id' | 'restaurant_id' | 'user_id' | 'created_at'>
      saved_restaurants: TableDefinition<SavedRestaurantRow, 'user_id' | 'restaurant_id', 'user_id' | 'restaurant_id' | 'created_at'>
      user_taste_preferences: TableDefinition<UserTastePreferenceRow, 'user_id', 'user_id' | 'created_at'>
      lists: TableDefinition<ListRow, 'owner_id' | 'name', 'id' | 'owner_id' | 'created_at'>
      list_collaborators: TableDefinition<ListCollaboratorRow, 'list_id' | 'user_id' | 'invited_by', 'list_id' | 'user_id' | 'invited_by' | 'created_at'>
      list_items: TableDefinition<ListItemRow, 'list_id' | 'restaurant_id' | 'added_by', 'id' | 'list_id' | 'restaurant_id' | 'added_by' | 'created_at'>
      goals: TableDefinition<GoalRow, 'owner_id' | 'title' | 'metric' | 'target_count', 'id' | 'owner_id' | 'created_at'>
      goal_progress: TableDefinition<GoalProgressRow, 'goal_id' | 'user_id', 'id' | 'goal_id' | 'user_id' | 'created_at'>
      follows: TableDefinition<FollowRow, 'follower_id' | 'following_id', 'follower_id' | 'following_id' | 'created_at'>
      blend_sessions: TableDefinition<BlendSessionRow, 'host_id', 'id' | 'host_id' | 'created_at'>
      blend_participants: TableDefinition<BlendParticipantRow, 'session_id' | 'user_id' | 'invited_by', 'id' | 'session_id' | 'user_id' | 'invited_by' | 'created_at'>
      blend_results: TableDefinition<BlendResultRow, 'session_id' | 'restaurant_id' | 'rank' | 'score' | 'hard_constraints_passed', 'id' | 'session_id' | 'restaurant_id' | 'created_at'>
      recommendation_explanations: TableDefinition<RecommendationExplanationRow, 'restaurant_id' | 'source' | 'score', 'id' | 'created_at'>
    }
    Views: Record<never, never>
    Functions: {
      complete_onboarding: {
        Args: {
          p_user_id: string
          p_username: string
          p_display_name: string
          p_home_city: string
          p_favourite_cuisines: string[]
          p_disliked_cuisines: string[]
          p_preferred_vibes: string[]
          p_dietary_restrictions: string[]
          p_allergies: string[]
        }
        Returns: undefined
      }
      log_restaurant_visit: {
        Args: {
          p_restaurant_id: string
          p_rating: number
          p_review_text: string
          p_visited_at: string
          p_tags: string[]
          p_would_return: boolean | null
          p_occasion: string
          p_request_id: string
        }
        Returns: string
      }
    }
    Enums: {
      profile_visibility: ProfileVisibility
      list_visibility: ListVisibility
      collaborator_role: CollaboratorRole
      follow_status: FollowStatus
      goal_kind: GoalKind
      goal_status: GoalStatus
      blend_status: BlendStatus
      blend_participant_status: BlendParticipantStatus
      recommendation_source: RecommendationSource
    }
    CompositeTypes: Record<never, never>
  }
}
