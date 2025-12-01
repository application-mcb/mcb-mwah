'use client'

import React, { useState, useEffect } from 'react'
import {
  GraduationCap,
  BookOpen,
  Users,
  ArrowLeft,
  ArrowRight,
  Printer,
} from '@phosphor-icons/react'
import { toast } from 'react-toastify'
import TeacherSchedulePrintModal from './teacher-schedule-print'

interface TeacherClassesViewProps {
  teacherId: string
}

interface Subject {
  id: string
  code: string
  name: string
  description: string
  color: string
  lectureUnits: number
  labUnits: number
  totalUnits: number
  gradeLevel?: number // Legacy field for backward compatibility
  gradeLevels?: number[] // For high school subjects (can be multiple grades)
  courseCodes?: string[] // For college subjects
  courseSelections?: {
    code: string
    year: number
    semester: 'first-sem' | 'second-sem'
  }[] // College course selections
  // Mixed format for backward compatibility:
  // - Old: Record<sectionId, string[]> (array of teacherIds)
  // - New: Record<sectionId, { teacherId: string; schedule?: { dayOfWeek: string | string[]; startTime?: string; endTime?: string; room?: string; deliveryMode?: string } }>
  teacherAssignments?: Record<string, any>
}

interface Section {
  id: string
  sectionName: string
  gradeId: string
  rank: string
  grade: string
  department: string
}

interface Grade {
  id: string
  gradeLevel: number
  color: string
  description: string
  strand?: string
  department: string
}

interface TeacherAssignment {
  subjectId: string
  sectionId: string
  teacherId: string
}

interface TeacherDetails {
  id: string
  firstName: string
  middleName?: string
  lastName: string
  extension?: string
}

