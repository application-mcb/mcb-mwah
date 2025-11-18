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
  const heroRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    setIsVisible(true)
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

      <div className="relative z-10 max-h-[1000px] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div
            className={`space-y-8 transition-all duration-1000 ${
              isVisible
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="space-y-4">
              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-900/10 border border-blue-900/20">
                <MapPin size={16} className="text-blue-900" weight="fill" />
                <span
                  className="text-sm text-blue-900"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  908 Gil Carlos St. San Jose, Baliuag, Bulacan
                </span>
              </div>

              <div className="space-y-4 mb-6">
                <h1
                  className="text-5xl lg:text-6xl font-medium text-blue-900 leading-tight"
                  style={{
                    fontFamily: 'Poppins',
                    fontWeight: 500,
                  }}
                >
                  Marian College of Baliuag Student Portal
                </h1>
                <p
                  className="text-xl text-blue-900/80 font-mono"
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

              <p className="text-xl text-blue-800/80 leading-relaxed mt-8 font-mono">
                Experience a modern, comprehensive student management system
                designed to streamline academic processes and enhance your
                educational journey.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Button
                onClick={handleGetStarted}
                className="rounded-full text-sm p-6 bg-gradient-to-br from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 text-white transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-xl"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Start Enrolling
                <ArrowRight size={20} className="ml-2" weight="bold" />
              </Button>
              <Button
                onClick={handleLearnMore}
                variant="outline"
                className="rounded-full text-sm p-6 border-2 border-blue-900 text-blue-900 hover:bg-blue-50 transition-all duration-300 hover:scale-105 active:scale-95"
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
              {/* Placeholder Image */}
              <div className="relative w-full h-[500px] rounded-xl overflow-hidden shadow-2xl border border-blue-200">
                <img
                  src="https://via.placeholder.com//1e40af/ffffff?text=Marian+College+Student+Portal"
                  alt="Marian College Student Portal"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/20 to-transparent"></div>
              </div>

              {/* Floating Cards */}
              <div className="absolute -top-6 -left-6 bg-white rounded-xl p-4 shadow-xl border border-blue-100 animate-bounce delay-1000">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center">
                    <GraduationCap
                      size={20}
                      className="text-white"
                      weight="fill"
                    />
                  </div>
                  <div>
                    <div
                      className="text-sm font-medium text-blue-900"
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

              <div className="absolute -bottom-6 -right-6 bg-white rounded-xl p-4 shadow-xl border border-blue-100 animate-bounce delay-2000">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center">
                    <BookOpen size={20} className="text-white" weight="fill" />
                  </div>
                  <div>
                    <div
                      className="text-sm font-medium text-blue-900"
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
