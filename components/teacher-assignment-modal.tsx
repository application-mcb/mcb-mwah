'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'react-toastify'
import {
  GraduationCap,
  User,
  BookOpen,
  Users,
  X,
  Check,
  Plus,
  ArrowLeft,
  ArrowRight,
  Trash,
  ChalkboardSimple,
  MagnifyingGlass,
  FunnelSimple,
  Minus,
} from '@phosphor-icons/react'

interface TeacherAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  teacher: {
    id: string
    firstName: string
    middleName?: string
    lastName: string
    extension?: string
  } | null
  registrarUid: string
}

interface Subject {
  id: string
  code: string
  name: string
  gradeLevel?: number // For high school subjects
  gradeLevels?: number[] // For multi-grade subjects
  courseCodes?: string[] // For college subjects
  courseSelections?: {
    code: string
    year: number
    semester: 'first-sem' | 'second-sem'
  }[] // College course selections
  color: string
  lectureUnits: number
  labUnits: number
  totalUnits: number
  teacherAssignments?: Record<string, string[]>
}

interface Section {
  id: string
  sectionName: string
  gradeId?: string // For high school sections
  courseId?: string // For college sections
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

interface Course {
  code: string
  name: string
  description: string
  color: string
}

interface SubjectSet {
  id: string
  name: string
  description: string
  gradeLevel?: number // For high school subject sets
  gradeLevels?: number[] // For multi-grade subject sets
  courseSelections?: {
    code: string
    year: number
    semester: 'first-sem' | 'second-sem'
  }[] // For college subject sets
  color: string
  subjects: string[]
  createdAt: string
  updatedAt: string
}

export default function TeacherAssignmentModal({
  isOpen,
  onClose,
  teacher,
  registrarUid,
}: TeacherAssignmentModalProps) {
  const [step, setStep] = useState<'level' | 'grade' | 'subjects' | 'sections'>(
    'level'
  )
  const [selectedLevel, setSelectedLevel] = useState<
    'high-school' | 'college' | null
  >(null)
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>([])
  const [currentSubjectIndex, setCurrentSubjectIndex] = useState(0)
  const [selectedSections, setSelectedSections] = useState<string[]>([])
  const [selectingGrade, setSelectingGrade] = useState<string | null>(null)

  const [grades, setGrades] = useState<Grade[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [subjectSets, setSubjectSets] = useState<SubjectSet[]>([])
  const [selectedSubjectSetId, setSelectedSubjectSetId] = useState<
    string | null
  >(null)
  const [selectedSectionsBySubject, setSelectedSectionsBySubject] = useState<
    Record<string, string[]>
  >({})
  const [removingBySubject, setRemovingBySubject] = useState<
    Record<string, boolean>
  >({})
  const [loading, setLoading] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [filterCourse, setFilterCourse] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [currentGradePage, setCurrentGradePage] = useState(1)
  const itemsPerPage = 5

  // Reset state and load grades/courses on modal open
  useEffect(() => {
    if (isOpen) {
      // Reset all state when modal opens
      setStep('level')
      setSelectedLevel(null)
      setSelectedGrade(null)
      setSelectedCourse(null)
      setSelectedSubjects([])
      setCurrentSubjectIndex(0)
      setSelectedSections([])
      setSelectedSubjectSetId(null)
      setSelectedSectionsBySubject({})
      setSubjects([])
      setSubjectSets([])
      setSearchQuery('')
      setShowFilterDropdown(false)
      setFilterCourse('')
      setCurrentPage(1)
      setCurrentGradePage(1)
      loadGrades()
      loadCourses()
    }
  }, [isOpen])

  // Load subjects and subject sets when grade or course is selected
  useEffect(() => {
    if (selectedLevel === 'high-school' && selectedGrade) {
      loadSubjectsForGrade(selectedGrade.gradeLevel)
      loadSubjectSetsForGrade(selectedGrade.gradeLevel)
    } else if (selectedLevel === 'college' && selectedCourse) {
      loadSubjectsForCourse(selectedCourse.code)
      loadSubjectSetsForCourse(selectedCourse.code)
    } else {
      // Clear subjects when no grade/course is selected or level changes
      setSubjects([])
      setSubjectSets([])
    }
  }, [selectedGrade, selectedCourse, selectedLevel])

  // Load sections when subject is selected
  useEffect(() => {
    if (selectedSubjects[currentSubjectIndex]) {
      if (selectedLevel === 'high-school' && selectedGrade) {
        loadSectionsForGrade(selectedGrade.gradeLevel)
      } else if (selectedLevel === 'college' && selectedCourse) {
        loadSectionsForCourse(selectedCourse.code)
      }
    }
  }, [
    selectedSubjects,
    currentSubjectIndex,
    selectedLevel,
    selectedGrade,
    selectedCourse,
  ])

  // Helper function to get assigned sections for a specific subject
  const getAssignedSectionsForSubject = (subject: Subject | undefined) => {
    if (!subject?.teacherAssignments) return [] as string[]
    return Object.entries(subject.teacherAssignments)
      .filter(
        ([_, teacherIds]) =>
          Array.isArray(teacherIds) && teacherIds.includes(teacher?.id || '')
      )
      .map(([sectionId]) => sectionId)
  }

  const loadGrades = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/grades')
      const data = await response.json()

      if (response.ok) {
        setGrades(data.grades || [])
      } else {
        toast.error('Failed to load grades')
      }
    } catch (error) {
      console.error('Error loading grades:', error)
      toast.error('Failed to load grades')
    } finally {
      setLoading(false)
    }
  }

  const loadCourses = async () => {
    try {
      const response = await fetch('/api/courses')
      const data = await response.json()

      if (response.ok) {
        setCourses(data.courses || [])
      } else {
        console.error('Failed to load courses')
      }
    } catch (error) {
      console.error('Error loading courses:', error)
    }
  }

