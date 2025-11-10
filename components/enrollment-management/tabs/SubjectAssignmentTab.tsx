'use client'

import React from 'react'
import {
  ExtendedEnrollmentData,
  SubjectSetData,
  SubjectAssignmentData,
} from '../types'
import { toast } from 'react-toastify'
import { GraduationCap as GraduationCapIcon } from '@phosphor-icons/react'

interface SubjectData {
  id: string
  name: string
  code?: string
  color: string
}

// types moved to ../types

interface Props {
  viewingEnrollment: ExtendedEnrollmentData | null
  subjects: Record<string, SubjectData>
  subjectSetsByGrade: Record<number, SubjectSetData[]>
  allSubjectSets: SubjectSetData[]
  subjectAssignments: SubjectAssignmentData[]
  selectedSubjectSets: string[]
  selectedSubjects: string[]
  setSelectedSubjectSets: (updater: (prev: string[]) => string[]) => void
  setSelectedSubjects: (updater: (prev: string[]) => string[]) => void
  showOtherSets: boolean
  setShowOtherSets: (value: boolean) => void
  handleSubjectSetToggle: (subjectSetId: string, subjectIds: string[]) => void
  handleSubjectToggle: (subjectId: string) => void
}

const SubjectAssignmentTab: React.FC<Props> = ({
  viewingEnrollment,
  subjects,
  subjectSetsByGrade,
  allSubjectSets,
  subjectAssignments,
  selectedSubjectSets,
  selectedSubjects,
  setSelectedSubjectSets,
  setSelectedSubjects,
  showOtherSets,
  setShowOtherSets,
  handleSubjectSetToggle,
  handleSubjectToggle,
}) => {
  if (!viewingEnrollment) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-lg font-medium text-gray-900 flex items-center gap-2"
          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
        >
          <div className="w-6 h-6 bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg flex items-center justify-center">
            <GraduationCapIcon size={14} weight="fill" className="text-white" />
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
        <div className="bg-white border border-blue-200 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4
              className="text-md font-medium text-blue-900"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Selected Subjects:
            </h4>
            <button
              onClick={() => {
                setSelectedSubjectSets(() => [])
                setSelectedSubjects(() => [])
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

              const assignedSet = allSubjectSets.find(
                (set) => set.id === assignedSubjectSetId
              )
              const assignedSubjectIds = assignedSet?.subjects || []

              const loadedSubjects = Array.from(
                new Set(selectedSubjects)
              ).filter((subjectId) => subjects[subjectId])
              const hasUnloadedSubjects =
                selectedSubjects.length > 0 && loadedSubjects.length === 0
              if (hasUnloadedSubjects || selectedSubjects.length === 0) {
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

              const sortedSubjects = [...loadedSubjects].sort((a, b) => {
                const aIsAssigned = assignedSubjectIds.includes(a)
                const bIsAssigned = assignedSubjectIds.includes(b)
                if (aIsAssigned && !bIsAssigned) return -1
                if (!aIsAssigned && bIsAssigned) return 1
                return 0
              })

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

        if (enrollmentInfo?.level === 'college') {
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

          const assignedSubjectSetId = assignment?.subjectSetId
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
              <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
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
                  className="text-blue-900 text-xs"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Showing all subject sets for college student: {courseCode} -{' '}
                  {enrollmentInfo.courseName} (Year {yearLevel}){' '}
                  {semesterDisplay && `• ${semesterDisplay}`}
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
                            ? 'border-blue-900 bg-gradient-to-br from-blue-800 to-blue-900'
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
                                : 'bg-white border-gray-200 hover:bg-white'
                            }`}
                            onClick={() => handleSubjectToggle(subjectId)}
                          >
                            <div
                              className={`w-3 h-3 border flex items-center justify-center ${
                                isSubjectSelected
                                  ? 'border-blue-900 bg-gradient-to-br from-blue-800 to-blue-900'
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
                              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
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

        // High school (JHS and SHS)
        const gradeLevel = viewingEnrollment?.enrollmentInfo?.gradeLevel
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
        const hsEnrollmentInfo = viewingEnrollment?.enrollmentInfo
        const isSHS = hsEnrollmentInfo?.department === 'SHS'

        // Find assignment - for SHS, also match semester and strand
        const assignment = subjectAssignments.find((assignment) => {
          if (assignment.level !== 'high-school') return false
          if (assignment.gradeLevel !== gradeLevelNum) return false

          // For SHS, also check semester and strand
          if (isSHS) {
            return (
              assignment.semester === hsEnrollmentInfo?.semester &&
              assignment.strand === hsEnrollmentInfo?.strand
            )
          }
          // For JHS, no semester/strand check
          return true
        })
        const assignedSubjectSetId = assignment?.subjectSetId

        const gradeSubjectSets = allSubjectSets.filter((subjectSet) => {
          if (subjectSet.gradeLevel === gradeLevelNum) return true
          if (
            subjectSet.gradeLevels &&
            subjectSet.gradeLevels.includes(gradeLevelNum)
          )
            return true
          return false
        })

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
                      handleSubjectSetToggle(subjectSet.id, subjectSet.subjects)
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
                                ? 'border-blue-900 bg-gradient-to-br from-blue-800 to-blue-900'
                                : 'border-gray-300'
                            }`}
                          >
                            {isSubjectSelected && (
                              <div className="w-1 h-1 bg-white"></div>
                            )}
                          </div>
                          <div className={`w-3 h-3 bg-${subject.color}`}></div>
                          <span
                            className={`text-xs ${
                              isSubjectSelected
                                ? 'text-blue-900 font-medium'
                                : 'text-gray-700'
                            }`}
                            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
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

      <div className="mt-6 pt-4 border-t border-gray-200">
        <button
          onClick={() => setShowOtherSets(!showOtherSets)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white hover:bg-white border border-gray-200 hover:border-blue-300 text-gray-700 text-xs font-medium transition-colors"
          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
        >
          <div className="w-4 h-4 bg-gray-600 flex items-center justify-center">
            <div className="w-2 h-2 bg-white"></div>
          </div>
          {showOtherSets ? 'Hide Other Sets' : 'Show Other Sets'}
        </button>
      </div>

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
            const enrollmentInfo = viewingEnrollment?.enrollmentInfo

            // For college students, show all sets (they're already shown above, but allow selection)
            if (enrollmentInfo?.level === 'college') {
              // Get already displayed sets to exclude duplicates
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

              const assignedSubjectSetId = assignment?.subjectSetId
              const alreadyShownSetIds = assignedSubjectSetId
                ? [assignedSubjectSetId]
                : []

              // Show all other sets (from other courses/years/semesters)
              const otherSets = allSubjectSets.filter(
                (set) => !alreadyShownSetIds.includes(set.id)
              )

              if (otherSets.length === 0) {
                return (
                  <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                    <p
                      className="text-gray-500"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      No other subject sets available
                    </p>
                  </div>
                )
              }

              return (
                <div className="space-y-3">
                  {otherSets.map((subjectSet) => {
                    const isSubjectSetSelected = selectedSubjectSets.includes(
                      subjectSet.id
                    )
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
                                ? 'border-blue-900 bg-gradient-to-br from-blue-800 to-blue-900'
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
                                    : 'bg-white border-gray-200 hover:bg-gray-50'
                                }`}
                                onClick={() => handleSubjectToggle(subjectId)}
                              >
                                <div
                                  className={`w-3 h-3 border flex items-center justify-center ${
                                    isSubjectSelected
                                      ? 'border-blue-900 bg-gradient-to-br from-blue-800 to-blue-900'
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

            // For high school students (JHS and SHS)
            const currentGrade = enrollmentInfo?.gradeLevel
            const currentGradeNum = currentGrade ? parseInt(currentGrade) : null

            // Get already displayed sets for current grade
            let alreadyShownSetIds: string[] = []
            if (currentGradeNum) {
              const assignment = subjectAssignments.find((assignment) => {
                if (assignment.level !== 'high-school') return false
                if (assignment.gradeLevel !== currentGradeNum) return false

                // For SHS, also check semester and strand
                if (enrollmentInfo?.department === 'SHS') {
                  return (
                    assignment.semester === enrollmentInfo.semester &&
                    assignment.strand === enrollmentInfo.strand
                  )
                }
                // For JHS, no semester/strand check
                return true
              })
              if (assignment?.subjectSetId) {
                alreadyShownSetIds = [assignment.subjectSetId]
              }
            }

            // Show all subject sets from all grades, excluding already shown ones
            const allGrades = Object.entries(subjectSetsByGrade)

            if (allGrades.length === 0) {
              return (
                <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                  <p
                    className="text-gray-500"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    No other subject sets available
                  </p>
                </div>
              )
            }

            return allGrades.map(([grade, sets]) => {
              // Filter out already shown sets
              const filteredSets = (sets as SubjectSetData[]).filter(
                (set) => !alreadyShownSetIds.includes(set.id)
              )

              if (filteredSets.length === 0) return null

              return (
                <div key={grade} className="space-y-3">
                  <h5
                    className="text-md font-medium text-gray-700 border-b border-gray-200 pb-1"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Grade {grade}
                  </h5>
                  <div className="space-y-3">
                    {filteredSets.map((subjectSet) => {
                      const isSubjectSetSelected = selectedSubjectSets.includes(
                        subjectSet.id
                      )
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
                                  ? 'border-blue-900 bg-gradient-to-br from-blue-800 to-blue-900'
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
                                      : 'bg-white border-gray-200 hover:bg-gray-50'
                                  }`}
                                  onClick={() => handleSubjectToggle(subjectId)}
                                >
                                  <div
                                    className={`w-3 h-3 border flex items-center justify-center ${
                                      isSubjectSelected
                                        ? 'border-blue-900 bg-gradient-to-br from-blue-800 to-blue-900'
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
              )
            })
          })()}
        </div>
      )}

      {selectedSubjects.length > 0 && (
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={() => {
              // preserving original behavior (toast confirmation only)

              console.log('Saving selected subjects:', selectedSubjects)
              toast.success('Subject assignment has been saved successfully.', {
                autoClose: 5000,
              })
            }}
            className="px-4 py-2 rounded-lg bg-gradient-to-br from-blue-800 to-blue-900 text-white text-xs hover:from-blue-900 hover:to-blue-950 transition-colors"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            Save Assignment
          </button>
          <button
            onClick={() => {
              setSelectedSubjectSets(() => [])
              setSelectedSubjects(() => [])
              toast.info('Selection Reset', { autoClose: 4000 })
            }}
            className="px-4 py-2 rounded-lg bg-gray-500 text-white text-xs hover:bg-gray-600 transition-colors"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            Clear Selection
          </button>
        </div>
      )}
    </div>
  )
}

export default SubjectAssignmentTab
