'use client'

import React from 'react'
import { Modal } from '@/components/ui/modal'
import { Check } from '@phosphor-icons/react'

interface ExtendedEnrollmentData {
  userId: string
  personalInfo?: any
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
  viewingEnrollment: ExtendedEnrollmentData | null
  selectedSubjectsCount: number
  studentIdResolved: string
  enrollOrNumber: string
  setEnrollOrNumber: (v: string) => void
  enrollScholarship: string
  setEnrollScholarship: (v: string) => void
  enrollStudentId: string
  setEnrollStudentId: (v: string) => void
  filteredEnrollScholarships: ScholarshipData[]
  enrollingStudent: boolean
  onConfirm: () => void
  formatFullName: (
    first?: string,
    middle?: string,
    last?: string,
    ext?: string
  ) => string
  getEnrollmentDisplayInfo: (enrollment: any) => { displayText: string }
  zIndex?: number
}

const EnrollModal: React.FC<Props> = ({
  isOpen,
  onClose,
  viewingEnrollment,
  selectedSubjectsCount,
  studentIdResolved,
  enrollOrNumber,
  setEnrollOrNumber,
  enrollScholarship,
  setEnrollScholarship,
  enrollStudentId,
  setEnrollStudentId,
  filteredEnrollScholarships,
  enrollingStudent,
  onConfirm,
  formatFullName,
  getEnrollmentDisplayInfo,
  zIndex = 60,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Enroll Student" size="md" zIndex={zIndex}>
      <div className="p-6">
        {viewingEnrollment && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-800 to-blue-900 rounded-xl flex items-center justify-center">
                <Check size={24} className="text-white" weight="bold" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  Enroll Student
                </h3>
                <p className="text-xs text-gray-600" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                  Enter enrollment details for {viewingEnrollment.personalInfo?.firstName}{' '}
                  {viewingEnrollment.personalInfo?.lastName}
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
              <h4 className="text-xs font-medium text-gray-900 mb-3" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                Student Information:
              </h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-medium text-gray-600">Name:</span>
                  <span className="ml-2 text-gray-900">
                    {formatFullName(
                      viewingEnrollment.personalInfo?.firstName,
                      viewingEnrollment.personalInfo?.middleName,
                      viewingEnrollment.personalInfo?.lastName,
                      viewingEnrollment.personalInfo?.nameExtension
                    )}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Level:</span>
                  <span className="ml-2 text-gray-900">
                    {(() => getEnrollmentDisplayInfo(viewingEnrollment).displayText)()}
                  </span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-600">Selected Subjects:</span>
                  <span className={`text-sm font-medium ${selectedSubjectsCount === 0 ? 'text-red-600' : 'text-blue-900'}`} style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                    {selectedSubjectsCount} {selectedSubjectsCount === 1 ? 'subject' : 'subjects'}
                  </span>
                </div>
                {selectedSubjectsCount === 0 && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs text-red-700" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                      No subjects selected. Please go back to the Subject Assignment tab and select at least one subject before enrolling.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
              <h4 className="text-xs font-medium text-gray-900 mb-3" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                Enrollment Details:
              </h4>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                    OR Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={enrollOrNumber}
                    onChange={(e) => setEnrollOrNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                    placeholder="XXXXX"
                    style={{ fontWeight: 400 }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                    Scholarship <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={enrollScholarship}
                      onChange={(e) => setEnrollScholarship(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono appearance-none bg-white"
                      style={{ fontWeight: 400 }}
                      disabled={filteredEnrollScholarships.length === 0}
                    >
                      <option value="">
                        {filteredEnrollScholarships.length === 0
                          ? 'No scholarships available'
                          : 'Select Scholarship'}
                      </option>
                      {filteredEnrollScholarships.map((scholarship) => (
                        <option key={scholarship.id} value={scholarship.value}>
                          {scholarship.code} - {scholarship.name} ({scholarship.value}%)
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <div className="w-4 h-4 bg-gray-400 flex items-center justify-center">
                        <div className="w-2 h-2 bg-white"></div>
                      </div>
                    </div>
                  </div>
                  {enrollScholarship && (
                    <div className="mt-1 text-xs text-gray-600" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                      Selected:{' '}
                      {filteredEnrollScholarships.find((s) => s.value === parseInt(enrollScholarship))?.name} (
                      {filteredEnrollScholarships.find((s) => s.value === parseInt(enrollScholarship))?.value}%)
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                    Student ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={studentIdResolved || enrollStudentId}
                    onChange={(e) => setEnrollStudentId(e.target.value)}
                    disabled={Boolean(studentIdResolved)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                    placeholder="YYY-XXX"
                    style={{ fontWeight: 400 }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-2">
                <div>
                  <h4 className="text-xs font-medium text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                    What happens next?
                  </h4>
                  <ul className="text-xs text-gray-700 mt-1 space-y-1" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                    <li>• Student will be enrolled with {selectedSubjectsCount} selected subjects</li>
                    <li>• Student status will change to "enrolled"</li>
                    <li>• Grade records will be created for each subject</li>
                    <li>• Enrollment details will be saved to database</li>
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
                    Confirm Enrollment
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

export default EnrollModal


