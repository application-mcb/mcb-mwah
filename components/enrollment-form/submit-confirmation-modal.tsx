'use client'

import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Check } from '@phosphor-icons/react'

type SubmitConfirmationModalProps = {
  isOpen: boolean
  onClose: () => void
  countdown: number
  onConfirm: () => void
  enrolling: boolean
}

export default function SubmitConfirmationModal({
  isOpen,
  onClose,
  countdown,
  onConfirm,
  enrolling,
}: SubmitConfirmationModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Final Confirmation"
      size="sm"
    >
      <div className="p-6 text-center">
        <p className="text-gray-600 mb-6">
          Are you sure all the information you provided is correct? This action
          cannot be undone.
        </p>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
            disabled={enrolling}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={enrolling || countdown > 0}
            className={`flex-1 ${
              enrolling || countdown > 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-900 hover:bg-blue-900'
            }`}
          >
            {countdown > 0
              ? `Confirm & Submit (${countdown})`
              : 'Confirm & Submit'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
