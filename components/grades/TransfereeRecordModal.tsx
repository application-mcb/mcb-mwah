'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  SPECIAL_STATUSES,
  SpecialStatus,
  calculateAverage,
  convertNumericToPercentage,
  getDescriptiveMode,
  toNumberOrNull,
} from '@/lib/grades-utils'
import { cn } from '@/lib/utils'
import {
  PlusCircle,
  XCircle,
  WarningCircle,
  ArrowsClockwise,
} from '@phosphor-icons/react'

type LevelType = 'college' | 'shs' | 'jhs'
type SemesterType = '' | 'first-sem' | 'second-sem'

type CustomSubject = {
  id: string
  documentKey: string
  name: string
  code: string
  period1: string
  period2: string
  period3: string
  period4: string
  specialStatus: SpecialStatus
  linkedSubjectId?: string | null
  linkedSubjectColor?: string | null
  activeLookupField?: 'code' | 'name' | null
  collegeAverage?: string
}

type SubjectOption = {
  id: string
  name: string
  code?: string
  color?: string
  description?: string
  gradeLevels?: number[]
  gradeIds?: string[]
  courseCodes?: string[]
}

type TransfereeRecordModalProps = {
  isOpen: boolean
  onClose: () => void
  studentId: string
  studentName?: string
  existingAyCodes: string[]
  onSuccess: (newAyCode: string) => void
}

type FormState = {
  ayCode: string
  ayLabel: string
  studentName: string
  studentLevelLabel: string
  studentSection: string
  semester: SemesterType
  notes: string
}

const defaultLevelLabel: Record<LevelType, string> = {
  college: 'BS Program Year 1',
  shs: 'Grade 11 STEM',
  jhs: 'Grade 10',
}

const generateSubjectId = () =>
  `custom-${Math.random().toString(36).slice(2, 8)}-${Date.now()}`

const createEmptySubject = (): CustomSubject => ({
  id: generateSubjectId(),
  documentKey: generateSubjectId(),
  name: '',
  code: '',
  period1: '',
  period2: '',
  period3: '',
  period4: '',
  specialStatus: null,
  linkedSubjectId: null,
  linkedSubjectColor: null,
  activeLookupField: null,
  collegeAverage: '',
})

const semesterOptions: { value: SemesterType; label: string }[] = [
  { value: '', label: 'Not Applicable' },
  { value: 'first-sem', label: 'First Semester' },
  { value: 'second-sem', label: 'Second Semester' },
]

const levelOptions: { value: LevelType; label: string; description: string }[] =
  [
    {
      value: 'college',
      label: 'College',
      description: 'Prelim, Midterm, Finals grading',
    },
    {
      value: 'shs',
      label: 'Senior High School',
      description: 'Quarter-based (Q1-Q2 or Q3-Q4)',
    },
    {
      value: 'jhs',
      label: 'Junior High School',
      description: 'Full Q1-Q4 grading',
    },
  ]

const getPeriodConfig = (level: LevelType, semester: SemesterType) => {
  if (level === 'college') {
    return [{ key: 'average', label: 'Average' }]
  }

  if (level === 'shs') {
    if (semester === 'second-sem') {
      return [
        { key: 'period1', label: 'Q3' },
        { key: 'period2', label: 'Q4' },
      ]
    }
    return [
      { key: 'period1', label: 'Q1' },
      { key: 'period2', label: 'Q2' },
    ]
  }

  return [
    { key: 'period1', label: 'Q1' },
    { key: 'period2', label: 'Q2' },
    { key: 'period3', label: 'Q3' },
    { key: 'period4', label: 'Q4' },
  ]
}

const SUBJECT_SUGGESTION_LIMIT = 6

const SUBJECT_COLOR_CLASSES: Record<string, string> = {
  'blue-900': 'bg-blue-900',
  'blue-800': 'bg-blue-800',
  'red-700': 'bg-red-700',
  'red-800': 'bg-red-800',
  'emerald-700': 'bg-emerald-700',
  'emerald-800': 'bg-emerald-800',
  'yellow-700': 'bg-yellow-700',
  'yellow-800': 'bg-yellow-800',
  'orange-700': 'bg-orange-700',
  'orange-800': 'bg-orange-800',
  'violet-700': 'bg-violet-700',
  'violet-800': 'bg-violet-800',
  'purple-700': 'bg-purple-700',
  'purple-800': 'bg-purple-800',
  'indigo-700': 'bg-indigo-700',
  'indigo-800': 'bg-indigo-800',
}

