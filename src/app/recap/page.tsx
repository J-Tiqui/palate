import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Share2 } from 'lucide-react'
import { Avatar, PalateShell } from '@/components/palate/app-shell'
import { images } from '@/lib/palate/demo-data'

export default function RecapPage() {
  return (
    <PalateShell>
      <div className="recap-page">
        <Link className="back-link light" href="/profile/julian"><ArrowLeft />Profile</Link>
        <section className="recap-intro">
          <span>PALATE · 2026 SO FAR</span><h1>A year measured<br />in <em>good tables.</em></h1><p>Julian’s food recap · January–July · prototype visit history</p>
          <button className="button cream"><Share2 />Share recap</button>
        </section>
        <section className="recap-grid">
          <article className="recap-stat cream-card"><span>RESTAURANTS VISITED</span><strong>47</strong><p>That’s nearly two new tables every week.</p></article>
          <article className="recap-photo-card"><Image src={images.japanese} alt="Japanese food" width={900} height={1200} /><div><span>FAVOURITE CUISINE</span><strong>Japanese</strong><p>11 restaurants · 4.6 average</p></div></article>
          <article className="recap-stat wine-card"><span>HIGHEST RATED</span><strong className="small-stat">Giulietta</strong><p>4.9 · Italian · Little Italy</p></article>
          <article className="recap-stat olive-card"><span>YOUR NEIGHBOURHOOD</span><strong className="small-stat">Queen West</strong><p>8 visits · apparently, your second kitchen.</p></article>
          <article className="recap-companion"><div className="orbit"><Avatar initials="MC" tone="wine" /><span>18</span></div><div><span>MOST COMMON COMPANION</span><strong>Maya</strong><p>18 shared tables · 92% taste compatibility</p></div></article>
          <article className="recap-stat dark-card"><span>GOALS COMPLETED</span><strong>3</strong><p>Plus 6 active goals still making dinner interesting.</p></article>
          <article className="recap-wide"><div><span>FOOD PERSONALITY OF THE YEAR</span><h2>The Considered Explorer</h2><p>You like a polished room, but never at the expense of warmth. You chased Japanese precision, Italian comfort, and four cuisines you hadn’t tried before.</p></div><div className="recap-seal">✦<span>Palate</span></div></article>
        </section>
        <footer className="recap-footer"><span className="wordmark-static light-wordmark">Palate<span>.</span></span><p>Made from prototype visit history · Toronto</p></footer>
      </div>
    </PalateShell>
  )
}
