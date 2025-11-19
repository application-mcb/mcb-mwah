'use client'

import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { WarningCircle, GraduationCap, Calendar } from '@phosphor-icons/react'
import {
  EnrollmentData,
  StudentAnalyticsProps,
  StudentGrades,
  SubjectData,
} from './student-analytics/types'
import { StudentAnalyticsSkeleton } from './student-analytics/skeleton-loader'
import { StudentAnalyticsEmptyState } from './student-analytics/empty-state'
import { SummaryCards } from './student-analytics/summary-cards'
import { ChartsGrid } from './student-analytics/charts-grid'
import { useStudentAnalyticsData } from './student-analytics/hooks/useStudentAnalyticsData'

export default function StudentAnalytics({
  studentId,
  studentName,
}: StudentAnalyticsProps) {
  const [grades, setGrades] = useState<StudentGrades>({})
  const [subjects, setSubjects] = useState<Record<string, SubjectData>>({})
  const [enrollment, setEnrollment] = useState<EnrollmentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadStudentAnalytics()
  }, [studentId])

  const loadStudentAnalytics = async () => {
    try {
      setLoading(true)
      setError('')

      const enrollmentResponse = await fetch(`/api/enrollment?userId=${studentId}`)
      const enrollmentData = await enrollmentResponse.json()

      if (enrollmentResponse.status === 404) {
        setEnrollment(null)
        setGrades({})
        setSubjects({})
        setLoading(false)
        return
      }

      if (!enrollmentResponse.ok || !enrollmentData.success || !enrollmentData.data) {
        throw new Error(enrollmentData.error || 'Failed to load enrollment data')
      }

      const enrollmentInfo = enrollmentData.data as EnrollmentData
      setEnrollment(enrollmentInfo)

      if (enrollmentInfo.enrollmentInfo?.status !== 'enrolled') {
        setGrades({})
        setSubjects({})
        setLoading(false)
        return
      }

      const [enrolledSubjectsResponse, gradesResponse] = await Promise.all([
        fetch(`/api/enrollment?userId=${studentId}&getEnrolledSubjects=true`),
        fetch(`/api/students/${studentId}/grades`),
      ])

      const enrolledSubjectsData = await enrolledSubjectsResponse.json()
      const gradesData = await gradesResponse.json()

      let enrolledSubjectsMap: Record<string, SubjectData> = {}

      if (enrolledSubjectsResponse.ok && enrolledSubjectsData.success) {
        for (const subject of enrolledSubjectsData.subjects || []) {
          enrolledSubjectsMap[subject.id] = subject
        }
      } else if (
        Array.isArray(enrollmentInfo.selectedSubjects) &&
        enrollmentInfo.selectedSubjects.length > 0
      ) {
        const allSubjectsResponse = await fetch('/api/subjects')
        const allSubjectsData = await allSubjectsResponse.json()
        if (allSubjectsResponse.ok && allSubjectsData.subjects) {
          enrollmentInfo.selectedSubjects.forEach((subjectId: string) => {
            const subject = allSubjectsData.subjects.find(
              (item: SubjectData) => item.id === subjectId
            )
            if (subject) {
              enrolledSubjectsMap[subject.id] = subject
            }
          })
        }
      }

      const sanitizedGrades: StudentGrades = {}

      Object.keys(enrolledSubjectsMap).forEach((subjectId) => {
        sanitizedGrades[subjectId] = {
          subjectName: enrolledSubjectsMap[subjectId]?.name || 'Unknown Subject',
          period1: null,
          period2: null,
          period3: null,
          period4: null,
          specialStatus: null,
        }
      })

      if (gradesResponse.ok && gradesData.grades) {
        Object.entries(gradesData.grades).forEach(([subjectId, subjectGrade]: [string, any]) => {
          if (!sanitizedGrades[subjectId] && enrolledSubjectsMap[subjectId]) {
            sanitizedGrades[subjectId] = {
              subjectName: enrolledSubjectsMap[subjectId]?.name || 'Unknown Subject',
              period1: null,
              period2: null,
              period3: null,
              period4: null,
              specialStatus: null,
            }
          }

          if (!sanitizedGrades[subjectId]) {
            return
          }

          sanitizedGrades[subjectId] = {
            subjectName:
              sanitizedGrades[subjectId].subjectName ||
              enrolledSubjectsMap[subjectId]?.name ||
              'Unknown Subject',
            period1:
              typeof subjectGrade.period1 === 'number' ? subjectGrade.period1 : null,
            period2:
              typeof subjectGrade.period2 === 'number' ? subjectGrade.period2 : null,
            period3:
              typeof subjectGrade.period3 === 'number' ? subjectGrade.period3 : null,
            period4:
              typeof subjectGrade.period4 === 'number' ? subjectGrade.period4 : null,
            specialStatus:
              subjectGrade.specialStatus === 'INC' ||
              subjectGrade.specialStatus === 'FA' ||
              subjectGrade.specialStatus === 'FW' ||
              subjectGrade.specialStatus === 'W'
                ? subjectGrade.specialStatus
                : null,
          }
        })
      }

      setSubjects(enrolledSubjectsMap)
      setGrades(sanitizedGrades)
    } catch (err: any) {
      console.error('Failed to load student analytics:', err)
      setError(err.message || 'Failed to load student analytics')
      toast.error('Unable to load student analytics', { autoClose: 4000 })
    } finally {
      setLoading(false)
    }
  }

  const analytics = useStudentAnalyticsData({
    grades,
    subjects,
    enrollment,
  })

  const hasSubjects = analytics.totalSubjects > 0
  const hasCompletedGrades = analytics.completedSubjects > 0

  if (loading) {
    return <StudentAnalyticsSkeleton />
  }

  if (!enrollment || enrollment.enrollmentInfo?.status !== 'enrolled') {
    return (
      <StudentAnalyticsEmptyState
        message="Complete your enrollment to unlock analytics."
        hint="Once your enrollment is confirmed, your grades will appear here automatically."
      />
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-white/95 border border-red-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3 text-red-700">
            <WarningCircle size={24} weight="fill" />
            <p style={{ fontFamily: 'Poppins', fontWeight: 500 }}>{error}</p>
          </div>
          <button
            onClick={loadStudentAnalytics}
            className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg"
            style={{ fontFamily: 'Poppins', fontWeight: 500 }}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!hasSubjects) {
    return (
      <StudentAnalyticsEmptyState
        message="No subjects found yet."
        hint="Subjects will appear after your registrar assigns your official schedule."
      />
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6" style={{ fontFamily: 'Poppins' }}>
      <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl p-5 sm:p-6 space-y-4 text-white">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1
            className="text-2xl flex items-center gap-3"
            style={{ fontFamily: 'Poppins', fontWeight: 500 }}
          >
            <span className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
              <GraduationCap size={24} weight="fill" className="text-blue-900" />
            </span>
            Student Performance Overview
          </h1>
          {studentName && (
            <p
              className="text-sm text-blue-100"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              {studentName}
            </p>
          )}
        </div>
        <p
          className="text-sm text-blue-100/90"
          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
        >
          Track your grades, discover strongest subjects, and identify areas that need attention.
        </p>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/95 rounded-lg border border-blue-700">
            <Calendar size={14} className="text-blue-900" weight="bold" />
            <span className="text-xs font-semibold text-blue-900 tracking-wide">
              AY {enrollment.enrollmentInfo?.schoolYear || '—'}
            </span>
          </div>
          {analytics.semester && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/95 rounded-lg border border-blue-700">
              <Calendar size={14} className="text-blue-900" weight="bold" />
              <span className="text-xs font-semibold text-blue-900 tracking-wide capitalize">
                {analytics.semester === 'first-sem' ? '1st Semester' : '2nd Semester'}
              </span>
            </div>
          )}
          {analytics.level && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/95 rounded-lg border border-blue-700">
              <Calendar size={14} className="text-blue-900" weight="bold" />
              <span className="text-xs font-semibold text-blue-900 tracking-wide capitalize">
                {analytics.level === 'college'
                  ? 'College'
                  : analytics.level === 'senior'
                  ? 'Senior High'
                  : 'Junior High'}
              </span>
            </div>
          )}
        </div>
      </div>

      <SummaryCards analytics={analytics} />

      {hasCompletedGrades ? (
        <>
          {(analytics.bestSubject || analytics.strugglingSubject) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analytics.bestSubject && (
                <div className="bg-white/95 border border-green-100 rounded-xl p-4 shadow-sm">
                  <p
                    className="text-xs uppercase text-green-700 tracking-wide"
                    style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                  >
                    Strongest Subject
                  </p>
                  <p
                    className="text-lg text-gray-900"
                    style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                  >
                    {analytics.bestSubject.subjectName}
                  </p>
                  <p
                    className="text-sm text-green-700"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    {analytics.bestSubject.average?.toFixed(1)}%
                  </p>
                </div>
              )}
              {analytics.strugglingSubject && (
                <div className="bg-white/95 border border-yellow-100 rounded-xl p-4 shadow-sm">
                  <p
                    className="text-xs uppercase text-yellow-700 tracking-wide"
                    style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                  >
                    Needs Attention
                  </p>
                  <p
                    className="text-lg text-gray-900"
                    style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                  >
                    {analytics.strugglingSubject.subjectName}
                  </p>
                  <p
                    className="text-sm text-yellow-700"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    {analytics.strugglingSubject.average?.toFixed(1)}%
                  </p>
                </div>
              )}
            </div>
          )}

          <ChartsGrid analytics={analytics} />
        </>
      ) : (
        <StudentAnalyticsEmptyState
          message="Analytics will appear once your teachers post grades."
          hint="Check back after each grading period to see live insights."
        />
      )}
    </div>
  )
}


