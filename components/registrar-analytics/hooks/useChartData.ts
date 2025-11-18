import { useMemo } from 'react'
import type {
  AnalyticsData,
  ChartDataPoint,
  ChartDataPointWithFullName,
  PieChartDataPoint,
  RegularIrregularDataPoint,
} from '../types'

export const useChartData = (analytics: AnalyticsData) => {
  const gradeChartData = useMemo<ChartDataPoint[]>(() => {
    return Object.entries(analytics.studentsByGrade)
      .map(([grade, count]) => ({
        name: `Grade ${grade}`,
        students: count,
      }))
      .sort((a, b) => parseInt(a.name.split(' ')[1]) - parseInt(b.name.split(' ')[1]))
  }, [analytics.studentsByGrade])

  const strandChartData = useMemo<ChartDataPoint[]>(() => {
    return Object.entries(analytics.studentsByStrand).map(([strand, count]) => ({
      name: strand,
      students: count,
    }))
  }, [analytics.studentsByStrand])

  const courseChartData = useMemo<ChartDataPointWithFullName[]>(() => {
    return Object.entries(analytics.studentsByCourse).map(([course, count]) => ({
      name: course.length > 20 ? course.substring(0, 20) + '...' : course,
      fullName: course,
      students: count,
    }))
  }, [analytics.studentsByCourse])

  const genderChartData = useMemo<PieChartDataPoint[]>(() => {
    return Object.entries(analytics.genderDistribution).map(([gender, count]) => ({
      name: gender,
      value: count,
    }))
  }, [analytics.genderDistribution])

  const regularIrregularData = useMemo<RegularIrregularDataPoint[]>(() => {
    return [
      { name: 'Regular', value: analytics.regularVsIrregular.regular },
      { name: 'Irregular', value: analytics.regularVsIrregular.irregular },
    ]
  }, [analytics.regularVsIrregular])

  const ageGroupChartData = useMemo<ChartDataPoint[]>(() => {
    return Object.entries(analytics.birthdateRange.ageGroups).map(([ageGroup, count]) => ({
      name: ageGroup,
      students: count,
    }))
  }, [analytics.birthdateRange.ageGroups])

  const provinceChartData = useMemo<ChartDataPointWithFullName[]>(() => {
    return Object.entries(analytics.locationBreakdown.province)
      .sort((a, b) => b[1] - a[1])
      .map(([province, count]) => ({
        name: province.length > 20 ? province.substring(0, 20) + '...' : province,
        fullName: province,
        students: count,
      }))
  }, [analytics.locationBreakdown.province])

  const previousSchoolTypeChartData = useMemo<ChartDataPoint[]>(() => {
    return Object.entries(analytics.previousSchoolType).map(([schoolType, count]) => ({
      name: schoolType,
      students: count,
    }))
  }, [analytics.previousSchoolType])

  const previousSchoolChartData = useMemo<ChartDataPointWithFullName[]>(() => {
    return Object.entries(analytics.previousSchoolDistribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([schoolName, count]) => ({
        name: schoolName.length > 30 ? schoolName.substring(0, 30) + '...' : schoolName,
        fullName: schoolName,
        students: count,
      }))
  }, [analytics.previousSchoolDistribution])

  return {
    gradeChartData,
    strandChartData,
    courseChartData,
    genderChartData,
    regularIrregularData,
    ageGroupChartData,
    provinceChartData,
    previousSchoolTypeChartData,
    previousSchoolChartData,
  }
}

