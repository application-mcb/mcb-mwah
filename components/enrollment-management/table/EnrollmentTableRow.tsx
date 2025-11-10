'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Eye, Lightning, Printer, Trash, Sparkle } from '@phosphor-icons/react'
import StatusBadge from './StatusBadge'
import SubmittedAtCell from './SubmittedAtCell'
import StudentCell from './StudentCell'
import LevelCell from './LevelCell'

const EnrollmentTableRow = React.memo(
  ({
    enrollment,
    studentProfile,
    onView,
    onQuickEnroll,
    onPrint,
    onDelete,
    onOpenAIChat,
    enrollingStudent,
    getEnrollmentDisplayInfo,
    getBgColor,
    getStatusHexColor,
    getTimeAgoInfo,
    formatFullName,
    formatDate,
    getInitials,
  }: any) => {
    return (
      <tr className="hover:bg-gray-50">
        <StudentCell
          enrollment={enrollment}
          studentProfile={studentProfile}
          formatFullName={formatFullName}
          getInitials={getInitials}
        />
        <LevelCell
          enrollment={enrollment}
          getEnrollmentDisplayInfo={getEnrollmentDisplayInfo}
          getBgColor={getBgColor}
        />
        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
          <StatusBadge
            status={enrollment.enrollmentInfo?.status}
            studentType={enrollment.enrollmentInfo?.studentType}
            getStatusHexColor={getStatusHexColor}
          />
        </td>
        <SubmittedAtCell
          submittedAt={enrollment.submittedAt}
          formatDate={formatDate}
          getTimeAgoInfo={getTimeAgoInfo}
        />
        <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium">
          <div className="flex gap-2">
            <Button
              onClick={() => onView(enrollment)}
              size="sm"
              className="rounded-lg bg-gradient-to-br from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 text-white border"
              disabled={enrollingStudent}
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              <Eye size={14} className="mr-1" />
              View
            </Button>
            <Button
              onClick={() => onOpenAIChat(enrollment)}
              size="sm"
              className="rounded-lg bg-gradient-to-br from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 text-white border"
              disabled={enrollingStudent}
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              <Sparkle size={14} className="mr-1" />
              AI
            </Button>
            {enrollment.enrollmentInfo?.status !== 'enrolled' && (
              <Button
                onClick={() => onQuickEnroll(enrollment)}
                size="sm"
                className="rounded-lg bg-gradient-to-br from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 text-white border"
                disabled={enrollingStudent}
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                {enrollingStudent ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Lightning size={14} className="mr-1" />
                    Quick Enroll
                  </>
                )}
              </Button>
            )}
            {enrollment.enrollmentInfo?.status === 'enrolled' && (
              <Button
                onClick={() => onPrint(enrollment)}
                size="sm"
                className="rounded-lg bg-gradient-to-br from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 text-white border"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                <Printer size={14} className="mr-1" />
                Print
              </Button>
            )}
            <Button
              onClick={() => onDelete(enrollment)}
              size="sm"
              className="rounded-lg bg-red-600 hover:bg-red-700 text-white border"
              disabled={enrollingStudent}
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              <Trash size={14} className="mr-1" />
              Delete
            </Button>
          </div>
        </td>
      </tr>
    )
  }
)

export default EnrollmentTableRow
