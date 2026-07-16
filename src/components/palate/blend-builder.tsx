'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Bookmark, Check, Map, MapPin, Plus, Share2, Star, UserRound } from 'lucide-react'
import { useActionState, useState } from 'react'
import { createBlendAction, type ProductActionState } from '@/app/actions/product'
import { Avatar } from '@/components/palate/app-shell'
import { demoFriends, demoRestaurants } from '@/lib/palate/demo-data'

const initialState: ProductActionState = { status: 'idle', message: '' }
const resultRows = [
  { restaurant: demoRestaurants[4], score: 94, reasons: ['Italian is a top-3 cuisine for all three', 'Warm, lively room fits tonight’s vibe', 'Maya rated it 4.9 and Ethan saved it'], concern: 'Peak dinner slots can book quickly', contributions: ['Julian · date night', 'Maya · pasta', 'Ethan · saved'] },
  { restaurant: demoRestaurants[1], score: 91, reasons: ['Strong Japanese preference across the group', 'Works well for three and dietary needs', 'Within budget and a short streetcar ride'], concern: 'Slightly quieter than your selected vibe', contributions: ['Julian · Japanese', 'Maya · waterfront', 'Ethan · group fit'] },
  { restaurant: demoRestaurants[2], score: 87, reasons: ['Everyone enjoys Thai flavours', 'Excellent value for the group', 'Lively atmosphere and flexible spice levels'], concern: 'Ethan likes it more strongly than the rest', contributions: ['Julian · spice', 'Maya · value', 'Ethan · 5.0 rating'] },
]

