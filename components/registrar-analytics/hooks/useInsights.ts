import { useMemo } from 'react'
import type { AnalyticsData, InsightsContent } from '../types'

interface StudentsByDepartment {
  jhs: number
  shs: number
  college: number
}

export const useInsights = (
  analytics: AnalyticsData,
  totalStudents: number,
  studentsByDepartment: StudentsByDepartment
): InsightsContent => {
  return useMemo(() => {
    const gradeEntries = Object.entries(analytics.studentsByGrade).map(
      ([grade, count]) => ({ grade: parseInt(grade), count })
    )
    const maxGrade = gradeEntries.reduce(
      (max, curr) => (curr.count > max.count ? curr : max),
      { grade: 0, count: 0 }
    )
    const minGrade = gradeEntries.reduce(
      (min, curr) => (curr.count < min.count ? curr : min),
      { grade: 0, count: Infinity }
    )
    const totalRegular = analytics.regularVsIrregular.regular
    const totalIrregular = analytics.regularVsIrregular.irregular
    const irregularPercentage =
      totalStudents > 0 ? ((totalIrregular / totalStudents) * 100).toFixed(1) : '0'
    const topProvince = Object.entries(analytics.locationBreakdown.province).sort((a, b) => b[1] - a[1])[0]
    const genderEntries = Object.entries(analytics.genderDistribution)
    const topGender = genderEntries.sort((a, b) => b[1] - a[1])[0]
    const avgGradeEnrollment =
      gradeEntries.length > 0 ? gradeEntries.reduce((sum, g) => sum + g.count, 0) / gradeEntries.length : 0

    const gradeLevelInsight =
      gradeEntries.length > 0
        ? `Grade ${maxGrade.grade} leads enrollment with ${maxGrade.count} students. Distribution shows ${maxGrade.count > minGrade.count ? 'stronger' : 'balanced'} retention in upper grades. Strategic resource allocation should prioritize high-enrollment levels to maintain quality.`
        : 'Grade level analysis requires comprehensive data across all academic levels. Please ensure all grade level enrollment data is properly recorded for accurate analysis.'

    const gradeLevelForecast =
      gradeEntries.length > 0
        ? `Projected ${Math.round(avgGradeEnrollment * 0.1)} to ${Math.round(avgGradeEnrollment * 0.15)} student increase next year. Upper grades will continue strong enrollment. Lower grades may need targeted recruitment efforts.`
        : 'Enrollment forecasting requires historical grade level data and trend analysis to identify patterns and recommend strategic recruitment interventions.'

    const strandEntries = Object.entries(analytics.studentsByStrand)
    const topStrand = strandEntries.sort((a, b) => b[1] - a[1])[0]
    const strandInsight =
      strandEntries.length > 0
        ? `${topStrand?.[0] || 'Various'} strand leads with ${topStrand?.[1] || 0} students. Distribution across ${strandEntries.length} strands reflects career interests and market demands. Academic counseling should align with preferences to support student success.`
        : 'Strand analysis requires comprehensive data across all academic tracks. Please ensure all strand enrollment data is properly recorded for accurate analysis.'

    const strandForecast =
      strandEntries.length > 0
        ? `${topStrand?.[0] || 'Leading strands'} will maintain strong enrollment. Market-driven programs expected to see ${Math.round((topStrand?.[1] || 0) * 0.1)} additional students. Strategic partnerships will attract more students.`
        : 'Strand forecasting requires historical data and trend analysis to identify enrollment patterns and recommend strategic interventions across all strands.'

    const courseEntries = Object.entries(analytics.studentsByCourse)
    const topCourse = courseEntries.sort((a, b) => b[1] - a[1])[0]
    const courseInsight =
      courseEntries.length > 0
        ? `${topCourse?.[0] || 'Various'} course leads with ${topCourse?.[1] || 0} students among ${courseEntries.length} active programs. Reflects strong demand for professional programs. Faculty allocation should prioritize high-enrollment courses to maintain quality.`
        : 'Course analysis requires comprehensive data across all academic programs. Please ensure all course enrollment data is properly recorded for accurate analysis.'

    const courseForecast =
      courseEntries.length > 0
        ? `${topCourse?.[0] || 'Leading courses'} will continue strong enrollment. Technical programs expected ${Math.round((topCourse?.[1] || 0) * 0.12)} additional students. Industry partnerships will attract more applicants.`
        : 'Course forecasting requires historical data and trend analysis to identify enrollment patterns and recommend strategic interventions across all courses.'

    const regularIrregularInsight =
      totalStudents > 0
        ? `${totalRegular} regular (${(100 - parseFloat(irregularPercentage)).toFixed(1)}%) and ${totalIrregular} irregular (${irregularPercentage}%) students. ${parseFloat(irregularPercentage) < 10 ? 'Low' : parseFloat(irregularPercentage) < 25 ? 'Moderate' : 'High'} irregular ratio ${parseFloat(irregularPercentage) < 10 ? 'indicates strong progression' : 'requires support systems'}. Academic advisors should monitor closely.`
        : 'Student classification analysis requires comprehensive data on regular and irregular status. Please ensure all classification data is properly recorded for accurate analysis.'

    const regularIrregularForecast =
      totalStudents > 0
        ? `Irregular ratio projected to ${parseFloat(irregularPercentage) < 15 ? 'remain stable' : 'slightly decrease'} with improved support. Anticipate ${Math.round(totalIrregular * 0.95)} to ${Math.round(totalIrregular * 1.05)} irregular students next year. Enhanced guidance will help reduce cases.`
        : 'Student classification forecasting requires historical data on regular and irregular patterns to identify trends and recommend strategic interventions.'

    const genderInsight =
      genderEntries.length > 0
        ? `${topGender?.[0] || 'Various'} represents ${(((topGender?.[1] || 0) / totalStudents) * 100).toFixed(1)}% of enrollment. ${Math.abs((topGender?.[1] || 0) - totalStudents / genderEntries.length) < totalStudents * 0.1 ? 'Balanced' : 'Varied'} distribution ${Math.abs((topGender?.[1] || 0) - totalStudents / genderEntries.length) < totalStudents * 0.1 ? 'reflects equitable access' : 'needs targeted recruitment'}. ${genderEntries.length} gender categories represented.`
        : 'Gender analysis requires comprehensive data across all gender categories. Please ensure all gender data is properly recorded for accurate analysis.'

    const genderForecast =
      genderEntries.length > 0
        ? `Gender distribution expected to remain ${Math.abs((topGender?.[1] || 0) - totalStudents / genderEntries.length) < totalStudents * 0.1 ? 'stable' : 'consistent'} next year. Projected growth of ${Math.round(totalStudents * 0.1)} students should maintain similar ratios. Recruitment will target equitable participation.`
        : 'Gender forecasting requires historical data and trend analysis to identify patterns and recommend strategic interventions for gender balance.'

    const religionEntries = Object.entries(analytics.religionDistribution).sort((a, b) => b[1] - a[1])
    const topReligion = religionEntries[0]
    const religionInsight =
      religionEntries.length > 0
        ? `${religionEntries.length} faith backgrounds represented. ${topReligion?.[0] || 'Various'} leads with ${topReligion?.[1] || 0} students (${(((topReligion?.[1] || 0) / totalStudents) * 100).toFixed(1)}%). Diversity ${religionEntries.length > 3 ? 'enriches' : 'reflects'} campus community. Policies should respect all backgrounds.`
        : 'Religious diversity analysis requires comprehensive data across all faith backgrounds. Please ensure all religious affiliation data is properly recorded for accurate analysis.'

    const religionForecast =
      religionEntries.length > 0
        ? `Religious diversity projected to remain consistent. As enrollment grows ${Math.round(totalStudents * 0.1)} students, representation should maintain similar proportions. ${topReligion?.[0] || 'Major groups'} will continue as largest segments. Interfaith dialogue supports inclusive environment.`
        : 'Religious diversity forecasting requires historical data and trend analysis to identify patterns and recommend strategic interventions for inclusion.'

    const ageInsight =
      analytics.birthdateRange.min && analytics.birthdateRange.max
        ? `Students range from ${new Date(analytics.birthdateRange.min).getFullYear()} to ${new Date(analytics.birthdateRange.max).getFullYear()} birth years. ${Object.entries(analytics.birthdateRange.ageGroups).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Various'} age group represents largest segment. Distribution reflects typical enrollment patterns.`
        : 'Age distribution analysis requires comprehensive birthdate data. Please ensure all birthdate data is properly recorded for accurate analysis.'

    const ageForecast =
      analytics.birthdateRange.min && analytics.birthdateRange.max
        ? `Age distribution expected to remain consistent. Projected growth of ${Math.round(totalStudents * 0.1)} students will follow similar patterns. ${Object.entries(analytics.birthdateRange.ageGroups).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Primary'} age groups will continue as majority.`
        : 'Age forecasting requires historical birthdate data and trend analysis to identify patterns and recommend strategic interventions for different age groups.'

    const provinceEntries = Object.entries(analytics.locationBreakdown.province).sort((a, b) => b[1] - a[1])
    const topProvinceData = provinceEntries[0]
    const provinceInsight =
      provinceEntries.length > 0
        ? `${provinceEntries.length} provinces represented. ${topProvinceData?.[0] || 'Various'} leads with ${topProvinceData?.[1] || 0} students (${(((topProvinceData?.[1] || 0) / totalStudents) * 100).toFixed(1)}%). ${topProvinceData && topProvinceData[1] > totalStudents * 0.4 ? 'Strong local enrollment' : 'Regional diversity'} demonstrates ${provinceEntries.length > 5 ? 'broad' : 'institutional'} reach.`
        : 'Geographic distribution analysis requires comprehensive province data. Please ensure all province data is properly recorded for accurate analysis.'

    const provinceForecast =
      provinceEntries.length > 0
        ? `Geographic patterns projected to remain stable. ${topProvinceData?.[0] || 'Primary regions'} will continue as largest segments. Growth of ${Math.round(totalStudents * 0.1)} students maintains similar ratios. Strategic partnerships support continued growth.`
        : 'Geographic forecasting requires historical province data and trend analysis to identify regional patterns and recommend strategic interventions.'

    const municipalityEntries = Object.entries(analytics.locationBreakdown.municipality).sort(
      (a, b) => b[1] - a[1]
    )
    const topMunicipality = municipalityEntries[0]
    const municipalityInsight =
      municipalityEntries.length > 0
        ? `${municipalityEntries.length} municipalities represented. ${topMunicipality?.[0] || 'Various'} leads with ${topMunicipality?.[1] || 0} students. ${municipalityEntries.length > 10 ? 'Wide' : 'Varied'} distribution ${topMunicipality && topMunicipality[1] > totalStudents * 0.2 ? 'indicates strong local engagement' : 'demonstrates regional reach'}.`
        : 'Municipal distribution analysis requires comprehensive data across all municipalities. Please ensure all municipality data is properly recorded for accurate analysis.'

    const municipalityForecast =
      municipalityEntries.length > 0
        ? `Municipal patterns expected to remain consistent. ${topMunicipality?.[0] || 'Leading municipalities'} will continue significant contributions. Growth of ${Math.round(totalStudents * 0.1)} students maintains proportions. Targeted outreach supports diversity.`
        : 'Municipal forecasting requires historical data and trend analysis to identify patterns and recommend strategic interventions across all municipalities.'

    const barangayEntries = Object.entries(analytics.locationBreakdown.barangay).sort((a, b) => b[1] - a[1])
    const topBarangay = barangayEntries[0]
    const barangayInsight =
      barangayEntries.length > 0
        ? `${barangayEntries.length} barangays represented. ${topBarangay?.[0] || 'Various'} leads with ${topBarangay?.[1] || 0} students. ${barangayEntries.length > 20 ? 'Extensive' : 'Varied'} distribution demonstrates deep community penetration. Data helps identify high-enrollment communities.`
        : 'Barangay distribution analysis requires comprehensive data across all barangays. Please ensure all barangay data is properly recorded for accurate analysis.'

    const barangayForecast =
      barangayEntries.length > 0
        ? `Barangay patterns projected to remain stable. ${topBarangay?.[0] || 'Leading barangays'} will continue strong enrollment. Growth of ${Math.round(totalStudents * 0.1)} students maintains similar patterns. Community-based recruitment supports diversity.`
        : 'Barangay forecasting requires historical data and trend analysis to identify community patterns and recommend strategic interventions across all barangays.'

    const schoolTypeEntries = Object.entries(analytics.previousSchoolType).sort((a, b) => b[1] - a[1])
    const topSchoolType = schoolTypeEntries[0]
    const schoolTypeInsight =
      schoolTypeEntries.length > 0
        ? `${schoolTypeEntries.length} school types represented. ${topSchoolType?.[0] || 'Various'} most common with ${topSchoolType?.[1] || 0} students (${(((topSchoolType?.[1] || 0) / totalStudents) * 100).toFixed(1)}%). Distribution reflects diverse educational pathways. Understanding patterns helps tailor support programs.`
        : 'School type analysis requires comprehensive data across all school types. Please ensure all previous school type data is properly recorded for accurate analysis.'

    const schoolTypeForecast =
      schoolTypeEntries.length > 0
        ? `School type distribution expected to remain consistent. ${topSchoolType?.[0] || 'Primary types'} will continue as largest segments. Growth of ${Math.round(totalStudents * 0.1)} students maintains similar ratios. Strategic partnerships strengthen enrollment pipelines.`
        : 'School type forecasting requires historical data and trend analysis to identify patterns and recommend strategic interventions across all school types.'

    const schoolEntries = Object.entries(analytics.previousSchoolDistribution).sort((a, b) => b[1] - a[1])
    const topSchool = schoolEntries[0]
    const schoolInsight =
      schoolEntries.length > 0
        ? `${schoolEntries.length} feeder schools identified. ${topSchool?.[0] || 'Various'} leads with ${topSchool?.[1] || 0} students. ${schoolEntries.length > 10 ? 'Extensive' : 'Varied'} distribution ${topSchool && topSchool[1] > 3 ? 'indicates strong partnerships' : 'demonstrates broad reach'}.`
        : 'Feeder school analysis requires comprehensive data on previous schools. Please ensure all previous school data is properly recorded for accurate analysis.'

    const schoolForecast =
      schoolEntries.length > 0
        ? `Feeder school patterns projected to remain stable. ${topSchool?.[0] || 'Leading schools'} will continue sending significant students. Growth of ${Math.round(totalStudents * 0.1)} students maintains similar proportions. Strategic partnerships strengthen enrollment pipelines.`
        : 'Feeder school forecasting requires historical data and trend analysis to identify patterns and recommend strategic interventions across all previous schools.'

    return {
      gradeLevelInsight,
      gradeLevelForecast,
      strandInsight,
      strandForecast,
      courseInsight,
      courseForecast,
      regularIrregularInsight,
      regularIrregularForecast,
      genderInsight,
      genderForecast,
      religionInsight,
      religionForecast,
      ageInsight,
      ageForecast,
      provinceInsight,
      provinceForecast,
      municipalityInsight,
      municipalityForecast,
      barangayInsight,
      barangayForecast,
      schoolTypeInsight,
      schoolTypeForecast,
      schoolInsight,
      schoolForecast,
    }
  }, [analytics, totalStudents, studentsByDepartment])
}

