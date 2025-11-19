'use client'

import { useState } from 'react'
import { LoginForm } from '@/components/login-form'
import { RegistrationForm } from '@/components/registration-form'
import { ContinueWithUser } from '@/components/continue-with-user'
import { AuthHero } from '@/components/auth-hero'
import { useAuth } from '@/lib/auth-context'
import { SCHOOL_NAME } from '@/lib/constants'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const { user, loading } = useAuth()

  const handleLoginSuccess = () => {
    // Handle successful login (e.g., redirect to dashboard)
    console.log('Login successful!')
  }

  const handleRegistrationSuccess = () => {
    // Handle successful registration (e.g., switch to login or redirect)
    console.log('Registration successful!')
    setIsLogin(true) // Switch to login form after successful registration
  }

  const handleSwitchToRegistration = () => {
    setIsLogin(false)
  }

  const handleSwitchToLogin = () => {
    setIsLogin(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-800 lg:rounded-xl lg:overflow-hidden">
      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
        {/* Left Panel - Hero (Hidden on mobile/tablet) */}
        <div className="hidden lg:block fixed lg:w-1/2 h-full z-0">
          <AuthHero />
        </div>

        {/* Logo Section - Responsive positioning */}
        <div className="lg:w-1/2 h-full z-0">
          {/* Mobile/Tablet Logo - Top center */}
          <div className="lg:hidden flex items-center justify-center pt-6 pb-4">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Marian College Logo"
                className="w-10 h-10 object-contain aspect-square"
              />
              <div className="flex flex-col">
                <p className="text-sm font-bold text-white">{SCHOOL_NAME}</p>
                <p className="text-xs font-light text-white">#TATAKMARIAN</p>
              </div>
            </div>
          </div>

          {/* Desktop Logo - Bottom left */}
          <div className="hidden lg:block bg-blue-900/20 backdrop-blur-sm absolute bottom-0 left-0 lg:w-1/2 h-20 p-4 rounded-tl-xl">
            <div className="flex items-center gap-2">
              <img
                src="/logo.png"
                alt="Marian College Logo"
                className="w-12 h-12 object-contain aspect-square"
              />
              <div className="flex flex-col">
                <p className="text-sm font-bold text-white">{SCHOOL_NAME}</p>
                <p className="text-sm font-light text-white">#TATAKMARIAN</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Auth Forms */}
        <div className="flex items-center bg-gradient-to-br from-blue-100 to-blue-50 justify-center p-4 sm:p-6 lg:p-8 min-h-screen z-10 relative lg:shadow-lg">
          {/* Background pattern - Hidden on mobile for better performance */}
          <div className="hidden lg:block z-0 absolute inset-0 opacity-50 bg-[linear-gradient(rgba(30,58,138,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(30,58,138,0.1)_1px,transparent_1px)] bg-[length:20px_20px] rounded-l-xl"></div>

          {/* Mobile background - Solid color instead of pattern */}
          <div className="lg:hidden z-0 absolute inset-0 bg-blue-900/10"></div>

          <div className="w-full max-w-lg space-y-4 z-10  ">
            {loading ? (
              // Loading state while checking authentication
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
              </div>
            ) : user ? (
              // User is authenticated - show continue component
              <ContinueWithUser />
            ) : // User is not authenticated - show login/registration forms
            isLogin ? (
              <LoginForm
                onLoginSuccess={handleLoginSuccess}
                onSwitchToRegistration={handleSwitchToRegistration}
              />
            ) : (
              <RegistrationForm
                onRegistrationSuccess={handleRegistrationSuccess}
                onSwitchToLogin={handleSwitchToLogin}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
