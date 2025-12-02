'use client'

import { useEffect } from 'react'
import { NavigationBar } from '@/components/landing/navigation-bar'
import { HeroSection } from '@/components/landing/hero-section'

export const LandingRoot = () => {
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth'

    return () => {
      document.documentElement.style.scrollBehavior = 'auto'
    }
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <NavigationBar />
      <main>
        <HeroSection />
      </main>
    </div>
  )
}

export default LandingRoot

