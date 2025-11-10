import { SubjectData } from '@/lib/subject-database'

export interface SubjectGrade {
  subjectName?: string
  subjectCode?: string
  period1: number | null
  period2: number | null
  period3: number | null
  period4: number | null
  specialStatus?: 'INC' | 'FA' | 'FW' | 'W' | null
}

export interface FailedPrerequisite {
  subjectId: string
  subjectCode: string
  subjectName: string
  average: number | null
  status: string
  academicYear: string
  reason: string
}

type SpecialStatus = 'INC' | 'FA' | 'FW' | 'W' | null

/**
 * Calculate subject average based on level
 * College: average of period1, period2, period3
 * JHS: average of all 4 periods
 * SHS: average of 2 periods per semester (first-sem: Q1,Q2; second-sem: Q3,Q4)
 */
export const calculateSubjectAverage = (
  subjectGrade: SubjectGrade,
  isCollege: boolean = false,
  isSHS: boolean = false,
  semester?: 'first-sem' | 'second-sem'
): number | null => {
  // If there's a special status, don't calculate average
  if (subjectGrade.specialStatus) return null

  let validGrades: number[]

  if (isCollege) {
    // College: only use period1 (Prelim), period2 (Midterm), period3 (Finals)
    validGrades = [subjectGrade.period1, subjectGrade.period2, subjectGrade.period3].filter(
      (grade) => grade !== null && grade !== undefined
    ) as number[]
  } else if (isSHS) {
    // SHS: use all 4 periods (quarters) for average calculation
    // User requirement: get average across all periods, not per semester
    validGrades = [
      subjectGrade.period1,
      subjectGrade.period2,
      subjectGrade.period3,
      subjectGrade.period4,
    ].filter((grade) => grade !== null && grade !== undefined) as number[]
  } else {
    // JHS: use all 4 periods (quarters)
    validGrades = [
      subjectGrade.period1,
      subjectGrade.period2,
      subjectGrade.period3,
      subjectGrade.period4,
    ].filter((grade) => grade !== null && grade !== undefined) as number[]
  }

  if (validGrades.length === 0) return null

  const sum = validGrades.reduce((acc, grade) => acc + grade, 0)
  return Math.round((sum / validGrades.length) * 100) / 100
}

/**
 * Check if a subject is passed
 * Subject is passed if: average >= 75 AND no special status
 */
export const isSubjectPassed = (
  subjectGrade: SubjectGrade,
  isCollege: boolean = false,
  isSHS: boolean = false,
  semester?: 'first-sem' | 'second-sem'
): boolean => {
  // If there's a special status, subject is not passed
  if (subjectGrade.specialStatus) return false

  const average = calculateSubjectAverage(subjectGrade, isCollege, isSHS, semester)
  
  // If no average can be calculated, subject is not passed
  if (average === null) return false

  // Subject is passed if average >= 75
  return average >= 75
}

/**
 * Get the most recent academic year for a student
 */
export const getMostRecentAcademicYear = async (userId: string): Promise<string | null> => {
  try {
    const response = await fetch(
      `/api/students/${encodeURIComponent(userId)}/grades?listPeriods=true`
    )
    
    if (!response.ok) {
      console.error('Failed to fetch academic years:', response.status)
      return null
    }

    const data = await response.json()
    const periods = data.periods || []

    if (periods.length === 0) {
      return null
    }

    // Periods are already sorted newest first (from API)
    return periods[0]?.ayCode || null
  } catch (error) {
    console.error('Error fetching most recent academic year:', error)
    return null
  }
}

/**
 * Determine student level from enrollment info
 */
const determineStudentLevel = (enrollmentInfo: any): {
  isCollege: boolean
  isSHS: boolean
  semester?: 'first-sem' | 'second-sem'
} => {
  const level = enrollmentInfo?.level
  const department = enrollmentInfo?.department
  const semester = enrollmentInfo?.semester

  const isCollege = level === 'college'
  const isSHS = level === 'high-school' && department === 'SHS'

  return {
    isCollege,
    isSHS,
    semester: semester === 'first-sem' || semester === 'second-sem' ? semester : undefined,
  }
}

/**
 * Get status description for a failed prerequisite
 */
