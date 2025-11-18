import { useMemo } from 'react'
import { QuarterComparison } from '../types'
import { StudentWithGrades } from '../types'

interface UseQuarterComparisonProps {
  studentsWithGrades: StudentWithGrades[]
}

export const useQuarterComparison = ({
  studentsWithGrades,
}: UseQuarterComparisonProps) => {
  const { jhsQuarterComparison, shsQuarterComparison, collegeQuarterComparison } = useMemo(() => {
    const jhsPeriodMap = new Map<string, { grades: number[]; studentIds: Set<string> }>()
    const shsPeriodMap = new Map<string, { grades: number[]; studentIds: Set<string> }>()
    const collegePeriodMap = new Map<string, { grades: number[]; studentIds: Set<string> }>()

    // Helper function to validate and add grade
    const addGrade = (gradeValue: any, periodKey: string, periodMap: Map<string, { grades: number[]; studentIds: Set<string> }>, studentId: string) => {
      // Check if grade is a valid number
      if (gradeValue === null || gradeValue === undefined) return
      const numGrade = typeof gradeValue === 'number' ? gradeValue : Number(gradeValue)
      if (isNaN(numGrade) || numGrade < 0 || numGrade > 100) return

      if (!periodMap.has(periodKey)) {
        periodMap.set(periodKey, { grades: [], studentIds: new Set() })
      }
      const data = periodMap.get(periodKey)!
      data.grades.push(numGrade)
      data.studentIds.add(studentId)
    }

    // Helper function to process comparison data
    const processComparison = (periodMap: Map<string, { grades: number[]; studentIds: Set<string> }>, order: string[]): QuarterComparison[] => {
      return Array.from(periodMap.entries())
        .map(([period, data]) => {
          // Filter out any invalid grades and calculate average
          const validGrades = data.grades.filter(
            (grade) =>
              typeof grade === 'number' &&
              !isNaN(grade) &&
              grade >= 0 &&
              grade <= 100
          )

          const averageGrade =
            validGrades.length > 0
              ? Math.round(
                  (validGrades.reduce((sum, grade) => sum + grade, 0) /
                    validGrades.length) *
                    100
                ) / 100
              : 0

          return {
            period,
            label: period,
            averageGrade: isNaN(averageGrade) ? 0 : averageGrade,
            studentCount: data.studentIds.size,
          }
        })
        .filter((item) => item.averageGrade > 0) // Only include periods with valid data
        .sort((a, b) => {
          const aIndex = order.indexOf(a.period)
          const bIndex = order.indexOf(b.period)
          // If not in order array, put at end
          if (aIndex === -1 && bIndex === -1) return 0
          if (aIndex === -1) return 1
          if (bIndex === -1) return -1
          return aIndex - bIndex
        })
    }

    studentsWithGrades.forEach(({ enrollment, grades, section }) => {
      if (!section) return

      const isCollege = enrollment.enrollmentInfo?.level === 'college'
      const isSHS =
        enrollment.enrollmentInfo?.level === 'high-school' &&
        enrollment.enrollmentInfo?.department === 'SHS'
      const isJHS =
        enrollment.enrollmentInfo?.level === 'high-school' &&
        enrollment.enrollmentInfo?.department !== 'SHS'
      const semester = enrollment.enrollmentInfo?.semester

      Object.values(grades).forEach((subjectGrade) => {
        if (!subjectGrade || typeof subjectGrade !== 'object') return
        if (subjectGrade.specialStatus) return

        if (isCollege) {
          // College: Prelim, Midterm, Finals
          addGrade(subjectGrade.period1, 'Prelim', collegePeriodMap, enrollment.userId)
          addGrade(subjectGrade.period2, 'Midterm', collegePeriodMap, enrollment.userId)
          addGrade(subjectGrade.period3, 'Finals', collegePeriodMap, enrollment.userId)
        } else if (isSHS) {
          // SHS: Q1, Q2 per semester (Q1/Q2 for first sem, Q3/Q4 for second sem)
          const period1Label = semester === 'first-sem' ? 'Q1' : 'Q3'
          const period2Label = semester === 'first-sem' ? 'Q2' : 'Q4'
          addGrade(subjectGrade.period1, period1Label, shsPeriodMap, enrollment.userId)
          addGrade(subjectGrade.period2, period2Label, shsPeriodMap, enrollment.userId)
        } else if (isJHS) {
          // JHS: Q1, Q2, Q3, Q4 (standard 4 quarters)
          addGrade(subjectGrade.period1, 'Q1', jhsPeriodMap, enrollment.userId)
          addGrade(subjectGrade.period2, 'Q2', jhsPeriodMap, enrollment.userId)
          addGrade(subjectGrade.period3, 'Q3', jhsPeriodMap, enrollment.userId)
          addGrade(subjectGrade.period4, 'Q4', jhsPeriodMap, enrollment.userId)
        }
      })
    })

    return {
      jhsQuarterComparison: processComparison(jhsPeriodMap, ['Q1', 'Q2', 'Q3', 'Q4']),
      shsQuarterComparison: processComparison(shsPeriodMap, ['Q1', 'Q2', 'Q3', 'Q4']),
      collegeQuarterComparison: processComparison(collegePeriodMap, ['Prelim', 'Midterm', 'Finals']),
    }
  }, [studentsWithGrades])

  return { jhsQuarterComparison, shsQuarterComparison, collegeQuarterComparison }
}
