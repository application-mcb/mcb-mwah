'use client'

import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import {
  Users,
  GraduationCap,
  BookOpen,
  ChartLineUp,
} from '@phosphor-icons/react'

interface Stat {
  icon: any
  value: number
  suffix?: string
  label: string
  color: string
}

const stats: Stat[] = [
  {
    icon: Users,
    value: 1500,
    suffix: '+',
    label: 'Active Students',
    color: 'from-blue-800 to-blue-900',
  },
  {
    icon: GraduationCap,
    value: 75,
    suffix: '+',
    label: 'Academic Programs',
    color: 'from-blue-800 to-blue-900',
  },
  {
    icon: BookOpen,
    value: 300,
    suffix: '+',
    label: 'Course Subjects',
    color: 'from-blue-800 to-blue-900',
  },
  {
    icon: ChartLineUp,
    value: 98,
    suffix: '%',
    label: 'Satisfaction Rate',
    color: 'from-blue-800 to-blue-900',
  },
]

const useCountUp = (
  target: number,
  duration: number = 2000,
  isVisible: boolean
) => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isVisible) return

    let startTime: number | null = null
    const startValue = 0

    const animate = (currentTime: number) => {
      if (startTime === null) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)

      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const currentCount = Math.floor(
        startValue + (target - startValue) * easeOutQuart
      )

      setCount(currentCount)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setCount(target)
      }
    }

    requestAnimationFrame(animate)
  }, [target, duration, isVisible])

  return count
}

export const StatisticsSection = () => {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

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

  return (
    <section
      id="statistics"
      ref={sectionRef}
      className="py-20 bg-gradient-to-br from-blue-50 to-white relative overflow-hidden"
    >
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-blue-900/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-blue-800/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2
            className="text-4xl lg:text-5xl font-medium text-blue-900 mb-4"
            style={{ fontFamily: 'Poppins', fontWeight: 500 }}
          >
            Our Impact in Numbers
          </h2>
          <p
            className="text-lg text-blue-800/70 max-w-2xl mx-auto font-mono"
            style={{ fontWeight: 300 }}
          >
            See how we're transforming education through innovative technology
            and dedicated service.
          </p>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon
            const count = useCountUp(stat.value, 2000, isVisible)

            return (
              <Card
                key={index}
                className={`group bg-white border border-blue-100 rounded-xl p-8 hover:shadow-xl transition-all duration-500 ${
                  isVisible
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-10'
                }`}
                style={{
                  transitionDelay: `${index * 150}ms`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform =
                    'translateY(-8px) scale(1.05)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)'
                }}
              >
                <div className="text-center space-y-4">
                  {/* Icon */}
                  <div className="flex justify-center">
                    <div
                      className={`w-16 h-16 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center group-hover:rotate-6 transition-transform duration-300`}
                    >
                      <IconComponent
                        size={32}
                        className="text-white"
                        weight="fill"
                      />
                    </div>
                  </div>

                  {/* Value */}
                  <div className="space-y-1">
                    <div
                      className="text-4xl lg:text-5xl font-medium text-blue-900"
                      style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                    >
                      {count.toLocaleString()}
                      {stat.suffix}
                    </div>
                    <div
                      className="text-sm text-blue-800/70"
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      {stat.label}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
