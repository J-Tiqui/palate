import Image from 'next/image'
import Link from 'next/link'
import { Bookmark, Heart, MoreHorizontal } from 'lucide-react'
import { Avatar, PalateShell } from '@/components/palate/app-shell'
import { demoActivity, demoFriends } from '@/lib/palate/demo-data'

export default function ActivityPage() {
  return (
    <PalateShell>
      <div className="page-wrap activity-page">
        <section className="page-title">
          <div><p className="eyebrow">From your circle</p><h1>Activity</h1><p>Reviews, saves, goals, and plans from people whose taste you know.</p></div>
          <div className="segmented slim"><button className="active">Friends</button><button>You</button></div>
        </section>
        <div className="activity-layout">
          <section className="activity-feed">
            {demoActivity.map((activity, index) => (
              <article className="activity-card" key={`${activity.person}-${activity.time}`}>
                <header>
                  <Avatar initials={activity.initials} tone={index % 3 === 0 ? 'wine' : index % 3 === 1 ? 'amber' : 'olive'} />
                  <div><p><strong>{activity.person}</strong> {activity.action} <Link href={`/restaurants/${activity.slug}`}>{activity.restaurant}</Link></p><small>{activity.time}</small></div>
                  <button aria-label={`More options for ${activity.person}`}><MoreHorizontal /></button>
                </header>
                <Link className="activity-image" href={`/restaurants/${activity.slug}`}>
                  <Image src={activity.image} alt={activity.restaurant} width={900} height={620} />
                  <span>{'rating' in activity ? `★ ${activity.rating}` : index === 1 ? 'GOAL PROGRESS' : index === 2 ? 'SAVED' : '94% MATCH'}</span>
                </Link>
                <p className="activity-text">{activity.text}</p>
                <footer><button><Heart size={18} />{12 + index * 3}</button><button>Reply</button><button aria-label={`Save ${activity.restaurant} activity`}><Bookmark size={18} /></button></footer>
              </article>
            ))}
          </section>
          <aside className="people-card">
            <p className="eyebrow">Taste compatibility</p>
            <h3>People you should follow</h3>
            {demoFriends.map((friend) => (
              <div className="suggested" key={friend.name}>
                <Avatar initials={friend.initials} tone={friend.tone} />
                <div><strong>{friend.name}</strong><span>{friend.taste}</span></div>
                <b>{friend.compatibility}%</b><button>Follow</button>
              </div>
            ))}
          </aside>
        </div>
      </div>
    </PalateShell>
  )
}
