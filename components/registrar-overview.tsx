'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Users,
  GraduationCap,
  BookOpen,
  MemberOfIcon,
  User,
  Calendar,
  Clock,
  ChartBar,
  FileText,
  CheckCircle,
  XCircle,
  Plus,
  Eye,
  Gear,
  UserList,
  Student,
  Books,
  GraduationCap as GraduationCapIcon,
  User as UserIcon,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  ChartBar as ChartBarIcon,
  FileText as FileTextIcon,
  CheckCircle as CheckCircleIcon,
  XCircle as XCircleIcon,
  Plus as PlusIcon,
  Eye as EyeIcon,
  Gear as GearIcon,
  UserList as UserListIcon,
  Student as StudentIcon,
  Books as BooksIcon,
} from '@phosphor-icons/react'

interface RegistrarOverviewProps {
  registrarUid: string
}

interface OverviewStats {
  totalEnrollments: number
  pendingEnrollments: number
  approvedEnrollments: number
  rejectedEnrollments: number
  totalStudents: number
  totalTeachers: number
  totalSubjects: number
  totalCourses: number
  totalSections: number
  totalGrades: number
  primaryStudents: number
  secondaryStudents: number
  recentEnrollments: any[]
  recentTeachers: any[]
  recentGrades: any[]
  recentCourses: any[]
  grades: any
}

