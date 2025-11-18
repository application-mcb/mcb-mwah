'use client'

import React, { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'
import EnrollmentModals from './enrollment-management/EnrollmentModals'

import AnimationStylesInjector from './enrollment-management/AnimationStylesInjector'
// SkeletonCard moved to components/enrollment-management/skeletons/SkeletonCard

// moved to components/enrollment-management/table/
import ControlsSection from './enrollment-management/sections/ControlsSection'
import EnrollmentsListSection from './enrollment-management/sections/EnrollmentsListSection'
import HeaderCell from './enrollment-management/table/HeaderCell'
import {
  ExtendedEnrollmentData,
  StudentProfile,
  StudentDocument,
  StudentDocuments,
  SubjectSetData,
  ScholarshipData,
  SubjectAssignmentData,
  Tab,
} from './enrollment-management/types'

import { SubjectData } from '@/lib/subject-database'
// removed: ViewHandler handled inside EnrollmentModals
import {
  getDateRange,
  getDateTimestamp,
  formatDate,
  formatBirthDate,
  getTimeAgoInfo,
} from './enrollment-management/utils/date'
import {
  formatFullName,
  getInitials,
  buildDeleteConfirmText,
} from './enrollment-management/utils/format'
import {
  getBgColor,
  getStatusHexColor,
  getStatusColor,
} from './enrollment-management/utils/color'
import {
  incrementStudentId,
  getGradeColor as utilGetGradeColor,
  getCourseColor as utilGetCourseColor,
  getEnrollmentDisplayInfo as utilGetEnrollmentDisplayInfo,
} from './enrollment-management/utils/enrollment'
import { resolveAssignedSubjects } from './enrollment-management/utils/enrollment'
import {
  paginate,
  getTotalPages,
} from './enrollment-management/utils/pagination'
import { getTotalUnits as utilGetTotalUnits } from './enrollment-management/utils/units'
import QuickEnrollModal from './enrollment-management/modals/QuickEnrollModal'
import EnrollModal from './enrollment-management/modals/EnrollModal'
import ExportCSVModal from './enrollment-management/modals/ExportCSVModal'
import buildEnrollmentTabs from './enrollment-management/buildTabs'
import { useModalCountdown } from './enrollment-management/utils/hooks'
import {
  fetchSubjectSets,
  fetchSubjects,
  fetchGrades,
  fetchCourses,
  fetchSubjectAssignments,
  fetchProfilesForEnrollments,
  fetchDocumentsForEnrollments,
} from './enrollment-management/utils/data-loaders'
import { setupRealtimeListenerUtil } from './enrollment-management/utils/realtime'
import {
  loadScholarshipsApi,
  createScholarshipApi,
  updateScholarshipApi,
  deleteScholarshipApi,
} from './enrollment-management/utils/scholarships'
import {
  confirmQuickEnrollUtil,
  handleConfirmEnrollUtil,
  enrollSubjectsOnlyUtil,
  revokeEnrollmentUtil,
  deleteEnrollmentUtil,
} from './enrollment-management/utils/enroll'
import useSubjectSelection from './enrollment-management/hooks/useSubjectSelection'
import {
  viewDocumentUtil,
  closeDocumentModalUtil,
} from './enrollment-management/utils/documents'
import {
  loadCurrentAYUtil,
  updateAcademicYearUtil,
} from './enrollment-management/utils/settings'
import { computeFilteredAndSortedEnrollments } from './enrollment-management/utils/listing'
import { handlePrintClickUtil } from './enrollment-management/utils/print'
import { resolveStudentId } from './enrollment-management/utils/resolvers'
import {
  openEnrollModalUtil,
  cancelQuickEnrollUtil,
  cancelEnrollModalUtil,
  cancelDeleteUtil,
  cancelRevokeUtil,
  closeViewModalUtil,
} from './enrollment-management/utils/handlers'
import enrollmentCache from './enrollment-management/utils/enrollmentCache'
import {
  checkPrerequisites,
  FailedPrerequisite,
} from './enrollment-management/utils/prerequisites'

interface EnrollmentManagementProps {
  registrarUid: string
  registrarName?: string
}

// interfaces moved to ./enrollment-management/types

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
  const [itemsPerPage, setItemsPerPage] = useState(5)
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
  const [showAIChatModal, setShowAIChatModal] = useState(false)
  const [aiChatEnrollment, setAiChatEnrollment] =
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

  // Compute total units for a set of subject IDs (moved to utils)
  const getTotalUnits = (subjectIds: string[]) =>
    utilGetTotalUnits(subjectIds, subjects)

  // Scholarships filtered for quick enroll context
  const filteredQuickScholarships = React.useMemo(() => {
    if (!quickEnrollData) return scholarships
    const totalUnits = getTotalUnits(quickEnrollData.subjects)
    return scholarships.filter((s) => (s.minUnit || 0) <= totalUnits)
  }, [quickEnrollData, subjects, scholarships])

  // Scholarships filtered for enroll modal context
  const filteredEnrollScholarships = React.useMemo(() => {
    // If no scholarships loaded yet, return empty array
    if (!scholarships || scholarships.length === 0) {
      console.warn('No scholarships loaded yet')
      return []
    }

    const totalUnits = getTotalUnits(selectedSubjects)
    console.log(
      'Scholarship filtering - Selected subjects:',
      selectedSubjects.length,
      'Subject IDs:',
      selectedSubjects,
      'Total units:',
      totalUnits,
      'Available scholarships:',
      scholarships.length
    )

    // If totalUnits is 0, it might mean subjects aren't loaded yet or don't have unit info
    // In that case, show all scholarships to allow enrollment
    if (totalUnits === 0 && selectedSubjects.length > 0) {
      console.warn(
        'Total units is 0 but subjects are selected - showing all scholarships as fallback'
      )
      return scholarships
    }

    // If no subjects selected, show all scholarships (or none if that's the requirement)
    if (selectedSubjects.length === 0) {
      console.warn('No subjects selected - showing all scholarships')
      return scholarships
    }

    const filtered = scholarships.filter((s) => (s.minUnit || 0) <= totalUnits)
    console.log(
      'Filtered scholarships:',
      filtered.length,
      'Min units required:',
      scholarships.map((s) => s.minUnit || 0),
      'Filtered:',
      filtered.map((s) => ({ id: s.id, name: s.name, minUnit: s.minUnit || 0 }))
    )

    // If filtering resulted in empty array but we have scholarships, show all as fallback
    if (filtered.length === 0 && scholarships.length > 0) {
      console.warn(
        'Filtering resulted in no scholarships - showing all as fallback'
      )
      return scholarships
    }

    return filtered
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
  const [currentStudentTypeFilter, setCurrentStudentTypeFilter] = useState<
    ('regular' | 'irregular')[]
  >([])
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  // Prerequisite Warning
  const [showPrerequisiteWarning, setShowPrerequisiteWarning] = useState(false)
  const [prerequisiteWarnings, setPrerequisiteWarnings] = useState<
    FailedPrerequisite[]
  >([])
  const [prerequisiteOverride, setPrerequisiteOverride] = useState(false)
  const [checkingPrerequisites, setCheckingPrerequisites] = useState(false)
  const [pendingQuickEnrollData, setPendingQuickEnrollData] = useState<{
    enrollment: ExtendedEnrollmentData
    subjects: string[]
  } | null>(null)
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
    // Only auto-select if no subjects are currently selected (preserve custom selections)
    if (tabId === 'subjects' && viewingEnrollment) {
      setTimeout(() => {
        // Use functional update to ensure we're working with the latest state
        setSelectedSubjects((currentSelected) => {
          // Only auto-select if selectedSubjects is empty to preserve user's custom selections
          if (currentSelected.length === 0) {
            const { subjectIds, subjectSetId } = resolveAssignedSubjects(
              viewingEnrollment.enrollmentInfo,
              subjectAssignments,
              allSubjectSets
            )
            if (subjectIds.length > 0) {
              setSelectedSubjectSets(subjectSetId ? [subjectSetId] : [])
              return subjectIds
            } else {
              setSelectedSubjectSets([])
              return []
            }
          }
          // Return current selection if not empty (preserve custom selections)
          return currentSelected
        })
      }, 100)
    }
  }
  const [showDocumentModal, setShowDocumentModal] = useState(false)
  const [viewingDocument, setViewingDocument] = useState<{
    url: string
    fileName: string
    fileType: string
    fileFormat: string
  } | null>(null)

  const { handleSubjectSetToggle, handleSubjectToggle } = useSubjectSelection({
    setSelectedSubjectSets,
    setSelectedSubjects,
  })

  // Hydrate from cache and ensure realtime on mount
  useEffect(() => {
    const snapshot = enrollmentCache.getSnapshot()
    // hydrate local state from cache snapshot
    setEnrollments(snapshot.enrollments as any)
    setStudentProfiles(snapshot.studentProfiles as any)
    setStudentDocuments(snapshot.studentDocuments as any)
    setSubjectSets(snapshot.subjectSets as any)
    setAllSubjectSets(snapshot.allSubjectSets as any)
    setSubjects(snapshot.subjects as any)
    setGrades(snapshot.grades as any)
    setCourses(snapshot.courses as any)
    setSubjectAssignments(snapshot.subjectAssignments as any)
    setCurrentAYFilter(snapshot.currentAYFilter)
    setCurrentSemesterFilter(snapshot.currentSemesterFilter)
    setSortOption(snapshot.sortOption)
    setSearchQuery(snapshot.searchQuery)
    setCurrentPage(snapshot.currentPage)
    setAllDataLoaded(snapshot.allDataLoaded)
    setLoading(snapshot.loading)

    // subscribe to cache updates
    const unsub = enrollmentCache.subscribe((s) => {
      setEnrollments(s.enrollments as any)
      setStudentProfiles(s.studentProfiles as any)
      setStudentDocuments(s.studentDocuments as any)
      setSubjectSets(s.subjectSets as any)
      setAllSubjectSets(s.allSubjectSets as any)
      setSubjects(s.subjects as any)
      setGrades(s.grades as any)
      setCourses(s.courses as any)
      setSubjectAssignments(s.subjectAssignments as any)
      setCurrentAYFilter(s.currentAYFilter)
      setCurrentSemesterFilter(s.currentSemesterFilter)
      setAllDataLoaded(s.allDataLoaded)
      setLoading(s.loading)
    })
    unsubscribeRef.current = unsub

    // ensure realtime listener via cache (single instance)
    enrollmentCache.ensureRealtime((m, o) => toast.error(m, o))

    return () => {
      // persist UI prefs back to cache and release
      enrollmentCache.setPartial({
        sortOption,
        searchQuery,
        currentPage,
      })
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
      enrollmentCache.release()
    }
  }, [])

  // Listen for enrollment submissions from enrollment-form
  useEffect(() => {
    const handleEnrollmentSubmitted = (event: CustomEvent) => {
      try {
        console.log(
          'Enrollment submitted, refreshing cache for user:',
          event.detail.userId
        )
        // Refresh cache to pick up the new enrollment
        // Firestore realtime listener is primary mechanism, but this provides immediate feedback
        enrollmentCache.ensureRealtime((m, o) => toast.error(m, o))
      } catch (error) {
        // Log warning but don't show error toast - Firestore listener will catch changes
        console.warn('Failed to refresh enrollment cache on event:', error)
      }
    }

    window.addEventListener(
      'enrollmentSubmitted',
      handleEnrollmentSubmitted as EventListener
    )

    return () => {
      window.removeEventListener(
        'enrollmentSubmitted',
        handleEnrollmentSubmitted as EventListener
      )
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

  // Countdown timers (shared hook)
  useModalCountdown(showRevokeModal, revokeCountdown, setRevokeCountdown)
  useModalCountdown(showDeleteModal, deleteCountdown, setDeleteCountdown)

  // Load scholarships when modal opens
  useEffect(() => {
    if (showScholarshipModal) {
      loadScholarships()
    }
  }, [showScholarshipModal])

  // Ensure scholarships are loaded for Quick Enroll modal as well
  useEffect(() => {
    if (showQuickEnrollModal) {
      loadScholarships()
    }
  }, [showQuickEnrollModal])

  // Ensure scholarships are loaded when enroll modal opens
  useEffect(() => {
    if (showEnrollModal) {
      loadScholarships()
    }
  }, [showEnrollModal])

  // Load current settings when Settings modal opens
  useEffect(() => {
    if (showAcademicYearModal) {
      loadCurrentAYUtil({
        setCurrentAY,
        setNewAY,
        setCurrentSemester,
        setNewSemester,
        setCurrentSemesterFilter,
        setCurrentEnrollmentStartHS,
        setNewEnrollmentStartHS,
        setCurrentEnrollmentEndHS,
        setNewEnrollmentEndHS,
        setCurrentEnrollmentStartCollege,
        setNewEnrollmentStartCollege,
        setCurrentEnrollmentEndCollege,
        setNewEnrollmentEndCollege,
        toastError: (m: string, o?: any) => toast.error(m, o),
      })
    }
  }, [showAcademicYearModal])

  // Load current AY on mount
  useEffect(() => {
    const loadAY = async () => {
      try {
        const response = await fetch('/api/enrollment?getConfig=true')
        const data = await response.json()
        if (response.ok && data.ayCode) {
          setCurrentAY(data.ayCode)
        }
      } catch (error) {
        console.error('Error loading current AY:', error)
      }
    }
    loadAY()
  }, [])

  // Realtime listener moved into enrollmentCache

  const loadStudentProfiles = async (
    enrollmentData: ExtendedEnrollmentData[]
  ) => {
    try {
      const profiles = await fetchProfilesForEnrollments(enrollmentData)
      setStudentProfiles(profiles as any)
    } catch (error) {
      console.error('Error loading student profiles:', error)
    }
  }

  const loadStudentDocuments = async (
    enrollmentData: ExtendedEnrollmentData[]
  ) => {
    try {
      const documents = await fetchDocumentsForEnrollments(enrollmentData)
      setStudentDocuments(documents as any)
    } catch (error) {
      console.error('Error loading student documents:', error)
    }
  }

  const loadSubjectSets = async () => {
    try {
      const { allSubjectSets, subjectSetsByGrade } = await fetchSubjectSets()
      setSubjectSets(subjectSetsByGrade as any)
      setAllSubjectSets(allSubjectSets as any)
    } catch (error) {
      console.error('Error loading subject sets:', error)
    }
  }

  const loadSubjects = async () => {
    try {
      const subjectsMap = await fetchSubjects()
      setSubjects(subjectsMap as any)
    } catch (error) {
      console.error('Error loading subjects:', error)
    }
  }

  const loadGrades = async () => {
    try {
      const gradesMap = await fetchGrades()
      setGrades(gradesMap as any)
    } catch (error) {
      console.error('Error loading grades:', error)
    }
  }

  const loadCourses = async () => {
    try {
      const coursesMap = await fetchCourses()
      setCourses(coursesMap as any)
    } catch (error) {
      console.error('Error loading courses:', error)
    }
  }

  const handleViewEnrollment = (enrollment: ExtendedEnrollmentData) => {
    // If viewing a different enrollment, clear previous selections
    const isDifferentEnrollment =
      viewingEnrollment?.userId !== enrollment.userId
    if (isDifferentEnrollment) {
      setSelectedSubjects([])
      setSelectedSubjectSets([])
    }

    setViewingEnrollment(enrollment)
    setShowViewModal(true)

    // Auto-select assigned subjects when opening the modal
    // Only auto-select if no subjects are currently selected (preserve custom selections)
    setTimeout(() => {
      // Only auto-select if selectedSubjects is empty to preserve user's custom selections
      // This ensures custom selections aren't overwritten when viewing the same enrollment
      if (selectedSubjects.length === 0) {
        const { subjectIds, subjectSetId } = resolveAssignedSubjects(
          enrollment.enrollmentInfo,
          subjectAssignments,
          allSubjectSets
        )
        if (subjectIds.length > 0) {
          if (subjectSetId) setSelectedSubjectSets([subjectSetId])
          setSelectedSubjects(subjectIds)
        }
      }
    }, 100)
  }

  const handleQuickEnroll = async (enrollment: ExtendedEnrollmentData) => {
    if (!enrollment || enrollment.enrollmentInfo?.status === 'enrolled') {
      return // Already enrolled
    }

    // Debug logging
    console.log('Quick Enroll - Enrollment Info:', enrollment.enrollmentInfo)
    console.log('Quick Enroll - Subject Assignments:', subjectAssignments)
    console.log('Quick Enroll - All Subject Sets:', allSubjectSets)

    const { subjectIds } = resolveAssignedSubjects(
      enrollment.enrollmentInfo,
      subjectAssignments,
      allSubjectSets
    )

    console.log('Quick Enroll - Resolved Subject IDs:', subjectIds)

    if (subjectIds.length === 0) {
      // Check if subject assignments are loaded
      if (subjectAssignments.length === 0) {
        toast.error(
          'Subject assignments are not loaded yet. Please wait a moment and try again.',
          { autoClose: 5000 }
        )
        return
      }

      if (enrollment.enrollmentInfo?.level === 'college') {
        toast.error(
          `No subject assignment found for ${enrollment.enrollmentInfo?.courseCode} ${enrollment.enrollmentInfo?.yearLevel} ${enrollment.enrollmentInfo?.semester}. Please create a subject assignment first.`
        )
      } else {
        const gradeLevel = enrollment.enrollmentInfo?.gradeLevel
        const department = enrollment.enrollmentInfo?.department || 'JHS'
        toast.error(
          `No subject assignment found for Grade ${gradeLevel} (${department}). Please create a subject assignment first.`,
          { autoClose: 5000 }
        )
      }
      return
    }

    // Store enrollment data for potential override
    const enrollData = { enrollment, subjects: subjectIds }
    setPendingQuickEnrollData(enrollData)

    // Check prerequisites before proceeding
    setCheckingPrerequisites(true)
    try {
      const failedPrereqs = await checkPrerequisites(
        enrollment.userId,
        subjectIds,
        subjects,
        enrollment.enrollmentInfo
      )

      if (failedPrereqs.length > 0) {
        // Show prerequisite warning modal
        setPrerequisiteWarnings(failedPrereqs)
        setShowPrerequisiteWarning(true)
        setCheckingPrerequisites(false)
        return
      }
    } catch (error) {
      console.error('Error checking prerequisites:', error)
      // Continue with enrollment if prerequisite check fails
    } finally {
      setCheckingPrerequisites(false)
    }

    // No prerequisites failed, proceed with enrollment
    setPendingQuickEnrollData(null)

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
    setQuickEnrollData(enrollData)
    setShowQuickEnrollModal(true)
  }

  const handlePrerequisiteOverride = async () => {
    setPrerequisiteOverride(true)
    setShowPrerequisiteWarning(false)

    // If we have pending quick enroll data, proceed with quick enroll
    if (pendingQuickEnrollData) {
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
      setQuickEnrollData(pendingQuickEnrollData)
      setPendingQuickEnrollData(null)
      setShowQuickEnrollModal(true)
    } else if (viewingEnrollment && selectedSubjects.length > 0) {
      // Proceed with regular enroll modal
      openEnrollModalUtil({
        viewingEnrollment,
        studentProfiles,
        setEnrollStudentId,
        setShowEnrollModal,
        setEnrollOrNumber,
        setEnrollScholarship,
        incrementStudentId,
      })
    }
  }

  const handleCancelPrerequisiteWarning = () => {
    setShowPrerequisiteWarning(false)
    setPrerequisiteWarnings([])
    setPrerequisiteOverride(false)
    setPendingQuickEnrollData(null)
  }

  const confirmQuickEnroll = async () => {
    if (quickEnrollData?.enrollment) {
      const updated = enrollments.map((e) =>
        (e as any).id === (quickEnrollData.enrollment as any).id
          ? {
              ...e,
              enrollmentInfo: { ...e.enrollmentInfo, status: 'enrolled' },
            }
          : e
      )
      enrollmentCache.setPartial({ enrollments: updated as any })
    }
    return confirmQuickEnrollUtil({
      quickEnrollData,
      studentProfiles,
      quickEnrollOrNumber,
      quickEnrollScholarship,
      quickEnrollStudentId,
      setEnrollingStudent,
      setShowQuickEnrollModal,
      setQuickEnrollData,
      setQuickEnrollOrNumber,
      setQuickEnrollScholarship,
      setQuickEnrollStudentId,
    })
  }

  const cancelQuickEnroll = () =>
    cancelQuickEnrollUtil({
      setShowQuickEnrollModal,
      setQuickEnrollData,
      setQuickEnrollOrNumber,
      setQuickEnrollScholarship,
      setQuickEnrollStudentId,
    })

  const handleOpenEnrollModal = async () => {
    // Debug: Log selected subjects to help diagnose issues
    console.log(
      'Opening enroll modal - Selected subjects:',
      selectedSubjects.length,
      selectedSubjects
    )

    if (!viewingEnrollment || selectedSubjects.length === 0) {
      toast.warning(
        'Please select at least one subject before enrolling the student.',
        {
          autoClose: 5000,
        }
      )
      return
    }

    // Check prerequisites before opening enroll modal
    setCheckingPrerequisites(true)
    try {
      const failedPrereqs = await checkPrerequisites(
        viewingEnrollment.userId,
        selectedSubjects,
        subjects,
        viewingEnrollment.enrollmentInfo
      )

      if (failedPrereqs.length > 0) {
        // Show prerequisite warning modal
        setPrerequisiteWarnings(failedPrereqs)
        setShowPrerequisiteWarning(true)
        setCheckingPrerequisites(false)
        return
      }
    } catch (error) {
      console.error('Error checking prerequisites:', error)
      // Continue with enrollment if prerequisite check fails
    } finally {
      setCheckingPrerequisites(false)
    }

    // Proceed with opening enroll modal
    openEnrollModalUtil({
      viewingEnrollment,
      studentProfiles,
      setEnrollStudentId,
      setShowEnrollModal,
      setEnrollOrNumber,
      setEnrollScholarship,
      incrementStudentId,
    })
  }

  const handleConfirmEnroll = async () => {
    // optimistic: mark enrollment as enrolled in cache
    if (viewingEnrollment) {
      const updated = enrollments.map((e) =>
        (e as any).id === (viewingEnrollment as any).id
          ? {
              ...e,
              enrollmentInfo: { ...e.enrollmentInfo, status: 'enrolled' },
            }
          : e
      )
      enrollmentCache.setPartial({ enrollments: updated as any })
    }
    return handleConfirmEnrollUtil({
      viewingEnrollment,
      selectedSubjects,
      enrollOrNumber,
      enrollScholarship,
      enrollStudentId,
      studentProfiles,
      setEnrollingStudent,
      setShowEnrollModal,
      closeViewModal,
    })
  }

  const cancelEnrollModal = () =>
    cancelEnrollModalUtil({
      setShowEnrollModal,
      setEnrollOrNumber,
      setEnrollScholarship,
      setEnrollStudentId,
    })

  // Scholarship CRUD functions
  const loadScholarships = async () => {
    try {
      const list = await loadScholarshipsApi()
      setScholarships(list as any)
      // mirror into cache
      enrollmentCache.setPartial({ scholarships: list as any })
    } catch (error) {
      console.error('Error loading scholarships:', error)
    }
  }

  // Subject Assignment functions
  const loadSubjectAssignments = async () => {
    try {
      setSubjectAssignmentLoading(true)
      const items = await fetchSubjectAssignments()
      setSubjectAssignments(items as any)
      enrollmentCache.setPartial({ subjectAssignments: items as any })
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
      const ok = await createScholarshipApi(scholarshipForm)
      if (ok) {
        toast.success('Scholarship created successfully.', { autoClose: 5000 })
        resetScholarshipForm()
        loadScholarships()
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
      const ok = await updateScholarshipApi(
        editingScholarship.id,
        scholarshipForm
      )
      if (ok) {
        toast.success('Scholarship updated successfully.', { autoClose: 5000 })
        resetScholarshipForm()
        setEditingScholarship(null)
        loadScholarships()
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
      const ok = await deleteScholarshipApi(scholarshipId)
      if (ok) {
        toast.success('Scholarship deleted successfully.', { autoClose: 5000 })
        loadScholarships()
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
  const handleUpdateAcademicYear = async () =>
    updateAcademicYearUtil({
      newAY,
      newSemester,
      newEnrollmentStartHS,
      newEnrollmentEndHS,
      newEnrollmentStartCollege,
      newEnrollmentEndCollege,
      toastError: (m: string, o?: any) => toast.error(m, o),
      toastSuccess: (m: string, o?: any) => toast.success(m, o),
      setCurrentAY,
      setCurrentSemester,
      setCurrentAYFilter,
      setCurrentSemesterFilter,
      setCurrentEnrollmentStartHS,
      setCurrentEnrollmentEndHS,
      setCurrentEnrollmentStartCollege,
      setCurrentEnrollmentEndCollege,
      setShowAcademicYearModal,
      setUpdatingAY,
    })

  const closeAcademicYearModal = () => {
    setShowAcademicYearModal(false)
    setNewAY('')
    setNewSemester('')
    setNewEnrollmentStartHS('')
    setNewEnrollmentEndHS('')
    setNewEnrollmentStartCollege('')
    setNewEnrollmentEndCollege('')
  }

  const closeViewModal = () =>
    closeViewModalUtil({
      setShowViewModal,
      setViewingEnrollment,
      setActiveTab,
      setSelectedSubjectSets,
      setSelectedSubjects,
      setShowOtherSets,
      setShowRevokeModal,
      setRevokeCountdown,
      setShowQuickEnrollModal,
      setQuickEnrollData,
      setShowEnrollModal,
      setEnrollOrNumber,
      setEnrollScholarship,
      setEnrollStudentId,
      setEnrollingStudent,
      setRevokingEnrollment,
    })

  const handleViewDocument = (doc: StudentDocument) =>
    viewDocumentUtil(doc as any, setViewingDocument, setShowDocumentModal)

  const handleCloseDocumentModal = () =>
    closeDocumentModalUtil(setViewingDocument, setShowDocumentModal)

  const handleOpenAIChat = (enrollment: ExtendedEnrollmentData) => {
    setAiChatEnrollment(enrollment)
    setShowAIChatModal(true)
  }

  const handleCloseAIChatModal = () => {
    setShowAIChatModal(false)
    setAiChatEnrollment(null)
  }

  const handleEnrollStudent = async () => {
    if (viewingEnrollment) {
      const updated = enrollments.map((e) =>
        (e as any).id === (viewingEnrollment as any).id
          ? {
              ...e,
              enrollmentInfo: { ...e.enrollmentInfo, status: 'enrolled' },
            }
          : e
      )
      enrollmentCache.setPartial({ enrollments: updated as any })
    }
    return enrollSubjectsOnlyUtil({
      viewingEnrollment,
      selectedSubjects,
      setEnrollingStudent,
      closeViewModal,
    })
  }

  const handleRevokeEnrollment = () => {
    setShowRevokeModal(true)
    setRevokeCountdown(5)
  }

  const confirmRevokeEnrollment = async () => {
    if (viewingEnrollment) {
      const updated = enrollments.map((e) =>
        (e as any).id === (viewingEnrollment as any).id
          ? {
              ...e,
              enrollmentInfo: { ...e.enrollmentInfo, status: 'pending' },
            }
          : e
      )
      enrollmentCache.setPartial({ enrollments: updated as any })
    }
    return revokeEnrollmentUtil({
      viewingEnrollment,
      setShowRevokeModal,
      setRevokingEnrollment,
      closeViewModal,
    })
  }

  const cancelRevoke = () =>
    cancelRevokeUtil({ setShowRevokeModal, setRevokeCountdown })

  const handleDeleteEnrollment = (enrollment: ExtendedEnrollmentData) => {
    setEnrollmentToDelete(enrollment)
    setShowDeleteModal(true)
    setDeleteCountdown(5)
  }

  const confirmDeleteEnrollment = async () => {
    if (enrollmentToDelete) {
      const filtered = enrollments.filter(
        (e) => (e as any).id !== (enrollmentToDelete as any).id
      )
      enrollmentCache.setPartial({ enrollments: filtered as any })
    }
    return deleteEnrollmentUtil({
      enrollmentToDelete,
      setShowDeleteModal,
      setEnrollmentToDelete,
      setDeletingEnrollment,
    })
  }

  const cancelDelete = () =>
    cancelDeleteUtil({
      setShowDeleteModal,
      setDeleteCountdown,
      setEnrollmentToDelete,
    })

  // utils moved to enrollment-management/utils/date

  // formatter moved to enrollment-management/utils/format

  // Filter and sort enrollments - memoized for performance
  const filteredAndSortedEnrollments = React.useMemo(
    () =>
      computeFilteredAndSortedEnrollments({
        enrollments,
        currentAYFilter,
        currentSemesterFilter,
        currentStudentTypeFilter,
        debouncedSearchQuery,
        sortOption,
      }),
    [
      enrollments,
      debouncedSearchQuery,
      sortOption,
      currentAYFilter,
      currentSemesterFilter,
      currentStudentTypeFilter,
    ]
  )

  // Paginated enrollments
  const paginatedEnrollments = React.useMemo(() => {
    return paginate(filteredAndSortedEnrollments, currentPage, itemsPerPage)
  }, [filteredAndSortedEnrollments, currentPage, itemsPerPage])

  // Calculate total pages
  const totalPages = getTotalPages(
    filteredAndSortedEnrollments.length,
    itemsPerPage
  )

  // colors moved to utils/color

  // date formatter moved

  // birthdate formatter moved

  // initials moved

  // Helper function to increment student ID (YYY-XXX format)
  // incrementStudentId moved

  // Get grade color from database (matching grade-list.tsx structure)
  const getGradeColor = (gradeLevel: number): string =>
    utilGetGradeColor(grades, gradeLevel)

  // Get course color from database by course code
  const getCourseColor = (courseCode: string): string =>
    utilGetCourseColor(courses, courseCode)

  // Helper function to get display info for enrollment (handles both high school and college)
  const getEnrollmentDisplayInfo = (enrollment: any) =>
    utilGetEnrollmentDisplayInfo(enrollment, {
      getCourseColor: (code: string) => getCourseColor(code),
      getGradeColor: (level: number) => getGradeColor(level),
    })

  // Color mapping for background colors (matching grade-list.tsx)
  // getBgColor moved

  // Get status color as hex value for square badge
  // getStatusHexColor moved

  // Calculate time ago string and badge color
  // getTimeAgoInfo moved

  // Tab content for the modal
  const tabs: Tab[] = React.useMemo(
    () =>
      buildEnrollmentTabs({
        viewingEnrollment,
        studentProfiles,
        studentDocuments,
        subjectSets,
        subjects,
        allSubjectSets,
        subjectAssignments,
        selectedSubjectSets,
        selectedSubjects,
        setSelectedSubjectSets: (updater) =>
          setSelectedSubjectSets((prev) => updater(prev)),
        setSelectedSubjects: (updater) =>
          setSelectedSubjects((prev) => updater(prev)),
        showOtherSets,
        setShowOtherSets,
        getEnrollmentDisplayInfo,
        getStatusColor,
        getBgColor,
        formatFullName,
        formatBirthDate,
        formatDate,
        getTimeAgoInfo,
        onViewDocument: handleViewDocument,
        onCancelProcess: closeViewModal,
        onPrintProcess: () => setShowPrintModal(true),
        onRevoke: handleRevokeEnrollment,
        revokingEnrollment,
        onOpenEnroll: handleOpenEnrollModal,
        enrollingStudent,
        onOpenAIChat: () => {
          if (viewingEnrollment) {
            handleOpenAIChat(viewingEnrollment)
          }
        },
        handleSubjectSetToggle,
        handleSubjectToggle,
        registrarUid,
        onDocumentStatusChange: async () => {
          if (viewingEnrollment) {
            await loadStudentDocuments([viewingEnrollment])
          }
        },
      }),
    [
      viewingEnrollment,
      studentProfiles,
      studentDocuments,
      subjectSets,
      subjects,
      allSubjectSets,
      subjectAssignments,
      selectedSubjectSets,
      selectedSubjects,
      showOtherSets,
      getEnrollmentDisplayInfo,
      getStatusColor,
      getBgColor,
      formatFullName,
      formatBirthDate,
      formatDate,
      getTimeAgoInfo,
      revokingEnrollment,
      enrollingStudent,
      handleSubjectSetToggle,
      handleSubjectToggle,
    ]
  )

  // Show loading skeleton only when no cached rows are available
  const showTableSkeleton =
    (loading || !allDataLoaded) && enrollments.length === 0

  const studentIdResolved = resolveStudentId(viewingEnrollment, studentProfiles)

  return (
    <div className="p-6 space-y-6">
      <AnimationStylesInjector />
      <ControlsSection
        currentAYFilter={currentAYFilter}
        currentSemesterFilter={currentSemesterFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortOption={sortOption}
        setSortOption={setSortOption}
        currentStudentTypeFilter={currentStudentTypeFilter}
        onStudentTypeFilterChange={setCurrentStudentTypeFilter}
        onAYFilterChange={(v) => {
          setCurrentAYFilter(v)
          setCurrentPage(1)
        }}
        onSemesterFilterChange={(v) => {
          setCurrentSemesterFilter(v)
          setCurrentPage(1)
        }}
        onResetFilters={() => {
          setCurrentAYFilter('')
          setCurrentSemesterFilter('')
          setCurrentStudentTypeFilter([])
          setSortOption('latest')
          setCurrentPage(1)
        }}
        showFilterDropdown={showFilterDropdown}
        onToggleFilterDropdown={() =>
          setShowFilterDropdown(!showFilterDropdown)
        }
        onOpenSettings={() => setShowAcademicYearModal(true)}
        onOpenScholarship={() => setShowScholarshipModal(true)}
        onExportClick={() => setShowExportModal(true)}
      />

      <EnrollmentsListSection
        showTableSkeleton={showTableSkeleton}
        filteredAndSortedEnrollments={filteredAndSortedEnrollments}
        paginatedEnrollments={paginatedEnrollments}
        studentProfiles={studentProfiles}
        subjectAssignments={subjectAssignments as any}
        subjectSets={subjectSets as any}
        enrollingStudent={enrollingStudent}
        onView={handleViewEnrollment}
        onQuickEnroll={handleQuickEnroll}
        onDelete={handleDeleteEnrollment}
        onPrint={(enrollment) =>
          handlePrintClickUtil({
            enrollment,
            subjectAssignments,
            allSubjectSets,
            setViewingEnrollment,
            setSelectedSubjects,
            setShowPrintModal,
          })
        }
        onOpenAIChat={handleOpenAIChat}
        getEnrollmentDisplayInfo={getEnrollmentDisplayInfo}
        getBgColor={getBgColor}
        getStatusHexColor={getStatusHexColor}
        getTimeAgoInfo={getTimeAgoInfo}
        formatFullName={formatFullName}
        formatDate={formatDate}
        getInitials={getInitials}
        currentPage={currentPage}
        setCurrentPage={(updater) => setCurrentPage((prev) => updater(prev))}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={setItemsPerPage}
        totalItems={filteredAndSortedEnrollments.length}
      />

      <EnrollmentModals
        viewingEnrollment={viewingEnrollment}
        studentProfiles={studentProfiles}
        subjects={subjects as any}
        subjectSets={subjectSets as any}
        registrarName={registrarName}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        tabs={tabs as any}
        formatFullName={formatFullName}
        getInitials={getInitials}
        getStatusColor={getStatusColor}
        getEnrollmentDisplayInfo={getEnrollmentDisplayInfo as any}
        viewingDocument={viewingDocument}
        showDocumentModal={showDocumentModal}
        onCloseDocument={handleCloseDocumentModal}
        showPrintModal={showPrintModal}
        onClosePrint={() => setShowPrintModal(false)}
        selectedSubjects={selectedSubjects}
        showRevokeModal={showRevokeModal}
        onCancelRevoke={cancelRevoke}
        onConfirmRevoke={confirmRevokeEnrollment}
        revokeCountdown={revokeCountdown}
        revokingEnrollment={revokingEnrollment}
        showQuickEnrollModal={showQuickEnrollModal}
        onCancelQuickEnroll={cancelQuickEnroll}
        quickEnrollData={quickEnrollData}
        filteredQuickScholarships={filteredQuickScholarships as any}
        quickEnrollOrNumber={quickEnrollOrNumber}
        setQuickEnrollOrNumber={setQuickEnrollOrNumber}
        quickEnrollScholarship={quickEnrollScholarship}
        setQuickEnrollScholarship={setQuickEnrollScholarship}
        quickEnrollStudentId={quickEnrollStudentId}
        setQuickEnrollStudentId={setQuickEnrollStudentId}
        enrollingStudent={enrollingStudent}
        onConfirmQuickEnroll={confirmQuickEnroll}
        showEnrollModal={showEnrollModal}
        onCancelEnroll={cancelEnrollModal}
        selectedSubjectsCount={selectedSubjects.length}
        studentIdResolved={studentIdResolved}
        enrollOrNumber={enrollOrNumber}
        setEnrollOrNumber={setEnrollOrNumber}
        enrollScholarship={enrollScholarship}
        setEnrollScholarship={setEnrollScholarship}
        enrollStudentId={enrollStudentId}
        setEnrollStudentId={setEnrollStudentId}
        filteredEnrollScholarships={filteredEnrollScholarships as any}
        onConfirmEnroll={handleConfirmEnroll}
        showDeleteModal={showDeleteModal}
        onCancelDelete={cancelDelete}
        onConfirmDelete={confirmDeleteEnrollment}
        deleteCountdown={deleteCountdown}
        deletingEnrollment={deletingEnrollment}
        deleteConfirmText={
          enrollmentToDelete ? buildDeleteConfirmText(enrollmentToDelete) : ''
        }
        showScholarshipModal={showScholarshipModal}
        onCloseScholarship={closeScholarshipModal}
        scholarships={scholarships}
        editingScholarship={editingScholarship}
        scholarshipForm={scholarshipForm}
        setScholarshipForm={setScholarshipForm as any}
        scholarshipLoading={scholarshipLoading}
        handleCreateScholarship={handleCreateScholarship}
        handleUpdateScholarship={handleUpdateScholarship}
        handleDeleteScholarship={handleDeleteScholarship}
        handleEditScholarship={handleEditScholarship}
        resetScholarshipForm={resetScholarshipForm}
        showAcademicYearModal={showAcademicYearModal}
        onCloseAcademicYear={closeAcademicYearModal}
        newAY={newAY}
        setNewAY={setNewAY}
        newSemester={newSemester}
        setNewSemester={setNewSemester}
        newEnrollmentStartHS={newEnrollmentStartHS}
        setNewEnrollmentStartHS={setNewEnrollmentStartHS}
        newEnrollmentEndHS={newEnrollmentEndHS}
        setNewEnrollmentEndHS={setNewEnrollmentEndHS}
        newEnrollmentStartCollege={newEnrollmentStartCollege}
        setNewEnrollmentStartCollege={setNewEnrollmentStartCollege}
        newEnrollmentEndCollege={newEnrollmentEndCollege}
        setNewEnrollmentEndCollege={setNewEnrollmentEndCollege}
        updatingAY={updatingAY}
        onUpdateAcademicYear={handleUpdateAcademicYear}
        onClearHSDuration={() => {
          setNewEnrollmentStartHS('')
          setNewEnrollmentEndHS('')
          toast.info(
            'High School enrollment duration periods have been cleared.',
            { autoClose: 3000 }
          )
        }}
        onClearCollegeDuration={() => {
          setNewEnrollmentStartCollege('')
          setNewEnrollmentEndCollege('')
          toast.info('College enrollment duration periods have been cleared.', {
            autoClose: 3000,
          })
        }}
        showViewModal={showViewModal}
        onCloseView={closeViewModal}
        showAIChatModal={showAIChatModal}
        aiChatEnrollment={aiChatEnrollment}
        onCloseAIChatModal={handleCloseAIChatModal}
        studentDocuments={studentDocuments}
        subjectAssignments={subjectAssignments as any}
        grades={grades}
        courses={Object.values(courses) as any}
        showPrerequisiteWarning={showPrerequisiteWarning}
        prerequisiteWarnings={prerequisiteWarnings}
        onCancelPrerequisiteWarning={handleCancelPrerequisiteWarning}
        onProceedPrerequisiteWarning={handlePrerequisiteOverride}
        checkingPrerequisites={checkingPrerequisites}
      />

      <ExportCSVModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        enrollments={enrollments}
        studentProfiles={studentProfiles}
        subjects={subjects}
        sections={{}}
        courses={courses}
        grades={grades}
        currentAY={currentAY}
      />
    </div>
  )
}
