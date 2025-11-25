'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CourseData } from '@/lib/types/course'
import CourseMasterList from '@/components/course-master-list'
import {
  Pencil,
  Trash,
  BookOpen,
  Plus,
  GraduationCap,
  Eye,
  Table,
  SquaresFour,
  Gear,
  Users,
  FunnelSimple,
  X,
} from '@phosphor-icons/react'

interface CourseListProps {
  courses: CourseData[]
  onEditCourse: (course: CourseData) => void
  onDeleteCourse: (course: CourseData) => void
  onViewCourse: (course: CourseData) => void
  onCreateNew: () => void
  loading?: boolean
  searchQuery?: string
  onSearchChange?: (query: string) => void
  totalCoursesCount?: number
  selectedColors?: string[]
  onColorToggle?: (color: string) => void
}

interface CourseEnrollmentRecord {
  userId: string
  personalInfo?: {
    firstName?: string
    middleName?: string
    lastName?: string
    nameExtension?: string
    studentId?: string
  }
  enrollmentInfo?: {
    level?: string
    courseCode?: string
    yearLevel?: string | number
    schoolYear?: string
  }
}

interface CourseStudentEntry {
  key: string
  id: string
  name: string
  yearLevel: string
}

// Helper function to get actual color value from course color
const getColorValue = (color: string): string => {
  const colorMap: Record<string, string> = {
    'blue-900': '#1e40af',
    'red-800': '#991b1b',
    'emerald-800': '#065f46',
    'yellow-800': '#92400e',
    'orange-800': '#9a3412',
    'violet-800': '#5b21b6',
    'purple-800': '#6b21a8',
  }
  return colorMap[color] || '#1e40af' // Default to blue if color not found
}

// Get gradient classes for card backgrounds
const getGradientClasses = (color: string): string => {
  const gradientMap: { [key: string]: string } = {
    'blue-900': 'bg-gradient-to-br from-blue-800 to-blue-900',
    'red-800': 'bg-gradient-to-br from-red-700 to-red-800',
    'emerald-800': 'bg-gradient-to-br from-emerald-700 to-emerald-800',
    'yellow-800': 'bg-gradient-to-br from-yellow-700 to-yellow-800',
    'orange-800': 'bg-gradient-to-br from-orange-700 to-orange-800',
    'violet-800': 'bg-gradient-to-br from-violet-700 to-violet-800',
    'purple-800': 'bg-gradient-to-br from-purple-700 to-purple-800',
  }
  return gradientMap[color] || 'bg-gradient-to-br from-blue-800 to-blue-900' // default to blue gradient
}

// Get shadow color for cards (returns hex color)
const getShadowColor = (color: string): string => {
  const shadowMap: { [key: string]: string } = {
    'blue-900': '#3b82f6', // blue-500
    'red-800': '#ef4444', // red-500
    'emerald-800': '#10b981', // emerald-500
    'yellow-800': '#eab308', // yellow-500
    'orange-800': '#f97316', // orange-500
    'violet-800': '#8b5cf6', // violet-500
    'purple-800': '#a855f7', // purple-500
  }
  return shadowMap[color] || '#3b82f6' // default to blue-500
}

const formatStudentName = (personalInfo?: {
  firstName?: string
  middleName?: string
  lastName?: string
  nameExtension?: string
}) => {
  if (!personalInfo) {
    return 'N/A'
  }
  const { firstName, middleName, lastName, nameExtension } = personalInfo
  const parts = [
    firstName,
    middleName ? `${middleName.charAt(0).toUpperCase()}.` : undefined,
    lastName,
    nameExtension,
  ].filter((part) => part && part.trim() !== '')
  return parts.length > 0 ? parts.join(' ') : 'N/A'
}

const formatYearLevelLabel = (yearLevel?: string | number) => {
  if (yearLevel === undefined || yearLevel === null || yearLevel === '') {
    return 'N/A'
  }
  const parsed = Number(yearLevel)
  if (!Number.isNaN(parsed)) {
    const ordinalMap: Record<number, string> = {
      1: '1st Year',
      2: '2nd Year',
      3: '3rd Year',
      4: '4th Year',
      5: '5th Year',
      6: '6th Year',
    }
    return ordinalMap[parsed] || `${parsed}th Year`
  }
  const lower = typeof yearLevel === 'string' ? yearLevel.toLowerCase() : ''
  if (lower.includes('1')) return '1st Year'
  if (lower.includes('2')) return '2nd Year'
  if (lower.includes('3')) return '3rd Year'
  if (lower.includes('4')) return '4th Year'
  return typeof yearLevel === 'string' ? yearLevel : String(yearLevel)
}

