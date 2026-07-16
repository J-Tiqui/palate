import { PalateShell } from '@/components/palate/app-shell'
import { EditProfileForm } from '@/components/palate/product-forms'
import { requireUser } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

export default async function EditProfilePage() {
  const user = await requireUser('/profile/edit')
  const supabase = await createClient()
  const { data: profile } = await supabase.from('profiles').select('username, display_name, bio, home_city, preferred_neighbourhoods, favourite_cuisines, disliked_cuisines, preferred_vibes, privacy').eq('id', user.id).single()
  if (!profile) notFound()
  return <PalateShell><div className="modal-backdrop route-form"><EditProfileForm defaults={{ username: profile.username || `palate-${user.id.slice(0, 8)}`, displayName: profile.display_name, bio: profile.bio, homeCity: profile.home_city || '', preferredNeighbourhoods: profile.preferred_neighbourhoods, favouriteCuisines: profile.favourite_cuisines, dislikedCuisines: profile.disliked_cuisines, preferredVibes: profile.preferred_vibes, privacy: profile.privacy }} /></div></PalateShell>
}
