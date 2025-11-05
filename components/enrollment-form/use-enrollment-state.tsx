'use client'

import { useState, useEffect, useRef } from 'react'
import { GradeData } from '@/lib/grade-section-database'

export interface EnrollmentState {
  // Basic props/state
  userId: string
  grades: GradeData[]
  loading: boolean
  selectedGrade: GradeData | null
  selectedCourse: any | null
  selectedLevel: 'high-school' | 'college' | null
  selectedYear: number | null
  selectedSemester: 'first-sem' | 'second-sem' | null
  complianceChecked: boolean
  currentStep: 'compliance' | 're-enroll' | 'level-selection' | 'grade-selection' | 'course-selection' | 'year-selection' | 'semester-selection' | 'personal-info' | 'confirmation'
  animatingStep: boolean
  selectingGrade: string | null
  enrolling: boolean
  calculatedAge: number | null
  showDataPreserved: boolean

  // Enrollment state
  existingEnrollment: any
  submittedEnrollment: any
  checkingEnrollment: boolean
  showDeleteModal: boolean
  deletingEnrollment: boolean
  deleteCountdown: number

  // Student type and modals
  studentType: 'regular' | 'irregular' | null
  showIrregularModal: boolean
  showCourseChangeModal: boolean
  pendingCourse: any

  // Documents
  documentsStatus: {
    uploaded: number
    required: number
    isComplete: boolean
    uploadedDocuments?: any[]
  } | null
  checkingDocuments: boolean

  // Courses and subjects
  courses: any[]
  loadingCourses: boolean
  subjects: any[]
  loadingSubjects: boolean
  subjectsCarouselIndex: number

  // Modals
  submitModalOpen: boolean
  countdown: number

  // Re-enrollment
  previousEnrollment: any
  checkingPreviousEnrollment: boolean
  isReEnrolling: boolean
  reEnrollSemester: 'first-sem' | 'second-sem' | null

  // Enrollment durations
  enrollmentStartPeriodHS: string | null
  enrollmentEndPeriodHS: string | null
  enrollmentStartPeriodCollege: string | null
  enrollmentEndPeriodCollege: string | null
  loadingEnrollmentDurations: boolean
  currentSystemSemester: string | null

  // Personal info
  personalInfo: {
    firstName: string
    middleName: string
    lastName: string
    nameExtension: string
    email: string
    phone: string
    birthMonth: string
    birthDay: string
    birthYear: string
    placeOfBirth: string
    gender: string
    citizenship: string
    religion: string
    civilStatus: string
  }

  // Props
  onProgressUpdate?: () => void

  // Utility functions
  isEnrollmentAvailable: (level: 'high-school' | 'college') => boolean
  getEnrollmentPeriodMessage: (level: 'high-school' | 'college') => string | null
  getEnrollmentDaysRemaining: (level: 'high-school' | 'college') => number | null
  getEnrollmentProgress: (level: 'high-school' | 'college') => number
  loadGrades: () => Promise<void>
  loadCourses: () => Promise<void>
}

export interface EnrollmentActions {
  // State setters
  setGrades: (grades: GradeData[]) => void
  setLoading: (loading: boolean) => void
  setSelectedGrade: (grade: GradeData | null) => void
  setSelectedCourse: (course: any | null) => void
  setSelectedLevel: (level: 'high-school' | 'college' | null) => void
  setSelectedYear: (year: number | null) => void
  setSelectedSemester: (semester: 'first-sem' | 'second-sem' | null) => void
  setComplianceChecked: (checked: boolean) => void
  setCurrentStep: (step: EnrollmentState['currentStep']) => void
  setAnimatingStep: (animating: boolean) => void
  setSelectingGrade: (gradeId: string | null) => void
  setEnrolling: (enrolling: boolean) => void
  setCalculatedAge: (age: number | null) => void
  setShowDataPreserved: (show: boolean) => void

