'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { SubjectData } from '@/lib/subject-database'
import { GradeData } from '@/lib/grade-section-database'
import { SubjectEnrolledList } from './subject-enrolled-list'
import {
  Plus,
  MagnifyingGlass,
  BookOpen,
  Eye,
  Pencil,
  Trash,
  Calculator,
  Gear,
  Atom,
  Globe,
  Monitor,
  Palette,
  MusicNote,
  Book,
  Books,
  Table,
  SquaresFour,
  FunnelSimple,
  X,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Users,
  ArrowsClockwise,
} from '@phosphor-icons/react'

interface SubjectListProps {
  subjects: SubjectData[]
  grades: GradeData[] // Add grades prop for color inheritance
  courses: any[] // Add courses prop for color inheritance
  onEditSubject: (subject: SubjectData) => void
  onDeleteSubject: (subject: SubjectData) => void
  onViewSubject: (subject: SubjectData) => void
  onCreateNew: () => void
  loading?: boolean
  searchQuery?: string
  onSearchChange?: (query: string) => void
  totalSubjectsCount?: number
  selectedGradeId?: string
  onGradeIdChange?: (gradeId: string | undefined) => void
  selectedCourses?: string[]
  onCourseToggle?: (courseCode: string) => void
  registrarName?: string
}

const colorMap = {
  'blue-900': { bg: 'bg-blue-900', name: 'Blue 900' },
  'blue-800': { bg: 'bg-blue-800', name: 'Blue 800' },
  'red-700': { bg: 'bg-red-700', name: 'Red 700' },
  'red-800': { bg: 'bg-red-800', name: 'Red 800' },
  'emerald-700': { bg: 'bg-emerald-700', name: 'Emerald 700' },
  'emerald-800': { bg: 'bg-emerald-800', name: 'Emerald 800' },
  'yellow-700': { bg: 'bg-yellow-700', name: 'Yellow 700' },
  'yellow-800': { bg: 'bg-yellow-800', name: 'Yellow 800' },
  'orange-700': { bg: 'bg-orange-700', name: 'Orange 700' },
  'orange-800': { bg: 'bg-orange-800', name: 'Orange 800' },
  'violet-700': { bg: 'bg-violet-700', name: 'Violet 700' },
  'violet-800': { bg: 'bg-violet-800', name: 'Violet 800' },
  'purple-700': { bg: 'bg-purple-700', name: 'Purple 700' },
  'purple-800': { bg: 'bg-purple-800', name: 'Purple 800' },
  'indigo-700': { bg: 'bg-indigo-700', name: 'Indigo 700' },
  'indigo-800': { bg: 'bg-indigo-800', name: 'Indigo 800' },
}

// Function to get appropriate icon color based on background
const getIconColor = (color: string): string => {
  const colorMap: Record<string, string> = {
    'blue-900': '#1e40af',
    'blue-800': '#1e3a8a',
    'red-700': '#b91c1c',
    'red-800': '#991b1b',
    'emerald-700': '#047857',
    'emerald-800': '#065f46',
    'yellow-700': '#a16207',
    'yellow-800': '#92400e',
    'orange-700': '#c2410c',
    'orange-800': '#9a3412',
    'violet-700': '#7c3aed',
    'violet-800': '#5b21b6',
    'purple-700': '#8b5cf6',
    'purple-800': '#6b21a8',
    'indigo-700': '#4338ca',
    'indigo-800': '#312e81',
  }
  return colorMap[color] || '#1e40af' // Default to blue if color not found
}

// Color mapping for background colors
const getBgColor = (color: string): string => {
  const colorMap: { [key: string]: string } = {
    'blue-900': '#1e40af',
    'red-800': '#991b1b',
    'emerald-800': '#064e3b',
    'yellow-800': '#92400e',
    'orange-800': '#9a3412',
    'violet-800': '#5b21b6',
    'purple-800': '#581c87',
  }
  return colorMap[color] || '#1e40af' // default to blue-900
}

// Get gradient classes for card backgrounds
const getGradientClasses = (color: string): string => {
  const gradientMap: { [key: string]: string } = {
    'blue-900': 'bg-gradient-to-br from-blue-800 to-blue-900',
    'blue-800': 'bg-gradient-to-br from-blue-700 to-blue-800',
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
    'indigo-800': 'bg-gradient-to-br from-indigo-700 to-indigo-800',
    'indigo-700': 'bg-gradient-to-br from-indigo-600 to-indigo-700',
  }
  return gradientMap[color] || 'bg-gradient-to-br from-blue-800 to-blue-900' // default to blue gradient
}

// Get shadow color for cards (returns hex color)
const getShadowColor = (color: string): string => {
  const shadowMap: { [key: string]: string } = {
    'blue-900': '#3b82f6', // blue-500
    'blue-800': '#3b82f6', // blue-500
    'red-800': '#ef4444', // red-500
    'red-700': '#ef4444', // red-500
    'emerald-800': '#10b981', // emerald-500
    'emerald-700': '#10b981', // emerald-500
    'yellow-800': '#eab308', // yellow-500
    'yellow-700': '#eab308', // yellow-500
    'orange-800': '#f97316', // orange-500
    'orange-700': '#f97316', // orange-500
    'violet-800': '#8b5cf6', // violet-500
    'violet-700': '#8b5cf6', // violet-500
    'purple-800': '#a855f7', // purple-500
    'purple-700': '#a855f7', // purple-500
    'indigo-800': '#6366f1', // indigo-500
    'indigo-700': '#6366f1', // indigo-500
  }
  return shadowMap[color] || '#3b82f6' // default to blue-500
}

// Get sorted grades (lowest to highest)
const getSortedGrades = (grades: GradeData[]) => {
  return [...grades].sort((a, b) => a.gradeLevel - b.gradeLevel)
}

// Helper function to format grade level display
const formatGradeLevel = (grade: GradeData): string => {
  if (grade.strand && (grade.gradeLevel === 11 || grade.gradeLevel === 12)) {
    return `G${grade.gradeLevel} ${grade.strand}`
  }
  if (grade.gradeLevel >= 7 && grade.gradeLevel <= 12) {
    return `G${grade.gradeLevel}`
  }
  return `Grade ${grade.gradeLevel}`
}

