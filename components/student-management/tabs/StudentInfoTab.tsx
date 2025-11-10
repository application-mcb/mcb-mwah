'use client'

import React from 'react'
import { ExtendedEnrollmentData, StudentProfile, CourseData, GradeData } from '../types'
import { formatFullName, formatDate, formatBirthDate } from '../utils/format'
import { getStatusColor, getEnrollmentDisplayInfo } from '../utils/display'
import {
  User as UserIcon,
  Phone,
  Shield,
  GraduationCapIcon,
  Calendar,
} from '@phosphor-icons/react'
import { Label } from '@/components/ui/label'

interface StudentInfoTabProps {
  viewingEnrollment: ExtendedEnrollmentData | null
  studentProfiles: Record<string, StudentProfile>
  grades: Record<string, GradeData>
  courses: CourseData[]
}

export default function StudentInfoTab({
  viewingEnrollment,
  studentProfiles,
  grades,
  courses,
}: StudentInfoTabProps) {
  return (
    <div className="space-y-6">
      {/* Personal Information Table */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 flex items-center gap-2">
          <div className="w-6 h-6 aspect-square bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg flex items-center justify-center">
            <UserIcon size={14} weight="fill" className="text-white" />
          </div>
          Personal Information
        </h3>
        <div className="overflow-hidden bg-white border border-gray-200 rounded-xl">
          <table className="min-w-full border-collapse border border-gray-200">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                  Full Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                  Date of Birth
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                  Age
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                  Gender
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                  Civil Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                  Nationality
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Religion
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200">
                  {formatFullName(
                    viewingEnrollment?.personalInfo?.firstName,
                    viewingEnrollment?.personalInfo?.middleName,
                    viewingEnrollment?.personalInfo?.lastName,
                    viewingEnrollment?.personalInfo?.nameExtension
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200">
                  {(() => {
                    const birthMonth =
                      viewingEnrollment?.personalInfo?.birthMonth
                    const birthDay =
                      viewingEnrollment?.personalInfo?.birthDay
                    const birthYear =
                      viewingEnrollment?.personalInfo?.birthYear
                    if (birthMonth && birthDay && birthYear) {
                      return formatBirthDate(
                        `${birthYear}-${birthMonth.padStart(
                          2,
                          '0'
                        )}-${birthDay.padStart(2, '0')}`
                      )
                    }
                    return 'N/A'
                  })()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200">
                  {(() => {
                    const birthYear =
                      viewingEnrollment?.personalInfo?.birthYear
                    if (birthYear) {
                      const age =
                        new Date().getFullYear() - parseInt(birthYear)
                      return `${age} years`
                    }
                    return 'N/A'
                  })()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200">
                  {viewingEnrollment?.personalInfo?.gender || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200">
                  {viewingEnrollment?.personalInfo?.civilStatus || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200">
                  {viewingEnrollment?.personalInfo?.citizenship || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">
                  {viewingEnrollment?.personalInfo?.religion || 'N/A'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Contact Information Table */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 flex items-center gap-2">
          <div className="w-6 h-6 aspect-square bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg flex items-center justify-center">
            <Phone size={14} weight="fill" className="text-white" />
          </div>
          Contact Information
        </h3>
        <div className="overflow-hidden bg-white border border-gray-200 rounded-xl">
          <table className="min-w-full border-collapse border border-gray-200">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                  Email Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                  Phone Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Place of Birth
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200">
                  {studentProfiles[viewingEnrollment?.userId || '']
                    ?.email ||
                    viewingEnrollment?.personalInfo?.email ||
                    'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200">
                  {viewingEnrollment?.personalInfo?.phone || 'N/A'}
                </td>
                <td className="px-6 py-4 text-xs text-gray-900">
                  {viewingEnrollment?.personalInfo?.placeOfBirth || 'N/A'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Guardian Information Table */}
      <div className="space-y-4">
        <h3
          className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 flex items-center gap-2"
          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
        >
          <div className="w-6 h-6 aspect-square bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg flex items-center justify-center">
            <Shield size={14} weight="fill" className="text-white" />
          </div>
          Guardian Information
        </h3>
        <div className="overflow-hidden bg-white border border-gray-200 rounded-xl">
          <table className="min-w-full border-collapse border border-gray-200">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Guardian Name
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Relationship
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Phone Number
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Email Address
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td
                  className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  {studentProfiles[viewingEnrollment?.userId || '']
                    ?.guardianName || 'N/A'}
                </td>
                <td
                  className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  {studentProfiles[viewingEnrollment?.userId || '']
                    ?.guardianRelationship || 'N/A'}
                </td>
                <td
                  className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  {studentProfiles[viewingEnrollment?.userId || '']
                    ?.guardianPhone || 'N/A'}
                </td>
                <td
                  className="px-6 py-4 whitespace-nowrap text-xs text-gray-900"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  {studentProfiles[viewingEnrollment?.userId || '']
                    ?.guardianEmail || 'N/A'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Emergency Contact */}
        {studentProfiles[viewingEnrollment?.userId || '']
          ?.emergencyContact && (
          <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl">
            <h4
              className="text-xs font-medium text-gray-900 mb-2"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Emergency Contact
            </h4>
            <p
              className="text-xs text-gray-700"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              {
                studentProfiles[viewingEnrollment?.userId || '']
                  ?.emergencyContact
              }
            </p>
          </div>
        )}
      </div>

      {/* Academic Information Table */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 flex items-center gap-2">
          <div className="w-6 h-6 aspect-square bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg flex items-center justify-center">
            <GraduationCapIcon
              size={14}
              weight="fill"
              className="text-white"
            />
          </div>
          Academic Information
        </h3>
        <div className="overflow-hidden bg-white border border-gray-200">
          <table className="min-w-full border-collapse border border-gray-200">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                  Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                  School Year
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                  Enrollment Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200">
                  {(() => {
                    const displayInfo = getEnrollmentDisplayInfo(viewingEnrollment, grades, courses)
                    return displayInfo.displayText
                  })()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200">
                  {viewingEnrollment?.enrollmentInfo?.schoolYear || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200">
                  {viewingEnrollment?.enrollmentInfo?.enrollmentDate
                    ? formatDate(
                        viewingEnrollment.enrollmentInfo.enrollmentDate
                      )
                    : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs font-mono flex items-center gap-2 capitalize">
                  <span
                    className={`inline-flex text-xs font-medium w-3 h-3 aspect-square ${getStatusColor(
                      viewingEnrollment?.enrollmentInfo?.status ||
                        'unknown'
                    )}`}
                  ></span>
                  {viewingEnrollment?.enrollmentInfo?.status || 'Unknown'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Enrollment Timeline */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 flex items-center gap-2">
          <div className="w-6 h-6 aspect-square bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg flex items-center justify-center">
            <Calendar size={14} weight="fill" className="text-white" />
          </div>
          Enrollment Timeline
        </h3>
        <div className="bg-white border border-gray-200 p-4 rounded-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-500">
            <div>
              <Label>Submitted At</Label>
              <p>
                {viewingEnrollment?.submittedAt
                  ? formatDate(viewingEnrollment.submittedAt)
                  : 'N/A'}
              </p>
            </div>
            <div>
              <Label>Last Updated</Label>
              <p>
                {viewingEnrollment?.updatedAt
                  ? formatDate(viewingEnrollment.updatedAt)
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
