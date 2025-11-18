'use client'

import React from 'react'
import { Modal } from '@/components/ui/modal'
import { Warning, XCircle } from '@phosphor-icons/react'
import { FailedPrerequisite } from '../utils/prerequisites'

interface Props {
  isOpen: boolean
  onClose: () => void
  onProceed: () => void
  failedPrerequisites: FailedPrerequisite[]
  studentName?: string
}

const PrerequisiteWarningModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onProceed,
  failedPrerequisites,
  studentName,
}) => {
  if (failedPrerequisites.length === 0) {
    return null
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Prerequisite Warning"
      size="lg"
      zIndex={60}
    >
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-xl flex items-center justify-center flex-shrink-0">
            <Warning size={24} className="text-white" weight="fill" />
          </div>
          <div>
            <h3
              className="text-lg font-medium text-gray-900"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Prerequisite Requirements Not Met
            </h3>
            <p
              className="text-xs text-gray-600"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              {studentName
                ? `${studentName} has not passed the following prerequisite subjects:`
                : 'The student has not passed the following prerequisite subjects:'}
            </p>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-2">
            <Warning size={18} className="text-yellow-700 flex-shrink-0 mt-0.5" weight="fill" />
            <div>
              <p
                className="text-sm font-medium text-yellow-900 mb-1"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Enrollment Warning
              </p>
              <p
                className="text-xs text-yellow-800"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                The student cannot proceed with enrollment because they have not passed the required
                prerequisite subjects. You may proceed anyway, but this may affect the student's
                academic progress.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
          <h4
            className="text-xs font-medium text-gray-900 mb-3"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            Failed Prerequisites ({failedPrerequisites.length}):
          </h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {failedPrerequisites.map((prereq, index) => (
              <div
                key={`${prereq.subjectId}-${index}`}
                className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg"
              >
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <XCircle size={16} className="text-red-600" weight="fill" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-sm font-medium text-gray-900"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      {prereq.subjectCode} - {prereq.subjectName}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span
                      className="px-2 py-1 bg-red-100 text-red-800 rounded-lg"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      {prereq.status}
                    </span>
                    {prereq.average !== null && (
                      <span
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg"
                        style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                      >
                        Average: {prereq.average.toFixed(1)}
                      </span>
                    )}
                    <span
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg"
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      AY: {prereq.academicYear}
                    </span>
                  </div>
                  <p
                    className="text-xs text-gray-600 mt-1"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    {prereq.reason}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg bg-gray-500 text-white text-xs font-medium hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            Cancel
          </button>
          <button
            onClick={onProceed}
            className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-br from-yellow-600 to-yellow-700 text-white text-xs font-medium hover:from-yellow-700 hover:to-yellow-800 transition-colors flex items-center justify-center gap-2"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            Proceed Anyway
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default PrerequisiteWarningModal

