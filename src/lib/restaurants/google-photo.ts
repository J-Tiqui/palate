import 'server-only'

import { createHmac, timingSafeEqual } from 'node:crypto'
import { getServerEnv } from '@/lib/env/server'

function signaturePayload(reference: string, width: number): string {
  return `${reference}:${width}`
}

function sign(reference: string, width: number): string {
  const key = getServerEnv().googlePlacesApiKey
  if (!key) return ''
  return createHmac('sha256', key).update(signaturePayload(reference, width)).digest('base64url')
}

export function getGooglePhotoUrl(reference: string, width = 720): string | null {
  const normalizedWidth = Math.min(Math.max(Math.round(width), 1), 1600)
  const signature = sign(reference, normalizedWidth)
  if (!signature) return null
  const query = new URLSearchParams({
    name: reference,
    width: String(normalizedWidth),
    signature,
  })
  return `/api/places/photo?${query.toString()}`
}

export function verifyGooglePhotoSignature(reference: string, width: number, signature: string): boolean {
  const expected = sign(reference, width)
  if (!expected || signature.length !== expected.length) return false
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
}
