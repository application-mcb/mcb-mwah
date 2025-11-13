'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { List, X } from '@phosphor-icons/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export const NavigationBar = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll)
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

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
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
            <button
              onClick={() => handleSmoothScroll('hero')}
              className="text-blue-900 hover:text-blue-800 transition-colors duration-200"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Home
            </button>
            <button
              onClick={() => handleSmoothScroll('features')}
              className="text-blue-900 hover:text-blue-800 transition-colors duration-200"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Features
            </button>
            <button
              onClick={() => handleSmoothScroll('statistics')}
              className="text-blue-900 hover:text-blue-800 transition-colors duration-200"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Statistics
            </button>
            <button
              onClick={() => handleSmoothScroll('programs')}
              className="text-blue-900 hover:text-blue-800 transition-colors duration-200"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Programs
            </button>
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
            <button
              onClick={() => handleSmoothScroll('hero')}
              className="block w-full text-left text-blue-900 hover:text-blue-800 py-2 transition-colors"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Home
            </button>
            <button
              onClick={() => handleSmoothScroll('features')}
              className="block w-full text-left text-blue-900 hover:text-blue-800 py-2 transition-colors"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Features
            </button>
            <button
              onClick={() => handleSmoothScroll('statistics')}
              className="block w-full text-left text-blue-900 hover:text-blue-800 py-2 transition-colors"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Statistics
            </button>
            <button
              onClick={() => handleSmoothScroll('programs')}
              className="block w-full text-left text-blue-900 hover:text-blue-800 py-2 transition-colors"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Programs
            </button>
            <div className="pt-4 space-y-2 border-t border-blue-100">
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
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
