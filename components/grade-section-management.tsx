'use client'

import { useState, useEffect, useMemo } from 'react'
import { toast } from 'react-toastify'
import GradeForm from '@/components/grade-form'
import SectionForm from '@/components/section-form'
import GradeList from '@/components/grade-list'
import SectionList from '@/components/section-list'
import { LoaderOverlay } from '@/components/loader-overlay'
import { Modal } from '@/components/ui/modal'
import {
  GradeData,
  SectionData,
  DEPARTMENTS,
  SECTION_RANKS,
} from '@/lib/types/grade-section'
import { CourseData } from '@/lib/types/course'
import { useAuth } from '@/lib/auth-context'
import {
  Trash,
  X,
  Warning,
  Check,
  Eye,
  GraduationCap,
  Users,
  MemberOfIcon,
} from '@phosphor-icons/react'

const GradeSectionSkeleton = () => {
  return (
    <div className="p-6 space-y-6" style={{ fontFamily: 'Poppins' }}>
      <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl p-6 space-y-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/30" />
            <div className="space-y-2">
              <div className="h-5 bg-white/60 rounded w-44" />
              <div className="h-3 bg-white/40 rounded w-64" />
            </div>
          </div>
          <div className="h-10 w-40 rounded-lg bg-white/30" />
        </div>
        <div className="flex gap-2">
          {[1, 2].map((toggle) => (
            <div
              key={`view-toggle-${toggle}`}
              className="h-9 flex-1 rounded-lg bg-white/20"
            />
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {[1, 2].map((list) => (
          <div
            key={`gs-list-${list}`}
            className="rounded-xl border border-blue-100 bg-white shadow-sm p-4 space-y-3 animate-pulse"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-100" />
              <div className="h-4 rounded bg-gray-100 w-32" />
            </div>
            {[1, 2, 3, 4].map((row) => (
              <div
                key={`gs-row-${list}-${row}`}
                className="h-12 rounded-lg bg-gray-50"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

interface GradeSectionManagementProps {
  registrarUid: string
}

type ViewMode = 'grades' | 'sections'

export default function GradeSectionManagement({
  registrarUid,
}: GradeSectionManagementProps) {
  const [grades, setGrades] = useState<GradeData[]>([])
  const [courses, setCourses] = useState<CourseData[]>([])
  const [sections, setSections] = useState<SectionData[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grades')

  // Grade management states
  const [showCreateGradeModal, setShowCreateGradeModal] = useState(false)
  const [showEditGradeModal, setShowEditGradeModal] = useState(false)
  const [showDeleteGradeModal, setShowDeleteGradeModal] = useState(false)
  const [editingGrade, setEditingGrade] = useState<GradeData | null>(null)
  const [deletingGrade, setDeletingGrade] = useState<GradeData | null>(null)

  // Section management states
  const [showCreateSectionModal, setShowCreateSectionModal] = useState(false)
  const [showEditSectionModal, setShowEditSectionModal] = useState(false)
  const [showDeleteSectionModal, setShowDeleteSectionModal] = useState(false)
  const [editingSection, setEditingSection] = useState<SectionData | null>(null)
  const [deletingSection, setDeletingSection] = useState<SectionData | null>(
    null
  )

  // View modals
  const [showViewGradeModal, setShowViewGradeModal] = useState(false)
  const [showViewSectionModal, setShowViewSectionModal] = useState(false)
  const [viewingGrade, setViewingGrade] = useState<GradeData | null>(null)
  const [viewingSection, setViewingSection] = useState<SectionData | null>(null)

  // Search and filters
  const [gradeSearchQuery, setGradeSearchQuery] = useState('')
  const [sectionSearchQuery, setSectionSearchQuery] = useState('')
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([])
  const [selectedRanks, setSelectedRanks] = useState<string[]>([])
  const [selectedGrades, setSelectedGrades] = useState<string[]>([])
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])

  const [countdown, setCountdown] = useState(5)
  const [isConfirmed, setIsConfirmed] = useState(false)
  const { user } = useAuth()

  // Load data on component mount
  useEffect(() => {
    loadGrades()
    loadCourses()
    loadSections()
  }, [])

  // Countdown timer for delete confirmation
  useEffect(() => {
    let timer: NodeJS.Timeout
    if ((showDeleteGradeModal || showDeleteSectionModal) && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    }
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [showDeleteGradeModal, showDeleteSectionModal, countdown])

  // Filter grades based on search query and selected departments
  const filteredGrades = useMemo(() => {
    let filtered = grades

    // Apply search filter
    if (gradeSearchQuery.trim()) {
      const searchTerm = gradeSearchQuery.toLowerCase()
      filtered = filtered.filter(
        (grade) =>
          grade.gradeLevel.toString().includes(searchTerm) ||
          grade.description.toLowerCase().includes(searchTerm) ||
          grade.department.toLowerCase().includes(searchTerm)
      )
    }

    // Apply department filter
    if (selectedDepartments.length > 0) {
      filtered = filtered.filter((grade) =>
        selectedDepartments.includes(grade.department)
      )
    }

    return filtered
  }, [grades, gradeSearchQuery, selectedDepartments])

  const totalJuniorHighGrades = useMemo(() => {
    return grades.filter(
      (grade) => grade.gradeLevel >= 7 && grade.gradeLevel <= 10
    ).length
  }, [grades])

  // Filter sections based on search query and selected ranks
  const filteredSections = useMemo(() => {
    let filtered = sections

    // Apply search filter
    if (sectionSearchQuery.trim()) {
      const searchTerm = sectionSearchQuery.toLowerCase()
      filtered = filtered.filter(
        (section) =>
          section.sectionName.toLowerCase().includes(searchTerm) ||
          section.grade.toLowerCase().includes(searchTerm) ||
          section.description.toLowerCase().includes(searchTerm)
      )
    }

    // Apply department filter
    if (selectedDepartments.length > 0) {
      filtered = filtered.filter((section) =>
        selectedDepartments.includes(section.department)
      )
    }

    // Apply rank filter
    if (selectedRanks.length > 0) {
      filtered = filtered.filter((section) =>
        selectedRanks.includes(section.rank)
      )
    }

    // Filter by grades and courses - show sections that match the selected filters
    if (selectedGrades.length > 0 || selectedCourses.length > 0) {
      filtered = filtered.filter((section) => {
        // If section has a gradeId
        if (section.gradeId) {
          // Show if grades are selected and this grade is included
          return (
            selectedGrades.length > 0 &&
            selectedGrades.includes(section.gradeId)
          )
        }

        // If section has a courseId
        if (section.courseId) {
          // Show if courses are selected and this course is included
          return (
            selectedCourses.length > 0 &&
            selectedCourses.includes(section.courseId)
          )
        }

        return false
      })
    }

    return filtered
  }, [
    sections,
    sectionSearchQuery,
    selectedDepartments,
    selectedRanks,
    selectedGrades,
    selectedCourses,
  ])

  // Handle filter toggles
  const handleDepartmentToggle = (department: string) => {
    setSelectedDepartments((prev) => {
      if (prev.includes(department)) {
        return prev.filter((d) => d !== department)
      } else {
        return [...prev, department]
      }
    })
  }

  const handleRankToggle = (rank: string) => {
    setSelectedRanks((prev) => {
      if (prev.includes(rank)) {
        return prev.filter((r) => r !== rank)
      } else {
        return [...prev, rank]
      }
    })
  }

  const handleGradeToggle = (gradeId: string) => {
    setSelectedGrades((prev) => {
      if (prev.includes(gradeId)) {
        return prev.filter((id) => id !== gradeId)
      } else {
        return [...prev, gradeId]
      }
    })
  }

  const handleCourseToggle = (courseId: string) => {
    setSelectedCourses((prev) => {
      if (prev.includes(courseId)) {
        return prev.filter((id) => id !== courseId)
      } else {
        return [...prev, courseId]
      }
    })
  }

  // Load data functions
  const loadGrades = async () => {
    try {
      const response = await fetch('/api/grades')
      if (!response.ok) {
        throw new Error('Failed to load grades')
      }
      const data = await response.json()
      setGrades(data.grades || [])
    } catch (error: any) {
      setError('Failed to load grades: ' + error.message)
    }
  }

  const loadCourses = async () => {
    try {
      const response = await fetch('/api/courses')
      if (!response.ok) {
        throw new Error('Failed to load courses')
      }
      const data = await response.json()
      setCourses(data.courses || [])
    } catch (error: any) {
      console.error('Failed to load courses:', error.message)
    }
  }

  const loadSections = async () => {
    try {
      const response = await fetch('/api/sections')
      if (!response.ok) {
        throw new Error('Failed to load sections')
      }
      const data = await response.json()
      setSections(data.sections || [])
    } catch (error: any) {
      setError('Failed to load sections: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Grade CRUD operations
  const handleCreateGrade = async (gradeData: {
    gradeLevel: number
    department: string
    description: string
    color: string
    strand?: string
  }) => {
    try {
      setActionLoading(true)
      setError('')
      setSuccess('')

      const response = await fetch('/api/grades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...gradeData,
          registrarUid,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create grade')
      }

      setGrades((prev) => [...prev, data.grade])
      setSuccess('Grade created successfully!')
      setShowCreateGradeModal(false)

      setTimeout(() => setSuccess(''), 3000)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdateGrade = async (gradeData: {
    gradeLevel: number
    department: string
    description: string
  }) => {
    if (!editingGrade) return

    try {
      setActionLoading(true)
      setError('')
      setSuccess('')

      const response = await fetch(`/api/grades/${editingGrade.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...gradeData,
          registrarUid,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update grade')
      }

      setGrades((prev) =>
        prev.map((grade) => (grade.id === editingGrade.id ? data.grade : grade))
      )
      setSuccess('Grade updated successfully!')
      setShowEditGradeModal(false)
      setEditingGrade(null)

      setTimeout(() => setSuccess(''), 3000)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteGrade = async () => {
    if (!deletingGrade) return

    try {
      setActionLoading(true)
      setError('')
      setSuccess('')

      const response = await fetch(
        `/api/grades/${deletingGrade.id}?registrarUid=${registrarUid}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete grade')
      }

      setGrades((prev) => prev.filter((g) => g.id !== deletingGrade.id))
      toast.success(`Grade "${deletingGrade.gradeLevel}" deleted successfully!`)
      setShowDeleteGradeModal(false)
      setDeletingGrade(null)
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete grade')
    } finally {
      setActionLoading(false)
    }
  }

  // Section CRUD operations
  const handleCreateSection = async (sectionData: {
    gradeId?: string
    courseId?: string
    sectionName: string
    grade: string
    department: string
    rank: string
    description: string
  }) => {
    try {
      setActionLoading(true)
      setError('')
      setSuccess('')

      const requestData = {
        ...sectionData,
        registrarUid,
      }

      const response = await fetch('/api/sections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create section')
      }

      setSections((prev) => [...prev, data.section])
      setSuccess('Section created successfully!')
      setShowCreateSectionModal(false)

      setTimeout(() => setSuccess(''), 3000)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdateSection = async (sectionData: {
    gradeId?: string
    courseId?: string
    sectionName: string
    grade: string
    department: string
    rank: string
    description: string
  }) => {
    if (!editingSection) return

    try {
      setActionLoading(true)
      setError('')
      setSuccess('')

      const response = await fetch(`/api/sections/${editingSection.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...sectionData,
          registrarUid,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update section')
      }

      setSections((prev) =>
        prev.map((section) =>
          section.id === editingSection.id ? data.section : section
        )
      )
      setSuccess('Section updated successfully!')
      setShowEditSectionModal(false)
      setEditingSection(null)

      setTimeout(() => setSuccess(''), 3000)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteSection = async () => {
    if (!deletingSection) return

    try {
      setActionLoading(true)
      setError('')
      setSuccess('')

      const response = await fetch(
        `/api/sections/${deletingSection.id}?registrarUid=${registrarUid}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete section')
      }

      setSections((prev) => prev.filter((s) => s.id !== deletingSection.id))
      toast.success(
        `Section "${deletingSection.sectionName}" deleted successfully!`
      )
      setShowDeleteSectionModal(false)
      setDeletingSection(null)
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete section')
    } finally {
      setActionLoading(false)
    }
  }

  // Event handlers
  const handleCreateNewGrade = () => {
    setShowCreateGradeModal(true)
    setEditingGrade(null)
    setError('')
    setSuccess('')
  }

  const handleEditGrade = (grade: GradeData) => {
    setEditingGrade(grade)
    setShowEditGradeModal(true)
    setError('')
    setSuccess('')
  }

  const handleViewGrade = (grade: GradeData) => {
    setViewingGrade(grade)
    setShowViewGradeModal(true)
  }

  const handleDeleteGradeClick = (grade: GradeData) => {
    setDeletingGrade(grade)
    setShowDeleteGradeModal(true)
    setCountdown(5)
    setIsConfirmed(false)
  }

  const handleCreateNewSection = () => {
    setShowCreateSectionModal(true)
    setEditingSection(null)
    setError('')
    setSuccess('')
  }

  const handleEditSection = (section: SectionData) => {
    setEditingSection(section)
    setShowEditSectionModal(true)
    setError('')
    setSuccess('')
  }

  const handleViewSection = (section: SectionData) => {
    setViewingSection(section)
    setShowViewSectionModal(true)
  }

  const handleDeleteSectionClick = (section: SectionData) => {
    setDeletingSection(section)
    setShowDeleteSectionModal(true)
    setCountdown(5)
    setIsConfirmed(false)
  }

  const handleCancel = () => {
    setShowCreateGradeModal(false)
    setShowEditGradeModal(false)
    setShowDeleteGradeModal(false)
    setShowViewGradeModal(false)
    setShowCreateSectionModal(false)
    setShowEditSectionModal(false)
    setShowDeleteSectionModal(false)
    setShowViewSectionModal(false)
    setEditingGrade(null)
    setDeletingGrade(null)
    setViewingGrade(null)
    setEditingSection(null)
    setDeletingSection(null)
    setViewingSection(null)
    setCountdown(5)
    setIsConfirmed(false)
    setError('')
    setSuccess('')
  }

  // Get sections count per grade
  const sectionsCount: { [gradeId: string]: number } = {}
  sections.forEach((section) => {
    const identifier = section.gradeId || section.courseId
    if (identifier) {
      sectionsCount[identifier] = (sectionsCount[identifier] || 0) + 1
    }
  })

  // Render messages
  const renderMessages = () => {
    if (!error && !success) return null

    return (
      <div className="mb-6">
        {error && (
          <div className="bg-blue-50 border border-blue-200 p-4 mb-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-600"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p
                  className="text-sm text-blue-900"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-blue-50 border border-blue-200 p-4 mb-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-600"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p
                  className="text-sm text-blue-900"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  {success}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (loading && grades.length === 0 && sections.length === 0) {
    return <GradeSectionSkeleton />
  }

  return (
    <>
      <div className="p-6">
        {renderMessages()}

        {/* Enhanced Navigation */}
        <div className="mb-8">
          {/* Header Section */}
          <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl p-6 mb-6">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                  <MemberOfIcon
                    size={24}
                    className="text-blue-900"
                    weight="fill"
                  />
                </div>
                <h1
                  className="text-3xl font-medium text-white"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Grade & Section Management
                </h1>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {/* Grade Levels Tab */}
                <button
                  type="button"
                  onClick={() => setViewMode('grades')}
                  className={`rounded-2xl p-3 text-left transition-all duration-300 ${
                    viewMode === 'grades'
                      ? 'bg-white border-2 border-blue-900 shadow-2xl'
                      : 'bg-white/95 border border-white/20 hover:border-white/40 hover:bg-white'
                  }`}
                  style={{ fontFamily: 'Poppins' }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                          viewMode === 'grades'
                            ? 'bg-gradient-to-br from-blue-900 to-blue-700 text-white'
                            : 'bg-blue-50 text-blue-900'
                        }`}
                      >
                        <GraduationCap size={24} weight="duotone" />
                      </div>
                      <div>
                        <p
                          className={`text-base font-medium ${
                            viewMode === 'grades'
                              ? 'text-blue-900'
                              : 'text-gray-900'
                          }`}
                        >
                          Grade Levels
                        </p>
                        <p className="text-sm text-gray-600">
                          Create and manage grade levels
                        </p>
                      </div>
                    </div>
                    <div
                      className={`text-2xl font-semibold ${
                        viewMode === 'grades'
                          ? 'text-blue-900'
                          : 'text-gray-400'
                      }`}
                    >
                      {grades.length}
                    </div>
                  </div>
                </button>

                {/* Sections Tab */}
                <button
                  type="button"
                  onClick={() => setViewMode('sections')}
                  className={`rounded-2xl p-3 text-left transition-all duration-300 ${
                    viewMode === 'sections'
                      ? 'bg-white border-2 border-blue-900 shadow-2xl'
                      : 'bg-white/95 border border-white/20 hover:border-white/40 hover:bg-white'
                  }`}
                  style={{ fontFamily: 'Poppins' }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                          viewMode === 'sections'
                            ? 'bg-gradient-to-br from-blue-900 to-blue-700 text-white'
                            : 'bg-blue-50 text-blue-900'
                        }`}
                      >
                        <Users size={24} weight="duotone" />
                      </div>
                      <div>
                        <p
                          className={`text-base font-medium ${
                            viewMode === 'sections'
                              ? 'text-blue-900'
                              : 'text-gray-900'
                          }`}
                        >
                          Sections
                        </p>
                        <p className="text-sm text-gray-600">
                          Manage class sections and rankings
                        </p>
                      </div>
                    </div>
                    <div
                      className={`text-2xl font-semibold ${
                        viewMode === 'sections'
                          ? 'text-blue-900'
                          : 'text-gray-400'
                      }`}
                    >
                      {sections.length}
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content based on view mode */}
        {viewMode === 'grades' ? (
          <GradeList
            grades={filteredGrades}
            sectionsCount={sectionsCount}
            onEditGrade={handleEditGrade}
            onDeleteGrade={handleDeleteGradeClick}
            onViewGrade={handleViewGrade}
            onCreateNew={handleCreateNewGrade}
            loading={loading}
            searchQuery={gradeSearchQuery}
            onSearchChange={setGradeSearchQuery}
            totalGradesCount={grades.length}
            totalJuniorHighCount={totalJuniorHighGrades}
            selectedDepartments={selectedDepartments}
            onDepartmentToggle={handleDepartmentToggle}
          />
        ) : (
          <SectionList
            sections={filteredSections}
            grades={grades}
            courses={courses}
            onEditSection={handleEditSection}
            onDeleteSection={handleDeleteSectionClick}
            onViewSection={handleViewSection}
            onCreateNew={handleCreateNewSection}
            loading={loading}
            searchQuery={sectionSearchQuery}
            onSearchChange={setSectionSearchQuery}
            totalSectionsCount={sections.length}
            selectedRanks={selectedRanks}
            onRankToggle={handleRankToggle}
            selectedGrades={selectedGrades}
            onGradeToggle={handleGradeToggle}
            selectedDepartments={selectedDepartments}
            onDepartmentToggle={handleDepartmentToggle}
            selectedCourses={selectedCourses}
            onCourseToggle={handleCourseToggle}
          />
        )}
      </div>

      {/* Grade Modals */}
      {showCreateGradeModal && (
        <Modal
          isOpen={showCreateGradeModal}
          onClose={handleCancel}
          title="Create New Grade Level"
          size="lg"
        >
          <GradeForm
            onSubmit={handleCreateGrade}
            onCancel={handleCancel}
            initialData={undefined}
            isEditing={false}
            loading={actionLoading}
            existingGrades={grades}
          />
        </Modal>
      )}

      {showEditGradeModal && editingGrade && (
        <Modal
          isOpen={showEditGradeModal}
          onClose={handleCancel}
          title="Edit Grade Level"
          size="lg"
        >
          <GradeForm
            onSubmit={handleUpdateGrade}
            onCancel={handleCancel}
            initialData={
              editingGrade
                ? {
                    gradeLevel: editingGrade.gradeLevel.toString(),
                    gradeLevelNumeric: editingGrade.gradeLevel,
                    department: editingGrade.department,
                    description: editingGrade.description,
                    color: editingGrade.color,
                    strand: editingGrade.strand,
                  }
                : undefined
            }
            isEditing={true}
            loading={actionLoading}
          />
        </Modal>
      )}

      {/* Section Modals */}
      {showCreateSectionModal && (
        <Modal
          isOpen={showCreateSectionModal}
          onClose={handleCancel}
          title="Create New Section"
          size="lg"
        >
          <SectionForm
            onSubmit={handleCreateSection}
            onCancel={handleCancel}
            initialData={undefined}
            isEditing={false}
            loading={actionLoading}
            availableGrades={grades}
            availableCourses={courses}
            existingSections={sections}
          />
        </Modal>
      )}

      {showEditSectionModal && editingSection && (
        <Modal
          isOpen={showEditSectionModal}
          onClose={handleCancel}
          title="Edit Section"
          size="lg"
        >
          <SectionForm
            onSubmit={handleUpdateSection}
            onCancel={handleCancel}
            initialData={editingSection}
            isEditing={true}
            loading={actionLoading}
            availableGrades={grades}
            availableCourses={courses}
            existingSections={sections}
          />
        </Modal>
      )}

      {/* Delete Grade Modal */}
      {showDeleteGradeModal && deletingGrade && (
        <Modal
          isOpen={showDeleteGradeModal}
          onClose={handleCancel}
          title="Delete Grade Level"
          size="md"
        >
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-5">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl flex items-center justify-center">
                <Warning size={24} className="text-white" weight="fill" />
              </div>
              <div>
                <h3
                  className="text-lg font-semibold text-gray-900"
                  style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                >
                  Delete Grade Level
                </h3>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-white border border-gray-200 rounded-xl">
                <p
                  className="text-sm text-gray-900 font-medium mb-2"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  You are about to delete:
                </p>
                <p
                  className="text-sm text-gray-900 font-semibold"
                  style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                >
                  Grade {deletingGrade.gradeLevel} ({deletingGrade.department})
                </p>
                <p
                  className="text-xs text-gray-600 mt-2"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  This action cannot be undone and will permanently remove the
                  grade level from the system. All associated sections must be
                  deleted first.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="confirm-delete-grade"
                    checked={isConfirmed}
                    onChange={(e) => setIsConfirmed(e.target.checked)}
                    className="w-4 h-4 text-blue-900 border-gray-300 focus:ring-blue-900 rounded-lg"
                    disabled={countdown > 0}
                  />
                  <label
                    htmlFor="confirm-delete-grade"
                    className={`text-sm ${
                      countdown > 0 ? 'text-gray-400' : 'text-gray-700'
                    }`}
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    I understand this action cannot be undone
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors rounded-lg"
                disabled={actionLoading}
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteGrade}
                disabled={countdown > 0 || !isConfirmed || actionLoading}
                className={`px-4 py-2 text-sm font-medium text-white transition-colors rounded-lg ${
                  countdown > 0 || !isConfirmed || actionLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-br from-blue-900 to-blue-800 hover:from-blue-800 hover:to-blue-900'
                }`}
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                {actionLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash size={16} className="mr-2 inline" />
                    Delete Grade {countdown > 0 && `(${countdown})`}
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Section Modal */}
      {showDeleteSectionModal && deletingSection && (
        <Modal
          isOpen={showDeleteSectionModal}
          onClose={handleCancel}
          title="Delete Section"
          size="md"
        >
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-5">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl flex items-center justify-center">
                <Warning size={24} className="text-white" weight="fill" />
              </div>
              <div>
                <h3
                  className="text-lg font-semibold text-gray-900"
                  style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                >
                  Delete Section
                </h3>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-white border border-gray-200 rounded-xl">
                <p
                  className="text-sm text-gray-900 font-medium mb-2"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  You are about to delete:
                </p>
                <p
                  className="text-sm text-gray-900 font-semibold"
                  style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                >
                  {deletingSection.sectionName} (Grade{' '}
                  {deletingSection.grade.split(' ')[1]} -{' '}
                  {deletingSection.department})
                </p>
                <p
                  className="text-xs text-gray-600 mt-2"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  This action cannot be undone and will permanently remove the
                  section from the system.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="confirm-delete-section"
                    checked={isConfirmed}
                    onChange={(e) => setIsConfirmed(e.target.checked)}
                    className="w-4 h-4 text-blue-900 border-gray-300 focus:ring-blue-900 rounded-lg"
                    disabled={countdown > 0}
                  />
                  <label
                    htmlFor="confirm-delete-section"
                    className={`text-sm ${
                      countdown > 0 ? 'text-gray-400' : 'text-gray-700'
                    }`}
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    I understand this action cannot be undone
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors rounded-lg"
                disabled={actionLoading}
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSection}
                disabled={countdown > 0 || !isConfirmed || actionLoading}
                className={`px-4 py-2 text-sm font-medium text-white transition-colors rounded-lg ${
                  countdown > 0 || !isConfirmed || actionLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-br from-blue-900 to-blue-800 hover:from-blue-800 hover:to-blue-900'
                }`}
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                {actionLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash size={16} className="mr-2 inline" />
                    Delete Section {countdown > 0 && `(${countdown})`}
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* View Grade Modal */}
      {showViewGradeModal && viewingGrade && (
        <Modal
          isOpen={showViewGradeModal}
          onClose={handleCancel}
          title="Grade Level Details"
          size="lg"
        >
          <div className="p-6">
            <div className="space-y-6">
              <div className="flex flex-col gap-4">
                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 mb-1"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Grade Level
                  </label>
                  <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg">
                    <span
                      className="text-sm text-gray-900 font-medium"
                      style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                    >
                      Grade {viewingGrade.gradeLevel}
                    </span>
                  </div>
                </div>
                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 mb-1"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Department
                  </label>
                  <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg">
                    <span
                      className="text-sm text-gray-900"
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      {viewingGrade.department === 'JHS'
                        ? 'Junior High School'
                        : viewingGrade.department === 'SHS'
                        ? 'Senior High School'
                        : 'College'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-2"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Description
                </label>
                <div className="px-4 py-3 bg-white border border-gray-200 rounded-xl min-h-[120px]">
                  <p
                    className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    {viewingGrade.description || 'No description provided.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 mb-1"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Sections Count
                  </label>
                  <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg">
                    <span
                      className="text-sm text-gray-900"
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      {sectionsCount[viewingGrade.id] || 0} sections
                    </span>
                  </div>
                </div>
                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 mb-1"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Created Date
                  </label>
                  <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg">
                    <span
                      className="text-sm text-gray-900"
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      {new Date(viewingGrade.createdAt).toLocaleDateString(
                        'en-US',
                        {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        }
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-8 pt-4 border-t border-gray-200">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors rounded-lg"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* View Section Modal */}
      {showViewSectionModal && viewingSection && (
        <Modal
          isOpen={showViewSectionModal}
          onClose={handleCancel}
          title="Section Details"
          size="lg"
        >
          <div className="p-6">
            <div className="space-y-6">
              <div className="flex flex-col gap-4">
                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 mb-1"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Section Name
                  </label>
                  <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg">
                    <span
                      className="text-sm text-gray-900 font-medium"
                      style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                    >
                      {viewingSection.sectionName}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label
                      className="block text-sm font-medium text-gray-700 mb-1"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      Grade
                    </label>
                    <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg">
                      <span
                        className="text-sm text-gray-900"
                        style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                      >
                        {viewingSection.grade}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium text-gray-700 mb-1"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      Department
                    </label>
                    <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg">
                      <span
                        className="text-sm text-gray-900"
                        style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                      >
                        {viewingSection.department === 'JHS'
                          ? 'Junior HS'
                          : viewingSection.department === 'SHS'
                          ? 'Senior HS'
                          : 'College'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium text-gray-700 mb-1"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      Rank
                    </label>
                    <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg">
                      <span
                        className="text-sm text-gray-900 font-medium"
                        style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                      >
                        {viewingSection.rank}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-2"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Description
                </label>
                <div className="px-4 py-3 bg-white border border-gray-200 rounded-xl min-h-[120px]">
                  <p
                    className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    {viewingSection.description || 'No description provided.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 mb-1"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Created Date
                  </label>
                  <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg">
                    <span
                      className="text-sm text-gray-900"
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      {new Date(viewingSection.createdAt).toLocaleDateString(
                        'en-US',
                        {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        }
                      )}
                    </span>
                  </div>
                </div>
                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 mb-1"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Last Updated
                  </label>
                  <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg">
                    <span
                      className="text-sm text-gray-900"
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      {new Date(viewingSection.updatedAt).toLocaleDateString(
                        'en-US',
                        {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        }
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-8 pt-4 border-t border-gray-200">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors rounded-lg"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Loading Overlay */}
      <LoaderOverlay isVisible={actionLoading} message="Processing..." />
    </>
  )
}
