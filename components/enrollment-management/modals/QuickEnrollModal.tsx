'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Check, Eye, Pencil } from '@phosphor-icons/react'
import { getBgColor } from '../utils/color'

interface StudentProfile {
  userId: string
  email?: string
  studentId?: string
}

interface ExtendedEnrollmentData {
  userId: string
  personalInfo?: any
  enrollmentInfo?: any
}

interface SubjectDataMap {
  [id: string]: any
}

interface ScholarshipData {
  id: string
  value: number
  code: string
  name: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
  quickEnrollData: {
    enrollment: ExtendedEnrollmentData
    subjects: string[]
  } | null
  studentProfiles: Record<string, StudentProfile>
  subjects: SubjectDataMap
  filteredQuickScholarships: ScholarshipData[]
  quickEnrollOrNumber: string
  setQuickEnrollOrNumber: (v: string) => void
  quickEnrollScholarship: string
  setQuickEnrollScholarship: (v: string) => void
  quickEnrollStudentId: string
  setQuickEnrollStudentId: (v: string) => void
  enrollingStudent: boolean
  onConfirm: () => void
  formatFullName: (
    first?: string,
    middle?: string,
    last?: string,
    ext?: string
  ) => string
  getEnrollmentDisplayInfo: (enrollment: any) => { displayText: string }
}

