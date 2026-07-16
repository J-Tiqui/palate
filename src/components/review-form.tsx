'use client'

import Link from 'next/link'
import { Check, X } from 'lucide-react'
import { useActionState, useState } from 'react'
import { createReviewAction, type ProductActionState } from '@/app/actions/product'
import { SubmitButton } from '@/components/auth/submit-button'

const initialProductState: ProductActionState = { status: 'idle', message: '' }

export function ReviewForm({ restaurantId, restaurantSlug, restaurantName }: {
  restaurantId: string
  restaurantSlug: string
  restaurantName: string
}) {
  const [state, action] = useActionState(createReviewAction, initialProductState)
  const [rating, setRating] = useState(4.5)
  const today = new Date().toISOString().slice(0, 10)

  return (
    <form action={action} className="form-modal">
      <input type="hidden" name="restaurantId" value={restaurantId} />
      <input type="hidden" name="restaurantSlug" value={restaurantSlug} />
      <input type="hidden" name="rating" value={rating} />
      <input type="hidden" name="tags" value="date-night" />
      <header><div><p className="eyebrow">Remember the table</p><h2>Log {restaurantName}</h2></div><Link className="icon-button" href={`/restaurants/${restaurantSlug}`} aria-label="Close visit log"><X /></Link></header>
      <div className="form-scroll">
        <label className="form-label">Your rating <strong>{rating.toFixed(1)}</strong></label>
        <div className="rating-control">{[1, 2, 3, 4, 5].map((star) => <button type="button" key={star} className={rating >= star ? 'filled' : ''} onClick={() => setRating(star)}>★</button>)}</div>
        <label className="form-label">Visit date<input required name="visitDate" type="date" defaultValue={today} max={today} /></label>
        <div className="field-group"><span className="form-label">The occasion</span><div className="tags selectable"><span className="tag active">Date night</span><span className="tag">Friends</span><span className="tag">Celebration</span><span className="tag">Solo</span><span className="tag">Work dinner</span></div></div>
        <label className="form-label">Your review<textarea name="reviewText" maxLength={5000} placeholder="What should future you remember?" /></label>
        <div className="split-fields">
          <label className="form-label">Dining companions<select defaultValue="Maya"><option>Maya</option><option>Ethan</option><option>Priya</option><option>Solo visit</option></select></label>
          <label className="form-label">Connect to a goal<select defaultValue="none"><option value="none">None</option><option>Try ten restaurants</option><option>Visit five sushi spots</option></select></label>
        </div>
        <fieldset className="return-row"><div><strong>Would you return?</strong><small>This helps sharpen future picks.</small></div><div><label><input className="sr-only" type="radio" name="wouldReturn" value="no" />No</label><label className="selected"><input className="sr-only" type="radio" name="wouldReturn" value="yes" defaultChecked />Absolutely</label></div></fieldset>
        <label className="check-row"><input type="checkbox" defaultChecked />Add to “Date Night” list</label>
        {state.message ? <p role="alert" className="mt-4 rounded-lg bg-[var(--wine)] px-4 py-3 text-sm text-white">{state.message}</p> : null}
      </div>
      <footer><Link className="button ghost" href={`/restaurants/${restaurantSlug}`}>Cancel</Link><SubmitButton className="button wine">Log visit <Check /></SubmitButton></footer>
    </form>
  )
}