  const loadSubjectsForGrade = async (gradeLevel: number) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/subjects?gradeLevel=${gradeLevel}`)
      const data = await response.json()

      if (response.ok) {
        const loadedSubjects: Subject[] = data.subjects || []
        setSubjects(loadedSubjects)

        // Auto-select existing assignments from DB on initial load
        if (selectedSubjects.length === 0 && teacher?.id) {
          const autoSelected: Subject[] = []
          const map: Record<string, string[]> = {}
          for (const subj of loadedSubjects) {
            const assignedIds = getAssignedSectionsForSubject(subj)
            if (assignedIds.length > 0) {
              autoSelected.push(subj)
              map[subj.id] = assignedIds
            }
          }
          if (autoSelected.length > 0) {
            setSelectedSubjects(autoSelected)
            setSelectedSectionsBySubject(map)
          }
        }
      } else {
        toast.error('Failed to load subjects')
      }
    } catch (error) {
      console.error('Error loading subjects:', error)
      toast.error('Failed to load subjects')
    } finally {
      setLoading(false)
    }
  }

  const loadSubjectSetsForGrade = async (gradeLevel: number) => {
    try {
      const response = await fetch(`/api/subject-sets?gradeLevel=${gradeLevel}`)
      const data = await response.json()

      if (response.ok) {
        setSubjectSets(data.subjectSets || [])
      } else {
        console.error('Error loading subject sets:', data.error)
        setSubjectSets([])
      }
    } catch (error) {
      console.error('Error loading subject sets:', error)
      setSubjectSets([])
    }
  }

  const loadSubjectsForCourse = async (courseCode: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/subjects?courseCode=${courseCode}`)
      const data = await response.json()

      if (response.ok) {
        const loadedSubjects: Subject[] = data.subjects || []
        setSubjects(loadedSubjects)

        // Auto-select existing assignments from DB on initial load
        if (selectedSubjects.length === 0 && teacher?.id) {
          const autoSelected: Subject[] = []
          const map: Record<string, string[]> = {}
          for (const subj of loadedSubjects) {
            const assignedIds = getAssignedSectionsForSubject(subj)
            if (assignedIds.length > 0) {
              autoSelected.push(subj)
              map[subj.id] = assignedIds
            }
          }
          if (autoSelected.length > 0) {
            setSelectedSubjects(autoSelected)
            setSelectedSectionsBySubject(map)
          }
        }
      } else {
        toast.error('Failed to load subjects')
      }
    } catch (error) {
      console.error('Error loading subjects:', error)
      toast.error('Failed to load subjects')
    } finally {
      setLoading(false)
    }
  }

  const loadSubjectSetsForCourse = async (courseCode: string) => {
    try {
      const response = await fetch(`/api/subject-sets?courseCode=${courseCode}`)
      const data = await response.json()

      if (response.ok) {
        setSubjectSets(data.subjectSets || [])
      } else {
        console.error('Error loading subject sets:', data.error)
        setSubjectSets([])
      }
    } catch (error) {
      console.error('Error loading subject sets:', error)
      setSubjectSets([])
    }
  }

  const loadSectionsForGrade = async (gradeLevel: number) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/sections?grade=${gradeLevel}`)
      const data = await response.json()

      if (response.ok) {
        setSections(data.sections || [])
      } else {
        toast.error('Failed to load sections')
      }
    } catch (error) {
      console.error('Error loading sections:', error)
      toast.error('Failed to load sections')
    } finally {
      setLoading(false)
    }
  }

  const loadSectionsForCourse = async (courseCode: string) => {
    try {
      setLoading(true)
      // Fetch all sections and filter by course
      const response = await fetch('/api/sections')
      const data = await response.json()

      if (response.ok) {
        // Filter sections that have this courseCode in their courseId or grade fields
        const filteredSections = (data.sections || []).filter(
          (section: Section) =>
            section.courseId === courseCode ||
            section.grade?.includes(courseCode)
        )
        setSections(filteredSections)
      } else {
        toast.error('Failed to load sections')
      }
    } catch (error) {
      console.error('Error loading sections:', error)
      toast.error('Failed to load sections')
    } finally {
      setLoading(false)
    }
  }

  const handleLevelSelect = (level: 'high-school' | 'college') => {
    setSelectedLevel(level)
    setSelectedGrade(null)
    setSelectedCourse(null)
    setSelectedSubjects([])
    setSelectedSubjectSetId(null)
    setStep('grade')
  }

  const handleGradeSelect = (grade: Grade) => {
    setSelectingGrade(grade.id)
    // Add a delay to show the selection animation
    setTimeout(() => {
      const isSameGrade = selectedGrade?.id === grade.id
      setSelectedGrade(grade)
      setSelectingGrade(null)
      // Preserve previously selected subjects when re-selecting the same grade
      if (!isSameGrade) {
        setSelectedSubjects([])
        setSelectedSubjectSetId(null)
      }
      setCurrentSubjectIndex(0)
      setSelectedSections([])
      // Change step after setting grade to ensure useEffect fires
      setTimeout(() => {
        setStep('subjects')
      }, 100)
    }, 600)
  }

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course)
    setStep('subjects')
    setSelectedSubjects([])
    setSelectedSubjectSetId(null)
    setCurrentSubjectIndex(0)
    setSelectedSections([])
  }

  const handleSubjectToggle = (subject: Subject) => {
    setSelectedSubjects((prev) => {
      const isSelected = prev.some((s) => s.id === subject.id)
      if (isSelected) {
        // Remove subject and its mapped sections
        setSelectedSectionsBySubject((map) => {
          const copy = { ...map }
          delete copy[subject.id]
          return copy
        })
        return prev.filter((s) => s.id !== subject.id)
      } else {
        // Initialize with any already assigned sections for this subject
        setSelectedSectionsBySubject((map) => {
          const copy = { ...map }
          if (!copy[subject.id]) {
            copy[subject.id] = getAssignedSectionsForSubject(subject)
          }
          return copy
        })
        return [...prev, subject]
      }
    })
  }

  // Filter subjects based on selected course and search query
  const getFilteredSubjects = () => {
    let filtered = subjects

    // Filter by course (for college level)
    if (selectedLevel === 'college' && filterCourse) {
      filtered = filtered.filter((subject) => {
        // Check if subject has courseCodes array
        if (subject.courseCodes && subject.courseCodes.length > 0) {
          return subject.courseCodes.includes(filterCourse)
        }
        // Check if subject has courseSelections
        if (subject.courseSelections && subject.courseSelections.length > 0) {
          return subject.courseSelections.some(
            (selection) => selection.code === filterCourse
          )
        }
        return false
      })
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(
        (subject) =>
          subject.code.toLowerCase().includes(query) ||
          subject.name.toLowerCase().includes(query) ||
          subject.description?.toLowerCase().includes(query)
      )
    }

    return filtered
  }

  // Get paginated subjects
  const getPaginatedSubjects = () => {
    const filtered = getFilteredSubjects()
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filtered.slice(startIndex, endIndex)
  }

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filterCourse])

  // Get paginated grades
  const getPaginatedGrades = () => {
    const startIndex = (currentGradePage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return grades.slice(startIndex, endIndex)
  }

  // Get paginated courses
  const getPaginatedCourses = () => {
    const startIndex = (currentGradePage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return courses.slice(startIndex, endIndex)
  }

  // Reset grade page when level changes
  useEffect(() => {
    setCurrentGradePage(1)
  }, [selectedLevel])

  const handleContinueToSections = () => {
    if (selectedSubjects.length === 0) {
      toast.error('Please select at least one subject')
      return
    }
    // Ensure map has keys for all selected subjects
    setSelectedSectionsBySubject((prev) => {
      const copy = { ...prev }
      for (const subj of selectedSubjects) {
        if (!copy[subj.id]) copy[subj.id] = getAssignedSectionsForSubject(subj)
      }
      return copy
    })
    setStep('sections')
    setCurrentSubjectIndex(0)
  }

  const handleSectionToggle = (sectionId: string, subjectId?: string) => {
    const subject = subjectId
      ? selectedSubjects.find((s) => s.id === subjectId)
      : selectedSubjects[currentSubjectIndex]
    if (!subject) return
    setSelectedSectionsBySubject((prev) => {
      const current = prev[subject.id] || []
      const updated = current.includes(sectionId)
        ? current.filter((id) => id !== sectionId)
        : [...current, sectionId]
      return { ...prev, [subject.id]: updated }
    })
  }

  const handleAssignSubjects = async () => {
    if (selectedSubjects.length === 0) {
      toast.error('Please select subjects and sections')
      return
    }

    setAssigning(true)

    try {
      let totalAssignments = 0
      let totalUnassignments = 0
      let totalSkipped = 0 // already assigned kept
      const errors: string[] = []

      for (const subject of selectedSubjects) {
        const nowSelected = new Set<string>(
          selectedSectionsBySubject[subject.id] || []
        )
        const originallyAssigned = new Set<string>(
          getAssignedSectionsForSubject(subject)
        )

        // Determine additions and removals
        const toAdd: string[] = []
        const toRemove: string[] = []
        nowSelected.forEach((id) => {
          if (!originallyAssigned.has(id)) toAdd.push(id)
          else totalSkipped++
        })
        originallyAssigned.forEach((id) => {
          if (!nowSelected.has(id)) toRemove.push(id)
        })

        // Perform removals first
        for (const sectionId of toRemove) {
          const url = `/api/teacher-assignments?subjectId=${encodeURIComponent(
            subject.id
          )}&sectionId=${encodeURIComponent(
            sectionId
          )}&registrarUid=${encodeURIComponent(
            registrarUid
          )}&teacherId=${encodeURIComponent(teacher?.id || '')}`
          const res = await fetch(url, { method: 'DELETE' })
          const data = await res.json().catch(() => ({}))
          if (res.ok) {
            totalUnassignments++
          } else {
            errors.push(
              `${subject.name}: ${data.error || 'Failed to remove assignment'}`
            )
          }
        }

        // Then additions
        for (const sectionId of toAdd) {
          const response = await fetch('/api/teacher-assignments', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              subjectId: subject.id,
              sectionId,
              teacherId: teacher?.id,
              registrarUid,
            }),
          })

          const data = await response.json()

          if (response.ok) {
            totalAssignments++
          } else {
            errors.push(`${subject.name}: ${data.error || 'Failed to assign'}`)
          }
        }
      }

      if (totalAssignments > 0 || totalUnassignments > 0) {
        const parts: string[] = []
        if (totalAssignments > 0)
          parts.push(`${totalAssignments} assignment(s)`)
        if (totalUnassignments > 0)
          parts.push(`${totalUnassignments} removal(s)`)
        toast.success(`Saved changes: ${parts.join(' and ')}`)

        if (errors.length > 0) {
          toast.warning(`Some assignments failed: ${errors.join(', ')}`)
        }

        // Reload subjects to get fresh teacherAssignments data
        if (selectedLevel === 'high-school' && selectedGrade) {
          await loadSubjectsForGrade(selectedGrade.gradeLevel)
        } else if (selectedLevel === 'college' && selectedCourse) {
          await loadSubjectsForCourse(selectedCourse.code)
        }

        // Reset modal
        setStep('level')
        setSelectedLevel(null)
        setSelectedGrade(null)
        setSelectedCourse(null)
        setSelectedSubjects([])
        setCurrentSubjectIndex(0)
        setSelectedSectionsBySubject({})
        onClose()
      } else {
        if (totalSkipped > 0 && errors.length === 0) {
          toast.info(
            'No changes saved. All selections matched existing assignments.'
          )
        } else {
          toast.error(
            'Failed to assign any subjects. Please check the errors and try again.'
          )
        }
      }
    } catch (error) {
      console.error('Error assigning subjects:', error)
      toast.error('Failed to assign subjects')
    } finally {
      setAssigning(false)
    }
  }

  const handleBack = () => {
    if (step === 'grade') {
      setStep('level')
    } else if (step === 'subjects') {
      // Go back to grade/course selection but PRESERVE the current selection and selected subjects
      setStep('grade')
    } else if (step === 'sections') {
      // Go back to subjects and keep subject selections
      setStep('subjects')
    }
  }

  const handleClose = () => {
    // Preserve selections on close so reopening resumes state
    onClose()
  }

  // Get sections that already have this teacher assigned for the current subject
  const getAssignedSections = () => {
    const currentSubject = selectedSubjects[currentSubjectIndex]
    if (!currentSubject?.teacherAssignments) return []

    return Object.entries(currentSubject.teacherAssignments)
      .filter(
        ([_, assignedTeacherIds]) =>
          Array.isArray(assignedTeacherIds) &&
          assignedTeacherIds.includes(teacher?.id || '')
      )
      .map(([sectionId, _]) => sectionId)
  }

  const assignedSectionIds = getAssignedSections()

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Assign Subjects to ${teacher?.firstName} ${teacher?.lastName}`}
      size="2xl"
    >
      <div className="p-6">
        {/* Header with teacher info */}
        <div className="flex items-center gap-3 mb-6 p-4 bg-white border border-gray-200 rounded-xl">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-800 to-blue-900 rounded-xl flex items-center justify-center">
            <User size={20} className="text-white" weight="fill" />
          </div>
          <div>
            <h3
              className="text-lg font-medium text-gray-900"
              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
            >
              {teacher?.firstName}{' '}
              {teacher?.middleName && `${teacher.middleName} `}
              {teacher?.lastName}
              {teacher?.extension && ` ${teacher.extension}`}
            </h3>
            <p
              className="text-xs text-gray-600"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              Select level, grade/course, subject, and sections to assign
            </p>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="bg-white p-6 border border-gray-200 shadow-lg rounded-xl mb-6">
          <div className="relative">
            {/* Progress Steps Container */}
            <div className="flex justify-between items-start relative">
              {/* Progress Line Background - positioned behind circles */}
              <div className="absolute top-6 left-6 right-6 h-0.5 bg-gray-200 z-0"></div>

              {/* Animated Progress Line - positioned behind circles */}
              <div
                className="absolute top-6 left-6 h-0.5 bg-gradient-to-r from-blue-600 to-blue-900 transition-all duration-1000 ease-out z-10"
                style={{
                  width:
                    step === 'level'
                      ? '0%'
                      : step === 'grade'
                      ? 'calc(33% - 24px)'
                      : step === 'subjects'
                      ? 'calc(66% - 48px)'
                      : step === 'sections'
                      ? 'calc(100% - 72px)'
                      : 'calc(100% - 72px)',
                }}
              ></div>

              {/* Step 0: Level Selection */}
              <div
                className={`flex flex-col items-center cursor-pointer group transition-all duration-300 relative z-20 ${
                  step === 'level' ? 'scale-110' : 'hover:scale-105'
                }`}
                onClick={() => {
                  const stepOrder = ['level', 'grade', 'subjects', 'sections']
                  const currentIndex = stepOrder.indexOf(step)
                  if (currentIndex >= 0) {
                    setStep('level')
                  }
                }}
              >
                <div
                  className={`relative w-12 h-12 flex items-center justify-center text-sm font-medium transition-all duration-500 rounded-full ${
                    step === 'level'
                      ? 'bg-blue-900 text-white shadow-lg shadow-blue-900/30'
                      : ['level', 'grade', 'subjects', 'sections'].indexOf(
                          step
                        ) > 0
                      ? 'bg-blue-900 text-white shadow-md'
                      : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                  }`}
                >
                  <ChalkboardSimple
                    size={18}
                    weight="bold"
                    className="transition-all duration-300"
                  />
                  {step === 'level' && (
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-800 to-blue-900 animate-ping opacity-20"></div>
                  )}
                </div>
                <span
                  className={`text-xs font-medium mt-2 text-center transition-all duration-300 ${
                    step === 'level'
                      ? 'text-blue-900 font-semibold'
                      : ['level', 'grade', 'subjects', 'sections'].indexOf(
                          step
                        ) > 0
                      ? 'text-blue-900'
                      : 'text-gray-400 group-hover:text-gray-600'
                  }`}
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Level
                </span>
              </div>

              {/* Step 1: Grade/Course Selection */}
              <div
                className={`flex flex-col items-center cursor-pointer group transition-all duration-300 relative z-20 ${
                  step === 'grade' ? 'scale-110' : 'hover:scale-105'
                }`}
                onClick={() => {
                  const stepOrder = ['level', 'grade', 'subjects', 'sections']
                  const currentIndex = stepOrder.indexOf(step)
                  if (currentIndex >= 1) {
                    setStep('grade')
                  }
                }}
              >
                <div
                  className={`relative w-12 h-12 flex items-center justify-center text-sm font-medium transition-all duration-500 rounded-full ${
                    step === 'grade'
                      ? 'bg-blue-900 text-white shadow-lg shadow-blue-900/30'
                      : ['level', 'grade', 'subjects', 'sections'].indexOf(
                          step
                        ) > 1
                      ? 'bg-blue-900 text-white shadow-md'
                      : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                  }`}
                >
                  <GraduationCap
                    size={18}
                    weight="bold"
                    className="transition-all duration-300"
                  />
                  {step === 'grade' && (
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-800 to-blue-900 animate-ping opacity-20"></div>
                  )}
                </div>
                <span
                  className={`text-xs font-medium mt-2 text-center transition-all duration-300 ${
                    step === 'grade'
                      ? 'text-blue-900 font-semibold'
                      : ['level', 'grade', 'subjects', 'sections'].indexOf(
                          step
                        ) > 1
                      ? 'text-blue-900'
                      : 'text-gray-400 group-hover:text-gray-600'
                  }`}
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  {selectedLevel === 'college' ? 'Course' : 'Grade'}
                </span>
              </div>

              {/* Step 2: Subjects */}
              <div
                className={`flex flex-col items-center cursor-pointer group transition-all duration-300 relative z-20 ${
                  step === 'subjects' ? 'scale-110' : 'hover:scale-105'
                }`}
                onClick={() => {
                  const stepOrder = ['level', 'grade', 'subjects', 'sections']
                  const currentIndex = stepOrder.indexOf(step)
                  if (currentIndex >= 2) {
                    setStep('subjects')
                  }
                }}
              >
                <div
                  className={`relative w-12 h-12 flex items-center justify-center text-sm font-medium transition-all duration-500 rounded-full ${
                    step === 'subjects'
                      ? 'bg-blue-900 text-white shadow-lg shadow-blue-900/30'
                      : ['level', 'grade', 'subjects', 'sections'].indexOf(
                          step
                        ) > 2
                      ? 'bg-blue-900 text-white shadow-md'
                      : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                  }`}
                >
                  <BookOpen
                    size={18}
                    weight="bold"
                    className="transition-all duration-300"
                  />
                  {step === 'subjects' && (
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-800 to-blue-900 animate-ping opacity-20"></div>
                  )}
                </div>
                <span
                  className={`text-xs font-medium mt-2 text-center transition-all duration-300 ${
                    step === 'subjects'
                      ? 'text-blue-900 font-semibold'
                      : ['level', 'grade', 'subjects', 'sections'].indexOf(
                          step
                        ) > 2
                      ? 'text-blue-900'
                      : 'text-gray-400 group-hover:text-gray-600'
                  }`}
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Subjects
                </span>
              </div>

              {/* Step 3: Sections */}
              <div
                className={`flex flex-col items-center cursor-pointer group transition-all duration-300 relative z-20 ${
                  step === 'sections' ? 'scale-110' : 'hover:scale-105'
                }`}
                onClick={() => {
                  const stepOrder = ['level', 'grade', 'subjects', 'sections']
                  const currentIndex = stepOrder.indexOf(step)
                  if (currentIndex >= 3) {
                    setStep('sections')
                  }
                }}
              >
                <div
                  className={`relative w-12 h-12 flex items-center justify-center text-sm font-medium transition-all duration-500 rounded-full ${
                    step === 'sections'
                      ? 'bg-blue-900 text-white shadow-lg shadow-blue-900/30'
                      : ['level', 'grade', 'subjects', 'sections'].indexOf(
                          step
                        ) > 3
                      ? 'bg-blue-900 text-white shadow-md'
                      : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                  }`}
                >
                  <Users
                    size={18}
                    weight="bold"
                    className="transition-all duration-300"
                  />
                  {step === 'sections' && (
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-800 to-blue-900 animate-ping opacity-20"></div>
                  )}
                </div>
                <span
                  className={`text-xs font-medium mt-2 text-center transition-all duration-300 ${
                    step === 'sections'
                      ? 'text-blue-900 font-semibold'
                      : ['level', 'grade', 'subjects', 'sections'].indexOf(
                          step
                        ) > 3
                      ? 'text-blue-900'
                      : 'text-gray-400 group-hover:text-gray-600'
                  }`}
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Sections
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Step 0: Level Selection */}
        {step === 'level' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-900 flex items-center justify-center">
                    <ChalkboardSimple
                      size={20}
                      className="text-white"
                      weight="bold"
                    />
                  </div>
                  <div>
                    <h2
                      className="text-xl font-medium text-gray-900"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      Select Level
                    </h2>
                    <p
                      className="text-xs text-gray-600"
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      Choose between High School or College level
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* High School Option */}
              <Card
                className={`group p-6 border border-gray-200 shadow-sm bg-white hover:border-blue-900 cursor-pointer transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 rounded-xl ${
                  selectedLevel === 'high-school'
                    ? 'shadow-lg border-blue-900 bg-white'
                    : ''
                }`}
                onClick={() => handleLevelSelect('high-school')}
              >
                <div className="space-y-4 flex flex-col justify-between h-full">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg flex items-center justify-center">
                        <GraduationCap
                          size={20}
                          className="text-white"
                          weight="fill"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3
                          className="text-lg font-medium text-gray-900"
                          style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                        >
                          High School
                        </h3>
                        <p
                          className="text-xs text-gray-600"
                          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                        >
                          Junior High School (JHS)
                        </p>
                      </div>
                    </div>
                  </div>

                  <p
                    className="text-xs text-gray-700 line-clamp-3"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    Assign subjects to Grade 7-10 levels with multiple sections
                  </p>

                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span
                        className="text-xs text-gray-600"
                        style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                      >
                        Grades 7-10
                      </span>
                      <div
                        className={`w-4 h-4 border-2 rounded transition-colors ${
                          selectedLevel === 'high-school'
                            ? 'border-blue-900 bg-gradient-to-br from-blue-800 to-blue-900'
                            : 'border-gray-300'
                        }`}
                      >
                        {selectedLevel === 'high-school' && (
                          <Check size={12} className="text-white" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* College Option */}
              <Card
                className={`group p-6 border border-gray-200 shadow-sm bg-white hover:border-blue-900 cursor-pointer transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 rounded-xl ${
                  selectedLevel === 'college'
                    ? 'shadow-lg border-blue-900 bg-white'
                    : ''
                }`}
                onClick={() => handleLevelSelect('college')}
              >
                <div className="space-y-4 flex flex-col justify-between h-full">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg flex items-center justify-center">
                        <ChalkboardSimple
                          size={20}
                          className="text-white"
                          weight="fill"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3
                          className="text-lg font-medium text-gray-900"
                          style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                        >
                          College
                        </h3>
                        <p
                          className="text-xs text-gray-600"
                          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                        >
                          Bachelor's Degree Programs
                        </p>
                      </div>
                    </div>
                  </div>

                  <p
                    className="text-xs text-gray-700 line-clamp-3"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    Assign subjects to college courses with year levels and
                    semesters
                  </p>

                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span
                        className="text-xs text-gray-600"
                        style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                      >
                        BSIT, BSCS, etc.
                      </span>
                      <div
                        className={`w-4 h-4 border-2 rounded transition-colors ${
                          selectedLevel === 'college'
                            ? 'border-blue-900 bg-gradient-to-br from-blue-800 to-blue-900'
                            : 'border-gray-300'
                        }`}
                      >
                        {selectedLevel === 'college' && (
                          <Check size={12} className="text-white" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Step 1: Grade/Course Selection */}
        {step === 'grade' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-900 flex items-center justify-center">
                    <GraduationCap
                      size={20}
                      className="text-white"
                      weight="bold"
                    />
                  </div>
                  <div>
                    <h2
                      className="text-xl font-medium text-gray-900"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      {selectedLevel === 'college'
                        ? 'Select Course'
                        : 'Select Grade Level'}
                    </h2>
                    <p
                      className="text-xs text-gray-600"
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      {selectedLevel === 'college'
                        ? 'Choose the course for subject assignment'
                        : 'Choose the grade level for subject assignment'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {selectedLevel === 'college' ? (
              courses.length === 0 ? (
                <Card className="p-12 text-center border border-gray-200 bg-white border-1 shadow-sm rounded-xl">
                  <ChalkboardSimple
                    size={48}
                    className="mx-auto text-gray-400 mb-4"
                    weight="duotone"
                  />
                  <h3
                    className="text-lg font-medium text-gray-900 mb-2"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    No courses available
                  </h3>
                  <p
                    className="text-gray-600 text-justify border-1 shadow-sm border-blue-900 p-3 bg-white rounded-xl"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    There are currently no college courses available for subject
                    assignment. Please contact your registrar or try again
                    later.
                  </p>
                </Card>
              ) : (
                <>
                  <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200 text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-gray-500"
                            style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                          >
                            Code
                          </th>
                          <th
                            scope="col"
                            className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-gray-500"
                            style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                          >
                            Course Name
                          </th>
                          <th
                            scope="col"
                            className="px-4 py-3 text-center font-semibold uppercase tracking-wide text-gray-500"
                            style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                          >
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {getPaginatedCourses().map((course) => {
                          const isSelected = selectedCourse?.code === course.code
                          const rowHighlightClass = isSelected
                            ? 'bg-blue-50 border border-blue-100'
                            : 'hover:bg-gray-50 cursor-pointer'
                          const buttonClasses = isSelected
                            ? 'border-blue-900 bg-blue-900 text-white'
                            : 'border-blue-200 text-blue-900 hover:bg-blue-50'

                          return (
                            <tr
                              key={course.code}
                              className={`transition-colors ${rowHighlightClass}`}
                              onClick={() => handleCourseSelect(course)}
                            >
                              <td className="px-4 py-3 font-semibold text-gray-900">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="inline-block h-3 w-3 rounded"
                                    style={{
                                      backgroundColor: getColorValue(course.color),
                                    }}
                                    aria-hidden="true"
                                  />
                                  {course.code}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-black font-bold">
                                {course.name}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleCourseSelect(course)
                                  }}
                                  className={`mx-auto flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-medium transition-colors ${buttonClasses}`}
                                  aria-label={`Select ${course.name}`}
                                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                                >
                                  {isSelected ? (
                                    <Check size={14} weight="bold" className="text-white" />
                                  ) : (
                                    <Plus size={14} weight="bold" />
                                  )}
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>

                    {/* Pagination for Courses */}
                    {(() => {
                      const totalPages = Math.ceil(courses.length / itemsPerPage)
                      const startIndex = (currentGradePage - 1) * itemsPerPage
                      const endIndex = Math.min(startIndex + itemsPerPage, courses.length)

                      if (totalPages <= 1) return null

                      const pageButtons = Array.from(
                        { length: Math.min(totalPages, 7) },
                        (_, i) => {
                          let pageNum
                          if (totalPages <= 7) {
                            pageNum = i + 1
                          } else if (currentGradePage <= 4) {
                            pageNum = i + 1
                          } else if (currentGradePage >= totalPages - 3) {
                            pageNum = totalPages - 6 + i
                          } else {
                            pageNum = currentGradePage - 3 + i
                          }
                          return pageNum
                        }
                      )

                      return (
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between px-5 py-4 bg-white/90 border-t border-gray-200">
                          <div
                            className="text-xs text-gray-600 flex items-center gap-3"
                            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                          >
                            <div className="w-3 h-3 rounded-md bg-blue-900/80"></div>
                            Showing {startIndex + 1} to {endIndex} of{' '}
                            {courses.length} courses
                          </div>

                          <nav
                            className="flex flex-wrap items-center justify-end gap-2"
                            aria-label="Course pagination"
                          >
                            <button
                              onClick={() =>
                                setCurrentGradePage((prev) => Math.max(1, prev - 1))
                              }
                              disabled={currentGradePage === 1}
                              className={`rounded-lg text-xs font-medium px-3 py-2 transition-all duration-200 flex items-center gap-1 border ${
                                currentGradePage === 1
                                  ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                                  : 'border-blue-100 text-blue-900 hover:border-blue-300 hover:-translate-y-0.5'
                              }`}
                              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                              aria-label="Previous page"
                            >
                              <ArrowLeft size={14} />
                              Previous
                            </button>

                            <div className="flex items-center gap-1">
                              {pageButtons.map((pageNum) => (
                                <button
                                  key={pageNum}
                                  onClick={() => setCurrentGradePage(() => pageNum)}
                                  className={`rounded-lg text-xs font-medium px-3 py-2 transition-all duration-200 border ${
                                    currentGradePage === pageNum
                                      ? 'border-blue-900 bg-blue-900 text-white shadow-lg shadow-blue-900/30'
                                      : 'border-blue-100 bg-white text-blue-900 hover:border-blue-300 hover:-translate-y-0.5'
                                  }`}
                                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                                  aria-current={currentGradePage === pageNum ? 'page' : undefined}
                                >
                                  {pageNum}
                                </button>
                              ))}
                            </div>

                            <button
                              onClick={() =>
                                setCurrentGradePage((prev) => Math.min(totalPages, prev + 1))
                              }
                              disabled={currentGradePage === totalPages}
                              className={`rounded-lg text-xs font-medium px-3 py-2 transition-all duration-200 flex items-center gap-1 border ${
                                currentGradePage === totalPages
                                  ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                                  : 'border-blue-100 text-blue-900 hover:border-blue-300 hover:-translate-y-0.5'
                              }`}
                              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                              aria-label="Next page"
                            >
                              Next
                              <ArrowRight size={14} />
                            </button>
                          </nav>
                        </div>
                      )
                    })()}
                  </div>
                </>
              )
            ) : grades.length === 0 ? (
              <Card className="p-12 text-center border-none bg-gray-50 border-1 shadow-sm border-blue-900">
                <GraduationCap
                  size={48}
                  className="mx-auto text-gray-400 mb-4"
                  weight="duotone"
                />
                <h3
                  className="text-lg font-medium text-gray-900 mb-2"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  No grades available
                </h3>
                <p
                  className="text-gray-600 text-justify border-1 shadow-sm border-blue-900 p-3 bg-blue-50"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  There are currently no grade levels available for subject
                  assignment. Please contact your registrar or try again later.
                </p>
              </Card>
            ) : (
              <>
                <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200 text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-gray-500"
                          style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                        >
                          Grade Level
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-gray-500"
                          style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                        >
                          Department
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-center font-semibold uppercase tracking-wide text-gray-500"
                          style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                        >
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {getPaginatedGrades().map((grade) => {
                        const isSelected = selectedGrade?.id === grade.id
                        const isSelecting = selectingGrade === grade.id
                        const rowHighlightClass = isSelected
                          ? 'bg-blue-50 border border-blue-100'
                          : isSelecting
                          ? 'bg-blue-100 border border-blue-200'
                          : 'hover:bg-gray-50 cursor-pointer'
                        const buttonClasses = isSelected
                          ? 'border-blue-900 bg-blue-900 text-white'
                          : 'border-blue-200 text-blue-900 hover:bg-blue-50'

                        return (
                          <tr
                            key={grade.id}
                            className={`transition-colors ${rowHighlightClass}`}
                            onClick={() => handleGradeSelect(grade)}
                          >
                            <td className="px-4 py-3 font-semibold text-gray-900">
                              <div className="flex items-center gap-2">
                                <span
                                  className="inline-block h-3 w-3 rounded"
                                  style={{
                                    backgroundColor: getColorValue(grade.color),
                                  }}
                                  aria-hidden="true"
                                />
                                Grade {grade.gradeLevel} {grade.strand || ''}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-black font-bold">
                              {grade.department}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleGradeSelect(grade)
                                }}
                                className={`mx-auto flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-medium transition-colors ${buttonClasses}`}
                                aria-label={`Select Grade ${grade.gradeLevel}`}
                                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                              >
                                {isSelected ? (
                                  <Check size={14} weight="bold" className="text-white" />
                                ) : (
                                  <Plus size={14} weight="bold" />
                                )}
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>

                  {/* Pagination for Grades */}
                  {(() => {
                    const totalPages = Math.ceil(grades.length / itemsPerPage)
                    const startIndex = (currentGradePage - 1) * itemsPerPage
                    const endIndex = Math.min(startIndex + itemsPerPage, grades.length)

                    if (totalPages <= 1) return null

                    const pageButtons = Array.from(
                      { length: Math.min(totalPages, 7) },
                      (_, i) => {
                        let pageNum
                        if (totalPages <= 7) {
                          pageNum = i + 1
                        } else if (currentGradePage <= 4) {
                          pageNum = i + 1
                        } else if (currentGradePage >= totalPages - 3) {
                          pageNum = totalPages - 6 + i
                        } else {
                          pageNum = currentGradePage - 3 + i
                        }
                        return pageNum
                      }
                    )

                    return (
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between px-5 py-4 bg-white/90 border-t border-gray-200">
                        <div
                          className="text-xs text-gray-600 flex items-center gap-3"
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                        >
                          <div className="w-3 h-3 rounded-md bg-blue-900/80"></div>
                          Showing {startIndex + 1} to {endIndex} of{' '}
                          {grades.length} grades
                        </div>

                        <nav
                          className="flex flex-wrap items-center justify-end gap-2"
                          aria-label="Grade pagination"
                        >
                          <button
                            onClick={() =>
                              setCurrentGradePage((prev) => Math.max(1, prev - 1))
                            }
                            disabled={currentGradePage === 1}
                            className={`rounded-lg text-xs font-medium px-3 py-2 transition-all duration-200 flex items-center gap-1 border ${
                              currentGradePage === 1
                                ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                                : 'border-blue-100 text-blue-900 hover:border-blue-300 hover:-translate-y-0.5'
                            }`}
                            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                            aria-label="Previous page"
                          >
                            <ArrowLeft size={14} />
                            Previous
                          </button>

                          <div className="flex items-center gap-1">
                            {pageButtons.map((pageNum) => (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentGradePage(() => pageNum)}
                                className={`rounded-lg text-xs font-medium px-3 py-2 transition-all duration-200 border ${
                                  currentGradePage === pageNum
                                    ? 'border-blue-900 bg-blue-900 text-white shadow-lg shadow-blue-900/30'
                                    : 'border-blue-100 bg-white text-blue-900 hover:border-blue-300 hover:-translate-y-0.5'
                                }`}
                                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                                aria-current={currentGradePage === pageNum ? 'page' : undefined}
                              >
                                {pageNum}
                              </button>
                            ))}
                          </div>

                          <button
                            onClick={() =>
                              setCurrentGradePage((prev) => Math.min(totalPages, prev + 1))
                            }
                            disabled={currentGradePage === totalPages}
                            className={`rounded-lg text-xs font-medium px-3 py-2 transition-all duration-200 flex items-center gap-1 border ${
                              currentGradePage === totalPages
                                ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                                : 'border-blue-100 text-blue-900 hover:border-blue-300 hover:-translate-y-0.5'
                            }`}
                            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                            aria-label="Next page"
                          >
                            Next
                            <ArrowRight size={14} />
                          </button>
                        </nav>
                      </div>
                    )
                  })()}
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 2: Subject Selection */}
        {step === 'subjects' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-4">
              <h4
                className="text-lg font-medium text-gray-900"
                style={{ fontFamily: 'Poppins', fontWeight: 500 }}
              >
                {selectedLevel === 'college'
                  ? `Select Subjects for ${selectedCourse?.code}`
                  : `Select Subjects for Grade ${selectedGrade?.gradeLevel}`}
              </h4>
            </div>

            {/* Search and Filter Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="flex items-center gap-4 flex-1">
                <div className="flex-1 relative">
                  <MagnifyingGlass
                    size={18}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    weight="regular"
                  />
                  <Input
                    type="text"
                    placeholder="Search subjects by code or name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 w-full border-gray-200 rounded-lg focus:border-blue-900 focus:ring-2 focus:ring-blue-900"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                    className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-2 ${
                      filterCourse
                        ? 'bg-gradient-to-br from-blue-900 to-blue-800 text-white shadow-md'
                        : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-900'
                    }`}
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    <FunnelSimple size={16} weight="bold" />
                    Filter
                    {filterCourse && (
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
                      <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 shadow-lg rounded-xl z-20 p-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3
                              className="text-sm font-medium text-gray-900"
                              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                            >
                              Filter Subjects
                            </h3>
                            <button
                              onClick={() => setShowFilterDropdown(false)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <X size={16} />
                            </button>
                          </div>

                          {/* Course Filter (for college level) */}
                          {selectedLevel === 'college' && (
                            <div>
                              <Label
                                className="text-xs text-gray-700 mb-2 block"
                                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                              >
                                Course
                              </Label>
                              <select
                                value={filterCourse}
                                onChange={(e) => setFilterCourse(e.target.value)}
                                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                              >
                                <option value="">All Courses</option>
                                {courses.map((course) => (
                                  <option key={course.code} value={course.code}>
                                    {course.code} - {course.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          {/* Clear Filters */}
                          {filterCourse && (
                            <button
                              onClick={() => {
                                setFilterCourse('')
                              }}
                              className="w-full px-3 py-2 text-xs text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                            >
                              Clear Filters
                            </button>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Subjects Table */}
            <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200">
              {getFilteredSubjects().length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-xs text-gray-500">
                  No subjects match the current filters.
                </div>
              ) : (
                <>
                  <table className="min-w-full divide-y divide-gray-200 text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-gray-500"
                          style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                        >
                          Code
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-gray-500"
                          style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                        >
                          Subject
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-gray-500"
                          style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                        >
                          Total Units
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-center font-semibold uppercase tracking-wide text-gray-500"
                          style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                        >
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {getPaginatedSubjects().map((subject) => {
                      const isSelected = selectedSubjects.some(
                        (s) => s.id === subject.id
                      )
                      const assignedSections = getAssignedSectionsForSubject(
                        subject
                      )
                      const totalUnits =
                        subject.totalUnits ||
                        (subject.lectureUnits || 0) + (subject.labUnits || 0)
                      const rowHighlightClass = isSelected
                        ? 'bg-blue-50 border border-blue-100'
                        : 'hover:bg-gray-50'
                      const buttonClasses = isSelected
                        ? 'border-blue-900 bg-blue-900 text-white'
                        : 'border-blue-200 text-blue-900 hover:bg-blue-50'

                      return (
                        <tr
                          key={subject.id}
                          className={`transition-colors ${rowHighlightClass}`}
                        >
                          <td className="px-4 py-3 font-semibold text-gray-900">
                            <div className="flex items-center gap-2">
                              <span
                                className="inline-block h-3 w-3 rounded"
                                style={{
                                  backgroundColor: getColorValue(subject.color),
                                }}
                                aria-hidden="true"
                              />
                              {subject.code || 'N/A'}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-black font-bold">
                            {subject.name}
                            {assignedSections.length > 0 && (
                              <span className="mt-1 block text-[11px] font-semibold uppercase tracking-wide text-blue-600">
                                {assignedSections.length} section(s) assigned
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-semibold text-gray-900">
                            {totalUnits} units
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={(event) => {
                                event.stopPropagation()
                                handleSubjectToggle(subject)
                              }}
                              className={`mx-auto flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-medium transition-colors ${buttonClasses}`}
                              aria-label={
                                isSelected
                                  ? `Remove ${subject.name}`
                                  : `Add ${subject.name}`
                              }
                              disabled={loading}
                              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                            >
                              {isSelected ? (
                                <Minus size={14} weight="bold" className="text-white" />
                              ) : (
                                <Plus size={14} weight="bold" />
                              )}
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                    </tbody>
                  </table>

                  {/* Pagination */}
                  {(() => {
                    const filteredSubjects = getFilteredSubjects()
                    const totalPages = Math.ceil(filteredSubjects.length / itemsPerPage)
                    const startIndex = (currentPage - 1) * itemsPerPage
                    const endIndex = Math.min(startIndex + itemsPerPage, filteredSubjects.length)

                    if (totalPages <= 1) return null

                    const pageButtons = Array.from(
                      { length: Math.min(totalPages, 7) },
                      (_, i) => {
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
                      }
                    )

                    return (
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between px-5 py-4 bg-white/90 border-t border-gray-200">
                        <div
                          className="text-xs text-gray-600 flex items-center gap-3"
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                        >
                          <div className="w-3 h-3 rounded-md bg-blue-900/80"></div>
                          Showing {startIndex + 1} to {endIndex} of{' '}
                          {filteredSubjects.length} subjects
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
                            className={`rounded-lg text-xs font-medium px-3 py-2 transition-all duration-200 flex items-center gap-1 border ${
                              currentPage === 1
                                ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                                : 'border-blue-100 text-blue-900 hover:border-blue-300 hover:-translate-y-0.5'
                            }`}
                            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                            aria-label="Previous page"
                          >
                            <ArrowLeft size={14} />
                            Previous
                          </button>

                          <div className="flex items-center gap-1">
                            {pageButtons.map((pageNum) => (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPage(() => pageNum)}
                                className={`rounded-lg text-xs font-medium px-3 py-2 transition-all duration-200 border ${
                                  currentPage === pageNum
                                    ? 'border-blue-900 bg-blue-900 text-white shadow-lg shadow-blue-900/30'
                                    : 'border-blue-100 bg-white text-blue-900 hover:border-blue-300 hover:-translate-y-0.5'
                                }`}
                                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                                aria-current={currentPage === pageNum ? 'page' : undefined}
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
                            className={`rounded-lg text-xs font-medium px-3 py-2 transition-all duration-200 flex items-center gap-1 border ${
                              currentPage === totalPages
                                ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                                : 'border-blue-100 text-blue-900 hover:border-blue-300 hover:-translate-y-0.5'
                            }`}
                            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                            aria-label="Next page"
                          >
                            Next
                            <ArrowRight size={14} />
                          </button>
                        </nav>
                      </div>
                    )
                  })()}
                </>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleBack}
                variant="outline"
                className="flex-1 flex items-center justify-center gap-2 rounded-lg"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                <ArrowLeft size={16} />
                Back to {selectedLevel === 'college' ? 'Courses' : 'Grades'}
              </Button>
              <Button
                onClick={handleContinueToSections}
                disabled={selectedSubjects.length === 0}
                className="flex-1 rounded-lg bg-gradient-to-br from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 text-white border"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Continue to Sections ({selectedSubjects.length} selected)
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Section Selection */}
        {step === 'sections' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-4">
              <h4
                className="text-lg font-medium text-gray-900"
                style={{ fontFamily: 'Poppins', fontWeight: 500 }}
              >
                Assign {selectedSubjects[currentSubjectIndex]?.name} to Sections
              </h4>
              {selectedSubjects.length > 1 && (
                <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                  {currentSubjectIndex + 1} of {selectedSubjects.length}
                </span>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 p-4 mb-6">
              <p
                className="text-xs text-blue-900"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                Select the sections where {teacher?.firstName}{' '}
                {teacher?.lastName} will teach{' '}
                {selectedSubjects[currentSubjectIndex]?.name}.
                {selectedLevel === 'college' && selectedCourse && (
                  <span className="block mt-1">
                    Course: {selectedCourse.code} - {selectedCourse.name}
                  </span>
                )}
                {assignedSectionIds.length > 0 && (
                  <span className="block mt-2 font-medium">
                    Currently assigned to {assignedSectionIds.length} section(s)
                  </span>
                )}
              </p>
            </div>

            {/* Group sections by subject with subject headers */}
            <div className="space-y-6">
              {selectedSubjects.map((subject, sIdx) => {
                const assignedForThis = getAssignedSectionsForSubject(subject)
                const selectedForThis =
                  selectedSectionsBySubject[subject.id] || []
                return (
                  <div
                    key={subject.id}
                    className="animate-in fade-in slide-in-from-bottom-4"
                    style={{
                      animationDelay: `${sIdx * 100}ms`,
                      animationFillMode: 'both',
                    }}
                  >
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white flex items-center justify-center">
                          <BookOpen
                            size={16}
                            style={{ color: getColorValue(subject.color) }}
                            weight="fill"
                          />
                        </div>
                        <div>
                          <h5
                            className="text-sm font-medium text-gray-900"
                            style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                          >
                            {subject.code} {subject.name}
                          </h5>
                          <p
                            className="text-xs text-gray-600"
                            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                          >
                            {
                              new Set([...selectedForThis, ...assignedForThis])
                                .size
                            }{' '}
                            section(s) selected
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          // Unassign teacher from all currently selected sections for this subject
                          try {
                            setRemovingBySubject((prev) => ({
                              ...prev,
                              [subject.id]: true,
                            }))
                            const targetSections =
                              selectedSectionsBySubject[subject.id] || []
                            if (targetSections.length === 0) {
                              toast.info(
                                'No sections selected to remove for this subject'
                              )
                              setRemovingBySubject((prev) => ({
                                ...prev,
                                [subject.id]: false,
                              }))
                              return
                            }
                            let removed = 0
                            const errors: string[] = []
                            for (const sectionId of targetSections) {
                              const url = `/api/teacher-assignments?subjectId=${encodeURIComponent(
                                subject.id
                              )}&sectionId=${encodeURIComponent(
                                sectionId
                              )}&registrarUid=${encodeURIComponent(
                                registrarUid
                              )}&teacherId=${encodeURIComponent(
                                teacher?.id || ''
                              )}`
                              const res = await fetch(url, { method: 'DELETE' })
                              const data = await res.json().catch(() => ({}))
                              if (res.ok) {
                                removed++
                              } else {
                                errors.push(data.error || 'Failed to remove')
                              }
                            }
                            if (removed > 0) {
                              toast.success(
                                `Removed ${removed} assignment(s) for ${subject.name}`
                              )
                              // Clear local selection for this subject
                              setSelectedSectionsBySubject((prev) => ({
                                ...prev,
                                [subject.id]: [],
                              }))
                              // Reload subjects to get fresh teacherAssignments data
                              if (selectedLevel === 'high-school' && selectedGrade) {
                                await loadSubjectsForGrade(selectedGrade.gradeLevel)
                              } else if (selectedLevel === 'college' && selectedCourse) {
                                await loadSubjectsForCourse(selectedCourse.code)
                              }
                            }
                            if (errors.length > 0) {
                              toast.warning(
                                `Some removals failed: ${errors.join(', ')}`
                              )
                            }
                          } catch (err) {
                            toast.error('Failed to remove assignments')
                          } finally {
                            setRemovingBySubject((prev) => ({
                              ...prev,
                              [subject.id]: false,
                            }))
                          }
                        }}
                        className={`px-2 py-1 border-2 text-xs rounded-lg flex items-center gap-1 ${
                          removingBySubject[subject.id]
                            ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                            : 'border-red-600 text-red-700 hover:bg-red-50'
                        }`}
                        disabled={!!removingBySubject[subject.id]}
                      >
                        {removingBySubject[subject.id] ? (
                          <>
                            <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                            Removing...
                          </>
                        ) : (
                          <>
                            <Trash size={14} />
                            Remove
                          </>
                        )}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      {sections.map((section, index) => {
                        const isSelected = (
                          selectedSectionsBySubject[subject.id] || []
                        ).includes(section.id)
                        return (
                          <button
                            key={`${subject.id}-${section.id}`}
                            onClick={() =>
                              handleSectionToggle(section.id, subject.id)
                            }
                            className={`p-4 border-2 rounded-xl transition-all duration-200 text-left animate-in fade-in slide-in-from-bottom-4 ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-25'
                            }`}
                            style={{
                              animationDelay: `${index * 60}ms`,
                              animationFillMode: 'both',
                            }}
                            disabled={loading}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                  isSelected ? 'bg-gradient-to-br from-blue-800 to-blue-900' : 'bg-white border border-gray-200'
                                }`}
                              >
                                <Users
                                  size={16}
                                  className={
                                    isSelected ? 'text-white' : 'text-gray-600'
                                  }
                                  weight="fill"
                                />
                              </div>
                              <div className="flex-1">
                                <h5
                                  className="text-xs font-medium text-gray-900"
                                  style={{
                                    fontFamily: 'Poppins',
                                    fontWeight: 500,
                                  }}
                                >
                                  Section {section.sectionName}
                                </h5>
                                <p
                                  className="text-xs text-gray-600"
                                  style={{
                                    fontFamily: 'Poppins',
                                    fontWeight: 300,
                                  }}
                                >
                                  {section.rank} • {section.department}
                                </p>
                              </div>
                              <div
                                className={`w-5 h-5 border-2 flex items-center justify-center ${
                                  isSelected
                                    ? 'border-blue-500 bg-blue-500'
                                    : 'border-gray-300'
                                }`}
                              >
                                {isSelected && (
                                  <Check size={12} className="text-white" />
                                )}
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleBack}
                variant="outline"
                className="flex-1 flex items-center justify-center gap-2 rounded-lg"
                disabled={assigning}
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                <ArrowLeft size={16} />
                Back to Subjects
              </Button>
              <Button
                onClick={handleAssignSubjects}
                disabled={assigning}
                className="flex-1 rounded-lg bg-gradient-to-br from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 text-white border"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                {assigning ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Assigning...
                  </>
                ) : (
                  <>
                    <Plus size={16} className="mr-2" />
                    Save Assignment
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

// Helper function to get color value
const getColorValue = (color: string): string => {
  const colorMap: Record<string, string> = {
    'blue-900': '#1d4ed8',
    'blue-900': '#1e40af',
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
  return colorMap[color] || '#1e40af'
}
