'use client'

import { useEffect } from 'react'
import { NavigationBar } from '@/components/landing/navigation-bar'
import { HeroSection } from '@/components/landing/hero-section'
import { FeaturesSection } from '@/components/landing/features-section'
import { EventsCarouselSection } from '@/components/landing/events-carousel-section'
import { LandingEventsCalendar } from '@/components/landing/landing-events-calendar'
import { ProgramsCarousel } from '@/components/landing/programs-carousel'
import { CTASection } from '@/components/landing/cta-section'
import { SCHOOL_NAME_FORMAL } from '@/lib/constants'

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
        <div className="py-8 sm:py-12 lg:py-16"></div>
        <FeaturesSection />
        <div className="py-8 sm:py-12 lg:py-16"></div>
        <EventsCarouselSection />
        <div className="py-8 sm:py-12 lg:py-16"></div>
        <LandingEventsCalendar />
        <div className="py-8 sm:py-12 lg:py-16"></div>
        <ProgramsCarousel />
        <div className="py-8 sm:py-12 lg:py-16"></div>
        <CTASection />
      </main>

      {/* Location Map Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2
              className="text-3xl sm:text-4xl lg:text-5xl font-medium text-blue-900 mb-4"
              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
            >
              Find Us
            </h2>
            <p
              className="text-base sm:text-lg text-blue-800/70 max-w-2xl mx-auto font-mono"
              style={{ fontWeight: 300 }}
            >
              Visit our campus at Marian College of Baliuag
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="aspect-video rounded-xl overflow-hidden shadow-xl border border-blue-100">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3854.7027270084086!2d120.89759881107105!3d14.953646385515441!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33965554b5817897%3A0xeaebb1293e6e37a3!2sMarian%20College!5e0!3m2!1sen!2sph!4v1763564670321!5m2!1sen!2sph"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Marian College Location"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-blue-800 to-blue-900 text-white py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div>
              <h3
                className="text-base sm:text-lg font-medium mb-4"
                style={{ fontFamily: 'Poppins', fontWeight: 500 }}
              >
                {SCHOOL_NAME_FORMAL}
              </h3>
              <p
                className="text-white/80 text-xs sm:text-sm leading-relaxed font-mono"
                style={{ fontWeight: 300 }}
              >
                Empowering education through innovative technology and dedicated
                service to our students and community.
              </p>
            </div>
            <div>
              <h3
                className="text-base sm:text-lg font-medium mb-4"
                style={{ fontFamily: 'Poppins', fontWeight: 500 }}
              >
                Quick Links
              </h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#hero"
                    className="text-white/80 hover:text-white text-xs sm:text-sm transition-colors"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    Home
                  </a>
                </li>
                <li>
                  <a
                    href="#features"
                    className="text-white/80 hover:text-white text-xs sm:text-sm transition-colors"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#events"
                    className="text-white/80 hover:text-white text-xs sm:text-sm transition-colors"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    Events
                  </a>
                </li>
                <li>
                  <a
                    href="#programs"
                    className="text-white/80 hover:text-white text-xs sm:text-sm transition-colors"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    Programs
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3
                className="text-base sm:text-lg font-medium mb-4"
                style={{ fontFamily: 'Poppins', fontWeight: 500 }}
              >
                Contact
              </h3>
              <p
                className="text-white/80 text-xs sm:text-sm leading-relaxed font-mono"
                style={{ fontWeight: 300 }}
              >
                For inquiries and support, please contact the registrar's office
                or visit our campus.
              </p>
            </div>
          </div>
          <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-white/20 text-center">
            <p
              className="text-white/60 text-xs sm:text-sm"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              © {new Date().getFullYear()} {SCHOOL_NAME_FORMAL} All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