export default function TeacherClassesView({
  teacherId,
}: TeacherClassesViewProps) {
  const ITEMS_PER_PAGE = 5
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([])
  const [subjects, setSubjects] = useState<Record<string, Subject>>({})
  const [sections, setSections] = useState<Record<string, Section>>({})
  const [grades, setGrades] = useState<Record<string, Grade>>({})
  const [sectionStudentCounts, setSectionStudentCounts] = useState<
    Record<string, number>
  >({})
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string[]>([])
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [teacherDetails, setTeacherDetails] = useState<TeacherDetails | null>(
    null
  )
  const [loadingTeacherDetails, setLoadingTeacherDetails] = useState(true)
  const [showPrintScheduleModal, setShowPrintScheduleModal] = useState(false)

  useEffect(() => {
    loadTeacherAssignments()
  }, [teacherId])

  useEffect(() => {
    const loadTeacherDetails = async () => {
      try {
        setLoadingTeacherDetails(true)
        const response = await fetch('/api/teachers')
        if (!response.ok) {
          throw new Error('Failed to load teacher details')
        }
        const data = await response.json()
        const teacher = data.teachers?.find((t: any) => t.id === teacherId)
        if (teacher) {
          setTeacherDetails({
            id: teacher.id,
            firstName: teacher.firstName || 'Teacher',
            middleName: teacher.middleName,
            lastName: teacher.lastName || '',
            extension: teacher.extension,
          })
        } else {
          setTeacherDetails({
            id: teacherId,
            firstName: 'Teacher',
            lastName: '',
          })
        }
      } catch (error) {
        console.error('Error loading teacher details:', error)
        toast.error('Failed to load teacher information')
        setTeacherDetails({
          id: teacherId,
          firstName: 'Teacher',
          lastName: '',
        })
      } finally {
        setLoadingTeacherDetails(false)
      }
    }

    loadTeacherDetails()
  }, [teacherId])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedGradeFilter, selectedCourseFilter])

  const loadTeacherAssignments = async () => {
    try {
      setLoading(true)

      // Load teacher assignments
      const assignmentsResponse = await fetch(
        `/api/teacher-assignments?teacherId=${teacherId}`
      )
      const assignmentsData = await assignmentsResponse.json()

      let transformedAssignments: TeacherAssignment[] = []

      if (assignmentsResponse.ok && assignmentsData.assignments) {
        // Transform the API response from {subjectId: [sectionIds]} to [{subjectId, sectionId}]
        Object.entries(assignmentsData.assignments).forEach(
          ([subjectId, sectionIds]) => {
            if (Array.isArray(sectionIds)) {
              sectionIds.forEach((sectionId) => {
                transformedAssignments.push({
                  subjectId,
                  sectionId: sectionId as string,
                  teacherId,
                })
              })
            }
          }
        )
        setAssignments(transformedAssignments)
      }

      // Load all subjects
      const subjectsResponse = await fetch('/api/subjects')
      const subjectsData = await subjectsResponse.json()

      if (subjectsResponse.ok && subjectsData.subjects) {
        const subjectsMap: Record<string, Subject> = {}
        subjectsData.subjects.forEach((subject: Subject) => {
          subjectsMap[subject.id] = subject
        })
        setSubjects(subjectsMap)
      }

      // Load all sections
      const sectionsResponse = await fetch('/api/sections')
      const sectionsData = await sectionsResponse.json()

      if (sectionsResponse.ok && sectionsData.sections) {
        const sectionsMap: Record<string, Section> = {}
        sectionsData.sections.forEach((section: Section) => {
          sectionsMap[section.id] = section
        })
        setSections(sectionsMap)
      }

      // Load all grades
      const gradesResponse = await fetch('/api/grades')
      const gradesData = await gradesResponse.json()

      if (gradesResponse.ok && gradesData.grades) {
        const gradesMap: Record<string, Grade> = {}
        gradesData.grades.forEach((grade: Grade) => {
          gradesMap[grade.id] = grade
        })
        setGrades(gradesMap)
      }

      // Load student counts per section
      if (transformedAssignments.length > 0) {
        const sectionIds = [
          ...new Set(
            transformedAssignments.map((a: TeacherAssignment) => a.sectionId)
          ),
        ]

        if (sectionIds.length > 0) {
          // Fetch all enrollments and count students per section
          const enrollmentsResponse = await fetch('/api/enrollment?getAll=true')
          if (enrollmentsResponse.ok) {
            const enrollmentsData = await enrollmentsResponse.json()
            const counts: Record<string, number> = {}

            // Initialize all section counts to 0
            sectionIds.forEach((sectionId) => {
              counts[sectionId] = 0
            })

            // Count students per section from enrollments
            if (enrollmentsData.success && enrollmentsData.data) {
              enrollmentsData.data.forEach((enrollment: any) => {
                const sectionId = enrollment.enrollmentInfo?.sectionId
                if (sectionId && sectionIds.includes(sectionId)) {
                  counts[sectionId] = (counts[sectionId] || 0) + 1
                }
              })
            }

            setSectionStudentCounts(counts)
          }
        }
      }
    } catch (error) {
      console.error('Error loading teacher assignments:', error)
      toast.error('Failed to load your class assignments')
    } finally {
      setLoading(false)
    }
  }

  const getSubjectColor = (color: string): string => {
    const colorMap: { [key: string]: string } = {
      'blue-900': '#1e40af',
      'red-800': '#991b1b',
      'emerald-800': '#064e3b',
      'yellow-800': '#92400e',
      'orange-800': '#9a3412',
      'violet-800': '#5b21b6',
      'purple-800': '#581c87',
    }
    return colorMap[color] || '#1e40af'
  }

  const getGradeColor = (color: string): string => {
    return getSubjectColor(color)
  }

  const getSectionSchedule = (
    subject: Subject,
    sectionId: string
  ): {
    startTime?: string
    endTime?: string
    dayOfWeek?: string | string[]
  } => {
    const teacherAssignments = subject.teacherAssignments as any
    if (!teacherAssignments) return {}

    const assignmentData = teacherAssignments[sectionId]
    if (!assignmentData) return {}

    // Old format: just teacher IDs, no schedule
    if (Array.isArray(assignmentData)) {
      return {}
    }

    // New format: object with teacherId and optional schedule
    if (
      assignmentData &&
      typeof assignmentData === 'object' &&
      'schedule' in assignmentData &&
      assignmentData.schedule
    ) {
      const schedule = assignmentData.schedule as {
        dayOfWeek?: string | string[]
        startTime?: string
        endTime?: string
      }
      return {
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        dayOfWeek: schedule.dayOfWeek,
      }
    }

    return {}
  }

  // Group assignments by subject
  const groupedAssignments = assignments.reduce((acc, assignment) => {
    const subject = subjects[assignment.subjectId]
    if (!subject) return acc

    if (!acc[assignment.subjectId]) {
      acc[assignment.subjectId] = {
        subject,
        sections: [],
      }
    }

    const section = sections[assignment.sectionId]
    if (section) {
      acc[assignment.subjectId].sections.push(section)
    }

    return acc
  }, {} as Record<string, { subject: Subject; sections: Section[] }>)

  // Get unique grade levels for filtering (handle both legacy gradeLevel and gradeLevels)
  // Only show grade filters for high school subjects
  const availableGrades = Array.from(
    new Set(
      Object.values(groupedAssignments).flatMap(({ subject }) => {
        // Only include if subject has grade levels (high school)
        // Skip college subjects (those with courseCodes)
        if (subject.courseCodes && subject.courseCodes.length > 0) {
          return []
        }
        // Support both legacy gradeLevel and new gradeLevels array
        if (subject.gradeLevels && Array.isArray(subject.gradeLevels)) {
          return subject.gradeLevels
        }
        if (subject.gradeLevel != null) {
          return [subject.gradeLevel]
        }
        return []
      })
    )
  ).sort((a, b) => a - b)

  const availableCourses = Array.from(
    new Set(
      Object.values(groupedAssignments).flatMap(({ subject }) => {
        if (subject.courseCodes && Array.isArray(subject.courseCodes)) {
          return subject.courseCodes
        }
        return []
      })
    )
  ).sort()

  // Filter assignments based on search and grade filter
  const filteredAssignments = Object.entries(groupedAssignments).filter(
    ([subjectId, { subject, sections }]) => {
      // Grade filter - only apply to high school subjects
      if (selectedGradeFilter.length > 0) {
        // Skip college subjects (those with courseCodes) when grade filter is active
        if (subject.courseCodes && subject.courseCodes.length > 0) {
          return false
        }

        // Get all grade levels for this subject (support both legacy and new structure)
        const subjectGradeLevels: number[] = []
        if (subject.gradeLevels && Array.isArray(subject.gradeLevels)) {
          subjectGradeLevels.push(...subject.gradeLevels)
        } else if (subject.gradeLevel != null) {
          subjectGradeLevels.push(subject.gradeLevel)
        }

        // If subject has grade levels, check if any match the filter
        if (subjectGradeLevels.length > 0) {
          const matchesFilter = subjectGradeLevels.some((gl) =>
            selectedGradeFilter.includes(gl.toString())
          )
          if (!matchesFilter) {
            return false
          }
        } else {
          // Subject has no grade levels, exclude from grade filter
          return false
        }
      }

      // Course filter - apply to college subjects
      if (selectedCourseFilter.length > 0) {
        if (subject.courseCodes && subject.courseCodes.length > 0) {
          const matchesCourse = subject.courseCodes.some((code) =>
            selectedCourseFilter.includes(code)
          )
          if (!matchesCourse) {
            return false
          }
        } else {
          // Subject has no course association, exclude
          return false
        }
      }

      // Search filter
      const query = searchQuery.toLowerCase()
      if (query) {
        const subjectMatches =
          subject.name.toLowerCase().includes(query) ||
          subject.code.toLowerCase().includes(query) ||
          (subject.courseCodes &&
            subject.courseCodes.some((code) =>
              code.toLowerCase().includes(query)
            ))
        const sectionMatches = sections.some(
          (section) =>
            section.sectionName.toLowerCase().includes(query) ||
            section.rank.toLowerCase().includes(query) ||
            section.department.toLowerCase().includes(query)
        )
        return subjectMatches || sectionMatches
      }

      return true
    }
  )

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAssignments.length / ITEMS_PER_PAGE)
  )

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [totalPages, currentPage])

  const paginatedAssignments = filteredAssignments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const startItem =
    filteredAssignments.length === 0
      ? 0
      : (currentPage - 1) * ITEMS_PER_PAGE + 1
  const endItem = Math.min(
    currentPage * ITEMS_PER_PAGE,
    filteredAssignments.length
  )

  const visiblePageNumbers = React.useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1)
    }

    if (currentPage <= 4) {
      return Array.from({ length: 7 }, (_, index) => index + 1)
    }

    if (currentPage >= totalPages - 3) {
      return Array.from({ length: 7 }, (_, index) => totalPages - 6 + index)
    }

    return Array.from({ length: 7 }, (_, index) => currentPage - 3 + index)
  }, [currentPage, totalPages])

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1))
  }

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
  }

  const handlePageSelect = (page: number) => {
    setCurrentPage(page)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl p-6">
          <h1
            className="text-2xl font-light text-white flex items-center gap-2"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            <div className="w-8 h-8 aspect-square bg-white rounded-xl flex items-center justify-center">
              <BookOpen size={20} weight="fill" className="text-blue-900" />
            </div>
            My Classes
          </h1>
          <p
            className="text-xs text-blue-100 mt-1"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            View your assigned subjects and sections
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-white/90 border border-blue-100 rounded-xl shadow-sm p-6">
            <div className="space-y-4 animate-pulse">
              <div className="h-11 rounded-xl bg-blue-50"></div>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={`chip-${index}`}
                    className="h-7 px-6 rounded-full bg-blue-50"
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white/95 border border-blue-100 rounded-2xl shadow-lg">
            <div className="px-6 py-4 border-b border-blue-50">
              <div className="h-6 w-48 rounded-md bg-blue-50 animate-pulse"></div>
            </div>
            <div className="divide-y divide-blue-50">
              {Array.from({ length: 4 }).map((_, rowIndex) => (
                <div
                  key={`row-${rowIndex}`}
                  className="px-6 py-5 flex items-start gap-4 animate-pulse"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-100"></div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="h-3 w-40 rounded bg-blue-100"></div>
                        <div className="h-3 w-24 rounded bg-blue-50"></div>
                      </div>
                      <div className="h-4 w-24 rounded bg-blue-50"></div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: 2 }).map((_, chipIndex) => (
                        <div
                          key={`row-${rowIndex}-chip-${chipIndex}`}
                          className="h-6 w-28 rounded-full bg-blue-50"
                        ></div>
                      ))}
                    </div>
                  </div>
                  <div className="w-16 h-6 rounded bg-blue-50"></div>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-blue-50 bg-blue-50/30">
              <div className="h-4 w-40 rounded bg-blue-100 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (filteredAssignments.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl p-6">
          <h1
            className="text-2xl font-light text-white flex items-center gap-2"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            <div className="w-8 h-8 aspect-square bg-white rounded-xl flex items-center justify-center">
              <BookOpen size={20} weight="fill" className="text-blue-900" />
            </div>
            My Classes
          </h1>
          <p
            className="text-xs text-blue-100 mt-1"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            View your assigned subjects and sections
          </p>
        </div>

        <div className="bg-white/90 border border-blue-100 rounded-xl shadow-sm p-4 space-y-4">
          <div className="flex-1 max-w-xl">
            <input
              type="text"
              placeholder="Search subjects or sections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-900/40 text-sm bg-white/70"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-sm text-blue-900/70"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              Grade Levels:
            </span>
            <button
              onClick={() =>
                setSelectedGradeFilter(
                  selectedGradeFilter.length === availableGrades.length
                    ? []
                    : availableGrades.map((g) => g.toString())
                )
              }
              className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-all ${
                selectedGradeFilter.length === availableGrades.length
                  ? 'bg-gradient-to-r from-blue-800 to-blue-900 text-white border-blue-900'
                  : 'bg-white text-blue-900 border-blue-100 hover:border-blue-300'
              }`}
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              {selectedGradeFilter.length === availableGrades.length
                ? 'Clear'
                : 'Select All'}
            </button>
            {availableGrades.map((gradeLevel) => {
              const gradeStr = gradeLevel.toString()
              const isSelected = selectedGradeFilter.includes(gradeStr)
              return (
                <button
                  key={gradeLevel}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedGradeFilter((prev) =>
                        prev.filter((id) => id !== gradeStr)
                      )
                    } else {
                      setSelectedGradeFilter((prev) => [...prev, gradeStr])
                    }
                  }}
                  className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-blue-800 to-blue-900 text-white border-blue-900 shadow-md shadow-blue-900/30'
                      : 'bg-white text-blue-900 border-blue-100 hover:border-blue-300'
                  }`}
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Grade {gradeLevel}
                </button>
              )
            })}
          </div>
        </div>

        <div className="bg-white/95 border border-dashed border-blue-200 rounded-2xl text-center px-8 py-10 shadow-sm">
          <div className="w-20 h-20 aspect-square rounded-2xl bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <BookOpen size={32} className="text-white" weight="fill" />
          </div>
          <h3
            className="text-sm font-medium text-gray-900 mb-2"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            {assignments.length === 0
              ? 'No Class Assignments Yet'
              : 'No Classes Match Your Search'}
          </h3>
          <p
            className="text-sm text-gray-600 mb-6"
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            {assignments.length === 0
              ? "You haven't been assigned to any subjects yet. Please coordinate with the registrar."
              : 'Try refining your search keywords or adjusting the grade filters.'}
          </p>
          {assignments.length > 0 && (
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedGradeFilter([])
              }}
              className="px-5 py-2.5 text-sm font-medium rounded-xl bg-gradient-to-r from-blue-800 to-blue-900 text-white shadow-md shadow-blue-900/30 focus:outline-none focus:ring-2 focus:ring-blue-900/40"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1
              className="text-2xl font-light text-white flex items-center gap-2"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              <div className="w-8 h-8 aspect-square bg-white rounded-xl flex items-center justify-center">
                <BookOpen size={20} weight="fill" className="text-blue-900" />
              </div>
              My Classes ({filteredAssignments.length})
            </h1>
            <p
              className="text-xs text-blue-100 mt-1"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              View your assigned subjects and sections
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!loadingTeacherDetails) {
                setShowPrintScheduleModal(true)
              }
            }}
            disabled={loadingTeacherDetails}
            className={`inline-flex items-center gap-2 rounded-lg border border-white/40 px-4 py-2 text-sm font-medium transition-colors ${
              loadingTeacherDetails
                ? 'bg-white/10 text-white/60 cursor-not-allowed'
                : 'bg-white text-blue-900 hover:bg-blue-50'
            }`}
            style={{ fontFamily: 'Poppins', fontWeight: 500 }}
          >
            <Printer size={16} weight="bold" />
            Print Schedule
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <div className="space-y-3 bg-white/80 border border-blue-100 rounded-xl px-4 py-4 shadow-sm">
          <div className="">
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by subject, course, or section..."
              className="w-full px-4 py-2 rounded-lg border border-blue-100 bg-white focus:outline-none focus:ring-2 focus:ring-blue-900/40 text-sm"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            />
          </div>

          <div className="flex flex-col gap-3">
            {availableGrades.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="text-sm text-blue-900/80"
                  style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                >
                  Grade Levels:
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedGradeFilter(
                      selectedGradeFilter.length === availableGrades.length
                        ? []
                        : availableGrades.map((grade) => grade.toString())
                    )
                  }
                  className={`px-3 py-1.5 border rounded-full text-sm transition-colors ${
                    selectedGradeFilter.length === availableGrades.length
                      ? 'bg-blue-900 text-white border-blue-900'
                      : 'bg-white text-blue-900 border-blue-200 hover:border-blue-400'
                  }`}
                  style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                >
                  {selectedGradeFilter.length === availableGrades.length
                    ? 'Clear'
                    : 'Select All'}
                </button>
                {availableGrades.map((gradeLevel) => {
                  const gradeKey = gradeLevel.toString()
                  const isSelected = selectedGradeFilter.includes(gradeKey)
                  return (
                    <button
                      key={gradeLevel}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedGradeFilter((prev) =>
                            prev.filter((value) => value !== gradeKey)
                          )
                        } else {
                          setSelectedGradeFilter((prev) => [...prev, gradeKey])
                        }
                      }}
                      className={`px-3 py-1.5 border rounded-full text-sm transition-colors ${
                        isSelected
                          ? 'bg-blue-900 text-white border-blue-900 shadow shadow-blue-900/30'
                          : 'bg-white text-blue-900 border-blue-200 hover:border-blue-400'
                      }`}
                      style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                    >
                      Grade {gradeLevel}
                    </button>
                  )
                })}
              </div>
            )}

            {availableCourses.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="text-sm text-blue-900/80"
                  style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                >
                  Courses:
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedCourseFilter(
                      selectedCourseFilter.length === availableCourses.length
                        ? []
                        : availableCourses
                    )
                  }
                  className={`px-3 py-1.5 border rounded-full text-sm transition-colors ${
                    selectedCourseFilter.length === availableCourses.length
                      ? 'bg-blue-900 text-white border-blue-900'
                      : 'bg-white text-blue-900 border-blue-200 hover:border-blue-400'
                  }`}
                  style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                >
                  {selectedCourseFilter.length === availableCourses.length
                    ? 'Clear'
                    : 'Select All'}
                </button>
                {availableCourses.map((courseCode) => {
                  const isSelected = selectedCourseFilter.includes(courseCode)
                  return (
                    <button
                      key={courseCode}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedCourseFilter((prev) =>
                            prev.filter((code) => code !== courseCode)
                          )
                        } else {
                          setSelectedCourseFilter((prev) => [
                            ...prev,
                            courseCode,
                          ])
                        }
                      }}
                      className={`px-3 py-1.5 border rounded-full text-sm transition-colors ${
                        isSelected
                          ? 'bg-blue-900 text-white border-blue-900 shadow shadow-blue-900/30'
                          : 'bg-white text-blue-900 border-blue-200 hover:border-blue-400'
                      }`}
                      style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                    >
                      {courseCode}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {(searchQuery ||
        selectedGradeFilter.length > 0 ||
        selectedCourseFilter.length > 0) && (
        <div className="flex items-center flex-wrap gap-2 text-sm text-blue-900/80 bg-white/80 border border-blue-100 rounded-xl px-4 py-2 shadow-sm">
          <span style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
            Showing {filteredAssignments.length} of{' '}
            {Object.keys(groupedAssignments).length} subjects
          </span>
          {searchQuery && (
            <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-900 border border-blue-100">
              Search: "{searchQuery}"
            </span>
          )}
          {selectedGradeFilter.length > 0 && (
            <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-900 border border-blue-100">
              Grades:{' '}
              {selectedGradeFilter.map((grade) => `Grade ${grade}`).join(', ')}
            </span>
          )}
          {selectedCourseFilter.length > 0 && (
            <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-900 border border-blue-100">
              Courses: {selectedCourseFilter.join(', ')}
            </span>
          )}
        </div>
      )}

      <div className="bg-white/95 border border-blue-100 rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-800 to-blue-900 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 aspect-square rounded-xl bg-white/20 flex items-center justify-center">
              <BookOpen size={18} weight="fill" />
            </div>
            <div>
              <p
                className="text-sm uppercase tracking-wide text-white/80"
                style={{ fontFamily: 'monospace', fontWeight: 400 }}
              >
                Subjects Overview
              </p>
              <p
                className="text-sm font-medium"
                style={{ fontFamily: 'monospace', fontWeight: 500 }}
              >
                {filteredAssignments.length} Subject
                {filteredAssignments.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>
          <span
            className="text-sm text-white/80"
            style={{ fontFamily: 'monospace', fontWeight: 300 }}
          >
            {assignments.length} total section assignments
          </span>
        </div>
        <div className="overflow-x-auto font-mono">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-blue-50/80 text-blue-900 text-xs uppercase tracking-wide">
                <th
                  className="px-6 py-3 text-left font-medium border-r border-blue-200"
                  style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 aspect-square rounded-lg bg-blue-900 text-white flex items-center justify-center">
                      <BookOpen size={14} weight="bold" />
                    </span>
                    Subject Details
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left font-medium border-r border-blue-200"
                  style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 aspect-square rounded-lg bg-blue-900 text-white flex items-center justify-center">
                      <Users size={14} weight="bold" />
                    </span>
                    Sections ({assignments.length})
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left font-medium border-r border-blue-200"
                  style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 aspect-square rounded-lg bg-blue-900 text-white flex items-center justify-center">
                      <BookOpen size={14} weight="bold" />
                    </span>
                    Schedule
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-50 bg-white">
              {paginatedAssignments.map(
                ([subjectId, { subject, sections }]) => (
                  <tr
                    key={subjectId}
                    className="hover:bg-blue-50/50 transition-colors"
                  >
                    <td className="px-6 py-5 border-r border-blue-200">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-12 h-12 aspect-square rounded-xl flex items-center justify-center shadow-lg text-white"
                          style={{
                            backgroundColor: getSubjectColor(subject.color),
                          }}
                        >
                          <BookOpen size={18} weight="fill" />
                        </div>
                        <div className="space-y-1">
                          <p
                            className="text-xs font-medium text-gray-900"
                            style={{ fontFamily: 'monospace', fontWeight: 500 }}
                          >
                            {subject.code} — {subject.name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 border-r border-blue-200 align-top">
                      <div className="flex flex-col gap-2">
                        {sections.map((section) => {
                          const studentCount =
                            sectionStudentCounts[section.id] || 0
                          return (
                            <div
                              key={section.id}
                              className="inline-flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/60 px-3 py-2 text-[11px] text-blue-900"
                              style={{
                                fontFamily: 'monospace',
                                fontWeight: 400,
                              }}
                            >
                              <div className="flex flex-col leading-tight">
                                <div className="flex items-center gap-1">
                                  <Users
                                    size={11}
                                    weight="fill"
                                    className="text-blue-900"
                                  />
                                  <span className="text-xs font-medium">
                                    {section.sectionName}
                                  </span>
                                </div>
                                <span className="text-[11px] text-blue-900/80 mt-0.5 flex items-center gap-1">
                                  <GraduationCap
                                    size={10}
                                    weight="fill"
                                    className="text-blue-900"
                                  />
                                  {studentCount} student
                                  {studentCount !== 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-5 border-r border-blue-200 align-top">
                      <div className="flex flex-col gap-2">
                        {sections.map((section) => {
                          const schedule = getSectionSchedule(
                            subject,
                            section.id
                          )

                          const hasTime = schedule.startTime && schedule.endTime
                          const days = schedule.dayOfWeek

                          let dayLabel: string | null = null
                          if (days) {
                            const dayArray: string[] = Array.isArray(days)
                              ? days
                              : [days]

                            const abbrevMap: Record<string, string> = {
                              Monday: 'Mon',
                              Tuesday: 'Tue',
                              Wednesday: 'Wed',
                              Thursday: 'Thu',
                              Friday: 'Fri',
                              Saturday: 'Sat',
                              Sunday: 'Sun',
                            }

                            dayLabel = dayArray
                              .map((d) => abbrevMap[d] || d.slice(0, 3))
                              .join(', ')
                          }

                          if (!hasTime && !dayLabel) {
                            return (
                              <div
                                key={section.id}
                                className="px-3 py-2 rounded-xl border border-dashed border-blue-100 bg-blue-50/40 text-[11px] text-blue-900/70"
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 400,
                                }}
                              >
                                <p>No schedule set</p>
                              </div>
                            )
                          }

                          return (
                            <div
                              key={section.id}
                              className="px-3 py-2 rounded-xl border border-blue-100 bg-blue-50/40 text-[11px] text-blue-900 space-y-1"
                              style={{
                                fontFamily: 'Poppins',
                                fontWeight: 400,
                              }}
                            >
                              {hasTime && (
                                <p className="font-semibold">
                                  {schedule.startTime} - {schedule.endTime}
                                </p>
                              )}
                              {dayLabel && (
                                <p className="text-[11px] text-blue-900/80">
                                  {dayLabel}
                                </p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </td>
                    {/* Students column removed; counts moved into Sections chips */}
                  </tr>
                )
              )}
            </tbody>
          </table>
          {filteredAssignments.length > 0 && (
            <div className="flex flex-col gap-3 px-6 py-4 border-t border-blue-100 bg-white rounded-b-2xl">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <div className="w-3 h-3 aspect-square rounded-md bg-gradient-to-br from-blue-800 to-blue-900"></div>
                <span style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  Showing {startItem} to {endItem} of{' '}
                  {filteredAssignments.length} assignments
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs text-gray-600"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Show:
                  </span>
                  <div
                    className="px-2 py-1 text-xs border border-gray-200 rounded-lg bg-white"
                    style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                  >
                    {ITEMS_PER_PAGE}
                  </div>
                  <span
                    className="text-xs text-gray-600"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    per page
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                      currentPage === 1
                        ? 'bg-white text-gray-400 cursor-not-allowed border border-gray-200'
                        : 'bg-gradient-to-br from-blue-800 to-blue-900 text-white hover:from-blue-900 hover:to-blue-950'
                    }`}
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    <ArrowLeft size={12} />
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {visiblePageNumbers.map((page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => handlePageSelect(page)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                          page === currentPage
                            ? 'bg-gradient-to-br from-blue-800 to-blue-900 text-white'
                            : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-900'
                        }`}
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                      currentPage === totalPages
                        ? 'bg-white text-gray-400 cursor-not-allowed border border-gray-200'
                        : 'bg-gradient-to-br from-blue-800 to-blue-900 text-white hover:from-blue-900 hover:to-blue-950'
                    }`}
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Next
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <TeacherSchedulePrintModal
        isOpen={showPrintScheduleModal}
        onClose={() => setShowPrintScheduleModal(false)}
        teacher={teacherDetails}
        registrarUid=""
      />
    </div>
  )
}