const TransfereeRecordModal = ({
  isOpen,
  onClose,
  studentId,
  studentName,
  existingAyCodes,
  onSuccess,
}: TransfereeRecordModalProps) => {
  const [levelType, setLevelType] = useState<LevelType>('shs')
  const [subjects, setSubjects] = useState<CustomSubject[]>([
    createEmptySubject(),
  ])
  const [formState, setFormState] = useState<FormState>({
    ayCode: '',
    ayLabel: '',
    studentName: studentName || '',
    studentLevelLabel: defaultLevelLabel['shs'],
    studentSection: '',
    semester: 'first-sem',
    notes: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [levelLabelTouched, setLevelLabelTouched] = useState(false)
  const [subjectOptions, setSubjectOptions] = useState<SubjectOption[]>([])
  const [subjectsLoading, setSubjectsLoading] = useState(false)
  const [subjectFetchError, setSubjectFetchError] = useState<string | null>(
    null
  )
  const subjectsLoadedRef = useRef(false)
  const [activeLookupSubjectId, setActiveLookupSubjectId] = useState<
    string | null
  >(null)
  const [currentSuggestions, setCurrentSuggestions] = useState<SubjectOption[]>(
    []
  )

  const normalizedExistingAyCodes = useMemo(
    () => existingAyCodes.map((code) => code.toLowerCase()),
    [existingAyCodes]
  )

  const sanitizeAyBase = (value: string) => value.trim().toUpperCase()

  const buildFormattedAyCode = (
    base: string,
    semester: SemesterType,
    level: LevelType
  ) => {
    const normalized = sanitizeAyBase(base)
    if (!normalized) return ''

    if (level === 'college' || level === 'shs') {
      const suffix =
        semester === 'second-sem' ? 'second_semester' : 'first_semester'
      return `${normalized}_${suffix}_transferee`
    }

    return `${normalized}_transferee`
  }

  const periodConfig = useMemo(
    () => getPeriodConfig(levelType, formState.semester),
    [levelType, formState.semester]
  )

  const formattedAyPreview = useMemo(
    () => buildFormattedAyCode(formState.ayCode, formState.semester, levelType),
    [formState.ayCode, formState.semester, levelType]
  )

  const getLookupQuery = (subject: CustomSubject) => {
    if (subject.activeLookupField === 'code') {
      return subject.code || ''
    }
    if (subject.activeLookupField === 'name') {
      return subject.name || ''
    }
    return ''
  }

  const activeLookupSubject = useMemo(() => {
    if (!activeLookupSubjectId) return null
    return (
      subjects.find((subject) => subject.id === activeLookupSubjectId) ?? null
    )
  }, [activeLookupSubjectId, subjects])

  const hasSubjectData = (subject: CustomSubject) => {
    return (
      (subject.code && subject.code.trim() !== '') ||
      (subject.name && subject.name.trim() !== '') ||
      (subject.collegeAverage && subject.collegeAverage.trim() !== '') ||
      subject.period1 !== '' ||
      subject.period2 !== '' ||
      subject.period3 !== '' ||
      subject.period4 !== '' ||
      subject.specialStatus !== null ||
      !!subject.linkedSubjectId
    )
  }

  const resetState = useCallback(() => {
    setLevelType('shs')
    setSubjects([createEmptySubject()])
    setFormState({
      ayCode: '',
      ayLabel: '',
      studentName: studentName || '',
      studentLevelLabel: defaultLevelLabel['shs'],
      studentSection: '',
      semester: 'first-sem',
      notes: '',
    })
    setErrors({})
    setLevelLabelTouched(false)
  }, [studentName])

  const loadSubjectOptions = useCallback(async () => {
    try {
      setSubjectsLoading(true)
      setSubjectFetchError(null)
      const response = await fetch('/api/subjects')
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !Array.isArray(data.subjects)) {
        throw new Error(data.error || 'Unable to load subjects.')
      }

      const formatted: SubjectOption[] = data.subjects
        .filter((subject: any) => subject && typeof subject === 'object')
        .map((subject: any) => {
          const gradeLevels = Array.isArray(subject.gradeLevels)
            ? subject.gradeLevels
            : subject.gradeLevel
            ? [subject.gradeLevel]
            : undefined
          return {
            id: subject.id || subject.code || generateSubjectId(),
            name: subject.name || subject.code || 'Untitled Subject',
            code: subject.code || undefined,
            color: subject.color || undefined,
            description: subject.description || undefined,
            gradeLevels,
            gradeIds: subject.gradeIds || undefined,
            courseCodes: subject.courseCodes || undefined,
          }
        })

      // Remove duplicates by ID
      const deduped = Array.from(
        formatted.reduce((map, option) => {
          if (!map.has(option.id)) {
            map.set(option.id, option)
          }
          return map
        }, new Map<string, SubjectOption>())
      ).map(([, value]) => value)

      setSubjectOptions(deduped)
      subjectsLoadedRef.current = true
    } catch (error) {
      console.error('Failed to load subject list:', error)
      setSubjectFetchError(
        error instanceof Error ? error.message : 'Failed to load subject list.'
      )
    } finally {
      setSubjectsLoading(false)
    }
  }, [])

  const filterSubjectOptions = useCallback(
    (query: string, field: 'code' | 'name' | null) => {
      if (!subjectOptions.length) return []
      const normalized = query.trim().toLowerCase()
      if (!normalized) {
        return subjectOptions.slice(0, SUBJECT_SUGGESTION_LIMIT)
      }
      return subjectOptions
        .filter((option) => {
          const codeHaystack = (option.code || '').toLowerCase()
          const nameHaystack = (option.name || '').toLowerCase()
          if (field === 'code') {
            return codeHaystack.includes(normalized)
          }
          if (field === 'name') {
            return nameHaystack.includes(normalized)
          }
          return (
            codeHaystack.includes(normalized) ||
            nameHaystack.includes(normalized)
          )
        })
        .slice(0, SUBJECT_SUGGESTION_LIMIT)
    },
    [subjectOptions]
  )

  const updateSuggestionsForSubject = useCallback(
    (subjectId: string, field: 'code' | 'name', value: string) => {
      if (value.trim().length < 2 || !subjectOptions.length) {
        setActiveLookupSubjectId(null)
        setCurrentSuggestions([])
        return
      }

      const formatted =
        field === 'code' ? value.toUpperCase() : value.toLowerCase()
      const suggestions = filterSubjectOptions(formatted, field)

      if (suggestions.length) {
        setActiveLookupSubjectId(subjectId)
        setCurrentSuggestions(suggestions)
      } else {
        setActiveLookupSubjectId(null)
        setCurrentSuggestions([])
      }
    },
    [filterSubjectOptions, subjectOptions.length]
  )

  useEffect(() => {
    if (isOpen) {
      resetState()
      if (!subjectsLoadedRef.current && !subjectsLoading) {
        void loadSubjectOptions()
      }
    }
  }, [isOpen, resetState, loadSubjectOptions, subjectsLoading])

  const handleLevelTypeChange = (nextType: LevelType) => {
    setLevelType(nextType)
    setFormState((prev) => ({
      ...prev,
      semester:
        nextType === 'jhs'
          ? ''
          : prev.semester ||
            (nextType === 'college' ? 'first-sem' : 'first-sem'),
      studentLevelLabel: levelLabelTouched
        ? prev.studentLevelLabel
        : defaultLevelLabel[nextType],
    }))
  }

  const updateSubject = (
    subjectId: string,
    updater: (subject: CustomSubject) => CustomSubject
  ) => {
    setSubjects((prev) =>
      prev.map((subject) =>
        subject.id === subjectId ? updater(subject) : subject
      )
    )
  }

  const addSubject = () => {
    setSubjects((prev) => [...prev, createEmptySubject()])
  }

  const removeSubject = (subjectId: string) => {
    setSubjects((prev) =>
      prev.length === 1
        ? prev
        : prev.filter((subject) => subject.id !== subjectId)
    )
  }

  const handleSubjectLink = (subjectId: string, option: SubjectOption) => {
    setSubjects((prev) => {
      const alreadyUsed = prev.some(
        (subject) =>
          subject.id !== subjectId && subject.documentKey === option.id
      )
      if (alreadyUsed) {
        toast.error('This subject is already added to the record.')
        return prev
      }

      return prev.map((subject) =>
        subject.id === subjectId
          ? {
              ...subject,
              documentKey: option.id,
              linkedSubjectId: option.id,
              linkedSubjectColor: option.color || null,
              name: option.name || subject.name,
              code: option.code || subject.code,
              activeLookupField: null,
            }
          : subject
      )
    })
    setActiveLookupSubjectId(null)
    setCurrentSuggestions([])
  }

  const handleSubjectUnlink = (subjectId: string) => {
    setSubjects((prev) =>
      prev.map((subject) =>
        subject.id === subjectId
          ? {
              ...subject,
              documentKey: subject.id,
              linkedSubjectId: null,
              linkedSubjectColor: null,
              activeLookupField: null,
            }
          : subject
      )
    )
    setActiveLookupSubjectId(null)
    setCurrentSuggestions([])
  }

  const validateForm = () => {
    const validationErrors: Record<string, string> = {}
    const baseAyCode = sanitizeAyBase(formState.ayCode)
    const formattedAyCode = buildFormattedAyCode(
      formState.ayCode,
      formState.semester,
      levelType
    )

    if (!baseAyCode) {
      validationErrors.ayCode = 'Academic year code is required.'
    } else if (
      formattedAyCode &&
      normalizedExistingAyCodes.includes(formattedAyCode.toLowerCase())
    ) {
      validationErrors.ayCode =
        'A record for this formatted academic year already exists.'
    }

    if (
      (levelType === 'college' || levelType === 'shs') &&
      formState.semester !== 'first-sem' &&
      formState.semester !== 'second-sem'
    ) {
      validationErrors.semester =
        'Semester is required for college and SHS transferee records.'
    }

    if (!formState.studentLevelLabel.trim()) {
      validationErrors.studentLevelLabel = 'Student level label is required.'
    }

    const validSubjects = subjects.filter(
      (subject) => subject.name.trim() !== '' || subject.code.trim() !== ''
    )

    if (!validSubjects.length) {
      validationErrors.subjects = 'Add at least one subject with details.'
    } else {
      const hasMissingNames = validSubjects.some(
        (subject) => subject.name.trim() === ''
      )
      if (hasMissingNames) {
        validationErrors.subjects =
          'Each subject entry must include a subject name.'
      }
    }

    return {
      validationErrors,
      isValid: Object.keys(validationErrors).length === 0,
      formattedAyCode,
    }
  }

  const buildPayload = () => {
    const baseAyCode = sanitizeAyBase(formState.ayCode)
    const formattedAyCode = buildFormattedAyCode(
      formState.ayCode,
      formState.semester,
      levelType
    )

    if (!formattedAyCode) {
      throw new Error('Unable to derive formatted academic year code.')
    }

    const payload: Record<string, any> = {}

    if (formState.studentName.trim()) {
      payload.studentName = formState.studentName.trim()
    }
    payload.studentLevel = formState.studentLevelLabel.trim()
    payload.studentSection = formState.studentSection.trim()
    payload.studentSemester =
      levelType === 'jhs' ? '' : formState.semester || ''
    payload.ayDisplayLabel = formState.ayLabel.trim() || baseAyCode
    payload.recordSource = 'transferee-manual'
    payload.transfereeRecord = true
    payload.recordNotes = formState.notes.trim()
    payload.recordLevelType = levelType
    payload.recordSemesterLabel =
      levelType === 'jhs'
        ? 'Full Year'
        : formState.semester === 'first-sem'
        ? 'First Semester'
        : formState.semester === 'second-sem'
        ? 'Second Semester'
        : ''

    subjects.forEach((subject) => {
      if (!subject.name.trim()) {
        return
      }

      const documentKey = subject.documentKey || subject.id

      const collegeAverageValue =
        levelType === 'college'
          ? convertNumericToPercentage(toNumberOrNull(subject.collegeAverage))
          : null

      payload[documentKey] = {
        subjectName: subject.name.trim(),
        subjectCode: subject.code.trim() || undefined,
        period1:
          levelType === 'college'
            ? collegeAverageValue
            : toNumberOrNull(subject.period1),
        period2:
          levelType === 'college'
            ? collegeAverageValue
            : toNumberOrNull(subject.period2),
        period3:
          levelType === 'college'
            ? collegeAverageValue
            : levelType === 'jhs'
            ? toNumberOrNull(subject.period3)
            : null,
        period4: levelType === 'jhs' ? toNumberOrNull(subject.period4) : null,
        specialStatus: subject.specialStatus,
        linkedSubjectId: subject.linkedSubjectId || undefined,
      }
    })

    return { payload, ayCode: formattedAyCode }
  }

  const handleSave = async () => {
    const { isValid, validationErrors } = validateForm()

    if (!isValid) {
      setErrors(validationErrors)
      toast.error('Please review the highlighted fields.')
      return
    }

    const { payload, ayCode } = buildPayload()

    try {
      setSaving(true)
      const response = await fetch(`/api/students/${studentId}/grades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ayCode,
          grades: payload,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to create custom record.')
      }

      toast.success('Custom grade record created.')
      onSuccess(ayCode)
      resetState()
    } catch (error) {
      console.error('Failed to create transferee record:', error)
      toast.error(
        error instanceof Error ? error.message : 'Unable to save custom record.'
      )
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    if (saving) return
    onClose()
  }

  const getSubjectAverage = (subject: CustomSubject) => {
    const normalized = {
      subjectName: subject.name || '',
      period1:
        levelType === 'college'
          ? convertNumericToPercentage(toNumberOrNull(subject.collegeAverage))
          : toNumberOrNull(subject.period1),
      period2:
        levelType === 'college'
          ? convertNumericToPercentage(toNumberOrNull(subject.collegeAverage))
          : toNumberOrNull(subject.period2),
      period3:
        levelType === 'college'
          ? convertNumericToPercentage(toNumberOrNull(subject.collegeAverage))
          : levelType === 'jhs'
          ? toNumberOrNull(subject.period3)
          : null,
      period4: levelType === 'jhs' ? toNumberOrNull(subject.period4) : null,
      specialStatus: subject.specialStatus,
      subjectCode: subject.code,
    }
    return calculateAverage(
      normalized,
      levelType === 'college',
      levelType === 'shs'
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Manual Transferee Record"
      size="2xl"
    >
      <div className="p-6 space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-xs text-blue-900">
          <p className="font-medium" style={{ fontFamily: 'Poppins' }}>
            Use this workflow to encode historical grades for transferees. These
            records behave like any other academic year document and can be
            edited later inside the Registrar Grades tab.
          </p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-700">
                Academic Year Code
              </label>
              <Input
                value={formState.ayCode}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    ayCode: event.target.value,
                  }))
                }
                placeholder="e.g., AY2526"
                className={cn(errors.ayCode && 'border-red-500')}
              />
              {errors.ayCode && (
                <p className="text-[11px] text-red-600 mt-1">{errors.ayCode}</p>
              )}
              {formattedAyPreview && (
                <p className="text-[11px] text-gray-500 mt-1">
                  Final document ID:{' '}
                  <span className="font-medium">{formattedAyPreview}</span>
                </p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">
                Display Label
              </label>
              <Input
                value={formState.ayLabel}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    ayLabel: event.target.value,
                  }))
                }
                placeholder="Optional display label"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-700">
                Student Name
              </label>
              <Input
                value={formState.studentName}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    studentName: event.target.value,
                  }))
                }
                placeholder="Optional override"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">
                Student Section
              </label>
              <Input
                value={formState.studentSection}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    studentSection: event.target.value,
                  }))
                }
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-medium text-gray-700">
              Grade Template
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {levelOptions.map((option) => {
                const isActive = option.value === levelType
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleLevelTypeChange(option.value)}
                    className={cn(
                      'border rounded-lg p-3 text-left transition-all',
                      isActive
                        ? 'border-blue-900 bg-blue-900 text-white shadow'
                        : 'border-gray-200 hover:border-blue-400'
                    )}
                  >
                    <div className="text-sm font-medium">{option.label}</div>
                    <p className="text-[11px] mt-1 opacity-80">
                      {option.description}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-700">
                  Student Level Label
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setLevelLabelTouched(false)
                    setFormState((prev) => ({
                      ...prev,
                      studentLevelLabel: defaultLevelLabel[levelType],
                    }))
                  }}
                  className="text-[11px] text-blue-700 flex items-center gap-1"
                >
                  <ArrowsClockwise size={12} /> Reset
                </button>
              </div>
              <Input
                value={formState.studentLevelLabel}
                onChange={(event) => {
                  if (!levelLabelTouched) {
                    setLevelLabelTouched(true)
                  }
                  setFormState((prev) => ({
                    ...prev,
                    studentLevelLabel: event.target.value,
                  }))
                }}
                placeholder={
                  levelType === 'college'
                    ? 'e.g., BSIT 2 - S1'
                    : levelType === 'shs'
                    ? 'e.g., Grade 11 STEM'
                    : 'e.g., Grade 10 - Ruby'
                }
                className={cn(errors.studentLevelLabel && 'border-red-500')}
              />
              {errors.studentLevelLabel && (
                <p className="text-[11px] text-red-600 mt-1">
                  {errors.studentLevelLabel}
                </p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">
                Semester / Term
              </label>
              <select
                value={formState.semester}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    semester: event.target.value as SemesterType,
                  }))
                }
                disabled={levelType === 'jhs'}
                className={cn(
                  'w-full h-9 rounded-md border border-gray-300 bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-900',
                  levelType === 'jhs' &&
                    'bg-gray-100 text-gray-500 cursor-not-allowed',
                  errors.semester && 'border-red-500'
                )}
              >
                {semesterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.semester && (
                <p className="text-[11px] text-red-600 mt-1">
                  {errors.semester}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold">Subjects & Grades</h3>
            <p className="text-[11px] text-gray-500">
              Grade inputs adapt to the selected template (
              {periodConfig.map((config) => config.label).join(' / ')})
            </p>
          </div>

          {errors.subjects && (
            <div className="flex items-center gap-2 text-[11px] text-red-600">
              <WarningCircle size={14} weight="bold" />
              <span>{errors.subjects}</span>
            </div>
          )}

          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full min-w-[900px] text-xs border-collapse">
              <thead className="bg-blue-900 text-white">
                <tr>
                  <th className="p-3 text-left border-r border-blue-800">
                    Subject Code
                  </th>
                  <th className="p-3 text-left border-r border-blue-800">
                    Subject Name
                  </th>
                  {(levelType === 'college'
                    ? (['average'] as const)
                    : (['period1', 'period2', 'period3', 'period4'] as const)
                  ).map((periodKey) => {
                    const config = periodConfig.find(
                      (item) => item.key === periodKey
                    )
                    if (!config) return null
                    return (
                      <th
                        key={periodKey}
                        className="p-3 text-left border-r border-blue-800"
                      >
                        {config.label}
                      </th>
                    )
                  })}
                  <th className="p-3 text-left border-r border-blue-800">
                    Special Status
                  </th>
                  {levelType !== 'college' && (
                    <th className="p-3 text-left border-r border-blue-800">
                      Summary
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subjects.map((subject, index) => {
                  const average = getSubjectAverage(subject)
                  return (
                    <tr key={subject.id} className="align-top">
                      <td className="p-3 border-r border-gray-200 align-top">
                        <div className="flex items-start gap-2">
                          <span
                            className={cn(
                              'w-4 h-4 rounded-sm border border-gray-200 mt-2',
                              subject.linkedSubjectColor
                                ? SUBJECT_COLOR_CLASSES[
                                    subject.linkedSubjectColor
                                  ] || 'bg-gray-300'
                                : 'bg-gray-300'
                            )}
                          />
                          <div className="flex-1">
                            <label className="text-[11px] font-medium text-gray-700">
                              Subject Code
                            </label>
                            <Input
                              value={subject.code}
                              onChange={(event) => {
                                const nextValue = event.target.value
                                updateSubject(subject.id, (current) => {
                                  const shouldClearLink =
                                    current.linkedSubjectId &&
                                    nextValue !== current.code
                                  return {
                                    ...current,
                                    code: nextValue,
                                    activeLookupField: 'code',
                                    ...(shouldClearLink
                                      ? {
                                          linkedSubjectId: null,
                                          linkedSubjectColor: null,
                                          documentKey: current.id,
                                        }
                                      : {}),
                                  }
                                })
                                if (nextValue.trim().length >= 2) {
                                  updateSuggestionsForSubject(
                                    subject.id,
                                    'code',
                                    nextValue
                                  )
                                } else {
                                  setActiveLookupSubjectId(null)
                                  setCurrentSuggestions([])
                                }
                              }}
                              placeholder="e.g., MATH101"
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-3 border-r border-gray-200 align-top">
                        <label className="text-[11px] font-medium text-gray-700">
                          Subject Name #{index + 1}
                        </label>
                        <Input
                          value={subject.name}
                          onChange={(event) => {
                            const nextValue = event.target.value
                            updateSubject(subject.id, (current) => {
                              const shouldClearLink =
                                current.linkedSubjectId &&
                                nextValue !== current.name
                              return {
                                ...current,
                                name: nextValue,
                                activeLookupField: 'name',
                                ...(shouldClearLink
                                  ? {
                                      linkedSubjectId: null,
                                      linkedSubjectColor: null,
                                      documentKey: current.id,
                                    }
                                  : {}),
                              }
                            })
                            if (nextValue.trim().length >= 2) {
                              updateSuggestionsForSubject(
                                subject.id,
                                'name',
                                nextValue
                              )
                            } else {
                              setActiveLookupSubjectId(null)
                              setCurrentSuggestions([])
                            }
                          }}
                          placeholder="e.g., General Mathematics"
                          className="mt-1"
                        />
                        {subjects.length > 1 && hasSubjectData(subject) && (
                          <button
                            type="button"
                            onClick={() => removeSubject(subject.id)}
                            className="text-red-600 hover:text-red-700 text-xs flex items-center gap-1 mt-3"
                          >
                            <XCircle size={14} weight="bold" />
                            Remove
                          </button>
                        )}
                      </td>
                      {(levelType === 'college'
                        ? (['average'] as const)
                        : ([
                            'period1',
                            'period2',
                            'period3',
                            'period4',
                          ] as const)
                      ).map((periodKey) => {
                        const config = periodConfig.find(
                          (item) => item.key === periodKey
                        )
                        if (!config) return null
                        return (
                          <td
                            key={periodKey}
                            className="p-3 w-32 border-r border-gray-200"
                          >
                            <label className="text-[11px] font-medium text-gray-700">
                              {config.label}
                            </label>
                            <Input
                              type="number"
                              min={levelType === 'college' ? 1 : 0}
                              max={levelType === 'college' ? 5 : 100}
                              step={levelType === 'college' ? 0.25 : 0.1}
                              value={
                                levelType === 'college'
                                  ? subject.collegeAverage ?? ''
                                  : (subject[
                                      periodKey as keyof CustomSubject
                                    ] as string)
                              }
                              onChange={(event) =>
                                updateSubject(subject.id, (current) => {
                                  if (levelType === 'college') {
                                    return {
                                      ...current,
                                      collegeAverage: event.target.value,
                                    }
                                  }
                                  return {
                                    ...current,
                                    [periodKey]: event.target.value,
                                  }
                                })
                              }
                              placeholder={
                                levelType === 'college' ? '1.0–5.0' : '0-100'
                              }
                              className="mt-1"
                            />
                            {levelType === 'college' &&
                              periodKey === 'average' && (
                                <div className="text-[11px] text-gray-500 mt-2">
                                  {subject.specialStatus ? (
                                    <span className="font-medium">
                                      Status: {subject.specialStatus}
                                    </span>
                                  ) : average !== null ? (
                                    <>
                                      <span className="font-medium">
                                        Average: {average.toFixed(2)}
                                      </span>{' '}
                                      •{' '}
                                      <span>{getDescriptiveMode(average)}</span>
                                    </>
                                  ) : (
                                    <span className="text-gray-400">
                                      No grades yet
                                    </span>
                                  )}
                                </div>
                              )}
                          </td>
                        )
                      })}
                      <td className="p-3 w-40 border-r border-gray-200">
                        <label className="text-[11px] font-medium text-gray-700">
                          Special Status
                        </label>
                        <select
                          value={subject.specialStatus ?? ''}
                          onChange={(event) =>
                            updateSubject(subject.id, (current) => ({
                              ...current,
                              specialStatus: event.target.value
                                ? (event.target.value as SpecialStatus)
                                : null,
                            }))
                          }
                          className="w-full h-9 rounded-md border border-gray-300 bg-white px-2 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-900 mt-1"
                        >
                          <option value="">None</option>
                          {SPECIAL_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>
                      {levelType !== 'college' && (
                        <td className="p-3 w-40 border-r border-gray-200">
                          <div className="text-gray-600 text-xs">
                            {subject.specialStatus ? (
                              <span className="font-medium">
                                Status: {subject.specialStatus}
                              </span>
                            ) : average !== null ? (
                              <>
                                <span className="font-medium">
                                  Average: {average.toFixed(2)}
                                </span>{' '}
                                • <span>{getDescriptiveMode(average)}</span>
                              </>
                            ) : (
                              <span className="text-gray-400">
                                No grades yet
                              </span>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {activeLookupSubject && currentSuggestions.length > 0 && (
            <div className="border border-blue-200 rounded-lg p-3 bg-blue-50/40">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-blue-900">
                    Catalog suggestions
                  </p>
                  <p className="text-[11px] text-blue-800">
                    Matching subjects for{' '}
                    <span className="font-medium">
                      {activeLookupSubject.code?.trim() ||
                        activeLookupSubject.name ||
                        'current subject'}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveLookupSubjectId(null)
                    setCurrentSuggestions([])
                  }}
                  className="text-[11px] text-blue-900 underline"
                >
                  Dismiss
                </button>
              </div>

              <div className="grid gap-2 mt-3">
                {currentSuggestions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() =>
                      handleSubjectLink(activeLookupSubject.id, option)
                    }
                    className="text-left w-full border border-blue-200 rounded-md bg-white px-3 py-2 hover:bg-blue-100 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          'mt-0.5 w-3 h-3 rounded-sm border border-gray-200',
                          option.color
                            ? SUBJECT_COLOR_CLASSES[option.color] ||
                                'bg-gray-300'
                            : 'bg-gray-300'
                        )}
                        aria-hidden="true"
                      />
                      <div>
                        <div className="text-xs font-semibold text-blue-900">
                          {option.code
                            ? `${option.code} • ${option.name}`
                            : option.name}
                        </div>
                        <div className="text-[11px] text-gray-600">
                          {option.description
                            ? option.description
                            : option.gradeLevels && option.gradeLevels.length
                            ? `Grades ${option.gradeLevels.join(', ')}`
                            : option.courseCodes && option.courseCodes.length
                            ? `Courses: ${option.courseCodes.join(', ')}`
                            : 'No additional metadata'}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={addSubject}
              className="border-blue-900 text-blue-900 hover:bg-blue-50"
            >
              <div className="flex items-center gap-2 text-xs">
                <PlusCircle size={14} weight="bold" />
                <span>Add Subject</span>
              </div>
            </Button>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={saving}
            className="rounded-md"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-900 hover:bg-blue-900 rounded-md"
          >
            {saving ? (
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </div>
            ) : (
              'Save Custom Record'
            )}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default TransfereeRecordModal
