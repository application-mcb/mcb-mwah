'use client'

import React, { useState, useEffect } from 'react'
import {
  GraduationCap,
  Users,
  User,
  IdentificationCard,
  MagnifyingGlass,
  FunnelSimple,
  X,
} from '@phosphor-icons/react'
import { toast } from 'react-toastify'
import { GradeData } from '@/lib/types/grade-section'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { ArrowLeft, ArrowRight } from '@phosphor-icons/react'

interface TeacherStudentsViewProps {
  teacherId: string
}

interface EnrollmentData {
  userId: string
  personalInfo: {
    firstName: string
    middleName?: string
    lastName: string
    nameExtension?: string
    email: string
  }
  enrollmentInfo: {
    gradeLevel?: string
    department?: string // For high school (JHS/SHS)
    strand?: string // For SHS
    semester?: 'first-sem' | 'second-sem' // For college and SHS
    schoolYear: string
    enrollmentDate: string
    status: string
    orNumber?: string
    scholarship?: string
    studentId?: string
    sectionId?: string
    level?: 'college' | 'high-school'
    courseCode?: string // For college
    courseName?: string // For college
    yearLevel?: number // For college
  }
  selectedSubjects?: string[]
}

interface StudentProfile {
  userId: string
  photoURL?: string
  email?: string
  studentId?: string
}

interface Subject {
  id: string
  code: string
  name: string
  color: string
  gradeLevel: number
}

interface Section {
  id: string
  sectionName: string
  gradeId: string
  rank: string
  grade: string
  department: string
}

interface TeacherAssignment {
  subjectId: string
  sectionId: string
  teacherId: string
}

