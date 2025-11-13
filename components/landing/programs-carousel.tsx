'use client'

import { useEffect, useRef, useState } from 'react'
// @ts-ignore - Splide types issue with package.json exports
import { Splide, SplideSlide } from '@splidejs/react-splide'
import '@splidejs/react-splide/css'
import { Card } from '@/components/ui/card'
import { CourseData } from '@/lib/types/course'
import { GradeData } from '@/lib/types/grade-section'
import { GraduationCap } from '@phosphor-icons/react'

// Helper function to get actual color value from course/grade color
const getColorValue = (color: string): string => {
  const colorMap: Record<string, string> = {
    'blue-900': '#1e40af',
    'blue-800': '#1e3a8a',
    'blue-700': '#1d4ed8',
    'red-800': '#991b1b',
    'red-700': '#b91c1c',
    'emerald-800': '#065f46',
    'emerald-700': '#047857',
    'yellow-800': '#92400e',
    'yellow-700': '#a16207',
    'orange-800': '#9a3412',
    'orange-700': '#c2410c',
    'violet-800': '#5b21b6',
    'violet-700': '#7c3aed',
    'purple-800': '#6b21a8',
    'purple-700': '#8b5cf6',
  }
  return colorMap[color] || '#1e40af'
}

// Get gradient classes for card backgrounds
const getGradientClasses = (color: string): string => {
  const gradientMap: { [key: string]: string } = {
    'blue-900': 'bg-gradient-to-br from-blue-800 to-blue-900',
    'blue-800': 'bg-gradient-to-br from-blue-700 to-blue-800',
    'blue-700': 'bg-gradient-to-br from-blue-600 to-blue-700',
    'red-800': 'bg-gradient-to-br from-red-700 to-red-800',
    'red-700': 'bg-gradient-to-br from-red-600 to-red-700',
    'emerald-800': 'bg-gradient-to-br from-emerald-700 to-emerald-800',
    'emerald-700': 'bg-gradient-to-br from-emerald-600 to-emerald-700',
    'yellow-800': 'bg-gradient-to-br from-yellow-700 to-yellow-800',
    'yellow-700': 'bg-gradient-to-br from-yellow-600 to-yellow-700',
    'orange-800': 'bg-gradient-to-br from-orange-700 to-orange-800',
    'orange-700': 'bg-gradient-to-br from-orange-600 to-orange-700',
    'violet-800': 'bg-gradient-to-br from-violet-700 to-violet-800',
    'violet-700': 'bg-gradient-to-br from-violet-600 to-violet-700',
    'purple-800': 'bg-gradient-to-br from-purple-700 to-purple-800',
    'purple-700': 'bg-gradient-to-br from-purple-600 to-purple-700',
  }
  return gradientMap[color] || 'bg-gradient-to-br from-blue-800 to-blue-900'
}

// Get shadow color for cards (returns hex color)
const getShadowColor = (color: string): string => {
  const shadowMap: { [key: string]: string } = {
    'blue-900': '#3b82f6',
    'blue-800': '#3b82f6',
    'blue-700': '#3b82f6',
    'red-800': '#ef4444',
    'red-700': '#ef4444',
    'emerald-800': '#10b981',
    'emerald-700': '#10b981',
    'yellow-800': '#eab308',
    'yellow-700': '#eab308',
    'orange-800': '#f97316',
    'orange-700': '#f97316',
    'violet-800': '#8b5cf6',
    'violet-700': '#8b5cf6',
    'purple-800': '#a855f7',
    'purple-700': '#a855f7',
  }
  return shadowMap[color] || '#3b82f6'
}

type ProgramLevel = 'JHS' | 'SHS' | 'College' | 'All'

// Unified program type
type Program = 
  | { type: 'course'; data: CourseData }
  | { type: 'grade'; data: GradeData }

