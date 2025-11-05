'use client'

import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Warning } from '@phosphor-icons/react'

type DeleteConfirmationModalProps = {
  isOpen: boolean
  onClose: () => void
  countdown: number
  onConfirm: () => void
  onDelete: () => void
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  countdown,
  onConfirm,
  onDelete,
}: DeleteConfirmationModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Enrollment Submission"
    >
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-red-100 flex items-center justify-center">
            <Warning size={24} className="text-red-600" weight="bold" />
          </div>
          <div>
            <h3
              className="text-lg font-medium text-gray-900"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Delete Enrollment Submission
            </h3>
            <p className="text-xs text-gray-600">This action cannot be undone</p>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 p-4 mb-6">
          <h4
            className="text-sm font-medium text-red-900 mb-2"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            Are you sure you want to delete this enrollment?
          </h4>
          <p className="text-sm text-red-700">
            This will permanently delete the current enrollment submission and
            reset all progress. This action cannot be undone and you will need
            to start the enrollment process from the beginning.
          </p>
        </div>

        <div className="bg-gray-50 border border-gray-200 p-4 mb-6">
          <h4
            className="text-sm font-medium text-gray-900 mb-2"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            What happens when you delete:
          </h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• All enrollment data will be permanently removed</li>
            <li>• Progress will be reset to the beginning</li>
            <li>• You will need to start enrollment from scratch</li>
            <li>• Any uploaded documents remain in your Documents section</li>
          </ul>
        </div>

        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={countdown > 0}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={countdown > 0}
            className={`bg-red-600 hover:bg-red-700 transition-all duration-300 ${
              countdown > 0 ? 'bg-gray-400 cursor-not-allowed' : ''
            }`}
          >
            {countdown > 0
              ? `Confirm Delete (${countdown})`
              : 'Confirm Delete'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
