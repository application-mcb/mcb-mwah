'use client'

import React from 'react'
import { ExtendedEnrollmentData } from '../types'
import { User, Phone, GraduationCap as GraduationCapIcon, Calendar, X, Printer, Check, Sparkle } from '@phosphor-icons/react'

// types moved to ../types

interface Props {
  viewingEnrollment: ExtendedEnrollmentData | null
  formatFullName: (
    firstName?: string,
    middleName?: string,
    lastName?: string,
    nameExtension?: string
  ) => string
  formatBirthDate: (dateInput: any) => string
  formatDate: (dateInput: any) => string
  getTimeAgoInfo: (dateInput: any) => { text: string; color: string }
  getEnrollmentDisplayInfo: (enrollment: any) => { type: string; displayText: string; subtitle: string; color: string }
  getStatusColor: (status: string) => string
  onCancel: () => void
  onPrint: () => void
  onRevoke: () => void
  revokingEnrollment: boolean
  onOpenEnroll: () => void
  enrollingStudent: boolean
  onOpenAIChat: () => void
}

const ProcessTab: React.FC<Props> = ({
  viewingEnrollment,
  formatFullName,
  formatBirthDate,
  formatDate,
  getTimeAgoInfo,
  getEnrollmentDisplayInfo,
  getStatusColor,
  onCancel,
  onPrint,
  onRevoke,
  revokingEnrollment,
  onOpenEnroll,
  enrollingStudent,
  onOpenAIChat,
}) => {
  if (!viewingEnrollment) return null

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
          <div className="w-6 h-6 bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg flex items-center justify-center">
            <User size={14} weight="fill" className="text-white" />
          </div>
          Personal Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-500" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>Full Name</label>
            <p className="text-xs text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
              {formatFullName(
                viewingEnrollment?.personalInfo?.firstName,
                viewingEnrollment?.personalInfo?.middleName,
                viewingEnrollment?.personalInfo?.lastName,
                viewingEnrollment?.personalInfo?.nameExtension
              )}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>Date of Birth</label>
            <p className="text-xs text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
              {(() => {
                const birthMonth = viewingEnrollment?.personalInfo?.birthMonth
                const birthDay = viewingEnrollment?.personalInfo?.birthDay
                const birthYear = viewingEnrollment?.personalInfo?.birthYear
                if (birthMonth && birthDay && birthYear) {
                  return formatBirthDate(`${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`)
                }
                return 'N/A'
              })()}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>Gender</label>
            <p className="text-xs text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
              {viewingEnrollment?.personalInfo?.gender || 'N/A'}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>Religion</label>
            <p className="text-xs text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
              {viewingEnrollment?.personalInfo?.religion || 'N/A'}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>Citizenship</label>
            <p className="text-xs text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
              {viewingEnrollment?.personalInfo?.citizenship || 'N/A'}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>Place of Birth</label>
            <p className="text-xs text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
              {viewingEnrollment?.personalInfo?.placeOfBirth || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
          <div className="w-6 h-6 bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg flex items-center justify-center">
            <Phone size={14} weight="fill" className="text-white" />
          </div>
          Contact Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-500" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>Email Address</label>
            <p className="text-xs text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
              {viewingEnrollment?.personalInfo?.email || 'N/A'}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>Phone Number</label>
            <p className="text-xs text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
              {viewingEnrollment?.personalInfo?.phone || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
          <div className="w-6 h-6 bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg flex items-center justify-center">
            <GraduationCapIcon size={14} weight="fill" className="text-white" />
          </div>
          Academic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-500" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>Level</label>
            <p className="text-xs text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
              {(() => {
                const displayInfo = getEnrollmentDisplayInfo(viewingEnrollment)
                return displayInfo.displayText
              })()}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>School Year</label>
            <p className="text-xs text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
              {viewingEnrollment?.enrollmentInfo?.schoolYear || 'N/A'}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium upper text-gray-500" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>Status</label>
            <p className="text-xs text-gray-900 capitalize font-mono" style={{ fontWeight: 400 }}>
              {viewingEnrollment?.enrollmentInfo?.status || 'Unknown'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
          <div className="w-6 h-6 bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg flex items-center justify-center">
            <Calendar size={14} weight="fill" className="text-white" />
          </div>
          Enrollment Timeline
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-xs text-gray-500" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>Submitted:</span>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 flex-shrink-0" style={{ backgroundColor: getTimeAgoInfo(viewingEnrollment?.submittedAt).color }}></div>
              <span className="text-xs text-gray-900 font-mono">
                {formatDate(viewingEnrollment?.submittedAt)} • {getTimeAgoInfo(viewingEnrollment?.submittedAt).text}
              </span>
            </div>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-gray-500" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>Last Updated:</span>
            <span className="text-xs text-gray-900 font-mono">{formatDate(viewingEnrollment?.updatedAt)}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-4 pt-6 border-t border-gray-200">
        <button
          onClick={onCancel}
          className="px-3 py-2 rounded-lg bg-gray-500 text-white text-xs font-medium hover:bg-gray-600 transition-colors flex items-center gap-2"
          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
        >
          <X size={16} />
          Cancel
        </button>
        <button
          onClick={onOpenAIChat}
          className="flex-1 px-3 py-2 rounded-lg bg-gradient-to-br from-blue-800 to-blue-900 text-white text-xs font-medium hover:from-blue-900 hover:to-blue-950 transition-colors flex items-center justify-center gap-2"
          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          disabled={enrollingStudent || revokingEnrollment}
        >
          <Sparkle size={16} />
          AI Analysis
        </button>
        {viewingEnrollment?.enrollmentInfo?.status === 'enrolled' && (
          <button
            onClick={onPrint}
            className="flex-1 px-3 py-2 rounded-lg bg-gradient-to-br from-blue-800 to-blue-900 text-white text-xs font-medium hover:from-blue-900 hover:to-blue-950 transition-colors flex items-center justify-center gap-2"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            disabled={enrollingStudent || revokingEnrollment}
          >
            <Printer size={16} />
            Print
          </button>
        )}
        {viewingEnrollment?.enrollmentInfo?.status === 'enrolled' ? (
          <button
            onClick={onRevoke}
            className="flex-1 px-3 py-2 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            disabled={revokingEnrollment}
          >
            {revokingEnrollment ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Revoking...
              </>
            ) : (
              <>
                <X size={16} />
                Revoke Enrollment
              </>
            )}
          </button>
        ) : (
          <button
            onClick={onOpenEnroll}
            className="flex-1 px-3 py-2 rounded-lg bg-gradient-to-br from-blue-800 to-blue-900 text-white text-xs font-medium hover:from-blue-900 hover:to-blue-950 transition-colors flex items-center justify-center gap-2"
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
                Enroll
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

export default ProcessTab


