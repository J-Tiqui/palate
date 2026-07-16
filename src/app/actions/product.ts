'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth/server'
import { getSafeRedirectPath } from '@/lib/security/redirects'
import { createClient } from '@/lib/supabase/server'
import {
  blendSessionSchema,
  firstValidationMessage,
  goalSchema,
  listSchema,
  onboardingSchema,
  profileUpdateSchema,
  reviewSchema,
  savedRestaurantSchema,
} from '@/lib/validation/schemas'

export type ProductActionState = {
  status: 'idle' | 'error' | 'success'
  message: string
}

export async function completeOnboardingAction(
  _previousState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const parsed = onboardingSchema.safeParse({
    username: formData.get('username'),
    displayName: formData.get('displayName'),
    homeCity: formData.get('homeCity'),
    favouriteCuisines: formData.get('favouriteCuisines'),
    preferredVibes: formData.get('preferredVibes'),
    dietaryRestrictions: formData.get('dietaryRestrictions'),
    allergies: formData.get('allergies'),
    priceMin: formData.get('priceMin'),
    priceMax: formData.get('priceMax'),
  })

  if (!parsed.success) {
    return { status: 'error', message: firstValidationMessage(parsed.error) }
  }

  const user = await requireUser('/onboarding')
  const supabase = await createClient()

  const { error: tasteError } = await supabase
    .from('user_taste_preferences')
    .upsert({
      user_id: user.id,
      dietary_restrictions: parsed.data.dietaryRestrictions,
      allergies: parsed.data.allergies,
      price_min: parsed.data.priceMin,
      price_max: parsed.data.priceMax,
    }, { onConflict: 'user_id' })

  if (tasteError) {
    return { status: 'error', message: 'We could not save your taste preferences. Please try again.' }
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      username: parsed.data.username,
      display_name: parsed.data.displayName,
      home_city: parsed.data.homeCity,
      favourite_cuisines: parsed.data.favouriteCuisines,
      preferred_vibes: parsed.data.preferredVibes,
      price_preference: Array.from(
        { length: parsed.data.priceMax - parsed.data.priceMin + 1 },
        (_, index) => parsed.data.priceMin + index,
      ),
      onboarding_completed: true,
    })
    .eq('id', user.id)

  if (profileError?.code === '23505') {
    return { status: 'error', message: 'That username is already taken. Try another one.' }
  }
  if (profileError) {
    return { status: 'error', message: 'We could not finish your profile. Please try again.' }
  }

  revalidatePath('/', 'layout')
  redirect('/discover')
}

export async function toggleSavedRestaurantAction(formData: FormData): Promise<void> {
  const parsed = savedRestaurantSchema.safeParse({
    restaurantId: formData.get('restaurantId'),
    restaurantSlug: formData.get('restaurantSlug'),
    returnTo: formData.get('returnTo'),
  })
  if (!parsed.success) redirect('/discover?notice=invalid-restaurant')

  const returnTo = getSafeRedirectPath(
    parsed.data.returnTo,
    `/restaurants/${parsed.data.restaurantSlug}`,
  )
  const user = await requireUser(returnTo)
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('saved_restaurants')
    .select('restaurant_id')
    .eq('user_id', user.id)
    .eq('restaurant_id', parsed.data.restaurantId)
    .maybeSingle()

  if (existing) {
    await supabase
      .from('saved_restaurants')
      .delete()
      .eq('user_id', user.id)
      .eq('restaurant_id', parsed.data.restaurantId)
  } else {
    await supabase.from('saved_restaurants').insert({
      user_id: user.id,
      restaurant_id: parsed.data.restaurantId,
    })
  }

  revalidatePath(returnTo)
  revalidatePath('/saved')
}

export async function createReviewAction(
  _previousState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const parsed = reviewSchema.safeParse({
    restaurantId: formData.get('restaurantId'),
    restaurantSlug: formData.get('restaurantSlug'),
    rating: formData.get('rating'),
    reviewText: formData.get('reviewText'),
    visitDate: formData.get('visitDate'),
    tags: formData.get('tags'),
    wouldReturn: formData.get('wouldReturn'),
  })

  if (!parsed.success) {
    return { status: 'error', message: firstValidationMessage(parsed.error) }
  }

  const returnTo = `/restaurants/${parsed.data.restaurantSlug}`
  await requireUser(`${returnTo}/review`)
  const supabase = await createClient()
  const wouldReturn = parsed.data.wouldReturn === 'unsure'
    ? null
    : parsed.data.wouldReturn === 'yes'

  const { error } = await supabase.rpc('log_restaurant_visit', {
    p_restaurant_id: parsed.data.restaurantId,
    p_rating: parsed.data.rating,
    p_review_text: parsed.data.reviewText,
    p_visited_at: `${parsed.data.visitDate}T12:00:00.000Z`,
    p_tags: parsed.data.tags,
    p_would_return: wouldReturn,
    p_occasion: parsed.data.tags[0] ?? '',
    p_request_id: crypto.randomUUID(),
  })

  if (error?.code === '23505') {
    return { status: 'error', message: 'You already logged this restaurant for that visit date.' }
  }
  if (error) {
    return { status: 'error', message: 'We could not log this visit. Please try again.' }
  }

  revalidatePath(returnTo)
  revalidatePath('/activity')
  revalidatePath('/goals')
  redirect(`${returnTo}?notice=visit-logged`)
}

