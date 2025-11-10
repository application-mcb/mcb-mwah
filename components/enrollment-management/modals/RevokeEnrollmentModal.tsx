'use client'

import React from 'react'
import { Modal } from '@/components/ui/modal'
import { X } from '@phosphor-icons/react'

interface Props {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  revokeCountdown: number
  revokingEnrollment: boolean
}

const RevokeEnrollmentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onConfirm,
  revokeCountdown,
  revokingEnrollment,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Revoke Student Enrollment" size="md">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-red-100 flex items-center justify-center">
            <X size={24} className="text-red-600" weight="bold" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
              Dangerous Action
            </h3>
            <p className="text-xs text-gray-600" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
              This action cannot be undone
            </p>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 p-4 mb-6">
          <h4 className="text-xs font-medium text-red-900 mb-2" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
            The following will happen when you revoke this enrollment:
          </h4>
          <ul className="text-xs text-red-800 space-y-1" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
            <li>• Student status will change back to "pending"</li>
            <li>• Enrollment date will be removed</li>
            <li>• All assigned subjects and grades will be deleted</li>
            <li>• Student will need to be enrolled again manually</li>
            <li>• Any existing grade records will be lost</li>
          </ul>
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
            onClick={onConfirm}
            disabled={revokeCountdown > 0 || revokingEnrollment}
            className={`flex-1 px-4 py-2 rounded-lg text-white text-xs font-medium transition-colors flex items-center justify-center gap-2 ${
              revokeCountdown > 0 || revokingEnrollment ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
            }`}
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            {revokingEnrollment ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Revoking...
              </>
            ) : (
              <>
                <X size={16} />
                {revokeCountdown > 0 ? `Revoke in ${revokeCountdown}s` : 'Revoke Enrollment'}
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default RevokeEnrollmentModal


