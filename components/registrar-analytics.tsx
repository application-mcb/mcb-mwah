'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { toast } from 'react-toastify'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Print from '@/components/print'
import { ExtendedEnrollmentData } from './enrollment-management/types'
import {
  ChartBar,
  Users,
  GraduationCap,
  MapPin,
  Calendar,
  GenderIntersex,
  BookOpen,
  Printer,
  CaretDown,
  TrendUp,
  TrendDown,
  Lightbulb,
} from '@phosphor-icons/react'
import Image from 'next/image'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'

interface RegistrarAnalyticsProps {
  registrarUid: string
  registrarName?: string
}

interface AnalyticsData {
  studentsByGrade: Record<number, number>
  studentsByStrand: Record<string, number>
  studentsByCourse: Record<string, number>
  regularVsIrregular: { regular: number; irregular: number }
  locationBreakdown: {
    barangay: Record<string, number>
    municipality: Record<string, number>
    province: Record<string, number>
  }
  religionDistribution: Record<string, number>
  birthdateRange: {
    min: string | null
    max: string | null
    ageGroups: Record<string, number>
  }
  genderDistribution: Record<string, number>
  previousSchoolType: Record<string, number>
  previousSchoolDistribution: Record<string, number>
}

const COLORS = ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe']

// Levenshtein distance function for string similarity
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length
  const n = str2.length
  const dp: number[][] = []

  for (let i = 0; i <= m; i++) {
    dp[i] = [i]
  }
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1, // deletion
          dp[i][j - 1] + 1, // insertion
          dp[i - 1][j - 1] + 1 // substitution
        )
      }
    }
  }

  return dp[m][n]
}

// Calculate similarity percentage between two strings
function calculateSimilarity(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length)
  if (maxLen === 0) return 100
  const distance = levenshteinDistance(str1, str2)
  return ((maxLen - distance) / maxLen) * 100
}

// Normalize school name for comparison
function normalizeSchoolName(name: string): string {
  if (!name) return ''

  // Convert to lowercase
  let normalized = name.toLowerCase().trim()

  // Remove extra spaces
  normalized = normalized.replace(/\s+/g, ' ')

  // Remove special characters except spaces
  normalized = normalized.replace(/[^\w\s]/g, '')

  // Normalize common abbreviations
  const abbreviations: Record<string, string> = {
    college: 'coll',
    university: 'univ',
    institute: 'inst',
    institution: 'inst',
    school: 'sch',
    'high school': 'hs',
    elementary: 'elem',
    national: 'natl',
    of: 'of',
    the: 'the',
  }

  // Replace common words with abbreviations
  Object.entries(abbreviations).forEach(([full, abbrev]) => {
    const regex = new RegExp(`\\b${full}\\b`, 'gi')
    normalized = normalized.replace(regex, abbrev)
  })

  return normalized.trim()
}

// Group similar school names using fuzzy matching
function normalizeSchoolNames(schoolNames: string[]): Record<string, string> {
  const normalizedMap: Record<string, string> = {}
  const groups: Array<{ canonical: string; variants: string[] }> = []

  // First pass: normalize all names
  const normalizedNames = schoolNames.map((name) => ({
    original: name,
    normalized: normalizeSchoolName(name),
  }))

  // Second pass: group similar names
  normalizedNames.forEach(({ original, normalized }) => {
    if (!normalized) {
      normalizedMap[original] = original
      return
    }

    // Find existing group with similar normalized name
    let foundGroup = false
    for (const group of groups) {
      const groupNormalized = normalizeSchoolName(group.canonical)
      const similarity = calculateSimilarity(normalized, groupNormalized)

      if (similarity >= 85) {
        group.variants.push(original)
        normalizedMap[original] = group.canonical
        foundGroup = true
        break
      }
    }

    // If no similar group found, create new group
    if (!foundGroup) {
      groups.push({
        canonical: original,
        variants: [original],
      })
      normalizedMap[original] = original
    }
  })

  // Third pass: determine canonical name (most frequent variant in each group)
  const variantCounts: Record<string, number> = {}
  schoolNames.forEach((name) => {
    variantCounts[name] = (variantCounts[name] || 0) + 1
  })

  // Update canonical names to use most frequent variant
  groups.forEach((group) => {
    let mostFrequent = group.canonical
    let maxCount = variantCounts[group.canonical] || 0

    group.variants.forEach((variant) => {
      const count = variantCounts[variant] || 0
      if (count > maxCount) {
        maxCount = count
        mostFrequent = variant
      }
    })

    // Update mapping for all variants in this group
    group.variants.forEach((variant) => {
      normalizedMap[variant] = mostFrequent
    })
  })

  return normalizedMap
}

