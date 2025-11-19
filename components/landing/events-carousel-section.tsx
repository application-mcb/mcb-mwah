'use client'

import { useState, useEffect, useRef } from 'react'
import { EventData } from '@/lib/types/events'
import { formatDateRangeAsWords } from '@/lib/utils/date-formatter'
import { Calendar } from '@phosphor-icons/react'
import * as PhosphorIcons from '@phosphor-icons/react'

export const EventsCarouselSection = () => {
  const [events, setEvents] = useState<EventData[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [eventsPerSlide, setEventsPerSlide] = useState(3)
  const sectionRef = useRef<HTMLDivElement>(null)
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null)

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

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/events?type=upcoming')
        const data = await response.json()

        if (response.ok && data.success && data.events) {
          setEvents(data.events)
        } else {
          setEvents([])
        }
      } catch (error) {
        console.error('Error fetching events:', error)
        setEvents([])
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  useEffect(() => {
    const updateEventsPerSlide = () => {
      if (window.innerWidth < 768) {
        setEventsPerSlide(1) // Mobile: 1 event per slide
      } else if (window.innerWidth < 1024) {
        setEventsPerSlide(2) // Tablet: 2 events per slide
      } else {
        setEventsPerSlide(3) // Desktop: 3 events per slide
      }
    }

    updateEventsPerSlide()
    window.addEventListener('resize', updateEventsPerSlide)

    return () => window.removeEventListener('resize', updateEventsPerSlide)
  }, [])

  useEffect(() => {
    if (events.length === 0 || !isVisible) return

    autoScrollRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        const maxIndex = Math.ceil(events.length / eventsPerSlide) - 1
        return prev >= maxIndex ? 0 : prev + 1
      })
    }, 5000)

    return () => {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current)
      }
    }
  }, [events.length, isVisible, eventsPerSlide])

  const getIconComponent = (iconName: string) => {
    const IconComponent =
      (PhosphorIcons as any)[iconName] || PhosphorIcons.Calendar
    return IconComponent
  }

  const getGradientClass = (color: string) => {
    const gradientMap: Record<string, string> = {
      'blue-900': 'from-blue-900 to-blue-800',
      'blue-800': 'from-blue-800 to-blue-700',
      'red-800': 'from-red-800 to-red-700',
      'emerald-800': 'from-emerald-800 to-emerald-700',
      'yellow-800': 'from-yellow-800 to-yellow-700',
      'orange-800': 'from-orange-800 to-orange-700',
      'violet-800': 'from-violet-800 to-violet-700',
      'purple-800': 'from-purple-800 to-purple-700',
    }
    return gradientMap[color] || 'from-blue-900 to-blue-800'
  }

  const getIconColorClass = (color: string) => {
    const iconColorMap: Record<string, string> = {
      'blue-900': 'text-blue-900',
      'blue-800': 'text-blue-800',
      'red-800': 'text-red-800',
      'emerald-800': 'text-emerald-800',
      'yellow-800': 'text-yellow-800',
      'orange-800': 'text-orange-800',
      'violet-800': 'text-violet-800',
      'purple-800': 'text-purple-800',
    }
    return iconColorMap[color] || 'text-blue-900'
  }

  return (
    <section
      id="events"
      ref={sectionRef}
      className="py-20 bg-gradient-to-br from-blue-50 to-white relative overflow-hidden"
    >
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-blue-900/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-blue-800/5 rounded-full blur-3xl"></div>
      </div>
      <div className="texture-overlay" aria-hidden="true"></div>

      <div className="relative p-6 sm:p-10 z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-medium text-blue-900 mb-4"
            style={{ fontFamily: 'Poppins', fontWeight: 500 }}
          >
            Upcoming Events & Announcements
          </h2>
          <p
            className="text-base sm:text-lg text-blue-800/70 max-w-2xl mx-auto font-mono"
            style={{ fontWeight: 300 }}
          >
            Stay informed about important dates, activities, and announcements
            from our school.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-900/30 border-t-blue-900"></div>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-800 to-blue-900 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Calendar size={40} className="text-white" weight="duotone" />
            </div>
            <p
              className="text-gray-600 text-lg"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              No upcoming events at the moment
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Carousel Container */}
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{
                  transform: `translateX(-${currentIndex * 100}%)`,
                }}
              >
                {Array.from({
                  length: Math.ceil(events.length / eventsPerSlide),
                }).map((_, groupIndex) => (
                  <div
                    key={groupIndex}
                    className="w-full flex-shrink-0 px-2"
                    style={{
                      opacity: isVisible ? 1 : 0,
                      transform: isVisible
                        ? 'translateY(0)'
                        : 'translateY(20px)',
                      transition: `opacity 0.6s ease-out ${
                        groupIndex * 0.1
                      }s, transform 0.6s ease-out ${groupIndex * 0.1}s`,
                    }}
                  >
                    <div
                      className={`grid gap-6 ${
                        eventsPerSlide === 1
                          ? 'grid-cols-1'
                          : eventsPerSlide === 2
                          ? 'grid-cols-1 sm:grid-cols-2'
                          : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                      }`}
                    >
                      {events
                        .slice(
                          groupIndex * eventsPerSlide,
                          (groupIndex + 1) * eventsPerSlide
                        )
                        .map((event, eventIndex) => {
                          const IconComponent = getIconComponent(event.icon)
                          const gradientClass = getGradientClass(event.color)
                          const iconColorClass = getIconColorClass(event.color)

                          return (
                            <div
                              key={event.id}
                              className={`bg-gradient-to-br ${gradientClass} rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group`}
                              style={{
                                animationDelay: `${eventIndex * 100}ms`,
                              }}
                            >
                              <div className="flex items-start gap-4">
                                <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300">
                                  <IconComponent
                                    size={32}
                                    className={iconColorClass}
                                    weight="fill"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3
                                    className="text-lg font-medium text-white mb-2 line-clamp-2"
                                    style={{
                                      fontFamily: 'Poppins',
                                      fontWeight: 500,
                                    }}
                                  >
                                    {event.title}
                                  </h3>
                                  <p
                                    className="text-sm text-white/90 mb-3 line-clamp-3"
                                    style={{
                                      fontFamily: 'Poppins',
                                      fontWeight: 300,
                                    }}
                                  >
                                    {event.description}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs text-white/80">
                                    <Calendar size={14} weight="duotone" />
                                    <span
                                      style={{
                                        fontFamily: 'Poppins',
                                        fontWeight: 300,
                                      }}
                                    >
                                      {formatDateRangeAsWords(
                                        event.startDate,
                                        event.endDate
                                      )}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
