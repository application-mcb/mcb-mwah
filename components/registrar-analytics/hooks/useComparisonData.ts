import { useMemo } from 'react'
import { ExtendedEnrollmentData } from '../../enrollment-management/types'
import { StudentProfile, AnalyticsData, ComparisonData } from '../types'
import { normalizeSchoolNames } from '../utils/school-name-utils'

interface UseComparisonDataProps {
  enrollments: ExtendedEnrollmentData[]
  studentProfiles: Record<string, StudentProfile>
  selectedAYs: string[]
  selectedSemester: string
}

export const useComparisonData = ({
  enrollments,
  studentProfiles,
  selectedAYs,
  selectedSemester,
}: UseComparisonDataProps) => {
  const comparisonData = useMemo<ComparisonData[]>(() => {
    if (selectedAYs.length === 0) return []

    return selectedAYs.map((ay) => {
      // Filter enrollments for this AY
      const ayEnrollments = enrollments.filter((enrollment) => {
        const enrollmentAY = enrollment.enrollmentInfo?.schoolYear
        const enrollmentSemester = enrollment.enrollmentInfo?.semester
        const enrollmentLevel = enrollment.enrollmentInfo?.level
        const enrollmentDepartment = enrollment.enrollmentInfo?.department

        // Must match AY
        if (enrollmentAY !== ay) return false

        // For college and SHS, must match semester
        const isCollege = enrollmentLevel === 'college'
        const isSHS =
          enrollmentLevel === 'high-school' && enrollmentDepartment === 'SHS'

        if (isCollege || isSHS) {
          const semesterValue =
            selectedSemester === '1' ? 'first-sem' : 'second-sem'
          return enrollmentSemester === semesterValue
        }

        // For JHS, semester filter doesn't apply
        return true
      })

      // Calculate analytics for this AY
      const analytics: AnalyticsData = {
        studentsByGrade: {},
        studentsByStrand: {},
        studentsByCourse: {},
        regularVsIrregular: { regular: 0, irregular: 0 },
        locationBreakdown: {
          barangay: {},
          municipality: {},
          province: {},
        },
        religionDistribution: {},
        birthdateRange: {
          min: null,
          max: null,
          ageGroups: {},
        },
        genderDistribution: {},
        previousSchoolType: {},
        previousSchoolDistribution: {},
      }

      // Collect all school names for normalization
      const schoolNames: string[] = []
      ayEnrollments.forEach((enrollment) => {
        const profile = studentProfiles[enrollment.userId]
        if (profile?.previousSchoolName) {
          schoolNames.push(profile.previousSchoolName.trim())
        }
      })

      // Normalize school names
      const schoolNameMap = normalizeSchoolNames(schoolNames)

      ayEnrollments.forEach((enrollment) => {
        const enrollmentInfo = enrollment.enrollmentInfo
        const personalInfo = enrollment.personalInfo

        // Grade level (7-12)
        if (
          enrollmentInfo?.level === 'high-school' &&
          enrollmentInfo?.gradeLevel
        ) {
          const gradeLevel = parseInt(enrollmentInfo.gradeLevel)
          if (gradeLevel >= 7 && gradeLevel <= 12) {
            analytics.studentsByGrade[gradeLevel] =
              (analytics.studentsByGrade[gradeLevel] || 0) + 1
          }
        }

        // Strand (11-12)
        if (
          enrollmentInfo?.level === 'high-school' &&
          enrollmentInfo?.department === 'SHS' &&
          enrollmentInfo?.strand
        ) {
          const strand = enrollmentInfo.strand
          analytics.studentsByStrand[strand] =
            (analytics.studentsByStrand[strand] || 0) + 1
        }

        // Course (college 1st-4th year)
        if (enrollmentInfo?.level === 'college' && enrollmentInfo?.courseCode) {
          const courseKey = `${enrollmentInfo.courseCode} - Year ${
            enrollmentInfo.yearLevel || 'N/A'
          }`
          analytics.studentsByCourse[courseKey] =
            (analytics.studentsByCourse[courseKey] || 0) + 1
        }

        // Regular vs Irregular
        const studentType = enrollmentInfo?.studentType || 'regular'
        if (studentType === 'regular') {
          analytics.regularVsIrregular.regular++
        } else {
          analytics.regularVsIrregular.irregular++
        }

        // Location
        const profile = studentProfiles[enrollment.userId]
        if (profile) {
          if (profile.barangay) {
            analytics.locationBreakdown.barangay[profile.barangay] =
              (analytics.locationBreakdown.barangay[profile.barangay] || 0) + 1
          }
          if (profile.municipality) {
            analytics.locationBreakdown.municipality[profile.municipality] =
              (analytics.locationBreakdown.municipality[profile.municipality] ||
                0) + 1
          }
          if (profile.province) {
            analytics.locationBreakdown.province[profile.province] =
              (analytics.locationBreakdown.province[profile.province] || 0) + 1
          }
        }

        // Religion
        if (personalInfo?.religion) {
          const religion = personalInfo.religion.trim()
          analytics.religionDistribution[religion] =
            (analytics.religionDistribution[religion] || 0) + 1
        }

        // Birthdate range
        if (
          personalInfo?.birthYear &&
          personalInfo?.birthMonth &&
          personalInfo?.birthDay
        ) {
          const year = parseInt(personalInfo.birthYear)
          const month = parseInt(personalInfo.birthMonth)
          const day = parseInt(personalInfo.birthDay)
          const birthDateStr = `${year}-${String(month).padStart(
            2,
            '0'
          )}-${String(day).padStart(2, '0')}`

          if (
            !analytics.birthdateRange.min ||
            birthDateStr < analytics.birthdateRange.min
          ) {
            analytics.birthdateRange.min = birthDateStr
          }
          if (
            !analytics.birthdateRange.max ||
            birthDateStr > analytics.birthdateRange.max
          ) {
            analytics.birthdateRange.max = birthDateStr
          }

          // Age groups
          const currentYear = new Date().getFullYear()
          const age = currentYear - year
          let ageGroup = ''
          if (age < 13) ageGroup = 'Under 13'
          else if (age < 16) ageGroup = '13-15'
          else if (age < 19) ageGroup = '16-18'
          else if (age < 22) ageGroup = '19-21'
          else if (age < 25) ageGroup = '22-24'
          else ageGroup = '25+'

          analytics.birthdateRange.ageGroups[ageGroup] =
            (analytics.birthdateRange.ageGroups[ageGroup] || 0) + 1
        }

        // Gender
        if (personalInfo?.gender) {
          const gender = personalInfo.gender.trim()
          const normalizedGender =
            gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase()
          analytics.genderDistribution[normalizedGender] =
            (analytics.genderDistribution[normalizedGender] || 0) + 1
        }

        // Previous School Type
        if (profile?.previousSchoolType) {
          const schoolType = profile.previousSchoolType.trim()
          analytics.previousSchoolType[schoolType] =
            (analytics.previousSchoolType[schoolType] || 0) + 1
        }

        // Previous School Name
        if (profile?.previousSchoolName) {
          const originalName = profile.previousSchoolName.trim()
          const normalizedName = schoolNameMap[originalName] || originalName
          analytics.previousSchoolDistribution[normalizedName] =
            (analytics.previousSchoolDistribution[normalizedName] || 0) + 1
        }
      })

      // Calculate students by department
      let jhs = 0
      let shs = 0
      let college = 0

      ayEnrollments.forEach((enrollment) => {
        const level = enrollment.enrollmentInfo?.level
        const department = enrollment.enrollmentInfo?.department

        if (level === 'college') {
          college++
        } else if (level === 'high-school') {
          if (department === 'SHS') {
            shs++
          } else {
            jhs++
          }
        }
      })

      return {
        ay,
        analytics,
        totalStudents: ayEnrollments.length,
        studentsByDepartment: { jhs, shs, college },
      }
    })
  }, [enrollments, studentProfiles, selectedAYs, selectedSemester])

  return comparisonData
}

