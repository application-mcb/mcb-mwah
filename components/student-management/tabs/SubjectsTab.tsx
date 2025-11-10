'use client'

import React from 'react'
import { ExtendedEnrollmentData, SubjectSetData, SubjectAssignmentData } from '../types'
import { SubjectData } from '@/lib/subject-database'
import { GraduationCapIcon } from '@phosphor-icons/react'

interface SubjectsTabProps {
  viewingEnrollment: ExtendedEnrollmentData | null
  subjectSets: Record<number, SubjectSetData[]>
  subjects: Record<string, SubjectData>
  subjectAssignments: SubjectAssignmentData[]
}

export default function SubjectsTab({
  viewingEnrollment,
  subjectSets,
  subjects,
  subjectAssignments,
}: SubjectsTabProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
        <div className="w-6 h-6 aspect-square bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg flex items-center justify-center">
          <GraduationCapIcon
            size={14}
            weight="fill"
            className="text-white"
          />
        </div>
        Currently Assigned Subjects
      </h3>
      {(() => {
        const enrollmentInfo = viewingEnrollment?.enrollmentInfo
        let gradeSubjectSets: SubjectSetData[] = []
        let displayLevel: string = ''
        let assignedSubjectIds: string[] = []

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
              gradeSubjectSets = [subjectSet]
              assignedSubjectIds = subjectSet.subjects
            }
          }

          const semesterDisplay =
            enrollmentInfo.semester === 'first-sem'
              ? 'Q1'
              : enrollmentInfo.semester === 'second-sem'
              ? 'Q2'
              : ''
          displayLevel = `${enrollmentInfo.courseCode || 'N/A'} ${
            enrollmentInfo.yearLevel || 'N/A'
          }${semesterDisplay ? ` ${semesterDisplay}` : ''}`
        } else {
          // High school logic - find assignment for this grade level
          const gradeLevel = enrollmentInfo?.gradeLevel
          if (!gradeLevel) {
            return (
              <div className="bg-gray-50 border border-gray-200 p-4 text-center rounded-xl">
                <p className="text-gray-500">
                  No grade level information available
                </p>
              </div>
            )
          }

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
              gradeSubjectSets = [subjectSet]
              assignedSubjectIds = subjectSet.subjects
            }
          }

          displayLevel = `Grade ${gradeLevel}`
        }

        if (
          gradeSubjectSets.length === 0 ||
          assignedSubjectIds.length === 0
        ) {
          return (
            <div className="bg-gray-50 border border-gray-200 p-4 text-center rounded-xl">
              <p className="text-gray-500">
                No subject assignment found for {displayLevel}. Please
                create a subject assignment in Subject Management.
              </p>
            </div>
          )
        }

        return (
          <div className="space-y-4">
            <div className="bg-white p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-md font-medium text-blue-900">
                  Assigned Subjects ({assignedSubjectIds.length})
                </h4>
                <span className="text-xs text-blue-900">
                  {displayLevel}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {assignedSubjectIds.map((subjectId) => {
                  const subject = subjects[subjectId]
                  if (!subject) return null
                  return (
                    <div
                      key={subjectId}
                      className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded"
                    >
                      <div
                        className={`w-4 h-4 rounded-sm border-${subject.color} bg-${subject.color} flex-shrink-0`}
                      ></div>
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
                  )
                })}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
