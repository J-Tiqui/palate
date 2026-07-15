import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Palate — Taste, together',
  description: 'Discover, log, review, and blend restaurant tastes with friends.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
