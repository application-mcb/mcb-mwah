'use client'

import { useState, useEffect, useRef } from 'react'
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
  Hash,
  BookOpen,
  FileText,
  Palette,
  Calculator,
  Check,
  Users,
  MagnifyingGlass,
  Sparkle,
} from '@phosphor-icons/react'
import { toast } from 'react-toastify'

interface SubjectSetFormData {
  name: string
  description: string
  gradeIds: string[] // Array of grade IDs (includes strand info for unique identification)
  gradeLevels: number[] // Array of grade levels (7, 8, 9, 10, 11, 12) - derived from gradeIds for API
  courseCodes: string[] // College course codes
  color: SubjectColor
  subjects: string[] // Array of subject IDs
}

interface SubjectSetFormErrors {
  name?: string
  description?: string
  gradeLevels?: string
  courseCodes?: string
  subjects?: string
}

interface SubjectSetFormProps {
  onSubmit: (subjectSetData: SubjectSetFormData) => Promise<void>
  onCancel: () => void
  initialData?: Partial<SubjectSetFormData>
  isEditing?: boolean
  loading?: boolean
  onSubjectsRefresh?: () => void // Callback to refresh subjects
}

interface SubjectSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  formData: SubjectSetFormData
  onFormDataChange: (
    field: keyof SubjectSetFormData,
    value: string | number | string[] | number[]
  ) => void
  errors: SubjectSetFormErrors
  grades: GradeData[]
  courses: any[]
  availableSubjects: SubjectData[]
  loadingGrades: boolean
  loadingCourses: boolean
  loadingSubjects: boolean
  loading: boolean
  isEditing: boolean
  onLoadSubjects: () => void
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  onSubjectsRefresh?: () => void
}

