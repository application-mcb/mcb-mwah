'use client'

import React from 'react'
import { Modal } from '@/components/ui/modal'

interface Props {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  deleteCountdown: number
  deletingEnrollment: boolean
  confirmText: string
}

const DeleteEnrollmentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onConfirm,
  deleteCountdown,
  deletingEnrollment,
  confirmText,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Enrollment" size="sm">
      <div className="p-6">
        <p className="text-sm text-gray-700 mb-6" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
          {confirmText}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg bg-gray-500 text-white text-xs font-medium hover:bg-gray-600 transition-colors"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            disabled={deletingEnrollment}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleteCountdown > 0 || deletingEnrollment}
            className={`flex-1 px-4 py-2 rounded-lg text-white text-xs font-medium transition-colors ${
              deleteCountdown > 0 || deletingEnrollment ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
            }`}
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            {deletingEnrollment ? 'Deleting...' : deleteCountdown > 0 ? `Delete in ${deleteCountdown}s` : 'Delete'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default DeleteEnrollmentModal


