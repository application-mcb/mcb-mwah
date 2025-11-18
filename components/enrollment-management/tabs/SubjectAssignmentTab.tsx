'use client'

import React from 'react'
import {
  ExtendedEnrollmentData,
  SubjectSetData,
  SubjectAssignmentData,
} from '../types'
import { toast } from 'react-toastify'
import {
  GraduationCap as GraduationCapIcon,
  FunnelSimple,
  X,
  BookOpen,
  Flask,
  Calculator,
} from '@phosphor-icons/react'
import { getBgColor } from '../utils/color'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface SubjectData {
  id: string
  name: string
  code?: string
  color: string
  gradeLevels?: number[]
  gradeLevel?: number | string
  lectureUnits?: number
  labUnits?: number
  totalUnits?: number
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
  const [searchQuery, setSearchQuery] = React.useState('')
  const [showFilterDropdown, setShowFilterDropdown] = React.useState(false)
  const [filterSubjectSet, setFilterSubjectSet] = React.useState<string>('')
  const [filterGrade, setFilterGrade] = React.useState<string>('')

  if (!viewingEnrollment) return null

  // Helper function to create gradient from color
  const getGradientBackground = (color: string): string => {
    const baseColor = getBgColor(color)
    // Convert hex to rgb and darken for gradient
    const hex = baseColor.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    // Darken by 25% for gradient end
    const darken = 0.25
    const rDark = Math.max(0, Math.floor(r * (1 - darken)))
    const gDark = Math.max(0, Math.floor(g * (1 - darken)))
    const bDark = Math.max(0, Math.floor(b * (1 - darken)))
    return `linear-gradient(135deg, ${baseColor} 0%, rgb(${rDark}, ${gDark}, ${bDark}) 100%)`
  }

  // Filter function for subjects
  const filterSubjects = (subjectIds: string[]): string[] => {
    return subjectIds.filter((subjectId) => {
      const subject = subjects[subjectId]
      if (!subject) return false

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchesCode = subject.code?.toLowerCase().includes(query)
        const matchesName = subject.name?.toLowerCase().includes(query)
        if (!matchesCode && !matchesName) return false
      }

      // Subject set filter
      if (filterSubjectSet) {
        const set = allSubjectSets.find((s) => s.id === filterSubjectSet)
        if (!set?.subjects.includes(subjectId)) return false
      }

      // Grade filter (only for high school)
      if (
        filterGrade &&
        viewingEnrollment?.enrollmentInfo?.level === 'high-school'
      ) {
        const gradeNum = parseInt(filterGrade)
        // Check if subject belongs to this grade
        const belongsToGrade =
          subject.gradeLevels?.includes(gradeNum) ||
          (subject.gradeLevel &&
            parseInt(subject.gradeLevel.toString()) === gradeNum)
        if (!belongsToGrade) return false
      }

      return true
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-lg font-medium text-gray-900 flex items-center gap-2"
          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
        >
          <div className="w-6 h-6 bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl flex items-center justify-center">
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

      {/* Search and Filter Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search subjects by code or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 w-full border-gray-200 rounded-lg focus:border-blue-900 focus:ring-2 focus:ring-blue-900"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-2 ${
                filterSubjectSet || filterGrade
                  ? 'bg-gradient-to-br from-blue-900 to-blue-800 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-900'
              }`}
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              <FunnelSimple size={16} weight="bold" />
              Filter
              {(filterSubjectSet || filterGrade) && (
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
                <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 shadow-lg rounded-xl z-20 p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3
                        className="text-sm font-medium text-gray-900"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        Filter Subjects
                      </h3>
                      <button
                        onClick={() => setShowFilterDropdown(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {/* Subject Set Filter */}
                    <div>
                      <Label
                        className="text-xs text-gray-700 mb-2 block"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        Subject Set
                      </Label>
                      <select
                        value={filterSubjectSet}
                        onChange={(e) => setFilterSubjectSet(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        <option value="">All Subject Sets</option>
                        {allSubjectSets.map((set) => (
                          <option key={set.id} value={set.id}>
                            {set.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Grade Filter (only for high school) */}
                    {viewingEnrollment?.enrollmentInfo?.level ===
                      'high-school' && (
                      <div>
                        <Label
                          className="text-xs text-gray-700 mb-2 block"
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                        >
                          Grade Level
                        </Label>
                        <select
                          value={filterGrade}
                          onChange={(e) => setFilterGrade(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                        >
                          <option value="">All Grades</option>
                          {[7, 8, 9, 10, 11, 12].map((grade) => (
                            <option key={grade} value={grade.toString()}>
                              Grade {grade}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Clear Filters */}
                    {(filterSubjectSet || filterGrade) && (
                      <button
                        onClick={() => {
                          setFilterSubjectSet('')
                          setFilterGrade('')
                        }}
                        className="w-full px-3 py-2 text-xs text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
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
                const subjectColor = getBgColor(subject.color)
                return (
                  <div
                    key={`selected-${subjectId}-${index}`}
                    className="px-3 py-2 text-white text-xs rounded-lg"
                    style={{
                      background: getGradientBackground(subject.color),
                      borderColor: subjectColor,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                      <span
                        className="font-medium"
                        style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                      >
                        {subject.code} {subject.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                      >
                        <BookOpen size={10} className="text-white" />
                        <span
                          className="text-xs"
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                        >
                          Lecture
                        </span>
                        <span
                          className="text-xs font-medium"
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                        >
                          {subject.lectureUnits || 0}
                        </span>
                      </div>
                      <div
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                      >
                        <Flask size={10} className="text-white" />
                        <span
                          className="text-xs"
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                        >
                          Lab
                        </span>
                        <span
                          className="text-xs font-medium"
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                        >
                          {subject.labUnits || 0}
                        </span>
                      </div>
                      <div
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                      >
                        <Calculator size={10} className="text-white" />
                        <span
                          className="text-xs"
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                        >
                          Total
                        </span>
                        <span
                          className="text-xs font-medium"
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                        >
                          {subject.totalUnits ||
                            (subject.lectureUnits || 0) +
                              (subject.labUnits || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })
            })()}
          </div>
          {/* Total Units Summary */}
          {(() => {
            const loadedSubjects = Array.from(new Set(selectedSubjects)).filter(
              (subjectId) => subjects[subjectId]
            )

            const totalLectureUnits = loadedSubjects.reduce(
              (sum, subjectId) => {
                const subject = subjects[subjectId]
                return sum + (subject?.lectureUnits || 0)
              },
              0
            )

            const totalLabUnits = loadedSubjects.reduce((sum, subjectId) => {
              const subject = subjects[subjectId]
              return sum + (subject?.labUnits || 0)
            }, 0)

            const totalUnits = loadedSubjects.reduce((sum, subjectId) => {
              const subject = subjects[subjectId]
              return (
                sum +
                (subject?.totalUnits ||
                  (subject?.lectureUnits || 0) + (subject?.labUnits || 0))
              )
            }, 0)

            const isOverload = totalUnits > 30

            return (
              <div className="mt-4 pt-4 border-t border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-2 bg-blue-900 rounded-lg">
                    <BookOpen size={14} className="text-white" />
                    <span
                      className="text-xs text-white"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      Lecture
                    </span>
                    <span
                      className="text-xs font-medium text-white"
                      style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                    >
                      {totalLectureUnits}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-blue-900 rounded-lg">
                    <Flask size={14} className="text-white" />
                    <span
                      className="text-xs text-white"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      Lab
                    </span>
                    <span
                      className="text-xs font-medium text-white"
                      style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                    >
                      {totalLabUnits}
                    </span>
                  </div>
                  <div
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                      isOverload ? 'bg-red-700' : 'bg-blue-900'
                    }`}
                  >
                    <Calculator size={14} className="text-white" />
                    <span
                      className="text-xs text-white"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      Total
                    </span>
                    <span
                      className="text-xs font-medium text-white"
                      style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                    >
                      {totalUnits}
                    </span>
                    {isOverload && (
                      <span
                        className="text-xs font-medium text-white ml-1"
                        style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                      >
                        (Overload)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })()}
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
              {sortedSubjectSets.map((subjectSet) => {
                const isSubjectSetSelected = selectedSubjectSets.includes(
                  subjectSet.id
                )
                return (
                  <div
                    key={subjectSet.id}
                    className={`bg-white border-2 p-4 cursor-pointer transition-all duration-300 animate-fadeInUp hover:scale-[1.02] rounded-xl ${
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
                        className={`w-5 h-5 border-2 flex items-center justify-center rounded ${
                          isSubjectSetSelected
                            ? 'border-blue-900 bg-gradient-to-br from-blue-900 to-blue-800'
                            : 'border-gray-300'
                        }`}
                      >
                        {isSubjectSetSelected && (
                          <div className="w-2 h-2 bg-white"></div>
                        )}
                      </div>
                      <div
                        className="w-4 h-4 flex items-center justify-center rounded"
                        style={{
                          backgroundColor: getBgColor(subjectSet.color),
                        }}
                      >
                        <div className="w-2 h-2 bg-white rounded-full"></div>
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
                      {filterSubjects(subjectSet.subjects).length === 0 ? (
                        <div
                          className="col-span-full py-4 text-center text-xs text-gray-500"
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                        >
                          No subjects match the current filters.
                        </div>
                      ) : (
                        filterSubjects(subjectSet.subjects).map((subjectId) => {
                          const subject = subjects[subjectId]
                          if (!subject) return null
                          const isSubjectSelected =
                            selectedSubjects.includes(subjectId)
                          const subjectColor = getBgColor(subject.color)
                          return (
                            <div
                              key={subjectId}
                              className={`p-3 border cursor-pointer transition-colors rounded-lg ${
                                isSubjectSelected
                                  ? 'border-gray-300'
                                  : 'bg-white border-gray-200 hover:bg-gray-50'
                              }`}
                              style={
                                isSubjectSelected
                                  ? {
                                      background: getGradientBackground(
                                        subject.color
                                      ),
                                    }
                                  : {}
                              }
                              onClick={() => handleSubjectToggle(subjectId)}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <div
                                  className="w-3 h-3 rounded"
                                  style={{
                                    backgroundColor: subjectColor,
                                  }}
                                ></div>
                                <span
                                  className={`text-xs ${
                                    isSubjectSelected
                                      ? 'text-white font-medium'
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
                              <div className="flex items-center gap-2">
                                <div
                                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded ${
                                    isSubjectSelected ? '' : 'bg-gray-700'
                                  }`}
                                  style={
                                    isSubjectSelected
                                      ? {
                                          backgroundColor:
                                            'rgba(255, 255, 255, 0.2)',
                                        }
                                      : {}
                                  }
                                >
                                  <BookOpen
                                    size={12}
                                    className={
                                      isSubjectSelected
                                        ? 'text-white'
                                        : 'text-white'
                                    }
                                  />
                                  <span
                                    className="text-xs"
                                    style={{
                                      fontFamily: 'Poppins',
                                      fontWeight: 400,
                                      color: '#ffffff',
                                    }}
                                  >
                                    Lecture
                                  </span>
                                  <span
                                    className="text-xs font-medium"
                                    style={{
                                      fontFamily: 'Poppins',
                                      fontWeight: 400,
                                      color: '#ffffff',
                                    }}
                                  >
                                    {subject.lectureUnits || 0}
                                  </span>
                                </div>
                                <div
                                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded ${
                                    isSubjectSelected ? '' : 'bg-gray-700'
                                  }`}
                                  style={
                                    isSubjectSelected
                                      ? {
                                          backgroundColor:
                                            'rgba(255, 255, 255, 0.2)',
                                        }
                                      : {}
                                  }
                                >
                                  <Flask
                                    size={12}
                                    className={
                                      isSubjectSelected
                                        ? 'text-white'
                                        : 'text-white'
                                    }
                                  />
                                  <span
                                    className="text-xs"
                                    style={{
                                      fontFamily: 'Poppins',
                                      fontWeight: 400,
                                      color: '#ffffff',
                                    }}
                                  >
                                    Lab
                                  </span>
                                  <span
                                    className="text-xs font-medium"
                                    style={{
                                      fontFamily: 'Poppins',
                                      fontWeight: 400,
                                      color: '#ffffff',
                                    }}
                                  >
                                    {subject.labUnits || 0}
                                  </span>
                                </div>
                                <div
                                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded ${
                                    isSubjectSelected ? '' : 'bg-gray-700'
                                  }`}
                                  style={
                                    isSubjectSelected
                                      ? {
                                          backgroundColor:
                                            'rgba(255, 255, 255, 0.2)',
                                        }
                                      : {}
                                  }
                                >
                                  <Calculator
                                    size={12}
                                    className={
                                      isSubjectSelected
                                        ? 'text-white'
                                        : 'text-white'
                                    }
                                  />
                                  <span
                                    className="text-xs"
                                    style={{
                                      fontFamily: 'Poppins',
                                      fontWeight: 400,
                                      color: '#ffffff',
                                    }}
                                  >
                                    Total
                                  </span>
                                  <span
                                    className="text-xs font-medium"
                                    style={{
                                      fontFamily: 'Poppins',
                                      fontWeight: 400,
                                      color: '#ffffff',
                                    }}
                                  >
                                    {subject.totalUnits ||
                                      (subject.lectureUnits || 0) +
                                        (subject.labUnits || 0)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )
                        })
                      )}
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
                  className={`bg-white border-2 p-4 cursor-pointer transition-all duration-300 animate-fadeInUp hover:scale-[1.02] rounded-xl ${
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
                      className={`w-5 h-5 border-2 flex items-center justify-center rounded ${
                        isSubjectSetSelected
                          ? 'border-blue-900 bg-gradient-to-br from-blue-900 to-blue-800'
                          : 'border-gray-300'
                      }`}
                    >
                      {isSubjectSetSelected && (
                        <div className="w-2 h-2 bg-white"></div>
                      )}
                    </div>
                    <div
                      className="w-4 h-4 flex items-center justify-center rounded"
                      style={{ backgroundColor: getBgColor(subjectSet.color) }}
                    >
                      <div className="w-2 h-2 bg-white rounded-full"></div>
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
                    {filterSubjects(subjectSet.subjects).length === 0 ? (
                      <div
                        className="col-span-full py-4 text-center text-xs text-gray-500"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        No subjects match the current filters.
                      </div>
                    ) : (
                      filterSubjects(subjectSet.subjects).map((subjectId) => {
                        const subject = subjects[subjectId]
                        if (!subject) return null
                        const isSubjectSelected =
                          selectedSubjects.includes(subjectId)
                        return (
                          <div
                            key={subjectId}
                            className={`p-3 border cursor-pointer transition-colors rounded-lg ${
                              isSubjectSelected
                                ? 'bg-gray-100 border-gray-300'
                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                            }`}
                            onClick={() => handleSubjectToggle(subjectId)}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <div
                                className="w-3 h-3 rounded"
                                style={{
                                  backgroundColor: getBgColor(subject.color),
                                }}
                              ></div>
                              <span
                                className={`text-xs ${
                                  isSubjectSelected
                                    ? 'text-gray-900 font-medium'
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
                            <div className="flex items-center gap-2">
                              <div
                                className={`flex items-center gap-1.5 px-2 py-1.5 rounded ${
                                  isSubjectSelected ? 'bg-white' : 'bg-gray-700'
                                }`}
                              >
                                <BookOpen
                                  size={12}
                                  className={
                                    isSubjectSelected
                                      ? 'text-gray-600'
                                      : 'text-white'
                                  }
                                />
                                <span
                                  className="text-xs"
                                  style={{
                                    fontFamily: 'Poppins',
                                    fontWeight: 400,
                                    color: isSubjectSelected
                                      ? '#4b5563'
                                      : '#ffffff',
                                  }}
                                >
                                  Lecture
                                </span>
                                <span
                                  className="text-xs font-medium"
                                  style={{
                                    fontFamily: 'Poppins',
                                    fontWeight: 400,
                                    color: isSubjectSelected
                                      ? '#4b5563'
                                      : '#ffffff',
                                  }}
                                >
                                  {subject.lectureUnits || 0}
                                </span>
                              </div>
                              <div
                                className={`flex items-center gap-1.5 px-2 py-1.5 rounded ${
                                  isSubjectSelected ? 'bg-white' : 'bg-gray-700'
                                }`}
                              >
                                <Flask
                                  size={12}
                                  className={
                                    isSubjectSelected
                                      ? 'text-gray-600'
                                      : 'text-white'
                                  }
                                />
                                <span
                                  className="text-xs"
                                  style={{
                                    fontFamily: 'Poppins',
                                    fontWeight: 400,
                                    color: isSubjectSelected
                                      ? '#4b5563'
                                      : '#ffffff',
                                  }}
                                >
                                  Lab
                                </span>
                                <span
                                  className="text-xs font-medium"
                                  style={{
                                    fontFamily: 'Poppins',
                                    fontWeight: 400,
                                    color: isSubjectSelected
                                      ? '#4b5563'
                                      : '#ffffff',
                                  }}
                                >
                                  {subject.labUnits || 0}
                                </span>
                              </div>
                              <div
                                className={`flex items-center gap-1.5 px-2 py-1.5 rounded ${
                                  isSubjectSelected ? 'bg-white' : 'bg-gray-700'
                                }`}
                              >
                                <Calculator
                                  size={12}
                                  className={
                                    isSubjectSelected
                                      ? 'text-gray-600'
                                      : 'text-white'
                                  }
                                />
                                <span
                                  className="text-xs"
                                  style={{
                                    fontFamily: 'Poppins',
                                    fontWeight: 400,
                                    color: isSubjectSelected
                                      ? '#4b5563'
                                      : '#ffffff',
                                  }}
                                >
                                  Total
                                </span>
                                <span
                                  className="text-xs font-medium"
                                  style={{
                                    fontFamily: 'Poppins',
                                    fontWeight: 400,
                                    color: isSubjectSelected
                                      ? '#4b5563'
                                      : '#ffffff',
                                  }}
                                >
                                  {subject.totalUnits ||
                                    (subject.lectureUnits || 0) +
                                      (subject.labUnits || 0)}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
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
            <div className="w-6 h-6 bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl flex items-center justify-center">
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
                        className={`bg-white border-2 p-4 cursor-pointer transition-all duration-300 hover:scale-[1.02] rounded-xl ${
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
                            className={`w-5 h-5 border-2 flex items-center justify-center rounded ${
                              isSubjectSetSelected
                                ? 'border-blue-900 bg-gradient-to-br from-blue-900 to-blue-800'
                                : 'border-gray-300'
                            }`}
                          >
                            {isSubjectSetSelected && (
                              <div className="w-2 h-2 bg-white"></div>
                            )}
                          </div>
                          <div
                            className="w-4 h-4 flex items-center justify-center rounded"
                            style={{
                              backgroundColor: getBgColor(subjectSet.color),
                            }}
                          >
                            <div className="w-2 h-2 bg-white rounded-full"></div>
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
                          {filterSubjects(subjectSet.subjects).length === 0 ? (
                            <div
                              className="col-span-full py-4 text-center text-xs text-gray-500"
                              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                            >
                              No subjects match the current filters.
                            </div>
                          ) : (
                            filterSubjects(subjectSet.subjects).map(
                              (subjectId) => {
                                const subject = subjects[subjectId]
                                if (!subject) return null
                                const isSubjectSelected =
                                  selectedSubjects.includes(subjectId)
                                return (
                                  <div
                                    key={subjectId}
                                    className={`p-3 border cursor-pointer transition-colors rounded-lg ${
                                      isSubjectSelected
                                        ? 'bg-gray-100 border-gray-300'
                                        : 'bg-white border-gray-200 hover:bg-gray-50'
                                    }`}
                                    onClick={() =>
                                      handleSubjectToggle(subjectId)
                                    }
                                  >
                                    <div className="flex items-center gap-2 mb-2">
                                      <div
                                        className="w-3 h-3 rounded"
                                        style={{
                                          backgroundColor: getBgColor(
                                            subject.color
                                          ),
                                        }}
                                      ></div>
                                      <span
                                        className={`text-xs ${
                                          isSubjectSelected
                                            ? 'text-gray-900 font-medium'
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
                                    <div className="flex items-center gap-2">
                                      <div
                                        className={`flex items-center gap-1.5 px-2 py-1.5 rounded ${
                                          isSubjectSelected
                                            ? 'bg-white'
                                            : 'bg-gray-700'
                                        }`}
                                      >
                                        <BookOpen
                                          size={12}
                                          className={
                                            isSubjectSelected
                                              ? 'text-gray-600'
                                              : 'text-white'
                                          }
                                        />
                                        <span
                                          className="text-xs"
                                          style={{
                                            fontFamily: 'Poppins',
                                            fontWeight: 400,
                                            color: isSubjectSelected
                                              ? '#4b5563'
                                              : '#ffffff',
                                          }}
                                        >
                                          Lecture
                                        </span>
                                        <span
                                          className="text-xs font-medium"
                                          style={{
                                            fontFamily: 'Poppins',
                                            fontWeight: 400,
                                            color: isSubjectSelected
                                              ? '#4b5563'
                                              : '#ffffff',
                                          }}
                                        >
                                          {subject.lectureUnits || 0}
                                        </span>
                                      </div>
                                      <div
                                        className={`flex items-center gap-1.5 px-2 py-1.5 rounded ${
                                          isSubjectSelected
                                            ? 'bg-white'
                                            : 'bg-gray-700'
                                        }`}
                                      >
                                        <Flask
                                          size={12}
                                          className={
                                            isSubjectSelected
                                              ? 'text-gray-600'
                                              : 'text-white'
                                          }
                                        />
                                        <span
                                          className="text-xs"
                                          style={{
                                            fontFamily: 'Poppins',
                                            fontWeight: 400,
                                            color: isSubjectSelected
                                              ? '#4b5563'
                                              : '#ffffff',
                                          }}
                                        >
                                          Lab
                                        </span>
                                        <span
                                          className="text-xs font-medium"
                                          style={{
                                            fontFamily: 'Poppins',
                                            fontWeight: 400,
                                            color: isSubjectSelected
                                              ? '#4b5563'
                                              : '#ffffff',
                                          }}
                                        >
                                          {subject.labUnits || 0}
                                        </span>
                                      </div>
                                      <div
                                        className={`flex items-center gap-1.5 px-2 py-1.5 rounded ${
                                          isSubjectSelected
                                            ? 'bg-white'
                                            : 'bg-gray-700'
                                        }`}
                                      >
                                        <Calculator
                                          size={12}
                                          className={
                                            isSubjectSelected
                                              ? 'text-gray-600'
                                              : 'text-white'
                                          }
                                        />
                                        <span
                                          className="text-xs"
                                          style={{
                                            fontFamily: 'Poppins',
                                            fontWeight: 400,
                                            color: isSubjectSelected
                                              ? '#4b5563'
                                              : '#ffffff',
                                          }}
                                        >
                                          Total
                                        </span>
                                        <span
                                          className="text-xs font-medium"
                                          style={{
                                            fontFamily: 'Poppins',
                                            fontWeight: 400,
                                            color: isSubjectSelected
                                              ? '#4b5563'
                                              : '#ffffff',
                                          }}
                                        >
                                          {subject.totalUnits ||
                                            (subject.lectureUnits || 0) +
                                              (subject.labUnits || 0)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )
                              }
                            )
                          )}
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
                          className={`bg-white border-2 p-4 cursor-pointer transition-all duration-300 hover:scale-[1.02] rounded-xl ${
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
                              className={`w-5 h-5 border-2 flex items-center justify-center rounded ${
                                isSubjectSetSelected
                                  ? 'border-blue-900 bg-gradient-to-br from-blue-900 to-blue-800'
                                  : 'border-gray-300'
                              }`}
                            >
                              {isSubjectSetSelected && (
                                <div className="w-2 h-2 bg-white"></div>
                              )}
                            </div>
                            <div
                              className="w-4 h-4 flex items-center justify-center rounded"
                              style={{
                                backgroundColor: getBgColor(subjectSet.color),
                              }}
                            >
                              <div className="w-2 h-2 bg-white rounded-full"></div>
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
                            {filterSubjects(subjectSet.subjects).length ===
                            0 ? (
                              <div
                                className="col-span-full py-4 text-center text-xs text-gray-500"
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 400,
                                }}
                              >
                                No subjects match the current filters.
                              </div>
                            ) : (
                              filterSubjects(subjectSet.subjects).map(
                                (subjectId) => {
                                  const subject = subjects[subjectId]
                                  if (!subject) return null
                                  const isSubjectSelected =
                                    selectedSubjects.includes(subjectId)
                                  return (
                                    <div
                                      key={subjectId}
                                      className={`p-3 border cursor-pointer transition-colors rounded-lg ${
                                        isSubjectSelected
                                          ? 'bg-gray-100 border-gray-300'
                                          : 'bg-white border-gray-200 hover:bg-gray-50'
                                      }`}
                                      onClick={() =>
                                        handleSubjectToggle(subjectId)
                                      }
                                    >
                                      <div className="flex items-center gap-2 mb-2">
                                        <div
                                          className="w-3 h-3 rounded"
                                          style={{
                                            backgroundColor: getBgColor(
                                              subject.color
                                            ),
                                          }}
                                        ></div>
                                        <span
                                          className={`text-xs ${
                                            isSubjectSelected
                                              ? 'text-gray-900 font-medium'
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
                                      <div className="flex items-center gap-2">
                                        <div
                                          className={`flex items-center gap-1.5 px-2 py-1.5 rounded ${
                                            isSubjectSelected
                                              ? 'bg-white'
                                              : 'bg-gray-700'
                                          }`}
                                        >
                                          <BookOpen
                                            size={12}
                                            className={
                                              isSubjectSelected
                                                ? 'text-gray-600'
                                                : 'text-white'
                                            }
                                          />
                                          <span
                                            className="text-xs"
                                            style={{
                                              fontFamily: 'Poppins',
                                              fontWeight: 400,
                                              color: isSubjectSelected
                                                ? '#4b5563'
                                                : '#ffffff',
                                            }}
                                          >
                                            Lecture
                                          </span>
                                          <span
                                            className="text-xs font-medium"
                                            style={{
                                              fontFamily: 'Poppins',
                                              fontWeight: 400,
                                              color: isSubjectSelected
                                                ? '#4b5563'
                                                : '#ffffff',
                                            }}
                                          >
                                            {subject.lectureUnits || 0}
                                          </span>
                                        </div>
                                        <div
                                          className={`flex items-center gap-1.5 px-2 py-1.5 rounded ${
                                            isSubjectSelected
                                              ? 'bg-white'
                                              : 'bg-gray-700'
                                          }`}
                                        >
                                          <Flask
                                            size={12}
                                            className={
                                              isSubjectSelected
                                                ? 'text-gray-600'
                                                : 'text-white'
                                            }
                                          />
                                          <span
                                            className="text-xs"
                                            style={{
                                              fontFamily: 'Poppins',
                                              fontWeight: 400,
                                              color: isSubjectSelected
                                                ? '#4b5563'
                                                : '#ffffff',
                                            }}
                                          >
                                            Lab
                                          </span>
                                          <span
                                            className="text-xs font-medium"
                                            style={{
                                              fontFamily: 'Poppins',
                                              fontWeight: 400,
                                              color: isSubjectSelected
                                                ? '#4b5563'
                                                : '#ffffff',
                                            }}
                                          >
                                            {subject.labUnits || 0}
                                          </span>
                                        </div>
                                        <div
                                          className={`flex items-center gap-1.5 px-2 py-1.5 rounded ${
                                            isSubjectSelected
                                              ? 'bg-white'
                                              : 'bg-gray-700'
                                          }`}
                                        >
                                          <Calculator
                                            size={12}
                                            className={
                                              isSubjectSelected
                                                ? 'text-gray-600'
                                                : 'text-white'
                                            }
                                          />
                                          <span
                                            className="text-xs"
                                            style={{
                                              fontFamily: 'Poppins',
                                              fontWeight: 400,
                                              color: isSubjectSelected
                                                ? '#4b5563'
                                                : '#ffffff',
                                            }}
                                          >
                                            Total
                                          </span>
                                          <span
                                            className="text-xs font-medium"
                                            style={{
                                              fontFamily: 'Poppins',
                                              fontWeight: 400,
                                              color: isSubjectSelected
                                                ? '#4b5563'
                                                : '#ffffff',
                                            }}
                                          >
                                            {subject.totalUnits ||
                                              (subject.lectureUnits || 0) +
                                                (subject.labUnits || 0)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  )
                                }
                              )
                            )}
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
    </div>
  )
}

export default SubjectAssignmentTab
