'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Typewriter } from './typewriter'
import {
  ArrowRight,
  Play,
  GraduationCap,
  BookOpen,
  Sparkle,
  MapPin,
} from '@phosphor-icons/react'
import { useRouter } from 'next/navigation'

export const HeroSection = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [cursorPosition, setCursorPosition] = useState({ x: -200, y: -200 })
  const [isCursorActive, setIsCursorActive] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    setIsVisible(true)
  }, [])

  useEffect(() => {
    const node = heroRef.current
    if (!node) return

    const handleMouseMove = (event: MouseEvent) => {
      const rect = node.getBoundingClientRect()
      setCursorPosition({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      })
      setIsCursorActive(true)
    }

    const handleMouseLeave = () => {
      setIsCursorActive(false)
    }

    node.addEventListener('mousemove', handleMouseMove)
    node.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      node.removeEventListener('mousemove', handleMouseMove)
      node.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  const handleGetStarted = () => {
    router.push('/login')
  }

  const handleLearnMore = () => {
    const element = document.getElementById('programs')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <section
      id="hero"
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-white via-blue-50 to-blue-100"
    >
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute opacity-20 inset-0 bg-[radial-gradient(circle_at_center,_rgba(15,23,42,0)_0%,_rgba(15,23,42,0.18)_30%,_rgba(23,37,84,0.45)_100%)]"></div>
      </div>
      <div className="texture-overlay opacity-50" aria-hidden="true"></div>
      {/* Grid Background */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(30, 58, 138, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(30, 58, 138, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      ></div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-900/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-800/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-900/3 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Cursor Glow */}
      <div
        className={`pointer-events-none absolute inset-0 transition-opacity duration-300 ${
          isCursorActive ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden="true"
      >
        <div
          className="absolute w-32 h-32 rounded-full bg-blue-900/30 blur-3xl"
          style={{
            left: `${cursorPosition.x}px`,
            top: `${cursorPosition.y}px`,
            transform: 'translate(-50%, -50%)',
          }}
        ></div>
        <div
          className="absolute w-48 h-48 rounded-full bg-blue-800/20 blur-[120px]"
          style={{
            left: `${cursorPosition.x}px`,
            top: `${cursorPosition.y}px`,
            transform: 'translate(-50%, -50%)',
          }}
        ></div>
      </div>

      <div className="relative z-10 max-h-[1000px] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-16 lg:pt-20 pb-12 sm:pb-16 lg:pb-20">
        {/* Mobile Layout */}
        <div className="block lg:hidden">
          <div
            className={`space-y-6 transition-all duration-1000 ${
              isVisible
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-10'
            }`}
          >
            {/* Title */}
            <div className="text-center">
              <h1
                className="text-3xl sm:text-4xl font-medium text-blue-900 leading-tight"
                style={{
                  fontFamily: 'Poppins',
                  fontWeight: 500,
                }}
              >
                Marian College of Baliuag Student Portal
              </h1>
            </div>

            {/* Video */}
            <div className="relative">
              <div className="relative w-full h-[250px] sm:h-[300px] rounded-xl overflow-hidden shadow-2xl border border-blue-200 mx-auto max-w-md">
                <video
                  className="w-full h-full object-cover"
                  src="/page.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  aria-label="Marian College student experience"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/70 via-blue-900/30 to-transparent pointer-events-none"></div>
              </div>
            </div>

            {/* Location Badge */}
            <div className="flex justify-center">
              <div className="inline-flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg bg-blue-900/10 border border-blue-900/20">
                <MapPin
                  size={16}
                  className="text-blue-900 flex-shrink-0"
                  weight="fill"
                />
                <span
                  className="text-xs sm:text-sm text-blue-900"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  908 Gil Carlos St. San Jose, Baliuag, Bulacan
                </span>
              </div>
            </div>

            {/* Typewriter */}
            <div className="text-center">
              <p
                className="text-lg sm:text-xl text-blue-900/80 font-mono"
                style={{ fontWeight: 300 }}
              >
                <Typewriter
                  text={[
                    'Empowering Education',
                    'Transforming Learning',
                    'Building Futures',
                  ]}
                  delay={50}
                  loop={true}
                  className="block"
                />
              </p>
            </div>

            {/* Description */}
            <div className="text-center">
              <p className="text-base sm:text-lg text-blue-800/80 leading-relaxed font-mono max-w-2xl mx-auto">
                Experience a modern, comprehensive student management system
                designed to streamline academic processes and enhance your
                educational journey.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Button
                onClick={handleGetStarted}
                className="rounded-lg text-sm px-6 py-3 sm:py-4 bg-gradient-to-br from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 text-white transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-xl"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Start Enrolling
                <ArrowRight size={20} className="ml-2" weight="bold" />
              </Button>
              <Button
                onClick={handleLearnMore}
                variant="outline"
                className="rounded-lg text-sm px-6 py-3 sm:py-4 border-2 border-blue-900 text-blue-900 hover:bg-blue-50 transition-all duration-300 hover:scale-105 active:scale-95"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                <Play size={20} className="mr-2" weight="fill" />
                View Programs
              </Button>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Content */}
          <div
            className={`space-y-6 lg:space-y-8 transition-all duration-1000 ${
              isVisible
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="space-y-4">
              <div className="inline-flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg bg-blue-900/10 border border-blue-900/20">
                <MapPin
                  size={16}
                  className="text-blue-900 flex-shrink-0"
                  weight="fill"
                />
                <span
                  className="text-xs sm:text-sm text-blue-900"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  908 Gil Carlos St. San Jose, Baliuag, Bulacan
                </span>
              </div>

              <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                <h1
                  className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-medium text-blue-900 leading-tight"
                  style={{
                    fontFamily: 'Poppins',
                    fontWeight: 500,
                  }}
                >
                  Marian College of Baliuag Student Portal
                </h1>
                <p
                  className="text-lg sm:text-xl text-blue-900/80 font-mono"
                  style={{ fontWeight: 300 }}
                >
                  <Typewriter
                    text={[
                      'Empowering Education',
                      'Transforming Learning',
                      'Building Futures',
                    ]}
                    delay={50}
                    loop={true}
                    className="block"
                  />
                </p>
              </div>

              <p className="text-lg sm:text-xl text-blue-800/80 leading-relaxed mt-6 lg:mt-8 font-mono">
                Experience a modern, comprehensive student management system
                designed to streamline academic processes and enhance your
                educational journey.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <Button
                onClick={handleGetStarted}
                className="rounded-lg text-sm px-6 py-3 sm:py-4 bg-gradient-to-br from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 text-white transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-xl"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Start Enrolling
                <ArrowRight size={20} className="ml-2" weight="bold" />
              </Button>
              <Button
                onClick={handleLearnMore}
                variant="outline"
                className="rounded-lg text-sm px-6 py-3 sm:py-4 border-2 border-blue-900 text-blue-900 hover:bg-blue-50 transition-all duration-300 hover:scale-105 active:scale-95"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                <Play size={20} className="mr-2" weight="fill" />
                View Programs
              </Button>
            </div>
          </div>

          {/* Right Image/Visual */}
          <div
            className={`relative transition-all duration-1000 delay-300 ${
              isVisible
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 translate-x-10'
            }`}
          >
            <div className="relative">
              {/* Video Hero */}
              <div className="relative w-full h-[300px] sm:h-[400px] lg:h-[500px] rounded-xl overflow-hidden shadow-2xl border border-blue-200">
                <video
                  className="w-full h-full object-cover"
                  src="/page.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  aria-label="Marian College student experience"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/70 via-blue-900/30 to-transparent pointer-events-none"></div>
              </div>

              {/* Floating Cards */}
              <div className="absolute -top-3 sm:-top-6 -left-3 sm:-left-6 bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-xl border border-blue-100">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center">
                    <GraduationCap
                      size={20}
                      className="text-white"
                      weight="fill"
                    />
                  </div>
                  <div>
                    <div
                      className="text-xs sm:text-sm font-medium text-blue-900"
                      style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                    >
                      Easy Enrollment
                    </div>
                    <div
                      className="text-xs text-blue-800/70 font-mono"
                      style={{ fontWeight: 300 }}
                    >
                      Quick & Simple
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-3 sm:-bottom-6 -right-3 sm:-right-6 bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-xl border border-blue-100">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center">
                    <BookOpen size={20} className="text-white" weight="fill" />
                  </div>
                  <div>
                    <div
                      className="text-xs sm:text-sm font-medium text-blue-900"
                      style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                    >
                      Track Progress
                    </div>
                    <div
                      className="text-xs text-blue-800/70 font-mono"
                      style={{ fontWeight: 300 }}
                    >
                      Real-time Updates
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
