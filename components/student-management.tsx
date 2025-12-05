'use client'

import React, { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'
import EnrollmentPrintModal from './enrollment-print-modal'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EnrollmentData, EnrollmentDatabase } from '@/lib/enrollment-database'
import { SubjectData } from '@/lib/subject-database'
import {
  Eye,
  MagnifyingGlass,
  Calendar,
  Phone,
  MapPin,
  FileText,
  User,
  GraduationCap,
  Circle,
  Gear,
  Clock,
  ArrowUp,
  ArrowDown,
  User as UserIcon,
  FileText as FileTextIcon,
  GraduationCap as GraduationCapIcon,
  X,
  Printer,
  Check,
  Lightning,
  Trash,
  Users,
  ArrowLeft,
  ArrowRight,
  Shield,
  Calculator,
  FunnelSimple,
} from '@phosphor-icons/react'
import ViewHandler from './viewHandler'
import RegistrarGradesTab from './grades/RegistrarGradesTab'
import ViewStudentModal from './student-management/ViewStudentModal'
import SearchControls from './student-management/SearchControls'
import StudentsTable from './student-management/StudentsTable'
import PaginationControls from './student-management/PaginationControls'
import UnenrollModal from './student-management/UnenrollModal'
import PageHeader from './student-management/PageHeader'
import ModalsSection from './student-management/ModalsSection'
import ResultsCount from './student-management/ResultsCount'
import ExportCSVModal from './student-management/ExportCSVModal'

// Add custom CSS animations
const animationStyles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fadeIn {
    animation: fadeIn 0.5s ease-out forwards;
  }

  .animate-fadeInUp {
    animation: fadeInUp 0.6s ease-out forwards;
  }

  .animate-slideInUp {
    animation: slideInUp 0.4s ease-out forwards;
  }
