'use client'

import { useEffect } from 'react'
import { NavigationBar } from '@/components/landing/navigation-bar'
import { HeroSection } from '@/components/landing/hero-section'
import { FeaturesSection } from '@/components/landing/features-section'
import { StatisticsSection } from '@/components/landing/statistics-section'
import { ProgramsCarousel } from '@/components/landing/programs-carousel'
import { CTASection } from '@/components/landing/cta-section'

export default function LandingPage() {
  useEffect(() => {
    // Smooth scroll behavior
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
        <FeaturesSection />
        <StatisticsSection />
        <ProgramsCarousel />
        <CTASection />
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-blue-800 to-blue-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3
                className="text-lg font-medium mb-4"
                style={{ fontFamily: 'Poppins', fontWeight: 500 }}
              >
                Marian College of Baliuag, Inc.
              </h3>
              <p
                className="text-white/80 text-sm leading-relaxed font-mono"
                style={{ fontWeight: 300 }}
              >
                Empowering education through innovative technology and dedicated
                service to our students and community.
              </p>
            </div>
            <div>
              <h3
                className="text-lg font-medium mb-4"
                style={{ fontFamily: 'Poppins', fontWeight: 500 }}
              >
                Quick Links
              </h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#features"
                    className="text-white/80 hover:text-white text-sm transition-colors"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#statistics"
                    className="text-white/80 hover:text-white text-sm transition-colors"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    Statistics
                  </a>
                </li>
                <li>
                  <a
                    href="#programs"
                    className="text-white/80 hover:text-white text-sm transition-colors"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    Programs
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3
                className="text-lg font-medium mb-4"
                style={{ fontFamily: 'Poppins', fontWeight: 500 }}
              >
                Contact
              </h3>
              <p
                className="text-white/80 text-sm leading-relaxed font-mono"
                style={{ fontWeight: 300 }}
              >
                For inquiries and support, please contact the registrar's office
                or visit our campus.
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/20 text-center">
            <p
              className="text-white/60 text-sm"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              © {new Date().getFullYear()} Marian College of Baliuag, Inc. All
              rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
