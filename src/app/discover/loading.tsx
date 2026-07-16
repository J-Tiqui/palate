export default function DiscoverLoading() {
  return (
    <main className="min-h-screen bg-[#f4efe6] px-5 py-20 text-[#201c18]">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="h-14 w-72 rounded-2xl bg-black/10" />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="aspect-[4/3] rounded-[1.6rem] bg-black/10" />
          ))}
        </div>
      </div>
    </main>
  )
}