`

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style')
  styleSheet.textContent = animationStyles
  document.head.appendChild(styleSheet)
}

const StudentManagementSkeleton = () => {
  return (
    <div className="p-6 space-y-6" style={{ fontFamily: 'Poppins' }}>
      <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl p-6 space-y-3 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/30" />
          <div className="space-y-2">
            <div className="h-5 bg-white/50 rounded w-40" />
            <div className="h-3 bg-white/30 rounded w-64" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          {[1, 2].map((item) => (
            <div
              key={`chip-${item}`}
              className="px-4 py-2 rounded-lg bg-white/20 w-28 h-6"
            />
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((card) => (
          <Card
            key={`summary-${card}`}
            className="p-4 border border-blue-100 rounded-xl bg-white shadow-sm animate-pulse"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50" />
              <div className="space-y-2 flex-1">
                <div className="h-3 bg-gray-200 rounded w-20" />
                <div className="h-4 bg-gray-300 rounded w-12" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-4 border border-blue-100 rounded-xl bg-white shadow-sm animate-pulse">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="h-10 bg-gray-100 rounded-lg w-full lg:flex-1" />
          <div className="flex gap-2 w-full lg:w-auto">
            {[1, 2, 3].map((filter) => (
              <div
                key={`filter-${filter}`}
                className="h-10 flex-1 rounded-lg bg-gray-100"
              />
            ))}
          </div>
          <div className="h-10 w-32 rounded-lg bg-gray-100" />
        </div>
      </Card>

      <Card className="border border-blue-100 rounded-xl bg-white shadow-sm">
        <div className="p-4 border-b border-blue-50 flex items-center gap-3 animate-pulse">
          <div className="w-6 h-6 rounded-md bg-gray-200" />
          <div className="h-4 bg-gray-200 rounded w-32" />
        </div>
        <div className="divide-y divide-blue-50">
          {[1, 2, 3, 4, 5].map((row) => (
            <div
              key={`row-${row}`}
              className="grid grid-cols-4 gap-3 p-4 animate-pulse"
            >
              <div className="h-4 rounded bg-gray-100" />
              <div className="h-4 rounded bg-gray-100" />
              <div className="h-4 rounded bg-gray-100" />
              <div className="h-4 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

interface StudentManagementProps {
  registrarUid: string
  registrarName?: string
}

interface StudentProfile {
  userId: string
  photoURL?: string
  email?: string
  studentId?: string
  guardianName?: string
  guardianPhone?: string
  guardianEmail?: string
  guardianRelationship?: string
  emergencyContact?: string
}

interface StudentDocument {
  fileFormat: string
  fileName: string
  fileSize: number
  fileType: string
  fileUrl: string
  uploadDate: string
  uploadedAt: string
}

interface StudentDocuments {
  [key: string]: StudentDocument
}

interface SubjectSetData {
  id: string
  name: string
  description: string
  subjects: string[]
  gradeLevel: number
  color: string
  createdAt: string
  updatedAt: string
  createdBy: string
}

interface SubjectAssignmentData {
  id: string
  level: 'high-school' | 'college'
  gradeLevel?: number
  courseCode?: string
  courseName?: string
  yearLevel?: number
  semester?: 'first-sem' | 'second-sem'
  subjectSetId: string
  registrarUid: string
  createdAt: string
  updatedAt: string
}

interface Tab {
  id: string
  label: string
  icon: React.ReactElement
  content: React.ReactNode
}

interface SectionData {
  id: string
  gradeId?: string
  courseId?: string
  sectionName: string
  grade: string
  department: string
  rank: string
  description: string
  createdAt: string
  updatedAt: string
  createdBy: string
}

// Extended interface to handle college enrollment fields
interface ExtendedEnrollmentData
  extends Omit<EnrollmentData, 'enrollmentInfo'> {
  enrollmentInfo: {
    gradeLevel?: string
    schoolYear: string
    enrollmentDate: string
    status: string
    orNumber?: string
    scholarship?: string
    studentId?: string
    sectionId?: string
    studentType?: 'regular' | 'irregular'
    // College-specific fields
    level?: 'college' | 'high-school'
    courseId?: string
    courseCode?: string
    courseName?: string
    yearLevel?: string
    semester?: 'first-sem' | 'second-sem'
  }
}

export default function StudentManagement({
  registrarUid,
  registrarName,
}: StudentManagementProps) {
  const [enrollments, setEnrollments] = useState<ExtendedEnrollmentData[]>([])
  const [studentProfiles, setStudentProfiles] = useState<
    Record<string, StudentProfile>
  >({})
  const [studentDocuments, setStudentDocuments] = useState<
    Record<string, StudentDocuments>
  >({})
  const [subjectSets, setSubjectSets] = useState<
    Record<number, SubjectSetData[]>
  >({})
  const [subjects, setSubjects] = useState<Record<string, SubjectData>>({})
  const [grades, setGrades] = useState<Record<string, any>>({})
  const [sections, setSections] = useState<Record<string, SectionData[]>>({})
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingGrades, setLoadingGrades] = useState(true)
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [allDataLoaded, setAllDataLoaded] = useState(false)
  const [error, setError] = useState('')

  // Subject Assignments
  const [subjectAssignments, setSubjectAssignments] = useState<
    SubjectAssignmentData[]
  >([])
  const [subjectAssignmentLoading, setSubjectAssignmentLoading] =
    useState(false)

  // Print subjects
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewingEnrollment, setViewingEnrollment] =
    useState<ExtendedEnrollmentData | null>(null)
  const [sortOption, setSortOption] = useState<string>('latest')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)
  const [activeTab, setActiveTab] = useState<string>('student-info')
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [showUnenrollModal, setShowUnenrollModal] = useState(false)
  const [unenrollCountdown, setUnenrollCountdown] = useState(0)
  const [unenrollingStudent, setUnenrollingStudent] = useState(false)
  const [showAIChatModal, setShowAIChatModal] = useState(false)
  const [aiChatEnrollment, setAiChatEnrollment] =
    useState<ExtendedEnrollmentData | null>(null)
  const [assigningSectionStudent, setAssigningSectionStudent] = useState<
    string | null
  >(null)
  const [currentAYFilter, setCurrentAYFilter] = useState('')
  const [currentSemesterFilter, setCurrentSemesterFilter] = useState('')
  const [currentStudentTypeFilter, setCurrentStudentTypeFilter] = useState<
    'regular' | 'irregular' | ''
  >('')
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [currentAY, setCurrentAY] = useState('')
  const unsubscribeRef = useRef<(() => void) | null>(null)

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
  }

  const [showDocumentModal, setShowDocumentModal] = useState(false)
  const [viewingDocument, setViewingDocument] = useState<{
    url: string
    fileName: string
    fileType: string
    fileFormat: string
  } | null>(null)
  const [loadingImages, setLoadingImages] = useState<Record<string, boolean>>(
    {}
  )

  // Setup data fetching and polling on component mount
  useEffect(() => {
    setupDataFetcher()
    // Set up polling every 5 seconds for real-time updates
    const pollInterval = setInterval(() => {
      fetchEnrolledStudents()
    }, 5000)

    return () => {
      clearInterval(pollInterval)
    }
  }, [])

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
      setCurrentPage(1) // Reset to first page on search
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Reset to first page when sort option changes
  useEffect(() => {
    setCurrentPage(1)
  }, [sortOption])

  // Reset to first page when items per page changes
  useEffect(() => {
    setCurrentPage(1)
  }, [itemsPerPage])

  // Countdown timer for unenroll modal
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (showUnenrollModal && unenrollCountdown > 0) {
      timer = setTimeout(() => {
        setUnenrollCountdown(unenrollCountdown - 1)
      }, 1000)
    }
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [showUnenrollModal, unenrollCountdown])

  const setupDataFetcher = async () => {
    try {
      setLoading(true)
      setAllDataLoaded(false)
      setError('')

      // Get system config to determine current AY code
      const configResponse = await fetch('/api/enrollment?getConfig=true')
      const configData = await configResponse.json()

      if (!configResponse.ok || !configData.ayCode) {
        throw new Error('Failed to get system configuration')
      }

      const ayCode = configData.ayCode
      const semester = configData.semester || '1'
      console.log(
        '🔄 Setting up data fetcher for AY:',
        ayCode,
        'Semester:',
        semester
      )

      // Set the current AY and Semester filters
      setCurrentAYFilter(ayCode)
      setCurrentSemesterFilter(semester)
      setCurrentAY(ayCode)

      // Initial fetch
      await fetchEnrolledStudents()

      // Load related data
      await Promise.all([
        loadSubjectSets(),
        loadSubjects(),
        loadGrades(),
        loadSections(),
        loadCourses(),
        loadSubjectAssignments(),
      ])

      console.log('  All data loaded successfully')
      setAllDataLoaded(true)
    } catch (error: any) {
      console.error('ERROR::  Error setting up data fetcher:', error)
      setError('Failed to setup data fetching: ' + error.message)
      toast.error('Unable to load data. Please refresh the page.', {
        autoClose: 10000,
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchEnrolledStudents = async () => {
    try {
      // Fetch enrolled students from server API
      const response = await fetch('/api/enrollment?getEnrolledStudents=true')
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch enrolled students')
      }

      const enrollments: ExtendedEnrollmentData[] = data.enrollments || []

      console.log('📋 Fetched enrolled students:', enrollments.length, 'total')

      // Debug: Log unique AY values to help with filtering
      if (enrollments.length > 0) {
        const uniqueAYs = Array.from(
          new Set(
            enrollments.map((e) => e.enrollmentInfo?.schoolYear).filter(Boolean)
          )
        )
        console.log('📅 Available AY values in enrollments:', uniqueAYs)
      }

      setEnrollments(enrollments)
      setError('')

      // Update student profiles and documents when enrollments change
      await Promise.all([
        loadStudentProfiles(enrollments),
        loadStudentDocuments(enrollments),
      ])
    } catch (error: any) {
      console.error('ERROR::  Error fetching enrolled students:', error)
      setError('Failed to fetch enrolled students: ' + error.message)
    }
  }

  const refreshStudents = async () => {
    try {
      setLoading(true)
      // Force reload by refetching student profiles and documents
      const enrollmentData = Object.values(enrollments)
      await Promise.all([
        loadStudentProfiles(enrollmentData),
        loadStudentDocuments(enrollmentData),
      ])
      toast.success('Data refreshed successfully', {
        autoClose: 2000,
      })
    } catch (error) {
      console.error('Error refreshing students:', error)
      toast.error('Failed to refresh data', {
        autoClose: 3000,
      })
    } finally {
      setLoading(false)
    }
  }

  const loadStudentProfiles = async (
    enrollmentData: ExtendedEnrollmentData[]
  ) => {
    try {
      const profiles: Record<string, StudentProfile> = {}

      // Batch fetch all student profiles at once
      if (enrollmentData.length === 0) {
        setStudentProfiles(profiles)
        return
      }

      // Chunk userIds to avoid URL length limits (50 per chunk)
      const userIds = enrollmentData.map((e) => e.userId)
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
      allUsers.flat().forEach((user: any) => {
        if (user && user.uid) {
          profiles[user.uid] = {
            userId: user.uid,
            photoURL: user.photoURL,
            email: user.email,
            studentId: user.studentId,
            guardianName: user.guardianName,
            guardianPhone: user.guardianPhone,
            guardianEmail: user.guardianEmail,
            guardianRelationship: user.guardianRelationship,
            emergencyContact: user.emergencyContact,
          }
        }
      })

      setStudentProfiles(profiles)
    } catch (error) {
      console.error('Error loading student profiles:', error)
    }
  }

  const loadStudentDocuments = async (
    enrollmentData: ExtendedEnrollmentData[]
  ) => {
    try {
      const documents: Record<string, StudentDocuments> = {}

      // Batch fetch all student documents at once
      if (enrollmentData.length === 0) {
        setStudentDocuments(documents)
        return
      }

      // Chunk userIds to avoid URL length limits (50 per chunk)
      const userIds = enrollmentData.map((e) => e.userId)
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
      allUsers.flat().forEach((user: any) => {
        if (user && user.uid && user.documents) {
          documents[user.uid] = user.documents
        }
      })

      setStudentDocuments(documents)
    } catch (error) {
      console.error('Error loading student documents:', error)
    }
  }

  const loadSubjectSets = async () => {
    try {
      // Load all subject sets at once
      const response = await fetch('/api/subject-sets')
      const data = await response.json()

      if (response.ok && data.subjectSets) {
        // Group subject sets by grade level
        const subjectSetsByGrade: Record<number, SubjectSetData[]> = {}

        data.subjectSets.forEach((subjectSet: SubjectSetData) => {
          const gradeLevel = subjectSet.gradeLevel
          if (!subjectSetsByGrade[gradeLevel]) {
            subjectSetsByGrade[gradeLevel] = []
          }
          subjectSetsByGrade[gradeLevel].push(subjectSet)
        })

        console.log('Loaded subject sets by grade:', subjectSetsByGrade)
        setSubjectSets(subjectSetsByGrade)
      } else {
        console.error('Failed to load subject sets:', data)
      }
    } catch (error) {
      console.error('Error loading subject sets:', error)
    }
  }

  const loadSubjects = async () => {
    try {
      const response = await fetch('/api/subjects')
      const data = await response.json()

      if (response.ok && data.subjects) {
        const subjectsMap: Record<string, SubjectData> = {}
        data.subjects.forEach((subject: SubjectData) => {
          subjectsMap[subject.id] = subject
        })
        setSubjects(subjectsMap)
      }
    } catch (error) {
      console.error('Error loading subjects:', error)
    }
  }

  const loadGrades = async () => {
    try {
      setLoadingGrades(true)
      const response = await fetch('/api/grades')
      const data = await response.json()

      if (response.ok && data.grades) {
        const gradesMap: Record<string, any> = {}
        data.grades.forEach((grade: any) => {
          gradesMap[grade.id] = grade
        })
        setGrades(gradesMap)
        console.log('📚 Loaded grades data:', gradesMap)
      }
    } catch (error) {
      console.error('Error loading grades:', error)
    } finally {
      setLoadingGrades(false)
    }
  }

  const loadSections = async () => {
    try {
      const response = await fetch('/api/sections')
      const data = await response.json()

      if (response.ok && data.sections) {
        // Group sections by grade level or course
        const sectionsByGrade: Record<string, SectionData[]> = {}

        data.sections.forEach((section: SectionData) => {
          let key: string

          // For high school sections, use gradeId
          if (section.gradeId) {
            // Extract grade level from grade string or use gradeId
            key = section.grade.replace('Grade ', '').replace('G', '')
          }
          // For college sections, use courseId
          else if (section.courseId) {
            key = section.courseId
          }
          // Fallback
          else {
            key = section.grade.replace('Grade ', '')
          }

          if (!sectionsByGrade[key]) {
            sectionsByGrade[key] = []
          }
          sectionsByGrade[key].push(section)
        })

        console.log('🏫 Loaded sections data:', sectionsByGrade)
        setSections(sectionsByGrade)
      }
    } catch (error) {
      console.error('Error loading sections:', error)
    }
  }

  const loadCourses = async () => {
    try {
      setLoadingCourses(true)
      const response = await fetch('/api/courses')
      const data = await response.json()

      if (response.ok && data.courses) {
        setCourses(data.courses)
        console.log('🎓 Loaded courses data:', data.courses)
      }
    } catch (error) {
      console.error('Error loading courses:', error)
    } finally {
      setLoadingCourses(false)
    }
  }

  const loadSubjectAssignments = async () => {
    try {
      setSubjectAssignmentLoading(true)
      const response = await fetch('/api/subject-assignments')
      const data = await response.json()

      if (response.ok && data.subjectAssignments) {
        setSubjectAssignments(data.subjectAssignments)
      } else {
        console.error('Failed to load subject assignments:', data)
      }
    } catch (error) {
      console.error('Error loading subject assignments:', error)
    } finally {
      setSubjectAssignmentLoading(false)
    }
  }

  const handleViewStudent = (enrollment: ExtendedEnrollmentData) => {
    setViewingEnrollment(enrollment)
    setShowViewModal(true)
  }

  const handleCloseDocumentModal = () => {
    setShowDocumentModal(false)
    setViewingDocument(null)
  }

  const handleImageLoad = (userId: string) => {
    setLoadingImages((prev) => ({ ...prev, [userId]: false }))
  }

  const handleImageError = (userId: string) => {
    setLoadingImages((prev) => ({ ...prev, [userId]: false }))
  }

  const handleSectionChange = async (
    enrollment: ExtendedEnrollmentData,
    sectionId: string
  ) => {
    setAssigningSectionStudent(enrollment.userId)

    try {
      let response
      let data
      const currentSectionId = enrollment.enrollmentInfo?.sectionId

      if (sectionId) {
        // Assigning a section
        response = await fetch('/api/enrollment', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: enrollment.userId,
            sectionId: sectionId,
            actorId: registrarUid,
            actorName: registrarName,
            actorRole: 'registrar',
          }),
        })

        data = await response.json()

        if (response.ok && data.success) {
          const selectedSection = Object.values(sections)
            .flat()
            .find((section) => section.id === sectionId)

          toast.success(
            `Student assigned to ${
              selectedSection?.sectionName || 'section'
            } successfully`,
            {
              autoClose: 3000,
            }
          )

          // Refresh enrollments to update section assignment and counts
          await fetchEnrolledStudents()
        } else {
          toast.error(
            data.error || 'Failed to assign section. Please try again.',
            {
              autoClose: 4000,
            }
          )
        }
      } else if (currentSectionId) {
        // Unassigning from current section
        response = await fetch('/api/enrollment', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: enrollment.userId,
            sectionId: currentSectionId,
            unassignSection: true,
            actorId: registrarUid,
            actorName: registrarName,
            actorRole: 'registrar',
          }),
        })

        data = await response.json()

        if (response.ok && data.success) {
          toast.success('Student unassigned from section successfully', {
            autoClose: 3000,
          })

          // Refresh enrollments to update section assignment and counts
          await fetchEnrolledStudents()
        } else {
          toast.error(
            data.error || 'Failed to unassign section. Please try again.',
            {
              autoClose: 4000,
            }
          )
        }
      } else {
        // No section selected and no current section - nothing to do
        return
      }
    } catch (error) {
      console.error('Error changing section assignment:', error)
      toast.error(
        'Network error occurred while changing section assignment. Please check your connection and try again.',
        {
          autoClose: 4000,
        }
      )
    } finally {
      setAssigningSectionStudent(null)
    }
  }

  const handleUnenrollStudent = () => {
    setShowUnenrollModal(true)
    setUnenrollCountdown(5)
  }

  const confirmUnenrollStudent = async () => {
    if (!viewingEnrollment) {
      toast.error(
        'Unable to find student information. Please refresh and try again.',
        {
          autoClose: 5000,
        }
      )
      return
    }

    setUnenrollingStudent(true)

    try {
      const response = await fetch('/api/enrollment', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: viewingEnrollment.userId,
          level: viewingEnrollment.enrollmentInfo?.level,
          semester: viewingEnrollment.enrollmentInfo?.semester,
          actorId: registrarUid,
          actorName: registrarName,
          actorRole: 'registrar',
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success(
          `Student ${viewingEnrollment?.personalInfo?.firstName} ${viewingEnrollment?.personalInfo?.lastName} has been unenrolled.`,
          {
            autoClose: 6000,
          }
        )
        // Optimistically drop the unenrolled student from local state to reflect immediately
        setEnrollments((prev) =>
          prev.filter((enrollment) => {
            const sameUser = enrollment.userId === viewingEnrollment.userId
            const sameAY =
              enrollment.enrollmentInfo?.schoolYear ===
              viewingEnrollment.enrollmentInfo?.schoolYear
            const normalizeSem = (value?: string | null) =>
              (value || '').toLowerCase()
            const sameSemester =
              normalizeSem(enrollment.enrollmentInfo?.semester) ===
              normalizeSem(viewingEnrollment.enrollmentInfo?.semester)

            // Match on user + AY + (optional) semester; if id matches, also remove
            const sameId =
              viewingEnrollment.id && enrollment.id === viewingEnrollment.id

            return !(sameId || (sameUser && sameAY && sameSemester))
          })
        )
        // Refresh list so the unenrolled student disappears immediately
        await fetchEnrolledStudents()
        setShowUnenrollModal(false)
        // Close the modal
        closeViewModal()
      } else {
        toast.error(
          data.error || 'Failed to unenroll student. Please try again.',
          {
            autoClose: 8000,
          }
        )
      }
    } catch (error) {
      console.error('Error unenrolling student:', error)
      toast.error(
        'Network error occurred while unenrolling student. Please check your connection and try again.',
        {
          autoClose: 7000,
        }
      )
    } finally {
      setUnenrollingStudent(false)
    }
  }

  const cancelUnenroll = () => {
    setShowUnenrollModal(false)
    setUnenrollCountdown(0)
  }

  const closeViewModal = () => {
    setShowViewModal(false)
    setViewingEnrollment(null)
    setActiveTab('student-info')
    setShowUnenrollModal(false)
    setUnenrollCountdown(0)
    setUnenrollingStudent(false)
  }

  const handleOpenAIChat = (enrollment: ExtendedEnrollmentData) => {
    setAiChatEnrollment(enrollment)
    setShowAIChatModal(true)
  }

  const handleCloseAIChatModal = () => {
    setShowAIChatModal(false)
    setAiChatEnrollment(null)
  }

  // Get date range for filtering
  const getDateRange = (days: number) => {
    const now = new Date()
    const pastDate = new Date()
    pastDate.setDate(now.getDate() - days)
    return pastDate
  }

  const getDateTimestamp = (dateInput: any): number => {
    try {
      let date: Date

      // Handle Firestore Timestamp objects (before JSON serialization)
      if (dateInput && typeof dateInput === 'object' && 'toDate' in dateInput) {
        date = dateInput.toDate()
      }
      // Handle serialized Firestore timestamps (after JSON serialization)
      else if (
        dateInput &&
        typeof dateInput === 'object' &&
        ('_seconds' in dateInput || 'seconds' in dateInput)
      ) {
        const seconds = dateInput._seconds || dateInput.seconds
        const nanoseconds = dateInput._nanoseconds || dateInput.nanoseconds || 0
        date = new Date(seconds * 1000 + nanoseconds / 1000000)
      }
      // Handle string dates
      else if (typeof dateInput === 'string') {
        date = new Date(dateInput)
      }
      // Handle number timestamps (milliseconds)
      else if (typeof dateInput === 'number') {
        date = new Date(dateInput)
      }
      // Handle Date objects
      else if (dateInput instanceof Date) {
        date = dateInput
      } else {
        return 0 // Default timestamp for invalid dates
      }

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 0
      }

      return date.getTime()
    } catch {
      return 0
    }
  }

  const formatFullName = (
    firstName?: string,
    middleName?: string,
    lastName?: string,
    nameExtension?: string
  ) => {
    if (!lastName && !firstName) return 'N/A'

    const parts: string[] = []

    // Last name first
    if (lastName) {
      parts.push(lastName)
    }

    // First name
    if (firstName) {
      parts.push(firstName)
    }

    // Middle name (if exists, show as initial with period)
    if (middleName && middleName.trim()) {
      const middleInitial = middleName.charAt(0).toUpperCase()
      parts.push(`${middleInitial}.`)
    }

    // Extension (if exists)
    if (nameExtension && nameExtension.trim()) {
      parts.push(nameExtension)
    }

    return parts.join(', ')
  }

  // Filter and sort enrollments - memoized for performance
  const filteredAndSortedEnrollments = React.useMemo(() => {
    let filtered = enrollments

    // Filter by AY if specified (controlled by filter input)
    // If filter is empty, show all enrollments; otherwise filter by the specified AY
    if (currentAYFilter && currentAYFilter.trim()) {
      const filterValue = currentAYFilter.trim().toUpperCase()
      filtered = filtered.filter((enrollment) => {
        const enrollmentAY = (enrollment.enrollmentInfo?.schoolYear || '')
          .trim()
          .toUpperCase()
        const matches = enrollmentAY === filterValue
        if (!matches && enrollment === filtered[0]) {
          console.log('🔍 AY Filter Debug:', {
            filterValue,
            enrollmentAY,
            enrollmentId: enrollment.id,
            matches,
          })
        }
        return matches
      })
      console.log(
        `📊 Filtered by AY "${currentAYFilter}": ${filtered.length} enrollments`
      )
    }

    // Filter by student type if specified
    if (currentStudentTypeFilter) {
      filtered = filtered.filter((enrollment) => {
        const studentType = enrollment.enrollmentInfo?.studentType || 'regular'
        return studentType === currentStudentTypeFilter
      })
    }

    // Then, filter by semester for college students only
    filtered = filtered.filter((enrollment) => {
      const isCollege = enrollment.enrollmentInfo?.level === 'college'

      // If not college, always show (semester filter doesn't apply)
      if (!isCollege) return true

      // If no semester filter set, show all college students
      if (!currentSemesterFilter) return true

      // Convert filter value ('1' or '2') to enrollment format ('first-sem' or 'second-sem')
      const filterSemesterValue =
        currentSemesterFilter === '1'
          ? 'first-sem'
          : currentSemesterFilter === '2'
          ? 'second-sem'
          : null

      // For college students, check if semester matches
      const enrollmentSemester = enrollment.enrollmentInfo?.semester
      return enrollmentSemester === filterSemesterValue
    })

    // Apply date filters
    if (sortOption === 'last-3-days') {
      const threeDaysAgo = getDateRange(3)
      filtered = filtered.filter(
        (enrollment) =>
          enrollment.submittedAt &&
          getDateTimestamp(enrollment.submittedAt) >= threeDaysAgo.getTime()
      )
    } else if (sortOption === 'last-7-days') {
      const sevenDaysAgo = getDateRange(7)
      filtered = filtered.filter(
        (enrollment) =>
          enrollment.submittedAt &&
          getDateTimestamp(enrollment.submittedAt) >= sevenDaysAgo.getTime()
      )
    }

    // Apply search filter (using debounced query)
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase()
      filtered = filtered.filter((enrollment) => {
        const fullName = formatFullName(
          enrollment.personalInfo?.firstName,
          enrollment.personalInfo?.middleName,
          enrollment.personalInfo?.lastName,
          enrollment.personalInfo?.nameExtension
        ).toLowerCase()
        const email = String(enrollment.personalInfo?.email || '').toLowerCase()
        const gradeLevel = String(
          enrollment.enrollmentInfo?.gradeLevel || ''
        ).toLowerCase()
        const status = String(
          enrollment.enrollmentInfo?.status || ''
        ).toLowerCase()

        return (
          fullName.includes(query) ||
          email.includes(query) ||
          gradeLevel.includes(query) ||
          status.includes(query)
        )
      })
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortOption) {
        case 'a-z':
          const nameA = formatFullName(
            a.personalInfo?.firstName,
            a.personalInfo?.middleName,
            a.personalInfo?.lastName,
            a.personalInfo?.nameExtension
          ).toLowerCase()
          const nameB = formatFullName(
            b.personalInfo?.firstName,
            b.personalInfo?.middleName,
            b.personalInfo?.lastName,
            b.personalInfo?.nameExtension
          ).toLowerCase()
          return nameA.localeCompare(nameB)

        case 'z-a':
          const nameARev = formatFullName(
            a.personalInfo?.firstName,
            a.personalInfo?.middleName,
            a.personalInfo?.lastName,
            a.personalInfo?.nameExtension
          ).toLowerCase()
          const nameBRev = formatFullName(
            b.personalInfo?.firstName,
            b.personalInfo?.middleName,
            b.personalInfo?.lastName,
            b.personalInfo?.nameExtension
          ).toLowerCase()
          return nameBRev.localeCompare(nameARev)

        case 'latest':
          const dateA = getDateTimestamp(a.submittedAt)
          const dateB = getDateTimestamp(b.submittedAt)
          return dateB - dateA // Most recent first

        case 'oldest':
          const dateAOld = getDateTimestamp(a.submittedAt)
          const dateBOld = getDateTimestamp(b.submittedAt)
          return dateAOld - dateBOld // Oldest first

        default:
          return 0
      }
    })

    return sorted
  }, [
    enrollments,
    debouncedSearchQuery,
    sortOption,
    currentAYFilter,
    currentSemesterFilter,
    currentStudentTypeFilter,
  ])

  // Paginated enrollments - pad to itemsPerPage rows
  const paginatedEnrollments = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const sliced = filteredAndSortedEnrollments.slice(startIndex, endIndex)
    // Pad with null to always have itemsPerPage rows
    const padded = [...sliced]
    while (padded.length < itemsPerPage) {
      padded.push(null as any)
    }
    return padded
  }, [filteredAndSortedEnrollments, currentPage, itemsPerPage])

  // Calculate total pages
  const totalPages = Math.ceil(
    filteredAndSortedEnrollments.length / itemsPerPage
  )

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-900 text-green-900'
      case 'pending':
        return 'bg-yellow-900 text-yellow-900'
      case 'rejected':
        return 'bg-red-900 text-red-900'
      case 'enrolled':
        return 'bg-blue-900 text-blue-900'
      default:
        return 'bg-gray-900 text-gray-900'
    }
  }

  const formatDate = (dateInput: any) => {
    try {
      let date: Date

      // Handle Firestore Timestamp objects (before JSON serialization)
      if (dateInput && typeof dateInput === 'object' && 'toDate' in dateInput) {
        date = dateInput.toDate()
      }
      // Handle serialized Firestore timestamps (after JSON serialization)
      else if (
        dateInput &&
        typeof dateInput === 'object' &&
        ('_seconds' in dateInput || 'seconds' in dateInput)
      ) {
        const seconds = dateInput._seconds || dateInput.seconds
        const nanoseconds = dateInput._nanoseconds || dateInput.nanoseconds || 0
        date = new Date(seconds * 1000 + nanoseconds / 1000000)
      }
      // Handle string dates
      else if (typeof dateInput === 'string') {
        date = new Date(dateInput)
      }
      // Handle number timestamps (milliseconds)
      else if (typeof dateInput === 'number') {
        date = new Date(dateInput)
      }
      // Handle Date objects
      else if (dateInput instanceof Date) {
        date = dateInput
      } else {
        return 'Invalid Date'
      }

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid Date'
      }

      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return 'Invalid Date'
    }
  }

  const formatBirthDate = (dateInput: any) => {
    try {
      let date: Date

      // Handle string dates (YYYY-MM-DD format)
      if (typeof dateInput === 'string') {
        date = new Date(dateInput)
      }
      // Handle Date objects
      else if (dateInput instanceof Date) {
        date = dateInput
      } else {
        return 'Invalid Date'
      }

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid Date'
      }

      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return 'Invalid Date'
    }
  }

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0)?.toUpperCase() || ''
    return first
  }

  // Get grade color from database (matching grade-list.tsx structure)
  const getGradeColor = (gradeLevel: number): string => {
    // Find the grade document that matches this grade level
    const gradeEntries = Object.entries(grades)
    console.log(
      'CONSOLE :: Looking for grade color for level:',
      gradeLevel,
      'Available grades:',
      gradeEntries
    )

    const matchingGrade = gradeEntries.find(([id, gradeData]) => {
      // Extract grade level from ID like "grade-7-jhs" -> 7
      const idParts = id.split('-')
      const idGradeLevel = parseInt(idParts[1])
      console.log(
        'CONSOLE :: Checking grade ID:',
        id,
        'Parts:',
        idParts,
        'Grade level:',
        idGradeLevel
      )
      return idGradeLevel === gradeLevel
    })

    const color = matchingGrade ? matchingGrade[1].color : 'blue-900'
    console.log('CONSOLE:: Grade', gradeLevel, 'color:', color)
    return color // default to blue-900
  }

  // Get course color from database by course code
  const getCourseColor = (courseCode: string): string => {
    // Find the course that matches the course code
    const courseData = courses.find((c) => c.code === courseCode)

    const color = courseData ? courseData.color : 'blue-900'
    console.log('CONSOLE:: Course', courseCode, 'color:', color)
    return color // default to blue-900
  }

  // Helper function to get display info for enrollment (handles both high school and college)
  const getEnrollmentDisplayInfo = (
    enrollment: ExtendedEnrollmentData | null
  ) => {
    if (!enrollment || !enrollment.enrollmentInfo) {
      return {
        type: 'unknown',
        displayText: 'N/A',
        subtitle: 'N/A',
        color: 'blue-900',
      }
    }

    const enrollmentInfo = enrollment.enrollmentInfo

    if (enrollmentInfo?.level === 'college') {
      const semesterDisplay =
        enrollmentInfo.semester === 'first-sem'
          ? 'Q1'
          : enrollmentInfo.semester === 'second-sem'
          ? 'Q2'
          : ''
      const semesterSuffix = semesterDisplay ? ` ${semesterDisplay}` : ''
      return {
        type: 'college',
        displayText: `${enrollmentInfo.courseCode || 'N/A'} ${
          enrollmentInfo.yearLevel || 'N/A'
        }${semesterSuffix}`,
        subtitle: enrollmentInfo?.schoolYear || 'N/A',
        color: getCourseColor(enrollmentInfo.courseCode || ''),
      }
    } else {
      // High school enrollment
      const gradeLevel = parseInt(enrollmentInfo?.gradeLevel || '0')
      return {
        type: 'high-school',
        displayText: `Grade ${gradeLevel || 'N/A'}`,
        subtitle: enrollmentInfo?.schoolYear || 'N/A',
        color: getGradeColor(gradeLevel),
      }
    }
  }

  // Show loading skeleton only for table during data loading
  const showTableSkeleton = loading || !allDataLoaded
  const showPageSkeleton = loading && !allDataLoaded

  if (showPageSkeleton) {
    return <StudentManagementSkeleton />
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Student Management"
        description="Manage enrolled students and their academic records"
      />

      <SearchControls
        searchQuery={searchQuery}
        onSearchChange={(value) => {
          setSearchQuery(value)
          setCurrentPage(1)
        }}
        currentAYFilter={currentAYFilter}
        onAYFilterChange={(value) => {
          setCurrentAYFilter(value)
          setCurrentPage(1)
        }}
        currentSemesterFilter={currentSemesterFilter}
        onSemesterFilterChange={(value) => {
          setCurrentSemesterFilter(value)
          setCurrentPage(1)
        }}
        currentStudentTypeFilter={currentStudentTypeFilter}
        onStudentTypeFilterChange={(value) => {
          setCurrentStudentTypeFilter(value)
          setCurrentPage(1)
        }}
        sortOption={sortOption}
        onSortOptionChange={(value) => {
          setSortOption(value)
          setCurrentPage(1)
        }}
        onResetFilters={() => {
          setCurrentAYFilter('')
          setCurrentSemesterFilter('')
          setCurrentStudentTypeFilter('')
          setSortOption('latest')
          setCurrentPage(1)
        }}
        showFilterDropdown={showFilterDropdown}
        onToggleFilterDropdown={() =>
          setShowFilterDropdown(!showFilterDropdown)
        }
        onExportClick={() => setShowExportModal(true)}
      />

      <ResultsCount
        totalItems={filteredAndSortedEnrollments.length}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        hasSearchQuery={
          !!searchQuery ||
          !!currentAYFilter ||
          !!currentSemesterFilter ||
          currentStudentTypeFilter !== ''
        }
      />

      <StudentsTable
        showTableSkeleton={showTableSkeleton}
        paginatedEnrollments={paginatedEnrollments}
        allEnrollments={filteredAndSortedEnrollments}
        searchQuery={searchQuery}
        studentProfiles={studentProfiles}
        loadingImages={loadingImages}
        sections={sections}
        subjects={subjects}
        subjectSets={subjectSets}
        subjectAssignments={subjectAssignments}
        grades={grades}
        courses={courses}
        assigningSectionStudent={assigningSectionStudent}
        loading={loading}
        onImageLoad={handleImageLoad}
        onImageError={handleImageError}
        onSectionChange={handleSectionChange}
        onViewStudent={handleViewStudent}
        onOpenAIChat={handleOpenAIChat}
        onPrintStudent={(enrollment) => {
          // Get subjects for this enrollment based on assignments
          let subjectsToPrint: string[] = []
          const enrollmentInfo = enrollment.enrollmentInfo

          if (enrollmentInfo?.level === 'college') {
            // For college students, find the subject assignment for this course, year level, and semester
            const assignment = subjectAssignments.find(
              (assignment) =>
                assignment.level === 'college' &&
                assignment.courseCode === enrollmentInfo.courseCode &&
                assignment.yearLevel ===
                  parseInt(enrollmentInfo.yearLevel || '1') &&
                assignment.semester === enrollmentInfo.semester
            )

            if (assignment) {
              // Get the subject set for this assignment
              const subjectSet = Object.values(subjectSets)
                .flat()
                .find((set) => set.id === assignment.subjectSetId)
              if (subjectSet) {
                subjectsToPrint = subjectSet.subjects
                console.log(
                  '  Subjects to print for college:',
                  subjectsToPrint.length,
                  'subjects from assignment'
                )
              } else {
                console.warn('  Subject set not found for assignment')
              }
            } else {
              console.warn(
                '  No subject assignment found for college enrollment'
              )
            }
          } else {
            // High school logic - find assignment for this grade level
            const gradeLevel = enrollmentInfo?.gradeLevel
            if (gradeLevel) {
              const assignment = subjectAssignments.find(
                (assignment) =>
                  assignment.level === 'high-school' &&
                  assignment.gradeLevel === parseInt(gradeLevel)
              )

              if (assignment) {
                // Get the subject set for this assignment
                const subjectSet = Object.values(subjectSets)
                  .flat()
                  .find((set) => set.id === assignment.subjectSetId)
                if (subjectSet) {
                  subjectsToPrint = subjectSet.subjects
                  console.log(
                    '  Subjects to print for high school:',
                    subjectsToPrint.length,
                    'subjects from assignment'
                  )
                } else {
                  console.warn('  Subject set not found for assignment')
                }
              } else {
                console.warn(
                  '  No subject assignment found for grade level',
                  gradeLevel
                )
              }
            } else {
              console.warn('No grade level found for enrollment')
            }
          }

          // Set the viewing enrollment and selected subjects for printing
          console.log(
            'EVIL JORDAN::  Opening print modal with enrollment data:',
            {
              enrollmentId: enrollment.id,
              enrollmentInfo: enrollment.enrollmentInfo,
              orNumber: enrollment.enrollmentInfo?.orNumber,
              scholarship: enrollment.enrollmentInfo?.scholarship,
            }
          )
          setViewingEnrollment(enrollment)
          setSelectedSubjects(subjectsToPrint)
          setShowPrintModal(true)

          console.log(
            '  Opening print modal with',
            subjectsToPrint.length,
            'subjects'
          )
        }}
      />

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredAndSortedEnrollments.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
      />

      <ModalsSection
        // View Student Modal props
        showViewModal={showViewModal}
        viewingEnrollment={viewingEnrollment}
        studentProfiles={studentProfiles}
        studentDocuments={studentDocuments}
        subjectSets={subjectSets}
        subjects={subjects}
        subjectAssignments={subjectAssignments}
        grades={grades}
        courses={courses}
        loadingImages={loadingImages}
        onCloseViewModal={closeViewModal}
        onImageLoad={handleImageLoad}
        onImageError={handleImageError}
        onViewDocument={(doc) => {
          setViewingDocument({
            url: doc.fileUrl,
            fileName: doc.fileName,
            fileType: doc.fileType,
            fileFormat: doc.fileFormat,
          })
          setShowDocumentModal(true)
        }}
        onShowPrintModal={() => setShowPrintModal(true)}
        onUnenrollStudent={handleUnenrollStudent}
        unenrollingStudent={unenrollingStudent}
        onOpenAIChat={() => {
          if (viewingEnrollment) {
            handleOpenAIChat(viewingEnrollment)
          }
        }}
        registrarUid={registrarUid}
        onDocumentStatusChange={async () => {
          if (viewingEnrollment) {
            await loadStudentDocuments([viewingEnrollment])
          }
        }}
        // Document Viewer Modal props
        showDocumentModal={showDocumentModal}
        viewingDocument={viewingDocument}
        onCloseDocumentModal={handleCloseDocumentModal}
        // Print Modal props
        showPrintModal={showPrintModal}
        selectedSubjects={selectedSubjects}
        registrarName={registrarName}
        onClosePrintModal={() => setShowPrintModal(false)}
        // Unenroll Modal props
        showUnenrollModal={showUnenrollModal}
        unenrollCountdown={unenrollCountdown}
        onCancelUnenroll={cancelUnenroll}
        onConfirmUnenroll={confirmUnenrollStudent}
        // AI Chat Modal props
        showAIChatModal={showAIChatModal}
        aiChatEnrollment={aiChatEnrollment}
        onCloseAIChatModal={handleCloseAIChatModal}
      />

      <ExportCSVModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        enrollments={enrollments}
        studentProfiles={studentProfiles}
        subjects={subjects}
        sections={sections}
        courses={courses}
        grades={grades}
        currentAY={currentAY}
      />
    </div>
  )
}
