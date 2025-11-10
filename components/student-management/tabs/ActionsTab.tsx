'use client'

import React from 'react'
import { ExtendedEnrollmentData, CourseData, GradeData } from '../types'
import { formatFullName, formatDate } from '../utils/format'
import { getStatusColor, getEnrollmentDisplayInfo } from '../utils/display'
import { Gear, Printer, Trash, Sparkle } from '@phosphor-icons/react'

interface ActionsTabProps {
  viewingEnrollment: ExtendedEnrollmentData | null
  grades: Record<string, GradeData>
  courses: CourseData[]
  unenrollingStudent: boolean
  onShowPrintModal: () => void
  onUnenrollStudent: () => void
  onOpenAIChat: () => void
}

export default function ActionsTab({
  viewingEnrollment,
  grades,
  courses,
  unenrollingStudent,
  onShowPrintModal,
  onUnenrollStudent,
  onOpenAIChat,
}: ActionsTabProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
        <div className="w-6 h-6 aspect-square bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg flex items-center justify-center">
          <Gear size={14} weight="fill" className="text-white" />
        </div>
        Student Actions
      </h3>

      {/* Student Information Summary */}
      <div className="bg-white border border-gray-200 p-4 rounded-xl">
        <h4 className="text-xs font-medium text-gray-900 mb-3">
          Student Summary
        </h4>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="font-medium text-gray-600">Name:</span>
            <span className="ml-2 text-gray-900">
              {formatFullName(
                viewingEnrollment?.personalInfo?.firstName,
                viewingEnrollment?.personalInfo?.middleName,
                viewingEnrollment?.personalInfo?.lastName,
                viewingEnrollment?.personalInfo?.nameExtension
              )}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-600">Level:</span>
            <span className="ml-2 text-gray-900">
              {(() => {
                const displayInfo = getEnrollmentDisplayInfo(
                  viewingEnrollment,
                  grades,
                  courses
                )
                return displayInfo.displayText
              })()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-600 flex items-center gap-2">
              Status:
            </span>
            <span
              className={`inline-flex text-xs font-medium w-3 h-3 aspect-square ${getStatusColor(
                viewingEnrollment?.enrollmentInfo?.status || 'unknown'
              )}`}
            ></span>
            <p className="font-mono capitalize">
              {viewingEnrollment?.enrollmentInfo?.status || 'unknown'}
            </p>
          </div>
          <div>
            <span className="font-medium text-gray-600">Enrolled:</span>
            <span className="ml-2 text-gray-900">
              {viewingEnrollment?.enrollmentInfo?.enrollmentDate
                ? formatDate(viewingEnrollment.enrollmentInfo.enrollmentDate)
                : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Available Actions */}
      <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl">
        <h4 className="text-xs font-medium text-gray-900 mb-4">
          Available Actions
        </h4>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              onClick={onOpenAIChat}
              className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg text-white text-xs font-medium hover:from-blue-900 hover:to-blue-950 transition-colors flex items-center justify-center gap-2"
            >
              <Sparkle size={16} />
              AI Analysis
            </button>
            <button
              onClick={onShowPrintModal}
              className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg text-white text-xs font-medium hover:from-blue-900 hover:to-blue-950 transition-colors flex items-center justify-center gap-2"
            >
              <Printer size={16} />
              Print Student Information
            </button>
          </div>
          <button
            onClick={onUnenrollStudent}
            className="w-full px-4 py-3 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
            disabled={unenrollingStudent}
          >
            {unenrollingStudent ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-md animate-spin"></div>
                Unenrolling...
              </>
            ) : (
              <>
                <Trash size={16} />
                Unenroll Student
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