interface StudentProfile {
  uid: string
  province?: string
  municipality?: string
  barangay?: string
  previousSchoolName?: string
  previousSchoolType?: string
  [key: string]: any
}

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
  const [currentSemester, setCurrentSemester] = useState('')
  const [selectedAY, setSelectedAY] = useState('')
  const [selectedSemester, setSelectedSemester] = useState('')
  const [availableAYs, setAvailableAYs] = useState<string[]>([])
  const [showPrintModal, setShowPrintModal] = useState(false)

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
      const configResponse = await fetch('/api/enrollment?getConfig=true')
      const configData = await configResponse.json()

      if (configResponse.ok && configData.ayCode) {
        setCurrentAY(configData.ayCode)
        setSelectedAY(configData.ayCode)
        setCurrentSemester(configData.semester || '1')
        setSelectedSemester(configData.semester || '1')
      }

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

  // Filter enrollments by selected AY and semester
  const filteredEnrollments = useMemo(() => {
    if (!selectedAY) return []

    return enrollments.filter((enrollment) => {
      const enrollmentAY = enrollment.enrollmentInfo?.schoolYear
      const enrollmentSemester = enrollment.enrollmentInfo?.semester

      // Must match AY
      if (enrollmentAY !== selectedAY) return false

      // For college and SHS, must match semester
      const isCollege = enrollment.enrollmentInfo?.level === 'college'
      const isSHS =
        enrollment.enrollmentInfo?.level === 'high-school' &&
        enrollment.enrollmentInfo?.department === 'SHS'

      if (isCollege || isSHS) {
        const semesterValue =
          selectedSemester === '1' ? 'first-sem' : 'second-sem'
        return enrollmentSemester === semesterValue
      }

      // For JHS, semester filter doesn't apply
      return true
    })
  }, [enrollments, selectedAY, selectedSemester])

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

  // Generate insights and forecasts
  const insights = useMemo(() => {
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
      totalStudents > 0
        ? ((totalIrregular / totalStudents) * 100).toFixed(1)
        : '0'

    const topProvince = Object.entries(
      analytics.locationBreakdown.province
    ).sort((a, b) => b[1] - a[1])[0]

    const genderEntries = Object.entries(analytics.genderDistribution)
    const topGender = genderEntries.sort((a, b) => b[1] - a[1])[0]

    // Forecasting: Predict next semester enrollment based on current trends
    const avgGradeEnrollment =
      gradeEntries.length > 0
        ? gradeEntries.reduce((sum, g) => sum + g.count, 0) /
          gradeEntries.length
        : 0
    const forecastedEnrollment = Math.round(avgGradeEnrollment * 1.15) // 15% growth assumption

    return {
      maxGrade: maxGrade.count > 0 ? `Grade ${maxGrade.grade}` : 'N/A',
      minGrade: minGrade.count < Infinity ? `Grade ${minGrade.grade}` : 'N/A',
      irregularPercentage,
      topProvince: topProvince
        ? `${topProvince[0]} (${topProvince[1]} students)`
        : 'N/A',
      topGender: topGender
        ? `${topGender[0]} (${topGender[1]} students)`
        : 'N/A',
      forecastedEnrollment,
    }
  }, [analytics, totalStudents])

  // Prepare chart data
  const gradeChartData = useMemo(() => {
    return Object.entries(analytics.studentsByGrade)
      .map(([grade, count]) => ({
        name: `Grade ${grade}`,
        students: count,
      }))
      .sort(
        (a, b) =>
          parseInt(a.name.split(' ')[1]) - parseInt(b.name.split(' ')[1])
      )
  }, [analytics.studentsByGrade])

  const strandChartData = useMemo(() => {
    return Object.entries(analytics.studentsByStrand).map(
      ([strand, count]) => ({
        name: strand,
        students: count,
      })
    )
  }, [analytics.studentsByStrand])

  const courseChartData = useMemo(() => {
    return Object.entries(analytics.studentsByCourse).map(
      ([course, count]) => ({
        name: course.length > 20 ? course.substring(0, 20) + '...' : course,
        fullName: course,
        students: count,
      })
    )
  }, [analytics.studentsByCourse])

  const genderChartData = useMemo(() => {
    return Object.entries(analytics.genderDistribution).map(
      ([gender, count]) => ({
        name: gender,
        value: count,
      })
    )
  }, [analytics.genderDistribution])

  const regularIrregularData = useMemo(() => {
    return [
      { name: 'Regular', value: analytics.regularVsIrregular.regular },
      { name: 'Irregular', value: analytics.regularVsIrregular.irregular },
    ]
  }, [analytics.regularVsIrregular])

  const religionChartData = useMemo(() => {
    return Object.entries(analytics.religionDistribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([religion, count]) => ({
        name: religion,
        students: count,
      }))
  }, [analytics.religionDistribution])

  const ageGroupChartData = useMemo(() => {
    return Object.entries(analytics.birthdateRange.ageGroups).map(
      ([ageGroup, count]) => ({
        name: ageGroup,
        students: count,
      })
    )
  }, [analytics.birthdateRange.ageGroups])

  const provinceChartData = useMemo(() => {
    return Object.entries(analytics.locationBreakdown.province)
      .sort((a, b) => b[1] - a[1])
      .map(([province, count]) => ({
        name:
          province.length > 20 ? province.substring(0, 20) + '...' : province,
        fullName: province,
        students: count,
      }))
  }, [analytics.locationBreakdown.province])

  const previousSchoolTypeChartData = useMemo(() => {
    return Object.entries(analytics.previousSchoolType).map(
      ([schoolType, count]) => ({
        name: schoolType,
        students: count,
      })
    )
  }, [analytics.previousSchoolType])

  const previousSchoolChartData = useMemo(() => {
    return Object.entries(analytics.previousSchoolDistribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30) // Limit to top 30 schools
      .map(([schoolName, count]) => ({
        name:
          schoolName.length > 30
            ? schoolName.substring(0, 30) + '...'
            : schoolName,
        fullName: schoolName,
        students: count,
      }))
  }, [analytics.previousSchoolDistribution])

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="flex justify-center space-x-2 mb-4">
            <div className="w-3 h-3 bg-blue-900 rounded-full animate-pulse"></div>
            <div
              className="w-3 h-3 bg-blue-900 rounded-full animate-pulse"
              style={{ animationDelay: '0.2s' }}
            ></div>
            <div
              className="w-3 h-3 bg-blue-900 rounded-full animate-pulse"
              style={{ animationDelay: '0.4s' }}
            ></div>
          </div>
          <p
            className="text-gray-600"
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            Loading analytics...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6" style={{ fontFamily: 'Poppins' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-medium text-gray-900 mb-1"
            style={{ fontFamily: 'Poppins', fontWeight: 500 }}
          >
            Analytics & Reports
          </h1>
          <p
            className="text-sm text-gray-600"
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            Student enrollment insights and statistics
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* AY Filter */}
          <div className="relative">
            <select
              value={selectedAY}
              onChange={(e) => setSelectedAY(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 appearance-none pr-8"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              {availableAYs.length > 0 ? (
                availableAYs.map((ay) => (
                  <option key={ay} value={ay}>
                    {ay}
                  </option>
                ))
              ) : (
                <option value={currentAY}>{currentAY || 'Select AY'}</option>
              )}
            </select>
            <CaretDown
              size={16}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500"
            />
          </div>

          {/* Semester Filter */}
          <div className="relative">
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 appearance-none pr-8"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
            </select>
            <CaretDown
              size={16}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500"
            />
          </div>

          {/* Print Button */}
          <Button
            onClick={() => setShowPrintModal(true)}
            className="rounded-lg bg-blue-900 text-white hover:bg-blue-900 flex items-center gap-2"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            <Printer size={18} weight="fill" />
            Print Dashboard
          </Button>
        </div>
      </div>

      {/* Total Students Card */}
      <Card className="p-6 rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <p
              className="text-sm text-gray-600 mb-1"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              Total Students
            </p>
            <p
              className="text-3xl font-medium text-gray-900"
              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
            >
              {totalStudents}
            </p>
            <p
              className="text-xs text-gray-500 mt-1"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              {selectedAY}
              {selectedSemester && ` - Semester ${selectedSemester}`}
            </p>
          </div>
          <div className="w-16 h-16 rounded-xl bg-blue-900 flex items-center justify-center">
            <Users size={32} className="text-white" weight="fill" />
          </div>
        </div>
      </Card>

      {/* Analytics Grid - Max 2 columns per row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Students by Grade Level - Bar Chart - Full Width */}
        {gradeChartData.length > 0 && (
          <div className="col-span-1 lg:col-span-2">
            <ChartCard
              title="Students by Grade Level"
              icon={GraduationCap}
              insight={`Highest enrollment: ${insights.maxGrade}. Consider resource allocation for ${insights.maxGrade}.`}
              forecast={`Forecasted enrollment growth: ~${insights.forecastedEnrollment} students next semester.`}
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={gradeChartData}>
                  <defs>
                    <linearGradient id="colorGrade" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1e40af" stopOpacity={1} />
                      <stop
                        offset="95%"
                        stopColor="#3b82f6"
                        stopOpacity={0.8}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontFamily: 'Poppins',
                      fontWeight: 400,
                    }}
                  />
                  <Bar
                    dataKey="students"
                    fill="url(#colorGrade)"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        )}

        {/* Students by Strand - Bar Chart - Full Width */}
        {strandChartData.length > 0 && (
          <div className="col-span-1 lg:col-span-2">
            <ChartCard
              title="Students by Strand"
              icon={BookOpen}
              insight={`Most popular strand: ${
                strandChartData.sort((a, b) => b.students - a.students)[0]
                  ?.name || 'N/A'
              }.`}
              forecast="SHS enrollment trends suggest steady growth in STEM and ABM strands."
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={strandChartData}>
                  <defs>
                    <linearGradient
                      id="colorStrand"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={1} />
                      <stop
                        offset="95%"
                        stopColor="#60a5fa"
                        stopOpacity={0.8}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontFamily: 'Poppins',
                      fontWeight: 400,
                    }}
                  />
                  <Bar
                    dataKey="students"
                    fill="url(#colorStrand)"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        )}

        {/* Students by Course - Bar Chart - Full Width */}
        {courseChartData.length > 0 && (
          <div className="col-span-1 lg:col-span-2">
            <ChartCard
              title="Students by Course"
              icon={ChartBar}
              insight={`Top course: ${
                courseChartData.sort((a, b) => b.students - a.students)[0]
                  ?.fullName || 'N/A'
              }.`}
              forecast="College enrollment shows strong demand in technical programs."
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={courseChartData}>
                  <defs>
                    <linearGradient
                      id="colorCourse"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#1e40af" stopOpacity={1} />
                      <stop
                        offset="95%"
                        stopColor="#60a5fa"
                        stopOpacity={0.8}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontFamily: 'Poppins',
                      fontWeight: 400,
                    }}
                  />
                  <Bar
                    dataKey="students"
                    fill="url(#colorCourse)"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        )}

        {/* Regular vs Irregular - Bar Chart */}
        {regularIrregularData.some((d) => d.value > 0) && (
          <ChartCard
            title="Regular vs Irregular"
            icon={Users}
            insight={`${insights.irregularPercentage}% are irregular students. Monitor academic progress closely.`}
            forecast="Irregular student ratio expected to stabilize with improved guidance programs."
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={regularIrregularData}>
                <defs>
                  <linearGradient
                    id="colorRegularIrregular"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#1e40af" stopOpacity={1} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontFamily: 'Poppins',
                    fontWeight: 400,
                  }}
                />
                <Bar
                  dataKey="value"
                  fill="url(#colorRegularIrregular)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Gender Distribution - Pie Chart */}
        {genderChartData.length > 0 && (
          <ChartCard
            title="Gender Distribution"
            icon={GenderIntersex}
            insight={`${insights.topGender}. Gender balance is ${
              genderChartData.length === 2
                ? 'well-distributed'
                : 'needs attention'
            }.`}
            forecast="Gender distribution trends remain consistent across enrollment periods."
          >
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={genderChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {genderChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontFamily: 'Poppins',
                    fontWeight: 400,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Religion Distribution - Bar Chart - Full Width */}
        {religionChartData.length > 0 && (
          <div className="col-span-1 lg:col-span-2">
            <ChartCard
              title="Religion Distribution"
              icon={MapPin}
              insight={`Most represented: ${
                religionChartData[0]?.name || 'N/A'
              }. Diverse religious background.`}
              forecast="Religious diversity continues to reflect community demographics."
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={Object.entries(analytics.religionDistribution)
                    .sort((a, b) => b[1] - a[1])
                    .map(([religion, count]) => ({
                      name:
                        religion.length > 25
                          ? religion.substring(0, 25) + '...'
                          : religion,
                      fullName: religion,
                      students: count,
                    }))}
                >
                  <defs>
                    <linearGradient
                      id="colorReligion"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={1} />
                      <stop
                        offset="95%"
                        stopColor="#93c5fd"
                        stopOpacity={0.8}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontFamily: 'Poppins',
                      fontWeight: 400,
                    }}
                  />
                  <Bar
                    dataKey="students"
                    fill="url(#colorReligion)"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        )}

        {/* Age Groups - Bar Chart - Full Width */}
        {ageGroupChartData.length > 0 && (
          <div className="col-span-1 lg:col-span-2">
            <ChartCard
              title="Age Distribution"
              icon={Calendar}
              insight={`Age range: ${
                analytics.birthdateRange.min || 'N/A'
              } to ${analytics.birthdateRange.max || 'N/A'}.`}
              forecast="Age distribution aligns with expected enrollment patterns for each level."
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ageGroupChartData}>
                  <defs>
                    <linearGradient id="colorAge" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1e40af" stopOpacity={1} />
                      <stop
                        offset="95%"
                        stopColor="#60a5fa"
                        stopOpacity={0.8}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontFamily: 'Poppins',
                      fontWeight: 400,
                    }}
                  />
                  <Bar
                    dataKey="students"
                    fill="url(#colorAge)"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        )}

        {/* Provinces - Bar Chart - Full Width */}
        {provinceChartData.length > 0 && (
          <div className="col-span-1 lg:col-span-2">
            <ChartCard
              title="Students by Province"
              icon={MapPin}
              insight={`${insights.topProvince}. Geographic distribution shows strong local enrollment.`}
              forecast="Provincial enrollment patterns remain stable with slight regional variations."
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={provinceChartData}>
                  <defs>
                    <linearGradient
                      id="colorProvince"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#60a5fa" stopOpacity={1} />
                      <stop
                        offset="95%"
                        stopColor="#93c5fd"
                        stopOpacity={0.8}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontFamily: 'Poppins',
                      fontWeight: 400,
                    }}
                  />
                  <Bar
                    dataKey="students"
                    fill="url(#colorProvince)"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        )}

        {/* Municipalities - Bar Chart - Full Width */}
        {Object.keys(analytics.locationBreakdown.municipality).length > 0 && (
          <div className="col-span-1 lg:col-span-2">
            <ChartCard
              title="Students by Municipality"
              icon={MapPin}
              insight={`Top municipality: ${
                Object.entries(analytics.locationBreakdown.municipality).sort(
                  (a, b) => b[1] - a[1]
                )[0]?.[0] || 'N/A'
              }.`}
              forecast="Municipal enrollment distribution reflects local community engagement."
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={Object.entries(analytics.locationBreakdown.municipality)
                    .sort((a, b) => b[1] - a[1])
                    .map(([municipality, count]) => ({
                      name:
                        municipality.length > 25
                          ? municipality.substring(0, 25) + '...'
                          : municipality,
                      fullName: municipality,
                      students: count,
                    }))}
                >
                  <defs>
                    <linearGradient
                      id="colorMunicipality"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={1} />
                      <stop
                        offset="95%"
                        stopColor="#60a5fa"
                        stopOpacity={0.8}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontFamily: 'Poppins',
                      fontWeight: 400,
                    }}
                  />
                  <Bar
                    dataKey="students"
                    fill="url(#colorMunicipality)"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        )}

        {/* Barangays - Bar Chart - Full Width */}
        {Object.keys(analytics.locationBreakdown.barangay).length > 0 && (
          <div className="col-span-1 lg:col-span-2">
            <ChartCard
              title="Students by Barangay"
              icon={MapPin}
              insight={`Top barangay: ${
                Object.entries(analytics.locationBreakdown.barangay).sort(
                  (a, b) => b[1] - a[1]
                )[0]?.[0] || 'N/A'
              }.`}
              forecast="Barangay-level data helps identify local enrollment hotspots."
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={Object.entries(analytics.locationBreakdown.barangay)
                    .sort((a, b) => b[1] - a[1])
                    .map(([barangay, count]) => ({
                      name:
                        barangay.length > 25
                          ? barangay.substring(0, 25) + '...'
                          : barangay,
                      fullName: barangay,
                      students: count,
                    }))}
                >
                  <defs>
                    <linearGradient
                      id="colorBarangay"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#1e40af" stopOpacity={1} />
                      <stop
                        offset="95%"
                        stopColor="#3b82f6"
                        stopOpacity={0.8}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontFamily: 'Poppins',
                      fontWeight: 400,
                    }}
                  />
                  <Bar
                    dataKey="students"
                    fill="url(#colorBarangay)"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        )}

        {/* Previous School Type Distribution - Bar Chart - Full Width */}
        {previousSchoolTypeChartData.length > 0 && (
          <div className="col-span-1 lg:col-span-2">
            <ChartCard
              title="Previous School Type Distribution"
              icon={GraduationCap}
              insight={`Most common school type: ${
                previousSchoolTypeChartData.sort(
                  (a, b) => b.students - a.students
                )[0]?.name || 'N/A'
              }.`}
              forecast="School type distribution reflects student background diversity."
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={previousSchoolTypeChartData}>
                  <defs>
                    <linearGradient
                      id="colorPreviousSchoolType"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#1e40af" stopOpacity={1} />
                      <stop
                        offset="95%"
                        stopColor="#60a5fa"
                        stopOpacity={0.8}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontFamily: 'Poppins',
                      fontWeight: 400,
                    }}
                  />
                  <Bar
                    dataKey="students"
                    fill="url(#colorPreviousSchoolType)"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        )}

        {/* Previous School Distribution - Bar Chart - Full Width */}
        {previousSchoolChartData.length > 0 && (
          <div className="col-span-1 lg:col-span-2">
            <ChartCard
              title="Previous School Distribution"
              icon={GraduationCap}
              insight={`Top previous school: ${
                previousSchoolChartData[0]?.fullName || 'N/A'
              }.`}
              forecast="Previous school data helps identify feeder schools and recruitment opportunities."
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={previousSchoolChartData}>
                  <defs>
                    <linearGradient
                      id="colorPreviousSchool"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={1} />
                      <stop
                        offset="95%"
                        stopColor="#93c5fd"
                        stopOpacity={0.8}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontFamily: 'Poppins',
                      fontWeight: 400,
                    }}
                  />
                  <Bar
                    dataKey="students"
                    fill="url(#colorPreviousSchool)"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        )}
      </div>

      {/* Print Modal */}
      {showPrintModal && (
        <Print
          title="Analytics Dashboard"
          onClose={() => setShowPrintModal(false)}
        >
          {/* Print Header */}
          <div className="print-header mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <Image
                  src="/logo.png"
                  alt="School Logo"
                  width={64}
                  height={64}
                  className="object-contain"
                />
                <div>
                  <h1
                    className="text-xl font-medium text-gray-900"
                    style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                  >
                    Analytics & Reports
                  </h1>
                  <p
                    className="text-sm text-gray-600"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    {selectedAY}
                    {selectedSemester && ` - Semester ${selectedSemester}`}
                  </p>
                  <p
                    className="text-xs text-gray-500"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    Generated: {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Print Content */}
          <div className="space-y-6">
            <div className="print-section">
              <h3
                className="text-lg font-medium text-gray-900 mb-4"
                style={{ fontFamily: 'Poppins', fontWeight: 500 }}
              >
                Total Students: {totalStudents}
              </h3>
            </div>

            {/* Print all analytics sections */}
            <PrintSection
              title="Students by Grade Level"
              data={analytics.studentsByGrade}
              formatKey={(key) => `Grade ${key}`}
            />

            <PrintSection
              title="Students by Strand"
              data={analytics.studentsByStrand}
              formatKey={(key) => key}
            />

            <PrintSection
              title="Students by Course"
              data={analytics.studentsByCourse}
              formatKey={(key) => key}
            />

            <div className="print-section">
              <h3
                className="text-base font-medium text-gray-900 mb-3"
                style={{ fontFamily: 'Poppins', fontWeight: 500 }}
              >
                Regular vs Irregular
              </h3>
              <table className="print-table">
                <tbody>
                  <tr>
                    <td>Regular</td>
                    <td>{analytics.regularVsIrregular.regular}</td>
                  </tr>
                  <tr>
                    <td>Irregular</td>
                    <td>{analytics.regularVsIrregular.irregular}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <PrintSection
              title="Religion Distribution"
              data={analytics.religionDistribution}
              formatKey={(key) => key}
            />

            <PrintSection
              title="Gender Distribution"
              data={analytics.genderDistribution}
              formatKey={(key) => key}
            />

            <PrintSection
              title="Previous School Type Distribution"
              data={analytics.previousSchoolType}
              formatKey={(key) => key}
            />

            <PrintSection
              title="Previous School Distribution"
              data={analytics.previousSchoolDistribution}
              formatKey={(key) => key}
            />
          </div>
        </Print>
      )}
    </div>
  )
}

