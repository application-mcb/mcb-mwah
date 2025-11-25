'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Eye,
  Lightning,
  Printer,
  Trash,
  Sparkle,
  Gear,
  Notebook,
} from '@phosphor-icons/react'
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
    onManualEnroll,
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
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          menuRef.current &&
          !menuRef.current.contains(event.target as Node)
        ) {
          setIsMenuOpen(false)
        }
      }

      if (isMenuOpen) {
        document.addEventListener('mousedown', handleClickOutside)
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }, [isMenuOpen])

    // Render empty row if enrollment is null
    if (!enrollment) {
      return (
        <tr className="h-16">
          <td className="px-6 py-4 border-r border-gray-200"></td>
          <td className="px-6 py-4 border-r border-gray-200"></td>
          <td className="px-6 py-4 border-r border-gray-200"></td>
          <td className="px-6 py-4 border-r border-gray-200"></td>
          <td className="px-6 py-4"></td>
        </tr>
      )
    }

    const handleMenuAction = (action: () => void) => {
      action()
      setIsMenuOpen(false)
    }

    // Get the time ago info to determine cell background color
    const timeAgoInfo = getTimeAgoInfo(enrollment.submittedAt)

    // Map hex color to Tailwind background class
    const getCellBgColor = (hexColor: string): string => {
      const colorMap: Record<string, string> = {
        '#065f46': 'bg-emerald-50', // Very fresh (< 1 day)
        '#92400e': 'bg-amber-50', // 1-7 days
        '#9a3412': 'bg-orange-50', // 1-4 weeks
        '#991b1b': 'bg-red-50', // 1-12 months
        '#7f1d1d': 'bg-red-50', // >1 year
      }
      return colorMap[hexColor] || 'bg-white'
    }

    const cellBgClass = getCellBgColor(timeAgoInfo.color)

    return (
      <tr className="hover:bg-gray-50">
        <StudentCell
          enrollment={enrollment}
          studentProfile={studentProfile}
          formatFullName={formatFullName}
          getInitials={getInitials}
          cellBgClass={cellBgClass}
        />
        <LevelCell
          enrollment={enrollment}
          getEnrollmentDisplayInfo={getEnrollmentDisplayInfo}
          getBgColor={getBgColor}
          cellBgClass={cellBgClass}
        />
        <td
          className={`px-6 py-4 whitespace-nowrap border-r border-gray-200 ${cellBgClass}`}
        >
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
          cellBgClass={cellBgClass}
        />
        <td
          className={`px-6 py-4 whitespace-nowrap text-right text-xs font-medium ${cellBgClass}`}
        >
          <div className="relative" ref={menuRef}>
            <Button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              size="sm"
              variant="ghost"
              className="rounded-lg bg-blue-900 hover:bg-blue-800 flex items-center gap-2"
              disabled={enrollingStudent}
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              aria-label="Open enrollment settings"
            >
              <Gear size={16} weight="fill" className="text-white" />
              <span className="text-xs text-white">Settings</span>
            </Button>
            {isMenuOpen && (
              <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 shadow-lg rounded-lg z-50">
                <div className="py-1">
                  <button
                    onClick={() => handleMenuAction(() => onView(enrollment))}
                    className="w-full px-4 py-2 text-left text-xs hover:bg-gray-100 flex items-center gap-2"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    <Eye size={14} />
                    View
                  </button>
                  {enrollment.enrollmentInfo?.status !== 'enrolled' && (
                    <button
                      onClick={() =>
                        handleMenuAction(() => onManualEnroll(enrollment))
                      }
                      className="w-full px-4 py-2 text-left text-xs hover:bg-gray-100 flex items-center gap-2"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      <Notebook size={14} />
                      Manual Enrollment
                    </button>
                  )}
                  <button
                    onClick={() =>
                      handleMenuAction(() => onOpenAIChat(enrollment))
                    }
                    className="w-full px-4 py-2 text-left text-xs hover:bg-gray-100 flex items-center gap-2"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    <Sparkle size={14} />
                    Ask AI
                  </button>
                  {enrollment.enrollmentInfo?.status !== 'enrolled' && (
                    <button
                      onClick={() =>
                        handleMenuAction(() => onQuickEnroll(enrollment))
                      }
                      disabled={enrollingStudent}
                      className="w-full px-4 py-2 text-left text-xs hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      {enrollingStudent ? (
                        <>
                          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <Lightning size={14} />
                          Quick Enroll
                        </>
                      )}
                    </button>
                  )}
                  {enrollment.enrollmentInfo?.status === 'enrolled' && (
                    <button
                      onClick={() =>
                        handleMenuAction(() => onPrint(enrollment))
                      }
                      className="w-full px-4 py-2 text-left text-xs hover:bg-gray-100 flex items-center gap-2"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      <Printer size={14} />
                      Print
                    </button>
                  )}
                  <div className="border-t border-gray-200 my-1"></div>
                  <button
                    onClick={() => handleMenuAction(() => onDelete(enrollment))}
                    disabled={enrollingStudent}
                    className="w-full px-4 py-2 text-left text-xs hover:bg-red-50 text-red-600 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    <Trash size={14} />
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </td>
      </tr>
    )
  }
)

export default EnrollmentTableRow
