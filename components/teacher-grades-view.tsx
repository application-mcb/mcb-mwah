'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import {
  GraduationCap,
  BookOpen,
  Users,
  MagnifyingGlass,
  FunnelSimple,
  Pencil,
  Check,
  X,
  Calculator,
  Printer,
} from '@phosphor-icons/react'
import { toast } from 'react-toastify'
import { GradeData } from '@/lib/types/grade-section'

interface TeacherGradesViewProps {
  teacherId: string
}

interface SubjectGrade {
  subjectName: string
  period1: number | null
  period2: number | null
  period3: number | null
  period4: number | null
  specialStatus?: 'INC' | 'FA' | 'FW' | 'W' | null
}

interface StudentGrades {
  [subjectId: string]: SubjectGrade
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

interface StudentProfile {
  userId: string
  photoURL?: string
  email?: string
  studentId?: string
}

interface StudentWithGrades {
  enrollment: EnrollmentData
  grades: StudentGrades
  section: Section | null
}

export default function TeacherGradesView({
  teacherId,
}: TeacherGradesViewProps) {
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
  const [studentGrades, setStudentGrades] = useState<
    Record<string, StudentGrades>
  >({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string[]>(
    []
  )
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string[]>(
    []
  )
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [editingStudent, setEditingStudent] = useState<string | null>(null)
  const [editedGrades, setEditedGrades] = useState<StudentGrades>({})
  const [lastLoaded, setLastLoaded] = useState<number | null>(null)
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes in milliseconds

  useEffect(() => {
    loadTeacherGrades()
  }, [teacherId])

  const loadTeacherGrades = async () => {
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

        // Get unique section IDs
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

            console.log('Sections loaded:', {
              totalSections: sectionsData.sections.length,
              relevantSections: relevantSections.length,
              sectionIds: sectionIds,
              relevantSectionDetails: relevantSections.map((s: any) => ({
                id: s.id,
                name: s.sectionName,
                studentsCount: s.students?.length || 0,
              })),
            })

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

              console.log('All enrollments response:', {
                success: allEnrollmentsData.success,
                totalEnrollments: allEnrollmentsData.enrollments?.length || 0,
                currentSemester: currentSemester,
                configData: configData,
              })

              if (
                allEnrollmentsData.success &&
                allEnrollmentsData.enrollments
              ) {
                // Debug: Check college enrollments before filtering
                const allCollegeEnrollments =
                  allEnrollmentsData.enrollments.filter(
                    (e: EnrollmentData) => e.enrollmentInfo?.level === 'college'
                  )

                console.log('All college enrollments (before filtering):', {
                  count: allCollegeEnrollments.length,
                  enrollments: allCollegeEnrollments.map(
                    (e: EnrollmentData) => ({
                      userId: e.userId,
                      name: `${e.personalInfo.firstName} ${e.personalInfo.lastName}`,
                      sectionId: e.enrollmentInfo?.sectionId,
                      semester: e.enrollmentInfo?.semester,
                      courseCode: e.enrollmentInfo?.courseCode,
                      selectedSubjects: e.selectedSubjects,
                    })
                  ),
                })

                // Get teacher's assigned subject IDs
                const teacherSubjectIds = new Set(
                  transformedAssignments.map(
                    (a: TeacherAssignment) => a.subjectId
                  )
                )

                // Filter for college students in current semester who have teacher's subjects
                // AND the teacher is assigned to their section for those subjects
                const collegeEnrollments =
                  allEnrollmentsData.enrollments.filter(
                    (enrollment: EnrollmentData) => {
                      const isCollege =
                        enrollment.enrollmentInfo?.level === 'college'
                      const matchesSemester =
                        !currentSemester ||
                        enrollment.enrollmentInfo?.semester === currentSemester

                      if (!isCollege) {
                        return false
                      }

                      // For college: allow both semesters OR match current semester
                      // This is more flexible - teachers might want to see students from both semesters
                      // But if semester is specified, prefer matching it
                      const semesterMatches =
                        !currentSemester ||
                        !enrollment.enrollmentInfo?.semester ||
                        enrollment.enrollmentInfo.semester === currentSemester

                      if (!semesterMatches) {
                        // Still allow if student is in a section assigned to teacher
                        // (they might be viewing grades from previous semester)
                        const studentSectionId =
                          enrollment.enrollmentInfo?.sectionId
                        if (
                          studentSectionId &&
                          transformedAssignments.some(
                            (a) => a.sectionId === studentSectionId
                          )
                        ) {
                          // Allow through - section match overrides semester mismatch
                        } else {
                          return false
                        }
                      }

                      // Get student's section
                      const studentSectionId =
                        enrollment.enrollmentInfo?.sectionId

                      // For college students: if they're in a section where the teacher is assigned,
                      // show them regardless of selectedSubjects (subjects might come from subject-assignments)
                      // OR if they have the teacher's subjects in their selectedSubjects
                      const studentSubjects = enrollment.selectedSubjects || []

                      // Check if teacher is assigned to student's section for ANY subject
                      const hasMatchingSectionAssignment = studentSectionId
                        ? transformedAssignments.some(
                            (assignment: TeacherAssignment) =>
                              assignment.sectionId === studentSectionId
                          )
                        : false

                      // Also check if student has any of the teacher's subjects directly
                      const hasMatchingSubject = studentSubjects.some(
                        (subjectId: string) => teacherSubjectIds.has(subjectId)
                      )

                      // Match if: (student is in teacher's assigned section) OR (student has teacher's subjects)
                      const matches =
                        hasMatchingSectionAssignment || hasMatchingSubject

                      if (matches && studentSectionId) {
                        console.log('✅ College student MATCHED:', {
                          userId: enrollment.userId,
                          name: `${enrollment.personalInfo.firstName} ${enrollment.personalInfo.lastName}`,
                          studentSectionId: studentSectionId,
                          hasMatchingSectionAssignment,
                          hasMatchingSubject,
                          studentSubjects: studentSubjects,
                          matchingAssignments: transformedAssignments.filter(
                            (a) => a.sectionId === studentSectionId
                          ),
                        })
                      }

                      return matches
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
        } catch (error) {}

        // Combine student IDs from sections and college enrollments
        const allStudentIdsCombined = [
          ...uniqueStudentIds,
          ...collegeStudentIds,
        ]

        // Load enrollment data and profiles for all students
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
            } catch (error) {}
          }

          // Fallback to individual requests if batch failed
          if (!enrollmentBatchSuccess && studentIdsToLoad.length > 0) {
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

        // Load grades for all enrolled students (parallel requests)
        const studentIds = Object.keys(enrollmentsMap)
        const gradesMap: Record<string, StudentGrades> = {}

        if (studentIds.length > 0) {
          // API will get current academic year from system config

          // Make parallel requests for all student grades
          const gradePromises = studentIds.map((userId) =>
            fetch(`/api/students/${userId}/grades`)
              .then(async (res) => {
                try {
                  if (res.ok) {
                    const data = await res.json()
                    gradesMap[userId] = data.grades || {}
                  } else {
                    gradesMap[userId] = {}
                  }
                } catch (error) {
                  console.error(
                    `Error parsing grades for user ${userId}:`,
                    error
                  )
                  gradesMap[userId] = {}
                }
              })
              .catch((error) => {
                console.error(
                  `Error fetching grades for user ${userId}:`,
                  error
                )
                gradesMap[userId] = {}
              })
          )

          // Wait for all grade requests to complete
          await Promise.all(gradePromises)
        }

        setStudentGrades(gradesMap)
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

      // Load subjects (outside the assignments check since subjects are needed regardless)
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

      // Update cache timestamp
      setLastLoaded(Date.now())
    } catch (error) {
      console.error('Error loading teacher grades:', error)
      toast.error('Failed to load student grades')
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

  const calculateAverage = (
    grades: SubjectGrade,
    isCollege: boolean = false,
    isSHS: boolean = false
  ): number | null => {
    // If there's a special status, don't calculate average
    if (grades.specialStatus) return null

    let validGrades: number[]

    if (isCollege) {
      // College: only use period1 (Prelim), period2 (Midterm), period3 (Finals)
      validGrades = [grades.period1, grades.period2, grades.period3].filter(
        (grade) => grade !== null && grade !== undefined
      ) as number[]
    } else if (isSHS) {
      // SHS: use only period1 and period2 (Q1/Q2 for first sem, Q3/Q4 for second sem)
      validGrades = [grades.period1, grades.period2].filter(
        (grade) => grade !== null && grade !== undefined
      ) as number[]
    } else {
      // JHS: use all 4 periods
      validGrades = [
        grades.period1,
        grades.period2,
        grades.period3,
        grades.period4,
      ].filter((grade) => grade !== null && grade !== undefined) as number[]
    }

    if (validGrades.length === 0) return null

    const sum = validGrades.reduce((acc, grade) => acc + grade, 0)
    return Math.round((sum / validGrades.length) * 100) / 100
  }

  const convertToNumericMode = (percentage: number | null): number | null => {
    if (percentage === null || percentage === undefined || percentage === 0)
      return null

    if (percentage >= 98) return 1.0
    if (percentage >= 95) return 1.25
    if (percentage >= 92) return 1.5
    if (percentage >= 89) return 1.75
    if (percentage >= 86) return 2.0
    if (percentage >= 83) return 2.25
    if (percentage >= 80) return 2.5
    if (percentage >= 77) return 2.75
    if (percentage >= 75) return 3.0
    return 5.0 // 74 and below
  }

  const getDescriptiveMode = (percentage: number | null): string => {
    if (percentage === null || percentage === undefined || percentage === 0)
      return 'Incomplete'

    if (percentage >= 98) return 'Excellent'
    if (percentage >= 92) return 'Superior'
    if (percentage >= 86) return 'Very Good'
    if (percentage >= 83) return 'Good'
    if (percentage >= 80) return 'Fair'
    if (percentage >= 75) return 'Passed'
    return 'Failed'
  }

  const getGradeStatus = (
    average: number
  ): { status: string; color: string } => {
    if (average === 0) return { status: 'No Grades', color: 'text-gray-500' }
    if (average >= 98) return { status: 'Excellent', color: 'text-green-600' }
    if (average >= 92) return { status: 'Superior', color: 'text-green-500' }
    if (average >= 86) return { status: 'Very Good', color: 'text-blue-600' }
    if (average >= 83) return { status: 'Good', color: 'text-yellow-600' }
    if (average >= 80) return { status: 'Fair', color: 'text-yellow-500' }
    if (average >= 75) return { status: 'Passed', color: 'text-orange-600' }
    return { status: 'Failed', color: 'text-red-600' }
  }

  const handleEditGrades = (
    studentId: string,
    currentGrades: StudentGrades
  ) => {
    setEditingStudent(studentId)
    setEditedGrades(JSON.parse(JSON.stringify(currentGrades))) // Deep copy
  }

  const handleSaveGrades = async (studentId: string) => {
    try {
      setSaving((prev) => ({ ...prev, [studentId]: true }))

      // API will get current academic year from system config

      const response = await fetch(`/api/students/${studentId}/grades`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grades: editedGrades,
        }),
      })

      if (response.ok) {
        // Update local state
        setStudentGrades((prev) => ({
          ...prev,
          [studentId]: editedGrades,
        }))

        setEditingStudent(null)
        setEditedGrades({})
        toast.success('Grades updated successfully')
      } else {
        try {
          const data = await response.json()
          toast.error(data.error || 'Failed to save grades')
        } catch (error) {
          console.error('Error parsing error response:', error)
          toast.error('Failed to save grades - server error')
        }
      }
    } catch (error) {
      console.error('Error saving grades:', error)
      toast.error('Failed to save grades')
    } finally {
      setSaving((prev) => ({ ...prev, [studentId]: false }))
    }
  }

  const handleCancelEdit = () => {
    setEditingStudent(null)
    setEditedGrades({})
  }

  const handleGradeChange = (
    subjectId: string,
    period: keyof SubjectGrade,
    value: string
  ) => {
    const numValue = value === '' ? null : parseFloat(value)

    setEditedGrades((prev) => ({
      ...prev,
      [subjectId]: {
        ...prev[subjectId],
        [period]: numValue,
      },
    }))
  }

  const handleSpecialStatusChange = (
    subjectId: string,
    status: 'INC' | 'FA' | 'FW' | 'W' | null
  ) => {
    setEditedGrades((prev) => ({
      ...prev,
      [subjectId]: {
        ...prev[subjectId],
        specialStatus:
          status === prev[subjectId]?.specialStatus ? null : status,
      },
    }))
  }

  // Get students with their grades, filtered by teacher's subjects
  const allEnrollmentsArray = Object.values(enrollments)
  console.log('📋 All enrollments before filtering:', {
    total: allEnrollmentsArray.length,
    collegeCount: allEnrollmentsArray.filter(
      (e) => e.enrollmentInfo?.level === 'college'
    ).length,
    collegeStudents: allEnrollmentsArray
      .filter((e) => e.enrollmentInfo?.level === 'college')
      .map((e) => ({
        userId: e.userId,
        name: `${e.personalInfo.firstName} ${e.personalInfo.lastName}`,
        sectionId: e.enrollmentInfo?.sectionId,
      })),
  })

  const studentsWithGrades: StudentWithGrades[] = allEnrollmentsArray
    .map((enrollment) => ({
      enrollment,
      grades: studentGrades[enrollment.userId] || {},
      section:
        sections[enrollment.enrollmentInfo?.sectionId || ''] ||
        sectionsMap[enrollment.enrollmentInfo?.sectionId || ''] ||
        null,
    }))
    .filter(({ enrollment }) => {
      // Only show students who have subjects taught by this teacher
      const studentSection = enrollment.enrollmentInfo?.sectionId
      const isCollege = enrollment.enrollmentInfo?.level === 'college'

      // For college students: check if teacher is assigned to their section
      // OR if they have any of the teacher's subjects
      if (isCollege) {
        const studentSubjects = enrollment.selectedSubjects || []
        const studentSectionId = enrollment.enrollmentInfo?.sectionId

        // Check if teacher is assigned to student's section for ANY subject
        const hasMatchingSection = studentSectionId
          ? assignments.some((a) => a.sectionId === studentSectionId)
          : false

        // Also check if student has any of the teacher's subjects directly
        const teacherSubjectIds = new Set(assignments.map((a) => a.subjectId))
        const hasMatchingSubject = studentSubjects.some((subjectId: string) =>
          teacherSubjectIds.has(subjectId)
        )

        // Match if: (student is in teacher's assigned section) OR (student has teacher's subjects)
        const matches = hasMatchingSection || hasMatchingSubject
        if (matches && isCollege) {
          console.log('✅ Final filter: College student passed:', {
            userId: enrollment.userId,
            name: `${enrollment.personalInfo.firstName} ${enrollment.personalInfo.lastName}`,
            hasMatchingSection,
            hasMatchingSubject,
          })
        }
        return matches
      }

      // For high school students: must have a section that matches teacher's assignments
      if (!studentSection) return false
      return assignments.some((a) => a.sectionId === studentSection)
    })

  console.log('🎓 Final studentsWithGrades count:', studentsWithGrades.length, {
    collegeStudents: studentsWithGrades.filter(
      (s) => s.enrollment.enrollmentInfo?.level === 'college'
    ).length,
  })

  // Filter students based on search and filters
  const filteredStudents = studentsWithGrades.filter(({ enrollment }) => {
    // Subject filter - only show students who have ANY of the selected subjects with the teacher
    if (selectedSubjectFilter.length > 0) {
      const isCollege = enrollment.enrollmentInfo?.level === 'college'
      const studentSection = enrollment.enrollmentInfo?.sectionId

      if (isCollege) {
        // For college: check if student has the selected subjects
        const studentSubjects = enrollment.selectedSubjects || []
        const hasAnySelectedSubject = selectedSubjectFilter.some(
          (subjectId) =>
            studentSubjects.includes(subjectId) &&
            assignments.some((a) => a.subjectId === subjectId)
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
      const isCollege = enrollment.enrollmentInfo?.level === 'college'
      const studentSection = enrollment.enrollmentInfo?.sectionId || ''

      if (isCollege) {
        // For college: if they have a section, it must match; if no section, skip filter
        if (studentSection && !selectedSectionFilter.includes(studentSection)) {
          return false
        }
      } else {
        // For high school: must have a matching section
        if (!selectedSectionFilter.includes(studentSection)) {
          return false
        }
      }
    }

    // Search filter
    const query = searchQuery.toLowerCase()
    if (query) {
      const fullName = formatFullName(enrollment).toLowerCase()
      const studentId =
        enrollment.enrollmentInfo?.studentId?.toLowerCase() || ''

      return fullName.includes(query) || studentId.includes(query)
    }

    return true
  })

  // Get unique subjects and sections for filtering
  const availableSubjects = [...new Set(assignments.map((a) => a.subjectId))]
  const availableSections = [...new Set(assignments.map((a) => a.sectionId))]

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl p-6">
          <h1
            className="text-2xl font-light text-white flex items-center gap-2"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            <div className="w-8 h-8 aspect-square bg-white rounded-xl flex items-center justify-center">
              <Calculator size={20} weight="fill" className="text-blue-900" />
            </div>
            Student Grades
          </h1>
          <p
            className="text-xs text-blue-100 mt-1"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            View and manage grades for your students
          </p>
        </div>

        {/* Search and Filter Skeleton */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex-1">
              <div className="h-10 bg-gray-200 rounded-xl animate-pulse"></div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-10 w-20 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-white/95 border border-blue-100 rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-800 to-blue-900 px-6 py-4">
            <div className="h-6 bg-white/20 rounded w-48 animate-pulse"></div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-blue-50/80 border-b border-blue-200">
                  <th className="px-6 py-3 text-left">
                    <div className="h-4 bg-blue-200 rounded w-24 animate-pulse"></div>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <div className="h-4 bg-blue-200 rounded w-20 animate-pulse"></div>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <div className="h-4 bg-blue-200 rounded w-32 animate-pulse"></div>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <div className="h-4 bg-blue-200 rounded w-20 animate-pulse"></div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-50 bg-white">
                {[...Array(5)].map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td className="px-6 py-5 border-b border-blue-50">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gray-200"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-32"></div>
                          <div className="h-3 bg-gray-100 rounded w-24"></div>
                          <div className="h-3 bg-gray-100 rounded w-40"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 border-b border-blue-50">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-28"></div>
                        <div className="h-3 bg-gray-100 rounded w-20"></div>
                      </div>
                    </td>
                    <td className="px-6 py-5 border-b border-blue-50">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                        <div className="flex gap-2">
                          <div className="h-6 bg-gray-100 rounded-full w-16"></div>
                          <div className="h-6 bg-gray-100 rounded-full w-16"></div>
                          <div className="h-6 bg-gray-100 rounded-full w-16"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 border-b border-blue-50">
                      <div className="flex items-center gap-2">
                        <div className="h-8 bg-gray-200 rounded-lg w-20"></div>
                        <div className="h-8 bg-gray-100 rounded-lg w-20"></div>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl p-6">
        <h1
          className="text-2xl font-light text-white flex items-center gap-2"
          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
        >
          <div className="w-8 h-8 aspect-square bg-white rounded-xl flex items-center justify-center">
            <Calculator size={20} weight="fill" className="text-blue-900" />
          </div>
          Student Grades
        </h1>
        <p
          className="text-xs text-blue-100 mt-1"
          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
        >
          View and manage grades for your students
        </p>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 border border-blue-100 rounded-xl bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-900/30 text-sm"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
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
                      <h3 className="text-sm font-medium text-gray-900">
                        Filter Options
                      </h3>
                      <button
                        onClick={() => setShowFilterDropdown(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {/* Subject Filter Pills */}
                    <div>
                      <label className="text-xs text-gray-700 mb-3 block">
                        Subjects
                      </label>
                      <div className="flex items-center gap-2 flex-wrap mb-3">
                        <button
                          onClick={() =>
                            setSelectedSubjectFilter(
                              selectedSubjectFilter.length ===
                                availableSubjects.length
                                ? []
                                : availableSubjects
                            )
                          }
                          className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
                            selectedSubjectFilter.length ===
                            availableSubjects.length
                              ? 'bg-gradient-to-r from-blue-800 to-blue-900 text-white border-blue-900'
                              : 'bg-white text-blue-900 border-blue-100'
                          }`}
                          style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                        >
                          {selectedSubjectFilter.length ===
                          availableSubjects.length
                            ? 'Clear'
                            : 'All'}
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
                              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
                                isSelected
                                  ? 'bg-gradient-to-r from-blue-800 to-blue-900 text-white border-blue-900 shadow shadow-blue-900/30'
                                  : 'bg-white text-blue-900 border-blue-100'
                              }`}
                              style={{
                                fontFamily: 'Poppins',
                                fontWeight: isSelected ? 400 : 300,
                              }}
                            >
                              <span className="flex items-center gap-2">
                                <span
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{
                                    backgroundColor: getSubjectColor(
                                      subject.color
                                    ),
                                  }}
                                ></span>
                                {subject.code}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Section Filter Pills */}
                    <div>
                      <label className="text-xs text-gray-700 mb-3 block">
                        Sections
                      </label>
                      <div className="flex items-center gap-2 flex-wrap mb-3">
                        <button
                          onClick={() =>
                            setSelectedSectionFilter(
                              selectedSectionFilter.length ===
                                availableSections.length
                                ? []
                                : availableSections
                            )
                          }
                          className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
                            selectedSectionFilter.length ===
                            availableSections.length
                              ? 'bg-gradient-to-r from-blue-800 to-blue-900 text-white border-blue-900'
                              : 'bg-white text-blue-900 border-blue-100'
                          }`}
                          style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                        >
                          {selectedSectionFilter.length ===
                          availableSections.length
                            ? 'Clear'
                            : 'All'}
                        </button>
                        {availableSections.map((sectionId) => {
                          const section =
                            sections[sectionId] || sectionsMap[sectionId]
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
                              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
                                isSelected
                                  ? 'bg-gradient-to-r from-blue-800 to-blue-900 text-white border-blue-900 shadow shadow-blue-900/30'
                                  : 'bg-white text-blue-900 border-blue-100'
                              }`}
                              style={{
                                fontFamily: 'Poppins',
                                fontWeight: isSelected ? 400 : 300,
                              }}
                            >
                              <span className="flex items-center gap-2">
                                <span
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{
                                    backgroundColor: getGradeColor(section),
                                  }}
                                ></span>
                                {section.sectionName}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Clear Filters */}
                    {(selectedSubjectFilter.length > 0 ||
                      selectedSectionFilter.length > 0) && (
                      <button
                        onClick={() => {
                          setSelectedSubjectFilter([])
                          setSelectedSectionFilter([])
                        }}
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
      </div>

      {filteredStudents.length === 0 ? (
        <div className="bg-white/95 border border-dashed border-blue-200 rounded-2xl text-center px-8 py-10 shadow-sm">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Calculator size={32} className="text-white" weight="fill" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            {studentsWithGrades.length === 0
              ? 'No Students Assigned'
              : 'No Students Match Your Search'}
          </h3>
          <p
            className="text-sm text-gray-600 mb-6"
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            {studentsWithGrades.length === 0
              ? 'No students are currently enrolled in your classes.'
              : 'Try adjusting your search keywords or clearing the filters.'}
          </p>
          {studentsWithGrades.length > 0 &&
            (searchQuery ||
              selectedSubjectFilter.length > 0 ||
              selectedSectionFilter.length > 0) && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedSubjectFilter([])
                  setSelectedSectionFilter([])
                }}
                className="px-5 py-2.5 text-sm font-medium rounded-xl bg-gradient-to-r from-blue-800 to-blue-900 text-white shadow-md shadow-blue-900/30 focus:outline-none focus:ring-2 focus:ring-blue-900/40"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Reset Filters
              </button>
            )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Results Count */}
          {(searchQuery ||
            selectedSubjectFilter.length > 0 ||
            selectedSectionFilter.length > 0) && (
            <div className="flex items-center flex-wrap gap-2 text-xs text-blue-900/80 bg-white/80 border border-blue-100 rounded-xl px-4 py-2 shadow-sm">
              <span>
                Showing {filteredStudents.length} of {studentsWithGrades.length}{' '}
                students
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

          {/* Grades Table or No Results */}
          {filteredStudents.length === 0 ? (
            <div className="bg-white/95 border border-dashed border-blue-200 rounded-2xl text-center px-8 py-10 shadow-sm">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Calculator size={32} className="text-white" weight="fill" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                {studentsWithGrades.length === 0
                  ? 'No Students Assigned'
                  : 'No Students Match Your Search'}
              </h3>
              <p
                className="text-sm text-gray-600 mb-6"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                {studentsWithGrades.length === 0
                  ? 'No students are currently enrolled in your classes.'
                  : 'Try adjusting your search keywords or clearing the filters.'}
              </p>
              {studentsWithGrades.length > 0 &&
                (searchQuery ||
                  selectedSubjectFilter.length > 0 ||
                  selectedSectionFilter.length > 0) && (
                  <button
                    onClick={() => {
                      setSearchQuery('')
                      setSelectedSubjectFilter([])
                      setSelectedSectionFilter([])
                    }}
                    className="px-5 py-2.5 text-sm font-medium rounded-xl bg-gradient-to-r from-blue-800 to-blue-900 text-white shadow-md shadow-blue-900/30 focus:outline-none focus:ring-2 focus:ring-blue-900/40"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Reset Filters
                  </button>
                )}
            </div>
          ) : (
            <div className="bg-white/95 border border-blue-100 rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-800 to-blue-900 px-6 py-4 flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Users size={18} weight="fill" />
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-wide text-white/70">
                      Student Overview
                    </p>
                    <p className="text-lg font-medium">
                      {filteredStudents.length} Student
                      {filteredStudents.length === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>
                <span className="text-sm text-white/80">
                  {assignments.length} subject assignments
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border border-blue-100">
                  <thead className="border-b border-blue-100">
                    <tr className="bg-blue-50/80 text-blue-900 text-[11px] uppercase tracking-wide">
                      <th className="px-6 py-3 text-left font-medium border-r border-blue-100 last:border-r-0">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center">
                            <Users size={14} weight="bold" />
                          </span>
                          Student
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left font-medium border-r border-blue-100 last:border-r-0">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center">
                            <BookOpen size={14} weight="bold" />
                          </span>
                          Section
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left font-medium border-r border-blue-100 last:border-r-0">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center">
                            <Calculator size={14} weight="bold" />
                          </span>
                          Your Subjects
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left font-medium">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center">
                            <Pencil size={14} weight="bold" />
                          </span>
                          Actions
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-blue-50">
                    {filteredStudents.map(
                      ({ enrollment, grades: studentGradesData, section }) => {
                        const studentId = enrollment.userId
                        const studentSection =
                          enrollment.enrollmentInfo?.sectionId
                        const profile = studentProfiles[enrollment.userId]

                        // Get subjects taught by this teacher
                        const isCollege =
                          enrollment.enrollmentInfo?.level === 'college'
                        const studentSubjects =
                          enrollment.selectedSubjects || []
                        const currentStudentGrades =
                          studentGrades[enrollment.userId] || {}
                        const studentGradeSubjects = Object.keys(
                          currentStudentGrades
                        ).filter(
                          (key) =>
                            ![
                              'studentName',
                              'studentSection',
                              'studentLevel',
                              'studentSemester',
                              'createdAt',
                              'updatedAt',
                            ].includes(key)
                        )

                        // For college students: show ALL subjects teacher is assigned to in their section
                        // For high school: show subjects teacher is assigned to in their section
                        const teacherSubjects = isCollege
                          ? assignments
                              .filter((a) => {
                                // If student has section, show all subjects teacher teaches in that section
                                if (
                                  studentSection &&
                                  a.sectionId === studentSection
                                ) {
                                  return true
                                }
                                // Fallback: check if student has this subject
                                return (
                                  studentSubjects.includes(a.subjectId) ||
                                  studentGradeSubjects.includes(a.subjectId)
                                )
                              })
                              .map((a) => subjects[a.subjectId])
                              .filter(Boolean)
                          : assignments
                              .filter((a) => a.sectionId === studentSection)
                              .map((a) => subjects[a.subjectId])
                              .filter(Boolean)

                        return (
                          <tr
                            key={studentId}
                            className="hover:bg-blue-50/50 transition-colors"
                          >
                            {/* Student Column */}
                            <td className="px-6 py-5 border-b border-blue-50 border-r border-blue-100 last:border-r-0">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-12 w-12 relative mr-3">
                                  {profile?.photoURL ? (
                                    <img
                                      src={profile.photoURL}
                                      alt={`${
                                        enrollment.personalInfo.firstName ||
                                        'Student'
                                      } profile`}
                                      className="h-12 w-12 rounded-full object-cover border-2 border-blue-900/30 shadow-sm"
                                    />
                                  ) : (
                                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center text-white font-semibold border-2 border-white shadow-sm">
                                      {getInitials(
                                        enrollment.personalInfo.firstName,
                                        enrollment.personalInfo.lastName
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div className="space-y-1">
                                  <p className="text-sm font-semibold text-gray-900">
                                    {formatFullName(enrollment)}
                                  </p>
                                  <p className="text-xs text-gray-500 font-mono">
                                    ID:{' '}
                                    {studentProfiles[enrollment.userId]
                                      ?.studentId ||
                                      enrollment.enrollmentInfo?.studentId ||
                                      'N/A'}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {enrollment.personalInfo.email}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Section Column */}
                            <td className="px-6 py-5 border-b border-blue-50 border-r border-blue-100 last:border-r-0">
                              <div className="space-y-1 text-sm text-gray-900">
                                {isCollege ? (
                                  <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-900 rounded-full text-xs">
                                      {enrollment.enrollmentInfo?.courseCode ||
                                        'N/A'}{' '}
                                      {enrollment.enrollmentInfo?.yearLevel ||
                                        ''}
                                    </span>
                                    {enrollment.enrollmentInfo?.semester && (
                                      <span className="text-xs text-gray-500">
                                        {enrollment.enrollmentInfo.semester ===
                                        'first-sem'
                                          ? '1st Sem'
                                          : '2nd Sem'}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex items-center gap-2">
                                      <span
                                        className="w-2.5 h-2.5 rounded-full"
                                        style={{
                                          backgroundColor:
                                            getGradeColor(section),
                                        }}
                                      ></span>
                                      {enrollment.enrollmentInfo?.gradeLevel ||
                                        'N/A'}{' '}
                                      •{' '}
                                      {section
                                        ? section.sectionName
                                        : 'Unassigned'}
                                    </div>
                                    {section?.rank && (
                                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                        <span className="px-2 py-0.5 bg-blue-50 text-blue-900 rounded-full">
                                          Section {section?.rank}
                                        </span>
                                      </div>
                                    )}
                                  </>
                                )}
                                {isCollege && section && (
                                  <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-900 rounded-full">
                                      {section.sectionName}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Subjects Column */}
                            <td className="px-6 py-5 border-b border-blue-50 border-r border-blue-100 last:border-r-0">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                                  <span className="px-2 py-0.5 text-xs bg-blue-50 text-blue-900 rounded-full">
                                    {teacherSubjects.length}{' '}
                                    {teacherSubjects.length === 1
                                      ? 'Subject'
                                      : 'Subjects'}
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {teacherSubjects
                                    .slice(0, 2)
                                    .map((subject) => (
                                      <span
                                        key={subject.id}
                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-blue-100 bg-blue-50 text-xs text-blue-900"
                                      >
                                        <span
                                          className="w-2 h-2 rounded-full"
                                          style={{
                                            backgroundColor: getSubjectColor(
                                              subject.color
                                            ),
                                          }}
                                        ></span>
                                        {subject.code}
                                      </span>
                                    ))}
                                  {teacherSubjects.length > 2 && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-blue-100 bg-blue-50 text-xs text-blue-900 font-medium">
                                      +{teacherSubjects.length - 2} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Actions Column */}
                            <td className="px-6 py-5 border-b border-blue-50">
                              <div className="flex items-center gap-2">
                                <Button
                                  onClick={() =>
                                    handleEditGrades(
                                      studentId,
                                      studentGradesData
                                    )
                                  }
                                  size="sm"
                                  className="bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-700 hover:to-blue-900 text-white shadow-sm px-4 rounded-lg"
                                  style={{
                                    fontFamily: 'Poppins',
                                    fontWeight: 500,
                                  }}
                                >
                                  <Pencil size={14} className="mr-2" />
                                  Update
                                </Button>
                                <Button
                                  onClick={() => {
                                    // Print functionality to be implemented
                                  }}
                                  size="sm"
                                  variant="outline"
                                  className="rounded-lg"
                                  style={{
                                    fontFamily: 'Poppins',
                                    fontWeight: 500,
                                  }}
                                >
                                  <Printer size={14} className="mr-2" />
                                  Print
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      }
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Edit Grades Modal */}
          <Modal
            isOpen={editingStudent !== null}
            onClose={handleCancelEdit}
            title="Edit Student Grades"
            size="2xl"
          >
            {editingStudent && (
              <div className="p-6 space-y-6 max-h-full overflow-y-auto">
                {(() => {
                  const enrollment = enrollments[editingStudent]
                  const studentSection = enrollment?.enrollmentInfo?.sectionId
                  const profile = studentProfiles[editingStudent]

                  // Get subjects taught by this teacher
                  const isCollege =
                    enrollment.enrollmentInfo?.level === 'college'
                  const studentSubjects = enrollment.selectedSubjects || []
                  const currentStudentGrades =
                    studentGrades[editingStudent] || {}
                  const studentGradeSubjects = Object.keys(
                    currentStudentGrades
                  ).filter(
                    (key) =>
                      ![
                        'studentName',
                        'studentSection',
                        'studentLevel',
                        'studentSemester',
                        'createdAt',
                        'updatedAt',
                      ].includes(key)
                  )

                  // For college students: get subjects from teacher's assignments to their section
                  // OR from their selectedSubjects if available
                  // OR from their grades (if they have grades, they have those subjects)
                  const teacherSubjects = isCollege
                    ? assignments
                        .filter((a) => {
                          // If student has section, match by section (primary method)
                          if (
                            studentSection &&
                            a.sectionId === studentSection
                          ) {
                            return true
                          }
                          // Otherwise check if student has this subject in selectedSubjects or grades
                          return (
                            studentSubjects.includes(a.subjectId) ||
                            studentGradeSubjects.includes(a.subjectId)
                          )
                        })
                        .map((a) => subjects[a.subjectId])
                        .filter(Boolean)
                    : assignments
                        .filter((a) => a.sectionId === studentSection)
                        .map((a) => subjects[a.subjectId])
                        .filter(Boolean)

                  return (
                    <>
                      {/* Student Info */}
                      <div className="bg-gray-50 p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 h-12 w-12 relative">
                            {profile?.photoURL ? (
                              <img
                                src={profile.photoURL}
                                alt={`${
                                  enrollment.personalInfo.firstName || 'Student'
                                } profile`}
                                className="h-12 w-12 rounded-full object-cover border-2 border-black/80"
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-full bg-blue-900 flex items-center justify-center border-2 border-black/80">
                                <span className="text-white text-sm font-medium">
                                  {getInitials(
                                    enrollment.personalInfo.firstName,
                                    enrollment.personalInfo.lastName
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">
                              {formatFullName(enrollment)}
                            </h3>
                            <p className="text-sm text-gray-700 font-mono">
                              ID:{' '}
                              {studentProfiles[editingStudent]?.studentId ||
                                enrollment.enrollmentInfo?.studentId ||
                                'N/A'}{' '}
                              •{' '}
                              {enrollment.enrollmentInfo?.gradeLevel ||
                                (enrollment.enrollmentInfo?.level === 'college'
                                  ? `${
                                      enrollment.enrollmentInfo?.courseCode ||
                                      ''
                                    } ${
                                      enrollment.enrollmentInfo?.yearLevel || ''
                                    }`
                                  : 'N/A')}{' '}
                              {sections[studentSection || '']?.sectionName ||
                                sectionsMap[studentSection || '']
                                  ?.sectionName ||
                                'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Grades Form */}
                      <div className="space-y-4">
                        {teacherSubjects.map((subject) => {
                          const isCollege =
                            enrollment.enrollmentInfo?.level === 'college'
                          const isSHS =
                            enrollment.enrollmentInfo?.level ===
                              'high-school' &&
                            enrollment.enrollmentInfo?.department === 'SHS'
                          const shsSemester = isSHS
                            ? (enrollment.enrollmentInfo?.semester as
                                | 'first-sem'
                                | 'second-sem'
                                | undefined)
                            : undefined
                          const currentGrades =
                            studentGrades[editingStudent]?.[subject.id] || {}
                          const subjectGrades = editedGrades[subject.id] || {
                            subjectName: subject.name,
                            period1: currentGrades.period1 || null,
                            period2: currentGrades.period2 || null,
                            period3: currentGrades.period3 || null,
                            period4: currentGrades.period4 || null,
                            specialStatus: currentGrades.specialStatus || null,
                          }

                          // Determine grid columns based on level
                          // College: 3 periods + Average = 4 columns
                          // SHS: 2 periods + Average = 3 columns
                          // JHS: 4 periods + Average = 5 columns
                          const gridCols = isCollege
                            ? 'grid-cols-4'
                            : isSHS
                            ? 'grid-cols-3'
                            : 'grid-cols-5'

                          return (
                            <Card key={subject.id} className="p-4">
                              <div className="flex items-center gap-3 mb-4">
                                <div
                                  className="w-4 h-4 flex-shrink-0"
                                  style={{
                                    backgroundColor: getSubjectColor(
                                      subject.color
                                    ),
                                  }}
                                ></div>
                                <h4 className="text-md font-medium text-gray-900">
                                  {subject.code} - {subject.name}
                                </h4>
                              </div>

                              <div className={`grid ${gridCols} gap-4`}>
                                <div>
                                  <label
                                    className="block text-xs font-medium text-gray-700 mb-1"
                                    style={{
                                      fontFamily: 'Poppins',
                                      fontWeight: 400,
                                    }}
                                  >
                                    {isCollege
                                      ? 'Prelim'
                                      : isSHS && shsSemester === 'first-sem'
                                      ? 'Q1'
                                      : isSHS && shsSemester === 'second-sem'
                                      ? 'Q3'
                                      : 'Q1'}
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    value={subjectGrades.period1 || ''}
                                    onChange={(e) =>
                                      handleGradeChange(
                                        subject.id,
                                        'period1',
                                        e.target.value
                                      )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
                                    placeholder="0-100"
                                    style={{
                                      fontFamily: 'Poppins',
                                      fontWeight: 400,
                                    }}
                                  />
                                </div>

                                <div>
                                  <label
                                    className="block text-xs font-medium text-gray-700 mb-1"
                                    style={{
                                      fontFamily: 'Poppins',
                                      fontWeight: 400,
                                    }}
                                  >
                                    {isCollege
                                      ? 'Midterm'
                                      : isSHS && shsSemester === 'first-sem'
                                      ? 'Q2'
                                      : isSHS && shsSemester === 'second-sem'
                                      ? 'Q4'
                                      : 'Q2'}
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    value={subjectGrades.period2 || ''}
                                    onChange={(e) =>
                                      handleGradeChange(
                                        subject.id,
                                        'period2',
                                        e.target.value
                                      )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
                                    placeholder="0-100"
                                    style={{
                                      fontFamily: 'Poppins',
                                      fontWeight: 400,
                                    }}
                                  />
                                </div>

                                {isCollege && (
                                  <div>
                                    <label
                                      className="block text-xs font-medium text-gray-700 mb-1"
                                      style={{
                                        fontFamily: 'Poppins',
                                        fontWeight: 400,
                                      }}
                                    >
                                      Finals
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      step="0.1"
                                      value={subjectGrades.period3 || ''}
                                      onChange={(e) =>
                                        handleGradeChange(
                                          subject.id,
                                          'period3',
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
                                      placeholder="0-100"
                                      style={{
                                        fontFamily: 'Poppins',
                                        fontWeight: 400,
                                      }}
                                    />
                                  </div>
                                )}

                                {!isCollege && !isSHS && (
                                  <>
                                    <div>
                                      <label
                                        className="block text-xs font-medium text-gray-700 mb-1"
                                        style={{
                                          fontFamily: 'Poppins',
                                          fontWeight: 400,
                                        }}
                                      >
                                        Q3
                                      </label>
                                      <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        value={subjectGrades.period3 || ''}
                                        onChange={(e) =>
                                          handleGradeChange(
                                            subject.id,
                                            'period3',
                                            e.target.value
                                          )
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
                                        placeholder="0-100"
                                        style={{
                                          fontFamily: 'Poppins',
                                          fontWeight: 400,
                                        }}
                                      />
                                    </div>

                                    <div>
                                      <label
                                        className="block text-xs font-medium text-gray-700 mb-1"
                                        style={{
                                          fontFamily: 'Poppins',
                                          fontWeight: 400,
                                        }}
                                      >
                                        Q4
                                      </label>
                                      <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        value={subjectGrades.period4 || ''}
                                        onChange={(e) =>
                                          handleGradeChange(
                                            subject.id,
                                            'period4',
                                            e.target.value
                                          )
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
                                        placeholder="0-100"
                                        style={{
                                          fontFamily: 'Poppins',
                                          fontWeight: 400,
                                        }}
                                      />
                                    </div>
                                  </>
                                )}

                                <div>
                                  <label
                                    className="block text-xs font-medium text-gray-700 mb-1"
                                    style={{
                                      fontFamily: 'Poppins',
                                      fontWeight: 400,
                                    }}
                                  >
                                    Average
                                  </label>
                                  <div className="px-3 py-2 bg-gray-100 text-center">
                                    {subjectGrades.specialStatus ? (
                                      <div
                                        className="text-xs font-medium text-gray-900 uppercase"
                                        style={{
                                          fontFamily: 'Poppins',
                                          fontWeight: 400,
                                        }}
                                      >
                                        {subjectGrades.specialStatus}
                                      </div>
                                    ) : (
                                      <>
                                        {(() => {
                                          const avg = calculateAverage(
                                            subjectGrades,
                                            isCollege,
                                            isSHS
                                          )
                                          const numericMode =
                                            avg !== null
                                              ? convertToNumericMode(avg)
                                              : null

                                          return avg !== null &&
                                            numericMode !== null ? (
                                            <>
                                              <div
                                                className="text-xs font-medium text-gray-900"
                                                style={{
                                                  fontFamily: 'Poppins',
                                                  fontWeight: 400,
                                                }}
                                              >
                                                {avg.toFixed(1)}
                                              </div>
                                              <div
                                                className="text-xs font-mono text-gray-600 mt-1"
                                                style={{
                                                  fontFamily: 'Poppins',
                                                  fontWeight: 400,
                                                }}
                                              >
                                                ({numericMode.toFixed(2)})
                                              </div>
                                              <div
                                                className="text-xs text-gray-600 mt-1"
                                                style={{
                                                  fontFamily: 'Poppins',
                                                  fontWeight: 300,
                                                }}
                                              >
                                                {getDescriptiveMode(avg)}
                                              </div>
                                            </>
                                          ) : (
                                            <div
                                              className="text-xs text-gray-500"
                                              style={{
                                                fontFamily: 'Poppins',
                                                fontWeight: 300,
                                              }}
                                            >
                                              No grades
                                            </div>
                                          )
                                        })()}
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Special Status Buttons */}
                              <div className="mt-4 pt-4 border-t border-gray-200">
                                <label
                                  className="block text-xs font-medium text-gray-700 mb-2"
                                  style={{
                                    fontFamily: 'Poppins',
                                    fontWeight: 400,
                                  }}
                                >
                                  Special Status
                                </label>
                                <div className="flex gap-2 flex-wrap">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleSpecialStatusChange(
                                        subject.id,
                                        'INC'
                                      )
                                    }
                                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                                      subjectGrades.specialStatus === 'INC'
                                        ? 'bg-orange-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                    style={{
                                      fontFamily: 'Poppins',
                                      fontWeight: 400,
                                    }}
                                  >
                                    INC
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleSpecialStatusChange(
                                        subject.id,
                                        'FA'
                                      )
                                    }
                                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                                      subjectGrades.specialStatus === 'FA'
                                        ? 'bg-red-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                    style={{
                                      fontFamily: 'Poppins',
                                      fontWeight: 400,
                                    }}
                                  >
                                    FA
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleSpecialStatusChange(
                                        subject.id,
                                        'FW'
                                      )
                                    }
                                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                                      subjectGrades.specialStatus === 'FW'
                                        ? 'bg-red-700 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                    style={{
                                      fontFamily: 'Poppins',
                                      fontWeight: 400,
                                    }}
                                  >
                                    FW
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleSpecialStatusChange(subject.id, 'W')
                                    }
                                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                                      subjectGrades.specialStatus === 'W'
                                        ? 'bg-yellow-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                    style={{
                                      fontFamily: 'Poppins',
                                      fontWeight: 400,
                                    }}
                                  >
                                    W
                                  </button>
                                  {subjectGrades.specialStatus && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleSpecialStatusChange(
                                          subject.id,
                                          null
                                        )
                                      }
                                      className="px-3 py-1.5 text-xs font-medium bg-gray-500 text-white hover:bg-gray-600 transition-colors"
                                      style={{
                                        fontFamily: 'Poppins',
                                        fontWeight: 400,
                                      }}
                                    >
                                      Clear
                                    </button>
                                  )}
                                </div>
                                <p
                                  className="text-xs text-gray-500 mt-2"
                                  style={{
                                    fontFamily: 'Poppins',
                                    fontWeight: 300,
                                  }}
                                >
                                  INC: Incomplete | FA: Failed (Absent) | FW:
                                  Failed (Withdrawn) | W: Withdrawn
                                </p>
                              </div>
                            </Card>
                          )
                        })}
                      </div>

                      {/* Modal Actions */}
                      <div className="flex gap-3 pt-4 border-t border-gray-200 bg-gray-50 -mx-6 px-6">
                        <Button
                          onClick={handleCancelEdit}
                          variant="outline"
                          className="flex-1 rounded-lg"
                        >
                          <X size={16} className="mr-2" />
                          Cancel
                        </Button>
                        <Button
                          onClick={() => handleSaveGrades(editingStudent)}
                          disabled={saving[editingStudent]}
                          className="flex-1 bg-blue-900 hover:bg-blue-900 rounded-lg"
                        >
                          {saving[editingStudent] ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              <Check size={16} className="mr-2" />
                              Save Grades
                            </>
                          )}
                        </Button>
                      </div>
                    </>
                  )
                })()}
              </div>
            )}
          </Modal>
        </div>
      )}
    </div>
  )
}
