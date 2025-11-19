import { useMemo } from 'react'
import { StudentAnalyticsResult } from '../types'

export const useStudentChartData = (analytics: StudentAnalyticsResult) => {
  return useMemo(() => {
    const gradeTrendData = analytics.gradeTrend.map((point) => ({
      name: point.label,
      value: point.value,
    }))

    const completedSubjects = analytics.subjectAverages.filter(
      (subject) => typeof subject.average === 'number'
    )

    const subjectPerformanceData = [...completedSubjects]
      .sort((a, b) => (b.average || 0) - (a.average || 0))
      .slice(0, 5)
      .map((subject) => ({
        name: subject.subjectName,
        average: subject.average || 0,
      }))

    const subjectRiskData = [...completedSubjects]
      .sort((a, b) => (a.average || 0) - (b.average || 0))
      .slice(0, 5)
      .map((subject) => ({
        name: subject.subjectName,
        average: subject.average || 0,
      }))

    const passFailData = [
      { name: 'Passed', value: analytics.passCount },
      { name: 'Failed', value: analytics.failCount },
      { name: 'Pending', value: analytics.pendingCount },
    ].filter((item) => item.value > 0)

    const gwaHistoryData = analytics.gpaHistory.map((point) => ({
      name: point.label,
      value: point.value,
    }))

    return {
      gradeTrendData,
      subjectPerformanceData,
      subjectRiskData,
      passFailData,
      gwaHistoryData,
    }
  }, [analytics])
}


