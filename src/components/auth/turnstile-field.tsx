'use client'

import Script from 'next/script'
import { useRef, useState } from 'react'

type TurnstileApi = {
  render: (element: HTMLElement, options: {
    sitekey: string
    callback: (token: string) => void
    'expired-callback': () => void
    theme: 'light'
  }) => string
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

export function TurnstileField({ siteKey }: { siteKey?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const [token, setToken] = useState('')

  const resolvedSiteKey = siteKey ?? ''
  if (!resolvedSiteKey) return null

  function renderWidget() {
    if (!containerRef.current || !window.turnstile || widgetIdRef.current) return
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: resolvedSiteKey,
      callback: setToken,
      'expired-callback': () => setToken(''),
      theme: 'light',
    })
  }

  return (
    <div className="space-y-2">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={renderWidget}
      />
      <div ref={containerRef} aria-label="Bot protection challenge" />
      <input type="hidden" name="captchaToken" value={token} />
    </div>
  )
}
