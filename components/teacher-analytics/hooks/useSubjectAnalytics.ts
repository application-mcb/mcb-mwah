import { useMemo } from 'react'
import { SubjectAnalytics } from '../types'
import { useGradeData } from './useGradeData'
import { StudentWithGrades, Subject } from '../types'

interface UseSubjectAnalyticsProps {
  studentsWithGrades: StudentWithGrades[]
  subjects: Record<string, Subject>
}

export const useSubjectAnalytics = ({
  studentsWithGrades,
  subjects,
}: UseSubjectAnalyticsProps) => {
  const { processedData } = useGradeData({ studentsWithGrades })

  const subjectAnalytics = useMemo(() => {
    const subjectMap = new Map<
      string,
      {
        subjectId: string
        grades: number[]
        studentIds: Set<string>
        sectionIds: Set<string>
      }
    >()

    processedData.forEach(({ enrollment, subjectAverages, section }) => {
      if (!section) return

      Object.entries(subjectAverages).forEach(([subjectId, average]) => {
        if (average !== null) {
          if (!subjectMap.has(subjectId)) {
            subjectMap.set(subjectId, {
              subjectId,
              grades: [],
              studentIds: new Set(),
              sectionIds: new Set(),
            })
          }

          const subjectData = subjectMap.get(subjectId)!
          subjectData.grades.push(average)
          subjectData.studentIds.add(enrollment.userId)
          subjectData.sectionIds.add(section.id)
        }
      })
    })

    const analytics: SubjectAnalytics[] = Array.from(subjectMap.entries())
      .map(([subjectId, data]) => {
        const subject = subjects[subjectId]
        if (!subject) return null

        const averageGrade =
          data.grades.length > 0
            ? Math.round(
                (data.grades.reduce((sum, grade) => sum + grade, 0) /
                  data.grades.length) *
                  100
              ) / 100
            : 0

        return {
          subjectId,
          subjectCode: subject.code,
          subjectName: subject.name,
          averageGrade,
          studentCount: data.studentIds.size,
          sectionCount: data.sectionIds.size,
        }
      })
      .filter((item): item is SubjectAnalytics => item !== null)
      .sort((a, b) => b.averageGrade - a.averageGrade)

    return analytics
  }, [processedData, subjects])

  return { subjectAnalytics }
}
