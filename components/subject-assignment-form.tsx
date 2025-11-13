'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal } from '@/components/ui/modal'
import {
  Calculator,
  X,
  Plus,
  Trash,
  Books,
  GraduationCap,
  Check,
} from '@phosphor-icons/react'
import { toast } from 'react-toastify'

interface SubjectAssignmentFormProps {
  onSubmit: (data: {
    level: 'high-school' | 'college'
    gradeLevel?: number
    courseCode?: string
    courseName?: string
    yearLevel?: number
    semester?: 'first-sem' | 'second-sem'
    subjectSetId: string
    strand?: string // For SHS
  }) => Promise<void>
  onCancel: () => void
  initialData?: any
  isEditing: boolean
  loading: boolean
}

interface SubjectSet {
  id: string
  name: string
  description: string
  color: string
  subjects: string[]
}

interface Course {
  code: string
  name: string
  color: string
}

interface Grade {
  id: string
  gradeLevel: number
  department: string
  strand?: string
  color?: string
  description?: string
}

export default function SubjectAssignmentForm({
  onSubmit,
  onCancel,
  initialData,
  isEditing,
  loading,
}: SubjectAssignmentFormProps) {
  const [formData, setFormData] = useState({
    level: 'high-school' as 'high-school' | 'college',
    gradeId: '', // Use gradeId instead of gradeLevel to uniquely identify strands
    gradeLevel: 7, // Keep for backward compatibility and display
    courseCode: '',
    courseName: '',
    yearLevel: 1,
    semester: 'first-sem' as 'first-sem' | 'second-sem',
    subjectSetId: '',
    strand: '', // For SHS
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [subjectSets, setSubjectSets] = useState<SubjectSet[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [showConfirmationModal, setShowConfirmationModal] = useState(false)
  const [selectedSubjectDetails, setSelectedSubjectDetails] = useState<any[]>(
    []
  )
  const [loadingSubjects, setLoadingSubjects] = useState(false)

  // Load data on component mount
  useEffect(() => {
    loadSubjectSets()
    loadCourses()
    loadGrades()
  }, [])

  // Populate form with initial data when editing
  useEffect(() => {
    if (initialData && isEditing && grades.length > 0) {
      // Try to find grade by gradeId first, then by gradeLevel + strand
      let selectedGrade = null
      if (initialData.gradeId) {
        selectedGrade = grades.find((g) => g.id === initialData.gradeId)
      }

      // If not found by gradeId, try to match by gradeLevel + strand
      if (!selectedGrade && initialData.gradeLevel && initialData.strand) {
        selectedGrade = grades.find(
          (g) =>
            g.gradeLevel === initialData.gradeLevel &&
            g.strand === initialData.strand
        )
      }

      // Fallback to gradeLevel only (for backward compatibility)
      if (!selectedGrade && initialData.gradeLevel) {
        selectedGrade = grades.find(
          (g) => g.gradeLevel === (initialData.gradeLevel || 7)
        )
      }

      setFormData({
        level: initialData.level || 'high-school',
        gradeId: selectedGrade?.id || '',
        gradeLevel: selectedGrade?.gradeLevel || initialData.gradeLevel || 7,
        courseCode: initialData.courseCode || '',
        courseName: initialData.courseName || '',
        yearLevel: initialData.yearLevel || 1,
        semester: initialData.semester || 'first-sem',
        subjectSetId:
          initialData.subjectSetId || initialData.subjectSetIds?.[0] || '',
        strand: selectedGrade?.strand || initialData.strand || '',
      })
    }
  }, [initialData, isEditing, grades])

  const loadSubjectSets = async () => {
    try {
      const response = await fetch('/api/subject-sets')
      if (response.ok) {
        const data = await response.json()
        setSubjectSets(data.subjectSets || [])
      }
    } catch (error) {
      console.error('Error loading subject sets:', error)
      toast.error('Failed to load subject sets')
    }
  }

  const loadCourses = async () => {
    try {
      const response = await fetch('/api/courses')
      if (response.ok) {
        const data = await response.json()
        setCourses(data.courses || [])
      }
    } catch (error) {
      console.error('Error loading courses:', error)
      toast.error('Failed to load courses')
    }
  }

  const loadGrades = async () => {
    try {
      const response = await fetch('/api/grades')
      if (response.ok) {
        const data = await response.json()
        setGrades(data.grades || [])
      }
    } catch (error) {
      console.error('Error loading grades:', error)
      toast.error('Failed to load grades')
    } finally {
      setLoadingData(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const handleLevelChange = (level: 'high-school' | 'college') => {
    setFormData((prev) => ({
      ...prev,
      level,
      // Reset related fields when switching levels
      gradeId: level === 'high-school' ? prev.gradeId : '',
      gradeLevel: level === 'high-school' ? prev.gradeLevel : 7,
      strand: level === 'high-school' ? prev.strand : '',
      courseCode: level === 'college' ? prev.courseCode : '',
      courseName: level === 'college' ? prev.courseName : '',
      yearLevel: level === 'college' ? prev.yearLevel : 1,
      semester: level === 'college' ? prev.semester : 'first-sem',
    }))
    if (errors.level) {
      setErrors((prev) => ({ ...prev, level: '' }))
    }
  }

  const handleGradeChange = (gradeId: string) => {
    const selectedGrade = grades.find((g) => g.id === gradeId)
    if (!selectedGrade) return

    const isSHS = selectedGrade.department === 'SHS'

    setFormData((prev) => ({
      ...prev,
      gradeId,
      gradeLevel: selectedGrade.gradeLevel,
      strand: selectedGrade.strand || '',
      // Reset semester if switching from SHS to JHS or vice versa
      semester: isSHS ? prev.semester : 'first-sem',
    }))
    if (errors.gradeLevel) {
      setErrors((prev) => ({ ...prev, gradeLevel: '' }))
    }
    if (errors.semester && !isSHS) {
      setErrors((prev) => ({ ...prev, semester: '' }))
    }
  }

  const handleCourseChange = (courseCode: string) => {
    const selectedCourse = courses.find((course) => course.code === courseCode)
    setFormData((prev) => ({
      ...prev,
      courseCode,
      courseName: selectedCourse?.name || '',
    }))
    if (errors.courseCode) {
      setErrors((prev) => ({ ...prev, courseCode: '' }))
    }
  }

  const handleSubjectSetSelect = (subjectSetId: string) => {
    setFormData((prev) => ({
      ...prev,
      subjectSetId: prev.subjectSetId === subjectSetId ? '' : subjectSetId,
    }))
    if (errors.subjectSetId) {
      setErrors((prev) => ({ ...prev, subjectSetId: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.level) {
      newErrors.level = 'Level selection is required'
    }

    if (formData.level === 'high-school') {
      if (!formData.gradeId) {
        newErrors.gradeLevel = 'Grade selection is required'
      }
    } else if (formData.level === 'college') {
      if (!formData.courseCode) {
        newErrors.courseCode = 'Course selection is required'
      }
      if (
        !formData.yearLevel ||
        formData.yearLevel < 1 ||
        formData.yearLevel > 4
      ) {
        newErrors.yearLevel = 'Year level must be between 1 and 4'
      }
      if (!formData.semester) {
        newErrors.semester = 'Semester selection is required'
      }
    }

    if (!formData.subjectSetId) {
      newErrors.subjectSetId = 'A subject set must be selected'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const loadSubjectDetails = async (subjectIds: string[]) => {
    try {
      setLoadingSubjects(true)
      const response = await fetch('/api/subjects')
      if (response.ok) {
        const data = await response.json()
        const allSubjects = data.subjects || []
        // Filter subjects that are in the selected subject set
        const filteredSubjects = allSubjects.filter((subject: any) =>
          subjectIds.includes(subject.id)
        )
        setSelectedSubjectDetails(filteredSubjects)
      }
    } catch (error) {
      console.error('Error loading subject details:', error)
      toast.error('Failed to load subject details')
    } finally {
      setLoadingSubjects(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    // Get the selected subject set
    const selectedSubjectSet = subjectSets.find(
      (set) => set.id === formData.subjectSetId
    )

    // Prepare submission data with strand for SHS
    const selectedGrade = formData.gradeId
      ? grades.find((g) => g.id === formData.gradeId)
      : null
    const isSHS = selectedGrade?.department === 'SHS'
    const submissionData = {
      level: formData.level,
      gradeLevel: selectedGrade?.gradeLevel || formData.gradeLevel,
      gradeId: formData.gradeId || undefined,
      courseCode: formData.courseCode || undefined,
      courseName: formData.courseName || undefined,
      yearLevel: formData.yearLevel || undefined,
      semester: formData.semester || undefined,
      subjectSetId: formData.subjectSetId,
      strand: isSHS
        ? formData.strand || selectedGrade?.strand || ''
        : undefined,
    }

    if (selectedSubjectSet && selectedSubjectSet.subjects.length > 0) {
      // Load subject details and show confirmation modal
      await loadSubjectDetails(selectedSubjectSet.subjects)
      setShowConfirmationModal(true)
    } else {
      // If no subjects, submit directly
      try {
        await onSubmit(submissionData)
      } catch (error) {
        console.error('Error submitting form:', error)
      }
    }
  }

  const handleConfirmSubmit = async () => {
    setShowConfirmationModal(false)
    try {
      // Prepare submission data with strand for SHS
      const selectedGrade = formData.gradeId
        ? grades.find((g) => g.id === formData.gradeId)
        : null
      const isSHS = selectedGrade?.department === 'SHS'

      const submissionData = {
        level: formData.level,
        gradeLevel: selectedGrade?.gradeLevel || formData.gradeLevel,
        gradeId: formData.gradeId || undefined,
        courseCode: formData.courseCode || undefined,
        courseName: formData.courseName || undefined,
        yearLevel: formData.yearLevel || undefined,
        semester: formData.semester || undefined,
        subjectSetId: formData.subjectSetId,
        strand: isSHS
          ? formData.strand || selectedGrade?.strand || ''
          : undefined,
      }

      await onSubmit(submissionData)
    } catch (error) {
      console.error('Error submitting form:', error)
    }
  }

  const handleCancelConfirmation = () => {
    setShowConfirmationModal(false)
    setSelectedSubjectDetails([])
  }

  const getCourseColor = (courseCode: string) => {
    const course = courses.find((c) => c.code === courseCode)
    return course?.color || 'blue-900'
  }

  // Helper function to get course color value
  const getCourseColorValue = (color: string): string => {
    const colorMap: Record<string, string> = {
      'blue-900': '#1e40af',
      'red-700': '#b91c1c',
      'red-800': '#991b1b',
      'emerald-700': '#047857',
      'emerald-800': '#065f46',
      'yellow-700': '#a16207',
      'yellow-800': '#854d0e',
      'orange-700': '#c2410c',
      'orange-800': '#9a3412',
      'violet-700': '#6d28d9',
      'violet-800': '#5b21b6',
      'purple-700': '#7e22ce',
      'purple-800': '#6b21a8',
      'indigo-700': '#4338ca',
      'indigo-800': '#3730a3',
    }
    return colorMap[color] || '#1e40af' // Default to blue-900
  }

  // Helper function to get grade color value
  const getGradeColorValue = (color: string): string => {
    const colorMap: Record<string, string> = {
      'blue-900': '#1e40af',
      'red-700': '#b91c1c',
      'red-800': '#991b1b',
      'emerald-700': '#047857',
      'emerald-800': '#065f46',
      'yellow-700': '#a16207',
      'yellow-800': '#854d0e',
      'orange-700': '#c2410c',
      'orange-800': '#9a3412',
      'violet-700': '#6d28d9',
      'violet-800': '#5b21b6',
      'purple-700': '#7e22ce',
      'purple-800': '#6b21a8',
      'indigo-700': '#4338ca',
      'indigo-800': '#3730a3',
    }
    return colorMap[color] || '#1e40af'
  }

  // Helper function to get subject set color value
  const getSubjectSetColorValue = (color: string): string => {
    const colorMap: Record<string, string> = {
      'blue-900': '#1e40af',
      'red-700': '#b91c1c',
      'red-800': '#991b1b',
      'emerald-700': '#047857',
      'emerald-800': '#065f46',
      'yellow-700': '#a16207',
      'yellow-800': '#854d0e',
      'orange-700': '#c2410c',
      'orange-800': '#9a3412',
      'violet-700': '#6d28d9',
      'violet-800': '#5b21b6',
      'purple-700': '#7e22ce',
      'purple-800': '#6b21a8',
      'indigo-700': '#4338ca',
      'indigo-800': '#3730a3',
    }
    return colorMap[color] || '#1e40af'
  }

  if (loadingData) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl max-w-2xl w-full p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 w-1/3"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 w-full"></div>
            <div className="h-4 bg-gray-200 w-2/3"></div>
            <div className="h-4 bg-gray-200 w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl max-w-4xl w-full p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-800 to-blue-900 rounded-xl flex items-center justify-center">
            <Calculator size={20} className="text-white" weight="fill" />
          </div>
          <div>
            <h3
              className="text-lg font-semibold text-gray-900"
              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
            >
              {isEditing
                ? 'Edit Subject Assignment'
                : 'Create Subject Assignment'}
            </h3>
            <p
              className="text-sm text-gray-600"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              {isEditing
                ? 'Update subject assignment information'
                : 'Assign subject sets to grade levels or courses'}
            </p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          disabled={loading}
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Level Selection */}
        <div className="space-y-2">
          <Label
            className="block text-sm font-medium text-gray-700"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            Level *
          </Label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleLevelChange('high-school')}
              disabled={loading}
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200 ${
                formData.level === 'high-school'
                  ? 'bg-gradient-to-br from-blue-800 to-blue-900 text-white border-blue-900 shadow-md'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              High School
            </button>
            <button
              type="button"
              onClick={() => handleLevelChange('college')}
              disabled={loading}
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200 ${
                formData.level === 'college'
                  ? 'bg-gradient-to-br from-blue-800 to-blue-900 text-white border-blue-900 shadow-md'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              College
            </button>
          </div>
          {errors.level && (
            <p
              className="text-sm text-red-600"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              {errors.level}
            </p>
          )}
        </div>

        {/* High School Grade Level Selection */}
        {formData.level === 'high-school' && (
          <div className="space-y-2">
            <Label
              className="block text-sm font-medium text-gray-700"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Grade Level * ({grades.length} available)
            </Label>
            <div className="flex flex-wrap gap-2">
              {grades.map((grade) => {
                const isSelected = formData.gradeId === grade.id
                const gradeColor = grade.color || 'blue-900'
                const gradeColorValue = getGradeColorValue(gradeColor)
                const getGradeDisplayName = (grade: Grade) => {
                  if (grade.department === 'SHS' && grade.strand) {
                    return `Grade ${grade.gradeLevel} - ${grade.strand}`
                  }
                  return `Grade ${grade.gradeLevel} (${grade.department})`
                }

                return (
                  <button
                    key={grade.id}
                    type="button"
                    onClick={() => handleGradeChange(grade.id)}
                    disabled={loading}
                    className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200 ${
                      isSelected
                        ? 'text-white shadow-md'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    style={{
                      fontFamily: 'Poppins',
                      fontWeight: 300,
                      backgroundColor: isSelected ? gradeColorValue : 'white',
                      borderColor: isSelected ? gradeColorValue : '#d1d5db',
                      color: isSelected ? 'white' : '#374151',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected && !loading) {
                        e.currentTarget.style.borderColor = gradeColorValue
                        e.currentTarget.style.backgroundColor = `${gradeColorValue}15`
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected && !loading) {
                        e.currentTarget.style.borderColor = '#d1d5db'
                        e.currentTarget.style.backgroundColor = 'white'
                        e.currentTarget.style.color = '#374151'
                      }
                    }}
                  >
                    {getGradeDisplayName(grade)}
                  </button>
                )
              })}
            </div>
            {formData.gradeId && (
              <p
                className="text-xs text-gray-600"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                Selected:{' '}
                {(() => {
                  const selectedGrade = grades.find(
                    (g) => g.id === formData.gradeId
                  )
                  if (selectedGrade) {
                    if (
                      selectedGrade.department === 'SHS' &&
                      selectedGrade.strand
                    ) {
                      return `Grade ${selectedGrade.gradeLevel} - ${selectedGrade.strand}`
                    }
                    return `Grade ${selectedGrade.gradeLevel} (${selectedGrade.department})`
                  }
                  return 'Unknown'
                })()}
              </p>
            )}
            {errors.gradeLevel && (
              <p
                className="text-sm text-red-600"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                {errors.gradeLevel}
              </p>
            )}
          </div>
        )}

        {/* SHS Semester Selection */}
        {formData.level === 'high-school' &&
          (() => {
            const selectedGrade = formData.gradeId
              ? grades.find((g) => g.id === formData.gradeId)
              : null
            const isSHS = selectedGrade?.department === 'SHS'

            if (!isSHS) return null

            return (
              <div className="space-y-2">
                <Label
                  className="block text-sm font-medium text-gray-700"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Semester * (SHS)
                </Label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleInputChange('semester', 'first-sem')}
                    disabled={loading}
                    className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200 ${
                      formData.semester === 'first-sem'
                        ? 'text-white shadow-md'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    style={{
                      fontFamily: 'Poppins',
                      fontWeight: 300,
                      backgroundColor:
                        formData.semester === 'first-sem'
                          ? getGradeColorValue(
                              selectedGrade?.color || 'blue-900'
                            )
                          : 'white',
                      borderColor:
                        formData.semester === 'first-sem'
                          ? getGradeColorValue(
                              selectedGrade?.color || 'blue-900'
                            )
                          : '#d1d5db',
                      color:
                        formData.semester === 'first-sem' ? 'white' : '#374151',
                    }}
                  >
                    First Semester
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInputChange('semester', 'second-sem')}
                    disabled={loading}
                    className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200 ${
                      formData.semester === 'second-sem'
                        ? 'text-white shadow-md'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    style={{
                      fontFamily: 'Poppins',
                      fontWeight: 300,
                      backgroundColor:
                        formData.semester === 'second-sem'
                          ? getGradeColorValue(
                              selectedGrade?.color || 'blue-900'
                            )
                          : 'white',
                      borderColor:
                        formData.semester === 'second-sem'
                          ? getGradeColorValue(
                              selectedGrade?.color || 'blue-900'
                            )
                          : '#d1d5db',
                      color:
                        formData.semester === 'second-sem'
                          ? 'white'
                          : '#374151',
                    }}
                  >
                    Second Semester
                  </button>
                </div>
                {errors.semester && (
                  <p
                    className="text-sm text-red-600"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    {errors.semester}
                  </p>
                )}
              </div>
            )
          })()}

        {/* College Course Selection */}
        {formData.level === 'college' && (
          <div className="space-y-2">
            <Label
              className="block text-sm font-medium text-gray-700"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Course *
            </Label>
            <div className="flex flex-wrap gap-2">
              {courses.map((course: any) => {
                const courseColor = course.color || 'emerald-800'
                const courseColorValue = getCourseColorValue(courseColor)
                const isSelected = formData.courseCode === course.code
                return (
                  <button
                    key={course.code}
                    type="button"
                    onClick={() => handleCourseChange(course.code)}
                    disabled={loading}
                    className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200 ${
                      isSelected
                        ? 'text-white shadow-md'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    style={{
                      fontFamily: 'Poppins',
                      fontWeight: 300,
                      backgroundColor: isSelected ? courseColorValue : 'white',
                      borderColor: isSelected ? courseColorValue : '#d1d5db',
                      color: isSelected ? 'white' : '#374151',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected && !loading) {
                        e.currentTarget.style.borderColor = courseColorValue
                        e.currentTarget.style.backgroundColor = `${courseColorValue}15`
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected && !loading) {
                        e.currentTarget.style.borderColor = '#d1d5db'
                        e.currentTarget.style.backgroundColor = 'white'
                        e.currentTarget.style.color = '#374151'
                      }
                    }}
                  >
                    {course.code}
                  </button>
                )
              })}
            </div>
            {formData.courseCode && (
              <p
                className="text-xs text-gray-600"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                Selected: {formData.courseCode} - {formData.courseName}
              </p>
            )}
            {errors.courseCode && (
              <p
                className="text-sm text-red-600"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                {errors.courseCode}
              </p>
            )}
          </div>
        )}

        {/* College Year Level and Semester */}
        {formData.level === 'college' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label
                className="block text-sm font-medium text-gray-700"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Year Level *
              </Label>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4].map((year) => {
                  const isSelected = formData.yearLevel === year
                  return (
                    <button
                      key={year}
                      type="button"
                      onClick={() => handleInputChange('yearLevel', year)}
                      disabled={loading}
                      className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200 ${
                        isSelected
                          ? 'bg-gradient-to-br from-blue-800 to-blue-900 text-white border-blue-900 shadow-md'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      Year {year}
                    </button>
                  )
                })}
              </div>
              {errors.yearLevel && (
                <p
                  className="text-sm text-red-600"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  {errors.yearLevel}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                className="block text-sm font-medium text-gray-700"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Semester *
              </Label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleInputChange('semester', 'first-sem')}
                  disabled={loading}
                  className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200 ${
                    formData.semester === 'first-sem'
                      ? 'text-white shadow-md'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  style={{
                    fontFamily: 'Poppins',
                    fontWeight: 300,
                    backgroundColor:
                      formData.semester === 'first-sem'
                        ? getCourseColorValue(
                            getCourseColor(formData.courseCode)
                          )
                        : 'white',
                    borderColor:
                      formData.semester === 'first-sem'
                        ? getCourseColorValue(
                            getCourseColor(formData.courseCode)
                          )
                        : '#d1d5db',
                    color:
                      formData.semester === 'first-sem' ? 'white' : '#374151',
                  }}
                >
                  First Semester
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange('semester', 'second-sem')}
                  disabled={loading}
                  className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200 ${
                    formData.semester === 'second-sem'
                      ? 'text-white shadow-md'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  style={{
                    fontFamily: 'Poppins',
                    fontWeight: 300,
                    backgroundColor:
                      formData.semester === 'second-sem'
                        ? getCourseColorValue(
                            getCourseColor(formData.courseCode)
                          )
                        : 'white',
                    borderColor:
                      formData.semester === 'second-sem'
                        ? getCourseColorValue(
                            getCourseColor(formData.courseCode)
                          )
                        : '#d1d5db',
                    color:
                      formData.semester === 'second-sem' ? 'white' : '#374151',
                  }}
                >
                  Second Semester
                </button>
              </div>
              {errors.semester && (
                <p
                  className="text-sm text-red-600"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  {errors.semester}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Subject Set Selection */}
        <div className="space-y-2">
          <Label
            className="block text-sm font-medium text-gray-700"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            Subject Set * ({subjectSets.length} available)
          </Label>
          <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto p-2 border border-gray-200 rounded-xl bg-gray-50">
            {subjectSets.map((subjectSet) => {
              const isSelected = formData.subjectSetId === subjectSet.id
              const setColorValue = getSubjectSetColorValue(
                subjectSet.color || 'blue-900'
              )
              return (
                <button
                  key={subjectSet.id}
                  type="button"
                  onClick={() => handleSubjectSetSelect(subjectSet.id)}
                  disabled={loading}
                  className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200 ${
                    isSelected
                      ? 'text-white shadow-md'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  style={{
                    fontFamily: 'Poppins',
                    fontWeight: 300,
                    backgroundColor: isSelected ? setColorValue : 'white',
                    borderColor: isSelected ? setColorValue : '#d1d5db',
                    color: isSelected ? 'white' : '#374151',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected && !loading) {
                      e.currentTarget.style.borderColor = setColorValue
                      e.currentTarget.style.backgroundColor = `${setColorValue}15`
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected && !loading) {
                      e.currentTarget.style.borderColor = '#d1d5db'
                      e.currentTarget.style.backgroundColor = 'white'
                      e.currentTarget.style.color = '#374151'
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Books size={14} weight="fill" />
                    <span>{subjectSet.name}</span>
                    <span className="text-xs opacity-80">
                      ({subjectSet.subjects.length})
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
          {formData.subjectSetId && (
            <p
              className="text-xs text-gray-600"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              Selected:{' '}
              {subjectSets.find((s) => s.id === formData.subjectSetId)?.name ||
                'Unknown'}
            </p>
          )}
          {errors.subjectSetId && (
            <p
              className="text-sm text-red-600"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              {errors.subjectSetId}
            </p>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={loading}
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || !formData.subjectSetId}
            className="rounded-lg bg-gradient-to-br from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 text-white border"
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Plus size={16} className="mr-2" />
                {isEditing ? 'Update Assignment' : 'Create Assignment'}
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Confirmation Modal */}
      {showConfirmationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-sm max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-800 to-blue-900 rounded-xl flex items-center justify-center">
                  <Calculator size={20} className="text-white" weight="fill" />
                </div>
                <div>
                  <h3
                    className="text-lg font-semibold text-gray-900"
                    style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                  >
                    Confirm Subject Assignment
                  </h3>
                  <p
                    className="text-sm text-gray-600"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    Review the subjects that will be assigned
                  </p>
                </div>
              </div>
              <button
                onClick={handleCancelConfirmation}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={loading}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Assignment Summary */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p
                      className="text-xs text-gray-600 mb-1"
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      Level
                    </p>
                    <p
                      className="text-sm font-medium text-gray-900"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      {formData.level === 'high-school'
                        ? 'High School'
                        : 'College'}
                    </p>
                  </div>
                  {formData.level === 'high-school' ? (
                    <>
                      <div>
                        <p
                          className="text-xs text-gray-600 mb-1"
                          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                        >
                          Grade Level
                        </p>
                        <p
                          className="text-sm font-medium text-gray-900"
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                        >
                          {(() => {
                            const selectedGrade = formData.gradeId
                              ? grades.find((g) => g.id === formData.gradeId)
                              : null
                            if (selectedGrade) {
                              if (
                                selectedGrade.department === 'SHS' &&
                                selectedGrade.strand
                              ) {
                                return `Grade ${selectedGrade.gradeLevel} - ${selectedGrade.strand}`
                              }
                              return `Grade ${selectedGrade.gradeLevel} (${selectedGrade.department})`
                            }
                            return formData.gradeLevel
                              ? `Grade ${formData.gradeLevel}`
                              : 'Not selected'
                          })()}
                        </p>
                      </div>
                      {(() => {
                        const selectedGrade = formData.gradeId
                          ? grades.find((g) => g.id === formData.gradeId)
                          : null
                        const isSHS = selectedGrade?.department === 'SHS'
                        if (!isSHS) return null

                        return (
                          <div>
                            <p
                              className="text-xs text-gray-600 mb-1"
                              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                            >
                              Semester
                            </p>
                            <p
                              className="text-sm font-medium text-gray-900"
                              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                            >
                              {formData.semester === 'first-sem'
                                ? 'First Semester'
                                : 'Second Semester'}
                            </p>
                          </div>
                        )
                      })()}
                    </>
                  ) : (
                    <>
                      <div>
                        <p
                          className="text-xs text-gray-600 mb-1"
                          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                        >
                          Course
                        </p>
                        <p
                          className="text-sm font-medium text-gray-900"
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                        >
                          {formData.courseCode}
                        </p>
                      </div>
                      <div>
                        <p
                          className="text-xs text-gray-600 mb-1"
                          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                        >
                          Year Level
                        </p>
                        <p
                          className="text-sm font-medium text-gray-900"
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                        >
                          Year {formData.yearLevel}
                        </p>
                      </div>
                      <div>
                        <p
                          className="text-xs text-gray-600 mb-1"
                          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                        >
                          Semester
                        </p>
                        <p
                          className="text-sm font-medium text-gray-900"
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                        >
                          {formData.semester === 'first-sem'
                            ? 'First Semester'
                            : 'Second Semester'}
                        </p>
                      </div>
                    </>
                  )}
                  <div>
                    <p
                      className="text-xs text-gray-600 mb-1"
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      Subject Set
                    </p>
                    <p
                      className="text-sm font-medium text-gray-900"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      {subjectSets.find((s) => s.id === formData.subjectSetId)
                        ?.name || 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Subjects Table */}
              {loadingSubjects ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900 mx-auto mb-2"></div>
                    <p
                      className="text-sm text-gray-600"
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      Loading subjects...
                    </p>
                  </div>
                </div>
              ) : selectedSubjectDetails.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <Books
                      size={48}
                      className="text-yellow-600 mx-auto mb-4"
                      weight="duotone"
                    />
                    <p
                      className="text-sm text-yellow-800"
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      No subjects found in this subject set
                    </p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th
                          className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                        >
                          Subject Code
                        </th>
                        <th
                          className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                        >
                          Subject Name
                        </th>
                        <th
                          className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider"
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                        >
                          Lecture Units
                        </th>
                        <th
                          className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider"
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                        >
                          Lab Units
                        </th>
                        <th
                          className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider"
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                        >
                          Total Units
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedSubjectDetails.map((subject, index) => {
                        const totalUnits =
                          (subject.lectureUnits || 0) + (subject.labUnits || 0)
                        return (
                          <tr
                            key={subject.id || index}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td
                              className="px-4 py-3 text-sm font-medium text-gray-900"
                              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                            >
                              {subject.code || 'N/A'}
                            </td>
                            <td
                              className="px-4 py-3 text-sm text-gray-700"
                              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                            >
                              {subject.name || 'N/A'}
                            </td>
                            <td
                              className="px-4 py-3 text-sm text-gray-700 text-center"
                              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                            >
                              {subject.lectureUnits || 0}
                            </td>
                            <td
                              className="px-4 py-3 text-sm text-gray-700 text-center"
                              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                            >
                              {subject.labUnits || 0}
                            </td>
                            <td
                              className="px-4 py-3 text-sm font-medium text-gray-900 text-center"
                              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                            >
                              {totalUnits}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                      <tr>
                        <td
                          colSpan={2}
                          className="px-4 py-3 text-sm font-medium text-gray-900 text-right"
                          style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                        >
                          Total:
                        </td>
                        <td
                          className="px-4 py-3 text-sm font-medium text-gray-900 text-center"
                          style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                        >
                          {selectedSubjectDetails.reduce(
                            (sum, s) => sum + (s.lectureUnits || 0),
                            0
                          )}
                        </td>
                        <td
                          className="px-4 py-3 text-sm font-medium text-gray-900 text-center"
                          style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                        >
                          {selectedSubjectDetails.reduce(
                            (sum, s) => sum + (s.labUnits || 0),
                            0
                          )}
                        </td>
                        <td
                          className="px-4 py-3 text-sm font-medium text-gray-900 text-center"
                          style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                        >
                          {selectedSubjectDetails.reduce(
                            (sum, s) =>
                              sum + (s.lectureUnits || 0) + (s.labUnits || 0),
                            0
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <Button
                type="button"
                variant="ghost"
                onClick={handleCancelConfirmation}
                disabled={loading}
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={loading || selectedSubjectDetails.length === 0}
                className="rounded-lg bg-gradient-to-br from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 text-white border"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {isEditing ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Check size={16} className="mr-2" />
                    Confirm & {isEditing ? 'Update' : 'Create'} Assignment
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
