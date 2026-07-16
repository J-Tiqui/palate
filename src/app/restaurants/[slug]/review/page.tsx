import { notFound } from 'next/navigation'
import { PalateShell } from '@/components/palate/app-shell'
import { ReviewForm } from '@/components/review-form'
import { requireUser } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { slugSchema } from '@/lib/validation/schemas'

export default async function ReviewRestaurantPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: rawSlug } = await params
  const slug = slugSchema.safeParse(rawSlug)
  if (!slug.success) notFound()
  await requireUser(`/restaurants/${slug.data}/review`)
  const supabase = await createClient()
  const { data: restaurant } = await supabase.from('restaurants').select('id, slug, name').eq('slug', slug.data).maybeSingle()
  if (!restaurant) notFound()

  return <PalateShell><div className="modal-backdrop route-form"><ReviewForm restaurantId={restaurant.id} restaurantSlug={restaurant.slug} restaurantName={restaurant.name} /></div></PalateShell>
}
