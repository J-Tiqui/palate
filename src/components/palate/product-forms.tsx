'use client'

import Link from 'next/link'
import { Check, X } from 'lucide-react'
import { useActionState } from 'react'
import { createGoalAction, createListAction, updateProfileAction, type ProductActionState } from '@/app/actions/product'
import { SubmitButton } from '@/components/auth/submit-button'
import { PreferenceMultiSelect } from '@/components/preference-multi-select'
import { CUISINE_OPTIONS, VIBE_OPTIONS } from '@/lib/preferences/options'

const initialState: ProductActionState = { status: 'idle', message: '' }

function FormMessage({ state }: { state: ProductActionState }) {
  return state.message ? <p role="alert" className="mt-4 rounded-lg bg-[var(--wine)] px-4 py-3 text-sm text-white">{state.message}</p> : null
}

export function NewListForm() {
  const [state, action] = useActionState(createListAction, initialState)
  return <form action={action} className="form-modal small-form"><header><div><p className="eyebrow">A new collection</p><h2>Create a list</h2></div><Link className="icon-button" href="/lists"><X /></Link></header><div className="form-scroll"><label className="form-label">List name<input name="name" required maxLength={120} placeholder="e.g. Patios for a long lunch" autoFocus /></label><label className="form-label">Description<textarea name="description" maxLength={2000} placeholder="What belongs on this list?" /></label><label className="form-label">Visibility<select name="visibility" defaultValue="private"><option value="private">Private</option><option value="followers">Friends</option><option value="public">Public</option></select></label><label className="check-row"><input name="collaboratorsCanEdit" type="checkbox" />Allow friends to add restaurants</label><FormMessage state={state} /></div><footer><Link className="button ghost" href="/lists">Cancel</Link><SubmitButton className="button wine">Create list <Check /></SubmitButton></footer></form>
}

export function NewGoalForm() {
  const [state, action] = useActionState(createGoalAction, initialState)
  const yearStart = `${new Date().getFullYear()}-01-01`
  const yearEnd = `${new Date().getFullYear()}-12-31`
  return <form action={action} className="form-modal"><input type="hidden" name="kind" value="personal" /><header><div><p className="eyebrow">A reason to go out</p><h2>Create a goal</h2></div><Link className="icon-button" href="/goals"><X /></Link></header><div className="form-scroll"><label className="form-label">Goal name<input name="title" required maxLength={140} placeholder="Try ten new restaurants" autoFocus /></label><label className="form-label">Description<textarea name="description" maxLength={2000} placeholder="What would make this goal meaningful?" /></label><div className="split-fields"><label className="form-label">Measure<select name="metric" defaultValue="restaurants_visited"><option value="restaurants_visited">Restaurants visited</option><option value="reviews_written">Reviews written</option><option value="cuisines_tried">Cuisines tried</option></select></label><label className="form-label">Target<input name="targetCount" type="number" min="1" max="100000" defaultValue="10" /></label></div><div className="split-fields"><label className="form-label">Starts<input name="startsOn" type="date" defaultValue={yearStart} /></label><label className="form-label">Ends<input name="endsOn" type="date" defaultValue={yearEnd} /></label></div><label className="form-label">Visibility<select name="visibility" defaultValue="private"><option value="private">Private</option><option value="followers">Friends</option><option value="public">Public</option></select></label><FormMessage state={state} /></div><footer><Link className="button ghost" href="/goals">Cancel</Link><SubmitButton className="button wine">Create goal <Check /></SubmitButton></footer></form>
}

export type ProfileFormDefaults = {
  username: string
  displayName: string
  bio: string
  homeCity: string
  preferredNeighbourhoods: string[]
  favouriteCuisines: string[]
  dislikedCuisines: string[]
  preferredVibes: string[]
  privacy: 'public' | 'followers' | 'private'
}

export function EditProfileForm({ defaults }: { defaults: ProfileFormDefaults }) {
  const [state, action] = useActionState(updateProfileAction, initialState)
  return <form action={action} className="form-modal"><header><div><p className="eyebrow">Your Palate</p><h2>Edit profile</h2></div><Link className="icon-button" href={`/profile/${defaults.username}`}><X /></Link></header><div className="form-scroll"><div className="split-fields"><label className="form-label">Username<input name="username" required defaultValue={defaults.username} /></label><label className="form-label">Display name<input name="displayName" required defaultValue={defaults.displayName} /></label></div><label className="form-label">Bio<textarea name="bio" maxLength={500} defaultValue={defaults.bio} /></label><label className="form-label">Home city<input name="homeCity" defaultValue={defaults.homeCity} /></label><PreferenceMultiSelect label="Favourite cuisines" name="favouriteCuisines" options={CUISINE_OPTIONS} defaultValue={defaults.favouriteCuisines} /><PreferenceMultiSelect label="Cuisines you don't enjoy" name="dislikedCuisines" options={CUISINE_OPTIONS} defaultValue={defaults.dislikedCuisines} /><PreferenceMultiSelect label="Favourite vibes" name="preferredVibes" options={VIBE_OPTIONS} defaultValue={defaults.preferredVibes} /><label className="form-label">Preferred neighbourhoods<input name="preferredNeighbourhoods" defaultValue={defaults.preferredNeighbourhoods.join(', ')} /></label><label className="form-label">Visibility<select name="privacy" defaultValue={defaults.privacy}><option value="public">Public</option><option value="followers">Friends</option><option value="private">Private</option></select></label><FormMessage state={state} /></div><footer><Link className="button ghost" href={`/profile/${defaults.username}`}>Cancel</Link><SubmitButton className="button wine">Save profile <Check /></SubmitButton></footer></form>
}