export async function createBlendAction(
  _previousState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const parsed = blendSessionSchema.safeParse({
    title: formData.get('title'),
    dietaryRestrictions: formData.get('dietaryRestrictions'),
    allergies: formData.get('allergies'),
    priceMax: formData.get('priceMax'),
    maxDistanceKm: formData.get('maxDistanceKm'),
  })

  if (!parsed.success) {
    return { status: 'error', message: firstValidationMessage(parsed.error) }
  }

  const user = await requireUser('/blend')
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('blend_sessions')
    .insert({
      host_id: user.id,
      title: parsed.data.title,
      status: 'open',
      constraints: {
        dietary_restrictions: parsed.data.dietaryRestrictions,
        allergies: parsed.data.allergies,
        price_max: parsed.data.priceMax,
        max_distance_km: parsed.data.maxDistanceKm,
      },
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    })
    .select('id')
    .single()

  if (error || !data) {
    return { status: 'error', message: 'We could not create your Blend. Please try again.' }
  }

  redirect(`/blend/${data.id}`)
}

export async function createListAction(
  _previousState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const parsed = listSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    visibility: formData.get('visibility'),
    collaboratorsCanEdit: formData.get('collaboratorsCanEdit') === 'on',
  })
  if (!parsed.success) return { status: 'error', message: firstValidationMessage(parsed.error) }

  const user = await requireUser('/lists/new')
  const supabase = await createClient()
  const { data, error } = await supabase.from('lists').insert({
    owner_id: user.id,
    name: parsed.data.name,
    description: parsed.data.description,
    visibility: parsed.data.visibility,
    collaborators_can_edit: parsed.data.collaboratorsCanEdit,
  }).select('id').single()

  if (error || !data) return { status: 'error', message: 'We could not create this list. Please try again.' }
  revalidatePath('/lists')
  redirect(`/lists/${data.id}`)
}

export async function createGoalAction(
  _previousState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const parsed = goalSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    kind: formData.get('kind'),
    metric: formData.get('metric'),
    targetCount: formData.get('targetCount'),
    startsOn: formData.get('startsOn'),
    endsOn: formData.get('endsOn'),
    visibility: formData.get('visibility'),
  })
  if (!parsed.success) return { status: 'error', message: firstValidationMessage(parsed.error) }

  const user = await requireUser('/goals/new')
  const supabase = await createClient()
  const { error } = await supabase.from('goals').insert({
    owner_id: user.id,
    title: parsed.data.title,
    description: parsed.data.description,
    kind: parsed.data.kind,
    status: 'active',
    metric: parsed.data.metric,
    target_count: parsed.data.targetCount,
    starts_on: parsed.data.startsOn || null,
    ends_on: parsed.data.endsOn || null,
    visibility: parsed.data.visibility,
  })

  if (error) return { status: 'error', message: 'We could not create this goal. Please try again.' }
  revalidatePath('/goals')
  redirect('/goals')
}

export async function updateProfileAction(
  _previousState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const parsed = profileUpdateSchema.safeParse({
    username: formData.get('username'),
    displayName: formData.get('displayName'),
    bio: formData.get('bio'),
    homeCity: formData.get('homeCity'),
    preferredNeighbourhoods: formData.get('preferredNeighbourhoods'),
    favouriteCuisines: formData.get('favouriteCuisines'),
    dislikedCuisines: formData.get('dislikedCuisines'),
    preferredVibes: formData.get('preferredVibes'),
    pricePreference: formData.get('pricePreference'),
    privacy: formData.get('privacy'),
  })
  if (!parsed.success) return { status: 'error', message: firstValidationMessage(parsed.error) }

  const user = await requireUser('/profile/edit')
  const supabase = await createClient()
  const { error } = await supabase.from('profiles').update({
    username: parsed.data.username,
    display_name: parsed.data.displayName,
    bio: parsed.data.bio,
    home_city: parsed.data.homeCity || null,
    preferred_neighbourhoods: parsed.data.preferredNeighbourhoods,
    favourite_cuisines: parsed.data.favouriteCuisines,
    disliked_cuisines: parsed.data.dislikedCuisines,
    preferred_vibes: parsed.data.preferredVibes,
    price_preference: parsed.data.pricePreference,
    privacy: parsed.data.privacy,
  }).eq('id', user.id)

  if (error?.code === '23505') return { status: 'error', message: 'That username is already taken.' }
  if (error) return { status: 'error', message: 'We could not update your profile. Please try again.' }
  revalidatePath('/', 'layout')
  redirect(`/profile/${parsed.data.username}`)
}
