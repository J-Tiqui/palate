'use client'

import { useActionState } from 'react'
import { completeOnboardingAction } from '@/app/actions/product'
import type { ProductActionState } from '@/app/actions/product'
import { SubmitButton } from '@/components/auth/submit-button'
import { PreferenceMultiSelect } from '@/components/preference-multi-select'
import {
  ALLERGY_OPTIONS,
  CUISINE_OPTIONS,
  DIETARY_RESTRICTION_OPTIONS,
  VIBE_OPTIONS,
} from '@/lib/preferences/options'

const initialProductState: ProductActionState = { status: 'idle', message: '' }

type OnboardingFormProps = {
  displayName: string
  homeCity: string
}

export function OnboardingForm({ displayName, homeCity }: OnboardingFormProps) {
  const [state, action] = useActionState(completeOnboardingAction, initialProductState)

  return (
    <form action={action} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-medium">
          Username
          <input
            required
            name="username"
            minLength={3}
            maxLength={30}
            pattern="[a-z0-9](?:[a-z0-9_]{1,28}[a-z0-9])?"
            autoComplete="username"
            placeholder="jules_eats"
            className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none ring-[#6b2637]/20 focus:ring-4"
          />
          <span className="mt-1 block text-xs font-normal text-black/40">Lowercase letters, numbers, and underscores.</span>
        </label>
        <label className="text-sm font-medium">
          Display name
          <input
            required
            name="displayName"
            defaultValue={displayName}
            maxLength={80}
            autoComplete="name"
            className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none ring-[#6b2637]/20 focus:ring-4"
          />
        </label>
      </div>
      <label className="block text-sm font-medium">
        Home city
        <input
          required
          name="homeCity"
          defaultValue={homeCity}
          maxLength={120}
          autoComplete="address-level2"
          className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none ring-[#6b2637]/20 focus:ring-4"
        />
      </label>
      <div className="grid items-start gap-5 sm:grid-cols-2">
        <PreferenceMultiSelect label="Favourite cuisines" name="favouriteCuisines" options={CUISINE_OPTIONS} />
        <PreferenceMultiSelect label="Cuisines you don't enjoy" name="dislikedCuisines" options={CUISINE_OPTIONS} />
        <PreferenceMultiSelect label="Preferred vibes" name="preferredVibes" options={VIBE_OPTIONS} />
      </div>
      <div className="rounded-[1.5rem] bg-[#f4efe6] p-5">
        <h2 className="font-semibold">Safety constraints</h2>
        <p className="mt-1 text-sm text-black/50">Kept private and used as hard filters for recommendations and Blend.</p>
        <div className="mt-4 grid items-start gap-4 sm:grid-cols-2">
          <PreferenceMultiSelect
            label="Dietary restrictions"
            name="dietaryRestrictions"
            options={DIETARY_RESTRICTION_OPTIONS}
          />
          <PreferenceMultiSelect label="Allergies" name="allergies" options={ALLERGY_OPTIONS} />
        </div>
      </div>
      {state.message && (
        <p role="alert" className="rounded-2xl bg-[#f8e5e5] px-4 py-3 text-sm text-[#7a2432]">{state.message}</p>
      )}
      <SubmitButton className="palate-submit">Build my taste profile</SubmitButton>
    </form>
  )
}
