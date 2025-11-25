'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  User,
  Users,
  GraduationCap,
  Gear,
  Eye,
  Printer,
  Sparkle,
} from '@phosphor-icons/react'
import {
  ExtendedEnrollmentData,
  StudentProfile,
  SubjectSetData,
  CourseData,
  GradeData,
} from './types'
import { SubjectData } from '@/lib/subject-database'
import { SubjectAssignmentData, SectionData } from './types'
import { formatFullName, getInitials } from './utils/format'
import { getEnrollmentDisplayInfo, getBgColor } from './utils/display'
import SkeletonTable from './SkeletonTable'

interface StudentsTableProps {
  showTableSkeleton: boolean
  paginatedEnrollments: (ExtendedEnrollmentData | null)[]
  allEnrollments: ExtendedEnrollmentData[]
  searchQuery: string
  studentProfiles: Record<string, StudentProfile>
  loadingImages: Record<string, boolean>
  sections: Record<string, SectionData[]>
  subjects: Record<string, SubjectData>
  subjectSets: Record<number, SubjectSetData[]>
  subjectAssignments: SubjectAssignmentData[]
  grades: Record<string, GradeData>
  courses: CourseData[]
  assigningSectionStudent: string | null
  loading: boolean
  onImageLoad: (userId: string) => void
  onImageError: (userId: string) => void
  onSectionChange: (
    enrollment: ExtendedEnrollmentData,
    sectionId: string
  ) => void
  onViewStudent: (enrollment: ExtendedEnrollmentData) => void
  onPrintStudent: (enrollment: ExtendedEnrollmentData) => void
  onOpenAIChat: (enrollment: ExtendedEnrollmentData) => void
}

