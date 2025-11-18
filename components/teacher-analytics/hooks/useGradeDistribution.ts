import { useMemo } from 'react'
import { GradeDistribution } from '../types'
import { useGradeData } from './useGradeData'
import { StudentWithGrades } from '../types'

interface UseGradeDistributionProps {
  studentsWithGrades: StudentWithGrades[]
}

export const useGradeDistribution = ({
  studentsWithGrades,
}: UseGradeDistributionProps) => {
  const { processedData } = useGradeData({ studentsWithGrades })

  const gradeDistribution = useMemo(() => {
    const ranges = [
      { range: '95-100', min: 95, max: 100 },
      { range: '90-94', min: 90, max: 94.99 },
      { range: '85-89', min: 85, max: 89.99 },
      { range: '80-84', min: 80, max: 84.99 },
      { range: '76-79', min: 76, max: 79.99 },
      { range: 'Below 76', min: 0, max: 75.99 },
    ]

    const rangeCounts = new Map<string, number>()
    let totalGrades = 0

    processedData.forEach(({ subjectAverages }) => {
      Object.values(subjectAverages).forEach((average) => {
        if (average !== null) {
          totalGrades++
          const matchingRange = ranges.find(
            (r) => average >= r.min && average <= r.max
          )
          if (matchingRange) {
            const currentCount = rangeCounts.get(matchingRange.range) || 0
            rangeCounts.set(matchingRange.range, currentCount + 1)
          }
        }
      })
    })

    const distribution: GradeDistribution[] = ranges.map((range) => {
      const count = rangeCounts.get(range.range) || 0
      const percentage = totalGrades > 0 ? (count / totalGrades) * 100 : 0

      return {
        range: range.range,
        min: range.min,
        max: range.max,
        count,
        percentage: Math.round(percentage * 100) / 100,
      }
    })

    return distribution.filter((d) => d.count > 0)
  }, [processedData])

  return { gradeDistribution }
}