// Chart Card Component with Insights
interface ChartCardProps {
  title: string
  icon: React.ElementType
  insight: string
  forecast: string
  children: React.ReactNode
}

const ChartCard: React.FC<ChartCardProps> = ({
  title,
  icon: Icon,
  insight,
  forecast,
  children,
}) => {
  return (
    <Card className="p-6 rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-blue-900 flex items-center justify-center">
          <Icon size={20} className="text-white" weight="fill" />
        </div>
        <h3
          className="text-lg font-medium text-gray-900"
          style={{ fontFamily: 'Poppins', fontWeight: 500 }}
        >
          {title}
        </h3>
      </div>
      <div className="mb-4">{children}</div>
      <div className="space-y-2 pt-4 border-t border-gray-100">
        <div className="flex items-start gap-2">
          <Lightbulb
            size={16}
            className="text-blue-900 mt-0.5 flex-shrink-0"
            weight="fill"
          />
          <p
            className="text-xs text-gray-600"
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            <span className="font-medium text-gray-900">Insight:</span>{' '}
            {insight}
          </p>
        </div>
        <div className="flex items-start gap-2">
          <TrendUp
            size={16}
            className="text-green-600 mt-0.5 flex-shrink-0"
            weight="fill"
          />
          <p
            className="text-xs text-gray-600"
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            <span className="font-medium text-gray-900">Forecast:</span>{' '}
            {forecast}
          </p>
        </div>
      </div>
    </Card>
  )
}

interface PrintSectionProps {
  title: string
  data: Record<string, number>
  formatKey: (key: string) => string
}

const PrintSection: React.FC<PrintSectionProps> = ({
  title,
  data,
  formatKey,
}) => {
  const sortedEntries = Object.entries(data).sort((a, b) => b[1] - a[1])

  if (sortedEntries.length === 0) return null

  return (
    <div className="print-section">
      <h3
        className="text-base font-medium text-gray-900 mb-3"
        style={{ fontFamily: 'Poppins', fontWeight: 500 }}
      >
        {title}
      </h3>
      <table className="print-table">
        <thead>
          <tr>
            <th>Category</th>
            <th>Count</th>
          </tr>
        </thead>
        <tbody>
          {sortedEntries.map(([key, value]) => (
            <tr key={key}>
              <td>{formatKey(key)}</td>
              <td>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