  // Enrollment setters
  setExistingEnrollment: (enrollment: any) => void
  setSubmittedEnrollment: (enrollment: any) => void
  setCheckingEnrollment: (checking: boolean) => void
  setShowDeleteModal: (show: boolean) => void
  setDeletingEnrollment: (deleting: boolean) => void
  setDeleteCountdown: (count: number) => void

  // Student type and modals
  setStudentType: (type: 'regular' | 'irregular' | null) => void
  setShowIrregularModal: (show: boolean) => void
  setShowCourseChangeModal: (show: boolean) => void
  setPendingCourse: (course: any) => void

  // Documents
  setDocumentsStatus: (status: EnrollmentState['documentsStatus']) => void
  setCheckingDocuments: (checking: boolean) => void

  // Courses and subjects
  setCourses: (courses: any[]) => void
  setLoadingCourses: (loading: boolean) => void
  setSubjects: (subjects: any[]) => void
  setLoadingSubjects: (loading: boolean) => void
  setSubjectsCarouselIndex: (index: number) => void

  // Modals
  setSubmitModalOpen: (open: boolean) => void
  setCountdown: (count: number) => void

  // Re-enrollment
  setPreviousEnrollment: (enrollment: any) => void
  setCheckingPreviousEnrollment: (checking: boolean) => void
  setIsReEnrolling: (reEnrolling: boolean) => void
  setReEnrollSemester: (semester: 'first-sem' | 'second-sem' | null) => void

  // Enrollment durations
  setEnrollmentStartPeriodHS: (period: string | null) => void
  setEnrollmentEndPeriodHS: (period: string | null) => void
  setEnrollmentStartPeriodCollege: (period: string | null) => void
  setEnrollmentEndPeriodCollege: (period: string | null) => void
  setLoadingEnrollmentDurations: (loading: boolean) => void
  setCurrentSystemSemester: (semester: string | null) => void

  // Personal info
  setPersonalInfo: (info: EnrollmentState['personalInfo']) => void
}

