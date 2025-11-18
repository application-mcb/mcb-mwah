'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { toast } from 'react-toastify'
import { ExtendedEnrollmentData } from './enrollment-management/types'
import { AnalyticsHeader } from './registrar-analytics/analytics-header'
import { SkeletonLoader } from './registrar-analytics/skeleton-loader'
import { SummaryCards } from './registrar-analytics/summary-cards'
import { FallbackBanner } from './registrar-analytics/fallback-banner'
import { NoDataCard } from './registrar-analytics/no-data-card'
import { SearchEmptyState } from './registrar-analytics/search-empty-state'
import { ChartsGrid } from './registrar-analytics/charts-grid'
import { ComparisonModal } from './registrar-analytics/comparison-modal'
import { normalizeSchoolNames } from './registrar-analytics/utils/school-name-utils'
import { useCountUp } from './registrar-analytics/hooks/useCountUp'
import { useInsights } from './registrar-analytics/hooks/useInsights'
import { useChartData } from './registrar-analytics/hooks/useChartData'
import { useSearchVisibility } from './registrar-analytics/hooks/useSearchVisibility'
import {
  RegistrarAnalyticsProps,
  AnalyticsData,
  StudentProfile,
} from './registrar-analytics/types'

export default function RegistrarAnalytics({
  registrarUid,
  registrarName,
}: RegistrarAnalyticsProps) {
  const [enrollments, setEnrollments] = useState<ExtendedEnrollmentData[]>([])
  const [studentProfiles, setStudentProfiles] = useState<
    Record<string, StudentProfile>
  >({})
  const [loading, setLoading] = useState(true)
  const [currentAY, setCurrentAY] = useState('')
  const [currentSemester, setCurrentSemester] = useState('1')
  const [selectedAY, setSelectedAY] = useState('')
  const [selectedSemester, setSelectedSemester] = useState('1')
  const [availableAYs, setAvailableAYs] = useState<string[]>([])
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStudentType, setSelectedStudentType] = useState<
    ('regular' | 'irregular')[]
  >([])
  const [selectedLevel, setSelectedLevel] = useState<
    ('college' | 'senior' | 'junior')[]
  >([])
  const [fallbackAYInfo, setFallbackAYInfo] = useState<{
    requested: string
    actual: string
  } | null>(null)
  const [showComparisonModal, setShowComparisonModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadStudentProfiles = async (
    enrollmentsData: ExtendedEnrollmentData[]
  ) => {
    try {
      if (enrollmentsData.length === 0) {
        setStudentProfiles({})
        return
      }

      // Chunk userIds to avoid URL length limits (50 per chunk)
      const userIds = enrollmentsData.map((e) => e.userId)
      const chunkSize = 50
      const chunks = []

      for (let i = 0; i < userIds.length; i += chunkSize) {
        chunks.push(userIds.slice(i, i + chunkSize))
      }

      // Fetch all chunks in parallel
      const batchPromises = chunks.map(async (chunk) => {
        try {
          const chunkUserIds = chunk.join(',')
          const batchResponse = await fetch(
            `/api/user/profile?uids=${chunkUserIds}`
          )
          const batchData = await batchResponse.json()

          if (batchResponse.ok && batchData.success && batchData.users) {
            return batchData.users
          }
          return []
        } catch (error) {
          console.warn('Failed to load chunk:', error)
          return []
        }
      })

      const allUsers = await Promise.all(batchPromises)

      // Flatten and process results
      const profiles: Record<string, StudentProfile> = {}
      allUsers.flat().forEach((user: any) => {
        if (user && user.uid) {
          profiles[user.uid] = {
            uid: user.uid,
            province: user.province,
            municipality: user.municipality,
            barangay: user.barangay,
            previousSchoolName: user.previousSchoolName,
            previousSchoolType: user.previousSchoolType,
          }
        }
      })

      setStudentProfiles(profiles)
    } catch (error) {
      console.error('Error loading student profiles:', error)
    }
  }

  useEffect(() => {
    if (currentAY) {
      setSelectedAY(currentAY)
    }
    if (currentSemester) {
      setSelectedSemester(currentSemester)
    }
  }, [currentAY, currentSemester])

  const loadData = async () => {
    try {
      setLoading(true)

      // Get current AY config
      let configAY = ''
      let configSemester = '1'
      const configResponse = await fetch('/api/enrollment?getConfig=true')
      const configData = await configResponse.json()

      if (configResponse.ok && configData.ayCode) {
        configAY = configData.ayCode
      }
      if (configResponse.ok && configData.semester) {
        configSemester = configData.semester
      }
      setCurrentSemester(configSemester)
      setSelectedSemester(configSemester)

      // Fetch all enrolled students
      const response = await fetch('/api/enrollment?getEnrolledStudents=true')
      const data = await response.json()

      if (response.ok && data.success) {
        const enrollmentsData: ExtendedEnrollmentData[] = data.enrollments || []
        setEnrollments(enrollmentsData)

        // Extract unique AY values
        const uniqueAYs = Array.from(
          new Set(
            enrollmentsData
              .map((e) => e.enrollmentInfo?.schoolYear)
              .filter(Boolean)
          )
        ).sort() as string[]
        setAvailableAYs(uniqueAYs)

        let effectiveAY = configAY
        if (!effectiveAY && uniqueAYs.length > 0) {
          effectiveAY = uniqueAYs[uniqueAYs.length - 1]
        }

        if (effectiveAY) {
          const hasDataForEffectiveAY = enrollmentsData.some(
            (enrollment) =>
              enrollment.enrollmentInfo?.schoolYear === effectiveAY
          )

          if (!hasDataForEffectiveAY && uniqueAYs.length > 0) {
            const fallbackAY = uniqueAYs[uniqueAYs.length - 1]
            if (fallbackAY && fallbackAY !== effectiveAY) {
              if (configAY && configAY !== fallbackAY) {
                toast.info(
                  `No records found for ${configAY}. Showing ${fallbackAY} instead.`,
                  { autoClose: 4000 }
                )
              }
              effectiveAY = fallbackAY
              setFallbackAYInfo({
                requested: configAY || 'current AY',
                actual: fallbackAY,
              })
            } else {
              setFallbackAYInfo(null)
            }
          } else {
            setFallbackAYInfo(null)
          }

          setCurrentAY(effectiveAY)
          setSelectedAY(effectiveAY)
        } else {
          setFallbackAYInfo(null)
          setCurrentAY('')
          setSelectedAY('')
        }

        // Fetch student profiles with address data
        await loadStudentProfiles(enrollmentsData)
      }
    } catch (error) {
      console.error('Error loading analytics data:', error)
      toast.error('Failed to load analytics data', { autoClose: 5000 })
    } finally {
      setLoading(false)
    }
  }

  // Filter enrollments by selected AY, semester, student type, and level
  const filteredEnrollments = useMemo(() => {
    if (!selectedAY) return []

    return enrollments.filter((enrollment) => {
      const enrollmentAY = enrollment.enrollmentInfo?.schoolYear
      const enrollmentSemester = enrollment.enrollmentInfo?.semester
      const enrollmentLevel = enrollment.enrollmentInfo?.level
      const enrollmentDepartment = enrollment.enrollmentInfo?.department
      const enrollmentStudentType =
        enrollment.enrollmentInfo?.studentType || 'regular'

      // Must match AY
      if (enrollmentAY !== selectedAY) return false

      // Filter by student type
      if (selectedStudentType.length > 0) {
        if (
          !selectedStudentType.includes(
            enrollmentStudentType as 'regular' | 'irregular'
          )
        ) {
          return false
        }
      }

      // Filter by level/department
      if (selectedLevel.length > 0) {
        const isCollege = enrollmentLevel === 'college'
        const isSHS =
          enrollmentLevel === 'high-school' && enrollmentDepartment === 'SHS'
        const isJHS =
          enrollmentLevel === 'high-school' && enrollmentDepartment !== 'SHS'

        const matchesLevel =
          (isCollege && selectedLevel.includes('college')) ||
          (isSHS && selectedLevel.includes('senior')) ||
          (isJHS && selectedLevel.includes('junior'))

        if (!matchesLevel) return false
      }

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
  }, [
    enrollments,
    selectedAY,
    selectedSemester,
    selectedStudentType,
    selectedLevel,
  ])

  // Calculate analytics
  const analytics = useMemo(() => {
    const data: AnalyticsData = {
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
    filteredEnrollments.forEach((enrollment) => {
      const profile = studentProfiles[enrollment.userId]
      if (profile?.previousSchoolName) {
        schoolNames.push(profile.previousSchoolName.trim())
      }
    })

    // Normalize school names
    const schoolNameMap = normalizeSchoolNames(schoolNames)

    filteredEnrollments.forEach((enrollment) => {
      const enrollmentInfo = enrollment.enrollmentInfo
      const personalInfo = enrollment.personalInfo

      // Grade level (7-12)
      if (
        enrollmentInfo?.level === 'high-school' &&
        enrollmentInfo?.gradeLevel
      ) {
        const gradeLevel = parseInt(enrollmentInfo.gradeLevel)
        if (gradeLevel >= 7 && gradeLevel <= 12) {
          data.studentsByGrade[gradeLevel] =
            (data.studentsByGrade[gradeLevel] || 0) + 1
        }
      }

      // Strand (11-12)
      if (
        enrollmentInfo?.level === 'high-school' &&
        enrollmentInfo?.department === 'SHS' &&
        enrollmentInfo?.strand
      ) {
        const strand = enrollmentInfo.strand
        data.studentsByStrand[strand] = (data.studentsByStrand[strand] || 0) + 1
      }

      // Course (college 1st-4th year)
      if (enrollmentInfo?.level === 'college' && enrollmentInfo?.courseCode) {
        const courseKey = `${enrollmentInfo.courseCode} - Year ${
          enrollmentInfo.yearLevel || 'N/A'
        }`
        data.studentsByCourse[courseKey] =
          (data.studentsByCourse[courseKey] || 0) + 1
      }

      // Regular vs Irregular
      const studentType = enrollmentInfo?.studentType || 'regular'
      if (studentType === 'regular') {
        data.regularVsIrregular.regular++
      } else {
        data.regularVsIrregular.irregular++
      }

      // Location - use address fields from student profile
      const profile = studentProfiles[enrollment.userId]
      if (profile) {
        if (profile.barangay) {
          data.locationBreakdown.barangay[profile.barangay] =
            (data.locationBreakdown.barangay[profile.barangay] || 0) + 1
        }
        if (profile.municipality) {
          data.locationBreakdown.municipality[profile.municipality] =
            (data.locationBreakdown.municipality[profile.municipality] || 0) + 1
        }
        if (profile.province) {
          data.locationBreakdown.province[profile.province] =
            (data.locationBreakdown.province[profile.province] || 0) + 1
        }
      }

      // Religion
      if (personalInfo?.religion) {
        const religion = personalInfo.religion.trim()
        data.religionDistribution[religion] =
          (data.religionDistribution[religion] || 0) + 1
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
        const birthDate = new Date(year, month - 1, day)
        const birthDateStr = `${year}-${String(month).padStart(
          2,
          '0'
        )}-${String(day).padStart(2, '0')}`

        if (
          !data.birthdateRange.min ||
          birthDateStr < data.birthdateRange.min
        ) {
          data.birthdateRange.min = birthDateStr
        }
        if (
          !data.birthdateRange.max ||
          birthDateStr > data.birthdateRange.max
        ) {
          data.birthdateRange.max = birthDateStr
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

        data.birthdateRange.ageGroups[ageGroup] =
          (data.birthdateRange.ageGroups[ageGroup] || 0) + 1
      }

      // Gender - normalize to handle case differences
      if (personalInfo?.gender) {
        const gender = personalInfo.gender.trim()
        // Normalize: capitalize first letter, lowercase the rest
        const normalizedGender =
          gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase()
        data.genderDistribution[normalizedGender] =
          (data.genderDistribution[normalizedGender] || 0) + 1
      }

      // Previous School Type and Name (reuse profile from location section)
      if (profile?.previousSchoolType) {
        const schoolType = profile.previousSchoolType.trim()
        data.previousSchoolType[schoolType] =
          (data.previousSchoolType[schoolType] || 0) + 1
      }

      // Previous School Name (with normalization)
      if (profile?.previousSchoolName) {
        const originalName = profile.previousSchoolName.trim()
        const normalizedName = schoolNameMap[originalName] || originalName
        data.previousSchoolDistribution[normalizedName] =
          (data.previousSchoolDistribution[normalizedName] || 0) + 1
      }
    })

    return data
  }, [filteredEnrollments, studentProfiles])

  const totalStudents = filteredEnrollments.length

  // Calculate students by department
  const studentsByDepartment = useMemo(() => {
    let jhs = 0
    let shs = 0
    let college = 0

    filteredEnrollments.forEach((enrollment) => {
      const level = enrollment.enrollmentInfo?.level
      const department = enrollment.enrollmentInfo?.department

      if (level === 'college') {
        college++
      } else if (level === 'high-school') {
        if (department === 'SHS') {
          shs++
        } else {
          // JHS or no department specified (defaults to JHS)
          jhs++
        }
      }
    })

    return { jhs, shs, college }
  }, [filteredEnrollments])

  const jhsCount = useCountUp(studentsByDepartment.jhs, 200)
  const shsCount = useCountUp(studentsByDepartment.shs, 200)
  const collegeCount = useCountUp(studentsByDepartment.college, 200)

  const insights = useInsights(analytics, totalStudents, studentsByDepartment)

  const {
    gradeChartData,
    strandChartData,
    courseChartData,
    genderChartData,
    regularIrregularData,
    ageGroupChartData,
    provinceChartData,
    previousSchoolTypeChartData,
    previousSchoolChartData,
  } = useChartData(analytics)

  // Skeleton loader handled by dedicated component

  const hasAnalyticsData = filteredEnrollments.length > 0
  const latestAvailableAY =
    availableAYs.length > 0 ? availableAYs[availableAYs.length - 1] : undefined

  const {
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
  } = useSearchVisibility({
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
  })

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
  }

  const handleToggleFilters = () => {
    setShowFilterDropdown((prev) => !prev)
  }

  const handleCloseFilters = () => {
    setShowFilterDropdown(false)
  }

  const handleSelectAY = (ay: string) => {
    setSelectedAY(ay)
  }

  const handleSelectSemester = (semester: '1' | '2') => {
    setSelectedSemester(semester)
  }

  const handleToggleStudentType = (type: 'regular' | 'irregular') => {
    setSelectedStudentType((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  const handleToggleLevel = (level: 'college' | 'senior' | 'junior') => {
    setSelectedLevel((prev) =>
      prev.includes(level) ? prev.filter((t) => t !== level) : [...prev, level]
    )
  }

  const handleResetFilters = () => {
    setSelectedAY(currentAY)
    setSelectedSemester(currentSemester || '1')
    setSelectedStudentType([])
    setSelectedLevel([])
  }

  const handleOpenComparison = () => {
    setShowComparisonModal(true)
  }

  const handleCloseComparison = () => {
    setShowComparisonModal(false)
  }

  if (loading) {
    return <SkeletonLoader />
  }

  return (
    <div className="p-6 space-y-6" style={{ fontFamily: 'Poppins' }}>
      <AnalyticsHeader
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        showFilterDropdown={showFilterDropdown}
        onToggleFilterDropdown={handleToggleFilters}
        onCloseFilters={handleCloseFilters}
        availableAYs={availableAYs}
        currentAY={currentAY}
        selectedAY={selectedAY}
        selectedSemester={selectedSemester}
        selectedStudentType={selectedStudentType}
        selectedLevel={selectedLevel}
        onSelectAY={handleSelectAY}
        onSelectSemester={handleSelectSemester}
        onToggleStudentType={handleToggleStudentType}
        onToggleLevel={handleToggleLevel}
        onResetFilters={handleResetFilters}
        onOpenComparison={handleOpenComparison}
      />

      {fallbackAYInfo && (
        <FallbackBanner
          requested={fallbackAYInfo.requested}
          actual={fallbackAYInfo.actual}
        />
      )}

      {!hasAnalyticsData ? (
        <NoDataCard
          onReload={loadData}
          latestAvailableAY={latestAvailableAY}
          selectedAY={selectedAY}
          onSelectAY={handleSelectAY}
        />
      ) : (
        <>
          {showSummaryCards && (
            <SummaryCards
              showJHSCard={showJHSCard}
              showSHSCard={showSHSCard}
              showCollegeCard={showCollegeCard}
              jhsCount={jhsCount}
              shsCount={shsCount}
              collegeCount={collegeCount}
            />
          )}

          <ChartsGrid
            showGradeChart={showGradeChart}
            showStrandChart={showStrandChart}
            showCourseChart={showCourseChart}
            showRegularIrregularChart={showRegularIrregularChart}
            showGenderChart={showGenderChart}
            showReligionChart={showReligionChart}
            showAgeChart={showAgeChart}
            showProvinceChart={showProvinceChart}
            showMunicipalityChart={showMunicipalityChart}
            showBarangayChart={showBarangayChart}
            showSchoolTypeChart={showSchoolTypeChart}
            showPreviousSchoolChart={showPreviousSchoolChart}
            gradeChartData={gradeChartData}
            strandChartData={strandChartData}
            courseChartData={courseChartData}
            regularIrregularData={regularIrregularData}
            genderChartData={genderChartData}
            ageGroupChartData={ageGroupChartData}
            provinceChartData={provinceChartData}
            previousSchoolTypeChartData={previousSchoolTypeChartData}
            previousSchoolChartData={previousSchoolChartData}
            analytics={analytics}
            insights={insights}
            registrarName={registrarName}
            enrollments={enrollments}
            studentProfiles={studentProfiles}
            availableAYs={availableAYs}
            currentSemester={selectedSemester}
          />

          {searchActive && !hasSearchMatches && <SearchEmptyState />}
        </>
      )}

      <ComparisonModal
        isOpen={showComparisonModal}
        onClose={handleCloseComparison}
        enrollments={enrollments}
        studentProfiles={studentProfiles}
        availableAYs={availableAYs}
        currentSemester={selectedSemester}
        registrarName={registrarName}
      />
    </div>
  )
}
