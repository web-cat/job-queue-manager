// PURPOSE: HTTP client that signs every request with HMAC-SHA256 using stored
// OAuth client credentials. All API calls go through this module so signing
// logic is never duplicated across commands.
//
// SIGNING FORMAT (must match backend oauth_signature_middleware.ts):
//   canonical = METHOD\nPATH\nTIMESTAMP\nNONCE\nBODY_HASH
//   signature = HMAC-SHA256(clientSecret, canonical)
//
// Headers sent on every request:
//   x-api-key:   <client_id>
//   x-timestamp: <unix ms>
//   x-nonce:     <uuid>
//   x-signature: <hmac hex>

import { createHmac, createHash, randomUUID } from 'node:crypto'
import { getCredentials } from './config.js'

export interface ApiResponse<T = unknown> {
  ok: boolean
  status: number
  data: T
  error?: string
}

function signRequest(
  clientSecret: string,
  method: string,
  path: string,
  body: string
): { timestamp: string; nonce: string; signature: string } {
  const timestamp = Date.now().toString()
  const nonce = randomUUID()
  const bodyHash = createHash('sha256').update(body).digest('hex')
  const canonical = [method.toUpperCase(), path, timestamp, nonce, bodyHash].join('\n')
  const signature = createHmac('sha256', clientSecret).update(canonical).digest('hex')
  return { timestamp, nonce, signature }
}

export async function apiRequest<T = unknown>(
  method: string,
  path: string,
  body?: unknown
): Promise<ApiResponse<T>> {
  const creds = getCredentials()

  if (!creds) {
    return {
      ok: false,
      status: 0,
      data: undefined as T,
      error: 'Not configured. Run: jqm setup',
    }
  }

  const bodyStr = body ? JSON.stringify(body) : ''
  const { timestamp, nonce, signature } = signRequest(
    creds.clientSecret,
    method,
    `/api/v1${path}`,
    bodyStr
  )

  const url = `${creds.serverUrl}/api/v1${path}`

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': creds.clientId,
        'x-timestamp': timestamp,
        'x-nonce': nonce,
        'x-signature': signature,
      },
      body: bodyStr || undefined,
    })

    let data: T
    try {
      data = (await response.json()) as T
    } catch {
      data = undefined as T
    }

    return {
      ok: response.ok,
      status: response.status,
      data,
      error: response.ok ? undefined : `HTTP ${response.status}`,
    }
  } catch (error) {
    return {
      ok: false,
      status: 0,
      data: undefined as T,
      error: error instanceof Error ? error.message : 'Network error',
    }
  }
}

export const api = {
  get: <T = unknown>(path: string) => apiRequest<T>('GET', path),
  post: <T = unknown>(path: string, body?: unknown) => apiRequest<T>('POST', path, body),
  patch: <T = unknown>(path: string, body?: unknown) => apiRequest<T>('PATCH', path, body),
  delete: <T = unknown>(path: string) => apiRequest<T>('DELETE', path),
}
