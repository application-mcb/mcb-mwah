'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { toast } from 'react-toastify'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  GraduationCap,
  BookOpen,
  ChartBar,
  Users,
  ClipboardText,
  Student,
  Clock,
  CheckCircle,
} from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'

interface TeacherOverviewProps {
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
    department?: string
    schoolYear: string
    enrollmentDate: string
    status: string
    sectionId?: string
    level?: 'college' | 'high-school'
  }
  submittedAt?: string
}

interface Subject {
  id: string
  code: string
  name: string
  color: string
}

interface Section {
  id: string
  sectionName: string
  gradeId?: string
  courseId?: string
  rank: string
  grade: string
  department: string
  students?: string[]
}

interface TeacherAssignment {
  subjectId: string
  sectionId: string
  teacherId: string
}

export default function TeacherOverview({ teacherId }: TeacherOverviewProps) {
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([])
  const [enrollments, setEnrollments] = useState<
    Record<string, EnrollmentData>
  >({})
  const [subjects, setSubjects] = useState<Record<string, Subject>>({})
  const [sections, setSections] = useState<Record<string, Section>>({})
  const [loading, setLoading] = useState(true)
  const [currentAY, setCurrentAY] = useState('')
  const [currentSemester, setCurrentSemester] = useState('1')

  useEffect(() => {
    loadData()
  }, [teacherId])

  const loadData = async () => {
    try {
      setLoading(true)

      // Load current academic year and semester
      const configResponse = await fetch('/api/enrollment?getConfig=true')
      const configData = await configResponse.json()

      if (configResponse.ok && configData.ayCode) {
        setCurrentAY(configData.ayCode)
      }
      if (configResponse.ok && configData.semester) {
        setCurrentSemester(configData.semester)
      }

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

        // Load sections
        const sectionsResponse = await fetch('/api/sections')
        if (sectionsResponse.ok) {
          const sectionsData = await sectionsResponse.json()
          if (sectionsData.sections && Array.isArray(sectionsData.sections)) {
            const relevantSections = sectionsData.sections.filter(
              (section: Section) => sectionIds.includes(section.id)
            )

            const sectionsMap: Record<string, Section> = {}
            const allStudentIds: string[] = []

            relevantSections.forEach((section: Section) => {
              sectionsMap[section.id] = section
              if (section.students && Array.isArray(section.students)) {
                allStudentIds.push(...section.students)
              }
            })

            setSections(sectionsMap)

            // Load enrollment data for students
            const uniqueStudentIds = [...new Set(allStudentIds)]
            if (uniqueStudentIds.length > 0) {
              const enrollmentResponse = await fetch(
                `/api/enrollment?userIds=${uniqueStudentIds.join(',')}`
              )

              if (enrollmentResponse.ok) {
                const enrollmentData = await enrollmentResponse.json()
                if (enrollmentData.success && enrollmentData.data) {
                  const enrollmentsMap: Record<string, EnrollmentData> = {}
                  enrollmentData.data.forEach((enrollment: EnrollmentData) => {
                    enrollmentsMap[enrollment.userId] = enrollment
                  })
                  setEnrollments(enrollmentsMap)
                }
              }
            }
          }
        }
      }

      // Load subjects
      const subjectsResponse = await fetch('/api/subjects')
      if (subjectsResponse.ok) {
        const subjectsData = await subjectsResponse.json()
        if (subjectsData.subjects) {
          const subjectsMap: Record<string, Subject> = {}
          subjectsData.subjects.forEach((subject: Subject) => {
            subjectsMap[subject.id] = subject
          })
          setSubjects(subjectsMap)
        }
      }
    } catch (error) {
      console.error('Error loading teacher overview data:', error)
      toast.error('Failed to load overview data', { autoClose: 5000 })
    } finally {
      setLoading(false)
    }
  }

  // Calculate statistics
  const stats = useMemo(() => {
    const uniqueStudents = new Set<string>()
    const uniqueSubjects = new Set<string>()
    const uniqueSections = new Set<string>()

    assignments.forEach((assignment) => {
      uniqueSubjects.add(assignment.subjectId)
      uniqueSections.add(assignment.sectionId)

      const section = sections[assignment.sectionId]
      if (section?.students) {
        section.students.forEach((studentId) => {
          uniqueStudents.add(studentId)
        })
      }
    })

    return {
      totalStudents: uniqueStudents.size,
      totalSubjects: uniqueSubjects.size,
      totalSections: uniqueSections.size,
      pendingGrades: 0, // Placeholder - can be enhanced later
    }
  }, [assignments, sections])

  // Prepare chart data - Students by Subject
  const studentsBySubjectData = useMemo(() => {
    const subjectCounts: Record<string, number> = {}

    assignments.forEach((assignment) => {
      const section = sections[assignment.sectionId]
      const studentCount = section?.students?.length || 0

      if (!subjectCounts[assignment.subjectId]) {
        subjectCounts[assignment.subjectId] = 0
      }
      subjectCounts[assignment.subjectId] += studentCount
    })

    return Object.entries(subjectCounts)
      .map(([subjectId, count]) => {
        const subject = subjects[subjectId]
        return {
          name: subject?.code || 'Unknown',
          students: count,
        }
      })
      .sort((a, b) => b.students - a.students)
  }, [assignments, sections, subjects])

  // Prepare chart data - Students by Section
  const studentsBySectionData = useMemo(() => {
    const sectionStudentSets: Record<string, Set<string>> = {}

    assignments.forEach((assignment) => {
      const section = sections[assignment.sectionId]
      if (section && section.students) {
        if (!sectionStudentSets[assignment.sectionId]) {
          sectionStudentSets[assignment.sectionId] = new Set()
        }
        // Add all students from this section
        section.students.forEach((studentId) => {
          sectionStudentSets[assignment.sectionId].add(studentId)
        })
      }
    })

    return Object.entries(sectionStudentSets)
      .map(([sectionId, studentSet]) => {
        const section = sections[sectionId]
        return {
          name: section?.sectionName || 'Unknown',
          students: studentSet.size,
        }
      })
      .sort((a, b) => b.students - a.students)
  }, [assignments, sections])

  // Get latest students
  const latestStudents = useMemo(() => {
    const studentList: Array<{
      enrollment: EnrollmentData
      section: Section | null
      subjects: Subject[]
    }> = []

    Object.values(enrollments).forEach((enrollment) => {
      const sectionId = enrollment.enrollmentInfo?.sectionId
      if (!sectionId) return

      const section = sections[sectionId]
      if (!section) return

      // Get subjects for this student's section
      const studentSubjects = assignments
        .filter((a) => a.sectionId === sectionId)
        .map((a) => subjects[a.subjectId])
        .filter(Boolean)

      studentList.push({
        enrollment,
        section,
        subjects: studentSubjects,
      })
    })

    return studentList
      .sort((a, b) => {
        const dateA = new Date(a.enrollment.submittedAt || 0).getTime()
        const dateB = new Date(b.enrollment.submittedAt || 0).getTime()
        return dateB - dateA
      })
      .slice(0, 5)
  }, [enrollments, sections, assignments, subjects])

  const formatFullName = (
    firstName?: string,
    middleName?: string,
    lastName?: string,
    nameExtension?: string
  ) => {
    const parts = [firstName, middleName, lastName].filter(Boolean)
    const name = parts.join(' ')
    return nameExtension ? `${name} ${nameExtension}` : name
  }

  const formatDate = (dateInput: any) => {
    try {
      if (!dateInput) return 'N/A'

      let date: Date

      if (dateInput && typeof dateInput === 'object' && 'toDate' in dateInput) {
        date = dateInput.toDate()
      } else if (
        dateInput &&
        typeof dateInput === 'object' &&
        ('_seconds' in dateInput || 'seconds' in dateInput)
      ) {
        const seconds = dateInput._seconds || dateInput.seconds
        const nanoseconds = dateInput._nanoseconds || dateInput.nanoseconds || 0
        date = new Date(seconds * 1000 + nanoseconds / 1000000)
      } else if (typeof dateInput === 'string') {
        date = new Date(dateInput)
      } else if (typeof dateInput === 'number') {
        date = new Date(dateInput)
      } else if (dateInput instanceof Date) {
        date = dateInput
      } else {
        return 'N/A'
      }

      if (isNaN(date.getTime())) {
        return 'N/A'
      }

      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return 'N/A'
    }
  }

  if (loading) {
    return (
      <div className="p-4 space-y-4" style={{ fontFamily: 'Poppins' }}>
        {/* Header Skeleton */}
        <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl p-6 animate-pulse">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-xl"></div>
            <div className="h-7 bg-white/20 rounded-lg w-32"></div>
          </div>
          <div className="h-4 bg-white/10 rounded w-64 mt-2"></div>
        </div>

        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <Card
              key={i}
              className="p-3 rounded-xl border border-gray-200 bg-white animate-pulse"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                  <div className="h-4 bg-gray-300 rounded w-12"></div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <Card
              key={i}
              className="p-4 rounded-xl border border-gray-200 bg-white animate-pulse"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-4 h-4 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </div>
              <div className="h-[250px] bg-gray-100 rounded-lg"></div>
            </Card>
          ))}
        </div>

        {/* Students Table Skeleton */}
        <Card className="p-4 rounded-xl border border-gray-200 bg-white animate-pulse">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-4 h-4 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="space-y-2">
            <div className="bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg p-2">
              <div className="grid grid-cols-4 gap-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-3 bg-white/20 rounded w-full"></div>
                ))}
              </div>
            </div>
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-4 gap-2 p-2 border-b border-gray-200"
              >
                <div className="h-3 bg-gray-200 rounded w-24"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
                <div className="h-5 bg-gray-200 rounded w-16"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4" style={{ fontFamily: 'Poppins' }}>
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl p-6">
        <h1
          className="text-2xl font-light text-white flex items-center gap-2"
          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
        >
          <div className="w-8 h-8 aspect-square bg-white rounded-xl flex items-center justify-center">
            <ChartBar size={20} weight="fill" className="text-blue-900" />
          </div>
          Overview
        </h1>
        <p
          className="text-xs text-blue-100 mt-1"
          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
        >
          Quick summary of your teaching dashboard
        </p>
        {currentAY && (
          <div className="flex items-center gap-2 mt-3">
            <div className="flex items-center gap-2 px-2 py-1 bg-white rounded-lg border border-blue-700">
              <Clock size={12} className="text-blue-900" weight="bold" />
              <span
                className="text-xs font-mono text-blue-900"
                style={{ fontFamily: 'monospace' }}
              >
                AY: {currentAY}
              </span>
            </div>
            {currentSemester && (
              <div className="flex items-center gap-2 px-2 py-1 bg-white rounded-lg border border-blue-700">
                <Clock size={12} className="text-blue-900" weight="bold" />
                <span
                  className="text-xs font-mono text-blue-900"
                  style={{ fontFamily: 'monospace' }}
                >
                  Semester: {currentSemester === '1' ? '1st' : '2nd'}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-3 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-900 flex items-center justify-center">
                <Users size={16} className="text-white" weight="fill" />
              </div>
              <div>
                <p
                  className="text-xs text-gray-600"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  Students
                </p>
                <p
                  className="text-sm font-medium text-gray-900"
                  style={{ fontFamily: 'monospace', fontWeight: 500 }}
                >
                  {stats.totalStudents}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-3 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-900 flex items-center justify-center">
                <BookOpen size={16} className="text-white" weight="fill" />
              </div>
              <div>
                <p
                  className="text-xs text-gray-600"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  Subjects
                </p>
                <p
                  className="text-sm font-medium text-gray-900"
                  style={{ fontFamily: 'monospace', fontWeight: 500 }}
                >
                  {stats.totalSubjects}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-3 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-900 flex items-center justify-center">
                <GraduationCap size={16} className="text-white" weight="fill" />
              </div>
              <div>
                <p
                  className="text-xs text-gray-600"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  Sections
                </p>
                <p
                  className="text-sm font-medium text-gray-900"
                  style={{ fontFamily: 'monospace', fontWeight: 500 }}
                >
                  {stats.totalSections}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-3 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-900 flex items-center justify-center">
                <ClipboardText size={16} className="text-white" weight="fill" />
              </div>
              <div>
                <p
                  className="text-xs text-gray-600"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  Pending Grades
                </p>
                <p
                  className="text-sm font-medium text-gray-900"
                  style={{ fontFamily: 'monospace', fontWeight: 500 }}
                >
                  {stats.pendingGrades}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Students by Subject Chart */}
        <Card className="p-4 rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={16} className="text-blue-900" weight="fill" />
            <h2
              className="text-xs font-medium text-gray-900"
              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
            >
              Students by Subject
            </h2>
          </div>
          <div style={{ width: '100%', height: '250px', minHeight: '250px' }}>
            {studentsBySubjectData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={studentsBySubjectData}>
                  <defs>
                    <linearGradient
                      id="colorSubject"
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
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    style={{ fontFamily: 'monospace', fontWeight: 300 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontFamily: 'monospace',
                      fontWeight: 400,
                    }}
                    formatter={(value: any) => [value, '']}
                  />
                  <Bar
                    dataKey="students"
                    fill="url(#colorSubject)"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p
                  className="text-sm text-gray-500"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  No data available
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Students by Section Chart */}
        <Card className="p-4 rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center gap-2 mb-3">
            <GraduationCap size={16} className="text-blue-900" weight="fill" />
            <h2
              className="text-xs font-medium text-gray-900"
              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
            >
              Students by Section
            </h2>
          </div>
          <div style={{ width: '100%', height: '250px', minHeight: '250px' }}>
            {studentsBySectionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={studentsBySectionData}>
                  <defs>
                    <linearGradient
                      id="colorSection"
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
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    style={{ fontFamily: 'monospace', fontWeight: 300 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontFamily: 'monospace',
                      fontWeight: 400,
                    }}
                    formatter={(value: any) => [value, '']}
                  />
                  <Bar
                    dataKey="students"
                    fill="url(#colorSection)"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p
                  className="text-sm text-gray-500"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  No data available
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Latest Students Table */}
      <Card className="p-4 rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center gap-2 mb-3">
          <Student size={16} className="text-blue-900" weight="fill" />
          <h2
            className="text-xs font-medium text-gray-900"
            style={{ fontFamily: 'Poppins', fontWeight: 500 }}
          >
            Latest Students
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg">
              <tr>
                <th
                  className="px-3 py-2 text-left text-[10px] font-medium text-white uppercase tracking-wider rounded-tl-lg"
                  style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                >
                  <div className="flex items-center gap-1">
                    <Users size={12} weight="fill" />
                    Student
                  </div>
                </th>
                <th
                  className="px-3 py-2 text-left text-[10px] font-medium text-white uppercase tracking-wider"
                  style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                >
                  <div className="flex items-center gap-1">
                    <GraduationCap size={12} weight="fill" />
                    Section
                  </div>
                </th>
                <th
                  className="px-3 py-2 text-left text-[10px] font-medium text-white uppercase tracking-wider"
                  style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                >
                  <div className="flex items-center gap-1">
                    <BookOpen size={12} weight="fill" />
                    Subjects
                  </div>
                </th>
                <th
                  className="px-3 py-2 text-left text-[10px] font-medium text-white uppercase tracking-wider rounded-tr-lg"
                  style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                >
                  <div className="flex items-center gap-1">
                    <Clock size={12} weight="fill" />
                    Enrolled
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {latestStudents.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-6 text-center text-gray-500 text-xs"
                    style={{ fontFamily: 'monospace', fontWeight: 300 }}
                  >
                    No students found.
                  </td>
                </tr>
              ) : (
                latestStudents.map((item) => {
                  const fullName = formatFullName(
                    item.enrollment.personalInfo?.firstName,
                    item.enrollment.personalInfo?.middleName,
                    item.enrollment.personalInfo?.lastName,
                    item.enrollment.personalInfo?.nameExtension
                  )
                  const status =
                    item.enrollment.enrollmentInfo?.status || 'pending'
                  const statusColors: Record<string, string> = {
                    enrolled: 'bg-green-100 text-green-800',
                    pending: 'bg-yellow-100 text-yellow-800',
                    revoked: 'bg-red-100 text-red-800',
                  }
                  const statusColor =
                    statusColors[status] || 'bg-gray-100 text-gray-800'

                  return (
                    <tr
                      key={item.enrollment.userId}
                      className="hover:bg-gray-50"
                    >
                      <td
                        className="px-3 py-2 whitespace-nowrap text-xs"
                        style={{ fontFamily: 'monospace', fontWeight: 400 }}
                      >
                        {fullName || 'N/A'}
                      </td>
                      <td
                        className="px-3 py-2 whitespace-nowrap text-xs"
                        style={{ fontFamily: 'monospace', fontWeight: 300 }}
                      >
                        {item.section?.sectionName || 'N/A'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {item.subjects.length > 0 ? (
                            item.subjects.map((subject) => (
                              <span
                                key={subject.id}
                                className="px-1.5 py-0.5 text-[10px] font-medium rounded-lg bg-blue-50 text-blue-900 border border-blue-100"
                                style={{
                                  fontFamily: 'monospace',
                                  fontWeight: 400,
                                }}
                              >
                                {subject.code}
                              </span>
                            ))
                          ) : (
                            <span
                              className="text-xs text-gray-400"
                              style={{
                                fontFamily: 'monospace',
                                fontWeight: 300,
                              }}
                            >
                              N/A
                            </span>
                          )}
                        </div>
                      </td>
                      <td
                        className="px-3 py-2 whitespace-nowrap text-xs text-gray-600"
                        style={{ fontFamily: 'monospace', fontWeight: 300 }}
                      >
                        {formatDate(item.enrollment.submittedAt)}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
