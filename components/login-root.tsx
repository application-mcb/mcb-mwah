'use client'

import Image from 'next/image'
import { useState } from 'react'
import { LoginForm } from '@/components/login-form'
import { RegistrationForm } from '@/components/registration-form'
import { ContinueWithUser } from '@/components/continue-with-user'
import { AuthHero } from '@/components/auth-hero'
import { useAuth } from '@/lib/auth-context'
import { SCHOOL_NAME } from '@/lib/constants'

export const LoginRoot = () => {
  const [isLogin, setIsLogin] = useState(true)
  const { user, loading } = useAuth()

  const handleLoginSuccess = () => {
    console.log('Login successful!')
  }

  const handleRegistrationSuccess = () => {
    console.log('Registration successful!')
    setIsLogin(true)
  }

  const handleSwitchToRegistration = () => {
    setIsLogin(false)
  }

  const handleSwitchToLogin = () => {
    setIsLogin(true)
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-white via-blue-50 to-blue-100">
      {/* Landing-style animated wave background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 opacity-22">
          <svg
            className="absolute bottom-0 left-0 h-full w-full"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient
                id="loginWaveGradient1"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#1e40af" stopOpacity="0.12" />
              </linearGradient>
            </defs>
            <path
              fill="url(#loginWaveGradient1)"
              d="M0,96L48,112C96,128,192,160,288,186.7C384,213,480,235,576,213.3C672,192,768,128,864,128C960,128,1056,192,1152,197.3C1248,203,1344,149,1392,122.7L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
              className="animate-wave1"
            />
          </svg>
          <svg
            className="absolute bottom-0 left-0 h-full w-full"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient
                id="loginWaveGradient2"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#1e40af" stopOpacity="0.14" />
                <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.08" />
              </linearGradient>
            </defs>
            <path
              fill="url(#loginWaveGradient2)"
              d="M0,224L48,213.3C96,203,192,181,288,165.3C384,149,480,139,576,154.7C672,171,768,213,864,208C960,203,1056,149,1152,138.7C1248,128,1344,160,1392,176L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
              className="animate-wave2"
            />
          </svg>
          <svg
            className="absolute bottom-0 left-0 h-full w-full"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient
                id="loginWaveGradient3"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#1e40af" stopOpacity="0.06" />
              </linearGradient>
            </defs>
            <path
              fill="url(#loginWaveGradient3)"
              d="M0,160L48,181.3C96,203,192,245,288,234.7C384,224,480,160,576,138.7C672,117,768,139,864,154.7C960,171,1056,181,1152,170.7C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
              className="animate-wave3"
            />
          </svg>
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(15,23,42,0)_0%,_rgba(59,130,246,0.08)_32%,_rgba(30,64,175,0.12)_68%)]" />
        <div className="texture-overlay opacity-12" aria-hidden="true"></div>
      </div>

      <div className="relative grid min-h-screen grid-cols-1 lg:grid-cols-[1fr,1fr]">
        <div className="relative z-0 hidden h-full lg:flex">
          <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-br-[2rem] rounded-tr-[2rem] border-r border-white/10 bg-gradient-to-br from-white/5 via-white/0 to-white/5 backdrop-blur-xl shadow-[0_25px_80px_rgba(0,0,0,0.32)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.12),transparent_42%),radial-gradient(circle_at_75%_60%,rgba(30,64,175,0.2),transparent_50%)]" />
            <div className="absolute left-6 top-6 flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 shadow-inner backdrop-blur-md">
              <div className="h-2 w-2 rounded-full bg-emerald-400" />
              <p className="text-xs font-light uppercase tracking-[0.12em] text-white/80">
                Marian Connect Portal
              </p>
            </div>
            <div className="relative z-10 w-full max-w-2xl px-10">
              <AuthHero />
            </div>
            <div className="absolute bottom-6 left-6 flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-4 py-3 shadow-lg backdrop-blur-md">
              <Image
                src="/logo.png"
                alt="Marian College Logo"
                width={48}
                height={48}
                className="h-12 w-12 rounded-lg bg-white/90 p-2 object-contain"
                priority
              />
              <div className="flex flex-col">
                <p className="text-sm font-medium text-white">{SCHOOL_NAME}</p>
                <p className="text-xs font-light uppercase tracking-[0.08em] text-white/70">
                  #TATAKMARIAN
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-12 lg:py-16">
          <div className="absolute inset-0 rounded-none lg:rounded-l-[2rem]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(59,130,246,0.09),transparent_38%),radial-gradient(circle_at_90%_10%,rgba(30,64,175,0.1),transparent_48%)]" />

          <div className="w-full max-w-lg">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="h-9 w-9 animate-spin rounded-full border-2 border-blue-900/20 border-b-blue-900" />
              </div>
            ) : user ? (
              <ContinueWithUser />
            ) : isLogin ? (
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

export default LoginRoot