// Helper function to get course color value
const getCourseColorValue = (color: string): string => {
  const colorMap: Record<string, string> = {
    'blue-900': '#1d4ed8',
    'blue-800': '#1e40af',
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
  return colorMap[color] || '#065f46' // Default to emerald-800
}

function SubjectSelectionModal({
  isOpen,
  onClose,
  formData,
  onFormDataChange,
  errors,
  grades,
  courses,
  availableSubjects,
  loadingGrades,
  loadingCourses,
  loadingSubjects,
  loading,
  isEditing,
  onLoadSubjects,
  onSubmit,
  onCancel,
  onSubjectsRefresh,
}: SubjectSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [generatingDescription, setGeneratingDescription] = useState(false)
  const [typewritingText, setTypewritingText] = useState('')

  // Filter subjects based on search query
  const filteredSubjects = availableSubjects.filter((subject) => {
    if (!searchQuery.trim()) return true

    const query = searchQuery.toLowerCase()
    const subjectCode = (subject.code || '').toLowerCase()
    const subjectName = (subject.name || '').toLowerCase()
    const subjectDescription = (subject.description || '').toLowerCase()

    return (
      subjectCode.includes(query) ||
      subjectName.includes(query) ||
      subjectDescription.includes(query)
    )
  })

  const getGradeDisplayName = (grade: GradeData) => {
    if (grade.department === 'SHS' && grade.strand) {
      return `Grade ${grade.gradeLevel} - ${grade.strand}`
    }
    return `Grade ${grade.gradeLevel} (${grade.department})`
  }

  const getSelectedSubjects = () => {
    return availableSubjects.filter((subject) =>
      formData.subjects.includes(subject.id)
    )
  }

  const handleGradeToggle = (gradeId: string, gradeLevel: number) => {
    const currentGradeIds = formData.gradeIds || []
    const isSelected = currentGradeIds.includes(gradeId)

    // Update gradeIds
    const newGradeIds = isSelected
      ? currentGradeIds.filter((id) => id !== gradeId)
      : [...currentGradeIds, gradeId]

    // Derive gradeLevels from gradeIds (deduplicated)
    const selectedGrades = grades.filter((g) => newGradeIds.includes(g.id))
    const newGradeLevels = Array.from(
      new Set(selectedGrades.map((g) => g.gradeLevel))
    ).sort((a, b) => a - b)

    // Update both gradeIds and gradeLevels
    onFormDataChange('gradeIds', newGradeIds)
    onFormDataChange('gradeLevels', newGradeLevels)

    // Clear error when user makes a selection
    if (errors.gradeLevels) {
      // Note: Error clearing would need to be handled by parent component
    }
  }

  const handleCourseToggle = (courseCode: string) => {
    onFormDataChange(
      'courseCodes',
      formData.courseCodes.includes(courseCode)
        ? formData.courseCodes.filter((code) => code !== courseCode)
        : [...formData.courseCodes, courseCode]
    )
    // Clear error when user makes a selection
    if (errors.courseCodes) {
      // Note: Error clearing would need to be handled by parent component
    }
  }

  const handleSubjectToggle = (subjectId: string) => {
    onFormDataChange(
      'subjects',
      formData.subjects.includes(subjectId)
        ? formData.subjects.filter((id) => id !== subjectId)
        : [...formData.subjects, subjectId]
    )
  }

  const handleGenerateDescription = async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a subject set name first.', { autoClose: 3000 })
      return
    }

    setGeneratingDescription(true)
    setTypewritingText('')

    // Get selected subjects' names
    const selectedSubjectsNames = formData.subjects
      .map((subjectId) => {
        const subject = availableSubjects.find((s) => s.id === subjectId)
        return subject ? subject.name : null
      })
      .filter(Boolean) as string[]

    try {
      const response = await fetch('/api/ai/generate-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subjectName: formData.name.trim(),
          subjectCode: '', // Subject sets don't have codes
          selectedSubjects: selectedSubjectsNames, // Include selected subjects' names
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
              onFormDataChange('description', fullText)
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Subject Set' : 'Create New Subject Set'}
      size="full"
    >
      <div className="flex h-[75vh]">
        {/* Left Panel - Form Details (30%) */}
        <div className="w-[30%] p-6 bg-gray-50 border-r border-gray-200 overflow-y-auto">
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Subject Set Name */}
            <div className="space-y-2">
              <label
                htmlFor="modal-subject-set-name"
                className="block text-sm font-medium text-gray-700"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Subject Set Name *
              </label>
              <Input
                id="modal-subject-set-name"
                type="text"
                placeholder="e.g., Grade 10 Core Subjects"
                value={formData.name}
                onChange={(e) => onFormDataChange('name', e.target.value)}
                disabled={loading}
                className={`border-1 shadow-sm border-blue-900 rounded-lg ${
                  errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''
                }`}
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              />
              {errors.name && (
                <p
                  className="text-sm text-red-600"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  {errors.name}
                </p>
              )}
            </div>

            {/* Grade Levels */}
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
                    const isSelected = (formData.gradeIds || []).includes(
                      grade.id
                    )
                    return (
                      <button
                        key={grade.id}
                        type="button"
                        onClick={() =>
                          handleGradeToggle(grade.id, grade.gradeLevel)
                        }
                        disabled={loading}
                        className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200 ${
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
              {(formData.gradeIds || []).length > 0 && (
                <p
                  className="text-xs text-gray-600"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  Selected:{' '}
                  {(formData.gradeIds || [])
                    .map((gradeId) => {
                      const grade = grades.find((g) => g.id === gradeId)
                      return grade ? getGradeDisplayName(grade) : gradeId
                    })
                    .join(', ')}
                </p>
              )}
              {errors.gradeLevels && (
                <p
                  className="text-sm text-red-600"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  {errors.gradeLevels}
                </p>
              )}
            </div>

            {/* College Courses */}
            <div className="space-y-2">
              <label
                className="block text-sm font-medium text-gray-700"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Applicable College Courses
              </label>
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
                    const isSelected = formData.courseCodes.includes(
                      course.code
                    )
                    return (
                      <button
                        key={course.code}
                        type="button"
                        onClick={() => handleCourseToggle(course.code)}
                        disabled={loading}
                        className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200 ${
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
                          borderColor: isSelected
                            ? courseColorValue
                            : '#d1d5db',
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

            {/* Subject Set Description */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="modal-subject-set-description"
                  className="block text-sm font-medium text-gray-700"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Description *
                </label>
                <button
                  type="button"
                  onClick={handleGenerateDescription}
                  disabled={loading || generatingDescription}
                  className="flex bg-gradient-to-br from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 items-center gap-2 px-4 rounded-lg py-2 text-xs font-medium text-white border transition-all duration-200"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
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
                id="modal-subject-set-description"
                placeholder="Describe this subject set..."
                value={
                  generatingDescription ? typewritingText : formData.description
                }
                onChange={(e) =>
                  onFormDataChange('description', e.target.value)
                }
                disabled={loading || generatingDescription}
                className={`border-1 shadow-sm border-blue-900 rounded-lg flex min-h-[80px] w-full bg-white pr-3 py-2 text-base placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none ${
                  errors.description
                    ? 'border-red-500 focus-visible:ring-red-500'
                    : ''
                }`}
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                maxLength={300}
                rows={3}
              />
              <div className="flex justify-between items-center">
                {errors.description && (
                  <p
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
                  {formData.description.length}/300
                </p>
              </div>
            </div>

            {/* Color Picker */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Palette size={18} className="text-gray-600" weight="duotone" />
                <label
                  className="block text-sm font-medium text-gray-700"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Color
                </label>
              </div>
              <SubjectColorPicker
                selectedColor={formData.color}
                onColorChange={(color) => onFormDataChange('color', color)}
                disabled={loading}
              />
            </div>

            {/* Selected Subjects Summary */}
            <div className="space-y-2">
              <label
                className="block text-sm font-medium text-gray-700"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Selected ({getSelectedSubjects().length})
              </label>
              <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-xl p-2 bg-white">
                {getSelectedSubjects().length === 0 ? (
                  <p
                    className="text-sm text-gray-500"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    No subjects selected
                  </p>
                ) : (
                  <div className="space-y-1">
                    {getSelectedSubjects().map((subject) => (
                      <div
                        key={subject.id}
                        className="flex items-center space-x-2 text-sm"
                      >
                        <div className={`w-3 h-3 bg-${subject.color}`}></div>
                        <span
                          className="flex-1 truncate"
                          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                        >
                          {subject.code} {subject.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSubjectToggle(subject.id)}
                          className="text-blue-900 hover:text-blue-900  "
                          disabled={loading}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Right Panel - Subject Selection (70%) */}
        <div className="w-[70%] p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Users size={24} className="text-blue-900" weight="duotone" />
              <div>
                <h3
                  className="text-lg font-medium text-gray-900"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Select Subjects
                </h3>
                <p
                  className="text-sm text-gray-600"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  Choose subjects for this set
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onLoadSubjects()
                onSubjectsRefresh?.()
              }}
              disabled={loadingSubjects}
              className="text-xs text-blue-600 hover:text-blue-900 disabled:text-gray-400 px-3 py-1 border border-blue-200 rounded hover:bg-blue-50"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              {loadingSubjects ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <Input
              type="text"
              placeholder="Search subjects by code, name, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-4 border-1 shadow-sm border-blue-900 rounded-lg focus-visible:ring-blue-900"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            />
            {searchQuery && (
              <p
                className="text-xs text-gray-500 mt-2"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                Showing {filteredSubjects.length} of {availableSubjects.length}{' '}
                subjects
              </p>
            )}
          </div>

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
          ) : availableSubjects.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
                <BookOpen
                  size={48}
                  className="text-yellow-600 mx-auto mb-4"
                  weight="duotone"
                />
                <p
                  className="text-sm text-yellow-800"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  No subjects available for selected grade levels and courses
                </p>
                <p
                  className="text-xs text-yellow-600 mt-2"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  Create subjects first before adding them to a set
                </p>
              </div>
            </div>
          ) : filteredSubjects.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center p-6 bg-gray-50 border border-gray-200 rounded-xl">
                <MagnifyingGlass
                  size={48}
                  className="text-gray-400 mx-auto mb-4"
                  weight="duotone"
                />
                <p
                  className="text-sm text-gray-800"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  No subjects found matching "{searchQuery}"
                </p>
                <p
                  className="text-xs text-gray-600 mt-2"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  Try a different search term
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSubjects.map((subject) => {
                const isSelected = formData.subjects.includes(subject.id)
                return (
                  <div
                    key={subject.id}
                    className={`border p-4 cursor-pointer transition-all duration-200 rounded-xl ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg'
                    }`}
                    onClick={() => !loading && handleSubjectToggle(subject.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div
                        className={`w-5 h-5 border-2 aspect-square rounded flex items-center justify-center mt-0.5 ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-300'
                        }`}
                      >
                        {isSelected && (
                          <Check
                            size={12}
                            className="text-white"
                            weight="bold"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span
                            className="font-medium text-gray-900 truncate"
                            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                          >
                            <p
                              className={`bg-${subject.color} px-2 font-xs text-white py-1 inline-block mb-2 rounded-md`}
                            >
                              {subject.code}{' '}
                            </p>{' '}
                            {subject.name}
                          </span>
                        </div>
                        <div
                          className={`text-xs text-white bg-${subject.color} px-2 py-1  inline-block mb-2 rounded-md`}
                          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                        >
                          Lab: {subject.labUnits}
                        </div>

                        <div
                          className={`text-xs text-white ml-1 bg-${subject.color} px-2 py-1  inline-block mb-2 rounded-md`}
                          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                        >
                          Lecture: {subject.lectureUnits}
                        </div>
                        <p
                          className="text-sm text-gray-600 line-clamp-2"
                          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                        >
                          {subject.description}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {errors.subjects && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
              <p
                className="text-sm text-red-600"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                {errors.subjects}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Footer */}
      <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          onClick={onSubmit}
          disabled={
            loading ||
            !formData.name ||
            !formData.description ||
            formData.subjects.length === 0 ||
            ((formData.gradeIds || []).length === 0 &&
              formData.courseCodes.length === 0)
          }
          className="rounded-lg bg-gradient-to-br from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 text-white border"
          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full aspect-square h-4 w-4 border-b-2 border-white mr-2"></div>
              {isEditing ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>{isEditing ? 'Update Subject Set' : 'Create Subject Set'}</>
          )}
        </Button>
      </div>
    </Modal>
  )
}

export default function SubjectSetForm({
  onSubmit,
  onCancel,
  initialData,
  isEditing = false,
  loading = false,
  onSubjectsRefresh,
}: SubjectSetFormProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Helper function to convert courseSelections to courseCodes
  const extractCourseCodes = (data: any): string[] => {
    if (Array.isArray(data?.courseCodes)) {
      return data.courseCodes
    }
    if (
      Array.isArray(data?.courseSelections) &&
      data.courseSelections.length > 0
    ) {
      // Extract unique course codes from courseSelections
      return Array.from(
        new Set(data.courseSelections.map((sel: any) => sel.code))
      )
    }
    return []
  }

  // Helper function to extract gradeIds
  const extractGradeIds = (data: any, grades: GradeData[]): string[] => {
    // Try to find grades by gradeIds first
    if (Array.isArray(data?.gradeIds) && data.gradeIds.length > 0) {
      return data.gradeIds.filter((id: string) =>
        grades.some((g) => g.id === id)
      )
    }

    // If gradeIds not available, try to match by gradeLevels + strand
    if (Array.isArray(data?.gradeLevels) && data.gradeLevels.length > 0) {
      const matchedGradeIds: string[] = []
      data.gradeLevels.forEach((level: number) => {
        // If strand is specified, find specific grade
        if (data?.strand) {
          const grade = grades.find(
            (g) => g.gradeLevel === level && g.strand === data.strand
          )
          if (grade) matchedGradeIds.push(grade.id)
        } else {
          // No strand specified - find all grades with this level
          const matchingGrades = grades.filter((g) => g.gradeLevel === level)
          matchingGrades.forEach((g) => {
            if (!matchedGradeIds.includes(g.id)) {
              matchedGradeIds.push(g.id)
            }
          })
        }
      })
      return matchedGradeIds
    }

    // Fallback to deprecated gradeLevel field
    if (data?.gradeLevel !== undefined && data.gradeLevel !== null) {
      const matchingGrades = grades.filter(
        (g) => g.gradeLevel === data.gradeLevel
      )
      return matchingGrades.map((g) => g.id)
    }

    return []
  }

  // Helper function to extract gradeLevels from gradeIds
  const extractGradeLevels = (data: any, grades: GradeData[]): number[] => {
    const gradeIds = extractGradeIds(data, grades)
    if (gradeIds.length > 0) {
      const selectedGrades = grades.filter((g) => gradeIds.includes(g.id))
      return Array.from(new Set(selectedGrades.map((g) => g.gradeLevel))).sort(
        (a, b) => a - b
      )
    }

    // Fallback to direct gradeLevels if available
    if (Array.isArray(data?.gradeLevels) && data.gradeLevels.length > 0) {
      return data.gradeLevels
    }

    // Fallback to deprecated gradeLevel field
    if (data?.gradeLevel !== undefined && data.gradeLevel !== null) {
      return [data.gradeLevel]
    }

    return []
  }

  const [formData, setFormData] = useState<SubjectSetFormData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    gradeIds: [], // Will be populated after grades are loaded
    gradeLevels: [], // Will be populated after grades are loaded
    courseCodes: extractCourseCodes(initialData),
    color: initialData?.color || SUBJECT_COLORS[0],
    subjects: initialData?.subjects || [],
  })

  const [errors, setErrors] = useState<SubjectSetFormErrors>({})
  const [grades, setGrades] = useState<GradeData[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [availableSubjects, setAvailableSubjects] = useState<SubjectData[]>([])
  const [loadingGrades, setLoadingGrades] = useState(true)
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [loadingSubjects, setLoadingSubjects] = useState(true)
  const initialLoadRef = useRef(true)

  // Load available grades, courses and subjects on component mount
  useEffect(() => {
    loadGrades()
    loadCourses()
    loadSubjects()
  }, [])

  // Initialize gradeIds when grades are loaded and initialData exists
  useEffect(() => {
    if (grades.length > 0 && initialData && !isEditing) {
      const gradeIds = extractGradeIds(initialData, grades)
      const gradeLevels = extractGradeLevels(initialData, grades)
      if (gradeIds.length > 0 || gradeLevels.length > 0) {
        setFormData((prev) => ({
          ...prev,
          gradeIds,
          gradeLevels,
        }))
      }
    }
  }, [grades, initialData, isEditing])

  // Reload subjects when grade levels or course codes change
  useEffect(() => {
    if (
      !initialLoadRef.current &&
      ((formData.gradeIds || []).length > 0 || formData.courseCodes.length > 0)
    ) {
      loadSubjects()
    }
    initialLoadRef.current = false
  }, [formData.gradeIds, formData.courseCodes])

  // Reload subjects when modal opens to get latest subjects
  useEffect(() => {
    if (isModalOpen) {
      loadSubjects()
    }
  }, [isModalOpen])

  // Sync form data when initialData changes (for editing) and grades are loaded
  useEffect(() => {
    if (initialData && isEditing && grades.length > 0) {
      const gradeIds = extractGradeIds(initialData, grades)
      const gradeLevels = extractGradeLevels(initialData, grades)
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        gradeIds,
        gradeLevels,
        courseCodes: extractCourseCodes(initialData),
        color: initialData.color || SUBJECT_COLORS[0],
        subjects: initialData.subjects || [],
      })
    }
  }, [initialData, isEditing, grades])

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
      const response = await fetch('/api/courses')
      if (response.ok) {
        const data = await response.json()
        setCourses(data.courses || [])
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

      // Load all subjects first, then filter client-side to include both grade-level and course-only subjects
      const response = await fetch('/api/subjects')

      if (response.ok) {
        const data = await response.json()

        // Filter subjects that are applicable to the selected grade levels or course codes
        const subjects = Array.isArray(data.subjects)
          ? data.subjects.filter((subject: any) => {
              if (!subject || !subject.id || !subject.name) {
                return false
              }

              // If no grade levels or course codes are selected, show all subjects
              if (
                formData.gradeLevels.length === 0 &&
                formData.courseCodes.length === 0
              ) {
                return true
              }

              let matchesGradeLevel = false
              let matchesCourseCode = false

              // Check if subject applies to any selected grade (by gradeIds)
              if ((formData.gradeIds || []).length > 0) {
                // Get selected grade levels from gradeIds
                const selectedGradeLevels = Array.from(
                  new Set(
                    grades
                      .filter((g) => (formData.gradeIds || []).includes(g.id))
                      .map((g) => g.gradeLevel)
                  )
                )

                if (
                  subject.gradeIds &&
                  Array.isArray(subject.gradeIds) &&
                  subject.gradeIds.length > 0
                ) {
                  // Check if subject's gradeIds overlap with selected gradeIds
                  matchesGradeLevel = subject.gradeIds.some((gradeId: string) =>
                    (formData.gradeIds || []).includes(gradeId)
                  )
                } else if (
                  subject.gradeLevels &&
                  Array.isArray(subject.gradeLevels) &&
                  subject.gradeLevels.length > 0
                ) {
                  // Fallback: check if gradeLevels includes any selected grade level
                  matchesGradeLevel = subject.gradeLevels.some(
                    (gradeLevel: number) =>
                      selectedGradeLevels.includes(gradeLevel)
                  )
                } else if (subject.gradeLevel) {
                  // Old structure: check if gradeLevel matches any selected grade
                  matchesGradeLevel = selectedGradeLevels.includes(
                    subject.gradeLevel
                  )
                }
              } else {
                // If no grade levels selected, don't exclude subjects based on grade levels
                matchesGradeLevel = true
              }

              // Check if subject applies to any selected course code
              if (formData.courseCodes.length > 0) {
                if (subject.courseCodes && Array.isArray(subject.courseCodes)) {
                  matchesCourseCode = subject.courseCodes.some(
                    (courseCode: string) =>
                      formData.courseCodes.includes(courseCode)
                  )
                }
              } else {
                // If no course codes selected, don't exclude subjects based on course codes
                // But only if the subject has course codes (college subjects)
                if (
                  subject.courseCodes &&
                  Array.isArray(subject.courseCodes) &&
                  subject.courseCodes.length > 0
                ) {
                  // Subject has course codes but no course codes are selected
                  // This means it's a college subject but we're filtering by grade levels
                  // Only show it if no grade levels are selected OR if it matches grade levels
                  matchesCourseCode =
                    formData.gradeLevels.length === 0 ? true : false
                } else {
                  // Subject doesn't have course codes, so it's not a college subject
                  matchesCourseCode = true
                }
              }

              // Show subject if it matches either grade level OR course code criteria
              // If grade levels are selected, show subjects that match grade levels OR have course codes (college subjects)
              // If course codes are selected, show subjects that match course codes OR have grade levels (high school subjects)
              // If both are selected, show subjects that match either
              if (
                (formData.gradeIds || []).length > 0 &&
                formData.courseCodes.length > 0
              ) {
                // Both filters active: show if matches either
                return matchesGradeLevel || matchesCourseCode
              } else if ((formData.gradeIds || []).length > 0) {
                // Only grade levels selected: show if matches grade levels OR is a college subject (has courseCodes)
                return (
                  matchesGradeLevel ||
                  (subject.courseCodes &&
                    Array.isArray(subject.courseCodes) &&
                    subject.courseCodes.length > 0)
                )
              } else if (formData.courseCodes.length > 0) {
                // Only course codes selected: show if matches course codes OR is a high school subject (has gradeLevels)
                return (
                  matchesCourseCode ||
                  (subject.gradeLevels &&
                    Array.isArray(subject.gradeLevels) &&
                    subject.gradeLevels.length > 0) ||
                  subject.gradeLevel
                )
              }

              return true
            })
          : []
        setAvailableSubjects(subjects)
      } else {
        console.error(
          'Failed to load subjects:',
          response.status,
          response.statusText
        )
        setAvailableSubjects([])
      }
    } catch (error) {
      console.error('Error loading subjects:', error)
      setAvailableSubjects([])
    } finally {
      setLoadingSubjects(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: SubjectSetFormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Subject set name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Subject set name must be at least 2 characters'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Subject set description is required'
    } else if (formData.description.trim().length < 10) {
      newErrors.description =
        'Subject set description must be at least 10 characters'
    } else if (formData.description.trim().length > 300) {
      newErrors.description =
        'Subject set description must not exceed 300 characters'
    }

    // Validate that at least one grade level or course code is made
    if (
      (formData.gradeIds || []).length === 0 &&
      formData.courseCodes.length === 0
    ) {
      newErrors.gradeLevels =
        'At least one grade level or college course must be selected'
    } else if ((formData.gradeIds || []).length > 0) {
      // Validate that all grade IDs exist in the database
      const invalidGradeIds = (formData.gradeIds || []).filter((gradeId) => {
        const gradeExists = grades.some((g) => g.id === gradeId)
        return !gradeExists
      })
      if (invalidGradeIds.length > 0) {
        newErrors.gradeLevels =
          'Selected grade levels do not exist in the system'
      }
    }

    if (!formData.subjects || formData.subjects.length === 0) {
      newErrors.subjects = 'At least one subject must be selected'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (
    field: keyof SubjectSetFormData,
    value: string | number | string[] | number[]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field as keyof SubjectSetFormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleSubjectToggle = (subjectId: string) => {
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects.includes(subjectId)
        ? prev.subjects.filter((id) => id !== subjectId)
        : [...prev.subjects, subjectId],
    }))
    // Clear subjects error when user makes a selection
    if (errors.subjects) {
      setErrors((prev) => ({ ...prev, subjects: undefined }))
    }
  }

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      // Derive gradeLevels from gradeIds for API submission
      const selectedGrades = grades.filter((g) =>
        (formData.gradeIds || []).includes(g.id)
      )
      const derivedGradeLevels = Array.from(
        new Set(selectedGrades.map((g) => g.gradeLevel))
      ).sort((a, b) => a - b)

      await onSubmit({
        ...formData,
        gradeLevels: derivedGradeLevels, // Use derived gradeLevels for API
        name: formData.name.trim(),
        description: formData.description.trim(),
      })
      setIsModalOpen(false)
    } catch (error) {
      // Error handling is done in the parent component
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    onCancel()
  }

  const openModal = () => {
    setIsModalOpen(true)
  }

  const getGradeDisplayName = (grade: GradeData) => {
    if (grade.department === 'SHS' && grade.strand) {
      return `Grade ${grade.gradeLevel} - ${grade.strand}`
    }
    return `Grade ${grade.gradeLevel} (${grade.department})`
  }

  const getSelectedSubjects = () => {
    return availableSubjects.filter((subject) =>
      formData.subjects.includes(subject.id)
    )
  }

  return (
    <>
      <Card className="w-full max-w-2xl p-6 bg-white border border-gray-200 rounded-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 bg-gradient-to-br from-blue-800 to-blue-900 rounded-xl flex items-center justify-center`}
            >
              {isEditing ? (
                <Pencil size={20} className="text-white" />
              ) : (
                <Plus size={20} className="text-white" />
              )}
            </div>
            <div>
              <h2
                className="text-xl font-medium text-gray-900"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                {isEditing ? 'Edit Subject Set' : 'Create New Subject Set'}
              </h2>
              <p
                className="text-sm text-gray-600"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                {isEditing
                  ? 'Update subject set information'
                  : 'Group subjects together for easy management'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={loading}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </Button>
        </div>

        <div className="text-center py-12">
          <div className="mb-6">
            <Users
              size={64}
              className="text-blue-900 mx-auto mb-4"
              weight="duotone"
            />
            <h3
              className="text-lg font-medium text-gray-900 mb-2"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Subject Set Configuration
            </h3>
            <p
              className="text-sm text-gray-600 max-w-md mx-auto"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              Configure your subject set details and select subjects in a
              dedicated interface optimized for better organization.
            </p>
          </div>

          <Button
            onClick={openModal}
            disabled={loading}
            className="px-8 py-3 rounded-lg bg-gradient-to-br from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 text-white border"
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            {isEditing ? 'Edit Subject Set' : 'Create Subject Set'}
          </Button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p
            className="text-sm text-blue-900 text-center"
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            Subject sets help organize related subjects together for easier
            curriculum management and student enrollment.
          </p>
        </div>
      </Card>

      <SubjectSelectionModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        formData={formData}
        onFormDataChange={handleInputChange}
        errors={errors}
        grades={grades}
        courses={courses}
        availableSubjects={availableSubjects}
        loadingGrades={loadingGrades}
        loadingCourses={loadingCourses}
        loadingSubjects={loadingSubjects}
        loading={loading}
        isEditing={isEditing}
        onLoadSubjects={loadSubjects}
        onSubmit={handleModalSubmit}
        onCancel={handleModalClose}
        onSubjectsRefresh={onSubjectsRefresh}
      />
    </>
  )
}