const formatGradeKeyDisplay = (
  key: string,
  grades: GradeData[]
): { displayName: string; color: string; gradeInfo?: GradeData } => {
  const identifier = key.replace('grade-', '')
  const gradeInfoById = grades.find((grade) => grade.id === identifier)
  if (gradeInfoById) {
    return {
      displayName: formatGradeLevel(gradeInfoById),
      color: gradeInfoById.color || 'blue-900',
      gradeInfo: gradeInfoById,
    }
  }

  const numericLevel = Number(identifier)
  if (!Number.isNaN(numericLevel)) {
    const gradeInfoByLevel = grades.find(
      (grade) => grade.gradeLevel === numericLevel
    )
    if (gradeInfoByLevel) {
      return {
        displayName: formatGradeLevel(gradeInfoByLevel),
        color: gradeInfoByLevel.color || 'blue-900',
        gradeInfo: gradeInfoByLevel,
      }
    }
    return {
      displayName: `Grade ${numericLevel}`,
      color: 'blue-900',
    }
  }

  return {
    displayName: identifier,
    color: 'blue-900',
  }
}

// Function to get appropriate icon based on subject content
const getSubjectIcon = (subject: SubjectData) => {
  const subjectName = subject.name.toLowerCase()
  const subjectCode = subject.code.toLowerCase()

  // Math-related subjects
  if (
    subjectName.includes('math') ||
    subjectName.includes('calculus') ||
    subjectName.includes('algebra') ||
    subjectName.includes('geometry') ||
    subjectName.includes('trigonometry') ||
    subjectName.includes('statistics') ||
    subjectCode.includes('math') ||
    subjectCode.includes('calc')
  ) {
    return Calculator
  }

  // Science-related subjects
  if (
    subjectName.includes('science') ||
    subjectName.includes('physics') ||
    subjectName.includes('chemistry') ||
    subjectName.includes('biology') ||
    subjectName.includes('geology') ||
    subjectName.includes('astronomy') ||
    subjectCode.includes('sci') ||
    subjectCode.includes('phy') ||
    subjectCode.includes('chem') ||
    subjectCode.includes('bio')
  ) {
    return Atom
  }

  // Language/English subjects
  if (
    subjectName.includes('english') ||
    subjectName.includes('language') ||
    subjectName.includes('literature') ||
    subjectName.includes('grammar') ||
    subjectName.includes('reading') ||
    subjectName.includes('writing') ||
    subjectCode.includes('eng') ||
    subjectCode.includes('lang')
  ) {
    return Book
  }

  // Social Studies/History subjects
  if (
    subjectName.includes('history') ||
    subjectName.includes('social') ||
    subjectName.includes('geography') ||
    subjectName.includes('civics') ||
    subjectName.includes('economics') ||
    subjectName.includes('government') ||
    subjectCode.includes('hist') ||
    subjectCode.includes('soc') ||
    subjectCode.includes('geo')
  ) {
    return Globe
  }

  // Computer/Technology subjects
  if (
    subjectName.includes('computer') ||
    subjectName.includes('technology') ||
    subjectName.includes('programming') ||
    subjectName.includes('coding') ||
    subjectName.includes('ict') ||
    subjectName.includes('digital') ||
    subjectCode.includes('comp') ||
    subjectCode.includes('tech') ||
    subjectCode.includes('prog')
  ) {
    return Monitor
  }

  // Art subjects
  if (
    subjectName.includes('art') ||
    subjectName.includes('drawing') ||
    subjectName.includes('painting') ||
    subjectName.includes('visual') ||
    subjectName.includes('design') ||
    subjectCode.includes('art') ||
    subjectCode.includes('draw')
  ) {
    return Palette
  }

  // Music subjects
  if (
    subjectName.includes('music') ||
    subjectName.includes('choir') ||
    subjectName.includes('band') ||
    subjectName.includes('orchestra') ||
    subjectCode.includes('music')
  ) {
    return MusicNote
  }

  // Default icon for other subjects
  return BookOpen
}

