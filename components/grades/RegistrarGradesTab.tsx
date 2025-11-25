'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Print from '@/components/print'
import { toast } from 'react-toastify'
import { useAuth } from '@/lib/auth-context'
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
  PlusCircle,
} from '@phosphor-icons/react'
import TransfereeRecordModal from '@/components/grades/TransfereeRecordModal'
import { SCHOOL_NAME_FORMAL } from '@/lib/constants'
import {
  METADATA_FIELDS,
  SPECIAL_STATUSES,
  SpecialStatus,
  SubjectGrade,
  calculateAverage,
  convertToNumericMode,
  convertNumericToPercentage,
  getDescriptiveMode,
  getGradeStatus,
  getIndividualGradeStatus,
  getStatusLabel,
  isValidSpecialStatus,
  toNumberOrNull,
} from '@/lib/grades-utils'

type GradesDocument = Record<string, SubjectGrade | any>

type GradesPeriod = {
  id: string
  label: string
  ayCode: string
}

type RegistrarGradesTabProps = {
  studentId: string
  studentName?: string
  studentNumber?: string
}

type EditableGrade = SubjectGrade & {
  subjectId: string
  subjectCode?: string
  collegeAverage?: number | null
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

  normalized.collegeAverage = convertToNumericMode(
    typeof normalized.period1 === 'number' ? normalized.period1 : null
  )

  return normalized
}

