export type SpecialStatus = 'INC' | 'FA' | 'FW' | 'W' | null

export type SubjectGrade = {
  subjectName: string
  subjectCode?: string
  period1: number | null
  period2: number | null
  period3: number | null
  period4: number | null
  specialStatus?: SpecialStatus
}

export const METADATA_FIELDS = new Set([
  'studentName',
  'studentOfficialId',
  'studentSection',
  'studentLevel',
  'studentSemester',
  'createdAt',
  'updatedAt',
  'transfereeRecord',
  'recordSource',
  'recordNotes',
  'recordLevelType',
  'recordSemesterLabel',
  'ayDisplayLabel',
])

export const SPECIAL_STATUSES: Exclude<SpecialStatus, null>[] = [
  'INC',
  'FA',
  'FW',
  'W',
]

export const isValidSpecialStatus = (
  value: unknown
): value is Exclude<SpecialStatus, null> =>
  typeof value === 'string' &&
  SPECIAL_STATUSES.includes(value as Exclude<SpecialStatus, null>)

export const toNumberOrNull = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

export const calculateAverage = (
  grades: SubjectGrade,
  isCollege: boolean = false,
  isSHS: boolean = false
): number | null => {
  if (grades.specialStatus) return null

  let validGrades: number[]

  if (isCollege) {
    validGrades = [grades.period1, grades.period2, grades.period3].filter(
      (grade) => grade !== null && grade !== undefined
    ) as number[]
  } else {
    validGrades = [
      grades.period1,
      grades.period2,
      isSHS ? null : grades.period3,
      isSHS ? null : grades.period4,
    ]
      .filter((grade) => grade !== null && grade !== undefined)
      .map((grade) => grade as number)
  }

  if (validGrades.length === 0) return null

  const sum = validGrades.reduce((acc, grade) => acc + grade, 0)
  return Math.round((sum / validGrades.length) * 100) / 100
}

export const convertToNumericMode = (
  percentage: number | null
): number | null => {
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
  return 5.0
}

const NUMERIC_TO_PERCENTAGE_MAP: Record<string, number> = {
  '1': 98,
  '1.25': 95,
  '1.5': 92,
  '1.75': 89,
  '2': 86,
  '2.25': 83,
  '2.5': 80,
  '2.75': 77,
  '3': 75,
  '5': 70,
}

export const convertNumericToPercentage = (
  numeric: number | null
): number | null => {
  if (numeric === null || numeric === undefined) return null
  if (!Number.isFinite(numeric)) return null

  const normalized = Number(numeric.toFixed(2))

  if (normalized >= 1 && normalized <= 3) {
    const key = normalized.toString()
    if (NUMERIC_TO_PERCENTAGE_MAP[key]) {
      return NUMERIC_TO_PERCENTAGE_MAP[key]
    }
  }

  if (normalized === 5) {
    return NUMERIC_TO_PERCENTAGE_MAP['5']
  }

  return null
}

export const getDescriptiveMode = (percentage: number | null): string => {
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

export const getGradeStatus = (
  average: number
): { status: string; color: string } => {
  if (average === 0) return { status: 'No Grades', color: 'text-gray-800' }
  if (average >= 98) return { status: 'Excellent', color: 'text-green-800' }
  if (average >= 92) return { status: 'Superior', color: 'text-green-800' }
  if (average >= 86) return { status: 'Very Good', color: 'text-blue-900' }
  if (average >= 83) return { status: 'Good', color: 'text-yellow-800' }
  if (average >= 80) return { status: 'Fair', color: 'text-yellow-800' }
  if (average >= 75) return { status: 'Passed', color: 'text-orange-800' }
  return { status: 'Failed', color: 'text-red-800' }
}

export const getIndividualGradeStatus = (
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

export const getStatusLabel = (status: Exclude<SpecialStatus, null>) => {
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