export function useEnrollmentState(userId: string, userProfile: any, onProgressUpdate?: () => void): EnrollmentState & EnrollmentActions {
  // Basic state
  const [grades, setGrades] = useState<GradeData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGrade, setSelectedGrade] = useState<GradeData | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null)
  const [selectedLevel, setSelectedLevel] = useState<'high-school' | 'college' | null>(null)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [selectedSemester, setSelectedSemester] = useState<'first-sem' | 'second-sem' | null>(null)
  const [complianceChecked, setComplianceChecked] = useState(false)
  const [currentStep, setCurrentStep] = useState<EnrollmentState['currentStep']>('compliance')
  const [animatingStep, setAnimatingStep] = useState(false)
  const [selectingGrade, setSelectingGrade] = useState<string | null>(null)
  const [enrolling, setEnrolling] = useState(false)
  const [calculatedAge, setCalculatedAge] = useState<number | null>(null)
  const [showDataPreserved, setShowDataPreserved] = useState(false)

  // Enrollment state
  const [existingEnrollment, setExistingEnrollment] = useState<any>(null)
  const [submittedEnrollment, setSubmittedEnrollment] = useState<any>(null)
  const [checkingEnrollment, setCheckingEnrollment] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingEnrollment, setDeletingEnrollment] = useState(false)
  const [deleteCountdown, setDeleteCountdown] = useState(0)

  // Student type and modals
  const [studentType, setStudentType] = useState<'regular' | 'irregular' | null>(null)
  const [showIrregularModal, setShowIrregularModal] = useState(false)
  const [showCourseChangeModal, setShowCourseChangeModal] = useState(false)
  const [pendingCourse, setPendingCourse] = useState<any>(null)

  // Documents
  const [documentsStatus, setDocumentsStatus] = useState<EnrollmentState['documentsStatus']>(null)
  const [checkingDocuments, setCheckingDocuments] = useState(true)

  // Courses and subjects
  const [courses, setCourses] = useState<any[]>([])
  const [loadingCourses, setLoadingCourses] = useState(false)
  const [subjects, setSubjects] = useState<any[]>([])
  const [loadingSubjects, setLoadingSubjects] = useState(true)
  const [subjectsCarouselIndex, setSubjectsCarouselIndex] = useState(0)

  // Modals
  const [submitModalOpen, setSubmitModalOpen] = useState(false)
  const [countdown, setCountdown] = useState(5)

  // Re-enrollment
  const [previousEnrollment, setPreviousEnrollment] = useState<any>(null)
  const [checkingPreviousEnrollment, setCheckingPreviousEnrollment] = useState(false)
  const [isReEnrolling, setIsReEnrolling] = useState(false)
  const [reEnrollSemester, setReEnrollSemester] = useState<'first-sem' | 'second-sem' | null>(null)

  // Enrollment durations
  const [enrollmentStartPeriodHS, setEnrollmentStartPeriodHS] = useState<string | null>(null)
  const [enrollmentEndPeriodHS, setEnrollmentEndPeriodHS] = useState<string | null>(null)
  const [enrollmentStartPeriodCollege, setEnrollmentStartPeriodCollege] = useState<string | null>(null)
  const [enrollmentEndPeriodCollege, setEnrollmentEndPeriodCollege] = useState<string | null>(null)
  const [loadingEnrollmentDurations, setLoadingEnrollmentDurations] = useState(true)
  const [currentSystemSemester, setCurrentSystemSemester] = useState<string | null>(null)

  // Personal info
  const [personalInfo, setPersonalInfo] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    nameExtension: '',
    email: '',
    phone: '',
    birthMonth: '',
    birthDay: '',
    birthYear: '',
    placeOfBirth: '',
    gender: '',
    citizenship: '',
    religion: '',
    civilStatus: '',
  })

  const subjectsLoadedRef = useRef(false)

  // Initial data loading effect
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load grades
        const response = await fetch('/api/grades')
        if (!response.ok) {
          throw new Error('Failed to load grades')
        }
        const data = await response.json()
        setGrades(data.grades || [])
      } catch (error) {
        console.error('Error loading grades:', error)
      } finally {
        setLoading(false)
      }

      // Load current system semester
      try {
        const response = await fetch('/api/enrollment?getConfig=true')
        if (response.ok) {
          const data = await response.json()
          setCurrentSystemSemester(data.semester)
        }
      } catch (error) {
        console.error('Error loading current semester:', error)
      }

      // Load enrollment durations
      try {
        const response = await fetch('/api/enrollment?getConfig=true')
        if (response.ok) {
          const data = await response.json()
          setEnrollmentStartPeriodHS(data.enrollmentStartPeriodHS || null)
          setEnrollmentEndPeriodHS(data.enrollmentEndPeriodHS || null)
          setEnrollmentStartPeriodCollege(data.enrollmentStartPeriodCollege || null)
          setEnrollmentEndPeriodCollege(data.enrollmentEndPeriodCollege || null)
        }
      } catch (error) {
        console.error('Error loading enrollment durations:', error)
      } finally {
        setLoadingEnrollmentDurations(false)
      }
    }

    loadInitialData()
  }, [])

  // Effect for subjects loading when enrollment status changes
  useEffect(() => {
    const enrollmentToCheck = submittedEnrollment || existingEnrollment
    if (
      enrollmentToCheck &&
      enrollmentToCheck.enrollmentInfo?.status === 'enrolled' &&
      !subjectsLoadedRef.current
    ) {
      subjectsLoadedRef.current = true
      // Load subjects for enrolled students (don't require section assignment)
      console.log('Loading subjects for enrolled student:', enrollmentToCheck.userId)
      loadStudentSubjects()
    } else if (
      !enrollmentToCheck ||
      enrollmentToCheck.enrollmentInfo?.status !== 'enrolled'
    ) {
      // Reset subjects when enrollment status changes
      console.log('Resetting subjects - no enrolled student found')
      setSubjects([])
      setLoadingSubjects(false)
      subjectsLoadedRef.current = false
    }
  }, [
    submittedEnrollment?.enrollmentInfo?.status,
    existingEnrollment?.enrollmentInfo?.status,
  ])

  // Countdown effect for submit modal
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (submitModalOpen && countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [submitModalOpen, countdown])

  // Countdown effect for delete modal
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (showDeleteModal && deleteCountdown > 0) {
      interval = setInterval(() => {
        setDeleteCountdown((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [showDeleteModal, deleteCountdown])

  // Autofill personal information when userProfile is available
  useEffect(() => {
    if (userProfile) {
      console.log('Syncing user profile to enrollment form:', userProfile)
      setPersonalInfo({
        firstName: userProfile.firstName || '',
        middleName: userProfile.middleName || '',
        lastName: userProfile.lastName || '',
        nameExtension: userProfile.nameExtension || '',
        email: userProfile.email || '',
        phone: userProfile.phoneNumber
          ? formatPhoneNumber(userProfile.phoneNumber)
          : '',
        birthMonth: userProfile.birthMonth || '',
        birthDay: userProfile.birthDay || '',
        birthYear: userProfile.birthYear || '',
        placeOfBirth: '', // Not stored in profile
        gender: userProfile.gender || '',
        citizenship: '', // Not stored in profile
        religion: '', // Not stored in profile
        civilStatus: userProfile.civilStatus || '',
      })
      console.log('Birthday fields synced:', {
        birthMonth: userProfile.birthMonth,
        birthDay: userProfile.birthDay,
        birthYear: userProfile.birthYear,
      })

      // Format and display the birthday for verification
      if (
        userProfile.birthMonth &&
        userProfile.birthDay &&
        userProfile.birthYear
      ) {
        const formattedBirthday = `${userProfile.birthMonth}/${userProfile.birthDay}/${userProfile.birthYear}`
        console.log('Formatted birthday:', formattedBirthday)

        // Calculate age from profile data
        setTimeout(() => {
          calculateAgeFromValues(
            userProfile.birthMonth,
            userProfile.birthDay,
            userProfile.birthYear
          )
        }, 200)
      }
    }
  }, [userProfile])

  // Check existing enrollment on mount and when userId changes
  useEffect(() => {
    if (userId) {
      checkExistingEnrollment()
    }
  }, [userId])

  // Check documents status on mount and when userId changes
  useEffect(() => {
    if (userId) {
      checkDocumentsStatus()
    }
  }, [userId])

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '')

    // If empty, return empty
    if (!digits) return ''

    // If starts with 63, keep it
    if (digits.startsWith('63')) {
      const withoutCountryCode = digits.substring(2)
      if (withoutCountryCode.length <= 10) {
        // Format as +63 XXX XXX XXXX
        const formatted = withoutCountryCode.replace(
          /(\d{3})(\d{3})(\d{4})/,
          '$1 $2 $3'
        )
        return `+63${formatted}`
      }
    }

    // If starts with 0, remove it and add +63
    if (digits.startsWith('0')) {
      const withoutZero = digits.substring(1)
      if (withoutZero.length <= 10) {
        const formatted = withoutZero.replace(
          /(\d{3})(\d{3})(\d{4})/,
          '$1 $2 $3'
        )
        return `+63${formatted}`
      }
    }

    // If doesn't start with 63 or 0, treat as local number
    if (digits.length <= 10) {
      const formatted = digits.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')
      return `+63${formatted}`
    }

    // If too long, truncate to 10 digits
    const truncated = digits.substring(0, 10)
    const formatted = truncated.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')
    return `+63${formatted}`
  }

  const calculateAgeFromValues = (
    birthMonth: string,
    birthDay: string,
    birthYear: string
  ) => {
    if (!birthMonth || !birthDay || !birthYear) {
      setCalculatedAge(null)
      return
    }

    const birthDate = new Date(
      parseInt(birthYear),
      parseInt(birthMonth) - 1,
      parseInt(birthDay)
    )
    const today = new Date()

    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    // If birthday hasn't occurred this year yet, subtract 1 from age
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--
    }

    // Validate that the calculated age is reasonable (between 5 and 100)
    if (age >= 5 && age <= 100) {
      setCalculatedAge(age)
      console.log(
        `Age calculated: ${age} years old (DOB: ${birthMonth}/${birthDay}/${birthYear})`
      )
    } else {
      setCalculatedAge(null)
      console.log(`Invalid age calculated: ${age} (must be between 5-100)`)
    }
  }

  const loadStudentSubjects = async () => {
    try {
      setLoadingSubjects(true)

      console.log('🔍 Loading subjects for enrolled user:', userId)

      const enrolledSubjectsResponse = await fetch(
        `/api/enrollment?userId=${userId}&getEnrolledSubjects=true`
      )

      if (!enrolledSubjectsResponse.ok) {
        console.error('Failed to fetch enrolled subjects')
        setSubjects([])
        setLoadingSubjects(false)
        return
      }

      const enrolledSubjectsData = await enrolledSubjectsResponse.json()

      if (!enrolledSubjectsData.success) {
        console.log('No enrolled subjects found:', enrolledSubjectsData.error)
        setSubjects([])
        setLoadingSubjects(false)
        return
      }

      const enrolledSubjects = enrolledSubjectsData.subjects || []

      console.log('Loaded enrolled subjects for student:', {
        userId,
        enrolledSubjectsCount: enrolledSubjects.length,
        enrollmentInfo: enrolledSubjectsData.enrollmentInfo,
        subjects: enrolledSubjects.map((s: any) => ({
          id: s.id,
          name: s.name,
        })),
      })

      setSubjects(enrolledSubjects)
    } catch (error) {
      console.error('Error loading student subjects:', error)
      setSubjects([])
    } finally {
      setLoadingSubjects(false)
    }
  }

  const checkExistingEnrollment = async () => {
    try {
      setCheckingEnrollment(true)

      // Get current system config to check against current AY and semester
      const configResponse = await fetch('/api/enrollment?getConfig=true')
      const configData = await configResponse.json()

      if (!configResponse.ok || !configData.ayCode) {
        console.error('Failed to get system configuration')
        setExistingEnrollment(null)
        setCheckingEnrollment(false)
        return
      }

      const currentAY = configData.ayCode
      const currentSemester = configData.semester // '1' or '2' from config

      // Convert semester number to semester format ('1' -> 'first-sem', '2' -> 'second-sem')
      const semesterFormat =
        currentSemester === '1'
          ? 'first-sem'
          : currentSemester === '2'
          ? 'second-sem'
          : undefined

      console.log('🔍 Checking enrollment:', {
        currentAY,
        currentSemester,
        semesterFormat,
      })

      // Check ALL possible enrollments (both semesters for college, and high school)
      // Then filter to find the one matching current AY + current semester
      const [firstSemResponse, secondSemResponse, highSchoolResponse] =
        await Promise.all([
          semesterFormat
            ? fetch(`/api/enrollment?userId=${userId}&semester=first-sem`)
            : Promise.resolve({
                ok: false,
                json: () => Promise.resolve({ success: false }),
              }),
          semesterFormat
            ? fetch(`/api/enrollment?userId=${userId}&semester=second-sem`)
            : Promise.resolve({
                ok: false,
                json: () => Promise.resolve({ success: false }),
              }),
          fetch(`/api/enrollment?userId=${userId}`),
        ])

      const [firstSemData, secondSemData, highSchoolData] = await Promise.all([
        firstSemResponse.json(),
        secondSemResponse.json(),
        highSchoolResponse.json(),
      ])

      // Check for college enrollment matching current semester
      if (semesterFormat) {
        let matchingCollegeEnrollment = null

        // Check the CURRENT semester enrollment directly (this is what we need)
        const currentSemResponse =
          semesterFormat === 'first-sem' ? firstSemResponse : secondSemResponse
        const currentSemData =
          semesterFormat === 'first-sem' ? firstSemData : secondSemData

        // Handle both 404 (old API) and success: false (new API) responses
        const enrollmentFound =
          currentSemResponse.ok && currentSemData.success && currentSemData.data

        if (enrollmentFound) {
          const enrollment = currentSemData.data
          const enrollmentAY = enrollment.enrollmentInfo?.schoolYear
          const enrollmentSemester = enrollment.enrollmentInfo?.semester
          const enrollmentLevel = enrollment.enrollmentInfo?.level

          console.log('🔍 Checking current semester enrollment:', {
            enrollmentAY,
            currentAY,
            enrollmentSemester,
            semesterFormat,
            enrollmentLevel,
            matchesAY: enrollmentAY === currentAY,
            matchesSemester: enrollmentSemester === semesterFormat,
            matchesLevel: enrollmentLevel === 'college',
          })

          // Must match: AY + Semester + Level (college)
          if (
            enrollmentAY === currentAY &&
            enrollmentSemester === semesterFormat &&
            enrollmentLevel === 'college'
          ) {
            // Matches current semester → hide form
            console.log(
              '  Found matching college enrollment for current semester - hiding form'
            )
            matchingCollegeEnrollment = enrollment
          } else {
            console.log('❌ Enrollment found but does NOT match:', {
              AYMatch: enrollmentAY === currentAY,
              semesterMatch: enrollmentSemester === semesterFormat,
              levelMatch: enrollmentLevel === 'college',
            })
          }
        }
        // Don't log error for expected "not found" cases - this is normal

        if (matchingCollegeEnrollment) {
          setExistingEnrollment(matchingCollegeEnrollment)
          setCheckingEnrollment(false)
          return
        }

        // If no current-semester enrollment, but a previous semester exists in the same AY,
        // expose it as previousEnrollment so the UI can show "Continue Previous"
        const otherSemData = semesterFormat === 'first-sem' ? secondSemData : firstSemData
        const otherSemResponse = semesterFormat === 'first-sem' ? secondSemResponse : firstSemResponse
        if (otherSemResponse.ok && otherSemData.success && otherSemData.data) {
          const prev = otherSemData.data
          const prevAY = prev.enrollmentInfo?.schoolYear
          const prevLevel = prev.enrollmentInfo?.level
          if (prevAY === currentAY && prevLevel === 'college') {
            setPreviousEnrollment(prev)
            // Set default re-enroll semester to the current system semester
            setReEnrollSemester(semesterFormat)
          }
        }
      }

      // Check for high school enrollment (no semester)
      if (
        highSchoolResponse.ok &&
        highSchoolData.success &&
        highSchoolData.data
      ) {
        const enrollment = highSchoolData.data
        const enrollmentAY = enrollment.enrollmentInfo?.schoolYear
        const enrollmentLevel = enrollment.enrollmentInfo?.level
        const enrollmentSemester = enrollment.enrollmentInfo?.semester

        // Only match high school enrollment if:
        // 1. AY matches current AY
        // 2. Level is high-school or undefined (legacy enrollments)
        // 3. No semester field (high school doesn't have semesters)
        if (
          enrollmentAY === currentAY &&
          (enrollmentLevel === 'high-school' ||
            (!enrollmentLevel && !enrollmentSemester))
        ) {
          console.log('  Found matching high school enrollment - hiding form')
          setExistingEnrollment(enrollment)
        } else {
          console.log(
            '❌ High school enrollment found but does NOT match - showing form',
            {
              matchesAY: enrollmentAY === currentAY,
              isHighSchool:
                enrollmentLevel === 'high-school' ||
                (!enrollmentLevel && !enrollmentSemester),
            }
          )
          setExistingEnrollment(null)
        }
      } else {
        console.log('❌ No enrollment found - showing form')
        setExistingEnrollment(null)
      }
    } catch (error) {
      console.error('Error checking existing enrollment:', error)
      setExistingEnrollment(null)
    } finally {
      setCheckingEnrollment(false)
    }
  }

  const checkDocumentsStatus = async () => {
    try {
      setCheckingDocuments(true)
      const response = await fetch(`/api/documents?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        const documents = data.documents || []

        // Define required documents based on the documents-manager.tsx structure
        const requiredTypes = [
          'reportCard',
          'certificateOfGoodMoral',
          'birthCertificate',
          'idPicture',
        ]
        const uploadedRequired = requiredTypes.filter((type) =>
          documents.some((doc: any) => doc.type === type)
        )

        setDocumentsStatus({
          uploaded: uploadedRequired.length,
          required: requiredTypes.length,
          isComplete: uploadedRequired.length === requiredTypes.length,
          uploadedDocuments: documents, // Store the full documents array for detailed checking
        })
      } else {
        setDocumentsStatus({
          uploaded: 0,
          required: 4,
          isComplete: false,
          uploadedDocuments: [],
        })
      }
    } catch (error) {
      console.error('Error checking documents status:', error)
      setDocumentsStatus({
        uploaded: 0,
        required: 4,
        isComplete: false,
        uploadedDocuments: [],
      })
    } finally {
      setCheckingDocuments(false)
    }
  }

  // Utility functions for enrollment availability and periods
  const isEnrollmentAvailable = (level: 'high-school' | 'college'): boolean => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (level === 'high-school') {
      if (!enrollmentStartPeriodHS || !enrollmentEndPeriodHS) {
        return false
      }
      const startDate = new Date(enrollmentStartPeriodHS)
      const endDate = new Date(enrollmentEndPeriodHS)
      startDate.setHours(0, 0, 0, 0)
      endDate.setHours(23, 59, 59, 999)
      return today >= startDate && today <= endDate
    } else {
      if (!enrollmentStartPeriodCollege || !enrollmentEndPeriodCollege) {
        return false
      }
      const startDate = new Date(enrollmentStartPeriodCollege)
      const endDate = new Date(enrollmentEndPeriodCollege)
      startDate.setHours(0, 0, 0, 0)
      endDate.setHours(23, 59, 59, 999)
      return today >= startDate && today <= endDate
    }
  }

  const getEnrollmentPeriodMessage = (level: 'high-school' | 'college'): string | null => {
    if (level === 'high-school') {
      if (!enrollmentStartPeriodHS || !enrollmentEndPeriodHS) {
        return null
      }
      const startDate = new Date(enrollmentStartPeriodHS)
      const endDate = new Date(enrollmentEndPeriodHS)
      return `Enrollment Period: ${startDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })} - ${endDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })}`
    } else {
      if (!enrollmentStartPeriodCollege || !enrollmentEndPeriodCollege) {
        return null
      }
      const startDate = new Date(enrollmentStartPeriodCollege)
      const endDate = new Date(enrollmentEndPeriodCollege)
      return `Enrollment Period: ${startDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })} - ${endDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })}`
    }
  }

  const getEnrollmentDaysRemaining = (level: 'high-school' | 'college'): number | null => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let endDate: Date | null = null

    if (level === 'high-school') {
      if (!enrollmentEndPeriodHS) return null
      endDate = new Date(enrollmentEndPeriodHS)
    } else {
      if (!enrollmentEndPeriodCollege) return null
      endDate = new Date(enrollmentEndPeriodCollege)
    }

    if (!endDate) return null
    endDate.setHours(23, 59, 59, 999)

    const diffTime = endDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return diffDays >= 0 ? diffDays : 0
  }

  const getEnrollmentProgress = (level: 'high-school' | 'college'): number => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let startDate: Date | null = null
    let endDate: Date | null = null

    if (level === 'high-school') {
      if (!enrollmentStartPeriodHS || !enrollmentEndPeriodHS) return 0
      startDate = new Date(enrollmentStartPeriodHS)
      endDate = new Date(enrollmentEndPeriodHS)
    } else {
      if (!enrollmentStartPeriodCollege || !enrollmentEndPeriodCollege) return 0
      startDate = new Date(enrollmentStartPeriodCollege)
      endDate = new Date(enrollmentEndPeriodCollege)
    }

    if (!startDate || !endDate) return 0

    startDate.setHours(0, 0, 0, 0)
    endDate.setHours(23, 59, 59, 999)

    if (today < startDate) return 100
    if (today > endDate) return 0

    const totalDuration = endDate.getTime() - startDate.getTime()
    const remaining = endDate.getTime() - today.getTime()

    const progress = Math.min(100, Math.max(0, (remaining / totalDuration) * 100))
    return progress
  }

  const loadGrades = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/grades')
      if (!response.ok) {
        throw new Error('Failed to load grades')
      }
      const data = await response.json()
      setGrades(data.grades || [])
    } catch (error: any) {
      console.error('Error loading grades:', error)
      toast.error('Failed to load available grades')
    } finally {
      setLoading(false)
    }
  }

  const loadCourses = async () => {
    try {
      setLoadingCourses(true)
      const response = await fetch('/api/courses')
      if (!response.ok) {
        throw new Error('Failed to load courses')
      }
      const data = await response.json()
      setCourses(data.courses || [])
    } catch (error: any) {
      console.error('Error loading courses:', error)
      toast.error('Failed to load available courses')
    } finally {
      setLoadingCourses(false)
    }
  }

  return {
    // State
    userId,
    grades,
    loading,
    selectedGrade,
    selectedCourse,
    selectedLevel,
    selectedYear,
    selectedSemester,
    complianceChecked,
    currentStep,
    animatingStep,
    selectingGrade,
    enrolling,
    calculatedAge,
    showDataPreserved,
    existingEnrollment,
    submittedEnrollment,
    checkingEnrollment,
    showDeleteModal,
    deletingEnrollment,
    deleteCountdown,
    studentType,
    showIrregularModal,
    showCourseChangeModal,
    pendingCourse,
    documentsStatus,
    checkingDocuments,
    courses,
    loadingCourses,
    subjects,
    loadingSubjects,
    subjectsCarouselIndex,
    submitModalOpen,
    countdown,
    previousEnrollment,
    checkingPreviousEnrollment,
    isReEnrolling,
    reEnrollSemester,
    enrollmentStartPeriodHS,
    enrollmentEndPeriodHS,
    enrollmentStartPeriodCollege,
    enrollmentEndPeriodCollege,
    loadingEnrollmentDurations,
    currentSystemSemester,
    personalInfo,

    // Props
    onProgressUpdate,

    // Utility functions
    isEnrollmentAvailable,
    getEnrollmentPeriodMessage,
    getEnrollmentDaysRemaining,
    getEnrollmentProgress,
    loadGrades,
    loadCourses,

    // Actions
    checkExistingEnrollment,
    setGrades,
    setLoading,
    setSelectedGrade,
    setSelectedCourse,
    setSelectedLevel,
    setSelectedYear,
    setSelectedSemester,
    setComplianceChecked,
    setCurrentStep,
    setAnimatingStep,
    setSelectingGrade,
    setEnrolling,
    setCalculatedAge,
    setShowDataPreserved,
    setExistingEnrollment,
    setSubmittedEnrollment,
    setCheckingEnrollment,
    setShowDeleteModal,
    setDeletingEnrollment,
    setDeleteCountdown,
    setStudentType,
    setShowIrregularModal,
    setShowCourseChangeModal,
    setPendingCourse,
    setDocumentsStatus,
    setCheckingDocuments,
    setCourses,
    setLoadingCourses,
    setSubjects,
    setLoadingSubjects,
    setSubjectsCarouselIndex,
    setSubmitModalOpen,
    setCountdown,
    setPreviousEnrollment,
    setCheckingPreviousEnrollment,
    setIsReEnrolling,
    setReEnrollSemester,
    setEnrollmentStartPeriodHS,
    setEnrollmentEndPeriodHS,
    setEnrollmentStartPeriodCollege,
    setEnrollmentEndPeriodCollege,
    setLoadingEnrollmentDurations,
    setCurrentSystemSemester,
    setPersonalInfo,
  }
}
