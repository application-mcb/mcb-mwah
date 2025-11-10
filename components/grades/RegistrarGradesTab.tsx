'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'react-toastify'
import {
  GraduationCap,
  BookOpen,
  Calculator,
  Pencil,
  Users,
  CheckCircle,
  FileText,
  FloppyDisk,
  XCircle,
  NotePencil,
} from '@phosphor-icons/react'

type SpecialStatus = 'INC' | 'FA' | 'FW' | 'W' | null

type SubjectGrade = {
  subjectName: string
  subjectCode?: string
  period1: number | null
  period2: number | null
  period3: number | null
  period4: number | null
  specialStatus?: SpecialStatus
}

type GradesDocument = Record<string, SubjectGrade | any>

type GradesPeriod = {
  id: string
  label: string
  ayCode: string
}

type RegistrarGradesTabProps = {
  studentId: string
  studentName?: string
}

type EditableGrade = SubjectGrade & {
  subjectId: string
  subjectCode?: string
}

const METADATA_FIELDS = new Set([
  'studentName',
  'studentSection',
  'studentLevel',
  'studentSemester',
  'createdAt',
  'updatedAt',
])

const SPECIAL_STATUSES: Exclude<SpecialStatus, null>[] = [
  'INC',
  'FA',
  'FW',
  'W',
]

const isValidSpecialStatus = (
  value: unknown
): value is Exclude<SpecialStatus, null> =>
  typeof value === 'string' &&
  SPECIAL_STATUSES.includes(value as Exclude<SpecialStatus, null>)

const toNumberOrNull = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

const calculateAverage = (
  grades: SubjectGrade,
  isCollege: boolean = false,
  isSHS: boolean = false
): number | null => {
  // If there's a special status, don't calculate average
  if (grades.specialStatus) return null

  let validGrades: number[]

  if (isCollege) {
    // College: only use period1 (Prelim), period2 (Midterm), period3 (Finals)
    validGrades = [grades.period1, grades.period2, grades.period3].filter(
      (grade) => grade !== null && grade !== undefined
    ) as number[]
  } else {
    // High School (JHS and SHS): use all 4 periods (quarters)
    validGrades = [
      grades.period1,
      grades.period2,
      grades.period3,
      grades.period4,
    ].filter((grade) => grade !== null && grade !== undefined) as number[]
  }

  if (validGrades.length === 0) return null

  const sum = validGrades.reduce((acc, grade) => acc + grade, 0)
  return Math.round((sum / validGrades.length) * 100) / 100
}

const convertToNumericMode = (percentage: number | null): number | null => {
  if (percentage === null || percentage === undefined || percentage === 0)
    return null

  if (percentage >= 98) return 1.0
  if (percentage >= 95) return 1.25
  if (percentage >= 92) return 1.5
  if (percentage >= 89) return 1.75
  if (percentage >= 86) return 2.0
  if (percentage >= 83) return 2.25
  if (percentage >= 80) return 2.5
  if (percentage >= 77) return 2.75
  if (percentage >= 75) return 3.0
  return 5.0 // 74 and below
}

const getDescriptiveMode = (percentage: number | null): string => {
  if (percentage === null || percentage === undefined || percentage === 0)
    return 'Incomplete'

  if (percentage >= 98) return 'Excellent'
  if (percentage >= 92) return 'Superior'
  if (percentage >= 86) return 'Very Good'
  if (percentage >= 83) return 'Good'
  if (percentage >= 80) return 'Fair'
  if (percentage >= 75) return 'Passed'
  return 'Failed'
}

const getGradeStatus = (average: number): { status: string; color: string } => {
  if (average === 0) return { status: 'No Grades', color: 'text-gray-800' }
  if (average >= 98) return { status: 'Excellent', color: 'text-green-800' }
  if (average >= 92) return { status: 'Superior', color: 'text-green-800' }
  if (average >= 86) return { status: 'Very Good', color: 'text-blue-900' }
  if (average >= 83) return { status: 'Good', color: 'text-yellow-800' }
  if (average >= 80) return { status: 'Fair', color: 'text-yellow-800' }
  if (average >= 75) return { status: 'Passed', color: 'text-orange-800' }
  return { status: 'Failed', color: 'text-red-800' }
}

const getIndividualGradeStatus = (
  grade: number | null
): { status: string; color: string; bgColor: string } => {
  if (grade === null || grade === undefined || grade === 0)
    return { status: '', color: 'text-gray-700', bgColor: 'bg-gray-600' }
  if (grade >= 98)
    return {
      status: 'Excellent',
      color: 'text-green-800',
      bgColor: 'bg-green-700',
    }
  if (grade >= 92)
    return {
      status: 'Superior',
      color: 'text-green-700',
      bgColor: 'bg-green-600',
    }
  if (grade >= 86)
    return {
      status: 'Very Good',
      color: 'text-blue-900',
      bgColor: 'bg-blue-900',
    }
  if (grade >= 83)
    return {
      status: 'Good',
      color: 'text-yellow-800',
      bgColor: 'bg-yellow-700',
    }
  if (grade >= 80)
    return {
      status: 'Fair',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-600',
    }
  if (grade >= 75)
    return {
      status: 'Passed',
      color: 'text-orange-800',
      bgColor: 'bg-orange-700',
    }
  return { status: 'Failed', color: 'text-red-800', bgColor: 'bg-red-800' }
}

