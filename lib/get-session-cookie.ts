import { headers } from 'next/headers'

export const getSessionCookieValue = async (): Promise<string | undefined> => {
  const requestHeaders = await headers()
  const cookieHeader = requestHeaders.get('cookie')
  if (!cookieHeader) return undefined

  const sessionCookie = cookieHeader
    .split(';')
    .map((cookie: string) => cookie.trim())
    .find((cookie: string) => cookie.startsWith('session='))

  if (!sessionCookie) return undefined

  const rawValue = sessionCookie.substring('session='.length)
  if (!rawValue) return undefined

  try {
    return decodeURIComponent(rawValue)
  } catch {
    return rawValue
  }
}