// Action Menu Component
const ActionMenu = ({
  subject,
  onViewSubject,
  onEditSubject,
  onDeleteSubject,
  onViewEnrolledList,
}: {
  subject: SubjectData
  onViewSubject: (subject: SubjectData) => void
  onEditSubject: (subject: SubjectData) => void
  onDeleteSubject: (subject: SubjectData) => void
  onViewEnrolledList?: (subject: SubjectData) => void
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

  const handleMenuAction = (action: () => void) => {
    action()
    setIsMenuOpen(false)
  }

  return (
    <div className="relative" ref={menuRef}>
      <Button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        size="sm"
        variant="ghost"
        className="rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
      >
        <Gear size={16} weight="fill" className="text-blue-900" />
      </Button>
      {isMenuOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 shadow-lg rounded-lg z-50">
          <div className="py-1">
            <button
              onClick={() => handleMenuAction(() => onViewSubject(subject))}
              className="w-full px-4 py-2 text-left text-xs hover:bg-gray-100 flex items-center gap-2 rounded-lg"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              <Eye size={14} />
              View Details
            </button>
            {onViewEnrolledList && (
              <button
                onClick={() =>
                  handleMenuAction(() => onViewEnrolledList(subject))
                }
                className="w-full px-4 py-2 text-left text-xs hover:bg-gray-100 flex items-center gap-2 rounded-lg"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                <Users size={14} />
                View Enrolled List
              </button>
            )}
            <button
              onClick={() => handleMenuAction(() => onEditSubject(subject))}
              className="w-full px-4 py-2 text-left text-xs hover:bg-gray-100 flex items-center gap-2 rounded-lg"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              <Pencil size={14} />
              Edit Subject
            </button>
            <button
              onClick={() => handleMenuAction(() => onDeleteSubject(subject))}
              className="w-full px-4 py-2 text-left text-xs hover:bg-red-50 flex items-center gap-2 rounded-lg text-red-700"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              <Trash size={14} />
              Delete Subject
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function SubjectList({
  subjects,
  grades,
  courses = [],
  onEditSubject,
  onDeleteSubject,
  onViewSubject,
  onCreateNew,
  loading = false,
  searchQuery = '',
  onSearchChange = () => {},
  totalSubjectsCount,
  selectedGradeId,
  onGradeIdChange = () => {},
  selectedCourses = [],
  onCourseToggle = () => {},
  registrarName,
}: SubjectListProps) {
  // View mode state - default to 'table'
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table')
  // Filter dropdown state
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  // Student enrollment data state
  const [studentEnrollments, setStudentEnrollments] = useState<
    Record<
      string,
      {
        count: number
        students: Array<{
          userId: string
          studentName: string
          studentSection: string
          studentLevel: string
          studentSemester: string
        }>
      }
    >
  >({})
  const [loadingStudents, setLoadingStudents] = useState<
    Record<string, boolean>
  >({})
  // Sort state - default to most enrolled first
  const [sortBy, setSortBy] = useState<'none' | 'count-asc' | 'count-desc'>(
    'count-desc'
  )
  // Enrolled list modal state
  const [viewingEnrolledList, setViewingEnrolledList] =
    useState<SubjectData | null>(null)
  // Sync state
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)

  // Filter subjects based on search query, grade level, and courses
  const filteredSubjects = useMemo(() => {
    let filtered = subjects

    // Apply search filter
    if (searchQuery.trim()) {
      const searchTerm = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (subject) =>
          subject.name.toLowerCase().includes(searchTerm) ||
          subject.description.toLowerCase().includes(searchTerm)
      )
    }

    // Apply grade filter by grade ID (supports both old and new data structure)
    if (selectedGradeId) {
      filtered = filtered.filter((subject) => {
        // Only show subjects that have the selected gradeId in their gradeIds array
        // Subjects with only gradeLevels (no gradeIds) should NOT appear when a specific strand is selected
        if (
          subject.gradeIds &&
          Array.isArray(subject.gradeIds) &&
          subject.gradeIds.includes(selectedGradeId)
        ) {
          return true
        }

        // If subject has no gradeIds, don't show it when a specific gradeId is selected
        // This prevents subjects from appearing in strand groups they weren't assigned to
        return false
      })
    }

    // Apply course filter
    if (selectedCourses.length > 0) {
      filtered = filtered.filter((subject) => {
        if (subject.courseCodes && Array.isArray(subject.courseCodes)) {
          return selectedCourses.some((courseCode) =>
            subject.courseCodes.includes(courseCode)
          )
        }
        return false
      })
    }

    return filtered
  }, [subjects, searchQuery, selectedGradeId, selectedCourses, grades])

  // Sort filtered subjects based on sort option
  // Use denormalized data from subject.enrolledStudentsCount if available, otherwise use studentEnrollments state
  const sortedAndFilteredSubjects = useMemo(() => {
    let sorted = [...filteredSubjects]

    if (sortBy === 'count-asc' || sortBy === 'count-desc') {
      sorted.sort((a, b) => {
        // Prefer denormalized data from subject document
        const countA =
          a.enrolledStudentsCount ??
          studentEnrollments[a.id]?.count ??
          (Array.isArray(a.enrolledStudents) ? a.enrolledStudents.length : 0) ??
          0
        const countB =
          b.enrolledStudentsCount ??
          studentEnrollments[b.id]?.count ??
          (Array.isArray(b.enrolledStudents) ? b.enrolledStudents.length : 0) ??
          0

        if (sortBy === 'count-asc') {
          return countA - countB
        } else {
          return countB - countA
        }
      })
    }

    return sorted
  }, [filteredSubjects, sortBy, studentEnrollments])

  // Reset to page 1 when filters or sort change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedGradeId, selectedCourses, sortBy])

  // Paginate filtered subjects for table view
  const paginatedSubjects = useMemo(() => {
    if (viewMode !== 'table') return sortedAndFilteredSubjects
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return sortedAndFilteredSubjects.slice(startIndex, endIndex)
  }, [sortedAndFilteredSubjects, currentPage, itemsPerPage, viewMode])

  // Calculate total pages
  const totalPages = Math.ceil(sortedAndFilteredSubjects.length / itemsPerPage)

  // Ensure currentPage is valid
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages)
    }
    if (currentPage < 1 && totalPages > 0) {
      setCurrentPage(1)
    }
  }, [currentPage, totalPages])

  // Sync function to populate enrolledStudents in subject documents
  const handleSync = async () => {
    setSyncing(true)
    setSyncError(null)

    try {
      const response = await fetch('/api/subjects/sync-students', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error(
          `API returned ${response.status}: ${response.statusText}`
        )
      }

      const data = await response.json()

      if (data.success) {
        console.log('[SubjectList] Sync completed:', data.stats)
        // Reload the page to get updated subject data with enrolledStudents
        window.location.reload()
      } else {
        throw new Error(data.error || 'Sync failed')
      }
    } catch (error) {
      console.error('[SubjectList] Error syncing students:', error)
      setSyncError(
        error instanceof Error ? error.message : 'Failed to sync students'
      )
    } finally {
      setSyncing(false)
    }
  }

  // Fetch student enrollment data (only if not using denormalized data)
  useEffect(() => {
    const fetchStudentEnrollments = async () => {
      // Check if subjects already have denormalized enrolledStudents data
      const hasDenormalizedData = sortedAndFilteredSubjects.some(
        (subject) => subject.enrolledStudents !== undefined
      )

      // If denormalized data exists, use it instead of fetching
      if (hasDenormalizedData) {
        // Populate studentEnrollments from denormalized data
        const enrollments: typeof studentEnrollments = {}
        sortedAndFilteredSubjects.forEach((subject) => {
          if (subject.enrolledStudents) {
            enrollments[subject.id] = {
              count:
                subject.enrolledStudentsCount ??
                subject.enrolledStudents.length,
              students: subject.enrolledStudents,
            }
          }
        })
        setStudentEnrollments((prev) => ({ ...prev, ...enrollments }))
        return
      }

      // If sorting by count, use the bulk endpoint (much faster - 1 API call instead of N)
      if (sortBy === 'count-asc' || sortBy === 'count-desc') {
        // Check if we already have counts for all subjects
        const hasAllCounts = sortedAndFilteredSubjects.every(
          (subject) => studentEnrollments[subject.id]?.count !== undefined
        )

        if (hasAllCounts) {
          return // Already fetched
        }

        // Set loading for all subjects
        const loadingMap: Record<string, boolean> = {}
        sortedAndFilteredSubjects.forEach((subject) => {
          if (!studentEnrollments[subject.id]) {
            loadingMap[subject.id] = true
          }
        })
        setLoadingStudents((prev) => ({ ...prev, ...loadingMap }))

        try {
          // Single API call to get counts for ALL subjects at once
          const response = await fetch('/api/subjects/students-counts')

          if (!response.ok) {
            throw new Error(
              `API returned ${response.status}: ${response.statusText}`
            )
          }

          const data = await response.json()

          if (data.success) {
            console.log(
              `[SubjectList] Loaded counts for ${
                Object.keys(data.counts).length
              } subjects in one query${data.cached ? ' (cached)' : ''}`
            )

            // Store ALL counts from API (not just filtered subjects)
            // This way we don't need to refetch when filters change
            const newEnrollments: typeof studentEnrollments = {}

            // Store all counts from the API response
            Object.keys(data.counts).forEach((subjectId) => {
              const count = data.counts[subjectId] || 0
              const students = data.students[subjectId] || []
              newEnrollments[subjectId] = { count, students }
            })

            // Merge with existing data (preserve any we already have)
            setStudentEnrollments((prev) => ({
              ...prev,
              ...newEnrollments,
            }))
          } else {
            console.warn(
              `[SubjectList] API returned success=false:`,
              data.error
            )
          }
        } catch (error) {
          console.error(`[SubjectList] Error fetching subject counts:`, error)
        } finally {
          // Clear loading state
          const clearLoading: Record<string, boolean> = {}
          sortedAndFilteredSubjects.forEach((subject) => {
            clearLoading[subject.id] = false
          })
          setLoadingStudents((prev) => ({ ...prev, ...clearLoading }))
        }
      } else {
        // Not sorting by count - lazy load only visible subjects (per-subject API)
        const subjectsToFetch = paginatedSubjects

        if (subjectsToFetch.length === 0) return

        // Fetch for visible subjects in parallel (per-subject API)
        const fetchPromises = subjectsToFetch.map(async (subject) => {
          // Check if already fetched
          if (studentEnrollments[subject.id] || loadingStudents[subject.id]) {
            return // Already fetched or currently loading
          }

          setLoadingStudents((prev) => ({ ...prev, [subject.id]: true }))

          try {
            const response = await fetch(`/api/subjects/${subject.id}/students`)

            if (!response.ok) {
              throw new Error(
                `API returned ${response.status}: ${response.statusText}`
              )
            }

            const data = await response.json()

            if (data.success) {
              console.log(
                `[SubjectList] Loaded ${data.count} students for subject ${subject.id}`
              )
              setStudentEnrollments((prev) => ({
                ...prev,
                [subject.id]: {
                  count: data.count || 0,
                  students: data.students || [],
                },
              }))
            } else {
              console.warn(
                `[SubjectList] API returned success=false for subject ${subject.id}:`,
                data.error
              )
              setStudentEnrollments((prev) => ({
                ...prev,
                [subject.id]: {
                  count: 0,
                  students: [],
                },
              }))
            }
          } catch (error) {
            console.error(
              `[SubjectList] Error fetching students for subject ${subject.id}:`,
              error
            )
            setStudentEnrollments((prev) => ({
              ...prev,
              [subject.id]: {
                count: 0,
                students: [],
              },
            }))
          } finally {
            setLoadingStudents((prev) => ({ ...prev, [subject.id]: false }))
          }
        })

        await Promise.all(fetchPromises)
      }
    }

    fetchStudentEnrollments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    sortBy === 'count-asc' || sortBy === 'count-desc'
      ? sortedAndFilteredSubjects.map((s) => s.id).join(',')
      : paginatedSubjects.map((s) => s.id).join(','),
    currentPage,
    sortBy,
  ])

  // Group subjects by grade and course (supports both old and new data structure)
  const groupSubjectsByGrade = () => {
    const grouped: { [key: string]: SubjectData[] } = {}

    sortedAndFilteredSubjects.forEach((subject: SubjectData) => {
      // If course filter is active, only group by selected courses
      if (selectedCourses.length > 0) {
        // Only group subjects that have the selected courses
        if (subject.courseCodes && Array.isArray(subject.courseCodes)) {
          selectedCourses.forEach((courseCode: string) => {
            if (subject.courseCodes.includes(courseCode)) {
              const key = `course-${courseCode}`
              if (!grouped[key]) {
                grouped[key] = []
              }
              // Prevent duplicates - check if subject already exists in this group
              if (!grouped[key].some((s) => s.id === subject.id)) {
                grouped[key].push(subject)
              }
            }
          })
        }
      } else {
        // No course filter - group by grade IDs when available
        // Only group by gradeIds - subjects without gradeIds should not appear in specific strand groups
        if (
          subject.gradeIds &&
          Array.isArray(subject.gradeIds) &&
          subject.gradeIds.length > 0
        ) {
          const uniqueGradeIds = Array.from(new Set(subject.gradeIds))
          uniqueGradeIds.forEach((gradeId: string) => {
            const key = `grade-${gradeId}`
            if (!grouped[key]) {
              grouped[key] = []
            }
            if (!grouped[key].some((s) => s.id === subject.id)) {
              grouped[key].push(subject)
            }
          })
        } else if (
          subject.gradeLevels &&
          Array.isArray(subject.gradeLevels) &&
          subject.gradeLevels.length > 0
        ) {
          // This prevents subjects from appearing in specific strand groups when they weren't assigned to those strands
          const uniqueGradeLevels = Array.from(new Set(subject.gradeLevels))
          uniqueGradeLevels.forEach((gradeLevel: number) => {
            const key = `grade-level-${gradeLevel}` // Use different key format to distinguish from gradeIds
            if (!grouped[key]) {
              grouped[key] = []
            }
            if (!grouped[key].some((s) => s.id === subject.id)) {
              grouped[key].push(subject)
            }
          })
        } else if ((subject as any).gradeLevel) {
          // Legacy support for old gradeLevel field
          const key = `grade-level-${(subject as any).gradeLevel}`
          if (!grouped[key]) {
            grouped[key] = []
          }
          if (!grouped[key].some((s) => s.id === subject.id)) {
            grouped[key].push(subject)
          }
        }

        // Handle course codes (only when no course filter is active)
        if (
          subject.courseCodes &&
          Array.isArray(subject.courseCodes) &&
          subject.courseCodes.length > 0
        ) {
          // Deduplicate course codes to prevent adding subject multiple times to same group
          const uniqueCourseCodes = Array.from(new Set(subject.courseCodes))
          uniqueCourseCodes.forEach((courseCode: string) => {
            const key = `course-${courseCode}`
            if (!grouped[key]) {
              grouped[key] = []
            }
            // Prevent duplicates - check if subject already exists in this group
            if (!grouped[key].some((s) => s.id === subject.id)) {
              grouped[key].push(subject)
            }
          })
        }
      }
    })

    return grouped
  }

  // Get grade info for a grade level
  const getGradeInfo = (gradeLevel: number) => {
    return grades.find((grade: GradeData) => grade.gradeLevel === gradeLevel)
  }

  // Get course info for a course code
  const getCourseInfo = (courseCode: string) => {
    return courses.find((course: any) => course.code === courseCode)
  }

  // Get sorted grade levels and course codes
  const getSortedKeys = (): string[] => {
    const grouped = groupSubjectsByGrade()
    const keys = Object.keys(grouped)

    // If course filter is active, only return course keys
    if (selectedCourses.length > 0) {
      const courseKeys = keys.filter((key) => key.startsWith('course-')).sort()
      return courseKeys
    }

    // Handle both grade- (gradeIds) and grade-level- (gradeLevels without gradeIds) keys
    const gradeKeys = keys
      .filter((key) => key.startsWith('grade-'))
      .map((key) => {
        // Check if it's a grade-level- key (for subjects without gradeIds)
        if (key.startsWith('grade-level-')) {
          const numericLevel = Number(key.replace('grade-level-', ''))
          return {
            key,
            gradeLevel: Number.isNaN(numericLevel) ? 0 : numericLevel,
            strand: '',
            isGradeLevelOnly: true, // Flag to indicate this is a grade-level-only group
          }
        }

        // It's a grade- key (for subjects with gradeIds)
        const identifier = key.replace('grade-', '')
        const gradeInfo = grades.find((grade) => grade.id === identifier)
        if (gradeInfo) {
          return {
            key,
            gradeLevel: gradeInfo.gradeLevel,
            strand: gradeInfo.strand || '',
            isGradeLevelOnly: false,
          }
        }

        // Fallback for numeric identifiers (legacy support)
        const numericLevel = Number(identifier)
        return {
          key,
          gradeLevel: Number.isNaN(numericLevel) ? 0 : numericLevel,
          strand: '',
          isGradeLevelOnly: false,
        }
      })
      .sort((a, b) => {
        if (a.gradeLevel !== b.gradeLevel) {
          return a.gradeLevel - b.gradeLevel
        }
        // Grade-level-only groups come after specific strand groups
        if (a.isGradeLevelOnly !== b.isGradeLevelOnly) {
          return a.isGradeLevelOnly ? 1 : -1
        }
        return a.strand.localeCompare(b.strand)
      })
      .map((item) => item.key)

    const courseKeys = keys.filter((key) => key.startsWith('course-')).sort()

    return [...gradeKeys, ...courseKeys]
  }

  const clearFilters = () => {
    onSearchChange('')
    onGradeIdChange(undefined)
    // Clear course filters
    selectedCourses.forEach((courseCode) => onCourseToggle(courseCode))
  }

  // Helper function to get grade/course display for a subject
  const getSubjectGradeDisplay = (subject: SubjectData): string => {
    // Check if subject has course codes (college level)
    if (subject.courseCodes && subject.courseCodes.length > 0) {
      // Show only first 2 courses, then "+X" if there are more
      if (subject.courseCodes.length <= 2) {
        return subject.courseCodes.join(', ')
      } else {
        const remainingCount = subject.courseCodes.length - 2
        return `${subject.courseCodes
          .slice(0, 2)
          .join(', ')} +${remainingCount}`
      }
    }

    // Check for grade IDs (specific grades/strands)
    if (subject.gradeIds && subject.gradeIds.length > 0) {
      const gradeInfo = grades.find((g) => subject.gradeIds.includes(g.id))
      if (gradeInfo) {
        return formatGradeLevel(gradeInfo)
      }
    }

    // Check for grade levels
    if (subject.gradeLevels && subject.gradeLevels.length > 0) {
      const gradeLevel = subject.gradeLevels[0]
      const gradeInfo = grades.find((g) => g.gradeLevel === gradeLevel)
      if (gradeInfo) {
        return formatGradeLevel(gradeInfo)
      }
      return gradeLevel >= 7 && gradeLevel <= 12
        ? `G${gradeLevel}`
        : `Grade ${gradeLevel}`
    }

    // Legacy support for old gradeLevel field
    if ((subject as any).gradeLevel) {
      const gradeLevel = (subject as any).gradeLevel
      const gradeInfo = grades.find((g) => g.gradeLevel === gradeLevel)
      if (gradeInfo) {
        return formatGradeLevel(gradeInfo)
      }
      return gradeLevel >= 7 && gradeLevel <= 12
        ? `G${gradeLevel}`
        : `Grade ${gradeLevel}`
    }

    return 'N/A'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 animate-pulse rounded"></div>
            <div className="space-y-2">
              <div className="h-6 bg-gray-200 animate-pulse rounded w-48"></div>
              <div className="h-4 bg-gray-100 animate-pulse rounded w-64"></div>
            </div>
          </div>
        </div>

        {viewMode === 'table' ? (
          <div className="border border-gray-200 rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-br from-blue-800 to-blue-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-blue-800">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-blue-800">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-blue-800">
                      Grade/Course
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-blue-800">
                      Total Units
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {[...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 rounded w-12"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg"></div>
                          <div className="w-8 h-8 bg-gray-100 rounded-lg"></div>
                          <div className="w-8 h-8 bg-gray-100 rounded-lg"></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="p-6 bg-white border border-gray-200 rounded-xl flex-[1_1_min(100%,_350px)]"
              >
                <div className="animate-pulse space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-full"></div>
                    <div className="h-4 bg-gray-100 rounded w-2/3"></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="h-4 bg-gray-100 rounded w-20"></div>
                    <div className="flex space-x-2">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg"></div>
                      <div className="w-8 h-8 bg-gray-100 rounded-lg"></div>
                      <div className="w-8 h-8 bg-gray-100 rounded-lg"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="bg-white p-6 border border-gray-200 rounded-xl shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search subjects..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pr-4 py-2 w-full border-blue-900 rounded-lg"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* View Toggle Buttons */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                  viewMode === 'table'
                    ? 'bg-blue-900 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-200'
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
              <button
                onClick={() => setViewMode('card')}
                className={`px-3 py-1.5 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                  viewMode === 'card'
                    ? 'bg-blue-900 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-200'
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
            </div>

            {/* Sync Button */}
            <div className="relative">
              <button
                onClick={handleSync}
                disabled={syncing}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-2 ${
                  syncing
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-900'
                }`}
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                title="Sync enrolled students data (this may take a while)"
              >
                <ArrowsClockwise
                  size={16}
                  weight="bold"
                  className={syncing ? 'animate-spin' : ''}
                />
                <span>{syncing ? 'Syncing...' : 'Sync'}</span>
              </button>
              {syncError && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-red-50 border border-red-200 rounded-lg p-2 text-xs text-red-700 z-50">
                  {syncError}
                </div>
              )}
            </div>

            {/* Filter Button */}
            <div className="relative">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-2 ${
                  selectedGradeId || selectedCourses.length > 0 || sortBy !== 'none'
                    ? 'bg-gradient-to-br from-blue-800 to-blue-900 text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-900'
                }`}
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                <FunnelSimple size={16} weight="bold" />
                Filter
                {(selectedGradeId || selectedCourses.length > 0 || sortBy !== 'none') && (
                  <span className="w-2 h-2 bg-white rounded-full"></span>
                )}
              </button>

              {/* Filter Dropdown */}
              {showFilterDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowFilterDropdown(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-96 bg-white border border-gray-200 shadow-lg rounded-xl z-20 p-6">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3
                          className="text-sm font-medium text-gray-900"
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                        >
                          Filter Options
                        </h3>
                        <button
                          onClick={() => setShowFilterDropdown(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      {/* Grade Level Filter */}
                      <div>
                        <Label
                          className="text-xs text-gray-700 mb-3 block"
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                        >
                          Grade Level
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => onGradeIdChange(undefined)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                              !selectedGradeId
                                ? 'bg-gradient-to-br from-blue-800 to-blue-900 text-white shadow-md'
                                : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-900'
                            }`}
                            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                          >
                            All Grades
                          </button>
                          {getSortedGrades(grades).map((grade) => {
                            const isSelected = selectedGradeId === grade.id
                            let displayText = ''
                            if (
                              grade.strand &&
                              (grade.gradeLevel === 11 ||
                                grade.gradeLevel === 12)
                            ) {
                              displayText = `G${grade.gradeLevel} ${grade.strand}`
                            } else if (
                              grade.gradeLevel >= 7 &&
                              grade.gradeLevel <= 12
                            ) {
                              displayText = `G${grade.gradeLevel}`
                            } else {
                              displayText = `Grade ${grade.gradeLevel}`
                            }
                            return (
                              <button
                                key={grade.id}
                                onClick={() =>
                                  onGradeIdChange(
                                    isSelected ? undefined : grade.id
                                  )
                                }
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                                  isSelected
                                    ? 'text-white shadow-md'
                                    : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-900'
                                }`}
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 400,
                                  ...(isSelected && {
                                    backgroundColor: getBgColor(grade.color),
                                    borderColor: getBgColor(grade.color),
                                  }),
                                }}
                                title={displayText}
                              >
                                {displayText}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* College Courses Filter */}
                      {courses.length > 0 && (
                        <div>
                          <Label
                            className="text-xs text-gray-700 mb-3 block"
                            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                          >
                            College Courses
                          </Label>
                          <div className="flex flex-wrap gap-2">
                            {courses.map((course: any) => {
                              const isSelected = selectedCourses.includes(
                                course.code
                              )
                              const courseColor = course.color || 'emerald-800'
                              return (
                                <button
                                  key={course.code}
                                  onClick={() => onCourseToggle(course.code)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                                    isSelected
                                      ? 'text-white shadow-md'
                                      : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-900'
                                  }`}
                                  style={{
                                    fontFamily: 'Poppins',
                                    fontWeight: 400,
                                    ...(isSelected && {
                                      backgroundColor: getBgColor(courseColor),
                                      borderColor: getBgColor(courseColor),
                                    }),
                                  }}
                                >
                                  {course.code}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Sort Options */}
                      <div>
                        <Label
                          className="text-xs text-gray-700 mb-3 block"
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                        >
                          Sort By Enrollment
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setSortBy('none')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-2 ${
                              sortBy === 'none'
                                ? 'bg-gradient-to-br from-blue-800 to-blue-900 text-white shadow-md'
                                : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-900'
                            }`}
                            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                          >
                            Default
                          </button>
                          <button
                            onClick={() => setSortBy('count-desc')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-2 ${
                              sortBy === 'count-desc'
                                ? 'bg-gradient-to-br from-blue-800 to-blue-900 text-white shadow-md'
                                : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-900'
                            }`}
                            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                          >
                            <ArrowDown size={14} weight="bold" />
                            Most Enrolled
                          </button>
                          <button
                            onClick={() => setSortBy('count-asc')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-2 ${
                              sortBy === 'count-asc'
                                ? 'bg-gradient-to-br from-blue-800 to-blue-900 text-white shadow-md'
                                : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-900'
                            }`}
                            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                          >
                            <ArrowUp size={14} weight="bold" />
                            Least Enrolled
                          </button>
                        </div>
                      </div>

                      {/* Clear Filters */}
                      {(selectedGradeId || selectedCourses.length > 0 || sortBy !== 'none') && (
                        <button
                          onClick={() => {
                            clearFilters()
                            setSortBy('none')
                            setShowFilterDropdown(false)
                          }}
                          className="w-full px-3 py-2 text-xs text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                        >
                          Clear All Filters
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <Button
              onClick={onCreateNew}
              className="rounded-lg bg-gradient-to-br from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 text-white border"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              <Plus size={16} className="mr-2" />
              Add Subject
            </Button>
          </div>
        </div>
      </div>

      {/* Subject Display - Table or Card View */}
      {filteredSubjects.length === 0 ? (
        <Card className="w-full max-w-md mx-auto p-8 border border-gray-200 text-center bg-white border-1 shadow-sm rounded-xl">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-800 to-blue-900 rounded-xl flex items-center justify-center mx-auto mb-4">
            <BookOpen size={32} className="text-white" weight="fill" />
          </div>
          <h3
            className="text-lg font-medium text-gray-900 mb-2"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            No subjects found
          </h3>
          <p
            className="text-blue-900 text-sm text-justify w-full border-1 shadow-sm border-blue-900 p-3 bg-white rounded-xl mb-4"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            {searchQuery || selectedGradeId
              ? "Try adjusting your search or grade filter to find what you're looking for."
              : 'Get started by creating your first subject! Set up engaging learning materials, define clear objectives, and start building a comprehensive curriculum that students will love.'}
          </p>
          <Button
            onClick={onCreateNew}
            className="rounded-lg bg-gradient-to-br from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 w-full text-white border transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-lg"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            <Plus
              size={20}
              className="mr-2 transition-transform duration-300 hover:rotate-90"
            />
            Create Your First Subject
          </Button>
        </Card>
      ) : viewMode === 'table' ? (
        // Table View
        <Card className="border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-br from-blue-800 to-blue-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-blue-800">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-blue-800">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-blue-800">
                    Grade/Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-blue-800">
                    Total Units
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-blue-800">
                    Enrolled Students
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedSubjects.map((subject) => {
                  const IconComponent = getSubjectIcon(subject)
                  const totalUnits = subject.lectureUnits + subject.labUnits
                  const gradeDisplay = getSubjectGradeDisplay(subject)

                  return (
                    <tr
                      key={subject.id}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{
                              backgroundColor: getBgColor(subject.color),
                            }}
                          >
                            <IconComponent
                              size={16}
                              className="text-white"
                              weight="fill"
                            />
                          </div>
                          <span
                            className="text-sm font-medium text-gray-900"
                            style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                          >
                            {subject.code}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="text-sm text-gray-900"
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                        >
                          {subject.name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="text-sm text-gray-700"
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                        >
                          {gradeDisplay}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calculator
                            size={14}
                            className="text-gray-500"
                            weight="duotone"
                          />
                          <span
                            className="text-sm text-gray-700"
                            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                          >
                            {totalUnits}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {subject.enrolledStudents !== undefined ? (
                            // Denormalized data available
                            <>
                              <Users
                                size={14}
                                weight="bold"
                                className="text-blue-900"
                              />
                              <span
                                className="text-sm text-gray-900"
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 400,
                                }}
                              >
                                {subject.enrolledStudentsCount ??
                                  (Array.isArray(subject.enrolledStudents)
                                    ? subject.enrolledStudents.length
                                    : 0)}
                              </span>
                            </>
                          ) : loadingStudents[subject.id] ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
                              <span
                                className="text-xs text-gray-500"
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 300,
                                }}
                              >
                                Loading...
                              </span>
                            </div>
                          ) : (
                            <>
                              <Users
                                size={16}
                                className="text-blue-900"
                                weight="duotone"
                              />
                              <span
                                className="text-sm text-gray-900"
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 400,
                                }}
                              >
                                {studentEnrollments[subject.id]?.count || 0}
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <ActionMenu
                          subject={subject}
                          onViewSubject={onViewSubject}
                          onEditSubject={onEditSubject}
                          onDeleteSubject={onDeleteSubject}
                          onViewEnrolledList={(subject) =>
                            setViewingEnrolledList(subject)
                          }
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between px-5 py-4 bg-white/90 border-t border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-md bg-blue-900/80"></div>
                <span
                  className="text-xs text-gray-600"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                  {Math.min(
                    currentPage * itemsPerPage,
                    sortedAndFilteredSubjects.length
                  )}{' '}
                  of {sortedAndFilteredSubjects.length} subjects
                </span>
              </div>

              <nav
                className="flex flex-wrap items-center justify-end gap-2"
                aria-label="Subject pagination"
              >
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  className={`rounded-lg text-xs font-medium px-3 py-2 transition-all duration-200 flex items-center gap-1 border border-gray-200 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                    currentPage === 1
                      ? 'bg-gray-50 text-gray-400'
                      : 'bg-white text-blue-900 hover:-translate-y-0.5'
                  }`}
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  aria-label="Previous page"
                >
                  <ArrowLeft size={14} />
                  Previous
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 7) {
                      pageNum = i + 1
                    } else if (currentPage <= 4) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 3) {
                      pageNum = totalPages - 6 + i
                    } else {
                      pageNum = currentPage - 3 + i
                    }
                    return pageNum
                  }).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`rounded-lg text-xs font-medium px-3 py-2 transition-all duration-200 border ${
                        currentPage === pageNum
                          ? 'border-blue-900 bg-blue-900 text-white shadow-lg shadow-blue-900/30'
                          : 'border-gray-200 bg-white text-blue-900 hover:border-blue-300 hover:-translate-y-0.5'
                      }`}
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      aria-current={
                        currentPage === pageNum ? 'page' : undefined
                      }
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  className={`rounded-lg text-xs font-medium px-3 py-2 transition-all duration-200 flex items-center gap-1 border border-gray-200 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                    currentPage === totalPages
                      ? 'bg-gray-50 text-gray-400'
                      : 'bg-white text-blue-900 hover:-translate-y-0.5'
                  }`}
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  aria-label="Next page"
                >
                  Next
                  <ArrowRight size={14} />
                </button>
              </nav>
            </div>
          )}
        </Card>
      ) : (
        // Card View (existing grouped card view)
        <div className="space-y-8">
          {getSortedKeys().map((key, keyIndex) => {
            // Apply sorting to grade subjects if sort by count is active
            let gradeSubjects = groupSubjectsByGrade()[key]
            if (
              (sortBy === 'count-asc' || sortBy === 'count-desc') &&
              gradeSubjects
            ) {
              gradeSubjects = [...gradeSubjects].sort((a, b) => {
                const countA = studentEnrollments[a.id]?.count || 0
                const countB = studentEnrollments[b.id]?.count || 0
                if (sortBy === 'count-asc') {
                  return countA - countB
                } else {
                  return countB - countA
                }
              })
            }

            // Determine if this is a grade level or course code
            const isGradeLevel = key.startsWith('grade-')
            const isGradeLevelOnly = key.startsWith('grade-level-') // Subjects with only gradeLevels (no gradeIds)
            const isCourseCode = key.startsWith('course-')

            let displayName = ''
            let gradeColor = 'blue-900'
            let gradeInfoForDescription: GradeData | undefined

            if (isGradeLevelOnly) {
              const gradeLevel = Number(key.replace('grade-level-', ''))
              if (!Number.isNaN(gradeLevel)) {
                displayName = `G${gradeLevel}`
                // Try to find a grade with this level to get color, otherwise use default
                const gradeWithLevel = grades.find(
                  (g) => g.gradeLevel === gradeLevel
                )
                gradeColor = gradeWithLevel?.color || 'blue-900'
              } else {
                displayName = key.replace('grade-level-', '')
              }
            } else if (isGradeLevel) {
              const gradeMeta = formatGradeKeyDisplay(key, grades)
              displayName = gradeMeta.displayName
              gradeColor = gradeMeta.color
              gradeInfoForDescription = gradeMeta.gradeInfo
            } else if (isCourseCode) {
              const courseCode = key.replace('course-', '')
              const courseInfo = getCourseInfo(courseCode)
              displayName = courseCode
              gradeColor = courseInfo?.color || 'emerald-800' // Use course color from database
            }

            return (
              <div
                key={key}
                className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                style={{ animationDelay: `${keyIndex * 150}ms` }}
              >
                {/* Grade/Course Header */}
                <div className="mb-6">
                  <div className="flex items-center space-x-3 mb-2">
                    <div
                      className="w-4 h-4 opacity-60"
                      style={{ backgroundColor: getBgColor(gradeColor) }}
                    ></div>
                    <div
                      className="w-4 h-4 opacity-80"
                      style={{ backgroundColor: getBgColor(gradeColor) }}
                    ></div>
                    <div
                      className="w-4 h-4"
                      style={{ backgroundColor: getBgColor(gradeColor) }}
                    ></div>
                    <hr
                      className="w-full border-1 shadow-sm"
                      style={{ borderColor: getBgColor(gradeColor) }}
                    />

                    <h2
                      className="text-xl font-semibold text-gray-900"
                      style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                    >
                      {displayName}
                    </h2>
                  </div>
                  {isGradeLevelOnly && (
                    <p
                      className="text-sm text-gray-600 ml-7 leading-relaxed text-justify"
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      Subjects applicable to all tracks at this grade level
                    </p>
                  )}
                  {isGradeLevel &&
                    !isGradeLevelOnly &&
                    gradeInfoForDescription?.description && (
                      <p
                        className="text-sm text-gray-600 ml-7 leading-relaxed text-justify"
                        style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                      >
                        {gradeInfoForDescription.description}
                      </p>
                    )}
                  {isCourseCode && (
                    <p
                      className="text-sm text-gray-600 ml-7 leading-relaxed text-justify"
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      Subjects applicable to {key.replace('course-', '')}{' '}
                      students
                    </p>
                  )}
                </div>

                {/* Subjects Grid for this Grade */}
                <div className="flex flex-wrap gap-4 ml-7">
                  {gradeSubjects && gradeSubjects.length > 0 ? (
                    gradeSubjects.map((subject, subjectIndex) => (
                      <Card
                        key={`${key}-${subject.id}`}
                        className={`group p-6 border-none hover:-translate-y-2 transition-all duration-300 ease-in-out border-1 shadow-lg text-white transform hover:scale-105 animate-in fade-in slide-in-from-bottom-4 h-full flex flex-col rounded-xl flex-[1_1_min(100%,_350px)] ${getGradientClasses(
                          subject.color
                        )}`}
                        style={{
                          animationDelay: `${
                            keyIndex * 150 + subjectIndex * 75 + 200
                          }ms`,
                          animationFillMode: 'both',
                          boxShadow: `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), 0 0 0 1px ${getShadowColor(
                            subject.color
                          )}40`,
                        }}
                        onMouseEnter={(e) => {
                          const shadowColor = getShadowColor(subject.color)
                          e.currentTarget.style.boxShadow = `0 25px 50px -12px ${shadowColor}80, 0 0 0 1px ${shadowColor}40`
                        }}
                        onMouseLeave={(e) => {
                          const shadowColor = getShadowColor(subject.color)
                          e.currentTarget.style.boxShadow = `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), 0 0 0 1px ${shadowColor}40`
                        }}
                      >
                        {/* Card Header */}
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                            {(() => {
                              const IconComponent = getSubjectIcon(subject)
                              return (
                                <IconComponent
                                  size={32}
                                  style={{ color: getIconColor(subject.color) }}
                                  weight="fill"
                                />
                              )
                            })()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h3
                                className="text-lg font-medium text-white"
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 500,
                                }}
                              >
                                {subject.code}
                              </h3>
                              <div className="flex gap-1">
                                <div className="w-3 h-3 bg-white"></div>
                                <div className="w-3 h-3 bg-white/80"></div>
                                <div className="w-3 h-3 bg-white/60"></div>
                              </div>
                            </div>

                            {/* Units badge */}
                            <div className="flex items-center gap-2">
                              <div className="flex items-center px-2 py-1 text-xs font-medium rounded-lg border border-white/30 bg-white/20 text-white">
                                <Calculator
                                  size={12}
                                  className="mr-1"
                                  weight="duotone"
                                />
                                {subject.lectureUnits + subject.labUnits} units
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Content Section - Flexible height */}
                        <div className="flex-1 flex flex-col">
                          {/* Subject Name and Description */}
                          <div className="mb-4">
                            <h4
                              className="text-white text-sm font-medium mb-1"
                              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                            >
                              {subject.code} {subject.name}
                            </h4>
                            <div
                              className="text-white/70 text-xs mb-2"
                              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                            >
                              Lab: {subject.labUnits}, Lecture:{' '}
                              {subject.lectureUnits}
                            </div>
                            <div
                              className="text-white/80 leading-relaxed text-sm"
                              style={{
                                fontFamily: 'Poppins',
                                fontWeight: 300,
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                minHeight: '3.6rem', // Ensure consistent height for 3 lines
                              }}
                            >
                              {subject.description}
                            </div>
                          </div>

                          {/* Action Buttons - Fixed at bottom */}
                          <div className="mt-auto">
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onViewSubject(subject)}
                                className="bg-white hover:bg-white/90 justify-center text-xs transition-all duration-200 hover:scale-105 active:scale-95 flex-1 rounded-lg"
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 400,
                                  color: getIconColor(subject.color),
                                }}
                              >
                                <Eye
                                  size={14}
                                  className="mr-1"
                                  weight="fill"
                                  style={{ color: getIconColor(subject.color) }}
                                />
                                Details
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEditSubject(subject)}
                                className="bg-white hover:bg-white/90 justify-center text-xs transition-all duration-200 hover:scale-105 active:scale-95 flex-1 rounded-lg"
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 400,
                                  color: getIconColor(subject.color),
                                }}
                              >
                                <Pencil
                                  size={14}
                                  className="mr-1"
                                  weight="fill"
                                  style={{ color: getIconColor(subject.color) }}
                                />
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDeleteSubject(subject)}
                                className="bg-white hover:bg-white/90 justify-center text-xs transition-all duration-200 hover:scale-105 active:scale-95 flex-1 rounded-lg"
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 400,
                                  color: getIconColor(subject.color),
                                }}
                              >
                                <Trash
                                  size={14}
                                  className="mr-1"
                                  weight="fill"
                                  style={{ color: getIconColor(subject.color) }}
                                />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-8 text-white/70">
                      <BookOpen
                        size={32}
                        className="mx-auto mb-2"
                        weight="duotone"
                      />
                      <p style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                        No subjects found for this grade level
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Enrolled List Modal */}
      <SubjectEnrolledList
        subject={viewingEnrolledList}
        registrarName={registrarName}
        isOpen={viewingEnrolledList !== null}
        onClose={() => setViewingEnrolledList(null)}
      />
    </div>
  )
}