const normalizeSubjectEntry = (
  subjectId: string,
  rawValue: any,
  subjectInfo?: { name?: string; code?: string }
): EditableGrade | null => {
  if (typeof rawValue !== 'object' || rawValue === null) {
    return null
  }

  const subjectNameFromValue =
    typeof rawValue.subjectName === 'string' &&
    rawValue.subjectName.trim() !== ''
      ? rawValue.subjectName.trim()
      : null

  const subjectName =
    subjectInfo?.name && subjectInfo.name.trim() !== ''
      ? subjectInfo.name
      : subjectNameFromValue && subjectNameFromValue.trim() !== ''
      ? subjectNameFromValue.trim()
      : 'Unknown Subject'

  const subjectCodeFromInfo =
    subjectInfo?.code && subjectInfo.code.trim() !== ''
      ? subjectInfo.code.trim()
      : undefined

  const subjectCodeFromValue =
    typeof rawValue.subjectCode === 'string' &&
    rawValue.subjectCode.trim() !== ''
      ? rawValue.subjectCode.trim()
      : typeof rawValue.code === 'string' && rawValue.code.trim() !== ''
      ? rawValue.code.trim()
      : undefined

  const normalized: EditableGrade = {
    subjectId,
    subjectCode: subjectCodeFromInfo ?? subjectCodeFromValue,
    subjectName,
    period1: toNumberOrNull(rawValue.period1),
    period2: toNumberOrNull(rawValue.period2),
    period3: toNumberOrNull(rawValue.period3),
    period4: toNumberOrNull(rawValue.period4),
  }

  if (isValidSpecialStatus(rawValue.specialStatus)) {
    normalized.specialStatus = rawValue.specialStatus
  } else {
    normalized.specialStatus = null
  }

  return normalized
}

const getStatusLabel = (status: Exclude<SpecialStatus, null>) => {
  switch (status) {
    case 'INC':
      return 'Incomplete'
    case 'FA':
      return 'Failed (Absent)'
    case 'FW':
      return 'Failed (Withdrawn)'
    case 'W':
      return 'Withdrawn'
    default:
      return status
  }
}

