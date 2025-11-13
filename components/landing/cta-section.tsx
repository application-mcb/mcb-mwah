'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkle } from '@phosphor-icons/react'
import { useRouter } from 'next/navigation'

export const CTASection = () => {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
          }
        })
      },
      { threshold: 0.3 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current)
      }
    }
  }, [])

  const handleGetStarted = () => {
    router.push('/login')
  }

  return (
    <section
      ref={sectionRef}
      className="py-20 bg-gradient-to-br from-blue-800 to-blue-900 relative overflow-hidden"
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/3 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div
          className={`space-y-8 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30">
            <Sparkle size={16} className="text-white" weight="fill" />
            <span
              className="text-sm text-white"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Ready to Get Started?
            </span>
          </div>

          {/* Heading */}
          <h2
            className="text-4xl lg:text-5xl font-medium text-white leading-tight"
            style={{ fontFamily: 'Poppins', fontWeight: 500 }}
          >
            Transform Your Academic Experience Today
          </h2>

          {/* Description */}
          <p
            className="text-xl text-white/90 max-w-2xl mx-auto leading-relaxed font-mono"
            style={{ fontWeight: 300 }}
          >
            Join thousands of students, teachers, and administrators who are
            already using our platform to streamline their academic journey.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Button
              onClick={handleGetStarted}
              className="rounded-lg bg-white text-blue-900 hover:bg-blue-50 px-8 py-6 text-lg transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-xl"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Get Started Now
              <ArrowRight size={20} className="ml-2" weight="bold" />
            </Button>
            <Button
              onClick={() => {
                const element = document.getElementById('features')
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
              }}
              variant="outline"
              className="rounded-lg border-2 border-white text-white hover:bg-white/10 px-8 py-6 text-lg transition-all duration-300 hover:scale-105 active:scale-95"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Learn More
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="pt-12 flex flex-wrap items-center justify-center gap-8 text-white/80">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-white"></div>
              <span
                className="text-sm"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                Secure & Reliable
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-white"></div>
              <span
                className="text-sm"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                24/7 Support
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-white"></div>
              <span
                className="text-sm"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                Free to Use
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
