'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Modal } from '@/components/ui/modal'
import SubjectColorPicker from '@/components/subject-color-picker'
import {
  SubjectColor,
  SUBJECT_COLORS,
  SubjectData,
} from '@/lib/subject-database'
import { GradeData } from '@/lib/grade-section-database'
import {
  Plus,
  X,
  Pencil,
  Palette,
  Calculator,
  ArrowRight,
  ArrowLeft,
  Sparkle,
} from '@phosphor-icons/react'
import { toast } from 'react-toastify'

interface SubjectFormData {
  code: string
  name: string
  description: string
  selectedGradeIds: string[]
  courseCodes: string[]
  courseSelections: {
    code: string
    year: number
    semester: 'first-sem' | 'second-sem'
  }[]
  color: SubjectColor
  lectureUnits: string
  labUnits: string
  prerequisites: string[]
  postrequisites: string[]
}

interface SubjectFormErrors {
  code?: string
  name?: string
  description?: string
  selectedGradeIds?: string
  courseCodes?: string
  courseSelections?: string
  color?: string
  lectureUnits?: string
  labUnits?: string
  prerequisites?: string
  postrequisites?: string
}

interface SubjectFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (subjectData: {
    code: string
    name: string
    description: string
    gradeLevels: number[]
    gradeIds: string[]
    courseCodes: string[]
    courseSelections: {
      code: string
      year: number
      semester: 'first-sem' | 'second-sem'
    }[]
    color: SubjectColor
    lectureUnits: number
    labUnits: number
    prerequisites: string[]
    postrequisites: string[]
  }) => Promise<void>
  initialData?: Partial<SubjectFormData>
  isEditing?: boolean
  loading?: boolean
}

