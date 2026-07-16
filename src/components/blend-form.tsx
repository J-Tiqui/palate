'use client'

import { useActionState } from 'react'
import { createBlendAction } from '@/app/actions/product'
import type { ProductActionState } from '@/app/actions/product'
import { SubmitButton } from '@/components/auth/submit-button'

const initialProductState: ProductActionState = { status: 'idle', message: '' }

export function BlendForm() {
  const [state, action] = useActionState(createBlendAction, initialProductState)

  return (
    <form action={action} className="space-y-5">
      <label className="block text-sm font-medium">
        Blend name
        <input required name="title" maxLength={120} defaultValue="Tonight’s dinner" className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3" />
      </label>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-medium">
          Dietary restrictions
          <input name="dietaryRestrictions" maxLength={2430} placeholder="Vegetarian, halal" className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3" />
        </label>
        <label className="text-sm font-medium">
          Allergies
          <input name="allergies" maxLength={2430} placeholder="Peanuts, shellfish" className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3" />
        </label>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-medium">
          Maximum price
          <select name="priceMax" defaultValue="3" className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3">
            {[1, 2, 3, 4].map((value) => <option key={value} value={value}>{'$'.repeat(value)}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium">
          Maximum distance (km)
          <input name="maxDistanceKm" type="number" min="0.1" max="500" step="0.1" defaultValue="8" className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3" />
        </label>
      </div>
      {state.message && <p role="alert" className="rounded-2xl bg-[#f8e5e5] px-4 py-3 text-sm text-[#7a2432]">{state.message}</p>}
      <SubmitButton>Create secure Blend</SubmitButton>
    </form>
  )
}
