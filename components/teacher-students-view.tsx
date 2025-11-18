'use client'

import React, { useState, useEffect } from 'react'
import {
  GraduationCap,
  Users,
  User,
  MagnifyingGlass,
  Funnel,
  Phone,
  MapPin,
  IdentificationCard,
} from '@phosphor-icons/react'
import { toast } from 'react-toastify'
import { GradeData } from '@/lib/types/grade-section'

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
    gradeLevel: string
    schoolYear: string
    enrollmentDate: string
    status: string
    orNumber?: string
    scholarship?: string
    studentId?: string
    sectionId?: string
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
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string[]>(
    []
  )
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string[]>(
    []
  )
  const [lastLoaded, setLastLoaded] = useState<number | null>(null)
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes in milliseconds

  useEffect(() => {
    loadTeacherStudents()
  }, [teacherId])

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

        // Load enrollment data and profiles in parallel for better performance
        const enrollmentsMap: Record<string, EnrollmentData> = {}
        const profilesMap: Record<string, StudentProfile> = {}

        if (uniqueStudentIds.length > 0) {
          // Make batch requests for enrollments and profiles for better performance
          const [enrollmentResponse, profileResponse] = await Promise.all([
            fetch(
              `/api/enrollment?userIds=${uniqueStudentIds.join(',')}`
            ).catch(() => null),
            fetch(`/api/user/profile?uids=${uniqueStudentIds.join(',')}`).catch(
              () => null
            ),
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
          if (!enrollmentBatchSuccess) {
            console.warn(
              'Batch enrollment request failed, falling back to individual requests'
            )
            const enrollmentPromises = uniqueStudentIds.map((userId) =>
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
            const profilePromises = uniqueStudentIds.map((userId) =>
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
    // Subject filter - only show students who have ANY of the selected subjects with the teacher
    if (selectedSubjectFilter.length > 0) {
      const studentSection = enrollment.enrollmentInfo?.sectionId
      if (!studentSection) return false

      const hasAnySelectedSubject = selectedSubjectFilter.some((subjectId) =>
        assignments.some(
          (a) => a.subjectId === subjectId && a.sectionId === studentSection
        )
      )
      if (!hasAnySelectedSubject) return false
    }

    // Section filter - only show students in ANY of the selected sections
    if (
      selectedSectionFilter.length > 0 &&
      !selectedSectionFilter.includes(
        enrollment.enrollmentInfo?.sectionId || ''
      )
    ) {
      return false
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

  // Group students by section for better organization
  const studentsBySection = filteredStudents.reduce((acc, enrollment) => {
    const sectionId = enrollment.enrollmentInfo?.sectionId || 'unassigned'
    if (!acc[sectionId]) {
      acc[sectionId] = []
    }
    acc[sectionId].push(enrollment)
    return acc
  }, {} as Record<string, EnrollmentData[]>)

  // Helper function to get section name
  const getSectionName = (sectionId: string) => {
    if (sectionId === 'unassigned') return 'Unassigned'
    const section = sections[sectionId]
    return section ? `${section.sectionName} - ${section.rank}` : sectionId
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center shadow-lg">
            <Users size={22} className="text-white" weight="fill" />
          </div>
          <div>
            <h1 className="text-2xl font-medium text-gray-900">My Students</h1>
            <p className="text-sm text-gray-600">
              View students in your classes
            </p>
          </div>
        </div>

        <div className="bg-white/90 border border-blue-100 rounded-2xl shadow-sm p-6">
          <div className="space-y-4 animate-pulse">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-blue-100 rounded w-40"></div>
                    <div className="h-2 bg-blue-100 rounded w-28"></div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-3 bg-blue-50 rounded"></div>
                  <div className="w-20 h-3 bg-blue-50 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (filteredStudents.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center shadow-lg">
            <Users size={22} className="text-white" weight="fill" />
          </div>
          <div>
            <h1 className="text-2xl font-medium text-gray-900">My Students</h1>
            <p className="text-sm text-gray-600">
              View students in your classes
            </p>
          </div>
        </div>

        <div className="bg-white/90 border border-blue-100 rounded-xl shadow-sm p-4 space-y-3">
          <div className="relative">
            <MagnifyingGlass
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-900/60"
            />
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-blue-100 bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-900/30 text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Subjects', list: availableSubjects, type: 'subject' },
              { label: 'Sections', list: availableSections, type: 'section' },
            ].map((group) => (
              <div
                key={group.label}
                className="flex items-center gap-2 flex-wrap bg-white/80 border border-blue-50 rounded-xl px-3 py-2"
              >
                <span className="text-xs uppercase tracking-wide text-blue-900/70">
                  {group.label}:
                </span>
                <button
                  onClick={() => {
                    if (group.type === 'subject') {
                      setSelectedSubjectFilter(
                        selectedSubjectFilter.length ===
                          availableSubjects.length
                          ? []
                          : availableSubjects
                      )
                    } else {
                      setSelectedSectionFilter(
                        selectedSectionFilter.length ===
                          availableSections.length
                          ? []
                          : availableSections
                      )
                    }
                  }}
                  className="px-3 py-1.5 text-xs font-medium rounded-full border border-blue-100 bg-white text-blue-900"
                >
                  {group.type === 'subject'
                    ? selectedSubjectFilter.length === availableSubjects.length
                      ? 'Clear'
                      : 'All'
                    : selectedSectionFilter.length === availableSections.length
                    ? 'Clear'
                    : 'All'}
                </button>
                {group.list.map((item) => {
                  const isSubject = group.type === 'subject'
                  const isSelected = isSubject
                    ? selectedSubjectFilter.includes(item)
                    : selectedSectionFilter.includes(item)
                  return (
                    <button
                      key={item}
                      onClick={() => {
                        if (isSubject) {
                          setSelectedSubjectFilter((prev) =>
                            isSelected
                              ? prev.filter((id) => id !== item)
                              : [...prev, item]
                          )
                        } else {
                          setSelectedSectionFilter((prev) =>
                            isSelected
                              ? prev.filter((id) => id !== item)
                              : [...prev, item]
                          )
                        }
                      }}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                        isSelected
                          ? 'bg-gradient-to-r from-blue-800 to-blue-900 text-white border-blue-900 shadow shadow-blue-900/30'
                          : 'bg-white text-blue-900 border-blue-100 hover:border-blue-300'
                      }`}
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      {group.type === 'subject'
                        ? subjects[item]?.code || 'Subject'
                        : (sections[item] || sectionsMap[item])?.sectionName ||
                          'Section'}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/95 border border-dashed border-blue-200 rounded-2xl text-center px-8 py-10 shadow-sm">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Users size={32} className="text-white" weight="fill" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            {Object.keys(enrollments).length === 0
              ? 'No Students Assigned'
              : 'No Results Found'}
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            {Object.keys(enrollments).length === 0
              ? 'Students have not been enrolled in your classes yet.'
              : 'Try adjusting your search keywords or clearing the filters.'}
          </p>
          {Object.keys(enrollments).length > 0 && (
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedSubjectFilter([])
                setSelectedSectionFilter([])
              }}
              className="px-5 py-2.5 text-sm font-medium rounded-xl bg-gradient-to-r from-blue-800 to-blue-900 text-white shadow-md shadow-blue-900/30 focus:outline-none focus:ring-2 focus:ring-blue-900/40"
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
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center shadow-lg">
          <Users size={22} className="text-white" weight="fill" />
        </div>
        <div>
          <h1 className="text-2xl font-medium text-gray-900">
            My Students ({filteredStudents.length})
          </h1>
          <p className="text-sm text-gray-600">View students in your classes</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          <div className="relative">
            <MagnifyingGlass
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-900/60"
            />
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-blue-100 bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-900/30 text-sm"
            />
          </div>
          <div className="bg-white/80 border border-blue-100 rounded-xl px-4 py-3 shadow-sm flex flex-wrap gap-2">
            <span className="text-xs uppercase tracking-wide text-blue-900/70">
              Subjects:
            </span>
            <button
              onClick={() =>
                setSelectedSubjectFilter(
                  selectedSubjectFilter.length === availableSubjects.length
                    ? []
                    : availableSubjects
                )
              }
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                selectedSubjectFilter.length === availableSubjects.length
                  ? 'bg-gradient-to-r from-blue-800 to-blue-900 text-white border-blue-900'
                  : 'bg-white text-blue-900 border-blue-100'
              }`}
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              {selectedSubjectFilter.length === availableSubjects.length
                ? 'Clear'
                : 'All'}
            </button>
            {availableSubjects.map((subjectId) => {
              const subject = subjects[subjectId]
              if (!subject) return null
              const isSelected = selectedSubjectFilter.includes(subjectId)
              return (
                <button
                  key={subjectId}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedSubjectFilter((prev) =>
                        prev.filter((id) => id !== subjectId)
                      )
                    } else {
                      setSelectedSubjectFilter((prev) => [...prev, subjectId])
                    }
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-blue-800 to-blue-900 text-white border-blue-900 shadow shadow-blue-900/30'
                      : 'bg-white text-blue-900 border-blue-100'
                  }`}
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  {subject.code}
                </button>
              )
            })}
          </div>
        </div>
        <div className="bg-white/80 border border-blue-100 rounded-xl px-4 py-3 shadow-sm flex flex-wrap gap-2">
          <span className="text-xs uppercase tracking-wide text-blue-900/70">
            Sections:
          </span>
          <button
            onClick={() =>
              setSelectedSectionFilter(
                selectedSectionFilter.length === availableSections.length
                  ? []
                  : availableSections
              )
            }
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
              selectedSectionFilter.length === availableSections.length
                ? 'bg-gradient-to-r from-blue-800 to-blue-900 text-white border-blue-900'
                : 'bg-white text-blue-900 border-blue-100'
            }`}
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            {selectedSectionFilter.length === availableSections.length
              ? 'Clear'
              : 'All'}
          </button>
          {availableSections.map((sectionId) => {
            const section = sections[sectionId] || sectionsMap[sectionId]
            if (!section) return null
            const isSelected = selectedSectionFilter.includes(sectionId)
            return (
              <button
                key={sectionId}
                onClick={() => {
                  if (isSelected) {
                    setSelectedSectionFilter((prev) =>
                      prev.filter((id) => id !== sectionId)
                    )
                  } else {
                    setSelectedSectionFilter((prev) => [...prev, sectionId])
                  }
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                  isSelected
                    ? 'bg-gradient-to-r from-blue-800 to-blue-900 text-white border-blue-900 shadow shadow-blue-900/30'
                    : 'bg-white text-blue-900 border-blue-100'
                }`}
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                {section.sectionName}
              </button>
            )
          })}
        </div>
      </div>

      {(searchQuery ||
        selectedSubjectFilter.length > 0 ||
        selectedSectionFilter.length > 0) && (
        <div className="flex items-center flex-wrap gap-2 text-xs text-blue-900/80 bg-white/80 border border-blue-100 rounded-xl px-4 py-2 shadow-sm">
          <span>
            Showing {filteredStudents.length} of{' '}
            {Object.keys(enrollments).length} students
          </span>
          {searchQuery && (
            <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-900 border border-blue-100">
              Search: "{searchQuery}"
            </span>
          )}
          {selectedSubjectFilter.length > 0 && (
            <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-900 border border-blue-100">
              Subjects:{' '}
              {selectedSubjectFilter
                .map((id) => subjects[id]?.code)
                .filter(Boolean)
                .join(', ')}
            </span>
          )}
          {selectedSectionFilter.length > 0 && (
            <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-900 border border-blue-100">
              Sections:{' '}
              {selectedSectionFilter
                .map((id) => {
                  const section = sections[id] || sectionsMap[id]
                  return section?.sectionName
                })
                .filter(Boolean)
                .join(', ')}
            </span>
          )}
        </div>
      )}

      {/* Students Table */}
      <div className="bg-white/95 border border-blue-100 rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-800 to-blue-900 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <User size={18} weight="fill" />
            </div>
            <div>
              <p className="text-sm uppercase tracking-wide text-white/70">
                Student Directory
              </p>
              <p className="text-lg font-medium">
                {Object.keys(enrollments).length} Enrolled
              </p>
            </div>
          </div>
          <span className="text-sm text-white/80">
            {assignments.length} subject assignments
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-blue-50/80 text-blue-900 text-[11px] uppercase tracking-wide">
                <th className="px-6 py-3 text-left font-medium">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center">
                      <User size={14} weight="bold" />
                    </span>
                    Student Information
                  </div>
                </th>
                <th className="px-6 py-3 text-left font-medium">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center">
                      <GraduationCap size={14} weight="bold" />
                    </span>
                    Section Details
                  </div>
                </th>
                <th className="px-6 py-3 text-left font-medium">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center">
                      <IdentificationCard size={14} weight="bold" />
                    </span>
                    Subjects with You
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-50 bg-white">
              {Object.entries(studentsBySection).map(
                ([sectionId, sectionStudents]) =>
                  sectionStudents.map((enrollment) => {
                    const profile = studentProfiles[enrollment.userId]
                    const section =
                      sections[sectionId] || sectionsMap[sectionId]

                    const studentSubjects = assignments
                      .filter((a) => a.sectionId === sectionId)
                      .map((a) => subjects[a.subjectId])
                      .filter(Boolean)

                    return (
                      <tr
                        key={enrollment.userId}
                        className="hover:bg-blue-50/50 transition-colors"
                      >
                        <td className="px-6 py-5">
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
                              <p className="text-sm font-medium text-gray-900">
                                {formatFullName(enrollment)}
                              </p>
                              <p className="text-xs text-gray-500 font-mono">
                                ID:{' '}
                                {studentProfiles[enrollment.userId]
                                  ?.studentId || 'Pending'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {enrollment.personalInfo.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <div className="space-y-1 text-sm text-gray-900">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{
                                  backgroundColor: getGradeColor(section),
                                }}
                              ></span>
                              {enrollment.enrollmentInfo?.gradeLevel || 'N/A'}{' '}
                              {section ? section.sectionName : 'Unassigned'}
                            </div>
                            <p className="text-xs text-gray-500 font-mono">
                              Section {section?.rank || '—'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {enrollment.enrollmentInfo?.schoolYear || 'N/A'}
                            </p>
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex flex-wrap gap-2">
                            {studentSubjects.map((subject) => (
                              <div
                                key={subject.id}
                                className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-100 bg-blue-50/70 text-xs text-blue-900"
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
                          </div>
                        </td>
                      </tr>
                    )
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
