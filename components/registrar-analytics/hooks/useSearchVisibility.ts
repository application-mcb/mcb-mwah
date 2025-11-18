import { useMemo } from 'react'
import type {
  AnalyticsData,
  ChartDataPoint,
  ChartDataPointWithFullName,
  PieChartDataPoint,
  RegularIrregularDataPoint,
} from '../types'

interface UseSearchVisibilityParams {
  searchQuery: string
  analytics: AnalyticsData
  gradeChartData: ChartDataPoint[]
  strandChartData: ChartDataPoint[]
  courseChartData: ChartDataPointWithFullName[]
  regularIrregularData: RegularIrregularDataPoint[]
  genderChartData: PieChartDataPoint[]
  ageGroupChartData: ChartDataPoint[]
  provinceChartData: ChartDataPointWithFullName[]
  previousSchoolTypeChartData: ChartDataPoint[]
  previousSchoolChartData: ChartDataPointWithFullName[]
}

export const useSearchVisibility = ({
  searchQuery,
  analytics,
  gradeChartData,
  strandChartData,
  courseChartData,
  regularIrregularData,
  genderChartData,
  ageGroupChartData,
  provinceChartData,
  previousSchoolTypeChartData,
  previousSchoolChartData,
}: UseSearchVisibilityParams) => {
  return useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase()
    const searchActive = normalizedSearch.length > 0
    const matchesSearch = (text: string) => {
      if (!normalizedSearch) return true
      return text.toLowerCase().includes(normalizedSearch)
    }

    const showJHSCard = matchesSearch('junior high school jhs grade 7 8 9 10')
    const showSHSCard = matchesSearch('senior high school shs strand grade 11 12')
    const showCollegeCard = matchesSearch('college department course year level')
    const showSummaryCards = showJHSCard || showSHSCard || showCollegeCard

    const showGradeChart =
      gradeChartData.length > 0 && matchesSearch('students by grade level distribution grade')
    const showStrandChart =
      strandChartData.length > 0 && matchesSearch('students by strand shs track distribution')
    const showCourseChart =
      courseChartData.length > 0 && matchesSearch('students by course college program year level')
    const showRegularIrregularChart =
      regularIrregularData.some((d) => d.value > 0) && matchesSearch('regular irregular student type')
    const showGenderChart =
      genderChartData.length > 0 && matchesSearch('gender distribution male female')
    const showReligionChart =
      Object.keys(analytics.religionDistribution).length > 0 &&
      matchesSearch('religion faith distribution')
    const showAgeChart =
      ageGroupChartData.length > 0 && matchesSearch('age distribution birthdate demographics')
    const showProvinceChart =
      provinceChartData.length > 0 && matchesSearch('province location distribution geography')
    const showMunicipalityChart =
      Object.keys(analytics.locationBreakdown.municipality).length > 0 &&
      matchesSearch('municipality town city location distribution geography')
    const showBarangayChart =
      Object.keys(analytics.locationBreakdown.barangay).length > 0 &&
      matchesSearch('barangay village location distribution geography')
    const showSchoolTypeChart =
      previousSchoolTypeChartData.length > 0 && matchesSearch('previous school type distribution')
    const showPreviousSchoolChart =
      previousSchoolChartData.length > 0 &&
      matchesSearch('previous school distribution feeder schools')

    const hasSearchMatches =
      showSummaryCards ||
      showGradeChart ||
      showStrandChart ||
      showCourseChart ||
      showRegularIrregularChart ||
      showGenderChart ||
      showReligionChart ||
      showAgeChart ||
      showProvinceChart ||
      showMunicipalityChart ||
      showBarangayChart ||
      showSchoolTypeChart ||
      showPreviousSchoolChart

    return {
      normalizedSearch,
      searchActive,
      showJHSCard,
      showSHSCard,
      showCollegeCard,
      showSummaryCards,
      showGradeChart,
      showStrandChart,
      showCourseChart,
      showRegularIrregularChart,
      showGenderChart,
      showReligionChart,
      showAgeChart,
      showProvinceChart,
      showMunicipalityChart,
      showBarangayChart,
      showSchoolTypeChart,
      showPreviousSchoolChart,
      hasSearchMatches,
    }
  }, [
    searchQuery,
    analytics,
    gradeChartData,
    strandChartData,
    courseChartData,
    regularIrregularData,
    genderChartData,
    ageGroupChartData,
    provinceChartData,
    previousSchoolTypeChartData,
    previousSchoolChartData,
  ])
}