export const ProgramsCarousel = () => {
  const [courses, setCourses] = useState<CourseData[]>([])
  const [grades, setGrades] = useState<GradeData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLevel, setSelectedLevel] = useState<ProgramLevel>('All')
  const splideRef = useRef<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch both courses and grades
        const [coursesResponse, gradesResponse] = await Promise.all([
          fetch('/api/courses'),
          fetch('/api/grades'),
        ])

        if (coursesResponse.ok) {
          const coursesData = await coursesResponse.json()
          setCourses(coursesData.courses || [])
        }

        if (gradesResponse.ok) {
          const gradesData = await gradesResponse.json()
          setGrades(gradesData.grades || [])
        }
      } catch (error) {
        console.error('Failed to fetch programs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    if (splideRef.current) {
      splideRef.current.splide?.go(0)
    }
  }, [courses, grades, selectedLevel])

  // Combine and filter programs by selected level
  const filteredPrograms: Program[] = (() => {
    const allPrograms: Program[] = [
      ...courses.map((course) => ({ type: 'course' as const, data: course })),
      ...grades.map((grade) => ({ type: 'grade' as const, data: grade })),
    ]

    if (selectedLevel === 'All') return allPrograms

    return allPrograms.filter((program) => {
      if (program.type === 'course') {
        return selectedLevel === 'College'
      } else {
        // program.type === 'grade'
        return program.data.department === selectedLevel
      }
    })
  })()

  if (loading) {
    return (
      <section
        id="programs"
        className="py-20 bg-white relative overflow-hidden"
      >
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2
              className="text-4xl lg:text-5xl font-medium text-blue-900 mb-4"
              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
            >
              Available Programs
            </h2>
            <p
              className="text-lg text-blue-800/70 max-w-2xl mx-auto font-mono"
              style={{ fontWeight: 300 }}
            >
              Discover our comprehensive range of academic programs designed to
              shape your future.
            </p>
          </div>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
          </div>
        </div>
      </section>
    )
  }

  if (courses.length === 0 && grades.length === 0) {
    return (
      <section
        id="programs"
        className="py-20 bg-white relative overflow-hidden"
      >
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2
              className="text-4xl lg:text-5xl font-medium text-blue-900 mb-4"
              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
            >
              Available Programs
            </h2>
            <p
              className="text-lg text-blue-800/70 max-w-2xl mx-auto font-mono"
              style={{ fontWeight: 300 }}
            >
              Discover our comprehensive range of academic programs designed to
              shape your future.
            </p>
          </div>
          <Card className="p-12 text-center bg-white border border-gray-200 rounded-xl">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-800 to-blue-900 rounded-xl flex items-center justify-center mx-auto mb-4">
              <GraduationCap size={32} className="text-white" weight="fill" />
            </div>
            <p
              className="text-blue-800/70 font-mono"
              style={{ fontWeight: 300 }}
            >
              No programs available at the moment.
            </p>
          </Card>
        </div>
      </section>
    )
  }

  return (
    <section
      id="programs"
      className="py-20 bg-white relative overflow-hidden"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-900 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-800 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-8">
          <h2
            className="text-4xl lg:text-5xl font-medium text-blue-900 mb-4"
            style={{ fontFamily: 'Poppins', fontWeight: 500 }}
          >
            Available Programs
          </h2>
          <p
            className="text-lg text-blue-800/70 max-w-2xl mx-auto font-mono mb-8"
            style={{ fontWeight: 300 }}
          >
            Discover our comprehensive range of academic programs designed to
            shape your future.
          </p>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
            <button
              onClick={() => setSelectedLevel('All')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                selectedLevel === 'All'
                  ? 'bg-gradient-to-br from-blue-800 to-blue-900 text-white shadow-lg'
                  : 'bg-white text-blue-900 border-2 border-blue-900 hover:bg-blue-50'
              }`}
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              All Programs
            </button>
            <button
              onClick={() => setSelectedLevel('JHS')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                selectedLevel === 'JHS'
                  ? 'bg-gradient-to-br from-blue-800 to-blue-900 text-white shadow-lg'
                  : 'bg-white text-blue-900 border-2 border-blue-900 hover:bg-blue-50'
              }`}
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Junior High School
            </button>
            <button
              onClick={() => setSelectedLevel('SHS')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                selectedLevel === 'SHS'
                  ? 'bg-gradient-to-br from-blue-800 to-blue-900 text-white shadow-lg'
                  : 'bg-white text-blue-900 border-2 border-blue-900 hover:bg-blue-50'
              }`}
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Senior High School
            </button>
            <button
              onClick={() => setSelectedLevel('College')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                selectedLevel === 'College'
                  ? 'bg-gradient-to-br from-blue-800 to-blue-900 text-white shadow-lg'
                  : 'bg-white text-blue-900 border-2 border-blue-900 hover:bg-blue-50'
              }`}
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              College Level
            </button>
          </div>
        </div>

        {/* Carousel */}
        <div className="relative">
          <Splide
            ref={splideRef}
            options={{
              type: 'loop',
              perPage: 3,
              perMove: 1,
              gap: '2rem',
              autoplay: true,
              interval: 4000,
              pauseOnHover: true,
              pauseOnFocus: true,
              arrows: true,
              pagination: true,
              breakpoints: {
                1024: {
                  perPage: 2,
                },
                640: {
                  perPage: 1,
                },
              },
            }}
            className="programs-carousel"
          >
            {filteredPrograms.length === 0 ? (
              <SplideSlide>
                <Card className="h-full p-12 text-center bg-white border border-gray-200 rounded-xl">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-800 to-blue-900 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <GraduationCap size={32} className="text-white" weight="fill" />
                  </div>
                  <p
                    className="text-blue-800/70 font-mono"
                    style={{ fontWeight: 300 }}
                  >
                    No programs available for this level.
                  </p>
                </Card>
              </SplideSlide>
            ) : (
              filteredPrograms.map((program, index) => {
              const shadowColor = getShadowColor(program.data.color)
              const formatGradeLevel = (grade: GradeData): string => {
                if (grade.strand && (grade.gradeLevel === 11 || grade.gradeLevel === 12)) {
                  return `G${grade.gradeLevel} ${grade.strand}`
                }
                if (grade.gradeLevel >= 7 && grade.gradeLevel <= 12) {
                  return `G${grade.gradeLevel}`
                }
                return `Grade ${grade.gradeLevel}`
              }

              return (
                <SplideSlide key={program.type === 'course' ? program.data.code : program.data.id}>
                  <Card
                    className={`h-full p-6 border-none text-white transform hover:scale-105 transition-all duration-300 rounded-xl ${getGradientClasses(
                      program.data.color
                    )}`}
                    style={{
                      boxShadow: `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), 0 0 0 1px ${shadowColor}40`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = `0 25px 50px -12px ${shadowColor}80, 0 0 0 1px ${shadowColor}40`
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), 0 0 0 1px ${shadowColor}40`
                    }}
                  >
                    <div className="flex flex-col h-full">
                      {/* Icon */}
                      <div className="mb-4">
                        <div className="w-14 h-14 bg-white rounded-lg flex items-center justify-center">
                          <GraduationCap
                            size={28}
                            style={{ color: getColorValue(program.data.color) }}
                            weight="fill"
                          />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <h3
                          className="text-xl font-medium text-white mb-2"
                          style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                        >
                          {program.type === 'course' 
                            ? program.data.code 
                            : formatGradeLevel(program.data)}
                        </h3>
                        <p
                          className="text-sm text-white/90 mb-3 line-clamp-2"
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                        >
                          {program.type === 'course' 
                            ? program.data.name 
                            : `${formatGradeLevel(program.data)} - ${program.data.department === 'JHS' ? 'Junior High School' : 'Senior High School'}`}
                        </p>
                        <p
                          className="text-xs text-white/80 line-clamp-3 leading-relaxed font-mono"
                          style={{ fontWeight: 300 }}
                        >
                          {program.data.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                </SplideSlide>
              )
            })
            )}
          </Splide>
        </div>

        {/* Custom Styles for Splide */}
        <style jsx global>{`
          .programs-carousel .splide__arrow {
            background: linear-gradient(to bottom right, #1e3a8a, #1e40af);
            border: none;
            width: 48px;
            height: 48px;
            border-radius: 0.5rem;
            opacity: 1;
          }
          .programs-carousel .splide__arrow:hover {
            opacity: 0.9;
            transform: scale(1.1);
          }
          .programs-carousel .splide__arrow--prev {
            left: -60px;
          }
          .programs-carousel .splide__arrow--next {
            right: -60px;
          }
          .programs-carousel .splide__pagination {
            bottom: -50px;
          }
          .programs-carousel .splide__pagination__page {
            background: #1e40af;
            opacity: 0.3;
            width: 10px;
            height: 10px;
            border-radius: 50%;
          }
          .programs-carousel .splide__pagination__page.is-active {
            opacity: 1;
            transform: scale(1.2);
          }
          @media (max-width: 1024px) {
            .programs-carousel .splide__arrow--prev {
              left: -20px;
            }
            .programs-carousel .splide__arrow--next {
              right: -20px;
            }
          }
        `}</style>
      </div>
    </section>
  )
}

