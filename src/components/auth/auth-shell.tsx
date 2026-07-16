import Link from 'next/link'

type AuthShellProps = {
  eyebrow: string
  title: string
  description: string
  children: React.ReactNode
}

export function AuthShell({ eyebrow, title, description, children }: AuthShellProps) {
  return (
    <main className="min-h-screen bg-[#f4efe6] px-5 py-8 text-[#201c18] sm:py-14">
      <div className="mx-auto max-w-md">
        <Link href="/" className="inline-block text-2xl font-semibold tracking-[-0.04em]">
          Palate.
        </Link>
        <section className="mt-8 rounded-[2rem] border border-black/5 bg-white/80 p-6 shadow-xl shadow-black/5 backdrop-blur sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6b2637]">{eyebrow}</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em]">{title}</h1>
          <p className="mt-3 leading-7 text-black/55">{description}</p>
          <div className="mt-7">{children}</div>
        </section>
      </div>
    </main>
  )
}
