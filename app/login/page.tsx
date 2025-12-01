import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { AuthServer } from '@/lib/auth-server'
import LoginRoot from '@/components/login-root'

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

export default async function LoginPage() {
  const sessionCookie = cookies().get('session')?.value
  const authenticatedUser =
    await AuthServer.getUserFromSessionCookie(sessionCookie)

  if (authenticatedUser) {
    redirect(getDashboardPath(authenticatedUser.role))
  }

  return <LoginRoot />
}
