'use client'

import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Warning, ArrowRight } from '@phosphor-icons/react'

type CourseChangeModalProps = {
  isOpen: boolean
  onClose: () => void
  pendingCourse: any
  onConfirm: () => void
}

export default function CourseChangeModal({
  isOpen,
  onClose,
  pendingCourse,
  onConfirm,
}: CourseChangeModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Course Change Warning"
      size="md"
    >
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-yellow-100 flex items-center justify-center">
            <Warning size={24} className="text-yellow-600" weight="bold" />
          </div>
          <div>
            <h3
              className="text-lg font-medium text-gray-900"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Course Change Warning
            </h3>
            <p className="text-xs text-gray-600">Confirmation required</p>
          </div>
        </div>

        <div className="bg-white border border-blue-100 rounded-xl p-4 mb-6">
          <h4
            className="text-sm font-medium text-blue-900 mb-2"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            You are about to change your course selection
          </h4>
          <p className="text-sm text-blue-900">
            Changing your course will reset your year and semester selections.
            You will need to reselect these options for your new course.
          </p>
        </div>

        <div className="bg-white border border-blue-100 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-600">New Course:</span>
            <span className="text-sm font-medium text-gray-900">
              {pendingCourse?.code} - {pendingCourse?.name}
            </span>
          </div>
          <div className="flex items-center justify-center">
            <ArrowRight size={16} className="text-gray-400" />
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Year and Semester selections will be reset
          </p>
        </div>

        <div className="bg-white border border-blue-100 rounded-xl p-4 mb-6">
          <h4
            className="text-sm font-medium text-blue-900 mb-2"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            What happens when you change courses:
          </h4>
          <ul className="text-xs text-blue-900 space-y-1">
            <li>• Your year level selection will be cleared</li>
            <li>• Your semester selection will be cleared</li>
            <li>• You will need to reselect year and semester</li>
            <li>• Your personal information remains unchanged</li>
            <li>• You can proceed with enrollment for the new course</li>
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
            Yes, Continue with Course Change
          </Button>
        </div>
      </div>
    </Modal>
  )
}