const CourseActionMenu = ({
  course,
  onViewCourse,
  onEditCourse,
  onDeleteCourse,
  onOpenMasterList,
}: {
  course: CourseData
  onViewCourse: (course: CourseData) => void
  onEditCourse: (course: CourseData) => void
  onDeleteCourse: (course: CourseData) => void
  onOpenMasterList: (course: CourseData) => void
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen])

  const handleAction = (action: () => void) => {
    action()
    setIsMenuOpen(false)
  }

  return (
    <div className="relative" ref={menuRef}>
      <Button
        onClick={() => setIsMenuOpen((prev) => !prev)}
        size="sm"
        variant="ghost"
        className="rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
      >
        <Gear size={16} className="text-blue-900" weight="fill" />
      </Button>
      {isMenuOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 shadow-lg rounded-lg z-50">
          <div className="py-1">
            <button
              onClick={() => handleAction(() => onViewCourse(course))}
              className="w-full px-4 py-2 text-left text-xs hover:bg-gray-100 flex items-center gap-2 rounded-lg"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              <Eye size={14} />
              View Details
            </button>
            <button
              onClick={() => handleAction(() => onEditCourse(course))}
              className="w-full px-4 py-2 text-left text-xs hover:bg-gray-100 flex items-center gap-2 rounded-lg"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              <Pencil size={14} />
              Edit Course
            </button>
            <button
              onClick={() => handleAction(() => onOpenMasterList(course))}
              className="w-full px-4 py-2 text-left text-xs hover:bg-gray-100 flex items-center gap-2 rounded-lg"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              <Users size={14} />
              Master List
            </button>
            <button
              onClick={() => handleAction(() => onDeleteCourse(course))}
              className="w-full px-4 py-2 text-left text-xs hover:bg-red-50 flex items-center gap-2 rounded-lg text-red-700"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              <Trash size={14} />
              Delete Course
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CourseList({
  courses,
  onEditCourse,
  onDeleteCourse,
  onViewCourse,
  onCreateNew,
  loading = false,
  searchQuery = '',
  onSearchChange,
  totalCoursesCount,
  selectedColors = [],
  onColorToggle,
}: CourseListProps) {
  const [viewMode, setViewMode] = useState<'card' | 'table'>('table')
  const [courseEnrollments, setCourseEnrollments] = useState<
    CourseEnrollmentRecord[]
  >([])
  const [studentProfiles, setStudentProfiles] = useState<
    Record<string, { studentId?: string }>
  >({})
  const [loadingCourseStudents, setLoadingCourseStudents] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<CourseData | null>(null)
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [studentCountFilter, setStudentCountFilter] = useState<
    'most' | 'least' | null
  >(null)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const fetchStudentProfiles = useCallback(
    async (enrollments: CourseEnrollmentRecord[]) => {
      const userIds = Array.from(
        new Set(
          enrollments
            .map((enrollment) => enrollment.userId)
            .filter((id): id is string => Boolean(id))
        )
      )

      if (userIds.length === 0) {
        setStudentProfiles({})
        return
      }

      const chunkSize = 50
      const profileMap: Record<string, { studentId?: string }> = {}

      for (let i = 0; i < userIds.length; i += chunkSize) {
        const chunk = userIds.slice(i, i + chunkSize)
        try {
          const response = await fetch(
            `/api/user/profile?uids=${chunk.join(',')}`
          )
          const data = await response.json()
          if (response.ok && data.success && data.users) {
            data.users.forEach((user: any) => {
              if (user && user.uid) {
                profileMap[user.uid] = {
                  studentId: user.studentId,
                }
              }
            })
          }
        } catch (error) {
          console.error('[CourseList] Failed to load student profiles:', error)
        }
      }

      setStudentProfiles(profileMap)
    },
    []
  )

  useEffect(() => {
    const loadCourseStudents = async () => {
      try {
        setLoadingCourseStudents(true)
        const response = await fetch('/api/enrollment?getEnrolledStudents=true')
        const data = await response.json()
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to load enrolled students')
        }
        const collegeEnrollments: CourseEnrollmentRecord[] = (
          data.enrollments || []
        ).filter(
          (enrollment: CourseEnrollmentRecord) =>
            enrollment?.enrollmentInfo?.level === 'college' &&
            enrollment?.enrollmentInfo?.courseCode
        )
        setCourseEnrollments(collegeEnrollments)
        await fetchStudentProfiles(collegeEnrollments)
      } catch (error) {
        console.error('[CourseList] Unable to load master list data:', error)
        toast.error('Unable to load course master list data. Please try again.')
      } finally {
        setLoadingCourseStudents(false)
      }
    }

    loadCourseStudents()
  }, [fetchStudentProfiles])

  const courseStudentsMap = useMemo(() => {
    const map: Record<string, CourseStudentEntry[]> = {}
    courseEnrollments.forEach((enrollment) => {
      const courseCode = enrollment.enrollmentInfo?.courseCode
      if (!courseCode || enrollment.enrollmentInfo?.level !== 'college') {
        return
      }
      const studentId =
        studentProfiles[enrollment.userId]?.studentId ||
        enrollment.personalInfo?.studentId ||
        enrollment.userId

      if (!map[courseCode]) {
        map[courseCode] = []
      }

      const studentKey = enrollment.userId
      const alreadyExists = map[courseCode].some(
        (student) => student.key === studentKey
      )
      if (alreadyExists) {
        return
      }

      map[courseCode].push({
        key: studentKey,
        id: studentId || 'N/A',
        name: formatStudentName(enrollment.personalInfo),
        yearLevel: formatYearLevelLabel(enrollment.enrollmentInfo?.yearLevel),
      })
    })
    return map
  }, [courseEnrollments, studentProfiles])

  const courseStudentCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    Object.entries(courseStudentsMap).forEach(([code, students]) => {
      counts[code] = students.length
    })
    return counts
  }, [courseStudentsMap])

  const selectedCourseStudents = useMemo(() => {
    if (!selectedCourse) {
      return []
    }
    return courseStudentsMap[selectedCourse.code] || []
  }, [selectedCourse, courseStudentsMap])

  const latestAcademicYear = useMemo(() => {
    const years = Array.from(
      new Set(
        courseEnrollments
          .map((enrollment) => enrollment.enrollmentInfo?.schoolYear)
          .filter((year): year is string => Boolean(year))
      )
    ).sort()
    return years.length > 0 ? years[years.length - 1] : undefined
  }, [courseEnrollments])

  const handleOpenMasterList = (course: CourseData) => {
    setSelectedCourse(course)
  }

  const handleCloseMasterList = () => {
    setSelectedCourse(null)
  }

  const displayCourses = useMemo(() => {
    const list = [...courses]
    if (!studentCountFilter) {
      return list
    }
    return list.sort((a, b) => {
      const countA = courseStudentCounts[a.code] || 0
      const countB = courseStudentCounts[b.code] || 0
      return studentCountFilter === 'most' ? countB - countA : countA - countB
    })
  }, [courses, studentCountFilter, courseStudentCounts])

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-8 bg-white/20 rounded w-64 animate-pulse"></div>
                <div className="h-4 bg-white/20 rounded w-48 animate-pulse"></div>
              </div>
            </div>
            <div className="h-10 bg-white/20 rounded-lg w-32 animate-pulse"></div>
          </div>
        </div>

        {/* Cards Skeleton */}
        <div className="flex flex-wrap gap-6">
          {[...Array(6)].map((_, i) => (
            <Card
              key={i}
              className="p-6 bg-white border border-gray-200 rounded-xl animate-pulse flex-[1_1_min(100%,_350px)]"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl p-6 min-w-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
              <BookOpen size={24} className="text-blue-900" weight="fill" />
            </div>
            <div>
              <h2
                className="text-2xl font-medium text-white"
                style={{ fontFamily: 'Poppins', fontWeight: 500 }}
              >
                College Course Management
              </h2>
              <p
                className="text-sm text-white/80"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                Manage college courses and programs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-white/20 rounded-lg p-1">
              <button
                onClick={() => setViewMode('card')}
                className={`px-3 py-1.5 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                  viewMode === 'card'
                    ? 'bg-white text-blue-900 shadow-lg'
                    : 'text-white/80 hover:bg-white/10'
                }`}
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                title="Card View"
              >
                <SquaresFour
                  size={16}
                  weight={viewMode === 'card' ? 'fill' : 'regular'}
                />
                <span className="text-xs">Card</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                  viewMode === 'table'
                    ? 'bg-white text-blue-900 shadow-lg'
                    : 'text-white/80 hover:bg-white/10'
                }`}
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                title="Table View"
              >
                <Table
                  size={16}
                  weight={viewMode === 'table' ? 'fill' : 'regular'}
                />
                <span className="text-xs">Table</span>
              </button>
            </div>

            <Button
              onClick={onCreateNew}
              className="bg-white text-blue-900 hover:bg-white/90 rounded-lg"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              <Plus size={20} className="mr-2" />
              Create Course
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      {onSearchChange && (
        <div className="bg-white p-4 border border-gray-200 rounded-xl shadow-lg w-full min-w-0">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="w-full md:max-w-md">
              <input
                type="text"
                placeholder="Search courses by code, name, or description..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 outline-none transition-all duration-300 rounded-lg"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              />
            </div>
            {onColorToggle && (
              <div className="relative flex items-center gap-2 self-start md:self-auto">
                {(selectedColors.length || studentCountFilter) && (
                  <span
                    className="text-xs text-gray-600 px-3 py-1 rounded-full bg-gray-100 border border-gray-200"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    {selectedColors.length + (studentCountFilter ? 1 : 0)}{' '}
                    filter
                    {selectedColors.length + (studentCountFilter ? 1 : 0) > 1
                      ? 's'
                      : ''}{' '}
                    active
                  </span>
                )}
                <button
                  onClick={() => setShowFilterDropdown((prev) => !prev)}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-2 ${
                    selectedColors.length > 0 || studentCountFilter
                      ? 'bg-gradient-to-br from-blue-800 to-blue-900 text-white shadow-md'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-900'
                  }`}
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  <FunnelSimple size={16} weight="bold" />
                  Filter
                </button>
                {showFilterDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowFilterDropdown(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 shadow-2xl rounded-xl z-20 p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3
                          className="text-sm font-medium text-gray-900"
                          style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                        >
                          Filter Courses
                        </h3>
                        <button
                          onClick={() => setShowFilterDropdown(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <div>
                        <p
                          className="text-xs text-gray-600 mb-2"
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                        >
                          Colors
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {[
                            {
                              value: 'blue-900',
                              label: 'Blue',
                              bg: 'bg-blue-900',
                            },
                            {
                              value: 'red-800',
                              label: 'Red',
                              bg: 'bg-red-800',
                            },
                            {
                              value: 'emerald-800',
                              label: 'Emerald',
                              bg: 'bg-emerald-800',
                            },
                            {
                              value: 'yellow-800',
                              label: 'Yellow',
                              bg: 'bg-yellow-800',
                            },
                            {
                              value: 'orange-800',
                              label: 'Orange',
                              bg: 'bg-orange-800',
                            },
                            {
                              value: 'violet-800',
                              label: 'Violet',
                              bg: 'bg-violet-800',
                            },
                            {
                              value: 'purple-800',
                              label: 'Purple',
                              bg: 'bg-purple-800',
                            },
                          ].map((color) => {
                            const isSelected = selectedColors.includes(
                              color.value
                            )
                            return (
                              <button
                                key={color.value}
                                onClick={() => onColorToggle?.(color.value)}
                                className={`flex items-center space-x-2 px-3 py-2 border rounded-lg transition-all duration-200 ${
                                  isSelected
                                    ? 'border-blue-900 bg-white shadow-md'
                                    : 'border-gray-200 hover:border-blue-300 bg-white'
                                }`}
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 300,
                                }}
                              >
                                <div
                                  className={`w-4 h-4 ${color.bg} border border-white rounded`}
                                ></div>
                                <span
                                  className={`text-sm ${
                                    isSelected
                                      ? 'text-blue-900 font-medium'
                                      : 'text-gray-700'
                                  }`}
                                >
                                  {color.label}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                      <div>
                        <p
                          className="text-xs text-gray-600 mb-2"
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                        >
                          Student Count
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { label: 'Most Students', value: 'most' as const },
                            {
                              label: 'Least Students',
                              value: 'least' as const,
                            },
                          ].map((option) => {
                            const isSelected =
                              studentCountFilter === option.value
                            return (
                              <button
                                key={option.value}
                                onClick={() =>
                                  setStudentCountFilter((prev) =>
                                    prev === option.value ? null : option.value
                                  )
                                }
                                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                                  isSelected
                                    ? 'bg-gradient-to-br from-blue-800 to-blue-900 text-white shadow-md'
                                    : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300'
                                }`}
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 400,
                                }}
                              >
                                {option.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => {
                            if (onColorToggle) {
                              selectedColors.forEach((color) =>
                                onColorToggle(color)
                              )
                            }
                            setStudentCountFilter(null)
                            setShowFilterDropdown(false)
                          }}
                          className="text-xs text-gray-600 hover:text-gray-900 underline"
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                        >
                          Clear filters
                        </button>
                        <button
                          onClick={() => setShowFilterDropdown(false)}
                          className="px-4 py-1.5 text-xs bg-blue-900 text-white rounded-lg"
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          {(searchQuery || selectedColors.length > 0 || studentCountFilter) && (
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mt-3 pt-3 border-t border-gray-100 text-xs text-gray-600">
              <span style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                Showing {displayCourses.length} of{' '}
                {totalCoursesCount || displayCourses.length} courses
                {searchQuery && <span> • Search: "{searchQuery}"</span>}
                {selectedColors.length > 0 && (
                  <span>
                    {' '}
                    • Colors:{' '}
                    {selectedColors
                      .map((color) =>
                        color
                          .replace('-800', '')
                          .replace('-900', '')
                          .replace(/^\w/, (c) => c.toUpperCase())
                      )
                      .join(', ')}
                  </span>
                )}
                {studentCountFilter && (
                  <span>
                    {' '}
                    • Student Count:{' '}
                    {studentCountFilter === 'most'
                      ? 'Most Students'
                      : 'Least Students'}
                  </span>
                )}
              </span>
              <div className="flex gap-2">
                {searchQuery && (
                  <button
                    onClick={() => onSearchChange('')}
                    className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-gray-700 hover:border-gray-300"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Clear Search
                  </button>
                )}
                {selectedColors.length > 0 && (
                  <button
                    onClick={() => {
                      if (onColorToggle) {
                        selectedColors.forEach((color) => onColorToggle(color))
                      }
                      setStudentCountFilter(null)
                    }}
                    className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-gray-700 hover:border-gray-300"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Clear Filters
                  </button>
                )}
                {studentCountFilter && (
                  <button
                    onClick={() => setStudentCountFilter(null)}
                    className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-gray-700 hover:border-gray-300"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Reset Student Filter
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Courses Grid */}
      {displayCourses.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white border border-gray-200 rounded-xl shadow-lg">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-800 to-blue-900 rounded-xl flex items-center justify-center mb-4">
            <BookOpen size={32} className="text-white" weight="fill" />
          </div>
          <h3
            className="text-lg font-medium text-gray-900 mb-2"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            No courses found
          </h3>
          <p className="text-gray-600 max-w-xl text-justify text-sm border border-gray-200 p-4 bg-white rounded-xl mb-4">
            Start by picking a subject college students will enjoy, set clear
            goals, and create fun, engaging lessons. Add multimedia,
            assignments, and assessments. Encourage interaction, offer helpful
            resources, keep everything accessible, welcome feedback, and always
            look for ways to improve.
          </p>
          <Button
            onClick={onCreateNew}
            className="bg-gradient-to-br from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 text-white rounded-lg"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            <Plus size={20} className="mr-2" />
            Create Your First Course
          </Button>
        </Card>
      ) : viewMode === 'card' ? (
        <div className="flex flex-wrap gap-6">
          {displayCourses.map((course, index) => {
            const shadowColor = getShadowColor(course.color)
            return (
              <Card
                key={course.code}
                className={`p-6 hover:-translate-y-2 transition-all duration-300 ease-in-out border-none shadow-lg text-white transform hover:scale-105 animate-in fade-in slide-in-from-bottom-4 rounded-xl h-full flex flex-col flex-[1_1_min(100%,_350px)] ${getGradientClasses(
                  course.color
                )}`}
                style={{
                  animationDelay: `${index * 100}ms`,
                  animationFillMode: 'both',
                  boxShadow: `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), 0 0 0 1px ${shadowColor}40`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = `0 25px 50px -12px ${shadowColor}80, 0 0 0 1px ${shadowColor}40`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), 0 0 0 1px ${shadowColor}40`
                }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                    <GraduationCap
                      size={28}
                      style={{ color: getColorValue(course.color) }}
                      weight="fill"
                    />
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <h3
                      className="text-lg font-semibold text-white mb-2 truncate"
                      style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                    >
                      {course.code}
                    </h3>
                    <p
                      className="text-sm text-white/90 line-clamp-2 mb-2 break-words"
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      {course.name}
                    </p>
                    {course.description && (
                      <p
                        className="text-xs text-white/70 line-clamp-2 mb-3 break-words"
                        style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                      >
                        {course.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-3 mt-auto">
                  <div className="pt-2 border-t border-white/20">
                    <p
                      className="text-xs text-white/60 mb-3"
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      Created {formatDate(course.createdAt)}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewCourse(course)}
                      className="bg-white hover:bg-white/90 rounded-lg flex-1 justify-center text-xs"
                      style={{
                        fontFamily: 'Poppins',
                        fontWeight: 400,
                        color: getColorValue(course.color),
                      }}
                    >
                      <Eye size={14} className="mr-1" />
                      Details
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditCourse(course)}
                      className="bg-white hover:bg-white/90 rounded-lg flex-1 justify-center text-xs"
                      style={{
                        fontFamily: 'Poppins',
                        fontWeight: 400,
                        color: getColorValue(course.color),
                      }}
                    >
                      <Pencil size={14} className="mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteCourse(course)}
                      className="bg-white hover:bg-white/90 rounded-lg flex-1 justify-center text-xs"
                      style={{
                        fontFamily: 'Poppins',
                        fontWeight: 400,
                        color: getColorValue(course.color),
                      }}
                    >
                      <Trash size={14} className="mr-1" />
                      Delete
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenMasterList(course)}
                      className="bg-white hover:bg-white/90 rounded-lg flex-1 justify-center text-xs"
                      style={{
                        fontFamily: 'Poppins',
                        fontWeight: 400,
                        color: getColorValue(course.color),
                      }}
                    >
                      <Users size={14} className="mr-1" />
                      Master List
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="border border-gray-200 rounded-xl shadow-lg">
          <div>
            <table className="w-full">
              <thead className="bg-gradient-to-br from-blue-800 to-blue-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-blue-800">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-blue-800">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-blue-800">
                    Students
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayCourses.map((course) => (
                  <tr
                    key={course.code}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{
                            backgroundColor: getColorValue(course.color),
                          }}
                        >
                          <GraduationCap
                            size={18}
                            className="text-white"
                            weight="fill"
                          />
                        </div>
                        <div>
                          <p
                            className="text-sm font-medium text-gray-900"
                            style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                          >
                            {course.code}
                          </p>
                          <p
                            className="text-xs text-gray-600"
                            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                          >
                            {course.name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className="text-sm text-gray-700"
                        style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                      >
                        {formatDate(course.createdAt)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Users
                          size={16}
                          className="text-blue-900"
                          weight="duotone"
                        />
                        {loadingCourseStudents ? (
                          <div className="w-4 h-4 border-2 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <span
                            className="text-sm text-gray-900"
                            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                          >
                            {courseStudentCounts[course.code] || 0}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-2">
                        <CourseActionMenu
                          course={course}
                          onViewCourse={onViewCourse}
                          onEditCourse={onEditCourse}
                          onDeleteCourse={onDeleteCourse}
                          onOpenMasterList={handleOpenMasterList}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      <CourseMasterList
        course={selectedCourse}
        students={selectedCourseStudents}
        academicYear={latestAcademicYear}
        isOpen={Boolean(selectedCourse)}
        isLoading={loadingCourseStudents}
        onClose={handleCloseMasterList}
      />
    </div>
  )
}