const getStatusDescription = (
  subjectGrade: SubjectGrade,
  average: number | null
): string => {
  if (subjectGrade.specialStatus) {
    switch (subjectGrade.specialStatus) {
      case 'INC':
        return 'Incomplete'
      case 'FA':
        return 'Failed (Absent)'
      case 'FW':
        return 'Failed (Withdrawn)'
      case 'W':
        return 'Withdrawn'
      default:
        return 'Special Status'
    }
  }

  if (average === null) {
    return 'No Grades'
  }

  if (average < 75) {
    return `Failed (${average.toFixed(1)})`
  }

  return 'Passed'
}

/**
 * Check prerequisites for subjects being enrolled
 * Returns list of failed prerequisites with details
 */
export const checkPrerequisites = async (
  userId: string,
  subjectIds: string[],
  subjects: Record<string, SubjectData>,
  enrollmentInfo: any
): Promise<FailedPrerequisite[]> => {
  const failedPrerequisites: FailedPrerequisite[] = []

  // Get most recent academic year
  const mostRecentAY = await getMostRecentAcademicYear(userId)
  
  if (!mostRecentAY) {
    // If student has no previous grades, check if any subjects have prerequisites
    // and mark them as failed (no previous enrollment)
    for (const subjectId of subjectIds) {
      const subject = subjects[subjectId]
      if (!subject || !subject.prerequisites || subject.prerequisites.length === 0) {
        continue
      }

      // Check each prerequisite
      for (const prereqId of subject.prerequisites) {
        const prereqSubject = subjects[prereqId]
        if (!prereqSubject) continue

        failedPrerequisites.push({
          subjectId: prereqId,
          subjectCode: prereqSubject.code || 'N/A',
          subjectName: prereqSubject.name || 'Unknown Subject',
          average: null,
          status: 'No Previous Grades',
          academicYear: 'N/A',
          reason: 'Student has no previous academic records',
        })
      }
    }
    return failedPrerequisites
  }

  // Fetch grades for most recent academic year
  try {
    const response = await fetch(
      `/api/students/${encodeURIComponent(userId)}/grades?ayCode=${encodeURIComponent(
        mostRecentAY
      )}&includeMetadata=true`
    )

    if (!response.ok) {
      console.error('Failed to fetch grades:', response.status)
      // Treat as failed prerequisites if we can't fetch grades
      return failedPrerequisites
    }

    const data = await response.json()
    const grades = data.grades || {}
    const metadata = data.metadata || {}

    // Determine student level
    const { isCollege, isSHS, semester } = determineStudentLevel(enrollmentInfo)

    // Check prerequisites for each subject being enrolled
    for (const subjectId of subjectIds) {
      const subject = subjects[subjectId]
      if (!subject || !subject.prerequisites || subject.prerequisites.length === 0) {
        continue
      }

      // Check each prerequisite
      for (const prereqId of subject.prerequisites) {
        const prereqSubject = subjects[prereqId]
        if (!prereqSubject) continue

        // Get grade for prerequisite subject
        const prereqGrade = grades[prereqId] as SubjectGrade | undefined

        if (!prereqGrade) {
          // Prerequisite not found in grades - treat as failed
          failedPrerequisites.push({
            subjectId: prereqId,
            subjectCode: prereqSubject.code || 'N/A',
            subjectName: prereqSubject.name || 'Unknown Subject',
            average: null,
            status: 'Not Found',
            academicYear: mostRecentAY,
            reason: 'Subject not found in student grades',
          })
          continue
        }

        // Check if prerequisite is passed
        const average = calculateSubjectAverage(prereqGrade, isCollege, isSHS, semester)
        const passed = isSubjectPassed(prereqGrade, isCollege, isSHS, semester)

        if (!passed) {
          failedPrerequisites.push({
            subjectId: prereqId,
            subjectCode: prereqSubject.code || 'N/A',
            subjectName: prereqSubject.name || 'Unknown Subject',
            average,
            status: getStatusDescription(prereqGrade, average),
            academicYear: mostRecentAY,
            reason: average === null
              ? 'No valid grades recorded'
              : average < 75
              ? `Average below passing grade (${average.toFixed(1)} < 75)`
              : prereqGrade.specialStatus
              ? `Special status: ${prereqGrade.specialStatus}`
              : 'Failed',
          })
        }
      }
    }
  } catch (error) {
    console.error('Error checking prerequisites:', error)
    // On error, return empty array (don't block enrollment)
  }

  return failedPrerequisites
}