const QuickEnrollModal: React.FC<Props> = ({
  isOpen,
  onClose,
  quickEnrollData,
  studentProfiles,
  subjects,
  filteredQuickScholarships,
  quickEnrollOrNumber,
  setQuickEnrollOrNumber,
  quickEnrollScholarship,
  setQuickEnrollScholarship,
  quickEnrollStudentId,
  setQuickEnrollStudentId,
  enrollingStudent,
  onConfirm,
  formatFullName,
  getEnrollmentDisplayInfo,
}) => {
  const [isEditingStudentId, setIsEditingStudentId] = useState(false)

  // Reset edit state when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setIsEditingStudentId(false)
    }
  }, [isOpen])
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quick Enroll Preview"
      size="lg"
      zIndex={60}
    >
      <div className="p-6">
        {quickEnrollData && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-800 to-blue-900 rounded-xl flex items-center justify-center">
                <Check size={24} className="text-white" weight="bold" />
              </div>
              <div>
                <h3
                  className="text-lg font-medium text-gray-900"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Quick Enroll Confirmation
                </h3>
                <p
                  className="text-xs text-gray-600"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  Review subjects before enrolling{' '}
                  {quickEnrollData.enrollment.personalInfo?.firstName}{' '}
                  {quickEnrollData.enrollment.personalInfo?.lastName}
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
              <h4
                className="text-xs font-medium text-gray-900 mb-3"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Student Information:
              </h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-medium text-gray-600">Name:</span>
                  <span className="ml-2 text-gray-900">
                    {formatFullName(
                      quickEnrollData.enrollment.personalInfo?.firstName,
                      quickEnrollData.enrollment.personalInfo?.middleName,
                      quickEnrollData.enrollment.personalInfo?.lastName,
                      quickEnrollData.enrollment.personalInfo?.nameExtension
                    )}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Level:</span>
                  <span className="ml-2 text-gray-900">
                    {(() =>
                      getEnrollmentDisplayInfo(quickEnrollData.enrollment)
                        .displayText)()}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Email:</span>
                  <span className="ml-2 text-gray-900 font-mono text-xs">
                    {studentProfiles[quickEnrollData.enrollment.userId]
                      ?.email ||
                      quickEnrollData.enrollment.personalInfo?.email ||
                      'N/A'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">
                    School Year:
                  </span>
                  <span className="ml-2 text-gray-900">
                    {quickEnrollData.enrollment.enrollmentInfo?.schoolYear}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
              <h4
                className="text-xs font-medium text-gray-900 mb-3"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Subjects to be Assigned ({quickEnrollData.subjects.length}):
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                {quickEnrollData.subjects.map((subjectId) => {
                  const subject = subjects[subjectId]
                  return subject ? (
                    <div
                      key={subjectId}
                      className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded"
                    >
                      <div
                        className="w-3 h-3"
                        style={{ backgroundColor: getBgColor(subject.color) }}
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
                  ) : null
                })}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
              <h4
                className="text-xs font-medium text-gray-900 mb-3"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Enrollment Details:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label
                    className="block text-xs font-medium text-gray-700 mb-1"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    OR Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={quickEnrollOrNumber}
                    onChange={(e) => setQuickEnrollOrNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                    placeholder="XXXXX"
                    style={{ fontWeight: 400 }}
                  />
                </div>
                <div>
                  <label
                    className="block text-xs font-medium text-gray-700 mb-1"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Scholarship <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={quickEnrollScholarship}
                      onChange={(e) =>
                        setQuickEnrollScholarship(e.target.value)
                      }
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono appearance-none bg-white"
                      style={{ fontWeight: 400 }}
                    >
                      <option value="">Select Scholarship</option>
                      {filteredQuickScholarships.map((scholarship) => (
                        <option key={scholarship.id} value={scholarship.value}>
                          {scholarship.code} - {scholarship.name} (
                          {scholarship.value}%)
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <div className="w-4 h-4 bg-gray-400 flex items-center justify-center">
                        <div className="w-2 h-2 bg-white"></div>
                      </div>
                    </div>
                  </div>
                  {quickEnrollScholarship && (
                    <div
                      className="mt-1 text-xs text-gray-600"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      Selected:{' '}
                      {
                        filteredQuickScholarships.find(
                          (s) => s.value === parseInt(quickEnrollScholarship)
                        )?.name
                      }{' '}
                      (
                      {
                        filteredQuickScholarships.find(
                          (s) => s.value === parseInt(quickEnrollScholarship)
                        )?.value
                      }
                      %)
                    </div>
                  )}
                </div>
                <div>
                  <label
                    className="block text-xs font-medium text-gray-700 mb-1"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Student ID <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={
                        isEditingStudentId
                          ? quickEnrollStudentId
                          : studentProfiles[quickEnrollData.enrollment.userId]
                              ?.studentId ||
                            quickEnrollData.enrollment.enrollmentInfo
                              ?.studentId ||
                            quickEnrollStudentId
                      }
                      onChange={(e) => setQuickEnrollStudentId(e.target.value)}
                      disabled={
                        !isEditingStudentId &&
                        Boolean(
                          studentProfiles[quickEnrollData.enrollment.userId]
                            ?.studentId ||
                            quickEnrollData.enrollment.enrollmentInfo?.studentId
                        )
                      }
                      className="w-full px-3 py-2 pr-10 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="YYY-XXX"
                      style={{ fontWeight: 400 }}
                    />
                    {(studentProfiles[quickEnrollData.enrollment.userId]
                      ?.studentId ||
                      quickEnrollData.enrollment.enrollmentInfo?.studentId) && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingStudentId(!isEditingStudentId)
                          if (!isEditingStudentId) {
                            // When enabling edit, set the current value to the input
                            const currentId =
                              studentProfiles[quickEnrollData.enrollment.userId]
                                ?.studentId ||
                              quickEnrollData.enrollment.enrollmentInfo
                                ?.studentId ||
                              quickEnrollStudentId
                            setQuickEnrollStudentId(currentId)
                          }
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 rounded transition-colors"
                        title={
                          isEditingStudentId
                            ? 'Save Student ID'
                            : 'Edit Student ID'
                        }
                      >
                        <Pencil
                          size={14}
                          className={
                            isEditingStudentId
                              ? 'text-blue-900'
                              : 'text-gray-600'
                          }
                          weight={isEditingStudentId ? 'fill' : 'regular'}
                        />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-2">
                <div>
                  <h4
                    className="text-xs font-medium text-gray-900"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    What happens next?
                  </h4>
                  <ul
                    className="text-xs text-gray-700 mt-1 space-y-1"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    <li>
                      • Student will be enrolled with all subjects shown above
                    </li>
                    <li>• Student status will change to "enrolled"</li>
                    <li>• Grade records will be created for each subject</li>
                    <li>
                      • This action can be reversed by revoking enrollment
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-500 text-white text-xs font-medium hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                disabled={enrollingStudent}
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-br from-blue-800 to-blue-900 text-white text-xs font-medium hover:from-blue-900 hover:to-blue-950 transition-colors flex items-center justify-center gap-2"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                disabled={enrollingStudent}
              >
                {enrollingStudent ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Enrolling...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    Confirm Quick Enroll
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

export default QuickEnrollModal
