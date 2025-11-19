'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  List,
  X,
  House,
  SquaresFour,
  CalendarBlank,
  GraduationCap,
} from '@phosphor-icons/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/lib/auth-context'

export const NavigationBar = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const router = useRouter()
  const { user } = useAuth()

  const navigationLinks = [
    { id: 'hero', label: 'Home', Icon: House },
    { id: 'features', label: 'Features', Icon: SquaresFour },
    { id: 'events', label: 'Events', Icon: CalendarBlank },
    { id: 'programs', label: 'Programs', Icon: GraduationCap },
  ]

  useEffect(() => {
    let ticking = false

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 20)

          // Calculate scroll progress
          const totalHeight =
            document.documentElement.scrollHeight - window.innerHeight
          const progress = (window.scrollY / totalHeight) * 100
          const clampedProgress = Math.min(100, Math.max(0, progress))
          setScrollProgress(clampedProgress)

          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSmoothScroll = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    setIsMobileMenuOpen(false)
  }

  const handleLogin = () => {
    router.push('/login')
  }

  const handleAvatarClick = async () => {
    if (!user) return

    setIsNavigating(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to navigate')
      }

      if (result.isRegistrar) {
        router.push(result.redirectTo || '/registrar')
      } else if (result.isTeacher) {
        router.push(result.redirectTo || '/teacher')
      } else if (result.hasCompleteProfile) {
        router.push('/dashboard')
      } else {
        router.push('/setup')
      }
    } catch (error) {
      console.error('Navigation failed:', error)
      router.push('/dashboard')
    } finally {
      setIsNavigating(false)
    }
  }

  return (
    <>
      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-[60] h-1.5 bg-blue-100/30">
        <div
          className="h-full bg-gradient-to-r from-blue-900 to-blue-600 transition-all duration-75 ease-linear"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <nav
        className={`fixed top-1.5 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-blue-100'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 relative flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="Marian College Logo"
                  width={40}
                  height={40}
                  className="object-contain"
                  priority
                />
              </div>
              <div className="flex flex-col">
                <span
                  className="text-sm font-medium text-blue-900"
                  style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                >
                  MARIAN COLLEGE
                </span>
                <span
                  className="text-xs text-blue-800"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  #TATAKMARIAN
                </span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navigationLinks.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => handleSmoothScroll(id)}
                  className="flex items-center space-x-2 text-blue-900 hover:text-blue-800 transition-colors duration-200"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  aria-label={`Navigate to ${label}`}
                >
                  <Icon size={18} weight="regular" aria-hidden="true" />
                  <span>{label}</span>
                </button>
              ))}
              {user ? (
                <button
                  onClick={handleAvatarClick}
                  disabled={isNavigating}
                  className="w-10 h-10 rounded-full overflow-hidden bg-blue-900 flex items-center justify-center border-2 border-blue-900 hover:opacity-80 transition-opacity duration-200 cursor-pointer disabled:opacity-50"
                  aria-label="Go to dashboard"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || user.email || 'Profile'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span
                      className="text-white text-sm font-medium"
                      style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                    >
                      {(user.displayName || user.email || 'U')
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                  )}
                </button>
              ) : (
                <div className="flex items-center space-x-3">
                  <Button
                    onClick={handleLogin}
                    variant="outline"
                    className="rounded-lg border-blue-900 text-blue-900 hover:bg-blue-50"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Login
                  </Button>
                  <Button
                    onClick={handleLogin}
                    className="rounded-lg bg-gradient-to-br from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 text-white"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Get Started
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-blue-900 hover:bg-blue-50 transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X size={24} weight="bold" />
              ) : (
                <List size={24} weight="bold" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-blue-100 animate-in slide-in-from-top duration-300">
            <div className="px-4 py-4 space-y-3">
              {navigationLinks.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => handleSmoothScroll(id)}
                  className="flex items-center space-x-3 w-full text-left text-blue-900 hover:text-blue-800 py-2 transition-colors"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  aria-label={`Navigate to ${label}`}
                >
                  <Icon size={18} weight="regular" aria-hidden="true" />
                  <span>{label}</span>
                </button>
              ))}
              <div className="pt-4 space-y-2 border-t border-blue-100">
                {user ? (
                  <div className="flex items-center justify-center py-2">
                    <button
                      onClick={handleAvatarClick}
                      disabled={isNavigating}
                      className="w-10 h-10 rounded-full overflow-hidden bg-blue-900 flex items-center justify-center border-2 border-blue-900 hover:opacity-80 transition-opacity duration-200 cursor-pointer disabled:opacity-50"
                      aria-label="Go to dashboard"
                    >
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.displayName || user.email || 'Profile'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span
                          className="text-white text-sm font-medium"
                          style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                        >
                          {(user.displayName || user.email || 'U')
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                      )}
                    </button>
                  </div>
                ) : (
                  <>
                    <Button
                      onClick={handleLogin}
                      variant="outline"
                      className="w-full rounded-lg border-blue-900 text-blue-900 hover:bg-blue-50"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      Login
                    </Button>
                    <Button
                      onClick={handleLogin}
                      className="w-full rounded-lg bg-gradient-to-br from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 text-white"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      Get Started
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  )
}
