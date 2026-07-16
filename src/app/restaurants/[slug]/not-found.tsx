import Link from 'next/link'

export default function RestaurantNotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f4efe6] px-5 text-center text-[#201c18]">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-[#6b2637]">Off the menu</p>
        <h1 className="mt-3 text-5xl font-semibold tracking-[-0.05em]">We couldn’t find that restaurant.</h1>
        <Link href="/discover" className="mt-7 inline-block rounded-full bg-[#1f3a31] px-5 py-3 font-semibold text-white">Browse discovery</Link>
      </div>
    </main>
  )
}
