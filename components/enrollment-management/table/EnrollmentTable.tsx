'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import HeaderCell from './HeaderCell'
import {
  User,
  GraduationCap,
  Circle,
  Calendar,
  Gear,
} from '@phosphor-icons/react'
import SkeletonTable from './SkeletonTable'
import EnrollmentTableRow from './EnrollmentTableRow'

interface Props {
  showTableSkeleton: boolean
  filteredAndSortedEnrollments: any[]
  paginatedEnrollments: any[]
  studentProfiles: Record<string, any>
  subjectAssignments: any[]
  subjectSets: Record<number, any[]> | any[]
  enrollingStudent: boolean
  onView: (enrollment: any) => void
  onQuickEnroll: (enrollment: any) => void
  onDelete: (enrollment: any) => void
  onPrint: (enrollment: any) => Promise<void> | void
  onOpenAIChat: (enrollment: any) => void
  // utils
  getEnrollmentDisplayInfo: (e: any) => any
  getBgColor: (c: string) => string
  getStatusHexColor: (s: string) => string
  getTimeAgoInfo: (d: any) => { text: string; color: string }
  formatFullName: (
    firstName?: string,
    middleName?: string,
    lastName?: string,
    nameExtension?: string
  ) => string
  formatDate: (d: any) => string
  getInitials: (firstName?: string, lastName?: string) => string
}

const EnrollmentTable: React.FC<Props> = ({
  showTableSkeleton,
  filteredAndSortedEnrollments,
  paginatedEnrollments,
  studentProfiles,
  subjectAssignments,
  subjectSets,
  enrollingStudent,
  onView,
  onQuickEnroll,
  onDelete,
  onPrint,
  onOpenAIChat,
  getEnrollmentDisplayInfo,
  getBgColor,
  getStatusHexColor,
  getTimeAgoInfo,
  formatFullName,
  formatDate,
  getInitials,
}) => {
  return (
    <Card className="overflow-hidden pt-0 mt-0 mb-0 pb-0 border border-gray-200 shadow-lg rounded-xl">
      {showTableSkeleton ? (
        <SkeletonTable />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg border-b border-blue-900">
              <tr>
                <HeaderCell
                  icon={<User size={12} weight="bold" />}
                  text="Student"
                />
                <HeaderCell
                  icon={<GraduationCap size={12} weight="bold" />}
                  text="Level"
                />
                <HeaderCell
                  icon={<Circle size={12} weight="bold" />}
                  text="Status"
                />
                <HeaderCell
                  icon={<Calendar size={12} weight="bold" />}
                  text="Submitted"
                  className="hidden lg:table-cell"
                />
                <HeaderCell
                  icon={<Gear size={12} weight="bold" />}
                  text="Actions"
                  className="border-r-0"
                />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 rounded-b-xl">
              {filteredAndSortedEnrollments.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-gray-500 border-t border-gray-200"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    No enrollments found.
                  </td>
                </tr>
              ) : (
                paginatedEnrollments.map((enrollment, index) => (
                  <EnrollmentTableRow
                    key={enrollment?.userId || `empty-${index}`}
                    enrollment={enrollment}
                    studentProfile={
                      enrollment ? studentProfiles[enrollment.userId] : null
                    }
                    onView={onView}
                    onQuickEnroll={onQuickEnroll}
                    onDelete={onDelete}
                    onPrint={onPrint}
                    onOpenAIChat={onOpenAIChat}
                    enrollingStudent={enrollingStudent}
                    subjectAssignments={subjectAssignments}
                    subjectSets={subjectSets}
                    getEnrollmentDisplayInfo={getEnrollmentDisplayInfo}
                    getBgColor={getBgColor}
                    getStatusHexColor={getStatusHexColor}
                    getTimeAgoInfo={getTimeAgoInfo}
                    formatFullName={formatFullName}
                    formatDate={formatDate}
                    getInitials={getInitials}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

export default EnrollmentTable
