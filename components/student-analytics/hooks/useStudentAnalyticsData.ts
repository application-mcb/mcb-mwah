import { useMemo } from 'react'
import {
  EnrollmentData,
  StudentAnalyticsResult,
  StudentGrades,
  SubjectAverage,
  SubjectData,
  SubjectGrade,
} from '../types'

const PASSING_GRADE = 75

type Params = {
  grades: StudentGrades
  subjects: Record<string, SubjectData>
  enrollment: EnrollmentData | null
}

const deriveLevel = (
  enrollment: EnrollmentData | null
): StudentAnalyticsResult['level'] => {
  if (!enrollment?.enrollmentInfo?.level) return null
  if (enrollment.enrollmentInfo.level === 'college') return 'college'
  if (enrollment.enrollmentInfo.department === 'SHS') return 'senior'
  return 'junior'
}

const calculateAverage = (
  grade: SubjectGrade,
  {
    isCollege,
    isSHS,
    shsSemester,
  }: {
    isCollege: boolean
    isSHS: boolean
    shsSemester?: 'first-sem' | 'second-sem' | null
  }
): { average: number | null; completedPeriods: number } => {
  if (grade.specialStatus) {
    return { average: null, completedPeriods: 0 }
  }

  const values: number[] = []

  const pushValue = (value: number | null) => {
    if (typeof value === 'number') {
      values.push(value)
    }
  }

  if (isCollege) {
    pushValue(grade.period1)
    pushValue(grade.period2)
    pushValue(grade.period3)
  } else if (isSHS) {
    if (shsSemester === 'first-sem') {
      pushValue(grade.period1)
      pushValue(grade.period2)
    } else if (shsSemester === 'second-sem') {
      pushValue(grade.period3)
      pushValue(grade.period4)
    } else {
      pushValue(grade.period1)
      pushValue(grade.period2)
      pushValue(grade.period3)
      pushValue(grade.period4)
    }
  } else {
    pushValue(grade.period1)
    pushValue(grade.period2)
    pushValue(grade.period3)
    pushValue(grade.period4)
  }

  if (values.length === 0) {
    return { average: null, completedPeriods: 0 }
  }

  const average =
    values.reduce((sum, current) => sum + current, 0) / values.length

  return { average, completedPeriods: values.length }
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
  return 5.0
}

const TERM_CONFIG = {
  college: [
    { label: 'Prelim', key: 'period1' },
    { label: 'Midterm', key: 'period2' },
    { label: 'Finals', key: 'period3' },
  ],
  shsFirst: [
    { label: 'Quarter 1', key: 'period1' },
    { label: 'Quarter 2', key: 'period2' },
  ],
  shsSecond: [
    { label: 'Quarter 3', key: 'period3' },
    { label: 'Quarter 4', key: 'period4' },
  ],
  jhs: [
    { label: 'Quarter 1', key: 'period1' },
    { label: 'Quarter 2', key: 'period2' },
    { label: 'Quarter 3', key: 'period3' },
    { label: 'Quarter 4', key: 'period4' },
  ],
} as const

const normalizeSubjectName = (
  subjectId: string,
  grades: StudentGrades,
  subjects: Record<string, SubjectData>
) => {
  if (grades[subjectId]?.subjectName) return grades[subjectId].subjectName
  if (subjects[subjectId]?.name) return subjects[subjectId].name
  return 'Unknown Subject'
}

export const useStudentAnalyticsData = ({
  grades,
  subjects,
  enrollment,
}: Params): StudentAnalyticsResult => {
  return useMemo(() => {
    const level = deriveLevel(enrollment)
    const semester = enrollment?.enrollmentInfo?.semester || null
    const entries = Object.entries(grades)

    if (entries.length === 0) {
      return {
        level,
        semester,
        totalSubjects: 0,
        completedSubjects: 0,
        overallAverage: null,
        gwa: null,
        passCount: 0,
        failCount: 0,
        pendingCount: 0,
        subjectAverages: [],
        bestSubject: null,
        strugglingSubject: null,
        termAverages: [],
        gradeTrend: [],
        gpaHistory: [],
      }
    }

    const isCollege = level === 'college'
    const isSHS = level === 'senior'

    const subjectAverages: SubjectAverage[] = entries.map(
      ([subjectId, subjectGrade]) => {
        const normalizedGrade = {
          ...subjectGrade,
          subjectName: normalizeSubjectName(subjectId, grades, subjects),
        }

        const { average, completedPeriods } = calculateAverage(
          normalizedGrade,
          {
            isCollege,
            isSHS,
            shsSemester: semester,
          }
        )

        return {
          subjectId,
          subjectName: normalizedGrade.subjectName,
          average,
          completedPeriods,
          specialStatus: normalizedGrade.specialStatus || null,
        }
      }
    )

    const completedSubjects = subjectAverages.filter(
      (subject) => typeof subject.average === 'number'
    )

    const totalSubjects = subjectAverages.length
    const overallAverage =
      completedSubjects.length > 0
        ? completedSubjects.reduce((sum, subj) => sum + (subj.average || 0), 0) /
          completedSubjects.length
        : null

    const gwaValues =
      isCollege && completedSubjects.length > 0
        ? completedSubjects
            .map((subject) => convertToNumericMode(subject.average))
            .filter((value): value is number => typeof value === 'number')
        : []

    const gwa =
      gwaValues.length > 0
        ? gwaValues.reduce((sum, value) => sum + value, 0) / gwaValues.length
        : null

    let passCount = 0
    let failCount = 0
    let pendingCount = 0

    subjectAverages.forEach((subject) => {
      if (subject.specialStatus) {
        pendingCount += 1
        return
      }

      if (subject.average === null) {
        pendingCount += 1
        return
      }

      if (subject.average >= PASSING_GRADE) {
        passCount += 1
      } else {
        failCount += 1
      }
    })

    const completedSorted = [...completedSubjects].sort(
      (a, b) => (b.average || 0) - (a.average || 0)
    )

    const bestSubject = completedSorted[0] || null
    const strugglingSubject =
      completedSorted.length > 0
        ? completedSorted[completedSorted.length - 1]
        : null

    let termConfig = TERM_CONFIG.jhs

    if (isCollege) {
      termConfig = TERM_CONFIG.college
    } else if (isSHS && semester === 'first-sem') {
      termConfig = TERM_CONFIG.shsFirst
    } else if (isSHS && semester === 'second-sem') {
      termConfig = TERM_CONFIG.shsSecond
    }

    const gradeTrend = termConfig.map((term) => {
      const values: number[] = []
      entries.forEach(([, grade]) => {
        const value = grade[term.key as keyof SubjectGrade]
        if (typeof value === 'number') {
          values.push(value)
        }
      })

      return {
        label: term.label,
        value:
          values.length > 0
            ? values.reduce((sum, current) => sum + current, 0) / values.length
            : null,
      }
    })

    const gpaHistory =
      isCollege && gradeTrend.length > 0
        ? gradeTrend.map((term) => ({
            label: term.label,
            value: convertToNumericMode(term.value),
          }))
        : []

    return {
      level,
      semester,
      totalSubjects,
      completedSubjects: completedSubjects.length,
      overallAverage,
      gwa,
      passCount,
      failCount,
      pendingCount,
      subjectAverages,
      bestSubject,
      strugglingSubject,
      termAverages: gradeTrend,
      gradeTrend,
      gpaHistory,
    }
  }, [grades, subjects, enrollment])
}


