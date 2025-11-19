'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { toast } from 'react-toastify'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { ProfileForm } from '@/components/profile-form'
import EnrollmentForm from '@/components/enrollment-form'
import DocumentsManager from '@/components/documents-manager'
import MySubjectsView from '../../components/my-subjects-view'
import AcademicRecords from '@/components/academic-records'
import AccountSetupProgress from '@/components/account-setup-progress'
import EventsSidebar from '@/components/events-sidebar'
import EventsOverview from '@/components/events-overview'
import {
  User,
  BookOpen,
  GraduationCap,
  Gear,
  Bell,
  ChatCircleDots,
  SignOut,
  House,
  Phone,
  MapPin,
  Shield,
  IdentificationCard,
  Pencil,
  ChartBar,
  FileText,
  CaretLeft,
  CaretRight,
  Calculator,
  Atom,
  Globe,
  Monitor,
  Palette,
  MusicNote,
  Book,
  Books,
  List,
} from '@phosphor-icons/react'
import { auth } from '@/lib/firebase'
import { signOut } from 'firebase/auth'
import { UserProfile } from '@/lib/user-sync'
import { getProfileAction } from '@/app/actions/profile'

type ViewType =
  | 'dashboard'
  | 'enrollment'
  | 'documents'
  | 'subjects'
  | 'performance'
  | 'records'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [profileImageError, setProfileImageError] = useState(false)
  const [enrollmentData, setEnrollmentData] = useState<any>(null)
  const [sections, setSections] = useState<any[]>([])
  const [grades, setGrades] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [subjects, setSubjects] = useState<Record<string, any>>({})
  const [subjectSets, setSubjectSets] = useState<Record<number, any[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [currentView, setCurrentView] = useState<ViewType>('dashboard')
  const [navCarouselIndex, setNavCarouselIndex] = useState(0)
  const [subjectsCarouselIndex, setSubjectsCarouselIndex] = useState(0)
  const [enrolledSubjects, setEnrolledSubjects] = useState<any[]>([])
  const [currentSystemConfig, setCurrentSystemConfig] = useState<{
    ayCode: string
    semester: string
  } | null>(null)
  const [studentMainId, setStudentMainId] = useState<string | null>(null)
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false)
  const [isArrangeView, setIsArrangeView] = useState(false)
  const [isRightCollapsed, setIsRightCollapsed] = useState(true)
  const [isDesktopViewport, setIsDesktopViewport] = useState(true)
  const hasRightSidebarPreference = useRef(false)
  const [eventsSidebarView, setEventsSidebarView] = useState<'events' | 'chat'>(
    'events'
  )
  const router = useRouter()

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsDesktopViewport(true)
      return
    }
    const updateViewport = () => {
      setIsDesktopViewport(window.innerWidth >= 1024)
    }
    updateViewport()
    window.addEventListener('resize', updateViewport)
    return () => {
      window.removeEventListener('resize', updateViewport)
    }
  }, [])

  useEffect(() => {
    if (
      isDesktopViewport &&
      isRightCollapsed &&
      !hasRightSidebarPreference.current
    ) {
      setIsRightCollapsed(false)
    }
  }, [isDesktopViewport, isRightCollapsed])

  useEffect(() => {
    if (!isDesktopViewport && !isRightCollapsed) {
      hasRightSidebarPreference.current = false
      setIsRightCollapsed(true)
    }
  }, [isDesktopViewport, isRightCollapsed])

  // Helper: robust enrollment fetch with fallbacks (handles API success:false and semester mismatches)
  const fetchEnrollmentWithFallback = async (
    uid: string,
    currentSemester: string | null = null
  ) => {
    try {
      // Try current semester first if provided
      if (currentSemester) {
        const semesterParam =
          currentSemester === '1'
            ? 'first-sem'
            : currentSemester === '2'
            ? 'second-sem'
            : undefined
        if (semesterParam) {
          const res = await fetch(
            `/api/enrollment?userId=${uid}&semester=${semesterParam}`
          )
          const data = await res.json()
          if (res.ok && data.success && data.data) {
            return data.data
          }
        }
      }

      // Try without semester (HS or any available)
      {
        const res = await fetch(`/api/enrollment?userId=${uid}`)
        const data = await res.json()
        if (res.ok && data.success && data.data) {
          return data.data
        }
      }

      // Try explicit semesters for college (both)
      for (const sem of ['first-sem', 'second-sem']) {
        const res = await fetch(`/api/enrollment?userId=${uid}&semester=${sem}`)
        const data = await res.json()
        if (res.ok && data.success && data.data) {
          return data.data
        }
      }

      // Last resort: use enrolled-subjects probe to infer enrollmentInfo
      {
        const probe = await fetch(
          `/api/enrollment?userId=${uid}&getEnrolledSubjects=true`
        )
        if (probe.ok) {
          const probeData = await probe.json()
          if (probeData.success && probeData.enrollmentInfo) {
            // Construct minimal enrollment shape expected by UI
            return {
              userId: uid,
              personalInfo: {},
              enrollmentInfo: {
                level: probeData.enrollmentInfo.level,
                schoolYear: probeData.enrollmentInfo.ayCode,
                courseCode: probeData.enrollmentInfo.courseCode,
                gradeLevel: probeData.enrollmentInfo.gradeLevel,
                semester: probeData.enrollmentInfo.semester,
                status: 'enrolled',
              },
            } as any
          }
        }
      }

      return null
    } catch (e) {
      return null
    }
  }

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { onAuthStateChanged } = await import('firebase/auth')

        onAuthStateChanged(auth, async (user) => {
          if (user) {
            setUser(user)

            // Get user profile from database through server action
            try {
              const profileResult = await getProfileAction({ uid: user.uid })
              const profile = profileResult.success ? profileResult.user : null
              if (profile && profile.firstName && profile.lastName) {
                setUserProfile(profile)
                setProfileImageError(false) // Reset image error when profile changes
                // Capture studentId if included in profile
                if ((profile as any).studentId) {
                  setStudentMainId((profile as any).studentId)
                }
              } else {
                console.log('No complete profile found, redirecting to setup')
                router.push('/setup')
                return
              }
            } catch (error) {
              console.log('Error getting profile, redirecting to setup:', error)
              router.push('/setup')
              return
            }

            // Fetch system config first to get current semester
            let currentSemester = '1'
            try {
              const configResponse = await fetch(
                '/api/enrollment?getConfig=true'
              )
              if (configResponse.ok) {
                const configData = await configResponse.json()
                setCurrentSystemConfig({
                  ayCode: configData.ayCode || 'AY2526',
                  semester: configData.semester || '1',
                })
                currentSemester = configData.semester || '1'
              }
            } catch (error) {
              console.log('Error fetching config:', error)
            }

            // Fetch enrollment data and sections after profile is loaded
            try {
              const data = await fetchEnrollmentWithFallback(
                user.uid,
                currentSemester
              )
              if (data) {
                console.log('Enrollment data received:', data)
                console.log('Enrollment status:', data?.enrollmentInfo?.status)
                console.log('Section ID:', data?.enrollmentInfo?.sectionId)
                setEnrollmentData(data)
              } else {
                console.log(
                  'No enrollment found, student may not be enrolled yet'
                )
                setEnrollmentData(null)
              }
            } catch (error) {
              console.log('Error fetching enrollment data:', error)
              setEnrollmentData(null)
            }

            // Fetch main student document to get authoritative studentId
            try {
              const resp = await fetch(`/api/user/profile?uids=${user.uid}`)
              const data = await resp.json()
              if (
                resp.ok &&
                data.success &&
                Array.isArray(data.users) &&
                data.users.length > 0
              ) {
                const rec = data.users[0]
                if (rec && rec.studentId) {
                  setStudentMainId(rec.studentId)
                }
              }
            } catch (e) {
              // ignore
            }

            // Fetch sections data
            try {
              const sectionsResponse = await fetch('/api/sections')
              const sectionsResult = await sectionsResponse.json()

              if (sectionsResponse.ok && sectionsResult.sections) {
                setSections(sectionsResult.sections)
              } else {
                console.log('No sections data found')
                setSections([])
              }
            } catch (error) {
              console.log('Error fetching sections data:', error)
              setSections([])
            }

            // Fetch grades data
            try {
              const gradesResponse = await fetch('/api/grades')
              const gradesResult = await gradesResponse.json()

              if (gradesResponse.ok && gradesResult.grades) {
                setGrades(gradesResult.grades)
              } else {
                console.log('No grades data found')
                setGrades([])
              }
            } catch (error) {
              console.log('Error fetching grades data:', error)
              setGrades([])
            }

            // Fetch documents data
            try {
              const documentsResponse = await fetch(
                `/api/documents?userId=${user.uid}`
              )
              const documentsResult = await documentsResponse.json()

              if (documentsResponse.ok && documentsResult.success) {
                setDocuments(documentsResult.documents || [])
              } else {
                console.log('No documents data found')
                setDocuments([])
              }
            } catch (error) {
              console.log('Error fetching documents data:', error)
              setDocuments([])
            }

            // Fetch subjects/subject sets data
            try {
              const [subjectsResponse, subjectSetsResponse] = await Promise.all(
                [fetch('/api/subjects'), fetch('/api/subject-sets')]
              )

              const [subjectsData, subjectSetsData] = await Promise.all([
                subjectsResponse.json(),
                subjectSetsResponse.json(),
              ])

              // Process subjects
              if (subjectsResponse.ok && subjectsData.subjects) {
                const subjectsMap: Record<string, any> = {}
                subjectsData.subjects.forEach((subject: any) => {
                  subjectsMap[subject.id] = subject
                })
                setSubjects(subjectsMap)
              }

              // Process subject sets
              if (subjectSetsResponse.ok && subjectSetsData.subjectSets) {
                const subjectSetsByGrade: Record<number, any[]> = {}
                subjectSetsData.subjectSets.forEach((subjectSet: any) => {
                  const gradeLevel = subjectSet.gradeLevel
                  if (!subjectSetsByGrade[gradeLevel]) {
                    subjectSetsByGrade[gradeLevel] = []
                  }
                  subjectSetsByGrade[gradeLevel].push(subjectSet)
                })
                setSubjectSets(subjectSetsByGrade)
              }
            } catch (error) {
              console.log('Error fetching subjects/subject sets data:', error)
              setSubjects({})
              setSubjectSets({})
            }
          } else {
            router.push('/')
          }
          setIsLoading(false)
        })
      } catch (error) {
        console.error('Auth check error:', error)
        router.push('/')
      }
    }

    checkAuth()
  }, [router])

  useEffect(() => {
    const fetchEnrolledSubjects = async () => {
      if (!user?.uid) {
        setEnrolledSubjects([])
        return
      }

      if (
        !enrollmentData ||
        enrollmentData.enrollmentInfo?.status !== 'enrolled'
      ) {
        setEnrolledSubjects([])
        return
      }

      try {
        const response = await fetch(
          `/api/enrollment?userId=${user.uid}&getEnrolledSubjects=true`
        )
        if (!response.ok) {
          setEnrolledSubjects([])
          return
        }

        const data = await response.json()
        if (data.success && Array.isArray(data.subjects)) {
          setEnrolledSubjects(data.subjects)
        } else {
          setEnrolledSubjects([])
        }
      } catch (error) {
        console.error('Error fetching enrolled subjects:', error)
        setEnrolledSubjects([])
      }
    }

    fetchEnrolledSubjects()
  }, [
    user?.uid,
    enrollmentData?.enrollmentInfo?.gradeLevel,
    enrollmentData?.enrollmentInfo?.semester,
    enrollmentData?.enrollmentInfo?.schoolYear,
    enrollmentData?.enrollmentInfo?.status,
  ])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }, [currentView])

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      router.push('/')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const handleEditProfile = () => {
    setIsEditModalOpen(true)
  }

  const handleEditSuccess = async () => {
    // Refresh user profile data through server action
    if (user) {
      try {
        const profileResult = await getProfileAction({ uid: user.uid })
        const profile = profileResult.success ? profileResult.user : null
        if (profile) {
          setUserProfile(profile)
          setProfileImageError(false) // Reset image error when profile changes
        }

        // Also refresh enrollment data
        try {
          const data = await fetchEnrollmentWithFallback(
            user.uid,
            currentSystemConfig?.semester || null
          )
          setEnrollmentData(data)
        } catch (error) {
          console.error('Error refreshing enrollment data:', error)
          setEnrollmentData(null)
        }

        // Also refresh sections data
        try {
          const sectionsResponse = await fetch('/api/sections')
          const sectionsResult = await sectionsResponse.json()

          if (sectionsResponse.ok && sectionsResult.sections) {
            setSections(sectionsResult.sections)
          } else {
            setSections([])
          }
        } catch (error) {
          console.error('Error refreshing sections data:', error)
          setSections([])
        }

        // Also refresh grades data
        try {
          const gradesResponse = await fetch('/api/grades')
          const gradesResult = await gradesResponse.json()

          if (gradesResponse.ok && gradesResult.grades) {
            setGrades(gradesResult.grades)
          } else {
            setGrades([])
          }
        } catch (error) {
          console.error('Error refreshing grades data:', error)
          setGrades([])
        }

        // Also refresh documents data
        try {
          const documentsResponse = await fetch(
            `/api/documents?userId=${user.uid}`
          )
          const documentsResult = await documentsResponse.json()

          if (documentsResponse.ok && documentsResult.success) {
            setDocuments(documentsResult.documents || [])
          } else {
            setDocuments([])
          }
        } catch (error) {
          console.error('Error refreshing documents data:', error)
          setDocuments([])
        }

        // Also refresh system config and subjects/subject sets data
        try {
          const [configResponse, subjectsResponse, subjectSetsResponse] =
            await Promise.all([
              fetch('/api/enrollment?getConfig=true'),
              fetch('/api/subjects'),
              fetch('/api/subject-sets'),
            ])

          // Refresh system config
          if (configResponse.ok) {
            const configData = await configResponse.json()
            setCurrentSystemConfig({
              ayCode: configData.ayCode || 'AY2526',
              semester: configData.semester || '1',
            })
          }

          const [subjectsData, subjectSetsData] = await Promise.all([
            subjectsResponse.json(),
            subjectSetsResponse.json(),
          ])

          // Process subjects
          if (subjectsResponse.ok && subjectsData.subjects) {
            const subjectsMap: Record<string, any> = {}
            subjectsData.subjects.forEach((subject: any) => {
              subjectsMap[subject.id] = subject
            })
            setSubjects(subjectsMap)
          }

          // Process subject sets
          if (subjectSetsResponse.ok && subjectSetsData.subjectSets) {
            const subjectSetsByGrade: Record<number, any[]> = {}
            subjectSetsData.subjectSets.forEach((subjectSet: any) => {
              const gradeLevel = subjectSet.gradeLevel
              if (!subjectSetsByGrade[gradeLevel]) {
                subjectSetsByGrade[gradeLevel] = []
              }
              subjectSetsByGrade[gradeLevel].push(subjectSet)
            })
            setSubjectSets(subjectSetsByGrade)
          }
        } catch (error) {
          console.error('Error refreshing subjects/subject sets data:', error)
          setSubjects({})
          setSubjectSets({})
        }
      } catch (error) {
        console.error('Error refreshing profile:', error)
      }
    }
    setIsEditModalOpen(false)
  }

  const handleEditCancel = () => {
    setIsEditModalOpen(false)
  }

  const handleToggleLeftSidebar = () => {
    setIsLeftCollapsed((prev) => !prev)
  }

  const handleToggleArrangeView = () => {
    setIsArrangeView((prev) => !prev)
  }

  const handleSetEventsSidebarView = (view: 'events' | 'chat') => {
    setEventsSidebarView(view)
    setIsRightCollapsed(false)
  }

  const handleToggleRightSidebar = () => {
    hasRightSidebarPreference.current = true
    setIsRightCollapsed((prev) => !prev)
  }

  const handleToggleKeyDown = (
    event: React.KeyboardEvent,
    onToggle: () => void
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onToggle()
    }
  }

  const leftSidebarLayout = useMemo(() => {
    if (isLeftCollapsed) {
      return {
        widthClass: 'w-full lg:w-[5.5rem]',
        marginClass: 'ml-0 lg:ml-[5.5rem]',
        contentAlignment: 'items-center',
      }
    }

    return {
      widthClass: 'w-full lg:w-80',
      marginClass: 'ml-0 lg:ml-80',
      contentAlignment: 'items-start',
    }
  }, [isLeftCollapsed])

  const rightSidebarLayout = useMemo(() => {
    // Only apply margin if sidebar is rendered
    const isSidebarRendered =
      enrollmentData && enrollmentData.enrollmentInfo?.status === 'enrolled'

    if (!isSidebarRendered) {
      return {
        widthClass: '',
        marginClass: '',
      }
    }

    if (isRightCollapsed) {
      return {
        widthClass: 'w-full lg:w-16 xl:w-20',
        marginClass: 'mr-0 lg:mr-16 xl:mr-20',
      }
    }

    return {
      widthClass: 'w-full lg:w-80 xl:w-96',
      marginClass: 'mr-0 lg:mr-80 xl:mr-96',
    }
  }, [isRightCollapsed, enrollmentData])

  const mainContentSpacing = useMemo(() => {
    return `${leftSidebarLayout.marginClass} ${rightSidebarLayout.marginClass}`
  }, [leftSidebarLayout.marginClass, rightSidebarLayout.marginClass])

  // Get student level for events filtering
  const getStudentLevel = (): string | null => {
    if (
      !enrollmentData ||
      enrollmentData.enrollmentInfo?.status !== 'enrolled'
    ) {
      return null
    }

    const info = enrollmentData.enrollmentInfo || {}
    if (info.level === 'college') {
      return 'college'
    }
    if (info.level === 'high-school') {
      // Check if SHS (department === 'SHS') or JHS (department !== 'SHS' or undefined)
      if (info.department === 'SHS') {
        return 'senior-high-school'
      } else {
        return 'junior-high-school'
      }
    }
    return null
  }

  const isArrangeViewActive = isArrangeView && !isLeftCollapsed

  const navigationItems = useMemo(
    () => [
      {
        view: 'dashboard' as ViewType,
        label: 'Overview',
        description: 'At a glance',
        icon: House,
      },
      {
        view: 'enrollment' as ViewType,
        label: 'Enrollment',
        description: 'Enroll now',
        icon: GraduationCap,
      },
      {
        view: 'documents' as ViewType,
        label: 'Documents',
        description: 'Upload files',
        icon: FileText,
      },
      {
        view: 'subjects' as ViewType,
        label: 'Subjects',
        description: 'Courses',
        icon: BookOpen,
        requiresEnrollment: true,
      },
      {
        view: 'performance' as ViewType,
        label: 'Performance',
        description: 'Grades & stats',
        icon: ChartBar,
        requiresEnrollment: true,
      },
      {
        view: 'records' as ViewType,
        label: 'Academic Records',
        description: 'Transcripts',
        icon: IdentificationCard,
        requiresEnrollment: true,
      },
    ],
    []
  )

  const isNavigationDisabled = (requiresEnrollment?: boolean) => {
    if (!requiresEnrollment) {
      return false
    }
    return !(
      enrollmentData && enrollmentData.enrollmentInfo?.status === 'enrolled'
    )
  }

  const handleNavigationAction = (
    targetView: ViewType,
    requiresEnrollment?: boolean
  ) => {
    if (isNavigationDisabled(requiresEnrollment)) {
      toast.info('You need to enroll first to access this feature.', {
        autoClose: 3000,
        position: 'top-right',
      })
      return
    }
    setCurrentView(targetView)
  }

  const handleProgressUpdate = async () => {
    // Refresh enrollment data
    try {
      const enrollmentResponse = await fetch(
        `/api/enrollment?userId=${user.uid}`
      )
      const enrollmentResult = await enrollmentResponse.json()

      // Handle 404 (no enrollment found) as valid case
      if (enrollmentResponse.status === 404) {
        setEnrollmentData(null)
      } else if (enrollmentResponse.ok && enrollmentResult.success) {
        setEnrollmentData(enrollmentResult.data)
      } else {
        setEnrollmentData(null)
      }
    } catch (error) {
      console.error('Error refreshing enrollment data:', error)
      setEnrollmentData(null)
    }

    // Refresh documents data
    try {
      const documentsResponse = await fetch(`/api/documents?userId=${user.uid}`)
      const documentsResult = await documentsResponse.json()

      if (documentsResponse.ok && documentsResult.success) {
        setDocuments(documentsResult.documents || [])
      } else {
        setDocuments([])
      }
    } catch (error) {
      console.error('Error refreshing documents data:', error)
      setDocuments([])
    }

    // Refresh subjects and subject sets data
    try {
      const [subjectsResponse, subjectSetsResponse] = await Promise.all([
        fetch('/api/subjects'),
        fetch('/api/subject-sets'),
      ])

      const [subjectsData, subjectSetsData] = await Promise.all([
        subjectsResponse.json(),
        subjectSetsResponse.json(),
      ])

      // Process subjects
      if (subjectsResponse.ok && subjectsData.subjects) {
        const subjectsMap: Record<string, any> = {}
        subjectsData.subjects.forEach((subject: any) => {
          subjectsMap[subject.id] = subject
        })
        setSubjects(subjectsMap)
      }

      // Process subject sets
      if (subjectSetsResponse.ok && subjectSetsData.subjectSets) {
        const subjectSetsByGrade: Record<number, any[]> = {}
        subjectSetsData.subjectSets.forEach((subjectSet: any) => {
          const gradeLevel = subjectSet.gradeLevel
          if (!subjectSetsByGrade[gradeLevel]) {
            subjectSetsByGrade[gradeLevel] = []
          }
          subjectSetsByGrade[gradeLevel].push(subjectSet)
        })
        setSubjectSets(subjectSetsByGrade)
      }
    } catch (error) {
      console.error('Error refreshing subjects/subject sets data:', error)
      setSubjects({})
      setSubjectSets({})
    }
  }

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return 'Not provided'
    return phone.startsWith('+63') ? phone : `+63${phone}`
  }

  const getFullName = () => {
    if (!userProfile) return 'Student'
    const { firstName, middleName, lastName, nameExtension } = userProfile
    let fullName = firstName || ''

    if (middleName) {
      // Add middle name initial (first letter only)
      fullName += ` ${middleName.charAt(0).toUpperCase()}.`
    }

    if (lastName) {
      fullName += ` ${lastName}`
    }

    if (nameExtension) {
      fullName += ` ${nameExtension}`
    }

    return fullName || 'Student'
  }

  const getFirstNameInitials = () => {
    if (userProfile?.firstName) {
      return userProfile.firstName.trim().slice(0, 2).toUpperCase()
    }
    if (user?.displayName) {
      return user.displayName.trim().slice(0, 2).toUpperCase()
    }
    if (user?.email) {
      return user.email.trim().slice(0, 2).toUpperCase()
    }
    return 'ST'
  }

  const getAddress = () => {
    if (!userProfile) return 'Not provided'
    const { streetName, province, municipality, barangay, zipCode } =
      userProfile
    const parts = [streetName, municipality, province, zipCode].filter(Boolean)
    return parts.length > 0 ? parts.join(', ') : 'Not provided'
  }

  const getSectionDisplay = (sectionId: string) => {
    if (sectionId) {
      const section = sections.find((s) => s.id === sectionId)
      if (!section) return sectionId
      const grade = grades.find((g) => g.id === section.gradeId)
      if (!grade) return section.sectionName
      return {
        sectionName: section.sectionName,
        gradeLevel: grade.gradeLevel,
        gradeColor: grade.color,
        strand: grade.strand || '',
      }
    }
    // Fallback when enrolled but no section assigned yet
    if (
      enrollmentData &&
      (enrollmentData.enrollmentInfo?.status || 'enrolled') === 'enrolled'
    ) {
      const info = enrollmentData.enrollmentInfo || {}
      if (info.level === 'college') {
        const yr = info.yearLevel ? `${info.yearLevel}` : ''
        return `${(
          info.courseCode ||
          info.courseName ||
          'Course'
        ).trim()} ${yr}`.trim()
      }
      if (info.gradeLevel) {
        const baseGrade = `Grade ${info.gradeLevel}`
        const strandLabel =
          info.strand && typeof info.strand === 'string' && info.strand.trim()
            ? ` ${info.strand.trim()}`
            : ''
        return `${baseGrade}${strandLabel}`
      }
    }
    return 'Not Assigned'
  }

  const getGradeColor = (color: string): string => {
    const colorMap: { [key: string]: string } = {
      'blue-900': '#1e40af',
      'red-800': '#991b1b',
      'emerald-800': '#064e3b',
      'yellow-800': '#92400e',
      'orange-800': '#9a3412',
      'violet-800': '#5b21b6',
      'purple-800': '#581c87',
    }
    return colorMap[color] || '#1e40af'
  }

  const getEnrollmentStatus = () => {
    if (!enrollmentData) return 'Not Enrolled'
    return enrollmentData.enrollmentInfo?.status || 'enrolled'
  }

  const getCurrentGrade = () => {
    if (!enrollmentData) return 'Not Enrolled'
    const info = enrollmentData.enrollmentInfo || {}
    if (info.level === 'college') {
      const yr = info.yearLevel ? String(info.yearLevel) : ''
      const course = info.courseCode || info.courseName || 'N/A'
      return `${course} ${yr}`.trim()
    }
    const gradeLevel = info.gradeLevel
    return gradeLevel ? `Grade ${gradeLevel}` : 'Not Enrolled'
  }

  const getStudentSubjects = useMemo(() => {
    if (enrolledSubjects.length > 0) {
      return enrolledSubjects
    }

    if (
      !enrollmentData ||
      enrollmentData.enrollmentInfo?.status !== 'enrolled'
    ) {
      return []
    }

    // Check if student has been assigned to a section
    const sectionId = enrollmentData.enrollmentInfo?.sectionId
    if (
      !sectionId ||
      sectionId === 'Not Assigned' ||
      sectionId.includes('Not Assigned')
    ) {
      return []
    }

    // For college students, verify enrollment matches current AY and semester (only if config is loaded)
    if (enrollmentData.enrollmentInfo?.level === 'college') {
      if (currentSystemConfig) {
        const currentAY = currentSystemConfig.ayCode
        const currentSemester = currentSystemConfig.semester // '1' or '2'
        const enrollmentSemester = enrollmentData.enrollmentInfo?.semester // 'first-sem' or 'second-sem'

        // Convert current semester to format
        const currentSemesterFormat =
          currentSemester === '1'
            ? 'first-sem'
            : currentSemester === '2'
            ? 'second-sem'
            : null

        // Check if enrollment matches current AY and semester
        if (
          enrollmentData.enrollmentInfo?.schoolYear !== currentAY ||
          enrollmentSemester !== currentSemesterFormat
        ) {
          return []
        }
      } // If config not loaded, fall through and use enrollment data as-is
    }

    // For high school, verify enrollment matches current AY (only if config is loaded)
    if (enrollmentData.enrollmentInfo?.level === 'high-school') {
      if (currentSystemConfig) {
        const currentAY = currentSystemConfig.ayCode
        if (enrollmentData.enrollmentInfo?.schoolYear !== currentAY) {
          return []
        }
      } // If config not loaded, fall through and use enrollment data as-is
    }

    const gradeLevel = enrollmentData.enrollmentInfo?.gradeLevel
    if (!gradeLevel) return []

    const gradeSubjectSets = subjectSets[parseInt(gradeLevel)] || []
    if (gradeSubjectSets.length === 0) return []

    // Get all subjects from all subject sets for this grade
    const allSubjects = gradeSubjectSets.flatMap((set) => set.subjects)
    const uniqueSubjectIds = Array.from(new Set(allSubjects))

    // Map subject IDs to subject data
    return uniqueSubjectIds
      .map((subjectId) => subjects[subjectId])
      .filter(Boolean)
  }, [
    enrolledSubjects,
    enrollmentData,
    currentSystemConfig,
    subjectSets,
    subjects,
  ])

  const getSubjectCount = useMemo(() => {
    return getStudentSubjects.length
  }, [getStudentSubjects])

  // Navigation items for carousel
  const carouselNavigationItems = [
    { id: 'dashboard', label: 'Overview', icon: House, color: 'bg-blue-900' },
    {
      id: 'enrollment',
      label: 'Enrollment',
      icon: GraduationCap,
      color: 'bg-blue-900',
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: FileText,
      color: 'bg-blue-900',
    },
    {
      id: 'subjects',
      label: 'Subjects',
      icon: BookOpen,
      color:
        enrollmentData && enrollmentData.enrollmentInfo?.status === 'enrolled'
          ? 'bg-blue-900'
          : 'bg-red-800',
    },
    {
      id: 'performance',
      label: 'Performance',
      icon: ChartBar,
      color:
        enrollmentData && enrollmentData.enrollmentInfo?.status === 'enrolled'
          ? 'bg-blue-900'
          : 'bg-red-800',
    },
    {
      id: 'records',
      label: 'Academic Records',
      icon: IdentificationCard,
      color:
        enrollmentData && enrollmentData.enrollmentInfo?.status === 'enrolled'
          ? 'bg-blue-900'
          : 'bg-red-800',
    },
  ]

  // Subject icon helper function (from subject-list.tsx)
  const getSubjectIcon = (subject: any) => {
    const subjectName = subject.name.toLowerCase()
    const subjectCode = subject.code?.toLowerCase() || ''

    // Math-related subjects
    if (
      subjectName.includes('math') ||
      subjectName.includes('calculus') ||
      subjectName.includes('algebra') ||
      subjectName.includes('geometry') ||
      subjectName.includes('trigonometry') ||
      subjectName.includes('statistics') ||
      subjectCode.includes('math') ||
      subjectCode.includes('calc')
    ) {
      return Calculator
    }

    // Science-related subjects
    if (
      subjectName.includes('science') ||
      subjectName.includes('physics') ||
      subjectName.includes('chemistry') ||
      subjectName.includes('biology') ||
      subjectName.includes('geology') ||
      subjectName.includes('astronomy') ||
      subjectCode.includes('sci') ||
      subjectCode.includes('phy') ||
      subjectCode.includes('chem') ||
      subjectCode.includes('bio')
    ) {
      return Atom
    }

    // Language/English subjects
    if (
      subjectName.includes('english') ||
      subjectName.includes('language') ||
      subjectName.includes('literature') ||
      subjectName.includes('grammar') ||
      subjectName.includes('reading') ||
      subjectName.includes('writing') ||
      subjectCode.includes('eng') ||
      subjectCode.includes('lang')
    ) {
      return Book
    }

    // Social Studies/History subjects
    if (
      subjectName.includes('history') ||
      subjectName.includes('social') ||
      subjectName.includes('geography') ||
      subjectName.includes('civics') ||
      subjectName.includes('economics') ||
      subjectName.includes('government') ||
      subjectCode.includes('hist') ||
      subjectCode.includes('soc') ||
      subjectCode.includes('geo')
    ) {
      return Globe
    }

    // Computer/Technology subjects
    if (
      subjectName.includes('computer') ||
      subjectName.includes('technology') ||
      subjectName.includes('programming') ||
      subjectName.includes('coding') ||
      subjectName.includes('ict') ||
      subjectName.includes('digital') ||
      subjectCode.includes('comp') ||
      subjectCode.includes('tech') ||
      subjectCode.includes('prog')
    ) {
      return Monitor
    }

    // Art subjects
    if (
      subjectName.includes('art') ||
      subjectName.includes('drawing') ||
      subjectName.includes('painting') ||
      subjectName.includes('visual') ||
      subjectName.includes('design') ||
      subjectCode.includes('art') ||
      subjectCode.includes('draw')
    ) {
      return Palette
    }

    // Music subjects
    if (
      subjectName.includes('music') ||
      subjectName.includes('choir') ||
      subjectName.includes('band') ||
      subjectName.includes('orchestra') ||
      subjectCode.includes('music')
    ) {
      return MusicNote
    }

    // Default icon for other subjects
    return BookOpen
  }

  // Color mapping helper (matching subject-list.tsx)
  const getSubjectColor = (color: string): string => {
    const colorMap: { [key: string]: string } = {
      'blue-900': '#1d4ed8',
      'blue-800': '#1e40af',
      'red-700': '#b91c1c',
      'red-800': '#991b1b',
      'emerald-700': '#047857',
      'emerald-800': '#064e3b',
      'yellow-700': '#a16207',
      'yellow-800': '#92400e',
      'orange-700': '#c2410c',
      'orange-800': '#9a3412',
      'violet-700': '#7c3aed',
      'violet-800': '#5b21b6',
      'purple-700': '#7c3aed',
      'purple-800': '#6b21a8',
      'indigo-700': '#4338ca',
      'indigo-800': '#312e81',
    }
    return colorMap[color] || '#1e40af'
  }

  const getIconColor = (color: string): string => {
    const colorMap: Record<string, string> = {
      'blue-900': '#1d4ed8',
      'blue-700': '#1e40af',
      'red-700': '#b91c1c',
      'red-800': '#991b1b',
      'emerald-700': '#047857',
      'emerald-800': '#064e3b',
      'yellow-700': '#a16207',
      'yellow-800': '#92400e',
      'orange-700': '#c2410c',
      'orange-800': '#9a3412',
      'violet-700': '#7c3aed',
      'violet-800': '#5b21b6',
      'purple-700': '#7c3aed',
      'purple-800': '#6b21a8',
      'indigo-700': '#4338ca',
      'indigo-800': '#312e81',
    }
    return colorMap[color] || '#1e40af'
  }

  // Auto-scroll carousels
  useEffect(() => {
    const navInterval = setInterval(() => {
      setNavCarouselIndex(
        (prev) => (prev + 1) % Math.ceil(carouselNavigationItems.length / 3)
      )
    }, 3000)

    return () => {
      clearInterval(navInterval)
    }
  }, [carouselNavigationItems.length])

  useEffect(() => {
    if (getStudentSubjects.length === 0) {
      setSubjectsCarouselIndex(0)
      return
    }

    const subjectsInterval = setInterval(() => {
      setSubjectsCarouselIndex((prev) => (prev + 1) % getStudentSubjects.length)
    }, 1000)

    return () => {
      clearInterval(subjectsInterval)
    }
  }, [getStudentSubjects.length])

  const handleNavigationClick = (item: any) => {
    if (
      item.id === 'subjects' ||
      item.id === 'performance' ||
      item.id === 'records'
    ) {
      if (
        !enrollmentData ||
        enrollmentData.enrollmentInfo?.status !== 'enrolled'
      ) {
        toast.info('You need to enroll first to access this feature.', {
          autoClose: 3000,
          position: 'top-right',
        })
        return
      }
    }
    setCurrentView(item.id as ViewType)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-900/30 border-t-blue-900"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">
              Please sign in to access your dashboard.
            </p>
            <Button onClick={() => router.push('/')} className="mt-4">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 bg-[length:40px_40px] bg-[image:linear-gradient(to_right,rgba(59,130,246,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(59,130,246,0.1)_1px,transparent_1px)] flex flex-col gap-6 lg:flex-row lg:gap-0 relative">
      {/* Vignette Effect */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 40%, rgba(0, 43, 255, 0.15) 100%)',
        }}
      ></div>
      {/* Account Setup Progress Bar */}
      {user && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <AccountSetupProgress
            userId={user.uid}
            userProfile={userProfile}
            documents={documents}
          />
        </div>
      )}

      {/* Left Sidebar */}
      <aside
        className={`hidden lg:flex ${leftSidebarLayout.widthClass} bg-white/60 shadow-lg flex-col transition-all duration-300 h-auto lg:h-screen lg:fixed lg:left-0 lg:top-0 z-20 lg:z-10 border-b lg:border-b-0 lg:border-r border-blue-100`}
      >
        <div
          className={`px-4 py-4 border-b bg-gradient-to-br from-blue-800 to-blue-900 flex items-center gap-3 w-full ${
            isLeftCollapsed ? 'justify-center shadow-xl' : ''
          }`}
        >
          {!isLeftCollapsed && (
            <div className="flex items-center gap-2">
              <div className="group relative w-[28px] h-[28px] rounded-xl bg-white shadow-md transition-all duration-300 hover:w-[120px] overflow-hidden">
                <button
                  type="button"
                  onClick={
                    userProfile
                      ? handleEditProfile
                      : () => router.push('/setup')
                  }
                  onKeyDown={(event) =>
                    handleToggleKeyDown(
                      event,
                      userProfile
                        ? handleEditProfile
                        : () => router.push('/setup')
                    )
                  }
                  aria-label="Open profile settings"
                  className="absolute inset-0 flex items-center justify-center gap-2 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-900 transition-all duration-300 group-hover:justify-start"
                  tabIndex={0}
                >
                  <span className="w-6 h-6 ml-[6.5px] aspect-square rounded-lg bg-white flex items-center justify-center">
                    <Gear size={18} weight="fill" className="text-blue-900" />
                  </span>
                  <span className="whitespace-nowrap text-blue-900 text-[11px] font-medium opacity-0 max-w-0 group-hover:max-w-[80px] group-hover:opacity-100 transition-all duration-200 overflow-hidden">
                    Settings
                  </span>
                </button>
              </div>
              <div className="group relative w-[28px] h-[28px] rounded-xl bg-white shadow-md transition-all duration-300 hover:w-[135px] overflow-hidden">
                <button
                  type="button"
                  onClick={handleToggleArrangeView}
                  onKeyDown={(event) =>
                    handleToggleKeyDown(event, handleToggleArrangeView)
                  }
                  aria-label="Toggle compact navigation view"
                  aria-pressed={isArrangeViewActive}
                  className={`absolute inset-0 flex items-center gap-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 transition-all duration-300 justify-center group-hover:justify-start ${
                    isArrangeViewActive
                      ? 'bg-white border border-blue-900'
                      : 'bg-white'
                  }`}
                  tabIndex={0}
                >
                  <div className="w-6 h-6 ml-[6.5px] aspect-square rounded-lg flex items-center justify-center">
                    <div className="grid grid-cols-2 gap-[2px]">
                      <span className="w-1 h-1 rounded-sm bg-blue-900"></span>
                      <span className="w-1 h-1 rounded-sm bg-blue-900"></span>
                      <span className="w-1 h-1 rounded-sm bg-blue-900"></span>
                      <span className="w-1 h-1 rounded-sm bg-blue-900"></span>
                    </div>
                  </div>
                  <span className="whitespace-nowrap text-blue-900 text-[11px] font-medium opacity-0 max-w-0 group-hover:max-w-[100px] group-hover:opacity-100 transition-all duration-200 overflow-hidden">
                    {isArrangeViewActive ? 'Normal view' : 'Simplified view'}
                  </span>
                </button>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={handleToggleLeftSidebar}
            onKeyDown={(event) =>
              handleToggleKeyDown(event, handleToggleLeftSidebar)
            }
            aria-label={isLeftCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`${
              isLeftCollapsed ? '' : 'ml-auto'
            } w-6 h-6 flex items-center aspect-square justify-center rounded-xl bg-white shadow-md transition-all duration-200 hover:from-blue-900 hover:to-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-900`}
            tabIndex={0}
          >
            <span className="w-6 h-6 aspect-square rounded-lg bg-white flex items-center justify-center">
              {isLeftCollapsed ? (
                <List size={18} weight="bold" className="text-blue-900" />
              ) : (
                <CaretLeft size={18} weight="bold" className="text-blue-900" />
              )}
            </span>
          </button>
        </div>

        {!isLeftCollapsed && (
          <div className="px-4 py-5 border-b border-blue-100 bg-gray-50/70 flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center border-2 border-blue-900 aspect-square">
                {(userProfile?.photoURL || user?.photoURL) &&
                !profileImageError ? (
                  <img
                    src={userProfile?.photoURL || user?.photoURL}
                    alt="Profile"
                    className="w-full h-full object-cover rounded-xl aspect-square"
                    onError={() => setProfileImageError(true)}
                  />
                ) : (
                  <span
                    className="text-white text-xl font-bold"
                    style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                  >
                    {userProfile?.firstName?.charAt(0).toUpperCase() ||
                      user?.displayName?.charAt(0).toUpperCase() ||
                      user?.email?.charAt(0).toUpperCase() ||
                      'S'}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">
                  {userProfile
                    ? getFullName()
                    : user?.displayName ||
                      user?.email?.split('@')[0] ||
                      'Student'}
                </h3>
                <p className="text-xs text-gray-900 font-mono font-medium">
                  {user?.email}
                </p>
                <p className="text-xs text-gray-600 font-mono font-medium">
                  {(() => {
                    const sectionDisplay = getSectionDisplay(
                      enrollmentData?.enrollmentInfo?.sectionId
                    )
                    if (!sectionDisplay) {
                      return 'Not Assigned'
                    }
                    if (typeof sectionDisplay === 'string') {
                      return sectionDisplay
                    }
                    const gradeLabel = `Grade ${sectionDisplay.gradeLevel}${
                      sectionDisplay.strand
                        ? ` ${sectionDisplay.strand}`.trim()
                        : ''
                    }`.trim()
                    return sectionDisplay.sectionName
                      ? `${gradeLabel} - ${sectionDisplay.sectionName}`
                      : gradeLabel
                  })()}
                </p>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 px-3 py-4 overflow-y-auto transition-all duration-300">
          {!isLeftCollapsed && (
            <div className="px-1 mb-3">
              <h4 className="text-sm font-medium text-blue-900 tracking-wide">
                Hey {userProfile?.firstName || 'Student'}!
              </h4>
              <p className="text-xs text-blue-900/70">
                What would you like to do today?
              </p>
            </div>
          )}

          <div
            className={
              isLeftCollapsed
                ? 'flex flex-col space-y-4'
                : isArrangeViewActive
                ? 'grid grid-cols-3 gap-3'
                : 'flex flex-col space-y-3'
            }
          >
            {navigationItems.map((item) => {
              const IconComponent = item.icon
              const isActive = currentView === item.view
              const isDisabled = isNavigationDisabled(item.requiresEnrollment)

              if (isArrangeViewActive) {
                return (
                  <button
                    key={item.view}
                    type="button"
                    onClick={() =>
                      handleNavigationAction(item.view, item.requiresEnrollment)
                    }
                    onKeyDown={(event) =>
                      handleToggleKeyDown(event, () =>
                        handleNavigationAction(
                          item.view,
                          item.requiresEnrollment
                        )
                      )
                    }
                    aria-label={item.label}
                    aria-current={isActive ? 'page' : undefined}
                    title={item.label}
                    tabIndex={0}
                    disabled={isDisabled}
                    className={`flex flex-col items-center justify-center gap-2 rounded-xl aspect-square border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-900 ${
                      isActive
                        ? 'bg-gradient-to-br from-blue-800 to-blue-900 border-blue-900 shadow-lg'
                        : isDisabled
                        ? 'bg-white/95 border-transparent opacity-50 cursor-not-allowed'
                        : 'bg-white/95 border-transparent hover:border-blue-300 hover:shadow-lg'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center aspect-square ${
                        isActive
                          ? 'bg-white'
                          : isDisabled
                          ? 'bg-red-800'
                          : 'bg-gradient-to-br from-blue-800 to-blue-900'
                      }`}
                    >
                      <IconComponent
                        size={18}
                        weight="fill"
                        className={
                          isActive
                            ? 'text-blue-900'
                            : isDisabled
                            ? 'text-white'
                            : 'text-white'
                        }
                      />
                    </div>
                    <span
                      className={`text-[11px] font-medium text-center leading-tight ${
                        isActive ? 'text-white' : 'text-blue-900'
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                )
              }

              return (
                <button
                  key={item.view}
                  type="button"
                  onClick={() =>
                    handleNavigationAction(item.view, item.requiresEnrollment)
                  }
                  onKeyDown={(event) =>
                    handleToggleKeyDown(event, () =>
                      handleNavigationAction(item.view, item.requiresEnrollment)
                    )
                  }
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                  title={item.label}
                  tabIndex={0}
                  disabled={isDisabled}
                  className={`w-full border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-900 ${
                    isActive
                      ? 'bg-gradient-to-br from-blue-800 to-blue-900 border-blue-900 shadow-md shadow-[0_0_18px_rgba(30,64,175,0.45)] text-white'
                      : isDisabled
                      ? 'bg-transparent border-transparent text-red-800 opacity-50 cursor-not-allowed'
                      : 'bg-transparent border-transparent text-blue-900 hover:border-blue-300 hover:bg-blue-50'
                  } ${
                    isLeftCollapsed
                      ? 'rounded-xl flex flex-col items-center gap-2 px-3 py-4'
                      : 'rounded-xl flex items-center gap-3 px-4 py-3 justify-start text-left'
                  }`}
                >
                  <span
                    className={`flex items-center justify-center rounded-lg w-8 h-8 aspect-square ${
                      isActive
                        ? 'bg-white'
                        : isDisabled
                        ? 'bg-red-800'
                        : 'bg-gradient-to-br from-blue-800 to-blue-900'
                    }`}
                  >
                    <IconComponent
                      size={16}
                      weight="fill"
                      className={
                        isActive
                          ? 'text-blue-900'
                          : isDisabled
                          ? 'text-white'
                          : 'text-white'
                      }
                    />
                  </span>
                  {isLeftCollapsed ? (
                    <span
                      className={`text-[10px] font-medium uppercase tracking-wide ${
                        isActive ? 'text-white' : 'text-blue-900'
                      }`}
                    >
                      {item.label.split(' ')[0]}
                    </span>
                  ) : (
                    <span className="flex flex-col items-start">
                      <span
                        className={`text-sm font-medium ${
                          isActive ? 'text-white' : 'text-blue-900'
                        }`}
                      >
                        {item.label}
                      </span>
                      <span
                        className={`text-[11px] ${
                          isActive ? 'text-white/70' : 'text-blue-900/70'
                        }`}
                      >
                        {item.description}
                      </span>
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </nav>

        {!isLeftCollapsed && (
          <div className="p-4 border-t border-blue-100">
            <button
              onClick={handleSignOut}
              onKeyDown={(event) => handleToggleKeyDown(event, handleSignOut)}
              className="w-full rounded-xl flex items-center gap-3 px-4 py-3 justify-start text-left bg-transparent border border-transparent text-red-800 hover:border-red-300 hover:bg-red-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-800"
              aria-label="Sign out"
              aria-controls="mobile-nav-panel"
            >
              <span className="flex items-center justify-center rounded-lg w-8 h-8 aspect-square bg-red-800">
                <SignOut size={16} weight="fill" className="text-white" />
              </span>
              <span className="flex flex-col items-start">
                <span className="text-sm font-medium text-red-800">
                  Sign Out {userProfile?.firstName || 'Student'}
                </span>
                <span className="text-[11px] text-red-800/70">Log out</span>
              </span>
            </button>
          </div>
        )}
      </aside>

      {/* Mobile Navigation - Single Row - Full Width - Fixed */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40">
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg w-full">
          <div className="px-4 py-4">
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {/* Logo on the left */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-md">
                  <Image
                    src="/logo.png"
                    alt="Logo"
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                </div>
              </div>
              {navigationItems.map((item) => {
                const IconComponent = item.icon
                const isDisabled = isNavigationDisabled(item.requiresEnrollment)
                const isActive = currentView === item.view
                return (
                  <button
                    key={`mobile-${item.view}`}
                    type="button"
                    onClick={() =>
                      handleNavigationAction(item.view, item.requiresEnrollment)
                    }
                    className={`relative flex h-12 flex-shrink-0 items-center gap-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white rounded-2xl ${
                      isDisabled
                        ? 'cursor-not-allowed text-blue-100 opacity-50 bg-blue-800'
                        : isActive
                        ? 'bg-white text-blue-900 shadow-lg w-36 pl-3 pr-4'
                        : 'bg-gradient-to-br from-blue-900 to-blue-800 text-white hover:from-blue-800 hover:to-blue-600 w-12 justify-center'
                    }`}
                    disabled={isDisabled}
                    aria-label={item.label}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span
                      className={`flex h-9 w-9 aspect-square items-center justify-center rounded-2xl transition-colors duration-300 ${
                        isActive
                          ? 'bg-gradient-to-br from-blue-900 to-blue-800 text-white'
                          : 'bg-white text-blue-900'
                      }`}
                    >
                      <IconComponent size={18} weight="fill" />
                    </span>
                    <span
                      className={`text-xs font-medium overflow-hidden transition-all duration-300 ${
                        isActive
                          ? 'max-w-[120px] opacity-100'
                          : 'max-w-0 opacity-0'
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                )
              })}
              {/* Events Button */}
              <button
                type="button"
                onClick={() => {
                  handleSetEventsSidebarView('events')
                  setIsRightCollapsed(false)
                }}
                className={`relative flex h-12 flex-shrink-0 items-center gap-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white rounded-2xl ${
                  eventsSidebarView === 'events'
                    ? 'bg-white text-blue-900 shadow-lg w-28 pl-3 pr-4'
                    : 'bg-gradient-to-br from-blue-900 to-blue-800 text-white hover:from-blue-800 hover:to-blue-600 w-12 justify-center'
                }`}
                aria-pressed={eventsSidebarView === 'events'}
                aria-label="Events"
              >
                <span
                  className={`flex h-9 w-9 aspect-square items-center justify-center rounded-2xl transition-colors duration-300 ${
                    eventsSidebarView === 'events'
                      ? 'bg-gradient-to-br from-blue-900 to-blue-800 text-white'
                      : 'bg-white text-blue-900'
                  }`}
                >
                  <Bell size={18} weight="fill" />
                </span>
                <span
                  className={`text-xs font-medium overflow-hidden transition-all duration-300 ${
                    eventsSidebarView === 'events'
                      ? 'max-w-[80px] opacity-100'
                      : 'max-w-0 opacity-0'
                  }`}
                >
                  Events
                </span>
              </button>
              {/* Chat Button */}
              <button
                type="button"
                onClick={() => {
                  handleSetEventsSidebarView('chat')
                  setIsRightCollapsed(false)
                }}
                className={`relative flex h-12 flex-shrink-0 items-center gap-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white rounded-2xl ${
                  eventsSidebarView === 'chat'
                    ? 'bg-white text-blue-900 shadow-lg w-24 pl-3 pr-4'
                    : 'bg-gradient-to-br from-blue-900 to-blue-800 text-white hover:from-blue-800 hover:to-blue-600 w-12 justify-center'
                }`}
                aria-pressed={eventsSidebarView === 'chat'}
                aria-label="Chat"
              >
                <span
                  className={`flex h-9 w-9 aspect-square items-center justify-center rounded-2xl transition-colors duration-300 ${
                    eventsSidebarView === 'chat'
                      ? 'bg-gradient-to-br from-blue-900 to-blue-800 text-white'
                      : 'bg-white text-blue-900'
                  }`}
                >
                  <ChatCircleDots size={18} weight="fill" />
                </span>
                <span
                  className={`text-xs font-medium overflow-hidden transition-all duration-300 ${
                    eventsSidebarView === 'chat'
                      ? 'max-w-[60px] opacity-100'
                      : 'max-w-0 opacity-0'
                  }`}
                >
                  Chat
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 w-full ${mainContentSpacing}`}
      >
        <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 pb-6 lg:py-10 pt-32 lg:pt-10">
          {currentView === 'dashboard' && (
            <div className="space-y-8 w-full">
              {/* Welcome Section / Enrollment Warning */}
              {enrollmentData &&
              enrollmentData.enrollmentInfo?.status === 'enrolled' ? (
                <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-blue-100 shadow-lg">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16 aspect-square flex-shrink-0 rounded-full bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center shadow-md overflow-hidden">
                        {userProfile?.photoURL && !profileImageError ? (
                          <Image
                            src={userProfile.photoURL}
                            alt="Profile photo"
                            fill
                            sizes="64px"
                            className="object-cover"
                            onError={() => setProfileImageError(true)}
                          />
                        ) : user?.photoURL && !profileImageError ? (
                          <Image
                            src={user.photoURL}
                            alt="Profile photo"
                            fill
                            sizes="64px"
                            className="object-cover"
                            onError={() => setProfileImageError(true)}
                          />
                        ) : (
                          <div className="flex h-full w-full aspect-square items-center justify-center rounded-full bg-blue-900">
                            <span
                              className="text-white text-xl tracking-wide"
                              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                            >
                              {getFirstNameInitials()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <h1
                          className="text-2xl font-medium bg-gradient-to-r from-blue-900 to-blue-800 bg-clip-text text-transparent"
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                        >
                          Hi, {userProfile?.firstName || 'Student'}!
                        </h1>
                        <p className="text-gray-600 font-mono text-xs">
                          Here's your academic dashboard overview
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-blue-900/80 sm:text-right text-xs font-mono">
                      Keep your profile updated to personalize your journey.
                    </p>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 lg:hidden">
                    <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 flex-shrink-0 rounded-2xl bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center text-white">
                          <GraduationCap size={16} weight="fill" />
                        </div>
                        <div>
                          <p className="text-[11px] text-gray-600 font-mono uppercase tracking-wide">
                            Grade
                          </p>
                          <p className="text-base font-medium bg-gradient-to-r from-blue-900 to-blue-800 bg-clip-text text-transparent font-mono">
                            {getCurrentGrade()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 flex-shrink-0 rounded-2xl bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center text-white">
                          <BookOpen size={16} weight="fill" />
                        </div>
                        <div className="flex flex-col">
                          <p className="text-[11px] text-gray-600 font-mono uppercase tracking-wide">
                            Subjects
                          </p>
                          <p className="text-base font-medium bg-gradient-to-r from-blue-900 to-blue-800 bg-clip-text text-transparent font-mono">
                            {getSubjectCount}
                          </p>
                          {enrollmentData &&
                            enrollmentData.enrollmentInfo?.status ===
                              'enrolled' &&
                            getStudentSubjects.length > 0 && (
                              <div className="mt-1 flex gap-1">
                                {getStudentSubjects
                                  .slice(0, 5)
                                  .map((subject) => (
                                    <span
                                      key={subject.id}
                                      className="h-2 w-2 rounded-full"
                                      style={{
                                        backgroundColor: getSubjectColor(
                                          subject.color
                                        ),
                                      }}
                                    ></span>
                                  ))}
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-blue-100 shadow-lg">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-4">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center shadow-md">
                        <GraduationCap
                          size={32}
                          className="text-white"
                          weight="fill"
                        />
                      </div>
                    </div>
                    <h1
                      className="text-2xl font-medium bg-gradient-to-r from-blue-900 to-blue-800 bg-clip-text text-transparent mb-2"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      Hi, {userProfile?.firstName || 'Student'}!
                    </h1>
                    <p className="text-gray-600 mb-6 text-sm">
                      It seems that you are not enrolled yet. Get started with
                      your academic journey today!
                    </p>
                    <Button
                      onClick={() => setCurrentView('enrollment')}
                      className="bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 text-white px-6 py-3 rounded-lg shadow-md transition-all duration-200"
                      style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                    >
                      <GraduationCap size={18} className="mr-2" weight="fill" />
                      Start Enrollment Process
                    </Button>
                  </div>
                </div>
              )}

              {/* Mobile Inline Navigation Icons */}
              <div className="lg:hidden mt-4">
                <div className="flex items-center justify-center gap-3 overflow-x-auto pb-2">
                  {navigationItems.slice(1).map((item) => {
                    const IconComponent = item.icon
                    const isDisabled = isNavigationDisabled(
                      item.requiresEnrollment
                    )
                    const isActive = currentView === item.view
                    return (
                      <button
                        key={`mobile-inline-${item.view}`}
                        type="button"
                        onClick={() =>
                          handleNavigationAction(
                            item.view,
                            item.requiresEnrollment
                          )
                        }
                        disabled={isDisabled}
                        className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-900 shadow-sm ${
                          isDisabled
                            ? 'bg-blue-200 text-blue-400 cursor-not-allowed'
                            : isActive
                            ? 'bg-white text-blue-900 shadow-lg'
                            : 'bg-gradient-to-br from-blue-900 to-blue-800 text-white hover:from-blue-800 hover:to-blue-600'
                        }`}
                        aria-label={item.label}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <IconComponent size={20} weight="fill" />
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="hidden lg:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="p-6 border-none bg-white/80 backdrop-blur-sm rounded-xl border border-blue-100 shadow-lg">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center aspect-square shadow-md">
                      <GraduationCap
                        size={24}
                        className="text-white"
                        weight="fill"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 font-mono">
                        Current Grade
                      </p>
                      <div className="flex items-center gap-2">
                        {enrollmentData &&
                          enrollmentData.enrollmentInfo?.status ===
                            'enrolled' &&
                          enrollmentData.enrollmentInfo?.sectionId &&
                          (() => {
                            const sectionDisplay = getSectionDisplay(
                              enrollmentData.enrollmentInfo.sectionId
                            )
                            return (
                              <div
                                className="w-4 h-4 flex-shrink-0 rounded"
                                style={{
                                  backgroundColor: getGradeColor(
                                    sectionDisplay.gradeColor
                                  ),
                                }}
                              ></div>
                            )
                          })()}
                        <p
                          className="text-lg font-medium bg-gradient-to-r from-blue-900 to-blue-800 bg-clip-text text-transparent font-mono"
                          style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                        >
                          {getCurrentGrade()}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 border-none bg-white/80 backdrop-blur-sm rounded-xl border border-blue-100 shadow-lg">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center aspect-square shadow-md">
                      <BookOpen
                        size={24}
                        className="text-white"
                        weight="fill"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 font-mono">
                        Subjects
                      </p>
                      <div className="flex items-center gap-2">
                        <p
                          className="text-lg font-medium bg-gradient-to-r from-blue-900 to-blue-800 bg-clip-text text-transparent font-mono"
                          style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                        >
                          {getSubjectCount}
                        </p>
                        {enrollmentData &&
                          enrollmentData.enrollmentInfo?.status ===
                            'enrolled' &&
                          getStudentSubjects.length > 0 && (
                            <div className="flex gap-1">
                              {getStudentSubjects.map((subject) => (
                                <div
                                  key={subject.id}
                                  className="w-3 h-3 flex-shrink-0 rounded"
                                  style={{
                                    backgroundColor: getSubjectColor(
                                      subject.color
                                    ),
                                  }}
                                ></div>
                              ))}
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 border-none bg-white/80 backdrop-blur-sm rounded-xl border border-blue-100 shadow-lg">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center aspect-square shadow-md">
                      <ChartBar
                        size={24}
                        className="text-white"
                        weight="fill"
                      />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-mono">
                        Performance
                      </p>
                      <p
                        className="text-lg font-medium bg-gradient-to-r from-blue-900 to-blue-800 bg-clip-text text-transparent font-mono"
                        style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                      >
                        N/A
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* What would you like to do? - Navigation Carousel */}
              <div className="hidden lg:block bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-blue-100 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center aspect-square shadow-md">
                    <House size={20} className="text-white" weight="fill" />
                  </div>
                  <h2
                    className="text-xl font-medium bg-gradient-to-r from-blue-900 to-blue-800 bg-clip-text text-transparent"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    What would you like to do?
                  </h2>
                </div>

                <div className="relative overflow-hidden">
                  <div
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{
                      transform: `translateX(-${navCarouselIndex * 100}%)`,
                    }}
                  >
                    {Array.from({
                      length: Math.ceil(carouselNavigationItems.length / 3),
                    }).map((_, groupIndex) => (
                      <div
                        key={groupIndex}
                        className="w-full flex-shrink-0 animate-in fade-in slide-in-from-bottom-4 duration-500"
                        style={{ animationDelay: `${groupIndex * 150}ms` }}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {carouselNavigationItems
                            .slice(groupIndex * 3, (groupIndex + 1) * 3)
                            .map((item, itemIndex) => (
                              <Button
                                key={item.id}
                                variant="ghost"
                                onClick={() => handleNavigationClick(item)}
                                className="h-24 p-4 rounded-xl border border-blue-900 bg-gradient-to-br from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 transition-all duration-200 group animate-in fade-in slide-in-from-bottom-4 shadow-md"
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 300,
                                  animationDelay: `${
                                    groupIndex * 150 + itemIndex * 75 + 200
                                  }ms`,
                                  animationFillMode: 'both',
                                }}
                              >
                                <div className="flex flex-col items-center space-y-2 w-full">
                                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center aspect-square group-hover:scale-110 transition-transform duration-200 shadow-sm">
                                    <item.icon
                                      size={20}
                                      className="text-blue-900"
                                      weight="fill"
                                    />
                                  </div>
                                  <span className="text-xs text-white group-hover:text-white text-center">
                                    {item.label}
                                  </span>
                                </div>
                              </Button>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Navigation dots */}
                  <div className="flex justify-center mt-4 space-x-2">
                    {Array.from({
                      length: Math.ceil(carouselNavigationItems.length / 3),
                    }).map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setNavCarouselIndex(index)}
                        className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                          index === navCarouselIndex
                            ? 'bg-blue-900'
                            : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Your Subjects - Subjects Carousel */}
              {enrollmentData &&
                enrollmentData.enrollmentInfo?.status === 'enrolled' &&
                getStudentSubjects.length > 0 && (
                  <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-blue-100 shadow-lg">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center aspect-square shadow-md">
                        <BookOpen
                          size={20}
                          className="text-white"
                          weight="fill"
                        />
                      </div>
                      <h2
                        className="text-xl font-medium bg-gradient-to-r from-blue-900 to-blue-800 bg-clip-text text-transparent"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        Your Subjects ({getSubjectCount})
                      </h2>
                    </div>

                    <div className="relative overflow-hidden">
                      <div
                        className="flex transition-transform duration-500 ease-in-out"
                        style={{
                          transform: `translateX(-${
                            subjectsCarouselIndex * 100
                          }%)`,
                        }}
                      >
                        {getStudentSubjects.map((subject, subjectIndex) => {
                          const IconComponent = getSubjectIcon(subject)
                          const getGradientClass = (color: string) => {
                            const colorMap: Record<string, string> = {
                              'blue-900': 'from-blue-800 to-blue-900',
                              'blue-800': 'from-blue-700 to-blue-800',
                              'red-700': 'from-red-600 to-red-700',
                              'red-800': 'from-red-700 to-red-800',
                              'emerald-700': 'from-emerald-600 to-emerald-700',
                              'emerald-800': 'from-emerald-700 to-emerald-800',
                              'yellow-700': 'from-yellow-600 to-yellow-700',
                              'yellow-800': 'from-yellow-700 to-yellow-800',
                              'orange-700': 'from-orange-600 to-orange-700',
                              'orange-800': 'from-orange-700 to-orange-800',
                              'violet-700': 'from-violet-600 to-violet-700',
                              'violet-800': 'from-violet-700 to-violet-800',
                              'purple-700': 'from-purple-600 to-purple-700',
                              'purple-800': 'from-purple-700 to-purple-800',
                              'indigo-700': 'from-indigo-600 to-indigo-700',
                              'indigo-800': 'from-indigo-700 to-indigo-800',
                            }
                            return (
                              colorMap[subject.color] ||
                              'from-blue-800 to-blue-900'
                            )
                          }

                          return (
                            <div
                              key={subject.id}
                              className="w-full flex-shrink-0 px-2"
                            >
                              <div
                                className={`group p-6 rounded-xl hover:shadow-xl hover:-translate-y-2 transition-all duration-300 ease-in-out shadow-lg transform hover:scale-[1.01] bg-gradient-to-br ${getGradientClass(
                                  subject.color
                                )}`}
                              >
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center flex-shrink-0 aspect-square shadow-md">
                                      <IconComponent
                                        size={32}
                                        style={{
                                          color: getIconColor(subject.color),
                                        }}
                                        weight="fill"
                                      />
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-3">
                                        <h3
                                          className="text-lg font-medium text-white"
                                          style={{
                                            fontFamily: 'Poppins',
                                            fontWeight: 500,
                                          }}
                                        >
                                          {subject.code}
                                        </h3>
                                      </div>
                                      <div className="flex gap-1">
                                        <div className="w-3 h-3 rounded bg-white"></div>
                                        <div className="w-3 h-3 rounded bg-white/80"></div>
                                        <div className="w-3 h-3 rounded bg-white/60"></div>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-4 mb-4">
                                  <div className="flex items-center p-1 text-xs font-medium rounded-lg border border-white/30 bg-white/20 text-white">
                                    <BookOpen
                                      size={12}
                                      className="mr-1"
                                      weight="duotone"
                                    />
                                    Grade {subject.gradeLevel}
                                  </div>
                                  <div className="flex items-center p-1 text-xs font-medium rounded-lg border border-white/30 bg-white/20 text-white">
                                    <Calculator
                                      size={12}
                                      className="mr-1"
                                      weight="duotone"
                                    />
                                    {(subject.lectureUnits || 0) +
                                      (subject.labUnits || 0)}{' '}
                                    units
                                  </div>
                                </div>

                                <div className="flex flex-col text-xs truncate-2-lines font-light text-justify">
                                  <span className="text-white text-sm font-medium">
                                    {subject.name}
                                  </span>
                                  <span className="text-white">
                                    {subject.description}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {/* Subjects carousel dots */}
                      <div className="flex justify-center mt-4 space-x-2">
                        {getStudentSubjects.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setSubjectsCarouselIndex(index)}
                            className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                              index === subjectsCarouselIndex
                                ? 'bg-blue-900'
                                : 'bg-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

              {/* Events & Announcements Overview */}
              {enrollmentData &&
                enrollmentData.enrollmentInfo?.status === 'enrolled' && (
                  <div className="hidden lg:block">
                    <EventsOverview
                      level={getStudentLevel()}
                      userId={user?.uid || ''}
                    />
                  </div>
                )}
            </div>
          )}

          {currentView === 'enrollment' && user && userProfile && (
            <EnrollmentForm
              userId={user.uid}
              userProfile={userProfile}
              onProgressUpdate={handleProgressUpdate}
            />
          )}

          {currentView === 'documents' && user && (
            <DocumentsManager
              userId={user.uid}
              userProfile={userProfile}
              onProgressUpdate={handleProgressUpdate}
            />
          )}

          {currentView === 'subjects' && user && (
            <MySubjectsView
              userId={user.uid}
              onNavigateToEnrollment={() => setCurrentView('enrollment')}
            />
          )}

          {currentView === 'performance' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center aspect-square shadow-md">
                  <ChartBar size={20} className="text-white" weight="fill" />
                </div>
                <div>
                  <h1
                    className="text-2xl font-medium bg-gradient-to-r from-blue-900 to-blue-800 bg-clip-text text-transparent"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Academic Performance
                  </h1>
                  <p
                    className="text-sm text-gray-600"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    Track your grades and academic progress
                  </p>
                </div>
              </div>

              <Card className="p-12 text-center border-none bg-white/80 backdrop-blur-sm rounded-xl border border-blue-100 shadow-lg">
                <ChartBar
                  size={48}
                  className="mx-auto text-gray-400 mb-4"
                  weight="duotone"
                />
                <h3
                  className="text-lg font-medium bg-gradient-to-r from-blue-900 to-blue-800 bg-clip-text text-transparent mb-2"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Performance data not available
                </h3>
                <p
                  className="text-gray-600 text-justify rounded-xl border border-blue-100 shadow-sm p-3 bg-blue-50"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  Your academic performance data will be available once you have
                  completed assessments and grades have been recorded.
                </p>
              </Card>
            </div>
          )}

          {currentView === 'records' && (
            <AcademicRecords
              userId={user?.uid || ''}
              studentName={`${userProfile?.firstName} ${userProfile?.lastName}`}
              onNavigateToEnrollment={() => setCurrentView('enrollment')}
            />
          )}
        </div>
      </div>

      {/* Right Sidebar - Events & Announcements */}
      {enrollmentData &&
        enrollmentData.enrollmentInfo?.status === 'enrolled' &&
        (isDesktopViewport || !isRightCollapsed) && (
          <EventsSidebar
            level={getStudentLevel()}
            userId={user?.uid || ''}
            isCollapsed={isRightCollapsed}
            onToggleCollapse={handleToggleRightSidebar}
            activeView={eventsSidebarView}
            onViewChange={setEventsSidebarView}
          />
        )}

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={handleEditCancel}
        title="Edit Profile"
        size="2xl"
      >
        <ProfileForm
          user={user}
          userProfile={userProfile}
          onSuccess={handleEditSuccess}
          onCancel={handleEditCancel}
          isModal={true}
        />
      </Modal>
    </div>
  )
}