export default function TeacherStudentsView({
  teacherId,
}: TeacherStudentsViewProps) {
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([])
  const [enrollments, setEnrollments] = useState<
    Record<string, EnrollmentData>
  >({})
  const [studentProfiles, setStudentProfiles] = useState<
    Record<string, StudentProfile>
  >({})
  const [subjects, setSubjects] = useState<Record<string, Subject>>({})
  const [sections, setSections] = useState<Record<string, Section>>({})
  const [sectionsMap, setSectionsMap] = useState<Record<string, any>>({})
  const [grades, setGrades] = useState<Record<string, GradeData>>({})
  const [loading, setLoading] = useState(true)
  const [lastLoaded, setLastLoaded] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string[]>(
    []
  )
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string[]>(
    []
  )
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 5
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes in milliseconds

  useEffect(() => {
    loadTeacherStudents()
  }, [teacherId])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedSubjectFilter, selectedSectionFilter])

  const loadTeacherStudents = async () => {
    try {
      // Check if data is cached and recent enough
      const now = Date.now()
      if (
        lastLoaded &&
        now - lastLoaded < CACHE_DURATION &&
        Object.keys(enrollments).length > 0
      ) {
        setLoading(false)
        return
      }

      setLoading(true)

      // Load teacher assignments
      const assignmentsResponse = await fetch(
        `/api/teacher-assignments?teacherId=${teacherId}`
      )
      const assignmentsData = await assignmentsResponse.json()

      if (assignmentsResponse.ok && assignmentsData.assignments) {
        // Transform the API response from {subjectId: [sectionIds]} to [{subjectId, sectionId}]
        const transformedAssignments: TeacherAssignment[] = []
        Object.entries(assignmentsData.assignments).forEach(
          ([subjectId, sectionIds]) => {
            if (Array.isArray(sectionIds)) {
              sectionIds.forEach((sectionId) => {
                transformedAssignments.push({
                  subjectId,
                  sectionId: sectionId as string,
                  teacherId,
                })
              })
            }
          }
        )
        setAssignments(transformedAssignments)

        // Get unique section IDs from assignments
        const sectionIds = [
          ...new Set(
            transformedAssignments.map((a: TeacherAssignment) => a.sectionId)
          ),
        ]

        // Load all sections once and filter client-side for better performance
        const sectionsResponse = await fetch('/api/sections')
        const sectionsMap: Record<string, any> = {}
        const allStudentIds: string[] = []

        if (sectionsResponse.ok) {
          const sectionsData = await sectionsResponse.json()
          if (sectionsData.sections && Array.isArray(sectionsData.sections)) {
            // Filter sections to only include those assigned to this teacher
            const relevantSections = sectionsData.sections.filter(
              (section: any) => sectionIds.includes(section.id)
            )

            // Build sectionsMap and collect student IDs
            relevantSections.forEach((section: any) => {
              sectionsMap[section.id] = section
              if (section.students && Array.isArray(section.students)) {
                allStudentIds.push(...section.students)
              }
            })
          }
        }

        // Update sectionsMap state
        setSectionsMap(sectionsMap)

        // Remove duplicate student IDs
        const uniqueStudentIds = [...new Set(allStudentIds)]

        // For college students: Load all college enrollments and match by subjects
        // College students may not be in section.students arrays, so we need to load them directly
        const collegeStudentIds: string[] = []
        const collegeEnrollmentsMap: Record<string, EnrollmentData> = {}
        
        try {
          // Get system config for current semester
          const configResponse = await fetch('/api/enrollment?getConfig=true')
          if (configResponse.ok) {
            const configData = await configResponse.json()
            const currentSemester =
              configData.semester === '1'
                ? 'first-sem'
                : configData.semester === '2'
                ? 'second-sem'
                : undefined

            // Get all enrolled students
            const allEnrollmentsResponse = await fetch(
              '/api/enrollment?getEnrolledStudents=true'
            )
            if (allEnrollmentsResponse.ok) {
              const allEnrollmentsData = await allEnrollmentsResponse.json()
              if (
                allEnrollmentsData.success &&
                allEnrollmentsData.enrollments
              ) {
                // Filter for college students in current semester who are in teacher's assigned sections
                const collegeEnrollments = allEnrollmentsData.enrollments.filter(
                  (enrollment: EnrollmentData) => {
                    const isCollege =
                      enrollment.enrollmentInfo?.level === 'college'
                    const matchesSemester =
                      !currentSemester ||
                      enrollment.enrollmentInfo?.semester === currentSemester
                    
                    if (!isCollege || !matchesSemester) return false

                    // Get student's section
                    const studentSectionId =
                      enrollment.enrollmentInfo?.sectionId

                    // Check if teacher is assigned to student's section for ANY subject
                    const hasMatchingSectionAssignment = studentSectionId
                      ? transformedAssignments.some(
                          (assignment: TeacherAssignment) =>
                            assignment.sectionId === studentSectionId
                        )
                      : false

                    return hasMatchingSectionAssignment
                  }
                )

                // Store college enrollments and collect student IDs
                collegeEnrollments.forEach((enrollment: EnrollmentData) => {
                  collegeEnrollmentsMap[enrollment.userId] = enrollment
                  if (!uniqueStudentIds.includes(enrollment.userId)) {
                    collegeStudentIds.push(enrollment.userId)
                  }
                })
              }
            }
          }
        } catch (error) {
          console.warn('Error loading college students:', error)
        }

        // Combine student IDs from sections and college enrollments
        const allStudentIdsCombined = [
          ...uniqueStudentIds,
          ...collegeStudentIds,
        ]

        // Load enrollment data and profiles in parallel for better performance
        const enrollmentsMap: Record<string, EnrollmentData> = {}
        const profilesMap: Record<string, StudentProfile> = {}

        // Add college enrollments directly to enrollmentsMap
        Object.entries(collegeEnrollmentsMap).forEach(
          ([userId, enrollment]) => {
            enrollmentsMap[userId] = enrollment
          }
        )

        if (allStudentIdsCombined.length > 0) {
          // Filter out college students that are already loaded
          const studentIdsToLoad = allStudentIdsCombined.filter(
            (id) => !collegeStudentIds.includes(id)
          )

          // Make batch requests for enrollments and profiles for better performance
          const [enrollmentResponse, profileResponse] = await Promise.all([
            studentIdsToLoad.length > 0
              ? fetch(
                  `/api/enrollment?userIds=${studentIdsToLoad.join(',')}`
                ).catch(() => null)
              : Promise.resolve(null),
            fetch(
              `/api/user/profile?uids=${allStudentIdsCombined.join(',')}`
            ).catch(() => null),
          ])

          // Process batch enrollment data with fallback
          let enrollmentBatchSuccess = false
          if (enrollmentResponse && enrollmentResponse.ok) {
            try {
              const enrollmentData = await enrollmentResponse.json()
              if (enrollmentData.success && enrollmentData.data) {
                enrollmentData.data.forEach((enrollment: EnrollmentData) => {
                  enrollmentsMap[enrollment.userId] = enrollment
                })
                enrollmentBatchSuccess = true
              }
            } catch (error) {
              console.error('Error processing batch enrollment data:', error)
            }
          }

          // Fallback to individual requests if batch failed
          if (!enrollmentBatchSuccess && studentIdsToLoad.length > 0) {
            console.warn(
              'Batch enrollment request failed, falling back to individual requests'
            )
            const enrollmentPromises = studentIdsToLoad.map((userId) =>
              fetch(`/api/enrollment?userId=${userId}`)
                .then(async (res) => {
                  if (res.ok) {
                    const data = await res.json()
                    if (data.success && data.data) {
                      enrollmentsMap[data.data.userId] = data.data
                    }
                  }
                })
                .catch((error) => {
                  console.error(
                    `Failed to fetch enrollment for user ${userId}:`,
                    error
                  )
                })
            )
            await Promise.allSettled(enrollmentPromises)
          }

          // Process batch profile data with fallback
          let profileBatchSuccess = false
          if (profileResponse && profileResponse.ok) {
            try {
              const profileData = await profileResponse.json()
              if (profileData.success && profileData.users) {
                profileData.users.forEach((user: any) => {
                  if (user && user.uid) {
                    profilesMap[user.uid] = {
                      userId: user.uid,
                      photoURL: user.photoURL,
                      email: user.email,
                      studentId: user.studentId,
                    }
                  }
                })
                profileBatchSuccess = true
              }
            } catch (error) {
              console.error('Error processing batch profile data:', error)
            }
          }

          // Fallback to individual requests if batch failed
          if (!profileBatchSuccess) {
            console.warn(
              'Batch profile request failed, falling back to individual requests'
            )
            const profilePromises = allStudentIdsCombined.map((userId) =>
              fetch(`/api/user/profile?uid=${userId}`)
                .then(async (res) => {
                  if (res.ok) {
                    const data = await res.json()
                    if (data.success && data.user) {
                      profilesMap[data.user.uid] = {
                        userId: data.user.uid,
                        photoURL: data.user.photoURL,
                        email: data.user.email,
                        studentId: data.user.studentId,
                      }
                    }
                  }
                })
                .catch((error) => {
                  console.error(
                    `Failed to fetch profile for user ${userId}:`,
                    error
                  )
                })
            )
            await Promise.allSettled(profilePromises)
          }
        }

        setEnrollments(enrollmentsMap)
        setStudentProfiles(profilesMap)
      }

      // Load subjects
      const subjectsResponse = await fetch('/api/subjects')
      const subjectsData = await subjectsResponse.json()

      if (subjectsResponse.ok && subjectsData.subjects) {
        const subjectsMap: Record<string, Subject> = {}
        subjectsData.subjects.forEach((subject: Subject) => {
          subjectsMap[subject.id] = subject
        })
        setSubjects(subjectsMap)
      }

      // Load sections
      const sectionsResponse = await fetch('/api/sections')
      const sectionsData = await sectionsResponse.json()

      if (sectionsResponse.ok && sectionsData.sections) {
        const sectionsMap: Record<string, Section> = {}
        sectionsData.sections.forEach((section: Section) => {
          sectionsMap[section.id] = section
        })
        setSections(sectionsMap)
      }

      // Load grades (for grade level colors)
      const gradesResponse = await fetch('/api/grades')
      const gradesData = await gradesResponse.json()

      if (gradesResponse.ok && gradesData.grades) {
        const gradesMap: Record<string, GradeData> = {}
        gradesData.grades.forEach((grade: GradeData) => {
          gradesMap[grade.id] = grade
        })
        setGrades(gradesMap)
      }

      // Update cache timestamp
      setLastLoaded(Date.now())
    } catch (error) {
      console.error('Error loading teacher students:', error)
      toast.error('Failed to load your students')
    } finally {
      setLoading(false)
    }
  }

  const getSubjectColor = (color: string): string => {
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

  const getGradeColor = (section: Section | null): string => {
    // Get the grade data from the section's gradeId
    if (section && section.gradeId && grades[section.gradeId]) {
      const gradeData = grades[section.gradeId]
      return getSubjectColor(gradeData.color)
    }
    return '#1e40af' // Default color
  }

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0)?.toUpperCase() || ''
    const last = lastName?.charAt(0)?.toUpperCase() || ''
    return first + last
  }

  const formatFullName = (enrollment: EnrollmentData) => {
    const { firstName, middleName, lastName, nameExtension } =
      enrollment.personalInfo
    let fullName = firstName || ''

    if (middleName) {
      fullName += ` ${middleName.charAt(0).toUpperCase()}.`
    }

    if (lastName) {
      fullName += ` ${lastName}`
    }

    if (nameExtension) {
      fullName += ` ${nameExtension}`
    }

    return fullName || 'Unknown Student'
  }

  // Get unique subjects and sections for filtering
  const availableSubjects = [...new Set(assignments.map((a) => a.subjectId))]
  const availableSections = [...new Set(assignments.map((a) => a.sectionId))]

  // Filter students based on search and filters
  const filteredStudents = Object.values(enrollments).filter((enrollment) => {
    // Only show students who are in sections assigned to this teacher
    const studentSection = enrollment.enrollmentInfo?.sectionId
    const isCollege = enrollment.enrollmentInfo?.level === 'college'
    
    // Check if student is in a section assigned to teacher
    const isInTeacherSection = studentSection
      ? assignments.some((a) => a.sectionId === studentSection)
      : false

    if (!isInTeacherSection) return false

    // Subject filter - only show students who have ANY of the selected subjects with the teacher
    if (selectedSubjectFilter.length > 0) {
      if (isCollege) {
        // For college: check if teacher is assigned to their section for selected subjects
        const hasAnySelectedSubject = selectedSubjectFilter.some((subjectId) =>
          assignments.some(
            (a) => a.subjectId === subjectId && a.sectionId === studentSection
          )
        )
        if (!hasAnySelectedSubject) return false
      } else {
        // For high school: must have section
        if (!studentSection) return false
        const hasAnySelectedSubject = selectedSubjectFilter.some((subjectId) =>
          assignments.some(
            (a) => a.subjectId === subjectId && a.sectionId === studentSection
          )
        )
        if (!hasAnySelectedSubject) return false
      }
    }

    // Section filter - only show students in ANY of the selected sections
    // For college students, section filter is optional (they might not have sections)
    if (selectedSectionFilter.length > 0) {
      if (isCollege) {
        // For college: if they have a section, it must match; if no section, skip filter
        if (studentSection && !selectedSectionFilter.includes(studentSection)) {
          return false
        }
      } else {
        // For high school: must have a matching section
        if (!selectedSectionFilter.includes(studentSection || '')) {
          return false
        }
      }
    }

    // Search filter
    const query = searchQuery.toLowerCase()
    if (query) {
      const fullName = formatFullName(enrollment).toLowerCase()
      const studentId =
        studentProfiles[enrollment.userId]?.studentId?.toLowerCase() || ''
      const email = enrollment.personalInfo?.email?.toLowerCase() || ''

      return (
        fullName.includes(query) ||
        studentId.includes(query) ||
        email.includes(query)
      )
    }

    return true
  })

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / ITEMS_PER_PAGE))
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex)

  // Ensure currentPage is valid
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  // Helper function to get section name
  const getSectionName = (sectionId: string) => {
    if (sectionId === 'unassigned') return 'Unassigned'
    const section = sections[sectionId]
    return section ? `${section.sectionName} - ${section.rank}` : sectionId
  }

  const handleResetFilters = () => {
    setSearchQuery('')
    setSelectedSubjectFilter([])
    setSelectedSectionFilter([])
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl p-6">
          <h1
            className="text-2xl font-light text-white flex items-center gap-2"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            <div className="w-8 h-8 aspect-square bg-white rounded-xl flex items-center justify-center">
              <Users size={20} weight="fill" className="text-blue-900" />
            </div>
            My Students
          </h1>
          <p
            className="text-xs text-blue-100 mt-1"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            View students in your classes
          </p>
        </div>

        {/* Search and Filter Skeleton */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-pulse">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1">
              <div className="h-9 w-full bg-blue-50 rounded-lg border border-blue-100"></div>
            </div>
          </div>
          <div className="h-9 w-24 bg-blue-50 rounded-lg border border-blue-100"></div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-white/95 border border-blue-100 rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-800 to-blue-900 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-3 w-32 bg-white/20 rounded animate-pulse"></div>
                <div className="h-4 w-24 bg-white/20 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="h-3 w-40 bg-white/20 rounded animate-pulse"></div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-blue-50/80 border-b border-blue-100">
                  <th className="px-6 py-3 text-left">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-200 animate-pulse"></div>
                      <div className="h-3 w-32 bg-blue-200 rounded animate-pulse"></div>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-200 animate-pulse"></div>
                      <div className="h-3 w-28 bg-blue-200 rounded animate-pulse"></div>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-200 animate-pulse"></div>
                      <div className="h-3 w-36 bg-blue-200 rounded animate-pulse"></div>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-50 bg-white">
                {[...Array(5)].map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-100"></div>
                        <div className="space-y-2">
                          <div className="h-4 w-40 bg-blue-100 rounded"></div>
                          <div className="h-3 w-28 bg-blue-50 rounded"></div>
                          <div className="h-3 w-36 bg-blue-50 rounded"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-blue-100"></div>
                          <div className="h-4 w-32 bg-blue-100 rounded"></div>
                        </div>
                        <div className="h-3 w-24 bg-blue-50 rounded"></div>
                        <div className="h-3 w-20 bg-blue-50 rounded"></div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-wrap gap-2">
                        <div className="h-6 w-16 bg-blue-100 rounded-full"></div>
                        <div className="h-6 w-20 bg-blue-100 rounded-full"></div>
                        <div className="h-6 w-18 bg-blue-100 rounded-full"></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  // Render Search and Filter Controls (always visible)
  const renderSearchAndFilter = () => (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative flex-1">
          <MagnifyingGlass
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-900/60"
          />
          <Input
            type="text"
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border-blue-900"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          />
        </div>
      </div>
      <div className="relative">
        <button
          onClick={() => setShowFilterDropdown(!showFilterDropdown)}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-2 ${
            selectedSubjectFilter.length > 0 ||
            selectedSectionFilter.length > 0
              ? 'bg-gradient-to-br from-blue-800 to-blue-900 text-white shadow-md'
              : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-900'
          }`}
          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
        >
          <FunnelSimple size={16} weight="bold" />
          Filter
          {(selectedSubjectFilter.length > 0 ||
            selectedSectionFilter.length > 0) && (
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

                {/* Subject Filter */}
                {availableSubjects.length > 0 && (
                  <div>
                    <Label
                      className="text-xs text-gray-700 mb-3 block"
                      style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                    >
                      Subjects
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() =>
                          setSelectedSubjectFilter(
                            selectedSubjectFilter.length ===
                              availableSubjects.length
                              ? []
                              : availableSubjects
                          )
                        }
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                          selectedSubjectFilter.length ===
                          availableSubjects.length
                            ? 'bg-gradient-to-br from-blue-800 to-blue-900 text-white shadow-md'
                            : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-900'
                        }`}
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        {selectedSubjectFilter.length ===
                        availableSubjects.length
                          ? 'Clear All'
                          : 'Select All'}
                      </button>
                      {availableSubjects.map((subjectId) => {
                        const subject = subjects[subjectId]
                        if (!subject) return null
                        const isSelected =
                          selectedSubjectFilter.includes(subjectId)
                        return (
                          <button
                            key={subjectId}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedSubjectFilter((prev) =>
                                  prev.filter((id) => id !== subjectId)
                                )
                              } else {
                                setSelectedSubjectFilter((prev) => [
                                  ...prev,
                                  subjectId,
                                ])
                              }
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                              isSelected
                                ? 'bg-gradient-to-br from-blue-800 to-blue-900 text-white shadow-md'
                                : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-900'
                            }`}
                            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                          >
                            {subject.code}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Section Filter */}
                {availableSections.length > 0 && (
                  <div>
                    <Label
                      className="text-xs text-gray-700 mb-3 block"
                      style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                    >
                      Sections
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() =>
                          setSelectedSectionFilter(
                            selectedSectionFilter.length ===
                              availableSections.length
                              ? []
                              : availableSections
                          )
                        }
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                          selectedSectionFilter.length ===
                          availableSections.length
                            ? 'bg-gradient-to-br from-blue-800 to-blue-900 text-white shadow-md'
                            : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-900'
                        }`}
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        {selectedSectionFilter.length ===
                        availableSections.length
                          ? 'Clear All'
                          : 'Select All'}
                      </button>
                      {availableSections.map((sectionId) => {
                        const section = sections[sectionId] || sectionsMap[sectionId]
                        if (!section) return null
                        const isSelected =
                          selectedSectionFilter.includes(sectionId)
                        return (
                          <button
                            key={sectionId}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedSectionFilter((prev) =>
                                  prev.filter((id) => id !== sectionId)
                                )
                              } else {
                                setSelectedSectionFilter((prev) => [
                                  ...prev,
                                  sectionId,
                                ])
                              }
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                              isSelected
                                ? 'bg-gradient-to-br from-blue-800 to-blue-900 text-white shadow-md'
                                : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-900'
                            }`}
                            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                          >
                            {section.sectionName}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Clear Filters */}
                {(selectedSubjectFilter.length > 0 ||
                  selectedSectionFilter.length > 0 ||
                  searchQuery) && (
                  <button
                    onClick={handleResetFilters}
                    className="w-full px-3 py-2 text-xs text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )

  if (filteredStudents.length === 0) {
    const hasActiveFilters =
      searchQuery ||
      selectedSubjectFilter.length > 0 ||
      selectedSectionFilter.length > 0

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl p-6">
          <h1
            className="text-2xl font-light text-white flex items-center gap-2"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            <div className="w-8 h-8 aspect-square bg-white rounded-xl flex items-center justify-center">
              <Users size={20} weight="fill" className="text-blue-900" />
            </div>
            My Students ({filteredStudents.length})
          </h1>
          <p
            className="text-xs text-blue-100 mt-1"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            View students in your classes
          </p>
          {(selectedSubjectFilter.length > 0 ||
            selectedSectionFilter.length > 0) && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {selectedSubjectFilter.length > 0 && (
                <div className="flex items-center gap-2 px-2 py-1 bg-white rounded-lg border border-blue-700">
                  <FunnelSimple size={12} className="text-blue-900" weight="bold" />
                  <span
                    className="text-xs font-mono text-blue-900"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    {selectedSubjectFilter.length} subject
                    {selectedSubjectFilter.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
              {selectedSectionFilter.length > 0 && (
                <div className="flex items-center gap-2 px-2 py-1 bg-white rounded-lg border border-blue-700">
                  <FunnelSimple size={12} className="text-blue-900" weight="bold" />
                  <span
                    className="text-xs font-mono text-blue-900"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    {selectedSectionFilter.length} section
                    {selectedSectionFilter.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Search and Filter Controls - ALWAYS VISIBLE */}
        {renderSearchAndFilter()}

        <div className="bg-white/95 border border-dashed border-blue-200 rounded-2xl text-center px-8 py-10 shadow-sm">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Users size={32} className="text-white" weight="fill" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            {hasActiveFilters ? 'No Results Found' : 'No Students Assigned'}
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            {hasActiveFilters
              ? 'Try adjusting your search keywords or clearing the filters.'
              : 'Students have not been enrolled in your classes yet.'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="px-5 py-2.5 text-sm font-medium rounded-xl bg-gradient-to-r from-blue-800 to-blue-900 text-white shadow-md shadow-blue-900/30 focus:outline-none focus:ring-2 focus:ring-blue-900/40"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl p-6">
        <h1
          className="text-2xl font-light text-white flex items-center gap-2"
          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
        >
          <div className="w-8 h-8 aspect-square bg-white rounded-xl flex items-center justify-center">
            <Users size={20} weight="fill" className="text-blue-900" />
          </div>
          My Students ({filteredStudents.length})
        </h1>
        <p
          className="text-xs text-blue-100 mt-1"
          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
        >
          View students in your classes
        </p>
        {(selectedSubjectFilter.length > 0 ||
          selectedSectionFilter.length > 0) && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {selectedSubjectFilter.length > 0 && (
              <div className="flex items-center gap-2 px-2 py-1 bg-white rounded-lg border border-blue-700">
                <FunnelSimple size={12} className="text-blue-900" weight="bold" />
                <span
                  className="text-xs font-mono text-blue-900"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  {selectedSubjectFilter.length} subject
                  {selectedSubjectFilter.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
            {selectedSectionFilter.length > 0 && (
              <div className="flex items-center gap-2 px-2 py-1 bg-white rounded-lg border border-blue-700">
                <FunnelSimple size={12} className="text-blue-900" weight="bold" />
                <span
                  className="text-xs font-mono text-blue-900"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  {selectedSectionFilter.length} section
                  {selectedSectionFilter.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Search and Filter Controls - ALWAYS VISIBLE */}
      {renderSearchAndFilter()}

      {/* Students Table */}
      <Card className="overflow-hidden pt-0 mt-0 mb-0 pb-0 border border-gray-200 shadow-lg rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg border-b border-blue-900">
              <tr>
                <th className="px-6 py-3 text-left border-r border-white/20">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                      <User size={12} weight="bold" className="text-white" />
                    </span>
                    <span
                      className="text-[11px] uppercase tracking-wide text-white/80 font-medium"
                      style={{ fontFamily: 'monospace', fontWeight: 500 }}
                    >
                      Student
                    </span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left border-r border-white/20">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                      <GraduationCap
                        size={12}
                        weight="bold"
                        className="text-white"
                      />
                    </span>
                    <span
                      className="text-[11px] uppercase tracking-wide text-white/80 font-medium"
                      style={{ fontFamily: 'monospace', fontWeight: 500 }}
                    >
                      Level
                    </span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                      <IdentificationCard
                        size={12}
                        weight="bold"
                        className="text-white"
                      />
                    </span>
                    <span
                      className="text-[11px] uppercase tracking-wide text-white/80 font-medium"
                      style={{ fontFamily: 'monospace', fontWeight: 500 }}
                    >
                      Subjects
                    </span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 rounded-b-xl">
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-8 text-center text-gray-500 border-t border-gray-200"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    No students found.
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((enrollment) => {
                  const profile = studentProfiles[enrollment.userId]
                  const sectionId = enrollment.enrollmentInfo?.sectionId || ''
                  const section = sections[sectionId] || sectionsMap[sectionId]

                  // Get subjects taught by this teacher
                  const isCollege = enrollment.enrollmentInfo?.level === 'college'
                  const studentSubjects = isCollege
                    ? assignments
                        .filter((a) => a.sectionId === sectionId)
                        .map((a) => subjects[a.subjectId])
                        .filter(Boolean)
                    : assignments
                        .filter((a) => a.sectionId === sectionId)
                        .map((a) => subjects[a.subjectId])
                        .filter(Boolean)

                  return (
                    <tr
                      key={enrollment.userId}
                      className="hover:bg-blue-50/50 transition-colors"
                    >
                      <td className="px-6 py-5 border-r border-gray-200">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 relative">
                            {profile?.photoURL ? (
                              <img
                                src={profile.photoURL}
                                alt={`${
                                  enrollment.personalInfo.firstName ||
                                  'Student'
                                } profile`}
                                className="h-12 w-12 rounded-full object-cover border-2 border-blue-900/40"
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center text-white text-sm font-medium border-2 border-blue-900/40">
                                {getInitials(
                                  enrollment.personalInfo.firstName,
                                  enrollment.personalInfo.lastName
                                )}
                              </div>
                            )}
                          </div>
                          <div className="space-y-1">
                            <p
                              className="text-sm font-medium text-gray-900"
                              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                            >
                              {formatFullName(enrollment)}
                            </p>
                            <p
                              className="text-xs text-gray-500 font-mono"
                              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                            >
                              ID:{' '}
                              {studentProfiles[enrollment.userId]?.studentId ||
                                'Pending'}
                            </p>
                            <p
                              className="text-xs text-gray-500"
                              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                            >
                              {enrollment.personalInfo.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5 border-r border-gray-200">
                        <div className="space-y-1 text-sm text-gray-900">
                          {enrollment.enrollmentInfo?.level === 'college' ? (
                            <>
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-900 rounded-full text-xs">
                                  {enrollment.enrollmentInfo?.courseCode || 'N/A'}{' '}
                                  {enrollment.enrollmentInfo?.yearLevel || ''}
                                </span>
                                {enrollment.enrollmentInfo?.semester && (
                                  <span className="text-xs text-gray-500">
                                    {enrollment.enrollmentInfo.semester === 'first-sem'
                                      ? '1st Sem'
                                      : '2nd Sem'}
                                  </span>
                                )}
                              </div>
                              {section && (
                                <p
                                  className="text-xs text-gray-500"
                                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                                >
                                  Section {section.sectionName}
                                </p>
                              )}
                              <p
                                className="text-xs text-gray-500"
                                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                              >
                                {enrollment.enrollmentInfo?.schoolYear || 'N/A'}
                              </p>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{
                                    backgroundColor: getGradeColor(section),
                                  }}
                                ></span>
                                <span style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                                  {enrollment.enrollmentInfo?.gradeLevel || 'N/A'}{' '}
                                  {section ? section.sectionName : 'Unassigned'}
                                </span>
                              </div>
                              <p
                                className="text-xs text-gray-500 font-mono"
                                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                              >
                                Section {section?.rank || '—'}
                              </p>
                              <p
                                className="text-xs text-gray-500"
                                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                              >
                                {enrollment.enrollmentInfo?.schoolYear || 'N/A'}
                              </p>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex flex-wrap gap-2">
                          {studentSubjects.length > 0 ? (
                            <>
                              {studentSubjects.slice(0, 2).map((subject) => (
                                <div
                                  key={subject.id}
                                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-100 bg-blue-50/70 text-xs text-blue-900"
                                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                                >
                                  <span
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{
                                      backgroundColor: getSubjectColor(
                                        subject.color
                                      ),
                                    }}
                                  ></span>
                                  {subject.code}
                                </div>
                              ))}
                              {studentSubjects.length > 2 && (
                                <div
                                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-100 bg-blue-50/70 text-xs text-blue-900 font-medium"
                                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                                >
                                  +{studentSubjects.length - 2} more
                                </div>
                              )}
                            </>
                          ) : (
                            <span
                              className="text-xs text-gray-400"
                              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                            >
                              No subjects
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      {filteredStudents.length > 0 && (
        <div className="flex items-center mt-3 shadow-lg justify-between px-4 py-3 bg-white border border-gray-200 rounded-xl">
          <div className="flex items-center gap-4">
            <div
              className="text-xs text-gray-600 flex items-center gap-2"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              <div className="w-3 h-3 aspect-square rounded-md bg-gradient-to-br from-blue-800 to-blue-900"></div>
              Showing {startIndex + 1} to{' '}
              {Math.min(endIndex, filteredStudents.length)} of{' '}
              {filteredStudents.length} students
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                currentPage === 1
                  ? 'bg-white text-gray-400 cursor-not-allowed border border-gray-200'
                  : 'bg-gradient-to-br from-blue-800 to-blue-900 text-white hover:from-blue-900 hover:to-blue-950'
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
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      currentPage === pageNum
                        ? 'bg-gradient-to-br from-blue-800 to-blue-900 text-white'
                        : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-900'
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
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                currentPage === totalPages
                  ? 'bg-white text-gray-400 cursor-not-allowed border border-gray-200'
                  : 'bg-gradient-to-br from-blue-800 to-blue-900 text-white hover:from-blue-900 hover:to-blue-950'
              }`}
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Next
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
