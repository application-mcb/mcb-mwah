import { redirect } from 'next/navigation'
import { AuthServer } from '@/lib/auth-server'
import { getSessionCookieValue } from '@/lib/get-session-cookie'
import LandingRoot from '@/components/landing-root'

const getDashboardPath = (role?: string) => {
  if (!role || role === 'student') {
    return '/dashboard'
  }

  if (role === 'teacher') {
    return '/teacher'
  }

  if (role === 'registrar' || role === 'admin') {
    return '/registrar'
  }

  return '/dashboard'
}

export const dynamic = 'force-dynamic'

export default async function LandingPage() {
  const sessionCookie = await getSessionCookieValue()
  const authenticatedUser = await AuthServer.getUserFromSessionCookie(
    sessionCookie
  )

  if (authenticatedUser) {
    redirect(getDashboardPath(authenticatedUser.role))
  }

  return <LandingRoot />
}