export default function SubjectForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEditing = false,
  loading = false,
}: SubjectFormProps) {
  const [formData, setFormData] = useState<SubjectFormData>({
    code: initialData?.code || '',
    name: initialData?.name || '',
    description: initialData?.description || '',
    selectedGradeIds: [], // Will be populated after grades are loaded
    courseCodes: Array.isArray(initialData?.courseCodes)
      ? initialData.courseCodes
      : [],
    courseSelections: [], // Not used anymore, kept for backward compatibility
    color: initialData?.color || SUBJECT_COLORS[0],
    lectureUnits: (initialData?.lectureUnits || 1).toString(),
    labUnits: (initialData?.labUnits || 0).toString(),
    prerequisites: Array.isArray(initialData?.prerequisites)
      ? initialData.prerequisites
      : [],
    postrequisites: Array.isArray(initialData?.postrequisites)
      ? initialData.postrequisites
      : [],
  })

  const [errors, setErrors] = useState<SubjectFormErrors>({})
  const [grades, setGrades] = useState<GradeData[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [availableSubjects, setAvailableSubjects] = useState<SubjectData[]>([])
  const [loadingGrades, setLoadingGrades] = useState(true)
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [loadingSubjects, setLoadingSubjects] = useState(true)
  const [generatingDescription, setGeneratingDescription] = useState(false)
  const [typewritingText, setTypewritingText] = useState('')

  // Load available grades, courses, and subjects on component mount
  useEffect(() => {
    loadGrades()
    loadCourses()
    loadSubjects()
  }, [])

  // Reset form data when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        code: initialData?.code || '',
        name: initialData?.name || '',
        description: initialData?.description || '',
        selectedGradeIds: Array.isArray((initialData as any)?.gradeIds)
          ? [...(initialData as any).gradeIds]
          : [],
        courseCodes: Array.isArray(initialData?.courseCodes)
          ? initialData.courseCodes
          : [],
        courseSelections: [], // Not used anymore, kept for backward compatibility
        color: initialData?.color || SUBJECT_COLORS[0],
        lectureUnits: (initialData?.lectureUnits || 1).toString(),
        labUnits: (initialData?.labUnits || 0).toString(),
        prerequisites: Array.isArray(initialData?.prerequisites)
          ? initialData.prerequisites
          : [],
        postrequisites: Array.isArray(initialData?.postrequisites)
          ? initialData.postrequisites
          : [],
      })
      setErrors({})
      setGeneratingDescription(false)
      setTypewritingText('')
    }
  }, [isOpen, (initialData as any)?.id, initialData?.code])

  // Populate selectedGradeIds based on initialData when editing
  // Only use gradeIds if they exist - do NOT infer from gradeLevels to avoid auto-selecting all strands
  useEffect(() => {
    if (!isOpen || grades.length === 0) {
      return
    }

    // Only use gradeIds if they exist in the initialData
    if (Array.isArray((initialData as any)?.gradeIds) && (initialData as any).gradeIds.length > 0) {
      const validGradeIds = (initialData as any).gradeIds.filter((id: string) =>
        grades.some((grade) => grade.id === id)
      )
      setFormData((prev) => ({
        ...prev,
        selectedGradeIds: validGradeIds,
      }))
      return
    }

    // If no gradeIds exist, leave selectedGradeIds empty
    // This prevents auto-selecting all strands when a subject only has gradeLevels
    setFormData((prev) => ({
      ...prev,
      selectedGradeIds: [],
    }))
  }, [grades, (initialData as any)?.gradeIds, isOpen])

  // Reload subjects when editing subject changes (to exclude current subject)
  useEffect(() => {
    if (isEditing && initialData) {
      loadSubjects()
    }
  }, [isEditing, (initialData as any)?.id])

  const loadGrades = async () => {
    try {
      setLoadingGrades(true)
      const response = await fetch('/api/grades')
      if (response.ok) {
        const data = await response.json()
        setGrades(data.grades || [])
      }
    } catch (error) {
      console.error('Error loading grades:', error)
    } finally {
      setLoadingGrades(false)
    }
  }

  const loadCourses = async () => {
    try {
      setLoadingCourses(true)
      console.log('Loading courses...')
      const response = await fetch('/api/courses')
      console.log('Courses API response:', response.status, response.ok)

      if (response.ok) {
        const data = await response.json()
        console.log('Courses data:', data)
        setCourses(data.courses || [])
        console.log('Courses set:', data.courses?.length || 0, 'courses')
      } else {
        console.error(
          'Failed to load courses:',
          response.status,
          response.statusText
        )
        const errorData = await response.json()
        console.error('Error details:', errorData)
      }
    } catch (error) {
      console.error('Error loading courses:', error)
    } finally {
      setLoadingCourses(false)
    }
  }

  const loadSubjects = async () => {
    try {
      setLoadingSubjects(true)
      const response = await fetch('/api/subjects')
      if (response.ok) {
        const data = await response.json()
        let subjects = data.subjects || []

        // If editing, exclude the current subject from the list
        if (isEditing && initialData) {
          const currentSubjectId =
            (initialData as any).id ||
            `subject-${(initialData.code || '')
              .toUpperCase()
              .replace(/[^A-Z0-9]/g, '')}`
          subjects = subjects.filter(
            (subject: SubjectData) => subject.id !== currentSubjectId
          )
        }

        setAvailableSubjects(subjects)
      }
    } catch (error) {
      console.error('Error loading subjects:', error)
    } finally {
      setLoadingSubjects(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: SubjectFormErrors = {}

    if (!formData.code.trim()) {
      newErrors.code = 'Subject code is required'
    } else if (!/^[A-Z0-9]{2,10}$/.test(formData.code.toUpperCase())) {
      newErrors.code =
        'Subject code must be 2-10 uppercase letters and numbers only'
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Subject name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Subject name must be at least 2 characters'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Subject description is required'
    } else if (formData.description.trim().length < 10) {
      newErrors.description =
        'Subject description must be at least 10 characters'
    } else if (formData.description.trim().length > 300) {
      newErrors.description =
        'Subject description must not exceed 300 characters'
    }

    // Validate grade levels or course codes (at least one must be selected)
    if (
      (!formData.selectedGradeIds || formData.selectedGradeIds.length === 0) &&
      (!formData.courseCodes || formData.courseCodes.length === 0)
    ) {
      newErrors.selectedGradeIds =
        'At least one grade level or college course must be selected'
    } else if (formData.selectedGradeIds && formData.selectedGradeIds.length > 0) {
      // Validate that all selected grade IDs exist in the database
      const invalidGradeIds = formData.selectedGradeIds.filter((gradeId) => {
        const gradeExists = grades.some((g) => g.id === gradeId)
        return !gradeExists
      })
      if (invalidGradeIds.length > 0) {
        newErrors.selectedGradeIds =
          'Selected grade levels do not exist in the system'
      }
    }

    const lectureUnitsNum = parseInt(formData.lectureUnits)
    if (
      formData.lectureUnits === '' ||
      isNaN(lectureUnitsNum) ||
      lectureUnitsNum < 0 ||
      lectureUnitsNum > 10
    ) {
      newErrors.lectureUnits = 'Lecture units must be between 0 and 10'
    }

    const labUnitsNum = parseInt(formData.labUnits)
    if (
      formData.labUnits === '' ||
      isNaN(labUnitsNum) ||
      labUnitsNum < 0 ||
      labUnitsNum > 10
    ) {
      newErrors.labUnits = 'Lab units must be between 0 and 10'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Helper function to convert selectedGradeIds to gradeLevels
  // Deduplicates grade levels to prevent creating multiple documents for the same subject
  const getGradeLevelsFromIds = (selectedIds: string[]): number[] => {
    const gradeLevels = selectedIds
      .map(id => {
        const grade = grades.find(g => g.id === id)
        return grade ? grade.gradeLevel : 0
      })
      .filter(level => level > 0)
    
    // Deduplicate using Set and sort ascending
    return Array.from(new Set(gradeLevels)).sort((a, b) => a - b)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      const submitData = {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        description: formData.description.trim(),
        gradeLevels: getGradeLevelsFromIds(formData.selectedGradeIds),
        gradeIds: [...formData.selectedGradeIds],
        courseCodes: formData.courseCodes,
        courseSelections: [], // Keep empty for backward compatibility
        color: formData.color,
        lectureUnits: parseInt(formData.lectureUnits) || 0,
        labUnits: parseInt(formData.labUnits) || 0,
        prerequisites: formData.prerequisites || [],
        postrequisites: formData.postrequisites || [],
      }
      console.log('Submitting subject data:', submitData)
      await onSubmit(submitData)
    } catch (error) {
      // Error handling is done in the parent component
    }
  }

  const handleInputChange = (
    field: keyof SubjectFormData,
    value: string | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleGradeLevelToggle = (gradeId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedGradeIds: prev.selectedGradeIds.includes(gradeId)
        ? prev.selectedGradeIds.filter((id) => id !== gradeId)
        : [...prev.selectedGradeIds, gradeId],
    }))
    // Clear error when user makes selection
    if (errors.selectedGradeIds) {
      setErrors((prev) => ({ ...prev, selectedGradeIds: undefined }))
    }
  }

  const handleCourseToggle = (courseCode: string) => {
    setFormData((prev) => ({
      ...prev,
      courseCodes: prev.courseCodes.includes(courseCode)
        ? prev.courseCodes.filter((code) => code !== courseCode)
        : [...prev.courseCodes, courseCode],
    }))
  }

  const handlePrerequisiteToggle = (subjectId: string) => {
    setFormData((prev) => ({
      ...prev,
      prerequisites: prev.prerequisites.includes(subjectId)
        ? prev.prerequisites.filter((id) => id !== subjectId)
        : [...prev.prerequisites, subjectId],
    }))
    // Clear error when user makes selection
    if (errors.prerequisites) {
      setErrors((prev) => ({ ...prev, prerequisites: undefined }))
    }
  }

  const handlePostrequisiteToggle = (subjectId: string) => {
    setFormData((prev) => ({
      ...prev,
      postrequisites: prev.postrequisites.includes(subjectId)
        ? prev.postrequisites.filter((id) => id !== subjectId)
        : [...prev.postrequisites, subjectId],
    }))
    // Clear error when user makes selection
    if (errors.postrequisites) {
      setErrors((prev) => ({ ...prev, postrequisites: undefined }))
    }
  }

  const getGradeDisplayName = (grade: GradeData) => {
    if (grade.department === 'SHS' && grade.strand) {
      return `Grade ${grade.gradeLevel} - ${grade.strand}`
    }
    return `Grade ${grade.gradeLevel} (${grade.department})`
  }

  const handleGenerateDescription = async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a subject title first.', { autoClose: 3000 })
      return
    }

    setGeneratingDescription(true)
    setTypewritingText('')

    try {
      const response = await fetch('/api/ai/generate-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subjectName: formData.name.trim(),
          subjectCode: formData.code.trim(),
        }),
      })

      const data = await response.json()

      if (response.ok && data.description) {
        // Typewriting effect
        const fullText = data.description
        let currentIndex = 0
        setTypewritingText('')

        const typeInterval = setInterval(() => {
          if (currentIndex < fullText.length) {
            setTypewritingText(fullText.substring(0, currentIndex + 1))
            currentIndex++
          } else {
            clearInterval(typeInterval)
            // Set the final text to formData after typewriting completes
            setTimeout(() => {
              handleInputChange('description', fullText)
              setGeneratingDescription(false)
              setTypewritingText('')
            }, 300)
          }
        }, 1) // Adjust speed: lower = faster typing

        // Store interval reference for cleanup
        ;(window as any).__typeInterval = typeInterval
      } else {
        toast.error(data.error || 'Failed to generate description.', {
          autoClose: 5000,
        })
        setGeneratingDescription(false)
        setTypewritingText('')
      }
    } catch (error) {
      console.error('Error generating description:', error)
      toast.error('Network error occurred while generating description.', {
        autoClose: 5000,
      })
      setGeneratingDescription(false)
      setTypewritingText('')
    }
  }

  // Cleanup typewriting interval on unmount
  useEffect(() => {
    return () => {
      if ((window as any).__typeInterval) {
        clearInterval((window as any).__typeInterval)
      }
    }
  }, [])

  // Helper function to get actual color value from course color (similar to course-list.tsx)
  const getCourseColorValue = (color: string): string => {
    const colorMap: Record<string, string> = {
      'blue-900': '#1e40af',
      'red-800': '#991b1b',
      'emerald-800': '#065f46',
      'yellow-800': '#92400e',
      'orange-800': '#9a3412',
      'violet-800': '#5b21b6',
      'purple-800': '#6b21a8',
      'blue-900': '#1e40af',
      'red-700': '#b91c1c',
      'emerald-700': '#047857',
      'yellow-700': '#a16207',
      'orange-700': '#c2410c',
      'violet-700': '#7c3aed',
      'purple-700': '#8b5cf6',
    }
    return colorMap[color] || '#065f46' // Default to emerald if color not found
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Subject' : 'Create New Subject'}
      size="lg"
    >
      <Card className="w-full p-6 bg-white border border-gray-200 rounded-xl shadow-lg">

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Subject Code and Name Row */}
        <div className="grid grid-cols-2 gap-6">
          {/* Subject Code */}
          <div className="space-y-2">
            <label
              htmlFor="subject-code"
              className="block text-sm font-medium text-gray-700"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Subject Code *
            </label>
            <Input
              id="subject-code"
              type="text"
              placeholder="e.g., MATH101, ENG202"
              value={formData.code}
              onChange={(e) =>
                handleInputChange('code', e.target.value.toUpperCase())
              }
              disabled={loading || isEditing} // Can't change code when editing
              className={`border-1 shadow-sm border-blue-900 rounded-lg uppercase ${
                errors.code ? 'border-red-500 focus-visible:ring-red-500' : ''
              }`}
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              aria-describedby={errors.code ? 'code-error' : undefined}
            />
            {errors.code && (
              <p
                id="code-error"
                className="text-sm text-red-600"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                {errors.code}
              </p>
            )}
            {!isEditing && (
              <p
                className="text-xs text-gray-500"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                Use uppercase letters and numbers only
              </p>
            )}
          </div>

          {/* Subject Name */}
          <div className="space-y-2">
            <label
              htmlFor="subject-name"
              className="block text-sm font-medium text-gray-700"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Subject Name *
            </label>
            <Input
              id="subject-name"
              type="text"
              placeholder="e.g., Mathematics, English, Science"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              disabled={loading}
              className={`border-1 shadow-sm border-blue-900 rounded-lg ${
                errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''
              }`}
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
            {errors.name && (
              <p
                id="name-error"
                className="text-sm text-red-600"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                {errors.name}
              </p>
            )}
          </div>
        </div>

        {/* Grade Levels & Courses */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label
              className="block text-sm font-medium text-gray-700"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Applicable Grade Levels *
            </label>
            <div className="flex flex-wrap gap-2">
              {loadingGrades ? (
                <div
                  className="text-sm text-gray-500"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  Loading grade levels...
                </div>
              ) : grades.length > 0 ? (
                grades.map((grade) => {
                  const isSelected = formData.selectedGradeIds.includes(
                    grade.id
                  )
                  return (
                    <button
                      key={grade.id}
                      type="button"
                      onClick={() => handleGradeLevelToggle(grade.id)}
                      disabled={loading}
                      className={`px-3 py-2 text-sm font-medium rounded-lg border-2 transition-all duration-200 ${
                        isSelected
                          ? 'bg-gradient-to-br from-blue-800 to-blue-900 text-white border-blue-900 shadow-md'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      {getGradeDisplayName(grade)}
                    </button>
                  )
                })
              ) : (
                <div
                  className="text-sm text-gray-500"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  No grade levels available
                </div>
              )}
            </div>
            {formData.selectedGradeIds.length > 0 && (
              <p
                className="text-xs text-gray-600"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                Selected:{' '}
                {formData.selectedGradeIds
                  .map((gradeId) => {
                    const grade = grades.find((g) => g.id === gradeId)
                    return grade ? getGradeDisplayName(grade) : gradeId
                  })
                  .join(', ')}
              </p>
            )}
            {errors.selectedGradeIds && (
              <p
                className="text-sm text-red-600"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                {errors.selectedGradeIds}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label
              className="block text-sm font-medium text-gray-700"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Applicable College Courses
            </label>

            {/* Course Code Selection - Similar to Grade Levels */}
            <div className="flex flex-wrap gap-2">
              {loadingCourses ? (
                <div
                  className="text-sm text-gray-500"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  Loading courses...
                </div>
              ) : courses.length > 0 ? (
                courses.map((course: any) => {
                  const courseColor = course.color || 'emerald-800'
                  const courseColorValue = getCourseColorValue(courseColor)
                  const isSelected = formData.courseCodes.includes(course.code)
                  return (
                    <button
                      key={course.code}
                      type="button"
                      onClick={() => handleCourseToggle(course.code)}
                      disabled={loading}
                      className={`px-3 py-2 text-sm font-medium rounded-lg border-2 transition-all duration-200 ${
                        isSelected
                          ? 'text-white shadow-md'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      style={{
                        fontFamily: 'Poppins',
                        fontWeight: 300,
                        backgroundColor: isSelected
                          ? courseColorValue
                          : 'white',
                        borderColor: isSelected ? courseColorValue : '#d1d5db',
                        color: isSelected ? 'white' : '#374151',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected && !loading) {
                          e.currentTarget.style.borderColor = courseColorValue
                          e.currentTarget.style.backgroundColor = `${courseColorValue}15` // Light tint on hover
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
                })
              ) : (
                <div
                  className="text-sm text-gray-500"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  No courses available
                </div>
              )}
            </div>
            {formData.courseCodes.length > 0 && (
              <p
                className="text-xs text-gray-600"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                Selected: {formData.courseCodes.join(', ')}
              </p>
            )}
            {errors.courseCodes && (
              <p
                className="text-sm text-red-600"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                {errors.courseCodes}
              </p>
            )}
          </div>
        </div>

        {/* Units Row: Lecture | Lab | Total */}
        <div className="flex gap-4">
          {/* Lecture Units */}
          <div className="flex-1 space-y-2">
            <label
              htmlFor="lecture-units"
              className="block text-sm font-medium text-gray-700"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Lecture Units *
            </label>
            <Input
              id="lecture-units"
              type="number"
              placeholder="e.g., 2"
              value={formData.lectureUnits}
              onChange={(e) =>
                handleInputChange('lectureUnits', parseInt(e.target.value) || 0)
              }
              disabled={loading}
              min={0}
              max={10}
              className={`border-1 shadow-sm border-blue-900 rounded-lg w-full ${
                errors.lectureUnits
                  ? 'border-red-500 focus-visible:ring-red-500'
                  : ''
              }`}
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              aria-describedby={
                errors.lectureUnits ? 'lecture-units-error' : undefined
              }
            />
            {errors.lectureUnits && (
              <p
                id="lecture-units-error"
                className="text-sm text-red-600"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                {errors.lectureUnits}
              </p>
            )}
          </div>

          {/* Lab Units */}
          <div className="flex-1 space-y-2">
            <label
              htmlFor="lab-units"
              className="block text-sm font-medium text-gray-700"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Lab Units
            </label>
            <Input
              id="lab-units"
              type="number"
              placeholder="e.g., 1"
              value={formData.labUnits}
              onChange={(e) =>
                handleInputChange('labUnits', parseInt(e.target.value) || 0)
              }
              disabled={loading}
              min={0}
              max={10}
              className={`border-1 shadow-sm border-blue-900 rounded-lg w-full ${
                errors.labUnits
                  ? 'border-red-500 focus-visible:ring-red-500'
                  : ''
              }`}
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              aria-describedby={errors.labUnits ? 'lab-units-error' : undefined}
            />
            {errors.labUnits && (
              <p
                id="lab-units-error"
                className="text-sm text-red-600"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                {errors.labUnits}
              </p>
            )}
          </div>

          {/* Total Units Display */}
          <div className="flex-1 space-y-2">
            <label
              className="block text-sm font-light medium text-gray-700"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Total Units
            </label>
            <div className="bg-white border-1 shadow-sm border-blue-900 p-3 flex items-center justify-center h-9 rounded-lg">
              <span
                className="text-sm font-light text-gray-800"
                style={{ fontFamily: 'Poppins', fontWeight: 500 }}
              >
                {(parseInt(formData.lectureUnits) || 0) +
                  (parseInt(formData.labUnits) || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Subject Description */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="subject-description"
              className="block text-sm font-medium text-gray-700"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Subject Description *
            </label>
            <button
              type="button"
              onClick={handleGenerateDescription}
              disabled={loading || generatingDescription}
              className="flex bg-gradient-to-br from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 items-center gap-2 px-4 rounded-lg py-2 text-xs font-medium text-white border"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              {generatingDescription ? (
                <>
                  <div className="w-3 h-3 text-white border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-white">Generating...</p>
                </>
              ) : (
                <span className="text-white flex items-center gap-2">
                  <Sparkle size={14} weight="fill" className="text-white" />
                  <p className="text-white">Generate with AI</p>
                </span>
              )}
            </button>
          </div>
          <textarea
            id="subject-description"
            placeholder="Provide a detailed description of the subject, including learning objectives, content coverage, and target audience..."
            value={
              generatingDescription ? typewritingText : formData.description
            }
            onChange={(e) => handleInputChange('description', e.target.value)}
            disabled={loading || generatingDescription}
            className={`border-1 shadow-sm border-blue-900 rounded-xl flex min-h-[100px] w-full bg-white pr-3 py-2 text-base placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none ${
              errors.description
                ? 'border-red-500 focus-visible:ring-red-500'
                : ''
            }`}
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            aria-describedby={
              errors.description ? 'description-error' : undefined
            }
            maxLength={300}
            rows={4}
          />
          <div className="flex justify-between items-center">
            {errors.description && (
              <p
                id="description-error"
                className="text-sm text-red-600"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                {errors.description}
              </p>
            )}
            <p
              className={`text-xs ml-auto ${
                formData.description.length > 280
                  ? 'text-red-500'
                  : 'text-gray-500'
              }`}
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              {formData.description.length}/300 characters
            </p>
          </div>
        </div>

        {/* Prerequisites */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <ArrowLeft size={18} className="text-gray-600" weight="duotone" />
            <label
              className="block text-sm font-medium text-gray-700"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Prerequisites
            </label>
          </div>
          <p
            className="text-xs text-gray-500"
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            Select subjects that must be completed before taking this subject
          </p>
          <div className="border border-gray-200 rounded-xl p-3 bg-white max-h-60 overflow-y-auto">
            {loadingSubjects ? (
              <div
                className="text-sm text-gray-500"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                Loading subjects...
              </div>
            ) : availableSubjects.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {availableSubjects.map((subject) => {
                  const isSelected = formData.prerequisites.includes(subject.id)
                  return (
                    <button
                      key={subject.id}
                      type="button"
                      onClick={() => handlePrerequisiteToggle(subject.id)}
                      disabled={loading}
                      className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200 ${
                        isSelected
                          ? 'bg-orange-700 text-white border-orange-700 shadow-sm'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-orange-400 hover:bg-orange-50'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      {subject.code} - {subject.name}
                    </button>
                  )
                })}
              </div>
            ) : (
              <div
                className="text-sm text-gray-500"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                No subjects available
              </div>
            )}
          </div>
          {formData.prerequisites.length > 0 && (
            <p
              className="text-xs text-gray-600"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              Selected:{' '}
              {formData.prerequisites
                .map((id) => {
                  const subject = availableSubjects.find((s) => s.id === id)
                  return subject ? `${subject.code} - ${subject.name}` : id
                })
                .join(', ')}
            </p>
          )}
          {errors.prerequisites && (
            <p
              className="text-sm text-red-600"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              {errors.prerequisites}
            </p>
          )}
        </div>

        {/* Postrequisites */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <ArrowRight size={18} className="text-gray-600" weight="duotone" />
            <label
              className="block text-sm font-medium text-gray-700"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Postrequisites
            </label>
          </div>
          <p
            className="text-xs text-gray-500"
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            Select subjects that require this subject as a prerequisite
          </p>
          <div className="border border-gray-200 rounded-xl p-3 bg-white max-h-60 overflow-y-auto">
            {loadingSubjects ? (
              <div
                className="text-sm text-gray-500"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                Loading subjects...
              </div>
            ) : availableSubjects.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {availableSubjects.map((subject) => {
                  const isSelected = formData.postrequisites.includes(
                    subject.id
                  )
                  return (
                    <button
                      key={subject.id}
                      type="button"
                      onClick={() => handlePostrequisiteToggle(subject.id)}
                      disabled={loading}
                      className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200 ${
                        isSelected
                          ? 'bg-green-700 text-white border-green-700 shadow-sm'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-green-400 hover:bg-green-50'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      {subject.code} - {subject.name}
                    </button>
                  )
                })}
              </div>
            ) : (
              <div
                className="text-sm text-gray-500"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                No subjects available
              </div>
            )}
          </div>
          {formData.postrequisites.length > 0 && (
            <p
              className="text-xs text-gray-600"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              Selected:{' '}
              {formData.postrequisites
                .map((id) => {
                  const subject = availableSubjects.find((s) => s.id === id)
                  return subject ? `${subject.code} - ${subject.name}` : id
                })
                .join(', ')}
            </p>
          )}
          {errors.postrequisites && (
            <p
              className="text-sm text-red-600"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              {errors.postrequisites}
            </p>
          )}
        </div>

        {/* Color Picker */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Palette size={18} className="text-gray-600" weight="duotone" />
            <label
              className="block text-sm font-medium text-gray-700"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Subject Color
            </label>
          </div>
          <SubjectColorPicker
            selectedColor={formData.color}
            onColorChange={(color) =>
              setFormData((prev) => ({ ...prev, color }))
            }
            disabled={loading}
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={
              loading ||
              !formData.code ||
              !formData.name ||
              !formData.description ||
              (formData.selectedGradeIds.length === 0 &&
                formData.courseCodes.length === 0) ||
              (parseInt(formData.lectureUnits) || 0) < 1
            }
            className="rounded-lg bg-gradient-to-br from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 text-white border"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>{isEditing ? 'Update Subject' : 'Create Subject'}</>
            )}
          </Button>
        </div>
      </form>
    </Card>
    </Modal>
  )
}
