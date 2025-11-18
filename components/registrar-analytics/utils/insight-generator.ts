import { AnalyticsData } from '../types'

interface InsightGeneratorProps {
  analytics: AnalyticsData
  totalStudents: number
  studentsByDepartment: {
    jhs: number
    shs: number
    college: number
  }
  metric: string
}

export const generateInsight = ({
  analytics,
  totalStudents,
  studentsByDepartment,
  metric,
}: InsightGeneratorProps): string => {
  if (totalStudents === 0) {
    return 'No enrollment data available for this academic year.'
  }

  switch (metric) {
    case 'grade': {
      const gradeEntries = Object.entries(analytics.studentsByGrade).map(
        ([grade, count]) => ({ grade: parseInt(grade), count })
      )
      if (gradeEntries.length === 0) {
        return 'No grade level data available for this academic year.'
      }
      const maxGrade = gradeEntries.reduce(
        (max, curr) => (curr.count > max.count ? curr : max),
        { grade: 0, count: 0 }
      )
      const totalGradeStudents = gradeEntries.reduce(
        (sum, g) => sum + g.count,
        0
      )
      const percentage = ((maxGrade.count / totalGradeStudents) * 100).toFixed(1)
      return `Grade ${maxGrade.grade} has the highest enrollment with ${maxGrade.count} students (${percentage}%). Distribution shows ${gradeEntries.length} active grade levels. Upper grades demonstrate ${maxGrade.grade >= 10 ? 'strong' : 'moderate'} retention rates.`
    }

    case 'strand': {
      const strandEntries = Object.entries(analytics.studentsByStrand)
      if (strandEntries.length === 0) {
        return 'No strand data available for this academic year.'
      }
      const topStrand = strandEntries.sort((a, b) => b[1] - a[1])[0]
      const totalStrandStudents = strandEntries.reduce(
        (sum, s) => sum + s[1],
        0
      )
      const percentage = ((topStrand[1] / totalStrandStudents) * 100).toFixed(1)
      return `${topStrand[0]} strand leads with ${topStrand[1]} students (${percentage}%). ${strandEntries.length} strands represented. Distribution reflects student career interests and market demands. Strategic program alignment supports enrollment growth.`
    }

    case 'course': {
      const courseEntries = Object.entries(analytics.studentsByCourse)
      if (courseEntries.length === 0) {
        return 'No course data available for this academic year.'
      }
      const topCourse = courseEntries.sort((a, b) => b[1] - a[1])[0]
      const totalCourseStudents = courseEntries.reduce(
        (sum, c) => sum + c[1],
        0
      )
      const percentage = ((topCourse[1] / totalCourseStudents) * 100).toFixed(1)
      return `${topCourse[0]} leads enrollment with ${topCourse[1]} students (${percentage}%). ${courseEntries.length} courses active. Strong demand for professional programs. Faculty allocation should prioritize high-enrollment courses to maintain quality standards.`
    }

    case 'regularIrregular': {
      const regular = analytics.regularVsIrregular.regular
      const irregular = analytics.regularVsIrregular.irregular
      const irregularPercentage =
        totalStudents > 0
          ? ((irregular / totalStudents) * 100).toFixed(1)
          : '0'
      return `${regular} regular (${(100 - parseFloat(irregularPercentage)).toFixed(1)}%) and ${irregular} irregular (${irregularPercentage}%) students. ${parseFloat(irregularPercentage) < 10 ? 'Low' : parseFloat(irregularPercentage) < 25 ? 'Moderate' : 'High'} irregular ratio ${parseFloat(irregularPercentage) < 10 ? 'indicates strong progression' : 'requires support systems'}. Academic advisors should monitor closely.`
    }

    case 'gender': {
      const genderEntries = Object.entries(analytics.genderDistribution)
      if (genderEntries.length === 0) {
        return 'No gender data available for this academic year.'
      }
      const topGender = genderEntries.sort((a, b) => b[1] - a[1])[0]
      const percentage = ((topGender[1] / totalStudents) * 100).toFixed(1)
      const isBalanced =
        Math.abs(topGender[1] - totalStudents / genderEntries.length) <
        totalStudents * 0.1
      return `${topGender[0]} represents ${percentage}% of enrollment. ${isBalanced ? 'Balanced' : 'Varied'} distribution ${isBalanced ? 'reflects equitable access' : 'needs targeted recruitment'}. ${genderEntries.length} gender categories represented. Policies support inclusive participation across all groups.`
    }

    case 'age': {
      const ageEntries = Object.entries(analytics.birthdateRange.ageGroups)
      if (ageEntries.length === 0) {
        return 'No age data available for this academic year.'
      }
      const topAgeGroup = ageEntries.sort((a, b) => b[1] - a[1])[0]
      const percentage = ((topAgeGroup[1] / totalStudents) * 100).toFixed(1)
      return `${topAgeGroup[0]} age group represents largest segment with ${topAgeGroup[1]} students (${percentage}%). ${ageEntries.length} age groups identified. Distribution reflects typical enrollment patterns. Age diversity supports inclusive learning environment.`
    }

    case 'province': {
      const provinceEntries = Object.entries(
        analytics.locationBreakdown.province
      ).sort((a, b) => b[1] - a[1])
      if (provinceEntries.length === 0) {
        return 'No province data available for this academic year.'
      }
      const topProvince = provinceEntries[0]
      const percentage = ((topProvince[1] / totalStudents) * 100).toFixed(1)
      return `${topProvince[0]} leads with ${topProvince[1]} students (${percentage}%). ${provinceEntries.length} provinces represented. ${topProvince[1] > totalStudents * 0.4 ? 'Strong local enrollment' : 'Regional diversity'} demonstrates ${provinceEntries.length > 5 ? 'broad' : 'institutional'} reach. Geographic patterns inform recruitment strategies.`
    }

    case 'schoolType': {
      const schoolTypeEntries = Object.entries(
        analytics.previousSchoolType
      ).sort((a, b) => b[1] - a[1])
      if (schoolTypeEntries.length === 0) {
        return 'No previous school type data available for this academic year.'
      }
      const topSchoolType = schoolTypeEntries[0]
      const percentage = ((topSchoolType[1] / totalStudents) * 100).toFixed(1)
      return `${topSchoolType[0]} most common with ${topSchoolType[1]} students (${percentage}%). ${schoolTypeEntries.length} school types represented. Distribution reflects diverse educational pathways. Understanding patterns helps tailor support programs effectively.`
    }

    default:
      return 'Analytics data available for this academic year.'
  }
}

