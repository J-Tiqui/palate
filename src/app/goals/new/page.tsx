import { PalateShell } from '@/components/palate/app-shell'
import { NewGoalForm } from '@/components/palate/product-forms'
import { requireUser } from '@/lib/auth/server'

export default async function NewGoalPage() {
  await requireUser('/goals/new')
  return <PalateShell><div className="modal-backdrop route-form"><NewGoalForm /></div></PalateShell>
}
