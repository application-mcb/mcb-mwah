import { useMemo } from 'react'
import { SectionPerformance } from '../types'
import { useGradeData } from './useGradeData'
import { StudentWithGrades } from '../types'

interface UseSectionPerformanceProps {
  studentsWithGrades: StudentWithGrades[]
}

export const useSectionPerformance = ({
  studentsWithGrades,
}: UseSectionPerformanceProps) => {
  const { processedData } = useGradeData({ studentsWithGrades })

  const sectionPerformance = useMemo(() => {
    const sectionMap = new Map<
      string,
      {
        sectionId: string
        sectionName: string
        grades: number[]
        subjectIds: Set<string>
        studentIds: Set<string>
      }
    >()

    processedData.forEach(({ enrollment, subjectAverages, section }) => {
      if (!section) return

      const sectionId = section.id
      if (!sectionMap.has(sectionId)) {
        sectionMap.set(sectionId, {
          sectionId,
          sectionName: section.sectionName,
          grades: [],
          subjectIds: new Set(),
          studentIds: new Set(),
        })
      }

      const sectionData = sectionMap.get(sectionId)!
      sectionData.studentIds.add(enrollment.userId)

      Object.entries(subjectAverages).forEach(([subjectId, average]) => {
        if (average !== null) {
          sectionData.grades.push(average)
          sectionData.subjectIds.add(subjectId)
        }
      })
    })

    const performance: SectionPerformance[] = Array.from(sectionMap.values())
      .map((data) => {
        const averageGrade =
          data.grades.length > 0
            ? Math.round(
                (data.grades.reduce((sum, grade) => sum + grade, 0) /
                  data.grades.length) *
                  100
              ) / 100
            : 0

        return {
          sectionId: data.sectionId,
          sectionName: data.sectionName,
          averageGrade,
          studentCount: data.studentIds.size,
          subjectCount: data.subjectIds.size,
        }
      })
      .sort((a, b) => b.averageGrade - a.averageGrade)

    return performance
  }, [processedData])

  return { sectionPerformance }
}