export function BlendBuilder({ authenticated }: { authenticated: boolean }) {
  const [state, formAction, pending] = useActionState(createBlendAction, initialState)
  const [stage, setStage] = useState<'setup' | 'results'>('setup')
  const [selectedFriends, setSelectedFriends] = useState(['Maya Chen', 'Ethan Brooks'])
  const [cuisines, setCuisines] = useState(['Surprise us'])
  const [vibes, setVibes] = useState(['Lively'])

  function toggleValue(value: string, values: string[], setValues: (values: string[]) => void) {
    setValues(values.includes(value) ? values.filter((item) => item !== value) : [...values, value])
  }

  if (stage === 'results') return <BlendResults onEdit={() => setStage('setup')} />

  return (
    <div className="page-wrap blend-page">
      <section className="blend-header">
        <div><p className="eyebrow">Taste, in common</p><h1>Build a <em>Blend</em></h1><p>Palate compares what everyone likes, respects the hard nos, and explains every recommendation.</p></div>
        <div className="blend-explainer"><span>{selectedFriends.length + 1}</span><p><strong>people</strong><br />being blended</p><i /><span>14</span><p><strong>taste signals</strong><br />considered</p></div>
      </section>

      <form
        className="blend-builder"
        action={authenticated ? formAction : undefined}
        onSubmit={authenticated ? undefined : (event) => { event.preventDefault(); setStage('results'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
      >
        <input type="hidden" name="title" value="Friday dinner" />
        <input type="hidden" name="dietaryRestrictions" value="" />
        <input type="hidden" name="allergies" value="" />
        <input type="hidden" name="priceMax" value="3" />
        <input type="hidden" name="maxDistanceKm" value="5" />

        <section className="builder-main">
          <BuilderStep number="1" title="Who’s eating?" description="Select friends to blend with your taste profile." badge={`${selectedFriends.length + 1} people`}>
            <div className="participant-row">
              <button type="button" className="participant selected"><Avatar initials="JT" tone="olive" /><strong>You</strong><small>Host</small><span><Check size={14} /></span></button>
              {demoFriends.map((friend) => {
                const selected = selectedFriends.includes(friend.name)
                return <button type="button" key={friend.name} className={`participant ${selected ? 'selected' : ''}`} onClick={() => toggleValue(friend.name, selectedFriends, setSelectedFriends)}><Avatar initials={friend.initials} tone={friend.tone} /><strong>{friend.name.split(' ')[0]}</strong><small>{friend.compatibility}% fit</small>{selected ? <span><Check size={14} /></span> : null}</button>
              })}
              <Link className="participant invite" href={authenticated ? '/blend/invite' : '/login?next=/blend'}><span><Plus /></span><strong>Invite</strong><small>Share link</small></Link>
            </div>
          </BuilderStep>

          <BuilderStep number="2" title="Where and how far?" description="Start from a neighbourhood or current location.">
            <div className="location-fields">
              <label><span>Starting near</span><div className="input-icon"><MapPin /><input defaultValue="Queen St. W. & Spadina" /></div></label>
              <label><span>Maximum distance</span><select defaultValue="5"><option value="2">2 km</option><option value="5">5 km</option><option value="10">10 km</option><option value="any">Anywhere in Toronto</option></select></label>
            </div>
            <label className="range-label"><span>5 km</span><input type="range" min="1" max="15" defaultValue="5" /></label>
          </BuilderStep>

          <BuilderStep number="3" title="Set the table" description="Budget, cuisine, vibe, and group details.">
            <div className="blend-fields">
              <div className="field-block"><span className="form-label">Price per person</span><div className="segmented"><button type="button">$</button><button type="button">$$</button><button type="button" className="active">$$$</button><button type="button">$$$$</button></div></div>
              <div className="field-block"><span className="form-label">Group size</span><div className="counter"><button type="button">−</button><strong>{selectedFriends.length + 1}</strong><button type="button">+</button></div></div>
              <ChoiceBlock label="Cuisine" values={['✦ Surprise us', 'Japanese', 'Italian', 'Thai', 'Mexican', 'Korean']} selected={cuisines} onToggle={(value) => toggleValue(value.replace('✦ ', ''), cuisines, setCuisines)} />
              <ChoiceBlock label="Vibe" values={['Lively', 'Date night', 'Quiet', 'Patio', 'Celebration', 'Casual']} selected={vibes} onToggle={(value) => toggleValue(value, vibes, setVibes)} />
            </div>
          </BuilderStep>

          <BuilderStep number="4" title="Needs and hard nos" description="Hard constraints remove unsuitable restaurants before scoring.">
            <div className="safe-label"><Check size={15} />Applied strictly</div>
            <div className="location-fields"><label><span>Dietary needs &amp; allergies</span><select defaultValue="none"><option value="none">None for this group</option><option>Vegetarian</option><option>Gluten-aware</option><option>Nut allergy</option></select></label><label><span>Dealbreakers</span><input placeholder="e.g. no tasting menus, no loud rooms" /></label></div>
            <div className="constraint-note"><Check size={16} /><p><strong>Priya’s profile is vegetarian-friendly.</strong> We’ll prioritize restaurants with genuine options, not just side dishes.</p></div>
          </BuilderStep>
        </section>

        <aside className="blend-summary">
          <div className="summary-top"><span>YOUR BLEND</span><strong>Friday dinner</strong><small>Toronto · {selectedFriends.length + 1} people</small></div>
          <div className="summary-people"><div className="avatar-stack"><Avatar initials="JT" tone="olive" /><Avatar initials="MC" tone="wine" /><Avatar initials="EB" tone="amber" /></div><p>Julian + Maya + Ethan</p></div>
          <dl><div><dt>Area</dt><dd>Queen &amp; Spadina</dd></div><div><dt>Distance</dt><dd>Within 5 km</dd></div><div><dt>Budget</dt><dd>Up to $$$</dd></div><div><dt>Cuisine</dt><dd>{cuisines.join(', ') || 'Any'}</dd></div><div><dt>Vibe</dt><dd>{vibes.join(', ') || 'Any'}</dd></div></dl>
          <div className="mini-score"><div><span style={{ width: '88%' }} /></div><p><strong>Strong overlap</strong><small>12 shared positive signals</small></p></div>
          {state.status === 'error' ? <p role="alert" className="text-sm text-[var(--wine)]">{state.message}</p> : null}
          <button className="button wine full generate" disabled={pending}>{pending ? 'Creating Blend…' : <>Generate matches <span>✦</span></>}</button>
          <small className="summary-fine">{authenticated ? 'Creates a private, RLS-protected Blend session.' : 'Preview mode. Sign in to persist this Blend and invite friends.'}</small>
        </aside>
      </form>
    </div>
  )
}

function BuilderStep({ number, title, description, badge, children }: { number: string; title: string; description: string; badge?: string; children: React.ReactNode }) {
  return <div className="builder-step"><div className="step-number">{number}</div><div className="step-content"><div className="step-heading"><div><h2>{title}</h2><p>{description}</p></div>{badge ? <span>{badge}</span> : null}</div>{children}</div></div>
}

function ChoiceBlock({ label, values, selected, onToggle }: { label: string; values: string[]; selected: string[]; onToggle: (value: string) => void }) {
  return <div className="field-block full"><span className="form-label">{label}</span><div className="choice-pills">{values.map((value) => { const normalized = value.replace('✦ ', ''); return <button type="button" key={value} className={selected.includes(normalized) ? 'active' : ''} onClick={() => onToggle(value)}>{value}</button> })}</div></div>
}

function BlendResults({ onEdit }: { onEdit: () => void }) {
  return (
    <div className="page-wrap results-page">
      <section className="results-head">
        <div><button className="back-link" onClick={onEdit}><ArrowLeft />Edit Blend</button><p className="eyebrow">Friday dinner · 3 people</p><h1>Your strongest <em>matches</em></h1><p>12 eligible restaurants after 5 hard constraints. Ranked by shared fit, not popularity alone.</p></div>
        <div className="results-actions"><button className="button ghost"><Bookmark />Save Blend</button><button className="button ghost"><Share2 />Share</button><Link className="button dark" href={`/restaurants/${resultRows[0].restaurant.slug}`}>Pick for us <span>✦</span></Link></div>
      </section>
      <div className="result-layout">
        <div className="result-list">
          {resultRows.map((result, index) => (
            <article className={`match-card ${index === 0 ? 'top-match' : ''}`} key={result.restaurant.id}>
              <div className="rank">{index + 1}</div><div className="match-photo"><Image src={result.restaurant.image} alt={result.restaurant.name} width={1000} height={700} />{index === 0 ? <span>BEST OVERALL FIT</span> : null}</div>
              <div className="match-body">
                <div className="match-title"><div><h2>{result.restaurant.name}</h2><p>{result.restaurant.cuisine} · {result.restaurant.neighbourhood} · {result.restaurant.price}</p></div><div className="score-badge"><strong>{result.score}%</strong><span>match</span></div></div>
                <div className="contributions">{result.contributions.map((contribution) => <span className="tag" key={contribution}>{contribution}</span>)}</div>
                <div className="why-match"><span>✦</span><div><strong>Why it matched</strong>{result.reasons.map((reason) => <p key={reason}><Check size={14} />{reason}</p>)}</div></div>
                <div className="concern"><span>Worth knowing</span><p>{result.concern}</p></div>
                <div className="match-meta"><span><MapPin size={16} />{result.restaurant.distance}</span><span><UserRound size={16} />Great for 3</span><span><Star size={16} />{result.restaurant.rating}</span></div>
                <footer><Link href={`/restaurants/${result.restaurant.slug}`}>View restaurant</Link><Link href="/map"><Map size={17} />Map</Link></footer>
              </div>
            </article>
          ))}
        </div>
        <aside className="score-card"><p className="eyebrow">How this Blend scored</p><h3>Built on overlap.<br />Honest about trade-offs.</h3><div className="score-bars">{[['Cuisine',96],['Vibe',92],['Price',100],['Distance',88],['Social proof',90],['Group fit',94]].map(([label, score]) => <div key={String(label)}><span>{label}<b>{score}</b></span><i><em style={{ width: `${score}%` }} /></i></div>)}</div><div className="hard-pass"><Check /><div><strong>All hard constraints passed</strong><p>Dietary needs, distance, budget, disliked cuisines, and dealbreakers.</p></div></div><button className="button ghost full">Reroll eligible matches</button></aside>
      </div>
    </div>
  )
}
