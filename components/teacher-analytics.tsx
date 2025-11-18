'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { toast } from 'react-toastify'
import { ChartBar } from '@phosphor-icons/react'
import {
  TeacherAnalyticsProps,
  StudentWithGrades,
  EnrollmentData,
  Section,
  Subject,
  TeacherAssignment,
} from './teacher-analytics/types'
import { AnalyticsHeader } from './teacher-analytics/analytics-header'
import { SkeletonLoader } from './teacher-analytics/skeleton-loader'
import { SummaryCards } from './teacher-analytics/summary-cards'
import { ChartsGrid } from './teacher-analytics/charts-grid'
import { useSectionPerformance } from './teacher-analytics/hooks/useSectionPerformance'
import { useGradeDistribution } from './teacher-analytics/hooks/useGradeDistribution'
import { useSubjectAnalytics } from './teacher-analytics/hooks/useSubjectAnalytics'
import { useQuarterComparison } from './teacher-analytics/hooks/useQuarterComparison'

export default function TeacherAnalytics({
  teacherId,
  teacherName,
}: TeacherAnalyticsProps) {
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([])
  const [enrollments, setEnrollments] = useState<
    Record<string, EnrollmentData>
  >({})
  const [subjects, setSubjects] = useState<Record<string, Subject>>({})
  const [sections, setSections] = useState<Record<string, Section>>({})
  const [sectionsMap, setSectionsMap] = useState<Record<string, any>>({})
  const [studentGrades, setStudentGrades] = useState<
    Record<string, Record<string, any>>
  >({})
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string[]>(
    []
  )
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string[]>(
    []
  )
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)

  useEffect(() => {
    loadData()
  }, [teacherId])

  const loadData = async () => {
    try {
      setLoading(true)

      // Load teacher assignments
      const assignmentsResponse = await fetch(
        `/api/teacher-assignments?teacherId=${teacherId}`
      )
      const assignmentsData = await assignmentsResponse.json()

      if (!assignmentsResponse.ok || !assignmentsData.assignments) {
        toast.error('Failed to load teacher assignments')
        return
      }

      // Transform assignments
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
        ...new Set(transformedAssignments.map((a) => a.sectionId)),
      ]

      // Load sections
      const sectionsResponse = await fetch('/api/sections')
      let allSections: Section[] = []
      if (sectionsResponse.ok) {
        try {
          const sectionsData = await sectionsResponse.json()
          if (sectionsData.sections && Array.isArray(sectionsData.sections)) {
            allSections = sectionsData.sections
          }
        } catch (error) {
          console.error('Failed to parse sections response:', error)
        }
      }

      const relevantSectionsMap: Record<string, any> = {}
      const allStudentIds: string[] = []
      allSections
        .filter((section: any) => sectionIds.includes(section.id))
        .forEach((section: any) => {
          relevantSectionsMap[section.id] = section
          if (section.students && Array.isArray(section.students)) {
            allStudentIds.push(...section.students)
          }
        })
      setSectionsMap(relevantSectionsMap)

      const sectionsMapState: Record<string, Section> = {}
      allSections.forEach((section: Section) => {
        sectionsMapState[section.id] = section
      })
      setSections(sectionsMapState)

      // Remove duplicate student IDs
      const uniqueStudentIds = [...new Set(allStudentIds)]

      // Load enrollments
      const enrollmentsMap: Record<string, EnrollmentData> = {}
      if (uniqueStudentIds.length > 0) {
        const enrollmentResponse = await fetch(
          `/api/enrollment?userIds=${uniqueStudentIds.join(',')}`
        ).catch(() => null)

        if (enrollmentResponse && enrollmentResponse.ok) {
          const enrollmentData = await enrollmentResponse.json()
          if (enrollmentData.success && enrollmentData.data) {
            enrollmentData.data.forEach((enrollment: EnrollmentData) => {
              enrollmentsMap[enrollment.userId] = enrollment
            })
          }
        }
      }
      setEnrollments(enrollmentsMap)

      // Load grades
      const gradesMap: Record<string, Record<string, any>> = {}
      if (uniqueStudentIds.length > 0) {
        const gradePromises = uniqueStudentIds.map((userId) =>
          fetch(`/api/students/${userId}/grades`)
            .then(async (res) => {
              if (res.ok) {
                const data = await res.json()
                return { userId, grades: data.grades || {} }
              }
              return { userId, grades: {} }
            })
            .catch(() => ({ userId, grades: {} }))
        )

        const gradeResults = await Promise.all(gradePromises)
        gradeResults.forEach(({ userId, grades }) => {
          gradesMap[userId] = grades
        })
      }
      setStudentGrades(gradesMap)

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
      console.error('Error loading analytics data:', error)
      toast.error('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  // Get students with their grades, filtered by teacher's subjects
  const studentsWithGrades: StudentWithGrades[] = useMemo(() => {
    return Object.values(enrollments)
      .map((enrollment) => ({
        enrollment,
        grades: studentGrades[enrollment.userId] || {},
        section:
          sections[enrollment.enrollmentInfo?.sectionId || ''] ||
          sectionsMap[enrollment.enrollmentInfo?.sectionId || ''] ||
          null,
      }))
      .filter(({ enrollment }) => {
        const studentSection = enrollment.enrollmentInfo?.sectionId
        if (!studentSection) return false
        return assignments.some((a) => a.sectionId === studentSection)
      })
  }, [enrollments, studentGrades, sections, sectionsMap, assignments])

  // Filter students based on search and filters
  const filteredStudentsWithGrades = useMemo(() => {
    return studentsWithGrades.filter(({ enrollment }) => {
      // Subject filter
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

      // Section filter
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
        const fullName =
          `${enrollment.personalInfo.firstName} ${enrollment.personalInfo.lastName}`.toLowerCase()
        const studentId =
          enrollment.enrollmentInfo?.studentId?.toLowerCase() || ''
        return fullName.includes(query) || studentId.includes(query)
      }

      return true
    })
  }, [
    studentsWithGrades,
    selectedSubjectFilter,
    selectedSectionFilter,
    searchQuery,
    assignments,
  ])

  // Calculate analytics using hooks
  const { sectionPerformance } = useSectionPerformance({
    studentsWithGrades: filteredStudentsWithGrades,
  })

  const { gradeDistribution } = useGradeDistribution({
    studentsWithGrades: filteredStudentsWithGrades,
  })

  const { subjectAnalytics } = useSubjectAnalytics({
    studentsWithGrades: filteredStudentsWithGrades,
    subjects,
  })

  const { jhsQuarterComparison, shsQuarterComparison, collegeQuarterComparison } = useQuarterComparison({
    studentsWithGrades: filteredStudentsWithGrades,
  })

  // Get available subjects and sections for filters
  const availableSubjects = useMemo(() => {
    const subjectIds = [...new Set(assignments.map((a) => a.subjectId))]
    return subjectIds
      .map((id) => subjects[id])
      .filter(Boolean)
      .map((subject) => ({
        id: subject.id,
        code: subject.code,
        name: subject.name,
      }))
  }, [assignments, subjects])

  const availableSections = useMemo(() => {
    const sectionIds = [...new Set(assignments.map((a) => a.sectionId))]
    return sectionIds
      .map((id) => sections[id] || sectionsMap[id])
      .filter(Boolean)
      .map((section) => ({
        id: section.id,
        name: section.sectionName,
      }))
  }, [assignments, sections, sectionsMap])

  const handleToggleSubject = (subjectId: string) => {
    setSelectedSubjectFilter((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId]
    )
  }

  const handleToggleSection = (sectionId: string) => {
    setSelectedSectionFilter((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  const handleResetFilters = () => {
    setSelectedSubjectFilter([])
    setSelectedSectionFilter([])
    setSearchQuery('')
  }

  if (loading) {
    return <SkeletonLoader />
  }

  const totalStudents = filteredStudentsWithGrades.length
  const totalSections = new Set(
    filteredStudentsWithGrades.map((s) => s.section?.id).filter(Boolean)
  ).size
  const totalSubjects = new Set(assignments.map((a) => a.subjectId)).size

  return (
    <div className="p-6 space-y-6" style={{ fontFamily: 'Poppins' }}>
      <AnalyticsHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showFilterDropdown={showFilterDropdown}
        onToggleFilterDropdown={() => setShowFilterDropdown((prev) => !prev)}
        onCloseFilters={() => setShowFilterDropdown(false)}
        selectedSubjectFilter={selectedSubjectFilter}
        selectedSectionFilter={selectedSectionFilter}
        availableSubjects={availableSubjects}
        availableSections={availableSections}
        onToggleSubject={handleToggleSubject}
        onToggleSection={handleToggleSection}
        onResetFilters={handleResetFilters}
      />

      {totalStudents === 0 ? (
        <div className="bg-white/95 border border-dashed border-blue-200 rounded-xl text-center px-8 py-10 shadow-sm">
          <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <ChartBar size={32} className="text-white" weight="fill" />
          </div>
          <h3
            className="text-xl font-medium text-gray-900 mb-2"
            style={{ fontFamily: 'Poppins', fontWeight: 500 }}
          >
            No Analytics Data Available
          </h3>
          <p
            className="text-sm text-gray-600 mb-6"
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            No students are currently enrolled in your assigned sections, or no
            grade data is available yet.
          </p>
        </div>
      ) : (
        <>
          <SummaryCards
            totalStudents={totalStudents}
            totalSections={totalSections}
            totalSubjects={totalSubjects}
          />

          <ChartsGrid
            sectionPerformance={sectionPerformance}
            gradeDistribution={gradeDistribution}
            subjectAnalytics={subjectAnalytics}
            jhsQuarterComparison={jhsQuarterComparison}
            shsQuarterComparison={shsQuarterComparison}
            collegeQuarterComparison={collegeQuarterComparison}
          />
        </>
      )}
    </div>
  )
}
