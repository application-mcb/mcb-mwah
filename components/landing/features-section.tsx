'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import {
  GraduationCap,
  ChartBar,
  Calendar,
  Sparkle,
  Eye,
} from '@phosphor-icons/react'

interface Feature {
  icon: any
  title: string
  description: string
  image: string
}

const features: Feature[] = [
  {
    icon: Calendar,
    title: 'Calendar of Activities',
    description:
      'Comprehensive calendar system to track and manage all school activities, events, and important dates.',
    image: '/calendar-feature.jpg',
  },
  {
    icon: GraduationCap,
    title: 'Online Enrollment/Re-enrollment',
    description:
      'Streamlined online enrollment and re-enrollment process with comprehensive form management and document tracking.',
    image: '/enrollment-feature.jpg',
  },
  {
    icon: ChartBar,
    title: 'Live Grade Management',
    description:
      'Real-time grade tracking and management system for teachers and administrators with instant updates.',
    image: '/management-feature.jpg',
  },
]

export const FeaturesSection = () => {
  const [visibleFeatures, setVisibleFeatures] = useState<Set<number>>(new Set())
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [glitterElements, setGlitterElements] = useState<
    Array<{ id: number; style: React.CSSProperties }>
  >([])
  const [sparkleElements, setSparkleElements] = useState<
    Array<{ id: number; style: React.CSSProperties }>
  >([])
  const sectionRef = useRef<HTMLDivElement>(null)

  const handleCardClick = (feature: Feature) => {
    setSelectedFeature(feature)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setTimeout(() => setSelectedFeature(null), 300)
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(
              entry.target.getAttribute('data-index') || '0'
            )
            setVisibleFeatures((prev) => new Set([...prev, index]))
          }
        })
      },
      { threshold: 0.1 }
    )

    const featureElements = sectionRef.current?.querySelectorAll('[data-index]')
    featureElements?.forEach((el) => observer.observe(el))

    return () => {
      featureElements?.forEach((el) => observer.unobserve(el))
    }
  }, [])

  // Generate animation elements only on client side to avoid hydration mismatch
  useEffect(() => {
    const glitter = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      style: {
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 3}s`,
        animationDuration: `${2 + Math.random() * 2}s`,
        opacity: 0.1 + Math.random() * 0.3,
        animation: `float-${i % 4} ${
          8 + Math.random() * 4
        }s ease-in-out infinite`,
        transform: `translate(${Math.random() * 20 - 10}px, ${
          Math.random() * 20 - 10
        }px)`,
      },
    }))

    const sparkles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      style: {
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 4}s`,
        animationDuration: `${3 + Math.random() * 2}s`,
        animation: `float-sparkle-${i % 3} ${
          10 + Math.random() * 5
        }s ease-in-out infinite`,
        transform: `translate(${Math.random() * 30 - 15}px, ${
          Math.random() * 30 - 15
        }px)`,
      },
    }))

    setGlitterElements(glitter)
    setSparkleElements(sparkles)
  }, [])

  return (
    <section
      id="features"
      ref={sectionRef}
      className="py-20 bg-white relative overflow-hidden"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-900 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-800 rounded-full blur-3xl"></div>
      </div>

      {/* Glitter Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {glitterElements.map((element) => (
          <div
            key={element.id}
            className="absolute w-1 h-1 bg-blue-400 rounded-full animate-pulse"
            style={element.style}
          />
        ))}
        {sparkleElements.map((element) => (
          <div
            key={`sparkle-${element.id}`}
            className="absolute w-2 h-2"
            style={element.style}
          >
            <div className="w-full h-full bg-blue-300 rounded-full animate-ping opacity-20"></div>
            <div className="absolute inset-0 bg-blue-500 rounded-full animate-pulse opacity-10"></div>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes float-0 {
          0%,
          100% {
            transform: translate(0px, 0px) scale(1);
          }
          25% {
            transform: translate(5px, -3px) scale(1.1);
          }
          50% {
            transform: translate(-2px, 5px) scale(0.9);
          }
          75% {
            transform: translate(3px, 2px) scale(1.05);
          }
        }
        @keyframes float-1 {
          0%,
          100% {
            transform: translate(0px, 0px) scale(1);
          }
          25% {
            transform: translate(-4px, 4px) scale(1.1);
          }
          50% {
            transform: translate(6px, -2px) scale(0.9);
          }
          75% {
            transform: translate(-3px, -4px) scale(1.05);
          }
        }
        @keyframes float-2 {
          0%,
          100% {
            transform: translate(0px, 0px) scale(1);
          }
          25% {
            transform: translate(2px, 6px) scale(1.1);
          }
          50% {
            transform: translate(-5px, -3px) scale(0.9);
          }
          75% {
            transform: translate(4px, 3px) scale(1.05);
          }
        }
        @keyframes float-3 {
          0%,
          100% {
            transform: translate(0px, 0px) scale(1);
          }
          25% {
            transform: translate(-3px, -5px) scale(1.1);
          }
          50% {
            transform: translate(4px, 4px) scale(0.9);
          }
          75% {
            transform: translate(-2px, 3px) scale(1.05);
          }
        }
        @keyframes float-sparkle-0 {
          0%,
          100% {
            transform: translate(0px, 0px) rotate(0deg) scale(1);
          }
          25% {
            transform: translate(8px, -6px) rotate(90deg) scale(1.2);
          }
          50% {
            transform: translate(-6px, 8px) rotate(180deg) scale(0.8);
          }
          75% {
            transform: translate(4px, 4px) rotate(270deg) scale(1.1);
          }
        }
        @keyframes float-sparkle-1 {
          0%,
          100% {
            transform: translate(0px, 0px) rotate(0deg) scale(1);
          }
          25% {
            transform: translate(-7px, 7px) rotate(120deg) scale(1.2);
          }
          50% {
            transform: translate(9px, -4px) rotate(240deg) scale(0.8);
          }
          75% {
            transform: translate(-5px, -6px) rotate(360deg) scale(1.1);
          }
        }
        @keyframes float-sparkle-2 {
          0%,
          100% {
            transform: translate(0px, 0px) rotate(0deg) scale(1);
          }
          25% {
            transform: translate(6px, 9px) rotate(60deg) scale(1.2);
          }
          50% {
            transform: translate(-8px, -5px) rotate(300deg) scale(0.8);
          }
          75% {
            transform: translate(7px, 2px) rotate(180deg) scale(1.1);
          }
        }
      `}</style>
      <div className="texture-overlay" aria-hidden="true"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16 space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg bg-blue-900/10 border border-blue-900/20">
            <Sparkle size={16} className="text-blue-900" weight="fill" />
            <span
              className="text-xs sm:text-sm text-blue-900"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Features
            </span>
          </div>
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-medium text-blue-900"
            style={{ fontFamily: 'Poppins', fontWeight: 500 }}
          >
            Everything You Need to Succeed
          </h2>
          <p
            className="text-base sm:text-lg text-blue-800/70 max-w-2xl mx-auto font-mono"
            style={{ fontWeight: 300 }}
          >
            Discover powerful features designed to enhance your academic
            experience and streamline administrative processes.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon
            const isVisible = visibleFeatures.has(index)

            return (
              <Card
                key={index}
                data-index={index}
                className={`group relative p-0 bg-white border border-blue-100 rounded-xl hover:shadow-xl transition-all duration-300 overflow-hidden ${
                  isVisible
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-10'
                }`}
                style={{
                  transitionDelay: `${index * 100}ms`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform =
                    'translateY(-4px) scale(1.01)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)'
                }}
              >
                {/* Picture */}
                <div className="relative w-full h-48 rounded-t-xl overflow-hidden bg-gradient-to-br from-blue-800 to-blue-900">
                  <Image
                    src={feature.image}
                    alt={feature.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    priority={index === 0}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-900/50 to-transparent pointer-events-none"></div>
                </div>

                {/* Title */}
                <div className="p-6">
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center flex-shrink-0">
                      <IconComponent
                        size={20}
                        className="text-white"
                        weight="fill"
                      />
                    </div>
                    <h3
                      className="text-lg font-medium text-blue-900"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      {feature.title}
                    </h3>
                  </div>
                </div>

                {/* Buttons on hover - Fades in */}
                <div className="absolute inset-0 flex items-center justify-center bg-blue-900/90 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="flex flex-col gap-3">
                    <Button
                      onClick={() => handleCardClick(feature)}
                      className="rounded-full bg-white text-blue-900 hover:bg-blue-50 px-6 py-3"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      <Eye size={20} className="mr-2" weight="fill" />
                      View Details
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Feature Details Modal */}
      {selectedFeature && (
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={selectedFeature.title}
          size="lg"
        >
          <div className="p-6">
            {/* Image */}
            <div className="relative w-full h-64 rounded-lg overflow-hidden mb-6 bg-gradient-to-br from-blue-800 to-blue-900">
              <Image
                src={selectedFeature.image}
                alt={selectedFeature.title}
                fill
                sizes="(max-width: 1024px) 100vw, 800px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-blue-900/50 to-transparent pointer-events-none"></div>
            </div>

            {/* Icon */}
            <div className="mb-4 flex justify-center">
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center">
                {(() => {
                  const IconComponent = selectedFeature.icon
                  return (
                    <IconComponent
                      size={32}
                      className="text-white"
                      weight="fill"
                    />
                  )
                })()}
              </div>
            </div>

            {/* Description */}
            <p
              className="text-blue-800/80 leading-relaxed font-mono text-center"
              style={{ fontWeight: 300 }}
            >
              {selectedFeature.description}
            </p>
          </div>
        </Modal>
      )}
    </section>
  )
}
