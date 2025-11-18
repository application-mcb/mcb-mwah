import { useMemo } from 'react'
import { StudentWithGrades, SubjectGrade, EnrollmentData } from '../types'

interface UseGradeDataProps {
  studentsWithGrades: StudentWithGrades[]
}

export const useGradeData = ({ studentsWithGrades }: UseGradeDataProps) => {
  const calculateAverage = (
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
    } else if (isSHS) {
      validGrades = [grades.period1, grades.period2].filter(
        (grade) => grade !== null && grade !== undefined
      ) as number[]
    } else {
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

  const processedData = useMemo(() => {
    return studentsWithGrades.map(({ enrollment, grades, section }) => {
      const isCollege = enrollment.enrollmentInfo?.level === 'college'
      const isSHS =
        enrollment.enrollmentInfo?.level === 'high-school' &&
        enrollment.enrollmentInfo?.department === 'SHS'

      const subjectAverages: Record<string, number | null> = {}
      Object.entries(grades).forEach(([subjectId, subjectGrade]) => {
        subjectAverages[subjectId] = calculateAverage(
          subjectGrade,
          isCollege,
          isSHS
        )
      })

      return {
        enrollment,
        grades,
        section,
        subjectAverages,
        isCollege,
        isSHS,
      }
    })
  }, [studentsWithGrades])

  return { processedData, calculateAverage }
}
