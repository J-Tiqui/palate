'use client'

import { useActionState } from 'react'
import { completeOnboardingAction } from '@/app/actions/product'
import type { ProductActionState } from '@/app/actions/product'
import { SubmitButton } from '@/components/auth/submit-button'

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
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-medium">
          Favourite cuisines
          <input
            name="favouriteCuisines"
            maxLength={2025}
            placeholder="Japanese, Thai, Italian"
            className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none ring-[#6b2637]/20 focus:ring-4"
          />
        </label>
        <label className="text-sm font-medium">
          Preferred vibes
          <input
            name="preferredVibes"
            maxLength={2025}
            placeholder="Date night, lively, cozy"
            className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none ring-[#6b2637]/20 focus:ring-4"
          />
        </label>
      </div>
      <div className="rounded-[1.5rem] bg-[#f4efe6] p-5">
        <h2 className="font-semibold">Safety constraints</h2>
        <p className="mt-1 text-sm text-black/50">Kept private and used as hard filters for recommendations and Blend.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">
            Dietary restrictions
            <input name="dietaryRestrictions" maxLength={2430} placeholder="Vegetarian, halal" className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3" />
          </label>
          <label className="text-sm font-medium">
            Allergies
            <input name="allergies" maxLength={2430} placeholder="Peanuts, shellfish" className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3" />
          </label>
        </div>
      </div>
      <fieldset>
        <legend className="text-sm font-medium">Comfortable price range</legend>
        <div className="mt-2 grid grid-cols-2 gap-4">
          <label className="text-sm text-black/55">
            Minimum
            <select name="priceMin" defaultValue="1" className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black">
              {[1, 2, 3, 4].map((value) => <option key={value} value={value}>{'$'.repeat(value)}</option>)}
            </select>
          </label>
          <label className="text-sm text-black/55">
            Maximum
            <select name="priceMax" defaultValue="3" className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black">
              {[1, 2, 3, 4].map((value) => <option key={value} value={value}>{'$'.repeat(value)}</option>)}
            </select>
          </label>
        </div>
      </fieldset>
      {state.message && (
        <p role="alert" className="rounded-2xl bg-[#f8e5e5] px-4 py-3 text-sm text-[#7a2432]">{state.message}</p>
      )}
      <SubmitButton>Build my taste profile</SubmitButton>
    </form>
  )
}
