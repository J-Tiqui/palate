'use client'

import { useFormStatus } from 'react-dom'

export function SubmitButton({ children, className }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className={className ?? 'w-full rounded-2xl bg-[#6b2637] px-5 py-3.5 font-semibold text-white transition hover:bg-[#57202d] disabled:cursor-wait disabled:opacity-60'}
    >
      {pending ? 'One moment…' : children}
    </button>
  )
}
