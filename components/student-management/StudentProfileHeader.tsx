'use client'

import React from 'react'
import { ExtendedEnrollmentData, StudentProfile } from './types'
import { formatFullName, getInitials } from './utils/format'
import { getStatusColor, getEnrollmentDisplayInfo } from './utils/display'

import { CourseData, GradeData } from './types'

interface StudentProfileHeaderProps {
  viewingEnrollment: ExtendedEnrollmentData | null
  studentProfiles: Record<string, StudentProfile>
  grades: Record<string, GradeData>
  courses: CourseData[]
  loadingImages: Record<string, boolean>
  onImageLoad: (userId: string) => void
  onImageError: (userId: string) => void
}

export default function StudentProfileHeader({
  viewingEnrollment,
  studentProfiles,
  grades,
  courses,
  loadingImages,
  onImageLoad,
  onImageError,
}: StudentProfileHeaderProps) {
  return (
    <div className="flex items-center gap-4 mb-6 p-4">
      <div className="flex-shrink-0 h-16 w-16 relative rounded-full">
        {studentProfiles[viewingEnrollment?.userId || '']?.photoURL ? (
          <>
            {/* Loading spinner - show by default when photoURL exists */}
            {loadingImages[viewingEnrollment?.userId || ''] !== false && (
              <div className="absolute inset-0 h-16 w-16 rounded-md bg-gray-200 border-2 border-gray-300 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-blue-900 border-t-transparent rounded-md animate-spin"></div>
              </div>
            )}
            <img
              src={studentProfiles[viewingEnrollment?.userId || ''].photoURL}
              alt={`${
                viewingEnrollment?.personalInfo?.firstName || 'Student'
              } profile`}
              className={`h-16 w-16 object-cover rounded-full border-2 border-gray-200 border-black/80 transition-opacity duration-200 ${
                loadingImages[viewingEnrollment?.userId || ''] === false
                  ? 'opacity-100'
                  : 'opacity-0'
              }`}
              onLoad={() => onImageLoad(viewingEnrollment?.userId || '')}
              onError={() => onImageError(viewingEnrollment?.userId || '')}
            />
          </>
        ) : (
          <div className="h-16 w-16 aspect-square bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg flex items-center justify-center">
            <span className="text-white text-lg font-medium">
              {getInitials(
                viewingEnrollment?.personalInfo?.firstName,
                viewingEnrollment?.personalInfo?.lastName
              )}
            </span>
          </div>
        )}
      </div>
      <div>
        <h2 className="text-xl font-medium text-gray-900">
          {formatFullName(
            viewingEnrollment?.personalInfo?.firstName,
            viewingEnrollment?.personalInfo?.middleName,
            viewingEnrollment?.personalInfo?.lastName,
            viewingEnrollment?.personalInfo?.nameExtension
          )}
        </h2>
        <p
          className="text-gray-600 font-mono uppercase text-xs"
          style={{ fontWeight: 400 }}
        >
          #{viewingEnrollment?.id || 'N/A'}
        </p>
        <div className="flex items-center gap-2 mt-1 font-mono text-xs capitalize ">
          <span
            className={`inline-flex px-2 py-1 text-xs aspect-square font-medium uppercase rounded-md ${getStatusColor(
              viewingEnrollment?.enrollmentInfo?.status || 'unknown'
            )}`}
          ></span>
          {viewingEnrollment?.enrollmentInfo?.status || 'Unknown'}
          <p className="text-gray-500">|</p>
          <span className="text-xs font-mono capitalize">
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
      </div>
    </div>
  )
}
