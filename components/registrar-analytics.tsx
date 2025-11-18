'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { toast } from 'react-toastify'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  TrendUp,
  TrendDown,
  Lightbulb,
  FunnelSimple,
  X,
  MagnifyingGlass,
  WarningCircle,
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
  const [currentSemester, setCurrentSemester] = useState('1')
  const [selectedAY, setSelectedAY] = useState('')
  const [selectedSemester, setSelectedSemester] = useState('1')
  const [availableAYs, setAvailableAYs] = useState<string[]>([])
  const [showPrintModal, setShowPrintModal] = useState(false)
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

  // Counting animation hook
  const useCountUp = (end: number, duration: number = 2000) => {
    const [count, setCount] = useState(0)

    useEffect(() => {
      if (end === 0) {
        setCount(0)
        return
      }

      let startTime: number | null = null
      const startValue = 0

      const animate = (currentTime: number) => {
        if (startTime === null) startTime = currentTime
        const progress = Math.min((currentTime - startTime) / duration, 1)

        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4)
        const currentCount = Math.floor(
          startValue + (end - startValue) * easeOutQuart
        )

        setCount(currentCount)

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          setCount(end)
        }
      }

      requestAnimationFrame(animate)
    }, [end, duration])

    return count
  }

  const jhsCount = useCountUp(studentsByDepartment.jhs, 200)
  const shsCount = useCountUp(studentsByDepartment.shs, 200)
  const collegeCount = useCountUp(studentsByDepartment.college, 200)

  // Generate narrative insights and forecasts (20 words each)
  const generateInsights = useMemo(() => {
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
    const avgGradeEnrollment =
      gradeEntries.length > 0
        ? gradeEntries.reduce((sum, g) => sum + g.count, 0) /
          gradeEntries.length
        : 0

    // Grade Level Insight
    const gradeLevelInsight =
      gradeEntries.length > 0
        ? `Grade ${maxGrade.grade} leads with ${
            maxGrade.count
          } students. Distribution shows ${
            maxGrade.count > minGrade.count ? 'stronger' : 'balanced'
          } retention in upper grades. Strategic resource allocation should prioritize high-enrollment levels to maintain quality.`
        : 'No grade level data available.'

    const gradeLevelForecast =
      gradeEntries.length > 0
        ? `Projected ${Math.round(avgGradeEnrollment * 0.1)} to ${Math.round(
            avgGradeEnrollment * 0.15
          )} student increase next year. Upper grades will continue strong enrollment. Lower grades may need targeted recruitment efforts.`
        : 'Forecasting requires enrollment data.'

    // Strand Insight
    const strandEntries = Object.entries(analytics.studentsByStrand)
    const topStrand = strandEntries.sort((a, b) => b[1] - a[1])[0]
    const strandInsight =
      strandEntries.length > 0
        ? `${topStrand?.[0] || 'Various'} strand leads with ${
            topStrand?.[1] || 0
          } students. Distribution reflects career interests and market demands. Academic counseling should align with preferences to support student success.`
        : 'No strand data available.'

    const strandForecast =
      strandEntries.length > 0
        ? `${
            topStrand?.[0] || 'Leading strands'
          } will maintain strong enrollment. Market-driven programs expected to see ${Math.round(
            (topStrand?.[1] || 0) * 0.1
          )} additional students. Strategic partnerships will attract more students.`
        : 'Forecasting requires strand data.'

    // Course Insight
    const courseEntries = Object.entries(analytics.studentsByCourse)
    const topCourse = courseEntries.sort((a, b) => b[1] - a[1])[0]
    const courseInsight =
      courseEntries.length > 0
        ? `${topCourse?.[0] || 'Various'} course leads with ${
            topCourse?.[1] || 0
          } students. Reflects strong demand for professional programs. Faculty allocation should prioritize high-enrollment courses to maintain quality.`
        : 'No course data available.'

    const courseForecast =
      courseEntries.length > 0
        ? `${
            topCourse?.[0] || 'Leading courses'
          } will continue strong enrollment. Technical programs expected ${Math.round(
            (topCourse?.[1] || 0) * 0.12
          )} additional students. Industry partnerships will attract more applicants.`
        : 'Forecasting requires course data.'

    // Regular vs Irregular Insight
    const regularIrregularInsight =
      totalStudents > 0
        ? `${totalRegular} regular (${(
            100 - parseFloat(irregularPercentage)
          ).toFixed(
            1
          )}%) and ${totalIrregular} irregular (${irregularPercentage}%) students. ${
            parseFloat(irregularPercentage) < 10
              ? 'Low'
              : parseFloat(irregularPercentage) < 25
              ? 'Moderate'
              : 'High'
          } irregular ratio ${
            parseFloat(irregularPercentage) < 10
              ? 'indicates strong progression'
              : 'requires support systems'
          }. Academic advisors should monitor closely.`
        : 'No student type data available.'

    const regularIrregularForecast =
      totalStudents > 0
        ? `Irregular ratio projected to ${
            parseFloat(irregularPercentage) < 15
              ? 'remain stable'
              : 'slightly decrease'
          } with improved support. Anticipate ${Math.round(
            totalIrregular * 0.95
          )} to ${Math.round(
            totalIrregular * 1.05
          )} irregular students next year. Enhanced guidance will help reduce cases.`
        : 'Forecasting requires student type data.'

    // Gender Insight
    const genderInsight =
      genderEntries.length > 0
        ? `${topGender?.[0] || 'Various'} represents ${(
            ((topGender?.[1] || 0) / totalStudents) *
            100
          ).toFixed(1)}% of enrollment. ${
            Math.abs(
              (topGender?.[1] || 0) - totalStudents / genderEntries.length
            ) <
            totalStudents * 0.1
              ? 'Balanced'
              : 'Varied'
          } distribution ${
            Math.abs(
              (topGender?.[1] || 0) - totalStudents / genderEntries.length
            ) <
            totalStudents * 0.1
              ? 'reflects equitable access'
              : 'needs targeted recruitment'
          }.`
        : 'No gender data available.'

    const genderForecast =
      genderEntries.length > 0
        ? `Gender distribution expected to remain ${
            Math.abs(
              (topGender?.[1] || 0) - totalStudents / genderEntries.length
            ) <
            totalStudents * 0.1
              ? 'stable'
              : 'consistent'
          } next year. Projected growth of ${Math.round(
            totalStudents * 0.1
          )} students should maintain similar ratios. Recruitment will target equitable participation.`
        : 'Forecasting requires gender data.'

    // Religion Insight
    const religionEntries = Object.entries(analytics.religionDistribution).sort(
      (a, b) => b[1] - a[1]
    )
    const topReligion = religionEntries[0]
    const religionInsight =
      religionEntries.length > 0
        ? `${religionEntries.length} faith backgrounds represented. ${
            topReligion?.[0] || 'Various'
          } leads with ${topReligion?.[1] || 0} students (${(
            ((topReligion?.[1] || 0) / totalStudents) *
            100
          ).toFixed(1)}%). Diversity ${
            religionEntries.length > 3 ? 'enriches' : 'reflects'
          } campus community. Policies should respect all backgrounds.`
        : 'No religion data available.'

    const religionForecast =
      religionEntries.length > 0
        ? `Religious diversity projected to remain consistent. As enrollment grows ${Math.round(
            totalStudents * 0.1
          )} students, representation should maintain similar proportions. ${
            topReligion?.[0] || 'Major groups'
          } will continue as largest segments. Interfaith dialogue supports inclusive environment.`
        : 'Forecasting requires religion data.'

    // Age Insight
    const ageInsight =
      analytics.birthdateRange.min && analytics.birthdateRange.max
        ? `Students range from ${new Date(
            analytics.birthdateRange.min
          ).getFullYear()} to ${new Date(
            analytics.birthdateRange.max
          ).getFullYear()} birth years. ${
            Object.entries(analytics.birthdateRange.ageGroups).sort(
              (a, b) => b[1] - a[1]
            )[0]?.[0] || 'Various'
          } age group represents largest segment. Distribution reflects typical enrollment patterns.`
        : 'No age data available.'

    const ageForecast =
      analytics.birthdateRange.min && analytics.birthdateRange.max
        ? `Age distribution expected to remain consistent. Projected growth of ${Math.round(
            totalStudents * 0.1
          )} students will follow similar patterns. ${
            Object.entries(analytics.birthdateRange.ageGroups).sort(
              (a, b) => b[1] - a[1]
            )[0]?.[0] || 'Primary'
          } age groups will continue as majority.`
        : 'Forecasting requires age data.'

    // Location Insights
    const provinceEntries = Object.entries(
      analytics.locationBreakdown.province
    ).sort((a, b) => b[1] - a[1])
    const topProvinceData = provinceEntries[0]
    const provinceInsight =
      provinceEntries.length > 0
        ? `${provinceEntries.length} provinces represented. ${
            topProvinceData?.[0] || 'Various'
          } leads with ${topProvinceData?.[1] || 0} students (${(
            ((topProvinceData?.[1] || 0) / totalStudents) *
            100
          ).toFixed(1)}%). ${
            topProvinceData && topProvinceData[1] > totalStudents * 0.4
              ? 'Strong local enrollment'
              : 'Regional diversity'
          } demonstrates ${
            provinceEntries.length > 5 ? 'broad' : 'institutional'
          } reach.`
        : 'No province data available.'

    const provinceForecast =
      provinceEntries.length > 0
        ? `Geographic patterns projected to remain stable. ${
            topProvinceData?.[0] || 'Primary regions'
          } will continue as largest segments. Growth of ${Math.round(
            totalStudents * 0.1
          )} students maintains similar ratios. Strategic partnerships support continued growth.`
        : 'Forecasting requires province data.'

    const municipalityEntries = Object.entries(
      analytics.locationBreakdown.municipality
    ).sort((a, b) => b[1] - a[1])
    const topMunicipality = municipalityEntries[0]
    const municipalityInsight =
      municipalityEntries.length > 0
        ? `${municipalityEntries.length} municipalities represented. ${
            topMunicipality?.[0] || 'Various'
          } leads with ${topMunicipality?.[1] || 0} students. ${
            municipalityEntries.length > 10 ? 'Wide' : 'Varied'
          } distribution ${
            topMunicipality && topMunicipality[1] > totalStudents * 0.2
              ? 'indicates strong local engagement'
              : 'demonstrates regional reach'
          }.`
        : 'No municipality data available.'

    const municipalityForecast =
      municipalityEntries.length > 0
        ? `Municipal patterns expected to remain consistent. ${
            topMunicipality?.[0] || 'Leading municipalities'
          } will continue significant contributions. Growth of ${Math.round(
            totalStudents * 0.1
          )} students maintains proportions. Targeted outreach supports diversity.`
        : 'Forecasting requires municipality data.'

    const barangayEntries = Object.entries(
      analytics.locationBreakdown.barangay
    ).sort((a, b) => b[1] - a[1])
    const topBarangay = barangayEntries[0]
    const barangayInsight =
      barangayEntries.length > 0
        ? `${barangayEntries.length} barangays represented. ${
            topBarangay?.[0] || 'Various'
          } leads with ${topBarangay?.[1] || 0} students. ${
            barangayEntries.length > 20 ? 'Extensive' : 'Varied'
          } distribution demonstrates deep community penetration. Data helps identify high-enrollment communities.`
        : 'No barangay data available.'

    const barangayForecast =
      barangayEntries.length > 0
        ? `Barangay patterns projected to remain stable. ${
            topBarangay?.[0] || 'Leading barangays'
          } will continue strong enrollment. Growth of ${Math.round(
            totalStudents * 0.1
          )} students maintains similar patterns. Community-based recruitment supports diversity.`
        : 'Forecasting requires barangay data.'

    // Previous School Type Insight
    const schoolTypeEntries = Object.entries(analytics.previousSchoolType).sort(
      (a, b) => b[1] - a[1]
    )
    const topSchoolType = schoolTypeEntries[0]
    const schoolTypeInsight =
      schoolTypeEntries.length > 0
        ? `${schoolTypeEntries.length} school types represented. ${
            topSchoolType?.[0] || 'Various'
          } most common with ${topSchoolType?.[1] || 0} students (${(
            ((topSchoolType?.[1] || 0) / totalStudents) *
            100
          ).toFixed(
            1
          )}%). Distribution reflects diverse educational pathways. Understanding patterns helps tailor support programs.`
        : 'No school type data available.'

    const schoolTypeForecast =
      schoolTypeEntries.length > 0
        ? `School type distribution expected to remain consistent. ${
            topSchoolType?.[0] || 'Primary types'
          } will continue as largest segments. Growth of ${Math.round(
            totalStudents * 0.1
          )} students maintains similar ratios. Strategic partnerships strengthen enrollment pipelines.`
        : 'Forecasting requires school type data.'

    // Previous School Insight
    const schoolEntries = Object.entries(
      analytics.previousSchoolDistribution
    ).sort((a, b) => b[1] - a[1])
    const topSchool = schoolEntries[0]
    const schoolInsight =
      schoolEntries.length > 0
        ? `${schoolEntries.length} feeder schools identified. ${
            topSchool?.[0] || 'Various'
          } leads with ${topSchool?.[1] || 0} students. ${
            schoolEntries.length > 10 ? 'Extensive' : 'Varied'
          } distribution ${
            topSchool && topSchool[1] > 3
              ? 'indicates strong partnerships'
              : 'demonstrates broad reach'
          }.`
        : 'No previous school data available.'

    const schoolForecast =
      schoolEntries.length > 0
        ? `Feeder school patterns projected to remain stable. ${
            topSchool?.[0] || 'Leading schools'
          } will continue sending significant students. Growth of ${Math.round(
            totalStudents * 0.1
          )} students maintains similar proportions. Strategic partnerships strengthen enrollment pipelines.`
        : 'Forecasting requires previous school data.'

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

  // Skeleton Loader Component
  const SkeletonLoader = () => {
    return (
      <div className="p-6 space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 animate-pulse rounded"></div>
            <div className="space-y-2">
              <div className="h-6 bg-gray-200 animate-pulse rounded w-48"></div>
              <div className="h-4 bg-gray-100 animate-pulse rounded w-64"></div>
            </div>
          </div>
          <div className="h-10 w-40 bg-gray-200 animate-pulse rounded-lg"></div>
        </div>

        {/* Search and Filter Skeleton */}
        <div className="bg-white p-6 border border-gray-200 rounded-xl shadow-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="h-10 w-full sm:w-96 bg-gray-200 animate-pulse rounded-lg"></div>
            <div className="h-10 w-24 bg-gray-200 animate-pulse rounded-lg"></div>
          </div>
        </div>

        {/* Department Cards Skeleton */}
        <div className="flex flex-wrap gap-4">
          {[1, 2, 3].map((i) => (
            <Card
              key={i}
              className="p-6 bg-white border border-gray-200 rounded-xl flex-[1_1_min(100%,_350px)]"
            >
              <div className="animate-pulse space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                    <div className="h-3 bg-gray-100 rounded w-24"></div>
                  </div>
                  <div className="w-14 h-14 bg-gray-200 rounded-xl"></div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Chart Cards Skeleton */}
        <div className="flex flex-wrap gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card
              key={i}
              className={`p-6 bg-white border border-gray-200 rounded-xl flex-[1_1_min(100%,_350px)] ${
                i <= 2 ? 'lg:flex-[1_1_100%]' : ''
              }`}
            >
              <div className="animate-pulse space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-64 bg-gray-200 rounded-lg"></div>
                </div>
                <div className="space-y-2 pt-4 border-t border-gray-100">
                  <div className="flex items-start gap-2">
                    <div className="w-4 h-4 bg-gray-200 rounded mt-0.5"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                      <div className="h-3 bg-gray-100 rounded w-full"></div>
                      <div className="h-3 bg-gray-100 rounded w-2/3"></div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-4 h-4 bg-gray-200 rounded mt-0.5"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-20"></div>
                      <div className="h-3 bg-gray-100 rounded w-full"></div>
                      <div className="h-3 bg-gray-100 rounded w-3/4"></div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const hasAnalyticsData = filteredEnrollments.length > 0
  const latestAvailableAY =
    availableAYs.length > 0 ? availableAYs[availableAYs.length - 1] : undefined
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
    gradeChartData.length > 0 &&
    matchesSearch('students by grade level distribution grade')
  const showStrandChart =
    strandChartData.length > 0 &&
    matchesSearch('students by strand shs track distribution')
  const showCourseChart =
    courseChartData.length > 0 &&
    matchesSearch('students by course college program year level')
  const showRegularIrregularChart =
    regularIrregularData.some((d) => d.value > 0) &&
    matchesSearch('regular irregular student type')
  const showGenderChart =
    genderChartData.length > 0 &&
    matchesSearch('gender distribution male female')
  const showReligionChart =
    Object.keys(analytics.religionDistribution).length > 0 &&
    matchesSearch('religion faith distribution')
  const showAgeChart =
    ageGroupChartData.length > 0 &&
    matchesSearch('age distribution birthdate demographics')
  const showProvinceChart =
    provinceChartData.length > 0 &&
    matchesSearch('province location distribution geography')
  const showMunicipalityChart =
    Object.keys(analytics.locationBreakdown.municipality).length > 0 &&
    matchesSearch('municipality town city location distribution geography')
  const showBarangayChart =
    Object.keys(analytics.locationBreakdown.barangay).length > 0 &&
    matchesSearch('barangay village location distribution geography')
  const showSchoolTypeChart =
    previousSchoolTypeChartData.length > 0 &&
    matchesSearch('previous school type distribution')
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

  if (loading) {
    return <SkeletonLoader />
  }

  return (
    <div className="p-6 space-y-6" style={{ fontFamily: 'Poppins' }}>
      {/* Header */}
      <div className="space-y-4">
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
          <Button
            onClick={() => setShowPrintModal(true)}
            className="rounded-lg bg-blue-900 text-white hover:bg-blue-900 flex items-center gap-2"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            <Printer size={18} weight="fill" />
            Print Dashboard
          </Button>
        </div>

        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search analytics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-4 py-2 w-full border-blue-900"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-2 ${
                  selectedAY ||
                  selectedSemester ||
                  selectedStudentType.length > 0 ||
                  selectedLevel.length > 0
                    ? 'bg-gradient-to-br from-blue-800 to-blue-900 text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-900'
                }`}
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                <FunnelSimple size={16} weight="bold" />
                Filter
                {(selectedAY ||
                  selectedSemester ||
                  selectedStudentType.length > 0 ||
                  selectedLevel.length > 0) && (
                  <span className="w-2 h-2 bg-white rounded-full"></span>
                )}
              </button>

              {/* Filter Dropdown */}
              {showFilterDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowFilterDropdown(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-96 bg-white border border-gray-200 shadow-lg rounded-xl z-20 p-6">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3
                          className="text-sm font-medium text-gray-900"
                          style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                        >
                          Filter Options
                        </h3>
                        <button
                          onClick={() => setShowFilterDropdown(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      {/* Academic Year Filter */}
                      <div>
                        <label
                          className="text-xs text-gray-700 mb-2 block"
                          style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                        >
                          Academic Year
                        </label>
                        <div className="flex items-center gap-2 flex-wrap">
                          {availableAYs.length > 0 ? (
                            availableAYs.map((ay) => (
                              <button
                                key={ay}
                                onClick={() => setSelectedAY(ay)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                                  selectedAY === ay
                                    ? 'bg-gradient-to-br from-blue-800 to-blue-900 text-white shadow-md'
                                    : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-900'
                                }`}
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 400,
                                }}
                              >
                                {ay}
                              </button>
                            ))
                          ) : (
                            <button
                              onClick={() => setSelectedAY(currentAY)}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                                selectedAY === currentAY
                                  ? 'bg-gradient-to-br from-blue-800 to-blue-900 text-white shadow-md'
                                  : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-900'
                              }`}
                              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                            >
                              {currentAY || 'Select AY'}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Semester Filter */}
                      <div>
                        <label
                          className="text-xs text-gray-700 mb-2 block"
                          style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                        >
                          Semester
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedSemester('1')}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                              selectedSemester === '1'
                                ? 'bg-gradient-to-br from-blue-800 to-blue-900 text-white shadow-md'
                                : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-900'
                            }`}
                            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                          >
                            Semester 1
                          </button>
                          <button
                            onClick={() => setSelectedSemester('2')}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                              selectedSemester === '2'
                                ? 'bg-gradient-to-br from-blue-800 to-blue-900 text-white shadow-md'
                                : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-900'
                            }`}
                            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                          >
                            Semester 2
                          </button>
                        </div>
                      </div>

                      {/* Student Type Filter */}
                      <div>
                        <label
                          className="text-xs text-gray-700 mb-2 block"
                          style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                        >
                          Student Type
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { key: 'regular', label: 'Regular' },
                            { key: 'irregular', label: 'Irregular' },
                          ].map((option) => {
                            const isSelected = selectedStudentType.includes(
                              option.key as 'regular' | 'irregular'
                            )
                            return (
                              <button
                                key={option.key}
                                onClick={() => {
                                  if (isSelected) {
                                    setSelectedStudentType(
                                      selectedStudentType.filter(
                                        (t) => t !== option.key
                                      )
                                    )
                                  } else {
                                    setSelectedStudentType([
                                      ...selectedStudentType,
                                      option.key as 'regular' | 'irregular',
                                    ])
                                  }
                                }}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                                  isSelected
                                    ? 'bg-gradient-to-br from-blue-800 to-blue-900 text-white shadow-md'
                                    : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-900'
                                }`}
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 400,
                                }}
                              >
                                {option.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Level/Department Filter */}
                      <div>
                        <label
                          className="text-xs text-gray-700 mb-2 block"
                          style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                        >
                          Level/Department
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { key: 'college', label: 'College' },
                            { key: 'senior', label: 'Senior' },
                            { key: 'junior', label: 'Junior' },
                          ].map((option) => {
                            const isSelected = selectedLevel.includes(
                              option.key as 'college' | 'senior' | 'junior'
                            )
                            return (
                              <button
                                key={option.key}
                                onClick={() => {
                                  if (isSelected) {
                                    setSelectedLevel(
                                      selectedLevel.filter(
                                        (t) => t !== option.key
                                      )
                                    )
                                  } else {
                                    setSelectedLevel([
                                      ...selectedLevel,
                                      option.key as
                                        | 'college'
                                        | 'senior'
                                        | 'junior',
                                    ])
                                  }
                                }}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                                  isSelected
                                    ? 'bg-gradient-to-br from-blue-800 to-blue-900 text-white shadow-md'
                                    : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-900'
                                }`}
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 400,
                                }}
                              >
                                {option.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Clear Filters */}
                      {(selectedAY ||
                        selectedSemester ||
                        selectedStudentType.length > 0 ||
                        selectedLevel.length > 0) && (
                        <button
                          onClick={() => {
                            setSelectedAY(currentAY)
                            setSelectedSemester(currentSemester || '1')
                            setSelectedStudentType([])
                            setSelectedLevel([])
                          }}
                          className="w-full px-3 py-2 text-xs text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                        >
                          Reset Filters
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {fallbackAYInfo && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          <p style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
            No enrollments were found for{' '}
            <span className="font-semibold">{fallbackAYInfo.requested}</span>.
            Displaying data for{' '}
            <span className="font-semibold">{fallbackAYInfo.actual}</span>{' '}
            instead.
          </p>
        </div>
      )}

      {!hasAnalyticsData ? (
        <Card className="w-full p-10 border border-gray-200 text-center bg-white shadow-sm rounded-xl">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-800 to-blue-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <WarningCircle size={32} className="text-white" weight="fill" />
          </div>
          <h3
            className="text-lg font-medium text-gray-900 mb-2"
            style={{ fontFamily: 'Poppins', fontWeight: 500 }}
          >
            No analytics available
          </h3>
          <p
            className="text-sm text-gray-600 mb-6 max-w-2xl mx-auto"
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            There are no enrolled students that match the selected academic
            year, semester, or filters. Try switching to another academic year
            or reload the dataset once new enrollments are available.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              onClick={() => loadData()}
              className="rounded-lg bg-gradient-to-br from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 text-white"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Reload data
            </Button>
            {latestAvailableAY && selectedAY !== latestAvailableAY && (
              <Button
                variant="outline"
                onClick={() => setSelectedAY(latestAvailableAY)}
                className="rounded-lg border-blue-200 text-blue-900 hover:bg-blue-50"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Show latest AY ({latestAvailableAY})
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <>
          {/* Total Students by Department */}
          {showSummaryCards && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Junior High School */}
              {showJHSCard && (
                <Card className="p-6 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p
                        className="text-sm text-gray-600 mb-1"
                        style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                      >
                        Junior High School
                      </p>
                      <p
                        className="text-3xl font-medium text-gray-900"
                        style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                      >
                        {jhsCount}
                      </p>
                      <p
                        className="text-xs text-gray-500 mt-1"
                        style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                      >
                        Grades 7-10
                      </p>
                    </div>
                    <div className="w-14 h-14 rounded-xl bg-blue-800 flex items-center justify-center">
                      <GraduationCap
                        size={24}
                        className="text-white"
                        weight="fill"
                      />
                    </div>
                  </div>
                </Card>
              )}

              {/* Senior High School */}
              {showSHSCard && (
                <Card className="p-6 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p
                        className="text-sm text-gray-600 mb-1"
                        style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                      >
                        Senior High School
                      </p>
                      <p
                        className="text-3xl font-medium text-gray-900"
                        style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                      >
                        {shsCount}
                      </p>
                      <p
                        className="text-xs text-gray-500 mt-1"
                        style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                      >
                        Grades 11-12
                      </p>
                    </div>
                    <div className="w-14 h-14 rounded-xl bg-blue-800 flex items-center justify-center">
                      <BookOpen
                        size={24}
                        className="text-white"
                        weight="fill"
                      />
                    </div>
                  </div>
                </Card>
              )}

              {/* College Department */}
              {showCollegeCard && (
                <Card className="p-6 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p
                        className="text-sm text-gray-600 mb-1"
                        style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                      >
                        College Department
                      </p>
                      <p
                        className="text-3xl font-medium text-gray-900"
                        style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                      >
                        {collegeCount}
                      </p>
                      <p
                        className="text-xs text-gray-500 mt-1"
                        style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                      >
                        Year 1-4
                      </p>
                    </div>
                    <div className="w-14 h-14 rounded-xl bg-blue-800 flex items-center justify-center">
                      <ChartBar
                        size={24}
                        className="text-white"
                        weight="fill"
                      />
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Analytics Grid - Max 2 columns per row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Students by Grade Level - Bar Chart - Full Width */}
            {showGradeChart && (
              <div className="col-span-1 lg:col-span-2">
                <ChartCard
                  title="Students by Grade Level"
                  icon={GraduationCap}
                  insight={generateInsights.gradeLevelInsight}
                  forecast={generateInsights.gradeLevelForecast}
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={gradeChartData}>
                      <defs>
                        <linearGradient
                          id="colorGrade"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#1e40af"
                            stopOpacity={1}
                          />
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
            {showStrandChart && (
              <div className="col-span-1 lg:col-span-2">
                <ChartCard
                  title="Students by Strand"
                  icon={BookOpen}
                  insight={generateInsights.strandInsight}
                  forecast={generateInsights.strandForecast}
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
                          <stop
                            offset="5%"
                            stopColor="#3b82f6"
                            stopOpacity={1}
                          />
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
            {showCourseChart && (
              <div className="col-span-1 lg:col-span-2">
                <ChartCard
                  title="Students by Course"
                  icon={ChartBar}
                  insight={generateInsights.courseInsight}
                  forecast={generateInsights.courseForecast}
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
                          <stop
                            offset="5%"
                            stopColor="#1e40af"
                            stopOpacity={1}
                          />
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
            {showRegularIrregularChart && (
              <div className="col-span-1 lg:col-span-2">
                <ChartCard
                  title="Regular vs Irregular"
                  icon={Users}
                  insight={generateInsights.regularIrregularInsight}
                  forecast={generateInsights.regularIrregularForecast}
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
                          <stop
                            offset="5%"
                            stopColor="#1e40af"
                            stopOpacity={1}
                          />
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
                        dataKey="value"
                        fill="url(#colorRegularIrregular)"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
            )}

            {/* Gender Distribution - Pie Chart */}
            {showGenderChart && (
              <div className="col-span-1 lg:col-span-2">
                <ChartCard
                  title="Gender Distribution"
                  icon={GenderIntersex}
                  insight={generateInsights.genderInsight}
                  forecast={generateInsights.genderForecast}
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
              </div>
            )}

            {/* Religion Distribution - Bar Chart - Full Width */}
            {showReligionChart && (
              <div className="col-span-1 lg:col-span-2">
                <ChartCard
                  title="Religion Distribution"
                  icon={MapPin}
                  insight={generateInsights.religionInsight}
                  forecast={generateInsights.religionForecast}
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
                          <stop
                            offset="5%"
                            stopColor="#3b82f6"
                            stopOpacity={1}
                          />
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
            {showAgeChart && (
              <div className="col-span-1 lg:col-span-2">
                <ChartCard
                  title="Age Distribution"
                  icon={Calendar}
                  insight={generateInsights.ageInsight}
                  forecast={generateInsights.ageForecast}
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={ageGroupChartData}>
                      <defs>
                        <linearGradient
                          id="colorAge"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#1e40af"
                            stopOpacity={1}
                          />
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
            {showProvinceChart && (
              <div className="col-span-1 lg:col-span-2">
                <ChartCard
                  title="Students by Province"
                  icon={MapPin}
                  insight={generateInsights.provinceInsight}
                  forecast={generateInsights.provinceForecast}
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
                          <stop
                            offset="5%"
                            stopColor="#60a5fa"
                            stopOpacity={1}
                          />
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
            {showMunicipalityChart && (
              <div className="col-span-1 lg:col-span-2">
                <ChartCard
                  title="Students by Municipality"
                  icon={MapPin}
                  insight={generateInsights.municipalityInsight}
                  forecast={generateInsights.municipalityForecast}
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={Object.entries(
                        analytics.locationBreakdown.municipality
                      )
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
                          <stop
                            offset="5%"
                            stopColor="#3b82f6"
                            stopOpacity={1}
                          />
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
            {showBarangayChart && (
              <div className="col-span-1 lg:col-span-2">
                <ChartCard
                  title="Students by Barangay"
                  icon={MapPin}
                  insight={generateInsights.barangayInsight}
                  forecast={generateInsights.barangayForecast}
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
                          <stop
                            offset="5%"
                            stopColor="#1e40af"
                            stopOpacity={1}
                          />
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
            {showSchoolTypeChart && (
              <div className="col-span-1 lg:col-span-2">
                <ChartCard
                  title="Previous School Type Distribution"
                  icon={GraduationCap}
                  insight={generateInsights.schoolTypeInsight}
                  forecast={generateInsights.schoolTypeForecast}
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
                          <stop
                            offset="5%"
                            stopColor="#1e40af"
                            stopOpacity={1}
                          />
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
            {showPreviousSchoolChart && (
              <div className="col-span-1 lg:col-span-2">
                <ChartCard
                  title="Previous School Distribution"
                  icon={GraduationCap}
                  insight={generateInsights.schoolInsight}
                  forecast={generateInsights.schoolForecast}
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
                          <stop
                            offset="5%"
                            stopColor="#3b82f6"
                            stopOpacity={1}
                          />
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

          {searchActive && !hasSearchMatches && (
            <Card className="w-full p-8 border border-gray-200 text-center bg-white shadow-sm rounded-xl">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-800 to-blue-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MagnifyingGlass
                  size={24}
                  className="text-white"
                  weight="bold"
                />
              </div>
              <h3
                className="text-lg font-medium text-gray-900 mb-2"
                style={{ fontFamily: 'Poppins', fontWeight: 500 }}
              >
                No analytics match your search
              </h3>
              <p
                className="text-sm text-gray-600"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                Try a different keyword or clear the search box to view all
                analytics again.
              </p>
            </Card>
          )}
        </>
      )}

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
            style={{ fontFamily: 'monospace', fontWeight: 400 }}
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
            style={{ fontFamily: 'monospace', fontWeight: 400 }}
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
