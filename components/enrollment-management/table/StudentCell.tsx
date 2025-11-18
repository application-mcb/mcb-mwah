'use client'

import React from 'react'

interface Props {
  enrollment: any
  studentProfile: any
  formatFullName: (
    firstName?: string,
    middleName?: string,
    lastName?: string,
    nameExtension?: string
  ) => string
  getInitials: (firstName?: string, lastName?: string) => string
  cellBgClass?: string
}

const StudentCell: React.FC<Props> = ({
  enrollment,
  studentProfile,
  formatFullName,
  getInitials,
  cellBgClass = 'bg-white',
}) => {
  return (
    <td className={`px-6 py-4 whitespace-nowrap border-r border-gray-200 ${cellBgClass}`}>
      <div className="flex items-center">
        <div className="flex-shrink-0 h-10 w-10 relative">
          {studentProfile?.photoURL ? (
            <img
              src={studentProfile.photoURL}
              alt={`${enrollment.personalInfo?.firstName || 'Student'} profile`
              }
              className="h-10 w-10 rounded-full object-cover border-2 border-black/80"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-blue-900 flex items-center justify-center">
              <span
                className="text-white text-xs font-medium"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                {getInitials(
                  enrollment.personalInfo?.firstName,
                  enrollment.personalInfo?.lastName
                )}
              </span>
            </div>
          )}
          <span
            className={`absolute -bottom-0 -right-0 w-3 h-3 border-2 border-white ${
              enrollment.enrollmentInfo?.studentType === 'regular'
                ? 'bg-emerald-700'
                : 'bg-red-600'
            }`}
            aria-label={
              enrollment.enrollmentInfo?.studentType === 'regular'
                ? 'Regular Student'
                : 'Irregular Student'
            }
          ></span>
        </div>
        <div className="ml-4">
          <div
            className="text-xs font-medium text-gray-900"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            {formatFullName(
              enrollment.personalInfo?.firstName,
              enrollment.personalInfo?.middleName,
              enrollment.personalInfo?.lastName,
              enrollment.personalInfo?.nameExtension
            )}
          </div>
          <div className="text-xs text-gray-500 font-mono" style={{ fontWeight: 400 }}>
            {studentProfile?.email || enrollment.personalInfo?.email || 'N/A'}
          </div>
          <div
            className="text-xs text-gray-400 font-mono text-[10px] mt-0.5"
            style={{ fontWeight: 300 }}
          >
            {enrollment.id
              ? `#${enrollment.id.substring(0, 10).toUpperCase()}`
              : 'N/A'}
          </div>
        </div>
      </div>
    </td>
  )
}

export default StudentCell