const RegistrarGradesTab = ({
  studentId,
  studentName,
  studentNumber,
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
  const [showTransfereeModal, setShowTransfereeModal] = useState(false)
  const [showTranscriptPrint, setShowTranscriptPrint] = useState(false)
  const [studentProfileId, setStudentProfileId] = useState<string | null>(null)
  const [registrarName, setRegistrarName] = useState<string>('Registrar')
  const { user } = useAuth()
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

  const refetchAcademicYear = useCallback(
    async (ayCode: string) => {
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
    },
    [studentId]
  )

  const handleTransfereeRecordSaved = useCallback(
    async (newAyCode: string) => {
      await refetchAcademicYear(newAyCode)
      setPeriods((prev) => {
        if (prev.some((period) => period.ayCode === newAyCode)) {
          return prev
        }
        const updated = [
          ...prev,
          { id: newAyCode, label: newAyCode, ayCode: newAyCode },
        ]
        updated.sort((a, b) => (a.id < b.id ? 1 : -1))
        return updated
      })
      setSelectedAy(newAyCode)
      setShowTransfereeModal(false)
    },
    [refetchAcademicYear]
  )

  useEffect(() => {
    const loadStudentProfile = async () => {
      try {
        const response = await fetch(`/api/user/profile?uids=${studentId}`)
        const data = await response.json()
        if (
          response.ok &&
          data.success &&
          data.users &&
          data.users.length > 0
        ) {
          const user = data.users[0]
          if (user && user.studentId) {
            setStudentProfileId(user.studentId)
          }
        }
      } catch (error) {
        console.error('Failed to load student profile:', error)
      }
    }
    void loadStudentProfile()
  }, [studentId])

  useEffect(() => {
    const loadRegistrarName = async () => {
      if (!user) {
        return
      }

      try {
        const response = await fetch('/api/registrar/check-role', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uid: user.uid,
            email: user.email,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          if (data.registrar) {
            const fullName = `${data.registrar.firstName || ''} ${
              data.registrar.lastName || ''
            }`.trim()
            if (fullName) {
              setRegistrarName(fullName)
            }
          }
        }
      } catch (err) {
        console.error('Error loading registrar name:', err)
      }
    }
    void loadRegistrarName()
  }, [user])

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
    period: keyof SubjectGrade | 'collegeAverage',
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

      if (period === 'collegeAverage' && isCollegeDoc(ayCode)) {
        const numericGrade =
          parsedValue === null || Number.isNaN(parsedValue) ? null : parsedValue
        const percentValue = convertNumericToPercentage(numericGrade)

        currentSubject.period1 = percentValue
        currentSubject.period2 = percentValue
        currentSubject.period3 = percentValue
        currentSubject.collegeAverage = numericGrade
      } else {
        currentSubject[period as keyof SubjectGrade] = Number.isNaN(parsedValue)
          ? null
          : parsedValue
      }
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

  const formatSemesterLabel = (semester?: string | null): string | null => {
    if (!semester) return null
    if (semester === 'first-sem') return 'First Semester'
    if (semester === 'second-sem') return 'Second Semester'
    return semester
  }

  const extractAyCode = (documentId: string): string => {
    // Extract AY code from document ID (e.g., "AY2526" from "AY2526_first_semester_BSIT_2")
    const match = documentId.match(/^(AY\d{4})/)
    return match ? match[1] : documentId
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

  const transcriptSections = useMemo(() => {
    return sortedPeriods.map((period) => {
      const ayCode = period.ayCode
      const metadata = metadataByAy[ayCode] || {}
      const source =
        editingAy === ayCode ? editedGrades[ayCode] : gradesByAy[ayCode]
      const docIsCollege = isCollegeDoc(ayCode)
      const docIsSHS = isSHSDoc(ayCode)

      const rows: {
        subjectId: string
        code: string
        name: string
        average: string
        remarks: string
      }[] = []

      if (source) {
        Object.entries(source).forEach(([subjectId, value]) => {
          if (METADATA_FIELDS.has(subjectId)) {
            return
          }

          const normalized = normalizeSubjectEntry(
            subjectId,
            value,
            subjectInfoById[subjectId]
          )

          if (!normalized) {
            return
          }

          const average = calculateAverage(normalized, docIsCollege, docIsSHS)
          const currentStatus = (normalized.specialStatus ??
            null) as SpecialStatus
          const remarks = currentStatus
            ? getStatusLabel(currentStatus as Exclude<SpecialStatus, null>)
            : average !== null
            ? getDescriptiveMode(average)
            : ''

          const numericAverage =
            docIsCollege && average !== null
              ? convertToNumericMode(average)
              : null

          const formattedAverage =
            average !== null
              ? docIsCollege
                ? numericAverage !== null
                  ? numericAverage.toFixed(2)
                  : average.toFixed(2)
                : `${average.toFixed(2)}%`
              : ''

          rows.push({
            subjectId,
            code:
              normalized.subjectCode && normalized.subjectCode.trim() !== ''
                ? normalized.subjectCode
                : subjectInfoById[subjectId]?.code || '—',
            name: normalized.subjectName || 'Unknown Subject',
            average: formattedAverage,
            remarks,
          })
        })
      }

      return {
        ayCode,
        label:
          (metadata?.ayDisplayLabel as string | undefined) ||
          (metadata?.studentLevel as string | undefined) ||
          ayCode,
        semester: (metadata?.studentSemester as string | undefined) || '',
        section: (metadata?.studentSection as string | undefined) || '',
        rows,
      }
    })
  }, [
    sortedPeriods,
    metadataByAy,
    editingAy,
    editedGrades,
    gradesByAy,
    subjectInfoById,
  ])

  const transcriptHasData = useMemo(
    () => transcriptSections.some((section) => section.rows.length > 0),
    [transcriptSections]
  )

  const populatedTranscriptSections = useMemo(() => {
    const filtered = transcriptSections.filter(
      (section) => section.rows.length > 0
    )

    return filtered.sort((a, b) => {
      // Extract year level from label (e.g., "BSIT 1" -> 1, "BSIT 2" -> 2, "Grade 7" -> 7)
      const extractYearLevel = (label: string): number => {
        // Try to find a number after common prefixes
        const patterns = [
          /(?:BSIT|BS|BSCS|BSBA|BSED|BSE|BSN|BSA)\s+(\d+)/i, // College: "BSIT 1" -> 1
          /Grade\s+(\d+)/i, // High school: "Grade 7" -> 7
          /(\d+)/, // Fallback: any number
        ]

        for (const pattern of patterns) {
          const match = label.match(pattern)
          if (match && match[1]) {
            return parseInt(match[1], 10)
          }
        }
        return 0
      }

      const yearLevelA = extractYearLevel(a.label)
      const yearLevelB = extractYearLevel(b.label)

      // First sort by year level
      if (yearLevelA !== yearLevelB) {
        return yearLevelA - yearLevelB
      }

      // Then sort by semester (first-sem before second-sem)
      const semesterOrder = (sem: string): number => {
        if (sem === 'first-sem') return 1
        if (sem === 'second-sem') return 2
        return 0
      }

      return semesterOrder(a.semester) - semesterOrder(b.semester)
    })
  }, [transcriptSections])

  const metadataStudentId = useMemo(() => {
    for (const meta of Object.values(metadataByAy)) {
      if (
        meta &&
        typeof meta.studentOfficialId === 'string' &&
        meta.studentOfficialId.trim() !== ''
      ) {
        return meta.studentOfficialId.trim()
      }
      if (
        meta &&
        typeof meta.studentId === 'string' &&
        meta.studentId.trim() !== ''
      ) {
        return meta.studentId.trim()
      }
    }
    return null
  }, [metadataByAy])

  const displayStudentId = useMemo(() => {
    if (studentProfileId && studentProfileId.trim() !== '') {
      return studentProfileId.trim()
    }
    if (studentNumber && studentNumber.trim() !== '') {
      return studentNumber.trim()
    }
    if (metadataStudentId) {
      return metadataStudentId
    }
    return studentId
  }, [studentProfileId, studentNumber, metadataStudentId, studentId])

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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p
            className="text-xs text-gray-600"
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            Need to encode a transferee&apos;s historical record? Create a
            custom academic year document.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTranscriptPrint(true)}
            disabled={!transcriptHasData}
            className={`rounded-md border-blue-900 text-blue-900 hover:bg-blue-50 ${
              !transcriptHasData ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            <div
              className="flex items-center gap-2"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              <FileText size={16} weight="bold" />
              <span>Print Transcript</span>
            </div>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTransfereeModal(true)}
            className="border-blue-900 text-blue-900 hover:bg-blue-50 rounded-md"
          >
            <div
              className="flex items-center gap-2"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              <PlusCircle size={16} weight="bold" />
              <span>Add Custom Record</span>
            </div>
          </Button>
        </div>
      </div>
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
            const pillSubLabel = `${
              meta.studentSemester === 'first-sem'
                ? 'First Semester'
                : 'Second Semester'
            } `

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

                const gradeColumns = docIsCollege
                  ? [
                      {
                        key: 'collegeAverage' as const,
                        label: 'Average',
                      },
                    ]
                  : docIsSHS
                  ? shsSemester === 'second-sem'
                    ? [
                        { key: 'period1' as const, label: 'Q3' },
                        { key: 'period2' as const, label: 'Q4' },
                      ]
                    : [
                        { key: 'period1' as const, label: 'Q1' },
                        { key: 'period2' as const, label: 'Q2' },
                      ]
                  : [
                      { key: 'period1' as const, label: 'Q1' },
                      { key: 'period2' as const, label: 'Q2' },
                      { key: 'period3' as const, label: 'Q3' },
                      { key: 'period4' as const, label: 'Q4' },
                    ]

                return (
                  <div className="">
                    <table className="w-full rounded-lg overflow-hidden table-fixed">
                      <colgroup>
                        <col className="w-[32%]" />
                        {gradeColumns.map((_, index) => (
                          <col key={`grade-col-${index}`} className="w-[12%]" />
                        ))}
                        <col className="w-[12%]" />
                        {docIsCollege && <col className="w-[10%]" />}
                        <col className="w-[12%]" />
                      </colgroup>
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
                          {gradeColumns.map((column) => (
                            <th
                              key={column.key}
                              className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-blue-900"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 bg-blue-900 flex items-center justify-center rounded-md">
                                  <div className="w-5 h-5 bg-white text-blue-900 flex items-center justify-center aspect-square rounded-md">
                                    <Calculator size={12} weight="bold" />
                                  </div>
                                </div>
                                {column.label}
                              </div>
                            </th>
                          ))}
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
                                  <div className="min-w-0">
                                    <div
                                      className="text-sm font-medium text-gray-900 truncate"
                                      style={{
                                        fontFamily: 'Poppins',
                                        fontWeight: 400,
                                        maxWidth: '30ch',
                                      }}
                                      title={
                                        subjectInfoById[subject.subjectId]
                                          ?.name ||
                                        subject.subjectName ||
                                        'Unknown Subject'
                                      }
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
                                ? gradeColumns.map((column) => column.key)
                                : gradeColumns.map((column) => column.key)
                              ).map((periodKey) => {
                                const gradeValue = docIsCollege
                                  ? (currentData?.period1 as number | null)
                                  : (currentData?.[
                                      periodKey as keyof SubjectGrade
                                    ] as number | null) ?? null
                                const collegeNumericValue = docIsCollege
                                  ? convertToNumericMode(
                                      typeof currentData?.period1 === 'number'
                                        ? currentData?.period1
                                        : null
                                    )
                                  : null
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
                                        min={docIsCollege ? 1 : 0}
                                        max={docIsCollege ? 5 : 100}
                                        step={docIsCollege ? 0.25 : 0.1}
                                        value={
                                          docIsCollege
                                            ? ((collegeNumericValue ?? '') as
                                                | number
                                                | '')
                                            : ((currentData?.[
                                                periodKey as keyof SubjectGrade
                                              ] ?? '') as number | '')
                                        }
                                        disabled={!isEditing}
                                        onChange={(event) =>
                                          handleGradeChange(
                                            ayCode,
                                            subject.subjectId,
                                            docIsCollege
                                              ? 'collegeAverage'
                                              : (periodKey as keyof SubjectGrade),
                                            event.target.value
                                          )
                                        }
                                        className={`w-full px-2 py-1 text-xs border ${
                                          isEditing
                                            ? 'border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500'
                                            : 'border-transparent bg-gray-100 cursor-not-allowed'
                                        }`}
                                        placeholder={
                                          docIsCollege
                                            ? 'Average (1.0–5.0)'
                                            : '0-100'
                                        }
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

      <TransfereeRecordModal
        isOpen={showTransfereeModal}
        onClose={() => setShowTransfereeModal(false)}
        studentId={studentId}
        studentName={studentName}
        existingAyCodes={periods.map((period) => period.ayCode)}
        onSuccess={handleTransfereeRecordSaved}
      />
      {showTranscriptPrint && (
        <Print
          onClose={() => setShowTranscriptPrint(false)}
          title={`Transcript - ${studentName || displayStudentId}`}
        >
          <div className="print-document space-y-6">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="print-header border-b border-gray-200 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img
                      src="/logo.png"
                      alt="Marian College Logo"
                      className="w-16 h-16 object-contain"
                    />
                    <div>
                      <h1
                        className="text-xl text-gray-900"
                        style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                      >
                        {SCHOOL_NAME_FORMAL}
                      </h1>
                      <p
                        className="text-xs text-gray-600"
                        style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                      >
                        908 Gil Carlos St. San Jose, Baliwag, Bulacan
                      </p>
                      <p
                        className="text-xs text-gray-600"
                        style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                      >
                        Registrar&apos;s Office
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className="text-sm text-gray-900"
                      style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                    >
                      Student Transcript
                    </p>
                    <p
                      className="text-xs text-gray-600"
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      Generated:{' '}
                      {new Date().toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <table className="mt-4 w-full table-fixed border border-gray-200">
                <tbody>
                  <tr className="text-sm text-gray-900">
                    <td className="w-1/2 border-r border-gray-200 px-4 py-3 font-semibold">
                      {studentName || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-right">{displayStudentId}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {transcriptHasData ? (
              populatedTranscriptSections.map((section) => {
                const semesterLabel = formatSemesterLabel(section.semester)
                const levelText = section.label || 'Unknown Level'
                const ayCodeOnly = extractAyCode(section.ayCode)
                const headerText = semesterLabel
                  ? `${levelText} ${semesterLabel}`
                  : levelText
                return (
                  <div
                    key={section.ayCode}
                    className="print-section rounded-lg border border-gray-200 bg-white p-5"
                  >
                    <div className="mb-4">
                      <p
                        className="text-base font-semibold text-gray-900"
                        style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                      >
                        {headerText}
                      </p>
                      <p
                        className="text-sm text-gray-600 mt-1"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        {ayCodeOnly}
                      </p>
                    </div>
                    <div className="overflow-hidden rounded-lg border border-gray-200">
                      <table className="min-w-full table-fixed text-sm">
                        <thead className="bg-gray-50 text-left text-[13px] font-semibold text-gray-600">
                          <tr>
                            <th className="border-b border-gray-200 px-4 py-2">
                              Code
                            </th>
                            <th className="border-b border-gray-200 px-4 py-2">
                              Subject Name
                            </th>
                            <th className="border-b border-gray-200 px-4 py-2 text-center">
                              Average
                            </th>
                            <th className="border-b border-gray-200 px-4 py-2">
                              Remarks
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {section.rows.map((row) => (
                            <tr key={`${section.ayCode}-${row.subjectId}`}>
                              <td className="px-4 py-2 align-top font-semibold text-gray-800">
                                {row.code}
                              </td>
                              <td className="px-4 py-2 align-top text-gray-800">
                                {row.name}
                              </td>
                              <td className="px-4 py-2 text-center align-top text-gray-900">
                                {row.average}
                              </td>
                              <td className="px-4 py-2 align-top text-gray-800">
                                {row.remarks}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="print-section">
                <p
                  className="text-sm text-gray-600"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  No transcript data available for this student.
                </p>
              </div>
            )}

            <div className="print-section mt-8">
              <div className="flex justify-between items-start pt-4">
                <div>
                  <p
                    className="text-xs text-gray-600"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Generated on{' '}
                    {new Date().toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div className="text-right w-48">
                  <div className="border-t border-black mb-2"></div>
                  <p
                    className="text-xs text-gray-900 font-medium"
                    style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                  >
                    {registrarName}
                  </p>
                  <p
                    className="text-xs text-gray-600"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Marian College of Baliuag
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Print>
      )}
    </div>
  )
}

export default RegistrarGradesTab
