'use client'

import React, { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'
import EnrollmentPrintModal from './enrollment-print-modal'

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
const SkeletonCard = () => (
  <div className="bg-white p-4 shadow animate-pulse">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 w-24"></div>
        <div className="h-8 bg-gray-200 w-16"></div>
      </div>
      <div className="h-6 w-6 bg-gray-200"></div>
    </div>
  </div>
)

const SkeletonTableRow = () => (
  <tr className="animate-pulse">
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center">
        <div className="h-10 w-10 bg-gray-200"></div>
        <div className="ml-4 space-y-2">
          <div className="h-4 bg-gray-200 w-32"></div>
          <div className="h-3 bg-gray-200 w-48"></div>
        </div>
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 w-20"></div>
        <div className="h-3 bg-gray-200 w-16"></div>
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-6 bg-gray-200 w-16"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
      <div className="h-4 bg-gray-200 w-32"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-8 w-16 bg-gray-200"></div>
    </td>
  </tr>
)

// Memoized enrollment table row component for performance
const EnrollmentTableRow = React.memo(
  ({
    enrollment,
    studentProfile,
    onView,
    onQuickEnroll,
    onPrint,
    onDelete,
    enrollingStudent,
    subjectAssignments,
    subjectSets,
    getEnrollmentDisplayInfo,
    getBgColor,
    getStatusHexColor,
    getTimeAgoInfo,
    formatFullName,
    formatDate,
    getInitials,
  }: any) => {
    return (
      <tr className="hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10 relative">
              {studentProfile?.photoURL ? (
                <img
                  src={studentProfile.photoURL}
                  alt={`${
                    enrollment.personalInfo?.firstName || 'Student'
                  } profile`}
                  className="h-10 w-10 rounded-full object-cover border-2 border-black/80"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-blue-900 flex items-center justify-center">
                  <span
                    className="text-white text-xs font-medium"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    {getInitials(
                      enrollment.personalInfo?.firstName,
                      enrollment.personalInfo?.lastName
                    )}
                  </span>
                </div>
              )}
              <span
                className={`absolute -bottom-0 -right-0 w-3 h-3 border-2 border-white ${
                  enrollment.enrollmentInfo?.studentType === 'regular'
                    ? 'bg-emerald-700'
                    : 'bg-red-600'
                }`}
                aria-label={
                  enrollment.enrollmentInfo?.studentType === 'regular'
                    ? 'Regular Student'
                    : 'Irregular Student'
                }
              ></span>
            </div>
            <div className="ml-4">
              <div
                className="text-xs font-medium text-gray-900"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                {formatFullName(
                  enrollment.personalInfo?.firstName,
                  enrollment.personalInfo?.middleName,
                  enrollment.personalInfo?.lastName,
                  enrollment.personalInfo?.nameExtension
                )}
              </div>
              <div
                className="text-xs text-gray-500 font-mono"
                style={{ fontWeight: 400 }}
              >
                {studentProfile?.email ||
                  enrollment.personalInfo?.email ||
                  'N/A'}
              </div>
              <div
                className="text-xs text-gray-400 font-mono text-[10px] mt-0.5"
                style={{ fontWeight: 300 }}
              >
                ID: {enrollment.id || 'N/A'}
              </div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
          {(() => {
            const displayInfo = getEnrollmentDisplayInfo(enrollment)
            return (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-3 h-3 flex-shrink-0"
                    style={{ backgroundColor: getBgColor(displayInfo.color) }}
                  ></div>
                  <div
                    className="text-xs text-gray-900"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    {displayInfo.displayText}
                  </div>
                </div>
                <div
                  className="text-xs text-gray-500 font-mono"
                  style={{ fontWeight: 400 }}
                >
                  {displayInfo.subtitle}
                </div>
              </>
            )
          })()}
        </td>
        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 flex-shrink-0"
                style={{
                  backgroundColor: getStatusHexColor(
                    enrollment.enrollmentInfo?.status || 'unknown'
                  ),
                }}
              ></div>
              <span
                className="text-xs capitalize font-medium font-mono"
                style={{ fontWeight: 400 }}
              >
                {enrollment.enrollmentInfo?.status || 'Unknown'}
              </span>
            </div>
            {enrollment.enrollmentInfo?.studentType && (
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 flex-shrink-0"
                  style={{
                    backgroundColor:
                      enrollment.enrollmentInfo.studentType === 'irregular'
                        ? '#dc2626'
                        : '#064e3b',
                  }}
                ></div>
                <span
                  className="text-xs capitalize text-black font-mono"
                  style={{ fontWeight: 300 }}
                >
                  {enrollment.enrollmentInfo.studentType}
                </span>
              </div>
            )}
          </div>
        </td>
        <td
          className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 border-r border-gray-200 font-mono hidden lg:table-cell"
          style={{ fontWeight: 400 }}
        >
          <div className="space-y-1">
            <div className="text-xs font-mono text-gray-900">
              {formatDate(enrollment.submittedAt)}
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 flex-shrink-0"
                style={{
                  backgroundColor: getTimeAgoInfo(enrollment.submittedAt).color,
                }}
              ></div>
              <span
                className="text-xs font-medium font-mono"
                style={{ fontWeight: 400 }}
              >
                {getTimeAgoInfo(enrollment.submittedAt).text}
              </span>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium">
          <div className="flex gap-2">
            <Button
              onClick={() => onView(enrollment)}
              size="sm"
              className="bg-blue-900 hover:bg-blue-900 text-white border"
              disabled={enrollingStudent}
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              <Eye size={14} className="mr-1" />
              View
            </Button>
            {enrollment.enrollmentInfo?.status !== 'enrolled' && (
              <Button
                onClick={() => onQuickEnroll(enrollment)}
                size="sm"
                className="bg-blue-900 text-white border hover:bg-blue-900"
                disabled={enrollingStudent}
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                {enrollingStudent ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Lightning size={14} className="mr-1" />
                    Quick Enroll
                  </>
                )}
              </Button>
            )}
            {enrollment.enrollmentInfo?.status === 'enrolled' && (
              <Button
                onClick={() => onPrint(enrollment)}
                size="sm"
                className="bg-blue-900 hover:bg-blue-900 text-white border"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                <Printer size={14} className="mr-1" />
                Print
              </Button>
            )}
            <Button
              onClick={() => onDelete(enrollment)}
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white border"
              disabled={enrollingStudent}
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              <Trash size={14} className="mr-1" />
              Delete
            </Button>
          </div>
        </td>
      </tr>
    )
  }
)

const SkeletonTable = () => (
  <div className="bg-white shadow overflow-hidden">
    <div className="px-4 py-5 sm:p-6">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="h-4 bg-gray-200 w-16"></div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="h-4 bg-gray-200 w-20"></div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="h-4 bg-gray-200 w-12"></div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                <div className="h-4 bg-gray-200 w-16"></div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="h-4 bg-gray-200 w-12"></div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.from({ length: 5 }).map((_, index) => (
              <SkeletonTableRow key={index} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
)
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EnrollmentData } from '@/lib/enrollment-database'

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
import { SubjectData } from '@/lib/subject-database'
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
} from 'firebase/firestore'
import { db } from '@/lib/firebase-server'
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
  Calculator,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  User as UserIcon,
  FileText as FileTextIcon,
  GraduationCap as GraduationCapIcon,
  X,
  Printer,
  Check,
  Lightning,
  Shield,
  Trash,
} from '@phosphor-icons/react'
import ViewHandler from './viewHandler'

interface EnrollmentManagementProps {
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
  gradeLevel: number // Legacy field
  gradeLevels?: number[] // New field
  courseSelections?: {
    code: string
    year: number
    semester: 'first-sem' | 'second-sem'
  }[] // College course selections
  color: string
  createdAt: string
  updatedAt: string
  createdBy: string
}

