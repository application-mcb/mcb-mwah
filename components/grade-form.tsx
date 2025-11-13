'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import {
  Department,
  DEPARTMENTS,
  GradeColor,
  GRADE_COLORS,
} from '@/lib/types/grade-section'
import GradeColorPicker from '@/components/grade-color-picker'
import {
  Plus,
  X,
  Pencil,
  Sparkle,
} from '@phosphor-icons/react'
import { toast } from 'react-toastify'

interface GradeFormData {
  gradeLevel: string
  department: Department
  description: string
  color: GradeColor
  gradeLevelNumeric?: number
  strand?: string
}

interface GradeFormProps {
  onSubmit: (gradeData: {
    gradeLevel: number
    department: Department
    description: string
    color: GradeColor
    strand?: string
  }) => Promise<void>
  onCancel: () => void
  initialData?: Partial<GradeFormData>
  isEditing?: boolean
  loading?: boolean
  existingGrades?: any[]
}

export default function GradeForm({
  onSubmit,
  onCancel,
  initialData,
  isEditing = false,
  loading = false,
  existingGrades = [],
}: GradeFormProps) {
  // Handle initial data
  const initialGradeLevel =
    initialData?.gradeLevel && typeof initialData.gradeLevel === 'number'
      ? String(initialData.gradeLevel)
      : initialData?.gradeLevel || ''

  const [formData, setFormData] = useState<GradeFormData>({
    gradeLevel: initialGradeLevel,
    department:
      initialData?.department === 'COLLEGE'
        ? 'JHS'
        : initialData?.department || 'JHS',
    description: initialData?.description || '',
    color: initialData?.color || GRADE_COLORS[0],
    gradeLevelNumeric:
      initialData?.gradeLevel && typeof initialData.gradeLevel === 'number'
        ? initialData.gradeLevel
        : initialData?.gradeLevelNumeric || undefined,
    strand: initialData?.strand || '',
  })

  const [errors, setErrors] = useState<
    Partial<Record<keyof GradeFormData, string>>
  >({})
  const [generatingDescription, setGeneratingDescription] = useState(false)
  const [typewritingText, setTypewritingText] = useState('')

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof GradeFormData, string>> = {}

    if (!formData.gradeLevel.trim()) {
      newErrors.gradeLevel = 'Grade level is required'
    } else {
      const gradeLevelNum = parseInt(formData.gradeLevel)
      if (isNaN(gradeLevelNum) || gradeLevelNum < 1 || gradeLevelNum > 12) {
        newErrors.gradeLevel = 'Grade level must be a number between 1 and 12'
      }
    }

    if (formData.department === 'SHS' && !formData.strand?.trim()) {
      newErrors.strand = 'Strand is required for Senior High School'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Grade description is required'
    } else if (formData.description.trim().length > 500) {
      newErrors.description = 'Grade description must not exceed 500 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      const gradeLevelNum = parseInt(formData.gradeLevel)
      await onSubmit({
        gradeLevel: gradeLevelNum,
        department: formData.department,
        description: formData.description.trim(),
        color: formData.color,
        strand: formData.department === 'SHS' ? formData.strand?.trim() : undefined,
      })
    } catch (error) {
      // Error handling is done in the parent component
    }
  }

  const handleInputChange = (
    field: keyof GradeFormData,
    value: string | number
  ) => {
    if (field === 'department') {
      // Reset strand when switching away from SHS
      setFormData((prev) => ({
        ...prev,
        department: value as Department,
        strand: value === 'SHS' ? prev.strand : '',
      }))
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }))
    }
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleDepartmentChange = (department: Department) => {
    setFormData((prev) => ({
      ...prev,
      department,
      strand: department === 'SHS' ? prev.strand : '',
    }))
    if (errors.department) {
      setErrors((prev) => ({ ...prev, department: undefined }))
    }
  }

  const handleGenerateDescription = async () => {
    if (!formData.gradeLevel || !formData.department) {
      toast.error('Please select a department and enter a grade level first.', { autoClose: 3000 })
      return
    }

    setGeneratingDescription(true)
    setTypewritingText('')

    try {
      const gradeLabel = `Grade ${formData.gradeLevel}`
      const departmentName =
        formData.department === 'JHS' ? 'Junior High School' : 'Senior High School'
      const gradeName = formData.department === 'SHS' && formData.strand
        ? `${gradeLabel} - ${formData.strand} (${departmentName})`
        : `${gradeLabel} (${departmentName})`

      const response = await fetch('/api/ai/generate-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subjectName: gradeName,
          subjectCode: gradeLabel,
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

  return (
    <div className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-6">
          {/* Department Selection */}
          <div className="space-y-2">
            <label
              className="block text-sm font-medium text-gray-700 mb-1"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Department *
            </label>
            <div className="flex flex-wrap gap-2">
              {DEPARTMENTS.filter((dept) => dept !== 'COLLEGE').map((dept) => {
                const isSelected = formData.department === dept
                const deptLabel =
                  dept === 'JHS' ? 'Junior High School' : 'Senior High School'
                return (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => handleDepartmentChange(dept)}
                    disabled={loading || isEditing}
                    className={`px-4 py-2 text-sm font-medium rounded-lg border-2 transition-all duration-200 ${
                      isSelected
                        ? 'bg-gradient-to-br from-blue-800 to-blue-900 text-white border-blue-900 shadow-md'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    {deptLabel}
                  </button>
                )
              })}
            </div>
            {errors.department && (
              <p
                className="text-sm text-red-600"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                {errors.department}
              </p>
            )}
          </div>

          {/* Grade Level */}
          <div className="space-y-2">
            <label
              htmlFor="grade-level"
              className="block text-sm font-medium text-gray-700"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Grade Level *
            </label>
            <Input
              id="grade-level"
              type="number"
              placeholder="e.g., 7, 8, 9, 10, 11, 12"
              value={formData.gradeLevel}
              onChange={(e) =>
                handleInputChange('gradeLevel', e.target.value)
              }
              disabled={loading || isEditing}
              min={1}
              max={12}
              className={`border-1 shadow-sm border-blue-900 rounded-lg ${
                errors.gradeLevel
                  ? 'border-red-500 focus-visible:ring-red-500'
                  : ''
              }`}
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              aria-describedby={
                errors.gradeLevel ? 'grade-level-error' : undefined
              }
            />
            {errors.gradeLevel && (
              <p
                id="grade-level-error"
                className="text-sm text-red-600"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                {errors.gradeLevel}
              </p>
            )}
          </div>

          {/* Strand (only for SHS) */}
          {formData.department === 'SHS' && (
            <div className="space-y-2">
              <label
                htmlFor="strand"
                className="block text-sm font-medium text-gray-700"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Strand *
              </label>
              <Input
                id="strand"
                type="text"
                placeholder="e.g., ABM, HUMSS, STEM, GAS"
                value={formData.strand || ''}
                onChange={(e) =>
                  handleInputChange('strand', e.target.value)
                }
                disabled={loading || isEditing}
                className={`border-1 shadow-sm border-blue-900 rounded-lg ${
                  errors.strand
                    ? 'border-red-500 focus-visible:ring-red-500'
                    : ''
                }`}
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                aria-describedby={errors.strand ? 'strand-error' : undefined}
              />
              {errors.strand && (
                <p
                  id="strand-error"
                  className="text-sm text-red-600"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  {errors.strand}
                </p>
              )}
            </div>
          )}

          {/* Grade Color Picker */}
          <div className="space-y-2">
            <GradeColorPicker
              selectedColor={formData.color}
              onColorChange={(color) => handleInputChange('color', color)}
              disabled={loading}
            />
          </div>

          {/* Grade Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="grade-description"
                className="block text-sm font-medium text-gray-700"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Grade Description *
              </label>
              <button
                type="button"
                onClick={handleGenerateDescription}
                disabled={loading || generatingDescription || !formData.gradeLevel || !formData.department}
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
              id="grade-description"
              placeholder="Provide a detailed description of the grade level, including learning objectives and target students..."
              value={
                generatingDescription ? typewritingText : formData.description
              }
              onChange={(e) =>
                handleInputChange('description', e.target.value)
              }
              disabled={loading || generatingDescription}
              className={`border border-gray-300 rounded-xl flex min-h-[100px] w-full bg-white px-3 py-2 text-base placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-900 focus-visible:border-blue-900 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none ${
                errors.description
                  ? 'border-red-500 focus-visible:ring-red-500'
                  : ''
              }`}
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              aria-describedby={
                errors.description ? 'description-error' : undefined
              }
              maxLength={500}
              rows={4}
            />
            <div className="flex justify-between items-center">
              {errors.description && (
                <p
                  id="description-error"
                  className="text-sm text-blue-600"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  {errors.description}
                </p>
              )}
              <p
                className={`text-xs ml-auto ${
                  formData.description.length > 450
                    ? 'text-blue-500'
                    : 'text-gray-500'
                }`}
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                {formData.description.length}/500 characters
              </p>
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-600 font-light p-3 bg-white border border-gray-200 rounded-xl text-justify">
          This form will determine the identity of the grade level in the
          system. The clearer the description, the easier it will be to identify
          and manage grade levels.
        </p>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg"
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={
              loading ||
              !formData.gradeLevel ||
              !formData.department ||
              !formData.description ||
              !formData.color ||
              (formData.department === 'SHS' && !formData.strand?.trim())
            }
            className="bg-gradient-to-br from-blue-900 to-blue-800 text-white hover:from-blue-800 hover:to-blue-900 rounded-lg"
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>{isEditing ? 'Update Grade Level' : 'Create Grade Level'}</>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
