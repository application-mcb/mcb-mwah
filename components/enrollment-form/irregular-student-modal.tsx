'use client'

import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Warning } from '@phosphor-icons/react'

type IrregularStudentModalProps = {
  isOpen: boolean
  onClose: () => void
  selectedGrade: any
  onConfirm: () => void
}

export default function IrregularStudentModal({
  isOpen,
  onClose,
  selectedGrade,
  onConfirm,
}: IrregularStudentModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Irregular Student Enrollment"
      size="md"
    >
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gray-100 flex items-center justify-center">
            <Warning size={24} className="text-gray-600" weight="bold" />
          </div>
          <div>
            <h3
              className="text-lg font-medium text-gray-900"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Irregular Student Enrollment
            </h3>
            <p className="text-xs text-gray-600">Confirmation required</p>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 p-4 mb-6">
          <h4
            className="text-sm font-medium text-gray-900 mb-2"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            You have selected Grade {selectedGrade?.gradeLevel}
          </h4>
          <p className="text-sm text-gray-700">
            You have selected a grade level that is not a typical starting
            point. Does this mean you are enrolling as a transferee student
            rather than beginning at the entry level? If so, you will be
            classified as an irregular student.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 p-4 mb-6">
          <h4
            className="text-sm font-medium text-blue-900 mb-2"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            What does "Irregular Student" mean?
          </h4>
          <p className="text-sm text-blue-800">
            An irregular student is someone who is not following the standard
            curriculum progression. This typically applies to students who are
            transferring from other schools or have unique academic
            circumstances.
          </p>
        </div>

        <div className="bg-gray-50 border border-gray-200 p-4 mb-6">
          <h4
            className="text-sm font-medium text-gray-900 mb-2"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            If you confirm as an irregular student:
          </h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• You will be classified as an irregular student in the system</li>
            <li>• Your curriculum may be adjusted based on your previous education</li>
            <li>• Additional documentation may be required</li>
            <li>• You can still proceed with enrollment</li>
          </ul>
        </div>

        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-blue-900 hover:bg-blue-900 transition-all duration-300"
          >
            Confirm as Irregular Student
          </Button>
        </div>
      </div>
    </Modal>
  )
}
