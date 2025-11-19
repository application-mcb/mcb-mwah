'use client'

import React from 'react'
import { Modal } from '@/components/ui/modal'
import { Trash } from '@phosphor-icons/react'

interface UnenrollModalProps {
  isOpen: boolean
  onClose: () => void
  unenrollCountdown: number
  unenrollingStudent: boolean
  onConfirmUnenroll: () => void
  onCancel: () => void
}

export default function UnenrollModal({
  isOpen,
  onClose,
  unenrollCountdown,
  unenrollingStudent,
  onConfirmUnenroll,
  onCancel,
}: UnenrollModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Unenroll Student"
      size="md"
    >
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-red-100 flex items-center justify-center">
            <Trash size={24} className="text-red-600" weight="bold" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Unenroll Student
            </h3>
            <p className="text-xs text-gray-600">
              This action will change the student's status back to pending
            </p>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 p-4 mb-6">
          <h4 className="text-xs font-medium text-red-900 mb-2">
            The following will happen when you unenroll this student:
          </h4>
          <ul className="text-xs text-red-800 space-y-1">
            <li>• Student status will change back to "pending"</li>
            <li>• Enrollment date will be removed</li>
            <li>• All assigned subjects and grades will be deleted</li>
            <li>• Student can be re-enrolled later if needed</li>
            <li>• Any existing grade records will be lost</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-500 text-white text-xs font-medium hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={onConfirmUnenroll}
            disabled={unenrollCountdown > 0 || unenrollingStudent}
            className={`flex-1 px-4 py-2 text-white text-xs font-medium transition-colors flex items-center justify-center gap-2 rounded-lg ${
              unenrollCountdown > 0 || unenrollingStudent
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {unenrollingStudent ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-md animate-spin"></div>
                Unenrolling...
              </>
            ) : (
              <>
                <Trash size={16} />
                {unenrollCountdown > 0
                  ? `Unenroll in ${unenrollCountdown}s`
                  : 'Unenroll Student'}
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  )
}