const ActionMenu = ({
  enrollment,
  loading,
  onViewStudent,
  onOpenAIChat,
  onPrintStudent,
}: {
  enrollment: ExtendedEnrollmentData
  loading: boolean
  onViewStudent: (enrollment: ExtendedEnrollmentData) => void
  onOpenAIChat: (enrollment: ExtendedEnrollmentData) => void
  onPrintStudent: (enrollment: ExtendedEnrollmentData) => void
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen])

  const handleMenuAction = (action: () => void) => {
    action()
    setIsMenuOpen(false)
  }

  return (
    <div className="relative" ref={menuRef}>
      <Button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        size="sm"
        variant="ghost"
        className="rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center gap-2"
        disabled={loading}
        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
      >
        <Gear size={16} weight="fill" className="text-blue-900" />
        <span className="text-xs text-blue-900">Settings</span>
      </Button>
      {isMenuOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 shadow-lg rounded-lg z-50">
          <div className="py-1">
            <button
              onClick={() => handleMenuAction(() => onViewStudent(enrollment))}
              className="w-full px-4 py-2 text-left text-xs hover:bg-gray-100 flex items-center gap-2 rounded-lg"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              <Eye size={14} />
              View
            </button>
            <button
              onClick={() => handleMenuAction(() => onOpenAIChat(enrollment))}
              className="w-full px-4 py-2 text-left text-xs hover:bg-gray-100 flex items-center gap-2 rounded-lg"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              <Sparkle size={14} />
              Ask AI
            </button>
            <button
              onClick={() => handleMenuAction(() => onPrintStudent(enrollment))}
              className="w-full px-4 py-2 text-left text-xs hover:bg-gray-100 flex items-center gap-2 rounded-lg"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              <Printer size={14} />
              Print
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function StudentsTable({
  showTableSkeleton,
  paginatedEnrollments,
  allEnrollments,
  searchQuery,
  studentProfiles,
  loadingImages,
  sections,
  subjects,
  subjectSets,
  subjectAssignments,
  grades,
  courses,
  assigningSectionStudent,
  loading,
  onImageLoad,
  onImageError,
  onSectionChange,
  onViewStudent,
  onPrintStudent,
  onOpenAIChat,
}: StudentsTableProps) {
  // Calculate section counts from all enrollments
  const sectionCounts = React.useMemo(() => {
    const counts: Record<string, number> = {}
    allEnrollments.forEach((enrollment) => {
      const sectionId = enrollment.enrollmentInfo?.sectionId
      if (sectionId) {
        counts[sectionId] = (counts[sectionId] || 0) + 1
      }
    })
    return counts
  }, [allEnrollments])
  return (
    <Card className="overflow-hidden pt-0 mt-0 mb-0 pb-0 border border-gray-200 shadow-lg rounded-xl">
      {showTableSkeleton ? (
        <SkeletonTable />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg border-b border-blue-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-blue-800">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 aspect-square rounded-md bg-white flex items-center justify-center">
                      <User size={12} weight="bold" className="text-blue-900" />
                    </div>
                    Student
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-blue-800">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 aspect-square rounded-md bg-white flex items-center justify-center">
                      <Users
                        size={12}
                        weight="bold"
                        className="text-blue-900"
                      />
                    </div>
                    ID
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-blue-800">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 aspect-square rounded-md bg-white flex items-center justify-center">
                      <GraduationCap
                        size={12}
                        weight="bold"
                        className="text-blue-900"
                      />
                    </div>
                    Level
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-blue-800">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 aspect-square rounded-md bg-white flex items-center justify-center">
                      <Users
                        size={12}
                        weight="bold"
                        className="text-blue-900"
                      />
                    </div>
                    Section
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 aspect-square rounded-md bg-white flex items-center justify-center">
                      <Gear size={12} weight="bold" className="text-blue-900" />
                    </div>
                    Actions
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedEnrollments.length === 0 ? (
                <>
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-8 text-center text-gray-500 border-t border-gray-200"
                    >
                      {searchQuery
                        ? 'No enrolled students match your search.'
                        : 'No enrolled students found.'}
                    </td>
                  </tr>
                  {/* Add empty rows to fill up to 8 */}
                  {Array.from({
                    length: Math.max(0, paginatedEnrollments.length - 1),
                  }).map((_, i) => (
                    <tr key={`empty-after-message-${i}`} className="h-16">
                      <td className="px-6 py-4 border-r border-gray-200"></td>
                      <td className="px-6 py-4 border-r border-gray-200"></td>
                      <td className="px-6 py-4 border-r border-gray-200"></td>
                      <td className="px-6 py-4 border-r border-gray-200"></td>
                      <td className="px-6 py-4"></td>
                    </tr>
                  ))}
                </>
              ) : (
                paginatedEnrollments.map((enrollment, index) => {
                  // Render empty row if enrollment is null
                  if (!enrollment) {
                    return (
                      <tr key={`empty-${index}`} className="h-16">
                        <td className="px-6 py-4 border-r border-gray-200"></td>
                        <td className="px-6 py-4 border-r border-gray-200"></td>
                        <td className="px-6 py-4 border-r border-gray-200"></td>
                        <td className="px-6 py-4 border-r border-gray-200"></td>
                        <td className="px-6 py-4"></td>
                      </tr>
                    )
                  }

                  return (
                    <tr
                      key={enrollment.id || `enrollment-${index}`}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 relative">
                            {studentProfiles[enrollment.userId]?.photoURL ? (
                              <>
                                {/* Loading spinner - show by default when photoURL exists */}
                                {loadingImages[enrollment.userId] !== false && (
                                  <div className="absolute inset-0 h-10 w-10 rounded-md bg-gray-200 border-2 border-gray-300 flex items-center justify-center">
                                    <div className="w-4 h-4 border-2 border-blue-900 border-t-transparent rounded-md animate-spin"></div>
                                  </div>
                                )}
                                <img
                                  src={
                                    studentProfiles[enrollment.userId].photoURL
                                  }
                                  alt={`${
                                    enrollment.personalInfo?.firstName ||
                                    'Student'
                                  } profile`}
                                  className={`h-10 w-10 rounded-full object-cover border-2 border-black/80 transition-opacity duration-200 ${
                                    loadingImages[enrollment.userId] === false
                                      ? 'opacity-100'
                                      : 'opacity-0'
                                  }`}
                                  onLoad={() => onImageLoad(enrollment.userId)}
                                  onError={() =>
                                    onImageError(enrollment.userId)
                                  }
                                />
                                {enrollment.enrollmentInfo?.studentType && (
                                  <span
                                    className={`absolute -bottom-0 -right-0 w-3 h-3 border-2 border-white ${
                                      enrollment.enrollmentInfo.studentType ===
                                      'regular'
                                        ? 'bg-emerald-700'
                                        : 'bg-red-600'
                                    }`}
                                    aria-label={
                                      enrollment.enrollmentInfo.studentType ===
                                      'regular'
                                        ? 'Regular Student'
                                        : 'Irregular Student'
                                    }
                                  ></span>
                                )}
                              </>
                            ) : (
                              <div className="h-10 w-10 aspect-square rounded-full bg-gradient-to-br from-blue-800 to-blue-900 rounded-full flex items-center justify-center border-2 border-black/80">
                                <span className="text-white text-xs font-medium">
                                  {getInitials(
                                    enrollment.personalInfo?.firstName,
                                    enrollment.personalInfo?.lastName
                                  )}
                                </span>
                                {enrollment.enrollmentInfo?.studentType && (
                                  <span
                                    className={`absolute -bottom-0 -right-0 w-3 h-3 border-2 border-white rounded-sm ${
                                      enrollment.enrollmentInfo.studentType ===
                                      'regular'
                                        ? 'bg-emerald-700'
                                        : 'bg-red-600'
                                    }`}
                                    aria-label={
                                      enrollment.enrollmentInfo.studentType ===
                                      'regular'
                                        ? 'Regular Student'
                                        : 'Irregular Student'
                                    }
                                  ></span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            {(() => {
                              const rawFullName = formatFullName(
                                enrollment.personalInfo?.firstName,
                                enrollment.personalInfo?.middleName,
                                enrollment.personalInfo?.lastName,
                                enrollment.personalInfo?.nameExtension
                              )
                              const formattedFullName =
                                rawFullName === 'N/A'
                                  ? rawFullName
                                  : rawFullName.toLowerCase()
                              return (
                                <div className="text-xs font-medium text-gray-900 capitalize">
                                  {formattedFullName}
                                </div>
                              )
                            })()}
                            {enrollment.enrollmentInfo?.studentType && (
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <div
                                  className="w-2.5 h-2.5 flex-shrink-0 "
                                  style={{
                                    backgroundColor:
                                      enrollment.enrollmentInfo.studentType ===
                                      'irregular'
                                        ? '#dc2626'
                                        : '#064e3b',
                                  }}
                                ></div>
                                <span
                                  className="text-xs capitalize text-black font-mono"
                                  style={{ fontWeight: 300 }}
                                >
                                  {enrollment.enrollmentInfo.studentType}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                        <div
                          className="text-xs font-mono text-gray-900 uppercase"
                          style={{ fontWeight: 400 }}
                        >
                          ID:{' '}
                          {(
                            studentProfiles[enrollment.userId]?.studentId ||
                            'N/A'
                          ).substring(0, 10)}
                        </div>
                        <div
                          className="text-xs font-mono text-gray-500 uppercase"
                          style={{ fontWeight: 300 }}
                        >
                          #{(enrollment.id || 'N/A').substring(0, 10)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                        {(() => {
                          const displayInfo = getEnrollmentDisplayInfo(
                            enrollment,
                            grades,
                            courses
                          )
                          return (
                            <div className="flex items-center gap-2 mb-1">
                              <div
                                className="w-3 h-3 flex-shrink-0"
                                style={{
                                  backgroundColor: getBgColor(
                                    displayInfo.color
                                  ),
                                }}
                              ></div>
                              <div className="text-xs text-gray-900">
                                {displayInfo.displayText}
                              </div>
                            </div>
                          )
                        })()}
                        <div
                          className="text-xs text-gray-500 font-mono"
                          style={{ fontWeight: 400 }}
                        >
                          {(() => {
                            const displayInfo = getEnrollmentDisplayInfo(
                              enrollment,
                              grades,
                              courses
                            )
                            return displayInfo.subtitle
                          })()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                        {(() => {
                          // For high school: use gradeLevel
                          // For college: use courseCode
                          const gradeLevel =
                            enrollment.enrollmentInfo?.gradeLevel
                          const courseCode =
                            enrollment.enrollmentInfo?.courseCode
                          const lookupKey = gradeLevel || courseCode
                          const gradeSections = lookupKey
                            ? sections[lookupKey]
                            : null
                          const currentSectionId =
                            enrollment.enrollmentInfo?.sectionId
                          const isAssigning =
                            assigningSectionStudent === enrollment.userId

                          if (gradeSections && gradeSections.length > 0) {
                            return (
                              <div className="relative">
                                <select
                                  value={currentSectionId || ''}
                                  onChange={(e) =>
                                    onSectionChange(enrollment, e.target.value)
                                  }
                                  disabled={isAssigning}
                                  className={`w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent ${
                                    isAssigning
                                      ? 'bg-gray-100 cursor-not-allowed'
                                      : ''
                                  }`}
                                >
                                  <option value="">Select Section</option>
                                  {gradeSections.map((section) => {
                                    const studentCount = sectionCounts[section.id] || 0
                                    return (
                                      <option key={section.id} value={section.id}>
                                        {section.sectionName} ({studentCount})
                                      </option>
                                    )
                                  })}
                                </select>
                                {isAssigning && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 rounded">
                                    <div className="w-4 h-4 border-2 border-blue-900 border-t-transparent rounded-md animate-spin"></div>
                                  </div>
                                )}
                              </div>
                            )
                          }

                          return (
                            <div className="text-xs text-gray-500 italic">
                              No sections available
                            </div>
                          )
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium">
                        <ActionMenu
                          enrollment={enrollment}
                          loading={loading}
                          onViewStudent={onViewStudent}
                          onOpenAIChat={onOpenAIChat}
                          onPrintStudent={onPrintStudent}
                        />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
