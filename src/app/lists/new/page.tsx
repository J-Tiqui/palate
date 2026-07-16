import { PalateShell } from '@/components/palate/app-shell'
import { NewListForm } from '@/components/palate/product-forms'
import { requireUser } from '@/lib/auth/server'

export default async function NewListPage() {
  await requireUser('/lists/new')
  return <PalateShell><div className="modal-backdrop route-form"><NewListForm /></div></PalateShell>
}
