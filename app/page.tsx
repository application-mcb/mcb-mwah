import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { AuthServer } from '@/lib/auth-server'
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

export default async function LandingPage() {
  const sessionCookie = cookies().get('session')?.value
  const authenticatedUser =
    await AuthServer.getUserFromSessionCookie(sessionCookie)

  if (authenticatedUser) {
    redirect(getDashboardPath(authenticatedUser.role))
  }

  return <LandingRoot />
}
