'use client'

import React from 'react'
import { ExtendedEnrollmentData, StudentProfile } from '../types'
import { Label } from '@/components/ui/label'
import {
  User as UserIcon,
  Phone,
  Shield,
  Calendar,
  GraduationCap as GraduationCapIcon,
} from '@phosphor-icons/react'

// types moved to ../types

interface Props {
  viewingEnrollment: ExtendedEnrollmentData | null
  studentProfiles: Record<string, StudentProfile>
  formatFullName: (
    firstName?: string,
    middleName?: string,
    lastName?: string,
    nameExtension?: string
  ) => string
  formatBirthDate: (dateInput: any) => string
  formatDate: (dateInput: any) => string
  getTimeAgoInfo: (dateInput: any) => { text: string; color: string }
  getEnrollmentDisplayInfo: (enrollment: any) => {
    type: string
    displayText: string
    subtitle: string
    color: string
  }
  getStatusColor: (status: string) => string
}

const StudentInfoTab: React.FC<Props> = ({
  viewingEnrollment,
  studentProfiles,
  formatFullName,
  formatBirthDate,
  formatDate,
  getTimeAgoInfo,
  getEnrollmentDisplayInfo,
  getStatusColor,
}) => {
  if (!viewingEnrollment) return null

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3
          className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 flex items-center gap-2"
          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
        >
          <div className="w-6 h-6 bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg flex items-center justify-center">
            <UserIcon size={14} weight="fill" className="text-white" />
          </div>
          Personal Information
        </h3>
        <div className="overflow-hidden bg-white border border-gray-200 rounded-xl">
          <table className="min-w-full border-collapse border border-gray-200">
            <thead className="bg-white border-b border-gray-200">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Full Name
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Date of Birth
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Age
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Gender
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Civil Status
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Nationality
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Religion
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td
                  className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  {formatFullName(
                    viewingEnrollment?.personalInfo?.firstName,
                    viewingEnrollment?.personalInfo?.middleName,
                    viewingEnrollment?.personalInfo?.lastName,
                    viewingEnrollment?.personalInfo?.nameExtension
                  )}
                </td>
                <td
                  className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  {(() => {
                    const birthMonth =
                      viewingEnrollment?.personalInfo?.birthMonth
                    const birthDay = viewingEnrollment?.personalInfo?.birthDay
                    const birthYear = viewingEnrollment?.personalInfo?.birthYear
                    if (birthMonth && birthDay && birthYear) {
                      return formatBirthDate(
                        `${birthYear}-${String(birthMonth).padStart(
                          2,
                          '0'
                        )}-${String(birthDay).padStart(2, '0')}`
                      )
                    }
                    return 'N/A'
                  })()}
                </td>
                <td
                  className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  {(() => {
                    const birthYear = viewingEnrollment?.personalInfo?.birthYear
                    if (birthYear) {
                      const age = new Date().getFullYear() - parseInt(birthYear)
                      return `${age} years`
                    }
                    return 'N/A'
                  })()}
                </td>
                <td
                  className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  {viewingEnrollment?.personalInfo?.gender || 'N/A'}
                </td>
                <td
                  className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  {viewingEnrollment?.personalInfo?.civilStatus || 'N/A'}
                </td>
                <td
                  className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  {viewingEnrollment?.personalInfo?.citizenship || 'N/A'}
                </td>
                <td
                  className="px-6 py-4 whitespace-nowrap text-xs text-gray-900"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  {viewingEnrollment?.personalInfo?.religion || 'N/A'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-4">
        <h3
          className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 flex items-center gap-2"
          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
        >
          <div className="w-6 h-6 bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg flex items-center justify-center">
            <Phone size={14} weight="fill" className="text-white" />
          </div>
          Contact Information
        </h3>
        <div className="overflow-hidden bg-white border border-gray-200 rounded-xl">
          <table className="min-w-full border-collapse border border-gray-200">
            <thead className="bg-white border-b border-gray-200">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Email Address
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
                  Place of Birth
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td
                  className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  {studentProfiles[viewingEnrollment?.userId || '']?.email ||
                    viewingEnrollment?.personalInfo?.email ||
                    'N/A'}
                </td>
                <td
                  className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  {viewingEnrollment?.personalInfo?.phone || 'N/A'}
                </td>
                <td
                  className="px-6 py-4 text-xs text-gray-900"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  {viewingEnrollment?.personalInfo?.placeOfBirth || 'N/A'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-4">
        <h3
          className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 flex items-center gap-2"
          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
        >
          <div className="w-6 h-6 bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg flex items-center justify-center">
            <Shield size={14} weight="fill" className="text-white" />
          </div>
          Guardian Information
        </h3>
        <div className="overflow-hidden bg-white border border-gray-200 rounded-xl">
          <table className="min-w-full border-collapse border border-gray-200">
            <thead className="bg-white border-b border-gray-200">
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

        {studentProfiles[viewingEnrollment?.userId || '']?.emergencyContact && (
          <div className="bg-white border border-gray-200 rounded-xl p-4">
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

      <div className="space-y-4">
        <h3
          className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 flex items-center gap-2"
          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
        >
          <div className="w-6 h-6 bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg flex items-center justify-center">
            <GraduationCapIcon size={14} weight="fill" className="text-white" />
          </div>
          Academic Information
        </h3>
        <div className="overflow-hidden bg-white border border-gray-200 rounded-xl">
          <table className="min-w-full border-collapse border border-gray-200">
            <thead className="bg-white border-b border-gray-200">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Level
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  School Year
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Enrollment Date
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td
                  className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  {(() => {
                    const displayInfo =
                      getEnrollmentDisplayInfo(viewingEnrollment)
                    return displayInfo.displayText
                  })()}
                </td>
                <td
                  className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  {viewingEnrollment?.enrollmentInfo?.schoolYear || 'N/A'}
                </td>
                <td
                  className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  {viewingEnrollment?.enrollmentInfo?.enrollmentDate
                    ? formatDate(
                        viewingEnrollment.enrollmentInfo.enrollmentDate
                      )
                    : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium ${getStatusColor(
                      viewingEnrollment?.enrollmentInfo?.status || 'unknown'
                    )}`}
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    {viewingEnrollment?.enrollmentInfo?.status || 'Unknown'}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-4">
        <h3
          className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 flex items-center gap-2"
          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
        >
          <div className="w-6 h-6 bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg flex items-center justify-center">
            <Calendar size={14} weight="fill" className="text-white" />
          </div>
          Enrollment Timeline
        </h3>
        <div className="bg-white border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-500">
            <div>
              <Label style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                Submitted At
              </Label>
              <div className="space-y-1">
                <p className="text-xs font-mono">
                  {viewingEnrollment?.submittedAt
                    ? formatDate(viewingEnrollment.submittedAt)
                    : 'N/A'}
                </p>
                {viewingEnrollment?.submittedAt && (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 flex-shrink-0"
                      style={{
                        backgroundColor: getTimeAgoInfo(
                          viewingEnrollment.submittedAt
                        ).color,
                      }}
                    ></div>
                    <span
                      className="text-xs font-mono"
                      style={{ fontWeight: 400 }}
                    >
                      {getTimeAgoInfo(viewingEnrollment.submittedAt).text}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div>
              <Label style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                Last Updated
              </Label>
              <p style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
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

export default StudentInfoTab
