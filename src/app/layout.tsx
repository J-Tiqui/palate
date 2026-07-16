import type { Metadata } from 'next'
import './palate-source.css'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Palate — Find your table',
    template: '%s · Palate',
  },
  description: 'Discover restaurants through people you trust, remember every table, and Blend tastes with friends.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "try{var t=localStorage.getItem('palate-theme');if(t==='dark'||t==='light')document.documentElement.dataset.theme=t}catch(e){}" }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