interface ScholarshipData {
  id: string
  code: string
  name: string
  value: number
  minUnit: number
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

export default function EnrollmentManagement({
  registrarUid,
  registrarName,
}: EnrollmentManagementProps) {
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
  const [allSubjectSets, setAllSubjectSets] = useState<SubjectSetData[]>([])
  const [subjects, setSubjects] = useState<Record<string, SubjectData>>({})
  const [grades, setGrades] = useState<Record<string, { color: string }>>({})
  const [courses, setCourses] = useState<Record<string, { color: string }>>({})
  const [selectedSubjectSets, setSelectedSubjectSets] = useState<string[]>([])
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [showOtherSets, setShowOtherSets] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewingEnrollment, setViewingEnrollment] =
    useState<ExtendedEnrollmentData | null>(null)
  const [sortOption, setSortOption] = useState<string>('latest')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8
  const [activeTab, setActiveTab] = useState<string>('student-info')
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [showRevokeModal, setShowRevokeModal] = useState(false)
  const [revokeCountdown, setRevokeCountdown] = useState(0)
  const [enrollingStudent, setEnrollingStudent] = useState(false)
  const [revokingEnrollment, setRevokingEnrollment] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteCountdown, setDeleteCountdown] = useState(0)
  const [deletingEnrollment, setDeletingEnrollment] = useState(false)
  const [enrollmentToDelete, setEnrollmentToDelete] =
    useState<ExtendedEnrollmentData | null>(null)
  const [showQuickEnrollModal, setShowQuickEnrollModal] = useState(false)
  const [quickEnrollData, setQuickEnrollData] = useState<{
    enrollment: ExtendedEnrollmentData
    subjects: string[]
  } | null>(null)
  const [quickEnrollOrNumber, setQuickEnrollOrNumber] = useState('')
  const [quickEnrollScholarship, setQuickEnrollScholarship] = useState('')
  const [quickEnrollStudentId, setQuickEnrollStudentId] = useState('')
  const [showEnrollModal, setShowEnrollModal] = useState(false)
  const [enrollOrNumber, setEnrollOrNumber] = useState('')
  const [enrollScholarship, setEnrollScholarship] = useState('')
  const [enrollStudentId, setEnrollStudentId] = useState('')
  const [showScholarshipModal, setShowScholarshipModal] = useState(false)
  const [scholarships, setScholarships] = useState<ScholarshipData[]>([])
  const [editingScholarship, setEditingScholarship] =
    useState<ScholarshipData | null>(null)
  const [scholarshipForm, setScholarshipForm] = useState({
    code: '',
    name: '',
    value: 0,
    minUnit: 0,
  })
  const [scholarshipLoading, setScholarshipLoading] = useState(false)
  const [allDataLoaded, setAllDataLoaded] = useState(false)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  // Grades tab state (per viewed student)
  const [viewingStudentGrades, setViewingStudentGrades] = useState<
    Record<string, any>
  >({})
  const [gradesLoading, setGradesLoading] = useState(false)
  const [gradesError, setGradesError] = useState('')
  const [gradesLoadedUserId, setGradesLoadedUserId] = useState<string | null>(
    null
  )

  // Compute total units for a set of subject IDs
  const getTotalUnits = (subjectIds: string[]) => {
    return subjectIds.reduce((sum, id) => {
      const s = subjects[id]
      if (!s) return sum
      const lu = Number(s.lectureUnits || 0)
      const la = Number(s.labUnits || 0)
      return sum + lu + la
    }, 0)
  }

  // Scholarships filtered for quick enroll context
  const filteredQuickScholarships = React.useMemo(() => {
    if (!quickEnrollData) return scholarships
    const totalUnits = getTotalUnits(quickEnrollData.subjects)
    return scholarships.filter((s) => (s.minUnit || 0) <= totalUnits)
  }, [quickEnrollData, subjects, scholarships])

  // Scholarships filtered for enroll modal context
  const filteredEnrollScholarships = React.useMemo(() => {
    const totalUnits = getTotalUnits(selectedSubjects)
    return scholarships.filter((s) => (s.minUnit || 0) <= totalUnits)
  }, [selectedSubjects, subjects, scholarships])

  // Subject Assignments
  const [subjectAssignments, setSubjectAssignments] = useState<
    SubjectAssignmentData[]
  >([])
  const [subjectAssignmentLoading, setSubjectAssignmentLoading] =
    useState(false)

  // Settings Management
  const [showAcademicYearModal, setShowAcademicYearModal] = useState(false)
  const [currentAY, setCurrentAY] = useState('')
  const [currentSemester, setCurrentSemester] = useState('')
  const [newAY, setNewAY] = useState('')
  const [newSemester, setNewSemester] = useState('')
  const [updatingAY, setUpdatingAY] = useState(false)
  const [currentAYFilter, setCurrentAYFilter] = useState('')
  const [currentSemesterFilter, setCurrentSemesterFilter] = useState('')
  // Enrollment Duration - High School
  const [currentEnrollmentStartHS, setCurrentEnrollmentStartHS] = useState('')
  const [currentEnrollmentEndHS, setCurrentEnrollmentEndHS] = useState('')
  const [newEnrollmentStartHS, setNewEnrollmentStartHS] = useState('')
  const [newEnrollmentEndHS, setNewEnrollmentEndHS] = useState('')
  // Enrollment Duration - College
  const [currentEnrollmentStartCollege, setCurrentEnrollmentStartCollege] =
    useState('')
  const [currentEnrollmentEndCollege, setCurrentEnrollmentEndCollege] =
    useState('')
  const [newEnrollmentStartCollege, setNewEnrollmentStartCollege] = useState('')
  const [newEnrollmentEndCollege, setNewEnrollmentEndCollege] = useState('')

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)

    // Auto-select assigned subjects when switching to Subject Assignment tab
    if (tabId === 'subjects' && viewingEnrollment) {
      setTimeout(() => {
        const enrollmentInfo = viewingEnrollment.enrollmentInfo
        let assignedSubjectIds: string[] = []
        let assignedSubjectSetIds: string[] = []

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
            const subjectSet = allSubjectSets.find(
              (set) => set.id === assignment.subjectSetId
            )
            if (subjectSet) {
              assignedSubjectIds = subjectSet.subjects
              assignedSubjectSetIds = [subjectSet.id]
            }
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
              const subjectSet = allSubjectSets.find(
                (set) => set.id === assignment.subjectSetId
              )
              if (subjectSet) {
                assignedSubjectIds = subjectSet.subjects
                assignedSubjectSetIds = [subjectSet.id]
              }
            }
          }
        }

        // Set the assigned subjects and subject sets
        if (assignedSubjectIds.length > 0) {
          setSelectedSubjectSets(assignedSubjectSetIds)
          setSelectedSubjects(assignedSubjectIds)
        } else {
          // If no assignment found, clear selections
          setSelectedSubjectSets([])
          setSelectedSubjects([])
        }
      }, 100)
    }

    // Lazy-load grades when Grades tab becomes active
    if (tabId === 'grades' && viewingEnrollment) {
      if (gradesLoadedUserId !== viewingEnrollment.userId) {
        loadViewingStudentGrades(viewingEnrollment.userId)
      }
    }
  }
  const [showDocumentModal, setShowDocumentModal] = useState(false)
  const [viewingDocument, setViewingDocument] = useState<{
    url: string
    fileName: string
    fileType: string
    fileFormat: string
  } | null>(null)

  // Setup real-time listener on component mount
  useEffect(() => {
    setupRealtimeListener()

    // Cleanup function to unsubscribe from real-time listener
    return () => {
      if (unsubscribeRef.current) {
        console.log('🔌 Unsubscribing from real-time listener')
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
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

  // Countdown timer for revoke modal
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (showRevokeModal && revokeCountdown > 0) {
      timer = setTimeout(() => {
        setRevokeCountdown(revokeCountdown - 1)
      }, 1000)
    }
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [showRevokeModal, revokeCountdown])

  // Countdown timer for delete modal
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (showDeleteModal && deleteCountdown > 0) {
      timer = setTimeout(() => {
        setDeleteCountdown(deleteCountdown - 1)
      }, 1000)
    }
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [showDeleteModal, deleteCountdown])

  // Load scholarships when modal opens
  useEffect(() => {
    if (showScholarshipModal) {
      loadScholarships()
    }
  }, [showScholarshipModal])

  // Load current settings when Settings modal opens
  useEffect(() => {
    if (showAcademicYearModal) {
      loadCurrentAY()
    }
  }, [showAcademicYearModal])

  const setupRealtimeListener = async () => {
    try {
      setLoading(true)
      setAllDataLoaded(false)
      setError('')

      // Get system config to determine current AY code
      const response = await fetch('/api/enrollment?getConfig=true')
      const configData = await response.json()

      if (!response.ok || !configData.ayCode) {
        throw new Error('Failed to get system configuration')
      }

      const ayCode = configData.ayCode
      const semester = configData.semester || '1'
      console.log(
        '🔄 Setting up real-time listener for AY:',
        ayCode,
        'Semester:',
        semester
      )

      // Set the current AY and Semester filters
      setCurrentAYFilter(ayCode)
      setCurrentSemesterFilter(semester)

      // Create query for real-time listening - filter by current AY
      const enrollmentsRef = collection(db, 'enrollments')
      const q = query(enrollmentsRef, where('ayCode', '==', ayCode))

      // Set up real-time listener
      const unsubscribe = onSnapshot(
        q,
        async (snapshot) => {
          console.log(
            '📡 Real-time update received:',
            snapshot.docChanges().length,
            'changes'
          )

          const enrollments: ExtendedEnrollmentData[] = []

          for (const doc of snapshot.docs) {
            const enrollmentDoc = doc.data()
            if (enrollmentDoc.enrollmentData) {
              enrollments.push({
                ...enrollmentDoc.enrollmentData,
                id: doc.id,
              })
            }
          }

          // Sort enrollments by updatedAt (most recent first)
          enrollments.sort((a, b) => {
            const dateA = new Date(a.updatedAt).getTime()
            const dateB = new Date(b.updatedAt).getTime()
            return dateB - dateA
          })

          console.log('📋 Updated enrollments:', enrollments.length, 'total')

          setEnrollments(enrollments)
          setError('')

          // Load all related data and wait for completion
          try {
            await Promise.all([
              loadStudentProfiles(enrollments),
              loadStudentDocuments(enrollments),
              loadSubjectSets(),
              loadSubjects(),
              loadGrades(),
              loadCourses(),
              loadScholarships(),
              loadSubjectAssignments(),
            ])
            console.log('  All data loaded successfully')
            setAllDataLoaded(true)
          } catch (dataError) {
            console.error('❌ Error loading related data:', dataError)
            setError('Failed to load all required data')
          }
        },
        (error) => {
          console.error('❌ Real-time listener error:', error)
          setError('Failed to listen for real-time updates')
          toast.error(
            'Failed to connect to real-time updates. Table may not update automatically.',
            {
              autoClose: 8000,
            }
          )
        }
      )

      // Store unsubscribe function for cleanup
      unsubscribeRef.current = unsubscribe
    } catch (error: any) {
      console.error('❌ Error setting up real-time listener:', error)
      setError('Failed to setup real-time updates: ' + error.message)
      toast.error(
        'Unable to setup live table updates. Please check your connection.',
        {
          autoClose: 10000,
        }
      )
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
        // Store all subject sets as a flat array for easier filtering
        const allSubjectSets: SubjectSetData[] = data.subjectSets

        // Also group by grade level for backward compatibility
        const subjectSetsByGrade: Record<number, SubjectSetData[]> = {}

        allSubjectSets.forEach((subjectSet: SubjectSetData) => {
          // Handle new structure with gradeLevels array
          if (subjectSet.gradeLevels && subjectSet.gradeLevels.length > 0) {
            subjectSet.gradeLevels.forEach((gradeLevel) => {
              if (!subjectSetsByGrade[gradeLevel]) {
                subjectSetsByGrade[gradeLevel] = []
              }
              subjectSetsByGrade[gradeLevel].push(subjectSet)
            })
          } else if (subjectSet.gradeLevel) {
            // Legacy structure with single gradeLevel
            const gradeLevel = subjectSet.gradeLevel
            if (!subjectSetsByGrade[gradeLevel]) {
              subjectSetsByGrade[gradeLevel] = []
            }
            subjectSetsByGrade[gradeLevel].push(subjectSet)
          }
        })

        console.log('Loaded subject sets by grade:', subjectSetsByGrade)
        setSubjectSets(subjectSetsByGrade)
        setAllSubjectSets(allSubjectSets)
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
      const response = await fetch('/api/grades')
      const data = await response.json()

      if (response.ok && data.grades) {
        const gradesMap: Record<string, { color: string }> = {}
        data.grades.forEach((grade: any) => {
          gradesMap[grade.id] = { color: grade.color }
        })
        setGrades(gradesMap)
        console.log('📚 Loaded grades data:', gradesMap)
      }
    } catch (error) {
      console.error('Error loading grades:', error)
    }
  }

  const loadCourses = async () => {
    try {
      const response = await fetch('/api/courses')
      const data = await response.json()

      if (response.ok && data.courses) {
        const coursesMap: Record<string, { color: string }> = {}
        data.courses.forEach((course: any) => {
          coursesMap[course.code] = { color: course.color }
        })
        setCourses(coursesMap)
        console.log('📚 Loaded courses data:', coursesMap)
      }
    } catch (error) {
      console.error('Error loading courses:', error)
    }
  }

  const handleViewEnrollment = (enrollment: ExtendedEnrollmentData) => {
    setViewingEnrollment(enrollment)
    setShowViewModal(true)

    // Auto-select assigned subjects when opening the modal
    setTimeout(() => {
      const enrollmentInfo = enrollment.enrollmentInfo

      if (enrollmentInfo?.level === 'college') {
        // For college students, find the assigned subject set
        const courseCode = enrollmentInfo.courseCode
        const yearLevel = parseInt(enrollmentInfo.yearLevel || '1')
        const semester = enrollmentInfo.semester

        const assignment = subjectAssignments.find(
          (assignment) =>
            assignment.level === 'college' &&
            assignment.courseCode === courseCode &&
            assignment.yearLevel === yearLevel &&
            assignment.semester === semester
        )

        if (assignment) {
          const assignedSubjectSet = allSubjectSets.find(
            (set) => set.id === assignment.subjectSetId
          )
          if (assignedSubjectSet) {
            setSelectedSubjectSets([assignedSubjectSet.id])
            setSelectedSubjects(assignedSubjectSet.subjects)
          }
        }
      } else {
        // High school logic - find the assigned subject set
        const gradeLevel = enrollmentInfo?.gradeLevel
        if (gradeLevel) {
          const gradeLevelNum = parseInt(gradeLevel)
          const assignment = subjectAssignments.find(
            (assignment) =>
              assignment.level === 'high-school' &&
              assignment.gradeLevel === gradeLevelNum
          )

          if (assignment) {
            const assignedSubjectSet = allSubjectSets.find(
              (set) => set.id === assignment.subjectSetId
            )
            if (assignedSubjectSet) {
              setSelectedSubjectSets([assignedSubjectSet.id])
              setSelectedSubjects(assignedSubjectSet.subjects)
            }
          }
        }
      }
    }, 100) // Small delay to ensure subject sets are loaded
  }

  const handleQuickEnroll = async (enrollment: ExtendedEnrollmentData) => {
    if (!enrollment || enrollment.enrollmentInfo?.status === 'enrolled') {
      return // Already enrolled
    }

    const enrollmentInfo = enrollment.enrollmentInfo
    let assignedSubjectIds: string[] = []

    if (enrollmentInfo?.level === 'college') {
      // For college students, find the subject assignment for this course, year level, and semester
      const assignment = subjectAssignments.find(
        (assignment) =>
          assignment.level === 'college' &&
          assignment.courseCode === enrollmentInfo.courseCode &&
          assignment.yearLevel === parseInt(enrollmentInfo.yearLevel || '1') &&
          assignment.semester === enrollmentInfo.semester
      )

      if (assignment) {
        // Get the subject set for this assignment
        const subjectSet = allSubjectSets.find(
          (set) => set.id === assignment.subjectSetId
        )
        if (subjectSet) {
          assignedSubjectIds = subjectSet.subjects
        }
      }

      if (assignedSubjectIds.length === 0) {
        toast.error(
          `No subject assignment found for ${enrollmentInfo.courseCode} ${enrollmentInfo.yearLevel} ${enrollmentInfo.semester}. Please create a subject assignment first.`
        )
        return
      }
    } else {
      // High school logic - find assignment for this grade level
      const gradeLevel = enrollmentInfo?.gradeLevel
      if (!gradeLevel) {
        toast.error('No grade level information available for quick enroll.')
        return
      }

      const assignment = subjectAssignments.find(
        (assignment) =>
          assignment.level === 'high-school' &&
          assignment.gradeLevel === parseInt(gradeLevel)
      )

      if (assignment) {
        // Get the subject set for this assignment
        const subjectSet = allSubjectSets.find(
          (set) => set.id === assignment.subjectSetId
        )
        if (subjectSet) {
          assignedSubjectIds = subjectSet.subjects
        }
      }

      if (assignedSubjectIds.length === 0) {
        toast.error(
          `No subject assignment found for Grade ${gradeLevel}. Please create a subject assignment first.`
        )
        return
      }
    }

    // Fetch the latest student ID and increment it
    try {
      const response = await fetch('/api/enrollment?getLatestId=true')
      const data = await response.json()

      if (response.ok && data.success && data.latestId) {
        const nextStudentId = incrementStudentId(data.latestId)
        setQuickEnrollStudentId(nextStudentId)
      } else {
        console.warn('Failed to fetch latest student ID, using fallback')
        setQuickEnrollStudentId('001-001') // Fallback
      }
    } catch (error) {
      console.error('Error fetching latest student ID:', error)
      setQuickEnrollStudentId('001-001') // Fallback
    }

    // Set up preview data and show modal with assigned subjects
    setQuickEnrollData({
      enrollment,
      subjects: assignedSubjectIds,
    })
    setShowQuickEnrollModal(true)
  }

  const confirmQuickEnroll = async () => {
    if (!quickEnrollData) return

    // Determine studentId: prefer existing
    const existingId =
      studentProfiles[quickEnrollData.enrollment.userId]?.studentId ||
      quickEnrollData.enrollment.enrollmentInfo?.studentId
    const finalStudentId = existingId || quickEnrollStudentId

    // Validate required fields
    if (!quickEnrollOrNumber.trim()) {
      toast.error('OR Number is required.', { autoClose: 5000 })
      return
    }
    if (!quickEnrollScholarship.trim()) {
      toast.error('Scholarship is required.', { autoClose: 5000 })
      return
    }
    if (!finalStudentId || !String(finalStudentId).trim()) {
      toast.error('Student ID is required.', { autoClose: 5000 })
      return
    }

    setEnrollingStudent(true)

    try {
      const response = await fetch('/api/enrollment', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: quickEnrollData.enrollment.userId,
          selectedSubjects: quickEnrollData.subjects,
          orNumber: quickEnrollOrNumber,
          scholarship: quickEnrollScholarship,
          studentId: finalStudentId,
          level: quickEnrollData.enrollment.enrollmentInfo?.level,
          semester: quickEnrollData.enrollment.enrollmentInfo?.semester,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        if (!existingId) {
          try {
            await fetch('/api/enrollment', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                updateLatestId: finalStudentId,
              }),
            })
            console.log('  Latest student ID updated to:', finalStudentId)
          } catch (updateError) {
            console.warn(
              '  Failed to update latest student ID, but enrollment was successful:',
              updateError
            )
          }
        }

        toast.success(
          `Quick enrolled ${quickEnrollData.enrollment.personalInfo?.firstName} ${quickEnrollData.enrollment.personalInfo?.lastName} with ${quickEnrollData.subjects.length} subjects.`,
          {
            autoClose: 6000,
          }
        )
        setShowQuickEnrollModal(false)
        setQuickEnrollData(null)
        setQuickEnrollOrNumber('')
        setQuickEnrollScholarship('')
        setQuickEnrollStudentId('')
        // The real-time listener will automatically update the table
      } else {
        toast.error(data.error || 'Failed to quick enroll student.', {
          autoClose: 8000,
        })
      }
    } catch (error) {
      console.error('Error quick enrolling student:', error)
      toast.error('Network error occurred while quick enrolling student.', {
        autoClose: 7000,
      })
    } finally {
      setEnrollingStudent(false)
    }
  }

  const cancelQuickEnroll = () => {
    setShowQuickEnrollModal(false)
    setQuickEnrollData(null)
    setQuickEnrollOrNumber('')
    setQuickEnrollScholarship('')
    setQuickEnrollStudentId('')
  }

  const handleOpenEnrollModal = async () => {
    // If student already has an ID, lock it
    if (viewingEnrollment) {
      const existingId =
        studentProfiles[viewingEnrollment.userId]?.studentId ||
        viewingEnrollment.enrollmentInfo?.studentId
      if (existingId) {
        setEnrollStudentId(existingId)
        setShowEnrollModal(true)
        setEnrollOrNumber('')
        setEnrollScholarship('')
        return
      }
    }
    // Fetch the latest student ID and increment it
    try {
      const response = await fetch('/api/enrollment?getLatestId=true')
      const data = await response.json()

      if (response.ok && data.success && data.latestId) {
        const nextStudentId = incrementStudentId(data.latestId)
        setEnrollStudentId(nextStudentId)
      } else {
        console.warn('Failed to fetch latest student ID, using fallback')
        setEnrollStudentId('001-001') // Fallback
      }
    } catch (error) {
      console.error('Error fetching latest student ID:', error)
      setEnrollStudentId('001-001') // Fallback
    }

    setShowEnrollModal(true)
    setEnrollOrNumber('')
    setEnrollScholarship('')
  }

  const handleConfirmEnroll = async () => {
    if (!viewingEnrollment || selectedSubjects.length === 0) {
      toast.warning(
        'Please select at least one subject before enrolling the student.',
        {
          autoClose: 5000,
        }
      )
      return
    }

    // Determine studentId: prefer existing
    const existingId =
      studentProfiles[viewingEnrollment.userId]?.studentId ||
      viewingEnrollment.enrollmentInfo?.studentId
    const finalStudentId = existingId || enrollStudentId

    // Validate required fields
    if (!enrollOrNumber.trim()) {
      toast.error('OR Number is required.', { autoClose: 5000 })
      return
    }
    if (!enrollScholarship.trim()) {
      toast.error('Scholarship is required.', { autoClose: 5000 })
      return
    }
    if (!finalStudentId || !String(finalStudentId).trim()) {
      toast.error('Student ID is required.', { autoClose: 5000 })
      return
    }

    setEnrollingStudent(true)

    try {
      const response = await fetch('/api/enrollment', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: viewingEnrollment.userId,
          selectedSubjects: selectedSubjects,
          orNumber: enrollOrNumber,
          scholarship: enrollScholarship,
          studentId: finalStudentId,
          level: viewingEnrollment.enrollmentInfo?.level,
          semester: viewingEnrollment.enrollmentInfo?.semester,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        if (!existingId) {
          try {
            await fetch('/api/enrollment', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                updateLatestId: finalStudentId,
              }),
            })
            console.log('  Latest student ID updated to:', finalStudentId)
          } catch (updateError) {
            console.warn(
              '  Failed to update latest student ID, but enrollment was successful:',
              updateError
            )
          }
        }

        toast.success(
          `Student ${viewingEnrollment?.personalInfo?.firstName} ${viewingEnrollment?.personalInfo?.lastName} enrolled with ${selectedSubjects.length} subject(s).`,
          {
            autoClose: 6000,
          }
        )
        setShowEnrollModal(false)
        // Close the modal
        closeViewModal()
      } else {
        toast.error(
          data.error || 'Failed to enroll student. Please try again.',
          {
            autoClose: 8000,
          }
        )
      }
    } catch (error) {
      console.error('Error enrolling student:', error)
      toast.error(
        'Network error occurred while enrolling student. Please check your connection and try again.',
        {
          autoClose: 7000,
        }
      )
    } finally {
      setEnrollingStudent(false)
    }
  }

  const cancelEnrollModal = () => {
    setShowEnrollModal(false)
    setEnrollOrNumber('')
    setEnrollScholarship('')
    setEnrollStudentId('')
  }

  // Scholarship CRUD functions
  const loadScholarships = async () => {
    try {
      const response = await fetch('/api/scholarships')
      const data = await response.json()

      if (response.ok && data.scholarships) {
        setScholarships(data.scholarships)
      } else {
        console.error('Failed to load scholarships:', data)
      }
    } catch (error) {
      console.error('Error loading scholarships:', error)
    }
  }

  // Subject Assignment functions
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

  const handleCreateScholarship = async () => {
    if (!scholarshipForm.code.trim() || !scholarshipForm.name.trim()) {
      toast.error('Code and Name are required.', { autoClose: 5000 })
      return
    }

    setScholarshipLoading(true)

    try {
      const response = await fetch('/api/scholarships', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scholarshipForm),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success('Scholarship created successfully.', { autoClose: 5000 })
        resetScholarshipForm()
        loadScholarships()
      } else {
        toast.error(data.error || 'Failed to create scholarship.', {
          autoClose: 8000,
        })
      }
    } catch (error) {
      console.error('Error creating scholarship:', error)
      toast.error('Network error occurred while creating scholarship.', {
        autoClose: 7000,
      })
    } finally {
      setScholarshipLoading(false)
    }
  }

  const handleUpdateScholarship = async () => {
    if (
      !editingScholarship ||
      !scholarshipForm.code.trim() ||
      !scholarshipForm.name.trim()
    ) {
      toast.error('Code and Name are required.', { autoClose: 5000 })
      return
    }

    setScholarshipLoading(true)

    try {
      const response = await fetch(
        `/api/scholarships/${editingScholarship.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(scholarshipForm),
        }
      )

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success('Scholarship updated successfully.', { autoClose: 5000 })
        resetScholarshipForm()
        setEditingScholarship(null)
        loadScholarships()
      } else {
        toast.error(data.error || 'Failed to update scholarship.', {
          autoClose: 8000,
        })
      }
    } catch (error) {
      console.error('Error updating scholarship:', error)
      toast.error('Network error occurred while updating scholarship.', {
        autoClose: 7000,
      })
    } finally {
      setScholarshipLoading(false)
    }
  }

  const handleDeleteScholarship = async (scholarshipId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this scholarship? This action cannot be undone.'
      )
    ) {
      return
    }

    setScholarshipLoading(true)

    try {
      const response = await fetch(`/api/scholarships/${scholarshipId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success('Scholarship deleted successfully.', { autoClose: 5000 })
        loadScholarships()
      } else {
        toast.error(data.error || 'Failed to delete scholarship.', {
          autoClose: 8000,
        })
      }
    } catch (error) {
      console.error('Error deleting scholarship:', error)
      toast.error('Network error occurred while deleting scholarship.', {
        autoClose: 7000,
      })
    } finally {
      setScholarshipLoading(false)
    }
  }

  const handleEditScholarship = (scholarship: ScholarshipData) => {
    setEditingScholarship(scholarship)
    setScholarshipForm({
      code: scholarship.code,
      name: scholarship.name,
      value: scholarship.value,
      minUnit: scholarship.minUnit,
    })
  }

  const resetScholarshipForm = () => {
    setScholarshipForm({
      code: '',
      name: '',
      value: 0,
      minUnit: 0,
    })
    setEditingScholarship(null)
  }

  const closeScholarshipModal = () => {
    setShowScholarshipModal(false)
    resetScholarshipForm()
  }

  // Settings Management Functions
  const loadCurrentAY = async () => {
    try {
      const response = await fetch('/api/enrollment?getConfig=true')
      const data = await response.json()

      if (response.ok && data.ayCode) {
        setCurrentAY(data.ayCode)
        setNewAY(data.ayCode)
        const semester = data.semester || '1'
        setCurrentSemester(semester)
        setNewSemester(semester)
        setCurrentSemesterFilter(semester)

        // Load enrollment duration for high school if available
        if (data.enrollmentStartPeriodHS) {
          setCurrentEnrollmentStartHS(data.enrollmentStartPeriodHS)
          setNewEnrollmentStartHS(data.enrollmentStartPeriodHS)
        }
        if (data.enrollmentEndPeriodHS) {
          setCurrentEnrollmentEndHS(data.enrollmentEndPeriodHS)
          setNewEnrollmentEndHS(data.enrollmentEndPeriodHS)
        }
        // Load enrollment duration for college if available
        if (data.enrollmentStartPeriodCollege) {
          setCurrentEnrollmentStartCollege(data.enrollmentStartPeriodCollege)
          setNewEnrollmentStartCollege(data.enrollmentStartPeriodCollege)
        }
        if (data.enrollmentEndPeriodCollege) {
          setCurrentEnrollmentEndCollege(data.enrollmentEndPeriodCollege)
          setNewEnrollmentEndCollege(data.enrollmentEndPeriodCollege)
        }
      } else {
        toast.error('Failed to load current settings.', { autoClose: 5000 })
        setCurrentAY('N/A')
        setNewAY('')
        setCurrentSemester('1')
        setNewSemester('1')
        setCurrentSemesterFilter('1')
        setCurrentEnrollmentStartHS('')
        setNewEnrollmentStartHS('')
        setCurrentEnrollmentEndHS('')
        setNewEnrollmentEndHS('')
        setCurrentEnrollmentStartCollege('')
        setNewEnrollmentStartCollege('')
        setCurrentEnrollmentEndCollege('')
        setNewEnrollmentEndCollege('')
      }
    } catch (error) {
      console.error('Error loading current settings:', error)
      toast.error('Network error occurred while loading settings.', {
        autoClose: 7000,
      })
      setCurrentAY('N/A')
      setNewAY('')
      setCurrentSemester('1')
      setNewSemester('1')
      setCurrentSemesterFilter('1')
      setCurrentEnrollmentStartHS('')
      setNewEnrollmentStartHS('')
      setCurrentEnrollmentEndHS('')
      setNewEnrollmentEndHS('')
      setCurrentEnrollmentStartCollege('')
      setNewEnrollmentStartCollege('')
      setCurrentEnrollmentEndCollege('')
      setNewEnrollmentEndCollege('')
    }
  }

  const handleUpdateAcademicYear = async () => {
    // Validate AY format
    if (!newAY.trim()) {
      toast.error('Academic Year is required.', { autoClose: 5000 })
      return
    }

    if (!/^AY\d{2}\d{2}$/.test(newAY.trim())) {
      toast.error(
        'Invalid format. Expected format: AY2526 (e.g., AY for Academic Year followed by 4 digits).',
        { autoClose: 7000 }
      )
      return
    }

    // Validate semester
    if (!newSemester || !/^[12]$/.test(newSemester)) {
      toast.error('Invalid semester. Must be 1 or 2.', { autoClose: 5000 })
      return
    }

    // Validate enrollment duration for high school if provided
    if (newEnrollmentStartHS && newEnrollmentEndHS) {
      const startDate = new Date(newEnrollmentStartHS)
      const endDate = new Date(newEnrollmentEndHS)

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        toast.error(
          'Invalid date format for high school enrollment duration.',
          { autoClose: 5000 }
        )
        return
      }

      if (startDate >= endDate) {
        toast.error('High School: Start Period must be before End Period.', {
          autoClose: 5000,
        })
        return
      }
    }

    // Validate enrollment duration for college if provided
    if (newEnrollmentStartCollege && newEnrollmentEndCollege) {
      const startDate = new Date(newEnrollmentStartCollege)
      const endDate = new Date(newEnrollmentEndCollege)

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        toast.error('Invalid date format for college enrollment duration.', {
          autoClose: 5000,
        })
        return
      }

      if (startDate >= endDate) {
        toast.error('College: Start Period must be before End Period.', {
          autoClose: 5000,
        })
        return
      }
    }

    setUpdatingAY(true)

    try {
      const response = await fetch('/api/enrollment', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          updateAY: newAY.trim(),
          updateSemester: newSemester,
          updateEnrollmentStartPeriodHS: newEnrollmentStartHS || null,
          updateEnrollmentEndPeriodHS: newEnrollmentEndHS || null,
          updateEnrollmentStartPeriodCollege: newEnrollmentStartCollege || null,
          updateEnrollmentEndPeriodCollege: newEnrollmentEndCollege || null,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success(`Settings updated successfully.`, { autoClose: 6000 })
        setCurrentAY(newAY.trim())
        setCurrentSemester(newSemester)
        setCurrentAYFilter(newAY.trim())
        setCurrentSemesterFilter(newSemester)
        if (newEnrollmentStartHS)
          setCurrentEnrollmentStartHS(newEnrollmentStartHS)
        if (newEnrollmentEndHS) setCurrentEnrollmentEndHS(newEnrollmentEndHS)
        if (newEnrollmentStartCollege)
          setCurrentEnrollmentStartCollege(newEnrollmentStartCollege)
        if (newEnrollmentEndCollege)
          setCurrentEnrollmentEndCollege(newEnrollmentEndCollege)
        setShowAcademicYearModal(false)
        // Real-time listener will automatically update with new filters
      } else {
        toast.error(data.error || 'Failed to update settings.', {
          autoClose: 8000,
        })
      }
    } catch (error) {
      console.error('Error updating settings:', error)
      toast.error('Network error occurred while updating settings.', {
        autoClose: 7000,
      })
    } finally {
      setUpdatingAY(false)
    }
  }

  const closeAcademicYearModal = () => {
    setShowAcademicYearModal(false)
    setNewAY('')
    setNewSemester('')
    setNewEnrollmentStartHS('')
    setNewEnrollmentEndHS('')
    setNewEnrollmentStartCollege('')
    setNewEnrollmentEndCollege('')
  }

  const closeViewModal = () => {
    setShowViewModal(false)
    setViewingEnrollment(null)
    setActiveTab('student-info')
    setSelectedSubjectSets([])
    setSelectedSubjects([])
    setShowOtherSets(false)
    setShowRevokeModal(false)
    setRevokeCountdown(0)
    setShowQuickEnrollModal(false)
    setQuickEnrollData(null)
    setShowEnrollModal(false)
    setEnrollOrNumber('')
    setEnrollScholarship('')
    setEnrollStudentId('')
    setEnrollingStudent(false)
    setRevokingEnrollment(false)
  }

  const handleSubjectSetToggle = (
    subjectSetId: string,
    subjectIds: string[]
  ) => {
    setSelectedSubjectSets((prev) => {
      const isSelected = prev.includes(subjectSetId)
      let newSelectedSets

      if (isSelected) {
        // Remove subject set and its subjects
        newSelectedSets = prev.filter((id) => id !== subjectSetId)
        setSelectedSubjects((prevSubjects) =>
          prevSubjects.filter((id) => !subjectIds.includes(id))
        )
      } else {
        // Add subject set and its subjects (avoiding duplicates)
        newSelectedSets = [...prev, subjectSetId]
        setSelectedSubjects((prevSubjects) => {
          const newSubjects = [...prevSubjects]
          subjectIds.forEach((subjectId) => {
            if (!newSubjects.includes(subjectId)) {
              newSubjects.push(subjectId)
            }
          })
          return newSubjects
        })
      }

      return newSelectedSets
    })
  }

  const handleSubjectToggle = (subjectId: string) => {
    setSelectedSubjects((prev) => {
      const isSelected = prev.includes(subjectId)
      if (isSelected) {
        return prev.filter((id) => id !== subjectId)
      } else {
        return [...prev, subjectId]
      }
    })
  }

  const handleViewDocument = (doc: StudentDocument) => {
    setViewingDocument({
      url: doc.fileUrl,
      fileName: doc.fileName,
      fileType: doc.fileType,
      fileFormat: doc.fileFormat,
    })
    setShowDocumentModal(true)
  }

  const handleCloseDocumentModal = () => {
    setShowDocumentModal(false)
    setViewingDocument(null)
  }

  // Load grades for the currently viewed student
  const loadViewingStudentGrades = async (userId: string) => {
    try {
      setGradesLoading(true)
      setGradesError('')

      // Ensure subjects are available (reuse global state if already loaded)
      if (Object.keys(subjects).length === 0) {
        await loadSubjects()
      }

      // Fetch student grades for target AY: prefer current filter; fallback to system config
      let ayParam = currentAYFilter
      if (!ayParam) {
        try {
          const cfg = await fetch('/api/enrollment?getConfig=true')
          const cfgData = await cfg.json()
          if (cfg.ok && cfgData.ayCode) ayParam = cfgData.ayCode
        } catch {}
      }

      const res = await fetch(
        `/api/students/${userId}/grades${ayParam ? `?ayCode=${ayParam}` : ''}`
      )
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load grades')
      }

      const grades = data.grades || {}
      setViewingStudentGrades(grades)
      setGradesLoadedUserId(userId)
    } catch (e: any) {
      console.error('Failed to load viewing student grades:', e)
      setGradesError(e.message || 'Failed to load grades')
      toast.error('Failed to load grades for this student')
    } finally {
      setGradesLoading(false)
    }
  }

  const handleEnrollStudent = async () => {
    if (!viewingEnrollment || selectedSubjects.length === 0) {
      toast.warning(
        'Please select at least one subject before enrolling the student.',
        {
          autoClose: 5000,
        }
      )
      return
    }

    setEnrollingStudent(true)

    try {
      const response = await fetch('/api/enrollment', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: viewingEnrollment.userId,
          selectedSubjects: selectedSubjects,
          level: viewingEnrollment.enrollmentInfo?.level,
          semester: viewingEnrollment.enrollmentInfo?.semester,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success(
          `Student ${viewingEnrollment?.personalInfo?.firstName} ${viewingEnrollment?.personalInfo?.lastName} enrolled with ${selectedSubjects.length} subject(s).`,
          {
            autoClose: 6000,
          }
        )
        // Close the modal
        closeViewModal()
      } else {
        toast.error(
          data.error || 'Failed to enroll student. Please try again.',
          {
            autoClose: 8000,
          }
        )
      }
    } catch (error) {
      console.error('Error enrolling student:', error)
      toast.error(
        'Network error occurred while enrolling student. Please check your connection and try again.',
        {
          autoClose: 7000,
        }
      )
    } finally {
      setEnrollingStudent(false)
    }
  }

  const handleRevokeEnrollment = () => {
    setShowRevokeModal(true)
    setRevokeCountdown(5)
  }

  const confirmRevokeEnrollment = async () => {
    if (!viewingEnrollment) {
      toast.error(
        'Unable to find enrollment information. Please refresh and try again.',
        {
          autoClose: 5000,
        }
      )
      return
    }

    setRevokingEnrollment(true)

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
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success(
          `Enrollment for ${viewingEnrollment?.personalInfo?.firstName} ${viewingEnrollment?.personalInfo?.lastName} has been revoked.`,
          {
            autoClose: 6000,
          }
        )
        setShowRevokeModal(false)
        // Close the modal
        closeViewModal()
      } else {
        toast.error(
          data.error || 'Failed to revoke enrollment. Please try again.',
          {
            autoClose: 8000,
          }
        )
      }
    } catch (error) {
      console.error('Error revoking enrollment:', error)
      toast.error(
        'Network error occurred while revoking enrollment. Please check your connection and try again.',
        {
          autoClose: 7000,
        }
      )
    } finally {
      setRevokingEnrollment(false)
    }
  }

  const cancelRevoke = () => {
    setShowRevokeModal(false)
    setRevokeCountdown(0)
  }

  const handleDeleteEnrollment = (enrollment: ExtendedEnrollmentData) => {
    setEnrollmentToDelete(enrollment)
    setShowDeleteModal(true)
    setDeleteCountdown(5)
  }

  const confirmDeleteEnrollment = async () => {
    if (!enrollmentToDelete) {
      toast.error(
        'Unable to find enrollment information. Please refresh and try again.',
        {
          autoClose: 5000,
        }
      )
      return
    }

    setDeletingEnrollment(true)

    try {
      const response = await fetch('/api/enrollment', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: enrollmentToDelete.userId,
          level: enrollmentToDelete.enrollmentInfo?.level,
          semester: enrollmentToDelete.enrollmentInfo?.semester,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success(
          `Enrollment for ${enrollmentToDelete?.personalInfo?.firstName} ${enrollmentToDelete?.personalInfo?.lastName} has been deleted permanently.`,
          {
            autoClose: 6000,
          }
        )
        setShowDeleteModal(false)
        setEnrollmentToDelete(null)
      } else {
        toast.error(
          data.error || 'Failed to delete enrollment. Please try again.',
          {
            autoClose: 8000,
          }
        )
      }
    } catch (error) {
      console.error('Error deleting enrollment:', error)
      toast.error(
        'Network error occurred while deleting enrollment. Please check your connection and try again.',
        {
          autoClose: 7000,
        }
      )
    } finally {
      setDeletingEnrollment(false)
    }
  }

  const cancelDelete = () => {
    setShowDeleteModal(false)
    setDeleteCountdown(0)
    setEnrollmentToDelete(null)
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
    // First, filter by current AY (only show enrollments matching the current Academic Year)
    let filtered = enrollments.filter((enrollment) => {
      if (!currentAYFilter) return true // If no filter set, show all
      // Check if enrollment's schoolYear matches the current AY filter
      const enrollmentAY = enrollment.enrollmentInfo?.schoolYear
      return enrollmentAY === currentAYFilter
    })

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

    // Then, filter out enrolled students (only show pending enrollments)
    filtered = filtered.filter(
      (enrollment) => enrollment.enrollmentInfo?.status !== 'enrolled'
    )

    // Apply date filters first
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
  ])

  // Paginated enrollments
  const paginatedEnrollments = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredAndSortedEnrollments.slice(startIndex, endIndex)
  }, [filteredAndSortedEnrollments, currentPage, itemsPerPage])

  // Calculate total pages
  const totalPages = Math.ceil(
    filteredAndSortedEnrollments.length / itemsPerPage
  )

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'enrolled':
        return 'bg-blue-100 text-blue-900'
      default:
        return 'bg-gray-100 text-gray-800'
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

  // Helper function to increment student ID (YYY-XXX format)
  const incrementStudentId = (currentId: string): string => {
    try {
      const parts = currentId.split('-')
      if (parts.length !== 2) {
        throw new Error('Invalid ID format')
      }

      const prefix = parts[0] // YYY part
      const numberPart = parseInt(parts[1]) // XXX part

      if (isNaN(numberPart)) {
        throw new Error('Invalid number part')
      }

      const nextNumber = numberPart + 1
      // Pad with zeros to maintain 3-digit format
      const nextNumberStr = nextNumber.toString().padStart(3, '0')

      return `${prefix}-${nextNumberStr}`
    } catch (error) {
      console.error('Error incrementing student ID:', error)
      // Return a fallback incremented ID
      return '001-001'
    }
  }

  // Get grade color from database (matching grade-list.tsx structure)
  const getGradeColor = (gradeLevel: number): string => {
    // Find the grade document that matches this grade level
    const gradeEntries = Object.entries(grades)
    console.log(
      '🔍 Looking for grade color for level:',
      gradeLevel,
      'Available grades:',
      gradeEntries
    )

    const matchingGrade = gradeEntries.find(([id, gradeData]) => {
      // Extract grade level from ID like "grade-7-jhs" -> 7
      const idParts = id.split('-')
      const idGradeLevel = parseInt(idParts[1])
      console.log(
        '🔍 Checking grade ID:',
        id,
        'Parts:',
        idParts,
        'Grade level:',
        idGradeLevel
      )
      return idGradeLevel === gradeLevel
    })

    const color = matchingGrade ? matchingGrade[1].color : 'blue-900'
    console.log('🎨 Grade', gradeLevel, 'color:', color)
    return color // default to blue-900
  }

  // Get course color from database by course code
  const getCourseColor = (courseCode: string): string => {
    // Find the course that matches the course code
    const courseData = courses[courseCode]
    console.log(
      '🔍 Looking for course color for code:',
      courseCode,
      'Found:',
      courseData
    )

    const color = courseData ? courseData.color : 'blue-900'
    console.log('🎨 Course', courseCode, 'color:', color)
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

  // Color mapping for background colors (matching grade-list.tsx)
  const getBgColor = (color: string): string => {
    const colorMap: { [key: string]: string } = {
      'blue-900': '#1e40af',
      'red-800': '#991b1b',
      'emerald-800': '#064e3b',
      'yellow-800': '#92400e',
      'orange-800': '#9a3412',
      'violet-800': '#5b21b6',
      'purple-800': '#581c87',
    }
    return colorMap[color] || '#1e40af' // default to blue-900
  }

  // Get status color as hex value for square badge
  const getStatusHexColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'approved':
        return '#22c55e' // green-500
      case 'pending':
        return '#eab308' // yellow-500
      case 'rejected':
        return '#ef4444' // red-500
      case 'enrolled':
        return '#3b82f6' // blue-500
      default:
        return '#6b7280' // gray-500
    }
  }

  // Calculate time ago string and badge color
  const getTimeAgoInfo = (dateInput: any) => {
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
        return { text: 'Invalid Date', color: '#6b7280' } // gray-500
      }

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return { text: 'Invalid Date', color: '#6b7280' } // gray-500
      }

      const now = new Date()
      const diffInMs = now.getTime() - date.getTime()
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
      const diffInWeeks = Math.floor(diffInDays / 7)
      const diffInMonths = Math.floor(diffInDays / 30)

      let text: string
      let color: string

      if (diffInMinutes < 1) {
        text = 'Just now'
        color = '#065f46' // emerald-800
      } else if (diffInMinutes < 60) {
        text = `${diffInMinutes}m ago`
        color = '#065f46' // emerald-800
      } else if (diffInHours < 24) {
        text = `${diffInHours}h ago`
        color = '#065f46' // emerald-800
      } else if (diffInDays < 3) {
        text = `${diffInDays}d ago`
        color = '#92400e' // yellow-800
      } else if (diffInDays < 7) {
        text = `${diffInDays}d ago`
        color = '#92400e' // yellow-800
      } else if (diffInWeeks < 4) {
        text = `${diffInWeeks}w ago`
        color = '#9a3412' // orange-800
      } else if (diffInMonths < 12) {
        text = `${diffInMonths}mo ago`
        color = '#991b1b' // red-800
      } else {
        text = '>1y ago'
        color = '#7f1d1d' // red-900
      }

      return { text, color }
    } catch {
      return { text: 'Invalid Date', color: '#6b7280' } // gray-500
    }
  }

  // Tab content for the modal
  const tabs: Tab[] = React.useMemo(
    () => [
      {
        id: 'student-info',
        label: 'Student Information',
        icon: (
          <div className="w-5 h-5 bg-blue-900 flex items-center justify-center">
            <UserIcon size={12} weight="fill" className="text-white" />
          </div>
        ),
        content: (
          <div className="space-y-6">
            {/* Personal Information Table */}
            <div className="space-y-4">
              <h3
                className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 flex items-center gap-2"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                <div className="w-6 h-6 bg-blue-900 flex items-center justify-center">
                  <UserIcon size={14} weight="fill" className="text-white" />
                </div>
                Personal Information
              </h3>
              <div className="overflow-hidden bg-white border border-gray-200">
                <table className="min-w-full border-collapse border border-gray-200">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        Full Name
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        Date of Birth
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        Age
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        Gender
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        Civil Status
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        Nationality
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        Religion
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        {formatFullName(
                          viewingEnrollment?.personalInfo?.firstName,
                          viewingEnrollment?.personalInfo?.middleName,
                          viewingEnrollment?.personalInfo?.lastName,
                          viewingEnrollment?.personalInfo?.nameExtension
                        )}
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        {(() => {
                          const birthMonth =
                            viewingEnrollment?.personalInfo?.birthMonth
                          const birthDay =
                            viewingEnrollment?.personalInfo?.birthDay
                          const birthYear =
                            viewingEnrollment?.personalInfo?.birthYear
                          if (birthMonth && birthDay && birthYear) {
                            return formatBirthDate(
                              `${birthYear}-${birthMonth.padStart(
                                2,
                                '0'
                              )}-${birthDay.padStart(2, '0')}`
                            )
                          }
                          return 'N/A'
                        })()}
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        {(() => {
                          const birthYear =
                            viewingEnrollment?.personalInfo?.birthYear
                          if (birthYear) {
                            const age =
                              new Date().getFullYear() - parseInt(birthYear)
                            return `${age} years`
                          }
                          return 'N/A'
                        })()}
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        {viewingEnrollment?.personalInfo?.gender || 'N/A'}
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        {viewingEnrollment?.personalInfo?.civilStatus || 'N/A'}
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        {viewingEnrollment?.personalInfo?.citizenship || 'N/A'}
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-xs text-gray-900"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        {viewingEnrollment?.personalInfo?.religion || 'N/A'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Contact Information Table */}
            <div className="space-y-4">
              <h3
                className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 flex items-center gap-2"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                <div className="w-6 h-6 bg-blue-900 flex items-center justify-center">
                  <Phone size={14} weight="fill" className="text-white" />
                </div>
                Contact Information
              </h3>
              <div className="overflow-hidden bg-white border border-gray-200">
                <table className="min-w-full border-collapse border border-gray-200">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        Email Address
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        Phone Number
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        Place of Birth
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        {studentProfiles[viewingEnrollment?.userId || '']
                          ?.email ||
                          viewingEnrollment?.personalInfo?.email ||
                          'N/A'}
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        {viewingEnrollment?.personalInfo?.phone || 'N/A'}
                      </td>
                      <td
                        className="px-6 py-4 text-xs text-gray-900"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        {viewingEnrollment?.personalInfo?.placeOfBirth || 'N/A'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Guardian Information Table */}
            <div className="space-y-4">
              <h3
                className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 flex items-center gap-2"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                <div className="w-6 h-6 bg-blue-900 flex items-center justify-center">
                  <Shield size={14} weight="fill" className="text-white" />
                </div>
                Guardian Information
              </h3>
              <div className="overflow-hidden bg-white border border-gray-200">
                <table className="min-w-full border-collapse border border-gray-200">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        Guardian Name
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        Relationship
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        Phone Number
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        Email Address
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        {studentProfiles[viewingEnrollment?.userId || '']
                          ?.guardianName || 'N/A'}
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        {studentProfiles[viewingEnrollment?.userId || '']
                          ?.guardianRelationship || 'N/A'}
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        {studentProfiles[viewingEnrollment?.userId || '']
                          ?.guardianPhone || 'N/A'}
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-xs text-gray-900"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        {studentProfiles[viewingEnrollment?.userId || '']
                          ?.guardianEmail || 'N/A'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Emergency Contact */}
              {studentProfiles[viewingEnrollment?.userId || '']
                ?.emergencyContact && (
                <div className="bg-gray-50 border border-gray-200 p-4">
                  <h4
                    className="text-xs font-medium text-gray-900 mb-2"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Emergency Contact
                  </h4>
                  <p
                    className="text-xs text-gray-700"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    {
                      studentProfiles[viewingEnrollment?.userId || '']
                        ?.emergencyContact
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Academic Information Table */}
            <div className="space-y-4">
              <h3
                className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 flex items-center gap-2"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                <div className="w-6 h-6 bg-blue-900 flex items-center justify-center">
                  <GraduationCapIcon
                    size={14}
                    weight="fill"
                    className="text-white"
                  />
                </div>
                Academic Information
              </h3>
              <div className="overflow-hidden bg-white border border-gray-200">
                <table className="min-w-full border-collapse border border-gray-200">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        Level
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        School Year
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        Enrollment Date
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        {(() => {
                          const displayInfo =
                            getEnrollmentDisplayInfo(viewingEnrollment)
                          return displayInfo.displayText
                        })()}
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        {viewingEnrollment?.enrollmentInfo?.schoolYear || 'N/A'}
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        {viewingEnrollment?.enrollmentInfo?.enrollmentDate
                          ? formatDate(
                              viewingEnrollment.enrollmentInfo.enrollmentDate
                            )
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium ${getStatusColor(
                            viewingEnrollment?.enrollmentInfo?.status ||
                              'unknown'
                          )}`}
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                        >
                          {viewingEnrollment?.enrollmentInfo?.status ||
                            'Unknown'}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Enrollment Timeline */}
            <div className="space-y-4">
              <h3
                className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 flex items-center gap-2"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                <div className="w-6 h-6 bg-blue-900 flex items-center justify-center">
                  <Calendar size={14} weight="fill" className="text-white" />
                </div>
                Enrollment Timeline
              </h3>
              <div className="bg-white border border-gray-200 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-500">
                  <div>
                    <Label style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                      Submitted At
                    </Label>
                    <div className="space-y-1">
                      <p className="text-xs font-mono">
                        {viewingEnrollment?.submittedAt
                          ? formatDate(viewingEnrollment.submittedAt)
                          : 'N/A'}
                      </p>
                      {viewingEnrollment?.submittedAt && (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 flex-shrink-0"
                            style={{
                              backgroundColor: getTimeAgoInfo(
                                viewingEnrollment.submittedAt
                              ).color,
                            }}
                          ></div>
                          <span
                            className="text-xs font-mono"
                            style={{ fontWeight: 400 }}
                          >
                            {getTimeAgoInfo(viewingEnrollment.submittedAt).text}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                      Last Updated
                    </Label>
                    <p style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                      {viewingEnrollment?.updatedAt
                        ? formatDate(viewingEnrollment.updatedAt)
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'documents',
        label: 'Student Documents',
        icon: (
          <div className="w-5 h-5 bg-blue-900 flex items-center justify-center">
            <FileTextIcon size={12} weight="fill" className="text-white" />
          </div>
        ),
        content: (
          <div className="space-y-4">
            <h3
              className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              <div className="w-6 h-6 bg-blue-900 flex items-center justify-center">
                <FileTextIcon size={14} weight="fill" className="text-white" />
              </div>
              Submitted Documents
            </h3>
            {(() => {
              const documents = viewingEnrollment
                ? studentDocuments[viewingEnrollment.userId]
                : null
              if (!documents || Object.keys(documents).length === 0) {
                return (
                  <div className="bg-gray-50 border border-gray-200 p-4 text-center">
                    <p
                      className="text-gray-500"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      No documents submitted
                    </p>
                  </div>
                )
              }

              const documentTypes = {
                birthCertificate: 'Birth Certificate',
                certificateOfGoodMoral: 'Certificate of Good Moral',
                form137: 'Form 137',
                idPicture: 'ID Picture',
                reportCard: 'Report Card',
              }

              return (
                <div className="space-y-3">
                  {Object.entries(documents).map(([key, doc]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200"
                    >
                      <div className="flex items-center flex-1">
                        <div className="w-10 h-10 bg-blue-900 flex items-center justify-center mr-4">
                          <FileText
                            size={16}
                            weight="fill"
                            className="text-white"
                          />
                        </div>
                        <div className="flex-1">
                          <p
                            className="text-xs font-medium text-gray-900"
                            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                          >
                            {documentTypes[key as keyof typeof documentTypes] ||
                              key}
                          </p>
                          <p
                            className="text-xs text-gray-500"
                            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                          >
                            {doc.fileName} • {doc.fileFormat.toUpperCase()} •{' '}
                            {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                          </p>
                          <p
                            className="text-xs text-gray-400"
                            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                          >
                            Uploaded: {formatDate(doc.uploadedAt)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleViewDocument(doc)}
                        className="px-3 py-1 bg-blue-900 text-white text-xs hover:bg-blue-900 transition-colors flex items-center gap-1"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        <Eye size={12} />
                        View Document
                      </button>
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>
        ),
      },
      {
        id: 'subjects',
        label: 'Subject Assignment',
        icon: (
          <div className="w-5 h-5 bg-blue-900 flex items-center justify-center">
            <GraduationCapIcon size={12} weight="fill" className="text-white" />
          </div>
        ),
        content: (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-lg font-medium text-gray-900 flex items-center gap-2"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                <div className="w-6 h-6 bg-blue-900 flex items-center justify-center">
                  <GraduationCapIcon
                    size={14}
                    weight="fill"
                    className="text-white"
                  />
                </div>
                Subject Assignment
              </h3>
              {selectedSubjects.length > 0 && (
                <div
                  className="text-xs text-gray-600"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  {selectedSubjects.length} subject
                  {selectedSubjects.length !== 1 ? 's' : ''} selected
                </div>
              )}
            </div>

            {selectedSubjects.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4
                    className="text-md font-medium text-blue-900"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Selected Subjects:
                  </h4>
                  <button
                    onClick={() => {
                      setSelectedSubjectSets([])
                      setSelectedSubjects([])
                      toast.info('All selected subjects have been cleared.', {
                        autoClose: 4000,
                      })
                    }}
                    className="text-blue-900 hover:text-blue-900 text-xs font-medium transition-colors"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    // Get the assigned subject set
                    const enrollmentInfo = viewingEnrollment?.enrollmentInfo
                    let assignedSubjectSetId: string | undefined

                    if (enrollmentInfo?.level === 'college') {
                      const assignment = subjectAssignments.find(
                        (assignment) =>
                          assignment.level === 'college' &&
                          assignment.courseCode === enrollmentInfo.courseCode &&
                          assignment.yearLevel ===
                            parseInt(enrollmentInfo.yearLevel || '1') &&
                          assignment.semester === enrollmentInfo.semester
                      )
                      assignedSubjectSetId = assignment?.subjectSetId
                    } else if (enrollmentInfo?.gradeLevel) {
                      const assignment = subjectAssignments.find(
                        (assignment) =>
                          assignment.level === 'high-school' &&
                          assignment.gradeLevel ===
                            parseInt(enrollmentInfo.gradeLevel || '0')
                      )
                      assignedSubjectSetId = assignment?.subjectSetId
                    }

                    // Get subjects from the assigned subject set first
                    const assignedSet = allSubjectSets.find(
                      (set) => set.id === assignedSubjectSetId
                    )
                    const assignedSubjectIds = assignedSet?.subjects || []

                    // Check if subjects are loaded
                    const loadedSubjects = Array.from(
                      new Set(selectedSubjects)
                    ).filter((subjectId) => subjects[subjectId])
                    const hasUnloadedSubjects =
                      selectedSubjects.length > 0 && loadedSubjects.length === 0

                    if (hasUnloadedSubjects || selectedSubjects.length === 0) {
                      // Show skeleton while loading
                      return (
                        <>
                          {[1, 2, 3, 4].map((i) => (
                            <div
                              key={`skeleton-${i}`}
                              className="animate-pulse flex items-center gap-2 px-3 py-1 bg-gray-200 border border-gray-200 rounded-lg"
                              style={{ minWidth: '120px', height: '28px' }}
                            >
                              <div className="w-2 h-2 bg-gray-300 rounded"></div>
                              <div className="w-16 h-3 bg-gray-300 rounded"></div>
                            </div>
                          ))}
                        </>
                      )
                    }

                    // Sort subjects: assigned ones first, then the rest
                    const sortedSubjects = [...loadedSubjects].sort((a, b) => {
                      const aIsAssigned = assignedSubjectIds.includes(a)
                      const bIsAssigned = assignedSubjectIds.includes(b)
                      if (aIsAssigned && !bIsAssigned) return -1
                      if (!aIsAssigned && bIsAssigned) return 1
                      return 0
                    })

                    // Show actual subjects once loaded
                    return sortedSubjects.map((subjectId, index) => {
                      const subject = subjects[subjectId]
                      if (!subject) return null
                      return (
                        <div
                          key={`selected-${subjectId}-${index}`}
                          className={`flex items-center gap-2 px-3 py-1 bg-${subject.color} border border-${subject.color} text-white text-xs`}
                        >
                          <div className="w-2 h-2 bg-white"></div>
                          {subject.code} {subject.name}
                        </div>
                      )
                    })
                  })()}
                </div>
              </div>
            )}
            {(() => {
              const enrollmentInfo = viewingEnrollment?.enrollmentInfo
              console.log('Enrollment info:', enrollmentInfo)
              console.log('Subject sets:', subjectSets)

              if (enrollmentInfo?.level === 'college') {
                // For college students, show all subject sets but put the assigned one on top
                const courseCode = enrollmentInfo.courseCode
                const yearLevel = parseInt(enrollmentInfo.yearLevel || '1')
                const semester = enrollmentInfo.semester

                // Find the assigned subject set
                const assignment = subjectAssignments.find(
                  (assignment) =>
                    assignment.level === 'college' &&
                    assignment.courseCode === courseCode &&
                    assignment.yearLevel === yearLevel &&
                    assignment.semester === semester
                )

                const assignedSubjectSetId = assignment?.subjectSetId

                // Sort subject sets: assigned one first, then the rest
                const assignedSet = allSubjectSets.find(
                  (set) => set.id === assignedSubjectSetId
                )
                const otherSets = allSubjectSets.filter(
                  (set) => set.id !== assignedSubjectSetId
                )
                const sortedSubjectSets = assignedSet
                  ? [assignedSet, ...otherSets]
                  : allSubjectSets

                if (sortedSubjectSets.length === 0) {
                  return (
                    <div className="bg-gray-50 border border-gray-200 p-4 text-center">
                      <p
                        className="text-gray-500"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        No subject sets available
                      </p>
                    </div>
                  )
                }

                const semesterDisplay =
                  semester === 'first-sem'
                    ? 'Q1'
                    : semester === 'second-sem'
                    ? 'Q2'
                    : ''
                return (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 p-3 mb-4">
                      <p
                        className="text-blue-800 text-xs"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        Showing all subject sets for college student:{' '}
                        {courseCode} - {enrollmentInfo.courseName} (Year{' '}
                        {yearLevel})
                      </p>
                    </div>
                    {sortedSubjectSets.map((subjectSet) => {
                      const isSubjectSetSelected = selectedSubjectSets.includes(
                        subjectSet.id
                      )

                      return (
                        <div
                          key={subjectSet.id}
                          className={`bg-white border-2 p-4 cursor-pointer transition-all duration-300 animate-fadeInUp hover:scale-[1.02] ${
                            isSubjectSetSelected
                              ? 'border-blue-900 bg-blue-50 shadow-lg'
                              : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                          }`}
                        >
                          <div
                            className="flex items-center gap-3 mb-3"
                            onClick={() =>
                              handleSubjectSetToggle(
                                subjectSet.id,
                                subjectSet.subjects
                              )
                            }
                          >
                            <div
                              className={`w-5 h-5 border-2 flex items-center justify-center ${
                                isSubjectSetSelected
                                  ? 'border-blue-900 bg-blue-900'
                                  : 'border-gray-300'
                              }`}
                            >
                              {isSubjectSetSelected && (
                                <div className="w-2 h-2 bg-white"></div>
                              )}
                            </div>
                            <div
                              className={`w-4 h-4 bg-${subjectSet.color} flex items-center justify-center`}
                            >
                              <div className="w-2 h-2 bg-white"></div>
                            </div>
                            <h4
                              className="text-md font-medium text-gray-900"
                              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                            >
                              {subjectSet.name}
                            </h4>
                          </div>
                          <p
                            className="text-xs text-gray-600 mb-3"
                            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                          >
                            {subjectSet.description}
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {subjectSet.subjects.map((subjectId) => {
                              const subject = subjects[subjectId]
                              if (!subject) return null
                              const isSubjectSelected =
                                selectedSubjects.includes(subjectId)

                              return (
                                <div
                                  key={subjectId}
                                  className={`flex items-center gap-2 p-2 border cursor-pointer transition-colors ${
                                    isSubjectSelected
                                      ? 'bg-blue-100 border-blue-300'
                                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                  }`}
                                  onClick={() => handleSubjectToggle(subjectId)}
                                >
                                  <div
                                    className={`w-3 h-3 border flex items-center justify-center ${
                                      isSubjectSelected
                                        ? 'border-blue-900 bg-blue-900'
                                        : 'border-gray-300'
                                    }`}
                                  >
                                    {isSubjectSelected && (
                                      <div className="w-1 h-1 bg-white"></div>
                                    )}
                                  </div>
                                  <div
                                    className={`w-3 h-3 bg-${subject.color}`}
                                  ></div>
                                  <span
                                    className={`text-xs ${
                                      isSubjectSelected
                                        ? 'text-blue-900 font-medium'
                                        : 'text-gray-700'
                                    }`}
                                    style={{
                                      fontFamily: 'Poppins',
                                      fontWeight: 400,
                                    }}
                                  >
                                    {subject.code} {subject.name}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              }

              // High school logic
              const gradeLevel = enrollmentInfo?.gradeLevel
              console.log('Grade level:', gradeLevel)

              if (!gradeLevel) {
                return (
                  <div className="bg-gray-50 border border-gray-200 p-4 text-center">
                    <p
                      className="text-gray-500"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      No grade level information available
                    </p>
                  </div>
                )
              }

              const gradeLevelNum = parseInt(gradeLevel)

              // Find the assigned subject set for this grade level
              const assignment = subjectAssignments.find(
                (assignment) =>
                  assignment.level === 'high-school' &&
                  assignment.gradeLevel === gradeLevelNum
              )

              const assignedSubjectSetId = assignment?.subjectSetId

              // Filter subject sets for this grade level
              const gradeSubjectSets = allSubjectSets.filter((subjectSet) => {
                // Check if the subject set is for this grade level
                if (subjectSet.gradeLevel === gradeLevelNum) return true
                if (
                  subjectSet.gradeLevels &&
                  subjectSet.gradeLevels.includes(gradeLevelNum)
                )
                  return true
                return false
              })

              // Sort subject sets: assigned one first, then the rest
              const assignedSet = gradeSubjectSets.find(
                (set) => set.id === assignedSubjectSetId
              )
              const otherSets = gradeSubjectSets.filter(
                (set) => set.id !== assignedSubjectSetId
              )
              const sortedSubjectSets = assignedSet
                ? [assignedSet, ...otherSets]
                : gradeSubjectSets

              if (sortedSubjectSets.length === 0) {
                return (
                  <div className="bg-gray-50 border border-gray-200 p-4 text-center">
                    <p
                      className="text-gray-500"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      No subject sets available
                    </p>
                  </div>
                )
              }

              return (
                <div className="space-y-4">
                  {sortedSubjectSets.map((subjectSet) => {
                    const isSubjectSetSelected = selectedSubjectSets.includes(
                      subjectSet.id
                    )

                    return (
                      <div
                        key={subjectSet.id}
                        className={`bg-white border-2 p-4 cursor-pointer transition-all duration-300 animate-fadeInUp hover:scale-[1.02] ${
                          isSubjectSetSelected
                            ? 'border-blue-900 bg-blue-50 shadow-lg'
                            : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                        }`}
                      >
                        <div
                          className="flex items-center gap-3 mb-3"
                          onClick={() =>
                            handleSubjectSetToggle(
                              subjectSet.id,
                              subjectSet.subjects
                            )
                          }
                        >
                          <div
                            className={`w-5 h-5 border-2 flex items-center justify-center ${
                              isSubjectSetSelected
                                ? 'border-blue-900 bg-blue-900'
                                : 'border-gray-300'
                            }`}
                          >
                            {isSubjectSetSelected && (
                              <div className="w-2 h-2 bg-white"></div>
                            )}
                          </div>
                          <div
                            className={`w-4 h-4 bg-${subjectSet.color} flex items-center justify-center`}
                          >
                            <div className="w-2 h-2 bg-white"></div>
                          </div>
                          <h4
                            className="text-md font-medium text-gray-900"
                            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                          >
                            {subjectSet.name}
                          </h4>
                        </div>
                        <p
                          className="text-xs text-gray-600 mb-3"
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                        >
                          {subjectSet.description}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {subjectSet.subjects.map((subjectId) => {
                            const subject = subjects[subjectId]
                            if (!subject) return null
                            const isSubjectSelected =
                              selectedSubjects.includes(subjectId)

                            return (
                              <div
                                key={subjectId}
                                className={`flex items-center gap-2 p-2 border cursor-pointer transition-colors ${
                                  isSubjectSelected
                                    ? 'bg-blue-100 border-blue-300'
                                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                }`}
                                onClick={() => handleSubjectToggle(subjectId)}
                              >
                                <div
                                  className={`w-3 h-3 border flex items-center justify-center ${
                                    isSubjectSelected
                                      ? 'border-blue-900 bg-blue-900'
                                      : 'border-gray-300'
                                  }`}
                                >
                                  {isSubjectSelected && (
                                    <div className="w-1 h-1 bg-white"></div>
                                  )}
                                </div>
                                <div
                                  className={`w-3 h-3 bg-${subject.color}`}
                                ></div>
                                <span
                                  className={`text-xs ${
                                    isSubjectSelected
                                      ? 'text-blue-900 font-medium'
                                      : 'text-gray-700'
                                  }`}
                                  style={{
                                    fontFamily: 'Poppins',
                                    fontWeight: 400,
                                  }}
                                >
                                  {subject.name}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()}

            {/* Show Other Sets Button */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowOtherSets(!showOtherSets)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium transition-colors"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                <div className="w-4 h-4 bg-gray-600 flex items-center justify-center">
                  <div className="w-2 h-2 bg-white"></div>
                </div>
                {showOtherSets ? 'Hide Other Sets' : 'Show Other Sets'}
              </button>
            </div>

            {/* Other Subject Sets */}
            {showOtherSets && (
              <div className="mt-4 space-y-4 animate-fadeInUp">
                <h4
                  className="text-lg font-medium text-gray-900 flex items-center gap-2"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  <div className="w-6 h-6 bg-gray-600 flex items-center justify-center">
                    <GraduationCapIcon
                      size={14}
                      weight="fill"
                      className="text-white"
                    />
                  </div>
                  All Subject Sets
                </h4>
                {(() => {
                  const currentGrade =
                    viewingEnrollment?.enrollmentInfo?.gradeLevel
                  const otherGrades = Object.entries(subjectSets).filter(
                    ([grade]) => {
                      return currentGrade
                        ? parseInt(grade) !== parseInt(currentGrade)
                        : true
                    }
                  )

                  if (otherGrades.length === 0) {
                    return (
                      <div className="bg-gray-50 border border-gray-200 p-4 text-center">
                        <p
                          className="text-gray-500"
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                        >
                          No other subject sets available
                        </p>
                      </div>
                    )
                  }

                  return otherGrades.map(([grade, sets]) => (
                    <div key={grade} className="space-y-3">
                      <h5
                        className="text-md font-medium text-gray-700 border-b border-gray-200 pb-1"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        Grade {grade}
                      </h5>
                      <div className="space-y-3">
                        {sets.map((subjectSet) => {
                          const isSubjectSetSelected =
                            selectedSubjectSets.includes(subjectSet.id)

                          return (
                            <div
                              key={subjectSet.id}
                              className={`bg-white border-2 p-4 cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
                                isSubjectSetSelected
                                  ? 'border-blue-900 bg-blue-50 shadow-lg'
                                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                              }`}
                            >
                              <div
                                className="flex items-center gap-3 mb-3"
                                onClick={() =>
                                  handleSubjectSetToggle(
                                    subjectSet.id,
                                    subjectSet.subjects
                                  )
                                }
                              >
                                <div
                                  className={`w-5 h-5 border-2 flex items-center justify-center ${
                                    isSubjectSetSelected
                                      ? 'border-blue-900 bg-blue-900'
                                      : 'border-gray-300'
                                  }`}
                                >
                                  {isSubjectSetSelected && (
                                    <div className="w-2 h-2 bg-white"></div>
                                  )}
                                </div>
                                <div
                                  className={`w-4 h-4 bg-${subjectSet.color} flex items-center justify-center`}
                                >
                                  <div className="w-2 h-2 bg-white"></div>
                                </div>
                                <h4
                                  className="text-md font-medium text-gray-900"
                                  style={{
                                    fontFamily: 'Poppins',
                                    fontWeight: 400,
                                  }}
                                >
                                  {subjectSet.name}
                                </h4>
                              </div>
                              <p
                                className="text-xs text-gray-600 mb-3"
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 400,
                                }}
                              >
                                {subjectSet.description}
                              </p>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {subjectSet.subjects.map((subjectId) => {
                                  const subject = subjects[subjectId]
                                  if (!subject) return null
                                  const isSubjectSelected =
                                    selectedSubjects.includes(subjectId)

                                  return (
                                    <div
                                      key={subjectId}
                                      className={`flex items-center gap-2 p-2 border cursor-pointer transition-colors ${
                                        isSubjectSelected
                                          ? 'bg-blue-100 border-blue-300'
                                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                      }`}
                                      onClick={() =>
                                        handleSubjectToggle(subjectId)
                                      }
                                    >
                                      <div
                                        className={`w-3 h-3 border flex items-center justify-center ${
                                          isSubjectSelected
                                            ? 'border-blue-900 bg-blue-900'
                                            : 'border-gray-300'
                                        }`}
                                      >
                                        {isSubjectSelected && (
                                          <div className="w-1 h-1 bg-white"></div>
                                        )}
                                      </div>
                                      <div
                                        className={`w-3 h-3 bg-${subject.color}`}
                                      ></div>
                                      <span
                                        className={`text-xs ${
                                          isSubjectSelected
                                            ? 'text-blue-900 font-medium'
                                            : 'text-gray-700'
                                        }`}
                                        style={{
                                          fontFamily: 'Poppins',
                                          fontWeight: 400,
                                        }}
                                      >
                                        {subject.code} {subject.name}
                                      </span>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))
                })()}
              </div>
            )}

            {selectedSubjects.length > 0 && (
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    // TODO: Implement save functionality
                    console.log('Saving selected subjects:', selectedSubjects)
                    toast.success(
                      'Subject assignment has been saved successfully.',
                      {
                        autoClose: 5000,
                      }
                    )
                  }}
                  className="px-4 py-2 bg-blue-900 text-white text-xs hover:bg-blue-900 transition-colors"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Save Assignment
                </button>
                <button
                  onClick={() => {
                    setSelectedSubjectSets([])
                    setSelectedSubjects([])
                    toast.info('Selection Reset', {
                      autoClose: 4000,
                    })
                  }}
                  className="px-4 py-2 bg-gray-500 text-white text-xs hover:bg-gray-600 transition-colors"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Clear Selection
                </button>
              </div>
            )}
          </div>
        ),
      },
      {
        id: 'process',
        label: 'Process Enrollment',
        icon: (
          <div className="w-5 h-5 bg-blue-900 flex items-center justify-center">
            <Gear size={12} weight="fill" className="text-white" />
          </div>
        ),
        content: (
          <div className="space-y-6">
            {/* Personal Information */}
            <div className="bg-white border border-gray-200 p-4">
              <h3
                className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                <div className="w-6 h-6 bg-blue-900 flex items-center justify-center">
                  <User size={14} weight="fill" className="text-white" />
                </div>
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    className="text-xs font-medium text-gray-500"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Full Name
                  </label>
                  <p
                    className="text-xs text-gray-900"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    {formatFullName(
                      viewingEnrollment?.personalInfo?.firstName,
                      viewingEnrollment?.personalInfo?.middleName,
                      viewingEnrollment?.personalInfo?.lastName,
                      viewingEnrollment?.personalInfo?.nameExtension
                    )}
                  </p>
                </div>
                <div>
                  <label
                    className="text-xs font-medium text-gray-500"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Date of Birth
                  </label>
                  <p
                    className="text-xs text-gray-900"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    {(() => {
                      const birthMonth =
                        viewingEnrollment?.personalInfo?.birthMonth
                      const birthDay = viewingEnrollment?.personalInfo?.birthDay
                      const birthYear =
                        viewingEnrollment?.personalInfo?.birthYear
                      if (birthMonth && birthDay && birthYear) {
                        return formatBirthDate(
                          `${birthYear}-${birthMonth.padStart(
                            2,
                            '0'
                          )}-${birthDay.padStart(2, '0')}`
                        )
                      }
                      return 'N/A'
                    })()}
                  </p>
                </div>
                <div>
                  <label
                    className="text-xs font-medium text-gray-500"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Gender
                  </label>
                  <p
                    className="text-xs text-gray-900"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    {viewingEnrollment?.personalInfo?.gender || 'N/A'}
                  </p>
                </div>
                <div>
                  <label
                    className="text-xs font-medium text-gray-500"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Religion
                  </label>
                  <p
                    className="text-xs text-gray-900"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    {viewingEnrollment?.personalInfo?.religion || 'N/A'}
                  </p>
                </div>
                <div>
                  <label
                    className="text-xs font-medium text-gray-500"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Citizenship
                  </label>
                  <p
                    className="text-xs text-gray-900"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    {viewingEnrollment?.personalInfo?.citizenship || 'N/A'}
                  </p>
                </div>
                <div>
                  <label
                    className="text-xs font-medium text-gray-500"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Place of Birth
                  </label>
                  <p
                    className="text-xs text-gray-900"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    {viewingEnrollment?.personalInfo?.placeOfBirth || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white border border-gray-200 p-4">
              <h3
                className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                <div className="w-6 h-6 bg-blue-900 flex items-center justify-center">
                  <Phone size={14} weight="fill" className="text-white" />
                </div>
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    className="text-xs font-medium text-gray-500"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Email Address
                  </label>
                  <p
                    className="text-xs text-gray-900"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    {studentProfiles[viewingEnrollment?.userId || '']?.email ||
                      viewingEnrollment?.personalInfo?.email ||
                      'N/A'}
                  </p>
                </div>
                <div>
                  <label
                    className="text-xs font-medium text-gray-500"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Phone Number
                  </label>
                  <p
                    className="text-xs text-gray-900"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    {viewingEnrollment?.personalInfo?.phone || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div className="bg-white border border-gray-200 p-4">
              <h3
                className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                <div className="w-6 h-6 bg-blue-900 flex items-center justify-center">
                  <GraduationCapIcon
                    size={14}
                    weight="fill"
                    className="text-white"
                  />
                </div>
                Academic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label
                    className="text-xs font-medium text-gray-500"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Level
                  </label>
                  <p
                    className="text-xs text-gray-900"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    {(() => {
                      const displayInfo =
                        getEnrollmentDisplayInfo(viewingEnrollment)
                      return displayInfo.displayText
                    })()}
                  </p>
                </div>
                <div>
                  <label
                    className="text-xs font-medium text-gray-500"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    School Year
                  </label>
                  <p
                    className="text-xs text-gray-900"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    {viewingEnrollment?.enrollmentInfo?.schoolYear || 'N/A'}
                  </p>
                </div>
                <div>
                  <label
                    className="text-xs font-medium upper text-gray-500"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Status
                  </label>
                  <p
                    className="text-xs text-gray-900 capitalize font-mono"
                    style={{ fontWeight: 400 }}
                  >
                    {viewingEnrollment?.enrollmentInfo?.status || 'Unknown'}
                  </p>
                </div>
              </div>
            </div>

            {/* Enrollment Timeline */}
            <div className="bg-white border border-gray-200 p-4">
              <h3
                className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                <div className="w-6 h-6 bg-blue-900 flex items-center justify-center">
                  <Calendar size={14} weight="fill" className="text-white" />
                </div>
                Enrollment Timeline
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span
                    className="text-xs text-gray-500"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Submitted:
                  </span>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 flex-shrink-0"
                      style={{
                        backgroundColor: getTimeAgoInfo(
                          viewingEnrollment?.submittedAt
                        ).color,
                      }}
                    ></div>
                    <span className="text-xs text-gray-900 font-mono">
                      {formatDate(viewingEnrollment?.submittedAt)} •{' '}
                      {getTimeAgoInfo(viewingEnrollment?.submittedAt).text}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span
                    className="text-xs text-gray-500"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Last Updated:
                  </span>
                  <span className="text-xs text-gray-900 font-mono">
                    {formatDate(viewingEnrollment?.updatedAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                onClick={closeViewModal}
                className="px-3 py-2 bg-gray-500 text-white text-xs font-medium hover:bg-gray-600 transition-colors flex items-center gap-2"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                <X size={16} />
                Cancel
              </button>
              {viewingEnrollment?.enrollmentInfo?.status === 'enrolled' && (
                <button
                  onClick={() => {
                    setShowPrintModal(true)
                  }}
                  className="flex-1 px-3 py-2 bg-blue-900 text-white text-xs font-medium hover:bg-blue-900 transition-colors flex items-center justify-center gap-2"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  disabled={enrollingStudent || revokingEnrollment}
                >
                  <Printer size={16} />
                  Print
                </button>
              )}
              {viewingEnrollment?.enrollmentInfo?.status === 'enrolled' ? (
                <button
                  onClick={handleRevokeEnrollment}
                  className="flex-1 px-3 py-2 bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  disabled={revokingEnrollment}
                >
                  {revokingEnrollment ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Revoking...
                    </>
                  ) : (
                    <>
                      <X size={16} />
                      Revoke Enrollment
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleOpenEnrollModal}
                  className="flex-1 px-3 py-2 bg-blue-900 text-white text-xs font-medium hover:bg-blue-900 transition-colors flex items-center justify-center gap-2"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  disabled={enrollingStudent}
                >
                  {enrollingStudent ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Enrolling...
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      Enroll
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        ),
      },
      {
        id: 'grades',
        label: 'Grades',
        icon: (
          <div className="w-5 h-5 bg-blue-900 flex items-center justify-center">
            <Calculator size={12} weight="fill" className="text-white" />
          </div>
        ),
        content: (
          <div className="space-y-4">
            {(() => {
              if (!viewingEnrollment) {
                return (
                  <div className="bg-gray-50 border border-gray-200 p-4 text-center">
                    <p
                      className="text-xs text-gray-600"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      No student selected
                    </p>
                  </div>
                )
              }

              const isCollege =
                viewingEnrollment.enrollmentInfo?.level === 'college'

              // Header summary
              const header = (
                <div className="bg-white border border-gray-200 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-700">
                    <div>
                      <div
                        className="text-gray-500"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        Level
                      </div>
                      <div className="font-mono" style={{ fontWeight: 400 }}>
                        {isCollege ? 'College' : 'High School'}
                      </div>
                    </div>
                    <div>
                      <div
                        className="text-gray-500"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        {isCollege ? 'Course / Year / Semester' : 'Grade Level'}
                      </div>
                      <div className="font-mono" style={{ fontWeight: 400 }}>
                        {isCollege
                          ? `${
                              viewingEnrollment.enrollmentInfo?.courseCode ||
                              'N/A'
                            } ${
                              viewingEnrollment.enrollmentInfo?.yearLevel ||
                              'N/A'
                            } ${
                              viewingEnrollment.enrollmentInfo?.semester ===
                              'first-sem'
                                ? 'Q1'
                                : viewingEnrollment.enrollmentInfo?.semester ===
                                  'second-sem'
                                ? 'Q2'
                                : ''
                            }`
                          : `Grade ${
                              viewingEnrollment.enrollmentInfo?.gradeLevel ||
                              'N/A'
                            }`}
                      </div>
                    </div>
                    <div>
                      <div
                        className="text-gray-500"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        Total Units
                      </div>
                      <div className="font-mono" style={{ fontWeight: 400 }}>
                        {(() => {
                          const subjectIds = Object.keys(
                            viewingStudentGrades || {}
                          )
                          if (subjectIds.length === 0) return 0
                          const total = subjectIds.reduce((sum, id) => {
                            const s = subjects[id]
                            if (!s) return sum
                            const lu = Number(s.lectureUnits || 0)
                            const la = Number(s.labUnits || 0)
                            return sum + lu + la
                          }, 0)
                          return total
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )

              if (gradesLoading) {
                return (
                  <div className="space-y-4">
                    {header}
                    <div className="bg-white border border-gray-200 p-4">
                      <div className="h-4 bg-gray-200 w-24 mb-3"></div>
                      <div className="space-y-2">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div
                            key={i}
                            className="h-8 bg-gray-100 border border-gray-200"
                          ></div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              }

              if (gradesError) {
                return (
                  <div className="space-y-4">
                    {header}
                    <div className="bg-red-50 border border-red-200 p-4 text-xs text-red-700">
                      {gradesError}
                    </div>
                  </div>
                )
              }

              // Filter to assigned subjects for college; HS will naturally align
              let gradeEntries = Object.entries(viewingStudentGrades || {})
              if (isCollege) {
                const enrollmentInfo = viewingEnrollment.enrollmentInfo
                let assignedIds: string[] = []
                if (
                  enrollmentInfo?.courseCode &&
                  enrollmentInfo?.yearLevel &&
                  enrollmentInfo?.semester
                ) {
                  const assignment = subjectAssignments.find(
                    (a) =>
                      a.level === 'college' &&
                      a.courseCode === enrollmentInfo.courseCode &&
                      a.yearLevel ===
                        parseInt(String(enrollmentInfo.yearLevel)) &&
                      a.semester === enrollmentInfo.semester
                  )
                  if (assignment) {
                    const subjectSet = allSubjectSets.find(
                      (s) => s.id === assignment.subjectSetId
                    )
                    if (subjectSet) assignedIds = subjectSet.subjects
                  }
                }
                if (assignedIds.length > 0) {
                  gradeEntries = gradeEntries.filter(([subjectId]) =>
                    assignedIds.includes(subjectId)
                  )
                }
              }
              if (gradeEntries.length === 0) {
                return (
                  <div className="space-y-4">
                    {header}
                    <div className="bg-gray-50 border border-gray-200 p-4 text-center">
                      <p
                        className="text-xs text-gray-600"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        No grades available for this student.
                      </p>
                    </div>
                  </div>
                )
              }

              return (
                <div className="space-y-4">
                  {header}
                  <div className="bg-white border border-gray-200 p-0 overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100 border-b-2 border-gray-300">
                        <tr>
                          <th
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                          >
                            Subject
                          </th>
                          <th
                            className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                          >
                            {isCollege ? 'Prelim' : 'Period 1'}
                          </th>
                          <th
                            className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                          >
                            {isCollege ? 'Midterm' : 'Period 2'}
                          </th>
                          <th
                            className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                          >
                            {isCollege ? 'Finals' : 'Period 3'}
                          </th>
                          {!isCollege && (
                            <th
                              className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                            >
                              Period 4
                            </th>
                          )}
                          <th
                            className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                          >
                            Final
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {gradeEntries.map(([subjectId, subjectGrade]) => {
                          const s = subjects[subjectId]
                          const subjectName =
                            subjectGrade?.subjectName ||
                            s?.name ||
                            'Unknown Subject'
                          const p1 =
                            typeof subjectGrade?.period1 === 'number'
                              ? subjectGrade.period1
                              : null
                          const p2 =
                            typeof subjectGrade?.period2 === 'number'
                              ? subjectGrade.period2
                              : null
                          const p3 =
                            typeof subjectGrade?.period3 === 'number'
                              ? subjectGrade.period3
                              : null
                          const p4 =
                            typeof subjectGrade?.period4 === 'number'
                              ? subjectGrade.period4
                              : null
                          const special = subjectGrade?.specialStatus || null

                          const calcAverage = () => {
                            if (special) return null
                            const vals = isCollege
                              ? [p1, p2, p3]
                              : [p1, p2, p3, p4]
                            const clean = vals.filter(
                              (v) => typeof v === 'number'
                            ) as number[]
                            if (clean.length === 0) return null
                            const avg =
                              clean.reduce((a, b) => a + b, 0) / clean.length
                            return Math.round(avg * 10) / 10
                          }
                          const avg = calcAverage()

                          return (
                            <tr key={subjectId} className="hover:bg-gray-50">
                              <td className="px-6 py-3 whitespace-nowrap border-r border-gray-200">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 bg-gray-400"
                                    style={{
                                      backgroundColor: getBgColor(
                                        (s?.color as any) || 'blue-900'
                                      ),
                                    }}
                                  ></div>
                                  <div
                                    className="text-xs text-gray-900"
                                    style={{
                                      fontFamily: 'Poppins',
                                      fontWeight: 400,
                                    }}
                                  >
                                    {subjectName}
                                  </div>
                                  <div
                                    className="text-[10px] text-gray-500 font-mono ml-2"
                                    style={{ fontWeight: 400 }}
                                  >
                                    {(() => {
                                      const lu = Number(s?.lectureUnits || 0)
                                      const la = Number(s?.labUnits || 0)
                                      const total = lu + la
                                      return total > 0
                                        ? `${total} unit${
                                            total !== 1 ? 's' : ''
                                          }`
                                        : ''
                                    })()}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-3 text-center border-r border-gray-200">
                                <span
                                  className="text-xs"
                                  style={{
                                    fontFamily: 'Poppins',
                                    fontWeight: 400,
                                  }}
                                >
                                  {p1 !== null ? p1.toFixed(1) : '—'}
                                </span>
                              </td>
                              <td className="px-6 py-3 text-center border-r border-gray-200">
                                <span
                                  className="text-xs"
                                  style={{
                                    fontFamily: 'Poppins',
                                    fontWeight: 400,
                                  }}
                                >
                                  {p2 !== null ? p2.toFixed(1) : '—'}
                                </span>
                              </td>
                              <td className="px-6 py-3 text-center border-r border-gray-200">
                                <span
                                  className="text-xs"
                                  style={{
                                    fontFamily: 'Poppins',
                                    fontWeight: 400,
                                  }}
                                >
                                  {p3 !== null ? p3.toFixed(1) : '—'}
                                </span>
                              </td>
                              {!isCollege && (
                                <td className="px-6 py-3 text-center border-r border-gray-200">
                                  <span
                                    className="text-xs"
                                    style={{
                                      fontFamily: 'Poppins',
                                      fontWeight: 400,
                                    }}
                                  >
                                    {p4 !== null ? p4.toFixed(1) : '—'}
                                  </span>
                                </td>
                              )}
                              <td className="px-6 py-3 text-center">
                                {special ? (
                                  <span
                                    className="text-xs uppercase"
                                    style={{
                                      fontFamily: 'Poppins',
                                      fontWeight: 400,
                                    }}
                                  >
                                    {special}
                                  </span>
                                ) : (
                                  <span
                                    className="text-xs"
                                    style={{
                                      fontFamily: 'Poppins',
                                      fontWeight: 400,
                                    }}
                                  >
                                    {avg !== null ? avg.toFixed(1) : '—'}
                                  </span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })()}
          </div>
        ),
      },
    ],
    [
      viewingEnrollment,
      studentProfiles,
      studentDocuments,
      subjectSets,
      subjects,
      selectedSubjectSets,
      selectedSubjects,
      showOtherSets,
      courses,
      viewingStudentGrades,
      gradesLoading,
      gradesError,
    ]
  )

  // Show loading skeleton only for table during data loading
  const showTableSkeleton = loading || !allDataLoaded

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1
            className="text-2xl font-light text-gray-900 flex items-center gap-2"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            <div className="w-8 h-8 bg-blue-900 flex items-center justify-center">
              <GraduationCap size={20} weight="fill" className="text-white" />
            </div>
            Student Enrollments
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p
              className="text-xs text-gray-600"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Manage and review student enrollment applications
            </p>
            {currentAYFilter && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-2 py-1 bg-blue-100 border border-blue-300">
                  <Calendar size={12} className="text-blue-900" weight="bold" />
                  <span
                    className="text-xs font-mono text-blue-900"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    AY: {currentAYFilter}
                  </span>
                </div>
                {currentSemesterFilter && (
                  <div className="flex items-center gap-2 px-2 py-1 bg-purple-100 border border-purple-300">
                    <Calendar
                      size={12}
                      className="text-purple-900"
                      weight="bold"
                    />
                    <span
                      className="text-xs font-mono text-purple-900"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      Semester: {currentSemesterFilter}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex-1 max-w-md">
            <Input
              type="text"
              placeholder="Search enrollments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-4 py-2 w-full"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            />
          </div>
        </div>
      </div>

      {/* Sorting and Filtering */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'latest', label: 'Latest', icon: Clock },
            { key: 'oldest', label: 'Oldest', icon: Clock },
            { key: 'a-z', label: 'A-Z', icon: ArrowUp },
            { key: 'z-a', label: 'Z-A', icon: ArrowDown },
            { key: 'last-3-days', label: 'Last 3 days', icon: Clock },
            { key: 'last-7-days', label: 'Last 7 days', icon: Clock },
          ].map((option) => (
            <button
              key={option.key}
              onClick={() => setSortOption(option.key)}
              className={`px-4 py-2 rounded-none text-xs font-medium transition-all duration-200 ${
                sortOption === option.key
                  ? 'bg-blue-900 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              <div className="flex items-center gap-2">
                <option.icon size={14} weight="bold" />
                {option.label}
              </div>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAcademicYearModal(true)}
            className="px-4 py-2 bg-blue-900 text-white text-xs font-medium hover:bg-blue-900 transition-colors flex items-center gap-2"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            <Gear size={14} />
            Settings
          </button>
          <button
            onClick={() => setShowScholarshipModal(true)}
            className="px-4 py-2 bg-blue-900 text-white text-xs font-medium hover:bg-blue-900 transition-colors flex items-center gap-2"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            <GraduationCap size={14} />
            Scholarship
          </button>
        </div>
      </div>

      {/* Enrollments Table */}
      <Card className="overflow-hidden pt-0 mt-0 mb-0 pb-0">
        {showTableSkeleton ? (
          <SkeletonTable />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b-2 border-gray-300">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 aspect-square bg-blue-900 flex items-center justify-center">
                        <User size={12} weight="bold" className="text-white" />
                      </div>
                      Student
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 aspect-square bg-blue-900 flex items-center justify-center">
                        <GraduationCap
                          size={12}
                          weight="bold"
                          className="text-white"
                        />
                      </div>
                      Level
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 aspect-square bg-blue-900 flex items-center justify-center">
                        <Circle
                          size={12}
                          weight="bold"
                          className="text-white"
                        />
                      </div>
                      Status
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 hidden lg:table-cell"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 aspect-square bg-blue-900 flex items-center justify-center">
                        <Calendar
                          size={12}
                          weight="bold"
                          className="text-white"
                        />
                      </div>
                      Submitted
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 aspect-square bg-blue-900 flex items-center justify-center">
                        <Gear size={12} weight="bold" className="text-white" />
                      </div>
                      Actions
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedEnrollments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-8 text-center text-gray-500 border-t border-gray-200"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      {searchQuery
                        ? 'No enrollments match your search.'
                        : 'No enrollments found.'}
                    </td>
                  </tr>
                ) : (
                  paginatedEnrollments.map((enrollment) => (
                    <EnrollmentTableRow
                      key={enrollment.userId}
                      enrollment={enrollment}
                      studentProfile={studentProfiles[enrollment.userId]}
                      onView={handleViewEnrollment}
                      onQuickEnroll={handleQuickEnroll}
                      onDelete={handleDeleteEnrollment}
                      onPrint={async () => {
                        let subjectsToPrint: string[] = []
                        const enrollmentInfo = enrollment.enrollmentInfo

                        if (enrollmentInfo?.level === 'college') {
                          const assignment = subjectAssignments.find(
                            (assignment) =>
                              assignment.level === 'college' &&
                              assignment.courseCode ===
                                enrollmentInfo.courseCode &&
                              assignment.yearLevel ===
                                parseInt(enrollmentInfo.yearLevel || '1') &&
                              assignment.semester === enrollmentInfo.semester
                          )

                          if (assignment) {
                            const subjectSet = Object.values(subjectSets)
                              .flat()
                              .find((set) => set.id === assignment.subjectSetId)
                            if (subjectSet) {
                              subjectsToPrint = subjectSet.subjects
                            }
                          }
                        } else {
                          const gradeLevel = enrollmentInfo?.gradeLevel
                          if (gradeLevel) {
                            const assignment = subjectAssignments.find(
                              (assignment) =>
                                assignment.level === 'high-school' &&
                                assignment.gradeLevel === parseInt(gradeLevel)
                            )

                            if (assignment) {
                              const subjectSet = Object.values(subjectSets)
                                .flat()
                                .find(
                                  (set) => set.id === assignment.subjectSetId
                                )
                              if (subjectSet) {
                                subjectsToPrint = subjectSet.subjects
                              }
                            }
                          }
                        }

                        setViewingEnrollment(enrollment)
                        setSelectedSubjects(subjectsToPrint)
                        setShowPrintModal(true)
                      }}
                      enrollingStudent={enrollingStudent}
                      subjectAssignments={subjectAssignments}
                      subjectSets={subjectSets}
                      getEnrollmentDisplayInfo={getEnrollmentDisplayInfo}
                      getBgColor={getBgColor}
                      getStatusHexColor={getStatusHexColor}
                      getTimeAgoInfo={getTimeAgoInfo}
                      formatFullName={formatFullName}
                      formatDate={formatDate}
                      getInitials={getInitials}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border border-gray-200">
          <div
            className="text-xs text-gray-600"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(
              currentPage * itemsPerPage,
              filteredAndSortedEnrollments.length
            )}{' '}
            of {filteredAndSortedEnrollments.length} enrollments
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 text-xs font-medium transition-colors flex items-center gap-1 ${
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-900 text-white hover:bg-blue-800'
              }`}
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              <ArrowLeft size={14} />
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum
                if (totalPages <= 7) {
                  pageNum = i + 1
                } else if (currentPage <= 4) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 3) {
                  pageNum = totalPages - 6 + i
                } else {
                  pageNum = currentPage - 3 + i
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 text-xs font-medium transition-colors ${
                      currentPage === pageNum
                        ? 'bg-blue-900 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className={`px-3 py-1 text-xs font-medium transition-colors flex items-center gap-1 ${
                currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-900 text-white hover:bg-blue-800'
              }`}
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Next
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* View Enrollment Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={closeViewModal}
        title="Student Enrollment Details"
        size="2xl"
      >
        {viewingEnrollment && (
          <div className="p-6  overflow-y-auto">
            {/* Student Profile Header */}
            <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50">
              <div className="flex-shrink-0 h-16 w-16 rounded-full border-2 border-gray-200 border-black/80">
                {studentProfiles[viewingEnrollment.userId]?.photoURL ? (
                  <img
                    src={studentProfiles[viewingEnrollment.userId].photoURL}
                    alt={`${
                      viewingEnrollment.personalInfo?.firstName || 'Student'
                    } profile`}
                    className="h-16 w-16 object-cover border-2 border-gray-200 rounded-full border-black/80"
                  />
                ) : (
                  <div className="h-16 w-16 bg-blue-900 flex items-center justify-center">
                    <span
                      className="text-white text-lg font-medium"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      {getInitials(
                        viewingEnrollment.personalInfo?.firstName,
                        viewingEnrollment.personalInfo?.lastName
                      )}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <h2
                  className="text-xl font-medium text-gray-900"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  {formatFullName(
                    viewingEnrollment?.personalInfo?.firstName,
                    viewingEnrollment?.personalInfo?.middleName,
                    viewingEnrollment?.personalInfo?.lastName,
                    viewingEnrollment?.personalInfo?.nameExtension
                  )}
                </h2>
                <p
                  className="text-gray-600 font-mono uppercase text-xs"
                  style={{ fontWeight: 400 }}
                >
                  #{viewingEnrollment.id || 'N/A'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium uppercase ${getStatusColor(
                      viewingEnrollment?.enrollmentInfo?.status || 'unknown'
                    )}`}
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    {viewingEnrollment?.enrollmentInfo?.status || 'Unknown'}
                  </span>
                  <span
                    className="text-xs text-gray-500"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    {(() => {
                      const displayInfo =
                        getEnrollmentDisplayInfo(viewingEnrollment)
                      return displayInfo.displayText
                    })()}
                  </span>
                </div>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="border border-gray-200 p-3 mb-6">
              <nav className="-mb-px flex">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id

                  // Get the appropriate icon based on tab id
                  const getTabIcon = (tabId: string, active: boolean) => {
                    const iconClass = active ? 'text-blue-900' : 'text-white'
                    const bgClass = active ? 'bg-white' : 'bg-blue-900'

                    switch (tabId) {
                      case 'student-info':
                        return (
                          <div
                            className={`w-5 h-5 flex items-center justify-center ${bgClass}`}
                          >
                            <UserIcon
                              size={12}
                              weight="fill"
                              className={iconClass}
                            />
                          </div>
                        )
                      case 'subjects':
                        return (
                          <div
                            className={`w-5 h-5 flex items-center justify-center ${bgClass}`}
                          >
                            <GraduationCapIcon
                              size={12}
                              weight="fill"
                              className={iconClass}
                            />
                          </div>
                        )
                      case 'process':
                        return (
                          <div
                            className={`w-5 h-5 flex items-center justify-center ${bgClass}`}
                          >
                            <Gear
                              size={12}
                              weight="fill"
                              className={iconClass}
                            />
                          </div>
                        )
                      case 'documents':
                        return (
                          <div
                            className={`w-5 h-5 flex items-center justify-center ${bgClass}`}
                          >
                            <FileTextIcon
                              size={12}
                              weight="fill"
                              className={iconClass}
                            />
                          </div>
                        )
                      default:
                        return (
                          <div
                            className={`w-5 h-5 flex items-center justify-center ${bgClass}`}
                          >
                            <UserIcon
                              size={12}
                              weight="fill"
                              className={iconClass}
                            />
                          </div>
                        )
                    }
                  }

                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`flex-1 py-3 px-4 font-medium text-xs flex items-center justify-center gap-2 transition-all duration-200 ${
                        isActive
                          ? 'bg-blue-900 text-white border-b-2 border-blue-900'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 border-b-2 border-transparent'
                      }`}
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      {getTabIcon(tab.id, isActive)}
                      {tab.label}
                    </button>
                  )
                })}
              </nav>
            </div>

            {/* Tab Content */}
            <div>{tabs.find((tab) => tab.id === activeTab)?.content}</div>
          </div>
        )}
      </Modal>

      {/* Document Viewer Modal */}
      {viewingDocument && (
        <ViewHandler
          isOpen={showDocumentModal}
          onClose={handleCloseDocumentModal}
          documentUrl={viewingDocument.url}
          fileName={viewingDocument.fileName}
          fileType={viewingDocument.fileType}
          fileFormat={viewingDocument.fileFormat}
        />
      )}

      {/* Print Modal */}
      <EnrollmentPrintModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        enrollment={viewingEnrollment as any}
        studentProfile={
          viewingEnrollment ? studentProfiles[viewingEnrollment.userId] : null
        }
        selectedSubjects={selectedSubjects}
        subjects={subjects as any}
        subjectSets={subjectSets as any}
        registrarName={registrarName}
      />

      {/* Revoke Enrollment Warning Modal */}
      <Modal
        isOpen={showRevokeModal}
        onClose={cancelRevoke}
        title="Revoke Student Enrollment"
        size="md"
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-red-100 flex items-center justify-center">
              <X size={24} className="text-red-600" weight="bold" />
            </div>
            <div>
              <h3
                className="text-lg font-medium text-gray-900"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Dangerous Action
              </h3>
              <p
                className="text-xs text-gray-600"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                This action cannot be undone
              </p>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 p-4 mb-6">
            <h4
              className="text-xs font-medium text-red-900 mb-2"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              The following will happen when you revoke this enrollment:
            </h4>
            <ul
              className="text-xs text-red-800 space-y-1"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              <li>• Student status will change back to "pending"</li>
              <li>• Enrollment date will be removed</li>
              <li>• All assigned subjects and grades will be deleted</li>
              <li>• Student will need to be enrolled again manually</li>
              <li>• Any existing grade records will be lost</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              onClick={cancelRevoke}
              className="flex-1 px-4 py-2 bg-gray-500 text-white text-xs font-medium hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Cancel
            </button>
            <button
              onClick={confirmRevokeEnrollment}
              disabled={revokeCountdown > 0 || revokingEnrollment}
              className={`flex-1 px-4 py-2 text-white text-xs font-medium transition-colors flex items-center justify-center gap-2 ${
                revokeCountdown > 0 || revokingEnrollment
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              {revokingEnrollment ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Revoking...
                </>
              ) : (
                <>
                  <X size={16} />
                  {revokeCountdown > 0
                    ? `Revoke in ${revokeCountdown}s`
                    : 'Revoke Enrollment'}
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Quick Enroll Preview Modal */}
      <Modal
        isOpen={showQuickEnrollModal}
        onClose={cancelQuickEnroll}
        title="Quick Enroll Preview"
        size="lg"
      >
        <div className="p-6">
          {quickEnrollData && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 flex items-center justify-center">
                  <Check size={24} className="text-blue-900" weight="bold" />
                </div>
                <div>
                  <h3
                    className="text-lg font-medium text-gray-900"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Quick Enroll Confirmation
                  </h3>
                  <p
                    className="text-xs text-gray-600"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    Review subjects before enrolling{' '}
                    {quickEnrollData.enrollment.personalInfo?.firstName}{' '}
                    {quickEnrollData.enrollment.personalInfo?.lastName}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 p-4 mb-6">
                <h4
                  className="text-xs font-medium text-gray-900 mb-3"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Student Information:
                </h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="font-medium text-gray-600">Name:</span>
                    <span className="ml-2 text-gray-900">
                      {formatFullName(
                        quickEnrollData.enrollment.personalInfo?.firstName,
                        quickEnrollData.enrollment.personalInfo?.middleName,
                        quickEnrollData.enrollment.personalInfo?.lastName,
                        quickEnrollData.enrollment.personalInfo?.nameExtension
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Level:</span>
                    <span className="ml-2 text-gray-900">
                      {(() => {
                        const displayInfo = getEnrollmentDisplayInfo(
                          quickEnrollData.enrollment
                        )
                        return displayInfo.displayText
                      })()}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Email:</span>
                    <span className="ml-2 text-gray-900 font-mono text-xs">
                      {studentProfiles[quickEnrollData.enrollment.userId]
                        ?.email ||
                        quickEnrollData.enrollment.personalInfo?.email ||
                        'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">
                      School Year:
                    </span>
                    <span className="ml-2 text-gray-900">
                      {quickEnrollData.enrollment.enrollmentInfo?.schoolYear}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 p-4 mb-6">
                <h4
                  className="text-xs font-medium text-gray-900 mb-3"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Subjects to be Assigned ({quickEnrollData.subjects.length}):
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                  {quickEnrollData.subjects.map((subjectId) => {
                    const subject = subjects[subjectId]
                    return subject ? (
                      <div
                        key={subjectId}
                        className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded"
                      >
                        <div className={`w-3 h-3 bg-${subject.color}`}></div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-gray-900 truncate">
                            {subject.code || 'N/A'} - {subject.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {(subject.lectureUnits || 0) +
                              (subject.labUnits || 0)}{' '}
                            units
                          </div>
                        </div>
                      </div>
                    ) : null
                  })}
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 p-4 mb-6">
                <h4
                  className="text-xs font-medium text-gray-900 mb-3"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Enrollment Details:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label
                      className="block text-xs font-medium text-gray-700 mb-1"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      OR Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={quickEnrollOrNumber}
                      onChange={(e) => setQuickEnrollOrNumber(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                      placeholder="XXXXX"
                      style={{ fontWeight: 400 }}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-xs font-medium text-gray-700 mb-1"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      Scholarship <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={quickEnrollScholarship}
                        onChange={(e) =>
                          setQuickEnrollScholarship(e.target.value)
                        }
                        className="w-full px-3 py-2 text-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono appearance-none bg-white"
                        style={{ fontWeight: 400 }}
                      >
                        <option value="">Select Scholarship</option>
                        {filteredQuickScholarships.map((scholarship) => (
                          <option
                            key={scholarship.id}
                            value={scholarship.value}
                          >
                            {scholarship.code} - {scholarship.name} (
                            {scholarship.value}%)
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <div className="w-4 h-4 bg-gray-400 flex items-center justify-center">
                          <div className="w-2 h-2 bg-white"></div>
                        </div>
                      </div>
                    </div>
                    {quickEnrollScholarship && (
                      <div
                        className="mt-1 text-xs text-gray-600"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        Selected:{' '}
                        {
                          filteredQuickScholarships.find(
                            (s) => s.value === parseInt(quickEnrollScholarship)
                          )?.name
                        }{' '}
                        (
                        {
                          filteredQuickScholarships.find(
                            (s) => s.value === parseInt(quickEnrollScholarship)
                          )?.value
                        }
                        %)
                      </div>
                    )}
                  </div>
                  <div>
                    <label
                      className="block text-xs font-medium text-gray-700 mb-1"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      Student ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={
                        studentProfiles[quickEnrollData.enrollment.userId]
                          ?.studentId ||
                        quickEnrollData.enrollment.enrollmentInfo?.studentId ||
                        quickEnrollStudentId
                      }
                      onChange={(e) => setQuickEnrollStudentId(e.target.value)}
                      disabled={Boolean(
                        studentProfiles[quickEnrollData.enrollment.userId]
                          ?.studentId ||
                          quickEnrollData.enrollment.enrollmentInfo?.studentId
                      )}
                      className="w-full px-3 py-2 text-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                      placeholder="YYY-XXX"
                      style={{ fontWeight: 400 }}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 p-4 mb-6">
                <div className="flex items-start gap-2">
                  <div>
                    <h4
                      className="text-xs font-medium text-gray-900"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      What happens next?
                    </h4>
                    <ul
                      className="text-xs text-gray-700 mt-1 space-y-1"
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      <li>
                        • Student will be enrolled with all subjects shown above
                      </li>
                      <li>• Student status will change to "enrolled"</li>
                      <li>• Grade records will be created for each subject</li>
                      <li>
                        • This action can be reversed by revoking enrollment
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={cancelQuickEnroll}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white text-xs font-medium hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  disabled={enrollingStudent}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmQuickEnroll}
                  className="flex-1 px-4 py-2 bg-blue-900 text-white text-xs font-medium hover:bg-blue-900 transition-colors flex items-center justify-center gap-2"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  disabled={enrollingStudent}
                >
                  {enrollingStudent ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Enrolling...
                    </>
                  ) : (
                    <>
                      <Lightning size={16} />
                      Confirm Quick Enroll
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Enrollment Modal */}
      <Modal
        isOpen={showEnrollModal}
        onClose={cancelEnrollModal}
        title="Enroll Student"
        size="md"
      >
        <div className="p-6">
          {viewingEnrollment && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 flex items-center justify-center">
                  <Check size={24} className="text-blue-900" weight="bold" />
                </div>
                <div>
                  <h3
                    className="text-lg font-medium text-gray-900"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Enroll Student
                  </h3>
                  <p
                    className="text-xs text-gray-600"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    Enter enrollment details for{' '}
                    {viewingEnrollment.personalInfo?.firstName}{' '}
                    {viewingEnrollment.personalInfo?.lastName}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 p-4 mb-6">
                <h4
                  className="text-xs font-medium text-gray-900 mb-3"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Student Information:
                </h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="font-medium text-gray-600">Name:</span>
                    <span className="ml-2 text-gray-900">
                      {formatFullName(
                        viewingEnrollment.personalInfo?.firstName,
                        viewingEnrollment.personalInfo?.middleName,
                        viewingEnrollment.personalInfo?.lastName,
                        viewingEnrollment.personalInfo?.nameExtension
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Level:</span>
                    <span className="ml-2 text-gray-900">
                      {(() => {
                        const displayInfo =
                          getEnrollmentDisplayInfo(viewingEnrollment)
                        return displayInfo.displayText
                      })()}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Subjects:</span>
                    <span className="ml-2 text-gray-900">
                      {selectedSubjects.length} selected
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 p-4 mb-6">
                <h4
                  className="text-xs font-medium text-gray-900 mb-3"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Enrollment Details:
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label
                      className="block text-xs font-medium text-gray-700 mb-1"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      OR Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={enrollOrNumber}
                      onChange={(e) => setEnrollOrNumber(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                      placeholder="XXXXX"
                      style={{ fontWeight: 400 }}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-xs font-medium text-gray-700 mb-1"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      Scholarship <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={enrollScholarship}
                        onChange={(e) => setEnrollScholarship(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono appearance-none bg-white"
                        style={{ fontWeight: 400 }}
                      >
                        <option value="">Select Scholarship</option>
                        {filteredEnrollScholarships.map((scholarship) => (
                          <option
                            key={scholarship.id}
                            value={scholarship.value}
                          >
                            {scholarship.code} - {scholarship.name} (
                            {scholarship.value}%)
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <div className="w-4 h-4 bg-gray-400 flex items-center justify-center">
                          <div className="w-2 h-2 bg-white"></div>
                        </div>
                      </div>
                    </div>
                    {enrollScholarship && (
                      <div
                        className="mt-1 text-xs text-gray-600"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        Selected:{' '}
                        {
                          filteredEnrollScholarships.find(
                            (s) => s.value === parseInt(enrollScholarship)
                          )?.name
                        }{' '}
                        (
                        {
                          filteredEnrollScholarships.find(
                            (s) => s.value === parseInt(enrollScholarship)
                          )?.value
                        }
                        %)
                      </div>
                    )}
                  </div>
                  <div>
                    <label
                      className="block text-xs font-medium text-gray-700 mb-1"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      Student ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={
                        studentProfiles[viewingEnrollment.userId]?.studentId ||
                        viewingEnrollment.enrollmentInfo?.studentId ||
                        enrollStudentId
                      }
                      onChange={(e) => setEnrollStudentId(e.target.value)}
                      disabled={Boolean(
                        studentProfiles[viewingEnrollment.userId]?.studentId ||
                          viewingEnrollment.enrollmentInfo?.studentId
                      )}
                      className="w-full px-3 py-2 text-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                      placeholder="YYY-XXX"
                      style={{ fontWeight: 400 }}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 p-4 mb-6">
                <div className="flex items-start gap-2">
                  <div>
                    <h4
                      className="text-xs font-medium text-gray-900"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      What happens next?
                    </h4>
                    <ul
                      className="text-xs text-gray-700 mt-1 space-y-1"
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      <li>
                        • Student will be enrolled with{' '}
                        {selectedSubjects.length} selected subjects
                      </li>
                      <li>• Student status will change to "enrolled"</li>
                      <li>• Grade records will be created for each subject</li>
                      <li>• Enrollment details will be saved to database</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={cancelEnrollModal}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white text-xs font-medium hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  disabled={enrollingStudent}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmEnroll}
                  className="flex-1 px-4 py-2 bg-blue-900 text-white text-xs font-medium hover:bg-blue-900 transition-colors flex items-center justify-center gap-2"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  disabled={enrollingStudent}
                >
                  {enrollingStudent ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Enrolling...
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      Confirm Enrollment
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Delete Enrollment Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={cancelDelete}
        title="Delete Enrollment"
        size="sm"
      >
        <div className="p-6">
          {enrollmentToDelete && (
            <>
              <p
                className="text-sm text-gray-700 mb-6"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Are you sure you want to delete "
                {[
                  enrollmentToDelete.personalInfo?.firstName,
                  enrollmentToDelete.personalInfo?.middleName
                    ? enrollmentToDelete.personalInfo.middleName
                        .charAt(0)
                        .toUpperCase() + '.'
                    : '',
                  enrollmentToDelete.personalInfo?.lastName,
                  enrollmentToDelete.personalInfo?.nameExtension,
                ]
                  .filter(Boolean)
                  .join(' ')}
                "?
              </p>

              <div className="flex gap-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white text-xs font-medium hover:bg-gray-600 transition-colors"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  disabled={deletingEnrollment}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteEnrollment}
                  disabled={deleteCountdown > 0 || deletingEnrollment}
                  className={`flex-1 px-4 py-2 text-white text-xs font-medium transition-colors ${
                    deleteCountdown > 0 || deletingEnrollment
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  {deletingEnrollment
                    ? 'Deleting...'
                    : deleteCountdown > 0
                    ? `Delete in ${deleteCountdown}s`
                    : 'Delete'}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Scholarship Management Modal */}
      <Modal
        isOpen={showScholarshipModal}
        onClose={closeScholarshipModal}
        title="Scholarship Management"
        size="2xl"
      >
        <div className="p-6">
          {/* Add/Edit Form */}
          <div className="bg-gray-50 border border-gray-200 p-4 mb-6">
            <h3
              className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              <div className="w-6 h-6 bg-blue-900 flex items-center justify-center">
                <GraduationCap size={14} weight="fill" className="text-white" />
              </div>
              {editingScholarship ? 'Edit Scholarship' : 'Add New Scholarship'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-xs font-medium text-gray-700 mb-1"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={scholarshipForm.code}
                  onChange={(e) =>
                    setScholarshipForm((prev) => ({
                      ...prev,
                      code: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 text-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  placeholder="e.g., ACAD"
                  style={{ fontWeight: 400 }}
                />
              </div>

              <div>
                <label
                  className="block text-xs font-medium text-gray-700 mb-1"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={scholarshipForm.name}
                  onChange={(e) =>
                    setScholarshipForm((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 text-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g., Academic Excellence"
                  style={{ fontWeight: 400 }}
                />
              </div>

              <div>
                <label
                  className="block text-xs font-medium text-gray-700 mb-1"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Value (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={scholarshipForm.value}
                  onChange={(e) =>
                    setScholarshipForm((prev) => ({
                      ...prev,
                      value: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="w-full px-3 py-2 text-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  placeholder="0"
                  style={{ fontWeight: 400 }}
                />
              </div>

              <div>
                <label
                  className="block text-xs font-medium text-gray-700 mb-1"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Minimum Units
                </label>
                <input
                  type="number"
                  min="0"
                  value={scholarshipForm.minUnit}
                  onChange={(e) =>
                    setScholarshipForm((prev) => ({
                      ...prev,
                      minUnit: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="w-full px-3 py-2 text-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  placeholder="0"
                  style={{ fontWeight: 400 }}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={
                  editingScholarship
                    ? handleUpdateScholarship
                    : handleCreateScholarship
                }
                disabled={scholarshipLoading}
                className="px-4 py-2 bg-blue-900 text-white text-xs font-medium hover:bg-blue-900 transition-colors flex items-center gap-2"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                {scholarshipLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {editingScholarship ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    {editingScholarship
                      ? 'Update Scholarship'
                      : 'Add Scholarship'}
                  </>
                )}
              </button>

              {editingScholarship && (
                <button
                  onClick={resetScholarshipForm}
                  className="px-4 py-2 bg-gray-500 text-white text-xs font-medium hover:bg-gray-600 transition-colors flex items-center gap-2"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  <X size={14} />
                  Cancel Edit
                </button>
              )}
            </div>
          </div>

          {/* Scholarships List */}
          <div className="space-y-4">
            <h3
              className="text-lg font-medium text-gray-900 flex items-center gap-2"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              <div className="w-6 h-6 bg-blue-900 flex items-center justify-center">
                <GraduationCap size={14} weight="fill" className="text-white" />
              </div>
              Existing Scholarships ({scholarships.length})
            </h3>

            {scholarships.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 p-4 text-center">
                <p
                  className="text-gray-500"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  No scholarships found. Create your first scholarship above.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {scholarships.map((scholarship) => (
                  <div
                    key={scholarship.id}
                    className="bg-white border border-gray-200 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 bg-blue-900 flex items-center justify-center"></div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 font-mono">
                              {scholarship.code} | {scholarship.name}
                            </h4>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 400,
                                }}
                              >
                                Value: {scholarship.value}%
                              </span>
                              <span
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 400,
                                }}
                              >
                                Min Units: {scholarship.minUnit}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditScholarship(scholarship)}
                          className="px-3 py-1 bg-blue-900 text-white text-xs hover:bg-blue-700 transition-colors flex items-center gap-1"
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                        >
                          <Gear size={12} />
                          Edit
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteScholarship(scholarship.id)
                          }
                          className="px-3 py-1 bg-red-600 text-white text-xs hover:bg-red-700 transition-colors flex items-center gap-1"
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                        >
                          <X size={12} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Settings Management Modal */}
      <Modal
        isOpen={showAcademicYearModal}
        onClose={closeAcademicYearModal}
        title="Settings"
        size="md"
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 flex items-center justify-center">
              <Gear size={24} className="text-blue-900" weight="bold" />
            </div>
            <div>
              <h3
                className="text-lg font-medium text-gray-900"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                System Settings
              </h3>
              <p
                className="text-xs text-gray-600"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                Manage Academic Year, Semester, and Enrollment Duration
              </p>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 p-4 mb-6">
            <h4
              className="text-xs font-medium text-gray-900 mb-3"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Academic Year & Semester:
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-xs font-medium text-gray-700 mb-1"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Academic Year <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newAY}
                  onChange={(e) => setNewAY(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  placeholder="AY2526"
                  maxLength={6}
                  style={{ fontWeight: 400 }}
                />
                <p
                  className="text-xs text-gray-500 mt-1"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  Format: AY2526
                </p>
              </div>
              <div>
                <label
                  className="block text-xs font-medium text-gray-700 mb-1"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Semester <span className="text-red-500">*</span>
                </label>
                <select
                  value={newSemester}
                  onChange={(e) => setNewSemester(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  style={{ fontWeight: 400 }}
                >
                  <option value="1">1</option>
                  <option value="2">2</option>
                </select>
                <p
                  className="text-xs text-gray-500 mt-1"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  Select semester (1 or 2)
                </p>
              </div>
            </div>
          </div>

          {/* Enrollment Duration for High School */}
          <div className="bg-gray-50 border border-gray-200 p-4 mb-6">
            <h4
              className="text-xs font-medium text-gray-900 mb-3"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Enrollment Duration for High School:
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-xs font-medium text-gray-700 mb-1"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Start Period
                </label>
                <input
                  type="date"
                  value={newEnrollmentStartHS}
                  onChange={(e) => setNewEnrollmentStartHS(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  style={{ fontWeight: 400 }}
                />
              </div>
              <div>
                <label
                  className="block text-xs font-medium text-gray-700 mb-1"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  End Period
                </label>
                <input
                  type="date"
                  value={newEnrollmentEndHS}
                  onChange={(e) => setNewEnrollmentEndHS(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  style={{ fontWeight: 400 }}
                />
              </div>
            </div>
            {newEnrollmentStartHS &&
              newEnrollmentEndHS &&
              (() => {
                const startDate = new Date(newEnrollmentStartHS)
                const endDate = new Date(newEnrollmentEndHS)
                const diffTime = Math.abs(
                  endDate.getTime() - startDate.getTime()
                )
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                return (
                  <div className="mt-3 pt-3 border-t border-gray-300">
                    <p
                      className="text-xs text-gray-700"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      <span className="font-medium">Duration:</span> {diffDays}{' '}
                      {diffDays === 1 ? 'day' : 'days'}
                    </p>
                  </div>
                )
              })()}
            {(newEnrollmentStartHS || newEnrollmentEndHS) && (
              <div className="mt-3 pt-3 border-t border-gray-300">
                <button
                  onClick={() => {
                    setNewEnrollmentStartHS('')
                    setNewEnrollmentEndHS('')
                    toast.info(
                      'High School enrollment duration periods have been cleared.',
                      { autoClose: 3000 }
                    )
                  }}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors flex items-center gap-2"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  <Trash size={12} />
                  Cancel Enrollment
                </button>
              </div>
            )}
          </div>

          {/* Enrollment Duration for College */}
          <div className="bg-gray-50 border border-gray-200 p-4 mb-6">
            <h4
              className="text-xs font-medium text-gray-900 mb-3"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Enrollment Duration for College:
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-xs font-medium text-gray-700 mb-1"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Start Period
                </label>
                <input
                  type="date"
                  value={newEnrollmentStartCollege}
                  onChange={(e) => setNewEnrollmentStartCollege(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  style={{ fontWeight: 400 }}
                />
              </div>
              <div>
                <label
                  className="block text-xs font-medium text-gray-700 mb-1"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  End Period
                </label>
                <input
                  type="date"
                  value={newEnrollmentEndCollege}
                  onChange={(e) => setNewEnrollmentEndCollege(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  style={{ fontWeight: 400 }}
                />
              </div>
            </div>
            {newEnrollmentStartCollege &&
              newEnrollmentEndCollege &&
              (() => {
                const startDate = new Date(newEnrollmentStartCollege)
                const endDate = new Date(newEnrollmentEndCollege)
                const diffTime = Math.abs(
                  endDate.getTime() - startDate.getTime()
                )
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                return (
                  <div className="mt-3 pt-3 border-t border-gray-300">
                    <p
                      className="text-xs text-gray-700"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      <span className="font-medium">Duration:</span> {diffDays}{' '}
                      {diffDays === 1 ? 'day' : 'days'}
                    </p>
                  </div>
                )
              })()}
            {(newEnrollmentStartCollege || newEnrollmentEndCollege) && (
              <div className="mt-3 pt-3 border-t border-gray-300">
                <button
                  onClick={() => {
                    setNewEnrollmentStartCollege('')
                    setNewEnrollmentEndCollege('')
                    toast.info(
                      'College enrollment duration periods have been cleared.',
                      { autoClose: 3000 }
                    )
                  }}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors flex items-center gap-2"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  <Trash size={12} />
                  Cancel Enrollment
                </button>
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 p-4 mb-6">
            <div className="flex items-start gap-2">
              <div>
                <h4
                  className="text-xs font-medium text-blue-900"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Important Note:
                </h4>
                <ul
                  className="text-xs text-blue-800 mt-1 space-y-1"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  <li>
                    • Changing the Academic Year and Semester will affect all
                    new enrollments
                  </li>
                  <li>
                    • Existing enrollments will retain their original Academic
                    Year and Semester
                  </li>
                  <li>
                    • Enrollment Duration sets the time period when students can
                    enroll
                  </li>
                  <li>
                    • The enrollment table will update automatically via
                    real-time snapshots
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={closeAcademicYearModal}
              className="flex-1 px-4 py-2 bg-gray-500 text-white text-xs font-medium hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              disabled={updatingAY}
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateAcademicYear}
              className="flex-1 px-4 py-2 bg-blue-900 text-white text-xs font-medium hover:bg-blue-900 transition-colors flex items-center justify-center gap-2"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              disabled={updatingAY}
            >
              {updatingAY ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Check size={16} />
                  Update Settings
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