export default function RegistrarOverview({
  registrarUid,
}: RegistrarOverviewProps) {
  const [stats, setStats] = useState<OverviewStats>({
    totalEnrollments: 0,
    pendingEnrollments: 0,
    approvedEnrollments: 0,
    rejectedEnrollments: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalSubjects: 0,
    totalCourses: 0,
    totalSections: 0,
    totalGrades: 0,
    primaryStudents: 0,
    secondaryStudents: 0,
    recentEnrollments: [],
    recentTeachers: [],
    recentGrades: [],
    recentCourses: [],
    grades: {},
  })
  const [loading, setLoading] = useState(true)
  const [navCarouselIndex, setNavCarouselIndex] = useState(0)
  const [studentsCarouselIndex, setStudentsCarouselIndex] = useState(0)
  const [teachersCarouselIndex, setTeachersCarouselIndex] = useState(0)
  const [gradesCarouselIndex, setGradesCarouselIndex] = useState(0)

  // Navigation items for carousel with content indicators
  const navigationItems = [
    {
      id: 'enrollments',
      label: 'Student Enrollments',
      icon: UserListIcon,
      count: stats.pendingEnrollments,
      countLabel: stats.pendingEnrollments === 1 ? 'pending' : 'pending',
      color: 'yellow-600',
    },
    {
      id: 'students',
      label: 'Student Management',
      icon: GraduationCapIcon,
      count: stats.totalStudents,
      countLabel: stats.totalStudents === 1 ? 'student' : 'students',
      color: 'blue-600',
    },
    {
      id: 'teachers',
      label: 'Teacher Management',
      icon: GraduationCapIcon,
      count: stats.totalTeachers,
      countLabel: stats.totalTeachers === 1 ? 'teacher' : 'teachers',
      color: 'green-600',
    },
    {
      id: 'subjects',
      label: 'Subject Management',
      icon: BooksIcon,
      count: stats.totalSubjects,
      countLabel: stats.totalSubjects === 1 ? 'subject' : 'subjects',
      color: 'purple-600',
    },
    {
      id: 'courses',
      label: 'Course Management',
      icon: BookOpen,
      count: stats.totalCourses,
      countLabel: stats.totalCourses === 1 ? 'course' : 'courses',
      color: 'orange-600',
    },
    {
      id: 'sections',
      label: 'Grades & Sections',
      icon: MemberOfIcon,
      count: stats.totalSections,
      countLabel: stats.totalSections === 1 ? 'section' : 'sections',
      color: 'indigo-600',
      gradeCount: stats.totalGrades,
      gradeLabel: stats.totalGrades === 1 ? 'grade level' : 'grade levels',
    },
  ]

  // Auto-scroll carousels
  useEffect(() => {
    const navInterval = setInterval(() => {
      setNavCarouselIndex(
        (prev) => (prev + 1) % Math.ceil(navigationItems.length / 3)
      )
    }, 3000)

    const studentsInterval = setInterval(() => {
      if (stats.recentEnrollments.length > 0) {
        setStudentsCarouselIndex(
          (prev) => (prev + 1) % Math.ceil(stats.recentEnrollments.length / 3)
        )
      }
    }, 4000)

    const teachersInterval = setInterval(() => {
      if (stats.recentTeachers.length > 0) {
        setTeachersCarouselIndex(
          (prev) => (prev + 1) % Math.ceil(stats.recentTeachers.length / 3)
        )
      }
    }, 5000)

    const gradesInterval = setInterval(() => {
      if (stats.recentGrades.length > 0) {
        setGradesCarouselIndex(
          (prev) => (prev + 1) % Math.ceil(stats.recentGrades.length / 3)
        )
      }
    }, 4500)

    return () => {
      clearInterval(navInterval)
      clearInterval(studentsInterval)
      clearInterval(teachersInterval)
      clearInterval(gradesInterval)
    }
  }, [
    navigationItems.length,
    stats.recentEnrollments.length,
    stats.recentTeachers.length,
    stats.recentGrades.length,
  ])

  // Helper function to get student initials
  const getStudentInitials = (firstName: string, lastName: string) => {
    const firstInitial = firstName?.charAt(0)?.toUpperCase() || ''
    const lastInitial = lastName?.charAt(0)?.toUpperCase() || ''
    return `${firstInitial}${lastInitial}`.slice(0, 2) || 'S'
  }

  // Helper function to get teacher initials
  const getTeacherInitials = (firstName: string, lastName: string) => {
    const firstInitial = firstName?.charAt(0)?.toUpperCase() || ''
    const lastInitial = lastName?.charAt(0)?.toUpperCase() || ''
    return `${firstInitial}${lastInitial}`.slice(0, 2) || 'T'
  }

  // Helper function to format full name like enrollment form
  const formatFullName = (
    firstName?: string,
    middleName?: string,
    lastName?: string,
    nameExtension?: string
  ) => {
    if (!lastName && !firstName) return 'N/A'

    const parts: string[] = []

    // Last name first
    if (lastName) {
      parts.push(lastName)
    }

    // First name
    if (firstName) {
      parts.push(firstName)
    }

    // Middle name (if exists, show as initial with period)
    if (middleName && middleName.trim()) {
      const middleInitial = middleName.charAt(0).toUpperCase()
      parts.push(`${middleInitial}.`)
    }

    // Extension (if exists)
    if (nameExtension && nameExtension.trim()) {
      parts.push(nameExtension)
    }

    return parts.join(', ')
  }

  // Helper function to get grade color
  const getGradeColor = (color: string): string => {
    const colorMap: { [key: string]: string } = {
      'blue-800': '#1e40af',
      'red-800': '#991b1b',
      'emerald-800': '#064e3b',
      'yellow-800': '#92400e',
      'orange-800': '#9a3412',
      'violet-800': '#5b21b6',
      'purple-800': '#581c87',
      'indigo-800': '#312e81',
    }
    return colorMap[color] || '#1e40af'
  }

  // Helper function to get grade color by grade level
  const getGradeColorByLevel = (gradeLevel: number, grades: any): string => {
    if (!grades) return '#1e40af'

    // Find grade by grade level
    const gradeEntry = Object.entries(grades).find(
      ([id, grade]: [string, any]) => grade.gradeLevel === gradeLevel
    )

    if (gradeEntry) {
      const [, gradeData] = gradeEntry
      return getGradeColor((gradeData as any).color)
    }

    return '#1e40af' // Default color
  }

  // Color mapping for background colors
  const getBgColor = (color: string): string => {
    const colorMap: { [key: string]: string } = {
      'blue-800': '#1e40af',
      'red-800': '#991b1b',
      'emerald-800': '#064e3b',
      'yellow-800': '#92400e',
      'orange-800': '#9a3412',
      'violet-800': '#5b21b6',
      'purple-800': '#581c87',
    }
    return colorMap[color] || '#1e40af' // default to blue-800
  }

  // Helper function to format relative time
  const getRelativeTime = (dateInput: any): { text: string; color: string } => {
    try {
      if (!dateInput) {
        return { text: 'Unknown date', color: 'gray-500' }
      }

      let date: Date

      // Handle Firestore Timestamp objects
      if (dateInput && typeof dateInput === 'object') {
        if ('toDate' in dateInput) {
          date = dateInput.toDate()
        } else if ('_seconds' in dateInput || 'seconds' in dateInput) {
          const seconds = dateInput._seconds || dateInput.seconds || 0
          const nanoseconds =
            dateInput._nanoseconds || dateInput.nanoseconds || 0
          date = new Date(seconds * 1000 + nanoseconds / 1000000)
        } else {
          // Try to convert object to string and parse
          date = new Date(dateInput.toString())
        }
      } else {
        // Handle string, number, or Date
        date = new Date(dateInput)
      }

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return { text: 'Unknown date', color: 'gray-500' }
      }

      const now = new Date()
      const diffInMs = now.getTime() - date.getTime()

      if (diffInMs < 0) {
        return { text: 'Just now', color: 'green-600' }
      }

      const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

      if (diffInMinutes < 1) {
        return { text: 'Just now', color: 'green-600' }
      } else if (diffInMinutes < 60) {
        return {
          text: `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`,
          color: 'green-600',
        }
      } else if (diffInHours < 24) {
        return {
          text: `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`,
          color: 'green-500',
        }
      } else if (diffInDays === 1) {
        return { text: 'Yesterday', color: 'yellow-500' }
      } else if (diffInDays < 7) {
        return {
          text: `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`,
          color: 'yellow-600',
        }
      } else {
        // 1 week or more = expired
        return { text: 'Expired', color: 'red-600' }
      }
    } catch (error) {
      return { text: 'Unknown date', color: 'gray-500' }
    }
  }

  useEffect(() => {
    const fetchOverviewData = async () => {
      try {
        // Fetch enrollment data
        const enrollmentResponse = await fetch('/api/ai/enrollment-data')
        if (!enrollmentResponse.ok) {
          throw new Error(
            `Failed to fetch enrollment data: ${enrollmentResponse.status}`
          )
        }
        const enrollmentData = await enrollmentResponse.json()

        // Fetch student data
        const studentResponse = await fetch('/api/ai/student-data')
        if (!studentResponse.ok) {
          throw new Error(
            `Failed to fetch student data: ${studentResponse.status}`
          )
        }
        const studentData = await studentResponse.json()

        // Fetch teacher data
        const teacherResponse = await fetch('/api/ai/teacher-data')
        if (!teacherResponse.ok) {
          throw new Error(
            `Failed to fetch teacher data: ${teacherResponse.status}`
          )
        }
        const teacherData = await teacherResponse.json()

        // Fetch sections and grades data for accurate counts
        const [sectionsResponse, gradesResponse, coursesResponse] =
          await Promise.all([
            fetch('/api/sections'),
            fetch('/api/grades'),
            fetch('/api/courses'),
          ])

        // Handle responses with proper error checking
        let sectionsData = { sections: [] }
        let gradesApiData = { grades: [] }
        let coursesData = { courses: [] }

        if (sectionsResponse.ok) {
          sectionsData = await sectionsResponse.json()
        } else {
          console.warn('Failed to fetch sections:', sectionsResponse.status)
        }

        if (gradesResponse.ok) {
          gradesApiData = await gradesResponse.json()
        } else {
          console.warn('Failed to fetch grades:', gradesResponse.status)
        }

        if (coursesResponse.ok) {
          coursesData = await coursesResponse.json()
        } else {
          console.warn('Failed to fetch courses:', coursesResponse.status)
        }

        // Calculate statistics
        const enrollments = enrollmentData.enrollments || []
        const students = studentData.enrolledStudents || []

        const totalEnrollments = enrollments.length
        const pendingEnrollments = enrollments.filter(
          (e: any) => e.enrollmentInfo?.status === 'pending'
        ).length
        const approvedEnrollments = enrollments.filter(
          (e: any) => e.enrollmentInfo?.status === 'approved'
        ).length
        const rejectedEnrollments = enrollments.filter(
          (e: any) => e.enrollmentInfo?.status === 'rejected'
        ).length

        const totalStudents = students.length
        const primaryStudents = students.filter((s: any) => {
          const grade = parseInt(s.enrollmentInfo?.gradeLevel || '0')
          return grade >= 1 && grade <= 6
        }).length
        const secondaryStudents = students.filter((s: any) => {
          const grade = parseInt(s.enrollmentInfo?.gradeLevel || '0')
          return grade >= 7 && grade <= 12
        }).length

        const totalTeachers = teacherData.teachers?.length || 0
        const totalSubjects = Object.keys(studentData.subjects || {}).length
        const totalCourses = coursesData.courses?.length || 0
        const totalSections = sectionsData.sections?.length || 0
        const totalGrades = gradesApiData.grades?.length || 0

        // Get recent enrollments (last 5) excluding enrolled students and merge with student profiles
        const recentEnrollments = enrollments
          .filter(
            (enrollment: any) =>
              enrollment.enrollmentInfo?.status !== 'enrolled'
          )
          .sort(
            (a: any, b: any) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .slice(0, 5)
          .map((enrollment: any) => {
            const profile = studentData.studentProfiles?.[enrollment.userId]
            return {
              ...enrollment,
              personalInfo: enrollment.personalInfo || {},
              profile: profile || {},
            }
          })

        // Get recent teachers (last 5) with assignment counts
        const teachers = teacherData.teachers || []
        const recentTeachers = await Promise.all(
          teachers
            .sort(
              (a: any, b: any) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            )
            .slice(0, 5)
            .map(async (teacher: any) => {
              try {
                // Fetch assignment counts for each teacher
                const assignmentResponse = await fetch(
                  `/api/teacher-assignments?teacherId=${encodeURIComponent(
                    teacher.id
                  )}`
                )
                let assignmentCounts = { subjects: 0, sections: 0 }

                if (assignmentResponse.ok) {
                  const assignmentData = await assignmentResponse.json()
                  const assignments: Record<string, string[]> =
                    assignmentData.assignments || {}
                  const subjects = Object.keys(assignments).length
                  const sectionSet = new Set<string>()
                  Object.values(assignments).forEach((arr: string[]) => {
                    if (Array.isArray(arr))
                      arr.forEach((id) => sectionSet.add(id))
                  })
                  assignmentCounts = { subjects, sections: sectionSet.size }
                }

                return {
                  ...teacher,
                  assignmentCounts,
                }
              } catch (error) {
                console.warn(
                  `Failed to load assignments for teacher ${teacher.id}:`,
                  error
                )
                return {
                  ...teacher,
                  assignmentCounts: { subjects: 0, sections: 0 },
                }
              }
            })
        )

        // Get recent grades (last 5) with section and student counts
        const recentGrades =
          gradesApiData.grades
            ?.sort(
              (a: any, b: any) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            )
            .slice(0, 5)
            .map((grade: any) => {
              // Count sections for this grade
              const sectionsForGrade =
                sectionsData.sections?.filter(
                  (section: any) => section.gradeId === grade.id
                ) || []

              // Count students in sections for this grade level
              let studentsInGrade = 0
              sectionsForGrade.forEach((section: any) => {
                if (section.students && Array.isArray(section.students)) {
                  studentsInGrade += section.students.length
                }
              })

              return {
                ...grade,
                sectionsCount: sectionsForGrade.length,
                studentsCount: studentsInGrade,
              }
            }) || []

        // Get recent courses (last 5) with section and student counts
        const recentCourses =
          coursesData.courses
            ?.sort(
              (a: any, b: any) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            )
            .slice(0, 5)
            .map((course: any) => {
              // Count sections for this course
              const sectionsForCourse =
                sectionsData.sections?.filter(
                  (section: any) => section.courseId === course.id
                ) || []

              // Count students in sections for this course
              let studentsInCourse = 0
              sectionsForCourse.forEach((section: any) => {
                if (section.students && Array.isArray(section.students)) {
                  studentsInCourse += section.students.length
                }
              })

              return {
                ...course,
                sectionsCount: sectionsForCourse.length,
                studentsCount: studentsInCourse,
              }
            }) || []

        // Store grades data for color mapping
        const gradesDataForColors = enrollmentData.grades || {}

        setStats({
          totalEnrollments,
          pendingEnrollments,
          approvedEnrollments,
          rejectedEnrollments,
          totalStudents,
          totalTeachers,
          totalSubjects,
          totalCourses,
          totalSections,
          totalGrades,
          primaryStudents,
          secondaryStudents,
          recentEnrollments,
          recentTeachers,
          recentGrades,
          recentCourses,
          grades: gradesDataForColors,
        })
      } catch (error) {
        console.error('Failed to fetch overview data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOverviewData()

    // Auto-refresh every 30 seconds to update stats
    const refreshInterval = setInterval(() => {
      fetchOverviewData()
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(refreshInterval)
  }, [])

  // Skeleton component for recent enrollments only
  const RecentEnrollmentsSkeleton = () => (
    <div className="space-y-4">
      <h3
        className="text-lg font-medium text-gray-900 mb-4"
        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
      >
        Recent Enrollments
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-white border border-gray-200 p-4 animate-pulse"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 w-3/4 mb-1"></div>
                <div className="h-3 bg-gray-200 w-1/2"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 w-full"></div>
              <div className="h-3 bg-gray-200 w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  // Skeleton component for recent teachers only
  const RecentTeachersSkeleton = () => (
    <div className="space-y-4">
      <h3
        className="text-lg font-medium text-gray-900 mb-4"
        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
      >
        Recent Teachers
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-white border border-gray-200 p-4 animate-pulse"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 w-3/4 mb-1"></div>
                <div className="h-3 bg-gray-200 w-1/2"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 w-full"></div>
              <div className="h-3 bg-gray-200 w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-900 flex items-center justify-center">
            <ChartBarIcon size={24} className="text-white" weight="fill" />
          </div>
          <div>
            <h1
              className="text-2xl font-light text-gray-900"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              Registrar Overview
            </h1>
            <p
              className="text-sm text-gray-600"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              Overview of your registrar dashboard
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-900 flex items-center justify-center">
            <CalendarIcon size={16} className="text-white" weight="fill" />
          </div>
          <div className="px-3 py-1 bg-gray-100 border border-gray-200">
            <span
              className="text-sm text-gray-700 font-mono"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>

      {/* What would you like to do? - Navigation Carousel */}
      <div className="bg-white p-6 border border-gray-200 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-900 flex items-center justify-center">
            <GearIcon size={20} className="text-white" weight="fill" />
          </div>
          <h2 className="text-xl font-medium text-gray-900">
            What would you like to do?
          </h2>
        </div>

        <div className="relative overflow-hidden">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="p-4 border-none bg-gray-50 border-1 shadow-sm border-blue-900 animate-pulse"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-200"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 w-3/4"></div>
                      <div className="h-3 bg-gray-200 w-1/2"></div>
                      <div className="h-3 bg-gray-200 w-2/3"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${navCarouselIndex * 100}%)` }}
            >
              {Array.from({
                length: Math.ceil(navigationItems.length / 3),
              }).map((_, groupIndex) => (
                <div
                  key={groupIndex}
                  className="w-full flex-shrink-0 animate-in fade-in slide-in-from-bottom-4 duration-500"
                  style={{ animationDelay: `${groupIndex * 150}ms` }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {navigationItems
                      .slice(groupIndex * 3, (groupIndex + 1) * 3)
                      .map((item, itemIndex) => (
                        <div
                          key={item.id}
                          className="group p-4 border-none hover:shadow-lg hover:-translate-y-2 transition-all duration-300 ease-in-out border-1 shadow-sm transform hover:scale-105 animate-in fade-in slide-in-from-bottom-4 bg-gray-50 border-blue-900"
                          style={{
                            animationDelay: `${
                              groupIndex * 150 + itemIndex * 75 + 200
                            }ms`,
                            animationFillMode: 'both',
                          }}
                        >
                          <div className="flex items-center space-x-4">
                            {/* Icon */}
                            <div className="w-12 h-12 bg-blue-900 flex items-center justify-center border-2 border-gray-300">
                              <item.icon
                                size={20}
                                className="text-white"
                                weight="fill"
                              />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              {/* Label */}
                              <h3
                                className="text-sm font-medium text-gray-900 truncate"
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 500,
                                }}
                              >
                                {item.label}
                              </h3>

                              {/* Count with Color Dot */}
                              <div className="flex items-center space-x-2 mt-1">
                                <div
                                  className={`w-3 h-3 bg-${item.color}`}
                                ></div>
                                <span className="text-xs text-gray-700 font-mono">
                                  {item.count} {item.countLabel}
                                </span>
                              </div>

                              {/* Grade Level Count (for sections only) */}
                              {item.id === 'sections' && (
                                <div className="flex items-center space-x-2 mt-1">
                                  <div className="w-3 h-3 bg-purple-600"></div>
                                  <span className="text-xs text-gray-700 font-mono">
                                    {item.gradeCount} {item.gradeLabel}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Navigation dots */}
          <div className="flex justify-center mt-4 space-x-2">
            {Array.from({ length: Math.ceil(navigationItems.length / 3) }).map(
              (_, index) => (
                <button
                  key={index}
                  onClick={() => setNavCarouselIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                    index === navCarouselIndex ? 'bg-blue-900' : 'bg-gray-300'
                  }`}
                />
              )
            )}
          </div>
        </div>
      </div>

      {/* Recent Enrolled Students - Carousel */}
      <div className="bg-white p-6 border border-gray-200 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-900 flex items-center justify-center">
            <ClockIcon size={20} className="text-white" weight="fill" />
          </div>
          <h2 className="text-xl font-medium text-gray-900">
            Your Pending Enrollments
          </h2>
        </div>

        <div className="relative overflow-hidden">
          {loading ? (
            <RecentEnrollmentsSkeleton />
          ) : (
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{
                transform: `translateX(-${studentsCarouselIndex * 100}%)`,
              }}
            >
              {Array.from({
                length: Math.ceil(stats.recentEnrollments.length / 3),
              }).map((_, groupIndex) => (
                <div
                  key={groupIndex}
                  className="w-full flex-shrink-0 animate-in fade-in slide-in-from-bottom-4 duration-500"
                  style={{ animationDelay: `${groupIndex * 150}ms` }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stats.recentEnrollments
                      .slice(groupIndex * 3, (groupIndex + 1) * 3)
                      .map((enrollment, studentIndex) => {
                        return (
                          <div
                            key={enrollment.id || studentIndex}
                            className="group p-4 border-none hover:shadow-lg hover:-translate-y-2 transition-all duration-300 ease-in-out border-1 shadow-sm transform hover:scale-105 animate-in fade-in slide-in-from-bottom-4 bg-gray-50 border-blue-900"
                            style={{
                              animationDelay: `${
                                groupIndex * 150 + studentIndex * 75 + 200
                              }ms`,
                              animationFillMode: 'both',
                            }}
                          >
                            {/* Student Profile Layout */}
                            <div className="flex items-center space-x-4">
                              {/* Circular Profile Picture */}
                              <div className="w-12 h-12 bg-blue-900 flex items-center justify-center border-2 border-gray-300 rounded-full ">
                                {enrollment.profile?.photoURL ||
                                enrollment.personalInfo?.photoURL ? (
                                  <img
                                    src={
                                      enrollment.profile?.photoURL ||
                                      enrollment.personalInfo?.photoURL
                                    }
                                    alt={`${
                                      enrollment.personalInfo?.firstName ||
                                      'Student'
                                    } profile`}
                                    className="w-full h-full object-cover rounded-full"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none'
                                    }}
                                  />
                                ) : (
                                  <span
                                    className="text-white text-sm font-medium"
                                    style={{
                                      fontFamily: 'Poppins',
                                      fontWeight: 500,
                                    }}
                                  >
                                    {getStudentInitials(
                                      enrollment.personalInfo?.firstName ||
                                        'Student',
                                      enrollment.personalInfo?.lastName ||
                                        'Name'
                                    )}
                                  </span>
                                )}
                              </div>

                              {/* Student Info */}
                              <div className="flex-1 min-w-0">
                                {/* Full Name */}
                                <h3
                                  className="text-sm font-medium text-gray-900 truncate"
                                  style={{
                                    fontFamily: 'Poppins',
                                    fontWeight: 500,
                                  }}
                                >
                                  {formatFullName(
                                    enrollment.personalInfo?.firstName,
                                    enrollment.personalInfo?.middleName,
                                    enrollment.personalInfo?.lastName,
                                    enrollment.personalInfo?.nameExtension
                                  )}
                                </h3>

                                {/* Grade Level with Color Dot */}
                                <div className="flex items-center space-x-2">
                                  <div
                                    className="w-3 h-3 flex-shrink-0"
                                    style={{
                                      backgroundColor: getGradeColorByLevel(
                                        parseInt(
                                          enrollment.enrollmentInfo
                                            ?.gradeLevel || '0'
                                        ),
                                        stats.grades
                                      ),
                                    }}
                                  ></div>
                                  <p className="text-xs text-black truncate font-mono">
                                    Grade{' '}
                                    {enrollment.enrollmentInfo?.gradeLevel ||
                                      'N/A'}
                                  </p>
                                </div>

                                {/* Status with Square Dot */}
                                <div className="flex items-center space-x-2 mt-1">
                                  <div
                                    className={`w-3 h-3 border-2 ${
                                      enrollment.enrollmentInfo?.status ===
                                      'approved'
                                        ? 'border-green-600 bg-green-600'
                                        : enrollment.enrollmentInfo?.status ===
                                          'pending'
                                        ? 'border-yellow-600 bg-yellow-600'
                                        : enrollment.enrollmentInfo?.status ===
                                          'enrolled'
                                        ? 'border-blue-600 bg-blue-600'
                                        : 'border-red-600 bg-red-600'
                                    }`}
                                  ></div>
                                  <span className="text-xs font-medium text-gray-700 capitalize font-mono">
                                    {enrollment.enrollmentInfo?.status ||
                                      'Unknown'}
                                  </span>
                                </div>

                                {/* Date Provider with Color Dot */}
                                <div className="flex items-center space-x-2 mt-1">
                                  {(() => {
                                    // Use submittedAt like enrollment-management.tsx, fallback to createdAt
                                    const enrollmentDate =
                                      enrollment.submittedAt ||
                                      enrollment.createdAt ||
                                      new Date(
                                        Date.now() - 2 * 24 * 60 * 60 * 1000
                                      ).toISOString()
                                    const relativeTime =
                                      getRelativeTime(enrollmentDate)
                                    return (
                                      <>
                                        <div
                                          className={`w-3 h-3 border-2 bg-${relativeTime.color} border-${relativeTime.color}`}
                                        ></div>
                                        <span className="text-xs text-gray-500 font-mono">
                                          {relativeTime.text}
                                        </span>
                                      </>
                                    )
                                  })()}
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
          )}
          {stats.recentEnrollments.length > 3 && (
            <div className="flex justify-center mt-4 space-x-2">
              {Array.from({
                length: Math.ceil(stats.recentEnrollments.length / 3),
              }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setStudentsCarouselIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                    index === studentsCarouselIndex
                      ? 'bg-blue-900'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Empty state - only show after loading is complete */}
        {!loading && stats.recentEnrollments.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-200 flex items-center justify-center mx-auto mb-4">
              <FileTextIcon size={32} className="text-gray-400" />
            </div>
            <p
              className="text-sm text-gray-500"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              No recent enrollments
            </p>
          </div>
        )}
      </div>

      {/* Recent Teachers - Carousel */}
      <div className="bg-white p-6 border border-gray-200 shadow-lg ">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-900 flex items-center justify-center">
            <GraduationCapIcon size={20} className="text-white" weight="fill" />
          </div>
          <h2 className="text-xl font-medium text-gray-900">Recent Teachers</h2>
        </div>

        <div className="relative overflow-hidden">
          {loading ? (
            <RecentTeachersSkeleton />
          ) : (
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{
                transform: `translateX(-${teachersCarouselIndex * 100}%)`,
              }}
            >
              {Array.from({
                length: Math.ceil(stats.recentTeachers.length / 3),
              }).map((_, groupIndex) => (
                <div
                  key={groupIndex}
                  className="w-full flex-shrink-0 animate-in fade-in slide-in-from-bottom-4 duration-500"
                  style={{ animationDelay: `${groupIndex * 150}ms` }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stats.recentTeachers
                      .slice(groupIndex * 3, (groupIndex + 1) * 3)
                      .map((teacher, teacherIndex) => {
                        return (
                          <div
                            key={teacher.id || teacherIndex}
                            className="group p-4 border-none hover:shadow-lg hover:-translate-y-2 transition-all duration-300 ease-in-out border-1 shadow-sm transform hover:scale-105 animate-in fade-in slide-in-from-bottom-4 bg-gray-50 border-blue-900"
                            style={{
                              animationDelay: `${
                                groupIndex * 150 + teacherIndex * 75 + 200
                              }ms`,
                              animationFillMode: 'both',
                            }}
                          >
                            {/* Teacher Profile Layout */}
                            <div className="flex items-center space-x-4">
                              {/* Circular Profile Picture */}
                              <div className="w-12 h-12 bg-blue-900 flex items-center justify-center border-2 border-gray-300 rounded-full">
                                <span
                                  className="text-white text-sm font-medium"
                                  style={{
                                    fontFamily: 'Poppins',
                                    fontWeight: 500,
                                  }}
                                >
                                  {getTeacherInitials(
                                    teacher.firstName || 'Teacher',
                                    teacher.lastName || 'Name'
                                  )}
                                </span>
                              </div>

                              {/* Teacher Info */}
                              <div className="flex-1 min-w-0">
                                {/* Full Name */}
                                <h3
                                  className="text-sm font-medium text-gray-900 truncate"
                                  style={{
                                    fontFamily: 'Poppins',
                                    fontWeight: 500,
                                  }}
                                >
                                  {teacher.firstName}{' '}
                                  {teacher.middleName &&
                                    `${teacher.middleName.charAt(0)}. `}
                                  {teacher.lastName}
                                  {teacher.extension && ` ${teacher.extension}`}
                                </h3>

                                {/* Assignment Counts */}
                                <div className="flex items-center space-x-2">
                                  <div className="w-3 h-3 bg-green-600 flex-shrink-0"></div>
                                  <p className="text-xs text-black truncate font-mono">
                                    {teacher.assignmentCounts?.subjects || 0}{' '}
                                    Subject
                                    {(teacher.assignmentCounts?.subjects ||
                                      0) !== 1
                                      ? 's'
                                      : ''}
                                  </p>
                                </div>

                                {/* Section Count */}
                                <div className="flex items-center space-x-2 mt-1">
                                  <div className="w-3 h-3 bg-blue-600 flex-shrink-0"></div>
                                  <p className="text-xs text-black truncate font-mono">
                                    {teacher.assignmentCounts?.sections || 0}{' '}
                                    Section
                                    {(teacher.assignmentCounts?.sections ||
                                      0) !== 1
                                      ? 's'
                                      : ''}
                                  </p>
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
          )}

          {/* Navigation dots */}
          {stats.recentTeachers.length > 3 && (
            <div className="flex justify-center mt-4 space-x-2">
              {Array.from({
                length: Math.ceil(stats.recentTeachers.length / 3),
              }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setTeachersCarouselIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                    index === teachersCarouselIndex
                      ? 'bg-blue-900'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Empty state - only show after loading is complete */}
        {!loading && stats.recentTeachers.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-200 flex items-center justify-center mx-auto mb-4">
              <GraduationCapIcon size={32} className="text-gray-400" />
            </div>
            <p
              className="text-sm text-gray-500"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              No teachers found
            </p>
          </div>
        )}
      </div>

      {/* Recent Grades - Carousel */}
      <div className="bg-white p-6 border border-gray-200 shadow-lg ">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-900 flex items-center justify-center">
            <GraduationCapIcon size={20} className="text-white" weight="fill" />
          </div>
          <h2 className="text-xl font-medium text-gray-900">
            Grade Levels & Courses
          </h2>
        </div>

        <div className="relative overflow-hidden">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="p-4 border-none bg-gray-50 border-1 shadow-sm border-blue-900 animate-pulse"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 w-3/4"></div>
                      <div className="h-3 bg-gray-200 w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            (() => {
              // Combine grades and courses into a single array
              const combinedItems = [
                ...stats.recentGrades.map((item) => ({
                  ...item,
                  type: 'grade',
                })),
                ...stats.recentCourses.map((item) => ({
                  ...item,
                  type: 'course',
                })),
              ]

              return (
                <div
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{
                    transform: `translateX(-${gradesCarouselIndex * 100}%)`,
                  }}
                >
                  {Array.from({
                    length: Math.ceil(combinedItems.length / 3),
                  }).map((_, groupIndex) => (
                    <div
                      key={groupIndex}
                      className="w-full flex-shrink-0 animate-in fade-in slide-in-from-bottom-4 duration-500"
                      style={{ animationDelay: `${groupIndex * 150}ms` }}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {combinedItems
                          .slice(groupIndex * 3, (groupIndex + 1) * 3)
                          .map((item, itemIndex) => {
                            const itemColor =
                              item.color || item.courseColor || 'blue-800'
                            const bgColor = getBgColor(itemColor)

                            return (
                              <div
                                key={item.id || itemIndex}
                                className="group p-4 border-none hover:shadow-lg hover:-translate-y-2 transition-all duration-300 ease-in-out border-1 shadow-sm transform hover:scale-105 animate-in fade-in slide-in-from-bottom-4 bg-gray-50 border-blue-900"
                                style={{
                                  animationDelay: `${
                                    groupIndex * 150 + itemIndex * 75 + 200
                                  }ms`,
                                  animationFillMode: 'both',
                                }}
                              >
                                {/* Item Profile Layout */}
                                <div className="flex items-center space-x-4">
                                  {/* Circular Icon */}
                                  <div className="w-12 h-12 bg-blue-900 flex items-center justify-center border-2 border-gray-300 rounded-full">
                                    <GraduationCapIcon
                                      size={20}
                                      className="text-white"
                                      weight="fill"
                                    />
                                  </div>

                                  {/* Item Info */}
                                  <div className="flex-1 min-w-0">
                                    {/* Name */}
                                    <h3
                                      className="text-sm font-medium text-gray-900 truncate"
                                      style={{
                                        fontFamily: 'Poppins',
                                        fontWeight: 500,
                                      }}
                                    >
                                      {item.type === 'grade'
                                        ? item.strand &&
                                          (item.gradeLevel === 11 ||
                                            item.gradeLevel === 12)
                                          ? `G${item.gradeLevel}${item.strand}`
                                          : item.gradeLevel >= 7 &&
                                            item.gradeLevel <= 12
                                          ? `G${item.gradeLevel}`
                                          : `Grade ${item.gradeLevel}`
                                        : item.courseName || item.code}
                                    </h3>

                                    {/* Department */}
                                    <div className="flex items-center space-x-2">
                                      <div className="w-3 h-3 bg-purple-600 flex-shrink-0"></div>
                                      <p className="text-xs text-black truncate font-mono">
                                        {item.department === 'JHS'
                                          ? 'Junior HS'
                                          : item.department === 'SHS'
                                          ? 'Senior HS'
                                          : 'College'}
                                      </p>
                                    </div>

                                    {/* Sections Count */}
                                    <div className="flex items-center space-x-2 mt-1">
                                      <div className="w-3 h-3 bg-indigo-600 flex-shrink-0"></div>
                                      <p className="text-xs text-black truncate font-mono">
                                        {item.sectionsCount || 0} Section
                                        {(item.sectionsCount || 0) !== 1
                                          ? 's'
                                          : ''}
                                      </p>
                                    </div>

                                    {/* Students Count */}
                                    <div className="flex items-center space-x-2 mt-1">
                                      <div className="w-3 h-3 bg-green-600 flex-shrink-0"></div>
                                      <p className="text-xs text-black truncate font-mono">
                                        {item.studentsCount || 0} Student
                                        {(item.studentsCount || 0) !== 1
                                          ? 's'
                                          : ''}
                                      </p>
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
              )
            })()
          )}

          {/* Navigation dots */}
          {stats.recentGrades.length + stats.recentCourses.length > 3 && (
            <div className="flex justify-center mt-4 space-x-2">
              {Array.from({
                length: Math.ceil(
                  (stats.recentGrades.length + stats.recentCourses.length) / 3
                ),
              }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setGradesCarouselIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                    index === gradesCarouselIndex
                      ? 'bg-blue-900'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Empty state - only show after loading is complete */}
        {!loading &&
          stats.recentGrades.length === 0 &&
          stats.recentCourses.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-200 flex items-center justify-center mx-auto mb-4">
                <GraduationCapIcon size={32} className="text-gray-400" />
              </div>
              <p
                className="text-sm text-gray-500"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                No grade levels or courses found
              </p>
            </div>
          )}
      </div>
    </div>
  )
}