const RegistrarGradesTab = ({
  studentId,
  studentName,
}: RegistrarGradesTabProps) => {
  const [loading, setLoading] = useState(true)
  const [periods, setPeriods] = useState<GradesPeriod[]>([])
  const [gradesByAy, setGradesByAy] = useState<Record<string, GradesDocument>>(
    {}
  )
  const [metadataByAy, setMetadataByAy] = useState<
    Record<string, Record<string, any>>
  >({})
  const [editingAy, setEditingAy] = useState<string | null>(null)
  const [editedGrades, setEditedGrades] = useState<
    Record<string, GradesDocument>
  >({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [selectedAy, setSelectedAy] = useState<string | null>(null)
  const [subjectInfoById, setSubjectInfoById] = useState<
    Record<string, { name: string; code?: string; color?: string }>
  >({})
  const pendingSubjectRequests = useRef<Set<string>>(new Set())

  const loadSubjectInfo = useCallback(
    async (subjectId: string) => {
      if (!subjectId) return
      if (subjectInfoById[subjectId]) return
      if (pendingSubjectRequests.current.has(subjectId)) return

      pendingSubjectRequests.current.add(subjectId)

      try {
        const response = await fetch(
          `/api/subjects/${encodeURIComponent(subjectId)}`
        )

        if (!response.ok) {
          // If subject not found (404), set fallback values and continue
          if (response.status === 404) {
            console.warn(
              `Subject ${subjectId} not found, using fallback values`
            )
            setSubjectInfoById((prev) => {
              if (prev[subjectId]) {
                return prev
              }
              return {
                ...prev,
                [subjectId]: {
                  name: 'Unknown Subject',
                  code: undefined,
                  color: undefined,
                },
              }
            })
            return
          }
          throw new Error('Failed to fetch subject details')
        }

        const data = await response.json()
        const subject = data.subject

        if (subject) {
          setSubjectInfoById((prev) => {
            if (prev[subjectId]) {
              return prev
            }

            const fallbackName =
              typeof subject.name === 'string' && subject.name.trim() !== ''
                ? subject.name.trim()
                : 'Unknown Subject'

            const fallbackCode =
              typeof subject.code === 'string' && subject.code.trim() !== ''
                ? subject.code.trim()
                : undefined

            const fallbackColor =
              typeof subject.color === 'string' && subject.color.trim() !== ''
                ? subject.color.trim()
                : undefined

            return {
              ...prev,
              [subjectId]: {
                name: fallbackName,
                code: fallbackCode,
                color: fallbackColor,
              },
            }
          })
        }
      } catch (error) {
        console.error(`Failed to load subject details for ${subjectId}:`, error)
      } finally {
        pendingSubjectRequests.current.delete(subjectId)
      }
    },
    [subjectInfoById]
  )

  const refetchAcademicYear = async (ayCode: string) => {
    try {
      const response = await fetch(
        `/api/students/${studentId}/grades?ayCode=${encodeURIComponent(
          ayCode
        )}&includeMetadata=true`
      )
      if (!response.ok) {
        throw new Error('Failed to refresh grades')
      }

      const data = await response.json()
      setGradesByAy((prev) => ({
        ...prev,
        [ayCode]: data.grades || {},
      }))
      setMetadataByAy((prev) => ({
        ...prev,
        [ayCode]: data.metadata || {},
      }))
    } catch (error) {
      console.error(`Failed to refresh grades for ${ayCode}:`, error)
      toast.error(`Unable to refresh grades for ${ayCode}.`)
    }
  }

  useEffect(() => {
    let isMounted = true

    const loadGrades = async () => {
      try {
        setLoading(true)

        // Get list of grade documents (AYs)
        const periodsResponse = await fetch(
          `/api/students/${studentId}/grades?listPeriods=true`
        )
        if (!periodsResponse.ok) {
          throw new Error('Failed to load grade periods')
        }

        const periodsData = await periodsResponse.json()
        const fetchedPeriods: GradesPeriod[] = periodsData.periods || []

        // If no periods, there's nothing to show
        if (!fetchedPeriods.length) {
          if (isMounted) {
            setPeriods([])
            setGradesByAy({})
            setMetadataByAy({})
            setSelectedAy(null)
          }
          return
        }

        const gradesEntries = await Promise.all(
          fetchedPeriods.map(async (period) => {
            try {
              const response = await fetch(
                `/api/students/${studentId}/grades?ayCode=${encodeURIComponent(
                  period.ayCode
                )}&includeMetadata=true`
              )
              if (!response.ok) {
                throw new Error('Failed to load grades')
              }

              const data = await response.json()
              const metadata = data.metadata || {}

              return [period.ayCode, { grades: data.grades || {}, metadata }]
            } catch (error) {
              console.error(
                `Failed to load grades for ${period.ayCode}:`,
                error
              )
              return [period.ayCode, { grades: {}, metadata: {} }]
            }
          })
        )

        if (isMounted) {
          const gradesMap: Record<string, GradesDocument> = {}
          const metadataMap: Record<string, Record<string, any>> = {}

          gradesEntries.forEach(([ayCode, value]) => {
            const { grades, metadata } = value as {
              grades: GradesDocument
              metadata: Record<string, any>
            }
            gradesMap[ayCode as string] = grades
            metadataMap[ayCode as string] = metadata
          })

          setPeriods(fetchedPeriods)
          setGradesByAy(gradesMap)
          setMetadataByAy(metadataMap)
          setSelectedAy((prev) => {
            if (
              prev &&
              fetchedPeriods.some((period) => period.ayCode === prev)
            ) {
              return prev
            }
            return fetchedPeriods[0]?.ayCode || null
          })

          // Preload subject info for all subjects in the grades
          const allSubjectIds = new Set<string>()
          Object.values(gradesMap).forEach((gradesDoc) => {
            Object.keys(gradesDoc).forEach((key) => {
              if (!METADATA_FIELDS.has(key)) {
                allSubjectIds.add(key)
              }
            })
          })

          // Load subject info for all unique subject IDs
          allSubjectIds.forEach((subjectId) => {
            void loadSubjectInfo(subjectId)
          })
        }
      } catch (error) {
        console.error('Error loading grades:', error)
        toast.error('Failed to load grades information.')
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadGrades()

    return () => {
      isMounted = false
    }
  }, [studentId])

  const startEditing = (ayCode: string) => {
    setEditingAy(ayCode)
    setEditedGrades((prev) => ({
      ...prev,
      [ayCode]: JSON.parse(JSON.stringify(gradesByAy[ayCode] || {})),
    }))
  }

  const cancelEditing = (ayCode: string) => {
    setEditedGrades((prev) => {
      const updated = { ...prev }
      delete updated[ayCode]
      return updated
    })
    setEditingAy((current) => (current === ayCode ? null : current))
  }

  const getEditableSubjects = (ayCode: string): EditableGrade[] => {
    const source =
      editingAy === ayCode ? editedGrades[ayCode] : gradesByAy[ayCode]
    if (!source) return []

    const subjects: EditableGrade[] = []

    Object.entries(source).forEach(([subjectId, value]) => {
      if (METADATA_FIELDS.has(subjectId)) {
        return
      }

      const subjectInfo = subjectInfoById[subjectId]
      const hasInlineName =
        typeof (value as SubjectGrade | undefined)?.subjectName === 'string' &&
        ((value as SubjectGrade).subjectName || '').trim() !== ''

      if (
        !subjectInfo &&
        (!hasInlineName || !(value as SubjectGrade).subjectName)
      ) {
        void loadSubjectInfo(subjectId)
      }

      const normalized = normalizeSubjectEntry(subjectId, value, subjectInfo)

      if (normalized) {
        subjects.push(normalized)
      }
    })

    return subjects
  }

  const handleGradeChange = (
    ayCode: string,
    subjectId: string,
    period: keyof SubjectGrade,
    value: string
  ) => {
    if (editingAy !== ayCode) return

    setEditedGrades((prev) => {
      const currentAy = prev[ayCode] ? { ...prev[ayCode] } : {}
      const currentSubject = currentAy[subjectId]
        ? { ...currentAy[subjectId] }
        : {}

      const subjectInfo = subjectInfoById[subjectId]
      if (!subjectInfo) {
        void loadSubjectInfo(subjectId)
      }

      const fallbackSubjectName =
        subjectInfo?.name ??
        (gradesByAy[ayCode]?.[subjectId] as SubjectGrade | undefined)
          ?.subjectName ??
        subjectId

      if (
        typeof currentSubject.subjectName !== 'string' ||
        currentSubject.subjectName.trim() === ''
      ) {
        currentSubject.subjectName = fallbackSubjectName
      }

      const fallbackSubjectCode =
        subjectInfo?.code ??
        (gradesByAy[ayCode]?.[subjectId] as SubjectGrade | undefined)
          ?.subjectCode ??
        currentSubject.subjectCode

      if (
        typeof fallbackSubjectCode === 'string' &&
        fallbackSubjectCode.trim() !== ''
      ) {
        currentSubject.subjectCode = fallbackSubjectCode.trim()
      }

      const parsedValue = value === '' ? null : Number(value)

      currentSubject[period] = Number.isNaN(parsedValue) ? null : parsedValue
      currentAy[subjectId] = currentSubject

      return {
        ...prev,
        [ayCode]: currentAy,
      }
    })
  }

  const handleStatusToggle = (
    ayCode: string,
    subjectId: string,
    status: Exclude<SpecialStatus, null>
  ) => {
    if (editingAy !== ayCode) return

    setEditedGrades((prev) => {
      const currentAy = prev[ayCode] ? { ...prev[ayCode] } : {}
      const currentSubject = currentAy[subjectId]
        ? { ...currentAy[subjectId] }
        : {}

      const subjectInfo = subjectInfoById[subjectId]
      if (!subjectInfo) {
        void loadSubjectInfo(subjectId)
      }

      const fallbackSubjectName =
        subjectInfo?.name ??
        (gradesByAy[ayCode]?.[subjectId] as SubjectGrade | undefined)
          ?.subjectName ??
        subjectId

      if (
        typeof currentSubject.subjectName !== 'string' ||
        currentSubject.subjectName.trim() === ''
      ) {
        currentSubject.subjectName = fallbackSubjectName
      }

      const fallbackSubjectCode =
        subjectInfo?.code ??
        (gradesByAy[ayCode]?.[subjectId] as SubjectGrade | undefined)
          ?.subjectCode ??
        currentSubject.subjectCode

      if (
        typeof fallbackSubjectCode === 'string' &&
        fallbackSubjectCode.trim() !== ''
      ) {
        currentSubject.subjectCode = fallbackSubjectCode.trim()
      }

      currentSubject.specialStatus =
        currentSubject.specialStatus === status ? null : status
      currentAy[subjectId] = currentSubject

      return {
        ...prev,
        [ayCode]: currentAy,
      }
    })
  }

  const saveGrades = async (ayCode: string) => {
    if (editingAy !== ayCode) return

    try {
      setSaving((prev) => ({ ...prev, [ayCode]: true }))

      const payload = editedGrades[ayCode] || {}

      const response = await fetch(
        `/api/students/${studentId}/grades?ayCode=${encodeURIComponent(
          ayCode
        )}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ grades: payload }),
        }
      )

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to save grades')
      }

      await refetchAcademicYear(ayCode)
      setEditingAy(null)
      setEditedGrades((prev) => {
        const updated = { ...prev }
        delete updated[ayCode]
        return updated
      })

      toast.success(`Grades for ${ayCode} saved successfully.`)
    } catch (error) {
      console.error('Failed to save grades:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to save grades.'
      )
    } finally {
      setSaving((prev) => ({ ...prev, [ayCode]: false }))
    }
  }

  const renderSpecialStatusButtons = (
    ayCode: string,
    subjectId: string,
    currentStatus: SpecialStatus
  ) => {
    const isEditing = editingAy === ayCode

    return (
      <div className="flex flex-wrap gap-2">
        {SPECIAL_STATUSES.map((status) => {
          const isActive = currentStatus === status
          const baseClasses =
            'px-2 py-1 text-xs transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-md'
          const inactiveClasses = 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          const activeClasses =
            status === 'INC'
              ? 'bg-orange-600 text-white'
              : status === 'FA'
              ? 'bg-red-600 text-white'
              : status === 'FW'
              ? 'bg-red-700 text-white'
              : 'bg-yellow-600 text-white'

          return (
            <button
              key={status}
              type="button"
              disabled={!isEditing}
              onClick={() => handleStatusToggle(ayCode, subjectId, status)}
              className={`${baseClasses} ${
                isActive ? activeClasses : inactiveClasses
              } ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              {status}
            </button>
          )
        })}
        {currentStatus && (
          <button
            type="button"
            disabled={!isEditing}
            onClick={() =>
              handleStatusToggle(
                ayCode,
                subjectId,
                currentStatus as Exclude<SpecialStatus, null>
              )
            }
            className={`px-2 py-1 text-xs transition-colors bg-gray-500 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-md ${
              !isEditing ? 'opacity-60 cursor-not-allowed' : ''
            }`}
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            Clear
          </button>
        )}
      </div>
    )
  }

  const isCollegeDoc = (ayCode: string): boolean => {
    const metadata = metadataByAy[ayCode]
    if (!metadata) {
      // Check document ID format: college has course code pattern
      return ayCode.includes('_first_semester_') ||
        ayCode.includes('_second_semester_')
        ? !ayCode.match(/_(STEM|ABM|HUMSS|GAS|TVL|ICT|HE|IA)_/) // SHS has strand pattern
        : false
    }
    if (metadata.studentSemester) {
      // Check if SHS by checking level format
      const level = (metadata.studentLevel as string) || ''
      // SHS has format like "Grade 11 STEM" or "Grade 12 ABM"
      const isSHS = /Grade\s+(11|12)\s+/.test(level)
      return !isSHS // Return true if college, false if SHS
    }
    const level = (metadata.studentLevel as string) || ''
    return (
      level.toLowerCase().includes('year') || level.toLowerCase().includes('bs')
    )
  }

  const isSHSDoc = (ayCode: string): boolean => {
    const metadata = metadataByAy[ayCode]
    if (!metadata) {
      // Check document ID format: SHS has strand pattern
      return !!ayCode.match(/_(STEM|ABM|HUMSS|GAS|TVL|ICT|HE|IA)_/)
    }
    if (metadata.studentSemester) {
      const level = (metadata.studentLevel as string) || ''
      // SHS has format like "Grade 11 STEM" or "Grade 12 ABM"
      return /Grade\s+(11|12)\s+/.test(level)
    }
    return false
  }

  const getSHSSemester = (
    ayCode: string
  ): 'first-sem' | 'second-sem' | null => {
    const metadata = metadataByAy[ayCode]
    if (metadata?.studentSemester) {
      const semester = metadata.studentSemester as string
      if (semester === 'first-sem' || semester === 'second-sem') {
        return semester
      }
    }
    // Check document ID format
    if (ayCode.includes('first_semester')) return 'first-sem'
    if (ayCode.includes('second_semester')) return 'second-sem'
    return null
  }

  const sortedPeriods = useMemo(() => {
    return [...periods].sort((a, b) => (a.id < b.id ? 1 : -1))
  }, [periods])

  const visiblePeriods = useMemo(() => {
    if (!selectedAy) {
      return sortedPeriods
    }
    return sortedPeriods.filter((period) => period.ayCode === selectedAy)
  }, [sortedPeriods, selectedAy])

  useEffect(() => {
    if (!selectedAy && sortedPeriods.length > 0) {
      setSelectedAy(sortedPeriods[0].ayCode)
    }
  }, [sortedPeriods, selectedAy])

  const getPillLabel = (ayCode: string) => {
    const metadata = metadataByAy[ayCode]
    const level = metadata?.studentLevel as string | undefined
    const semester = metadata?.studentSemester as string | undefined

    if (level && semester) {
      return `${level} • ${semester}`
    }

    if (level) {
      return level
    }

    return ayCode
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div
          className="text-xs text-gray-600"
          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
        >
          Loading grades...
        </div>
        <Card className="p-6 bg-gray-50 border border-gray-200">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 w-1/3" />
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 w-full" />
              <div className="h-3 bg-gray-200 w-5/6" />
              <div className="h-3 bg-gray-200 w-4/6" />
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (!sortedPeriods.length) {
    return (
      <Card className="p-6 bg-gray-50 border border-gray-200">
        <div className="text-center">
          <h3
            className="text-sm font-medium text-gray-900"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            No grades found
          </h3>
          <p
            className="text-xs text-gray-600 mt-2"
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            This student does not have any recorded grades yet.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {sortedPeriods.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {sortedPeriods.map((period) => {
            const isActive = period.ayCode === selectedAy
            const meta = metadataByAy[period.ayCode] || {}
            const rawDoc = gradesByAy[period.ayCode] || {}
            // Prefer formatted studentLevel (e.g., "Grade 7" or "BSIT 1 - S1"); fallback to legacy gradeLevel
            const levelText =
              typeof meta.studentLevel === 'string' && meta.studentLevel.trim()
                ? meta.studentLevel
                : rawDoc.gradeLevel
                ? `Grade ${rawDoc.gradeLevel}`
                : 'Unknown'
            const pillLabel = levelText
            const pillSubLabel = `AY${period.ayCode}`

            return (
              <button
                key={period.ayCode}
                type="button"
                onClick={() => setSelectedAy(period.ayCode)}
                className={`px-4 py-2 rounded-full text-xs transition-all border ${
                  isActive
                    ? 'bg-blue-900 text-white border-blue-900 shadow'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
                style={{
                  fontFamily: 'Poppins',
                  fontWeight: isActive ? 400 : 300,
                }}
              >
                <span className="block text-left">
                  <span className="font-medium leading-tight">{pillLabel}</span>
                  <span className="block text-[10px] text-gray-300 leading-tight">
                    {pillSubLabel}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      )}

      {visiblePeriods.map((period) => {
        const { ayCode } = period
        const subjects = getEditableSubjects(ayCode)
        const isEditing = editingAy === ayCode
        const docIsCollege = isCollegeDoc(ayCode)
        const metadata = metadataByAy[ayCode] || {}

        return (
          <div key={ayCode} className="border-none">
            <div className="flex justify-end m-0">
              <div className="flex items-center gap-3 p-3">
                {isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => cancelEditing(ayCode)}
                      disabled={saving[ayCode]}
                      className="rounded-md"
                    >
                      <div
                        className="flex items-center gap-2 rounded-md"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        <XCircle
                          size={14}
                          weight="bold"
                          className="text-blue-900"
                        />
                        <span>Cancel</span>
                      </div>
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => saveGrades(ayCode)}
                      disabled={saving[ayCode]}
                      className="bg-blue-900 hover:bg-blue-900 rounded-md "
                    >
                      {saving[ayCode] ? (
                        <div
                          className="flex items-center gap-2 rounded-md"
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                        >
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Saving...</span>
                        </div>
                      ) : (
                        <div
                          className="flex items-center gap-2 rounded-md"
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                        >
                          <FloppyDisk
                            size={14}
                            weight="bold"
                            className="text-white"
                          />
                          <span>Save</span>
                        </div>
                      )}
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => startEditing(ayCode)}
                    className="bg-blue-900 hover:bg-blue-900 rounded-md"
                  >
                    <div
                      className="flex items-center gap-2"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      <NotePencil
                        size={14}
                        weight="bold"
                        className="text-white"
                      />
                      <span>Edit Grades</span>
                    </div>
                  </Button>
                )}
              </div>
            </div>

            {subjects.length === 0 ? (
              <div
                className="px-6 py-8 text-center text-xs text-gray-500"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                No subjects recorded for this academic year.
              </div>
            ) : (
              (() => {
                const docIsCollege = isCollegeDoc(ayCode)
                const docIsSHS = isSHSDoc(ayCode)
                const shsSemester = getSHSSemester(ayCode)

                return (
                  <div className="">
                    <table className="w-full rounded-lg overflow-hidden">
                      <thead className="bg-blue-900 border-b border-blue-900">
                        <tr>
                          <th className="p-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-blue-900">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 bg-blue-900 flex items-center justify-center rounded-md">
                                <div className="w-5 h-5 bg-white text-blue-900 flex items-center justify-center aspect-square rounded-md">
                                  <BookOpen size={12} weight="bold" />
                                </div>
                              </div>
                              Subject
                            </div>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-blue-900">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 bg-blue-900 flex items-center justify-center rounded-md">
                                <div className="w-5 h-5 bg-white text-blue-900 flex items-center justify-center aspect-square rounded-md">
                                  <Calculator size={12} weight="bold" />
                                </div>
                              </div>
                              {docIsCollege
                                ? 'Prelim'
                                : docIsSHS && shsSemester === 'first-sem'
                                ? 'Q1'
                                : docIsSHS && shsSemester === 'second-sem'
                                ? 'Q3'
                                : 'Q1'}
                            </div>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-blue-900">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 bg-blue-900 flex items-center justify-center rounded-md">
                                <div className="w-5 h-5 bg-white text-blue-900 flex items-center justify-center aspect-square rounded-md">
                                  <Calculator size={12} weight="bold" />
                                </div>
                              </div>
                              {docIsCollege
                                ? 'Midterm'
                                : docIsSHS && shsSemester === 'first-sem'
                                ? 'Q2'
                                : docIsSHS && shsSemester === 'second-sem'
                                ? 'Q4'
                                : 'Q2'}
                            </div>
                          </th>
                          {docIsCollege && (
                            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-blue-900">
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 bg-blue-900 flex items-center justify-center">
                                  <div className="w-5 h-5 bg-white text-blue-900 flex items-center justify-center aspect-square">
                                    <Calculator size={12} weight="bold" />
                                  </div>
                                </div>
                                Finals
                              </div>
                            </th>
                          )}
                          {docIsSHS && shsSemester === 'first-sem' && (
                            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-blue-900">
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 bg-blue-900 flex items-center justify-center rounded-md">
                                  <div className="w-5 h-5 bg-white text-blue-900 flex items-center justify-center aspect-square rounded-md">
                                    <Calculator size={12} weight="bold" />
                                  </div>
                                </div>
                                Q2
                              </div>
                            </th>
                          )}
                          {docIsSHS && shsSemester === 'second-sem' && (
                            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-blue-900">
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 bg-blue-900 flex items-center justify-center rounded-md">
                                  <div className="w-5 h-5 bg-white text-blue-900 flex items-center justify-center aspect-square rounded-md">
                                    <Calculator size={12} weight="bold" />
                                  </div>
                                </div>
                                Q4
                              </div>
                            </th>
                          )}
                          {!docIsCollege && !docIsSHS && (
                            <>
                              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-blue-900">
                                <div className="flex items-center gap-2">
                                  <div className="w-5 h-5 bg-blue-900 flex items-center justify-center">
                                    <div className="w-5 h-5 bg-white text-blue-900 flex items-center justify-center aspect-square">
                                      <Calculator size={12} weight="bold" />
                                    </div>
                                  </div>
                                  Q3
                                </div>
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-blue-900">
                                <div className="flex items-center gap-2">
                                  <div className="w-5 h-5 bg-blue-900 flex items-center justify-center rounded-md">
                                    <div className="w-5 h-5 bg-white text-blue-900 flex items-center justify-center aspect-square rounded-md">
                                      <Calculator size={12} weight="bold" />
                                    </div>
                                  </div>
                                  Q4
                                </div>
                              </th>
                            </>
                          )}
                          <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-blue-900">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 bg-blue-900 flex items-center justify-center rounded-md">
                                <div className="w-5 h-5 bg-white text-blue-900 flex items-center justify-center aspect-square rounded-md">
                                  <GraduationCap size={12} weight="bold" />
                                </div>
                              </div>
                              Average
                            </div>
                          </th>
                          {docIsCollege && (
                            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-blue-900">
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 bg-blue-900 flex items-center justify-center">
                                  <div className="w-5 h-5 bg-white text-blue-900 flex items-center justify-center aspect-square">
                                    <CheckCircle size={12} weight="bold" />
                                  </div>
                                </div>
                                Final Grade
                              </div>
                            </th>
                          )}
                          <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 bg-blue-900 flex items-center justify-center">
                                <div className="w-5 h-5 bg-white text-blue-900 flex items-center justify-center aspect-square rounded-md">
                                  <Pencil size={12} weight="fill" />
                                </div>
                              </div>
                              Special Status
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200 border-1">
                        {subjects.map((subject) => {
                          const currentData =
                            editingAy === ayCode
                              ? editedGrades[ayCode]?.[subject.subjectId]
                              : gradesByAy[ayCode]?.[subject.subjectId]
                          const currentStatus = (currentData?.specialStatus ??
                            null) as SpecialStatus

                          // Calculate average and final grade
                          const average = calculateAverage(
                            currentData || {},
                            docIsCollege,
                            docIsSHS
                          )
                          const numericMode =
                            average !== null
                              ? convertToNumericMode(average)
                              : null
                          const remarks =
                            average !== null
                              ? getDescriptiveMode(average)
                              : currentStatus
                              ? getStatusLabel(currentStatus)
                              : 'No Grades'

                          return (
                            <tr
                              key={`${ayCode}-${subject.subjectId}`}
                              className="hover:bg-gray-50"
                            >
                              {/* Subject Column */}
                              <td className="p-3 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-4 h-4 rounded-sm flex-shrink-0 ${
                                      subjectInfoById[subject.subjectId]?.color
                                        ? `bg-${
                                            subjectInfoById[subject.subjectId]
                                              .color
                                          }`
                                        : 'bg-gray-400'
                                    }`}
                                    title={
                                      subjectInfoById[subject.subjectId]
                                        ?.color || 'Unknown color'
                                    }
                                  />
                                  <div>
                                    <div
                                      className="text-sm font-medium text-gray-900"
                                      style={{
                                        fontFamily: 'Poppins',
                                        fontWeight: 400,
                                      }}
                                    >
                                      {subjectInfoById[subject.subjectId]
                                        ?.name ||
                                        subject.subjectName ||
                                        'Unknown Subject'}
                                    </div>
                                    {(subjectInfoById[subject.subjectId]
                                      ?.code ||
                                      subject.subjectCode) && (
                                      <div
                                        className="text-xs text-gray-500"
                                        style={{
                                          fontFamily: 'Poppins',
                                          fontWeight: 300,
                                        }}
                                      >
                                        {subjectInfoById[subject.subjectId]
                                          ?.code || subject.subjectCode}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              {(docIsCollege
                                ? ([
                                    'period1',
                                    'period2',
                                    'period3',
                                  ] as (keyof SubjectGrade)[])
                                : docIsSHS
                                ? ([
                                    'period1',
                                    'period2',
                                  ] as (keyof SubjectGrade)[])
                                : ([
                                    'period1',
                                    'period2',
                                    'period3',
                                  ] as (keyof SubjectGrade)[])
                              ).map((periodKey) => {
                                const gradeValue = currentData?.[periodKey] as
                                  | number
                                  | null
                                const gradeStatus =
                                  getIndividualGradeStatus(gradeValue)
                                return (
                                  <td
                                    key={periodKey}
                                    className="p-3 whitespace-nowrap border-r border-gray-200"
                                  >
                                    <div className="flex flex-col items-center gap-1">
                                      <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        value={
                                          (currentData?.[periodKey] ?? '') as
                                            | number
                                            | ''
                                        }
                                        disabled={!isEditing}
                                        onChange={(event) =>
                                          handleGradeChange(
                                            ayCode,
                                            subject.subjectId,
                                            periodKey,
                                            event.target.value
                                          )
                                        }
                                        className={`w-full px-2 py-1 text-xs border ${
                                          isEditing
                                            ? 'border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500'
                                            : 'border-transparent bg-gray-100 cursor-not-allowed'
                                        }`}
                                        placeholder="0-100"
                                        style={{
                                          fontFamily: 'Poppins',
                                          fontWeight: 400,
                                        }}
                                      />
                                      {gradeValue && gradeValue > 0 && (
                                        <div className="flex items-center justify-center gap-1">
                                          <div
                                            className={`w-3 h-3 ${gradeStatus.bgColor} rounded-md`}
                                          />
                                          <div
                                            className={`text-xs font-medium ${gradeStatus.color}`}
                                            style={{
                                              fontFamily: 'Poppins',
                                              fontWeight: 400,
                                            }}
                                          >
                                            {gradeStatus.status}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                )
                              })}
                              {!docIsCollege &&
                                !docIsSHS &&
                                (() => {
                                  const gradeValue = currentData?.period4 as
                                    | number
                                    | null
                                  const gradeStatus =
                                    getIndividualGradeStatus(gradeValue)
                                  return (
                                    <td className="p-3 whitespace-nowrap border-r border-gray-200 bg-white">
                                      <div className="flex flex-col items-center gap-1">
                                        <input
                                          type="number"
                                          min="0"
                                          max="100"
                                          step="0.1"
                                          value={
                                            (currentData?.period4 ?? '') as
                                              | number
                                              | ''
                                          }
                                          disabled={!isEditing}
                                          onChange={(event) =>
                                            handleGradeChange(
                                              ayCode,
                                              subject.subjectId,
                                              'period4',
                                              event.target.value
                                            )
                                          }
                                          className={`w-full px-2 py-1 text-xs border rounded-md ${
                                            isEditing
                                              ? 'border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500'
                                              : 'border-transparent bg-gray-100 cursor-not-allowed'
                                          }`}
                                          placeholder="0-100"
                                          style={{
                                            fontFamily: 'Poppins',
                                            fontWeight: 400,
                                          }}
                                        />
                                        {gradeValue && gradeValue > 0 && (
                                          <div className="flex items-center justify-center gap-1">
                                            <div
                                              className={`w-3 h-3 ${gradeStatus.bgColor} rounded-md`}
                                            />
                                            <div
                                              className={`text-xs font-medium ${gradeStatus.color}`}
                                              style={{
                                                fontFamily: 'Poppins',
                                                fontWeight: 400,
                                              }}
                                            >
                                              {gradeStatus.status}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                  )
                                })()}

                              {/* Average Column */}
                              <td className="p-3 whitespace-nowrap border-r border-gray-200">
                                <div className="text-center">
                                  {currentStatus ? (
                                    <div className="flex items-center justify-center gap-1">
                                      <div className="w-3 h-3 bg-gray-400 rounded-md" />
                                      <div
                                        className="text-xs font-medium text-gray-500 uppercase"
                                        style={{
                                          fontFamily: 'Poppins',
                                          fontWeight: 400,
                                        }}
                                      >
                                        {getStatusLabel(currentStatus)}
                                      </div>
                                    </div>
                                  ) : average !== null ? (
                                    <>
                                      <div
                                        className="text-sm font-medium text-gray-900"
                                        style={{
                                          fontFamily: 'Poppins',
                                          fontWeight: 400,
                                        }}
                                      >
                                        {average.toFixed(1)}
                                      </div>
                                      <div className="flex items-center justify-center gap-1 mt-1">
                                        <div
                                          className={`w-3 h-3 rounded-md ${getGradeStatus(
                                            average
                                          ).color.replace('text-', 'bg-')}`}
                                        />
                                        <div
                                          className={`text-xs font-medium ${
                                            getGradeStatus(average).color
                                          }`}
                                          style={{
                                            fontFamily: 'Poppins',
                                            fontWeight: 400,
                                          }}
                                        >
                                          {remarks}
                                        </div>
                                      </div>
                                    </>
                                  ) : (
                                    <div
                                      className="text-xs text-gray-500"
                                      style={{
                                        fontFamily: 'Poppins',
                                        fontWeight: 300,
                                      }}
                                    >
                                      No grades
                                    </div>
                                  )}
                                </div>
                              </td>

                              {/* Final Grade Column - Only for College */}
                              {docIsCollege && (
                                <td className="p-3 whitespace-nowrap border-r border-gray-200">
                                  <div className="text-center">
                                    {currentStatus ? (
                                      <div
                                        className="text-xs font-medium text-gray-500 uppercase"
                                        style={{
                                          fontFamily: 'Poppins',
                                          fontWeight: 400,
                                        }}
                                      >
                                        {getStatusLabel(currentStatus)}
                                      </div>
                                    ) : numericMode !== null ? (
                                      <div
                                        className="text-sm font-medium text-gray-900"
                                        style={{
                                          fontFamily: 'Poppins',
                                          fontWeight: 400,
                                        }}
                                      >
                                        {numericMode.toFixed(2)}
                                      </div>
                                    ) : (
                                      <div
                                        className="text-xs text-gray-500"
                                        style={{
                                          fontFamily: 'Poppins',
                                          fontWeight: 300,
                                        }}
                                      >
                                        N/A
                                      </div>
                                    )}
                                  </div>
                                </td>
                              )}

                              {/* Special Status Column */}
                              <td className="p-3 whitespace-nowrap">
                                {renderSpecialStatusButtons(
                                  ayCode,
                                  subject.subjectId,
                                  currentStatus
                                )}
                                {currentStatus && (
                                  <div
                                    className="text-xs text-gray-500 mt-1"
                                    style={{
                                      fontFamily: 'Poppins',
                                      fontWeight: 300,
                                    }}
                                  >
                                    {getStatusLabel(currentStatus)}
                                  </div>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              })()
            )}
          </div>
        )
      })}

      <p
        className="text-xs text-gray-500"
        style={{ fontFamily: 'Poppins', fontWeight: 300 }}
      >
        Changes are saved per academic year. Use the Edit button on the desired
        academic year to modify grades.
      </p>
    </div>
  )
}

export default RegistrarGradesTab
