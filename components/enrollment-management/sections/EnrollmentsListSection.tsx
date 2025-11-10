'use client'

import React from 'react'
import EnrollmentTable from '../table/EnrollmentTable'
import PaginationBar from './PaginationBar'

interface Props {
  showTableSkeleton: boolean
  filteredAndSortedEnrollments: any[]
  paginatedEnrollments: any[]
  studentProfiles: Record<string, any>
  subjectAssignments: any[]
  subjectSets: Record<string, any>
  enrollingStudent: boolean
  onView: (enrollment: any) => void
  onQuickEnroll: (enrollment: any) => void
  onDelete: (enrollment: any) => void
  onPrint: (enrollment: any) => void
  onOpenAIChat: (enrollment: any) => void
  getEnrollmentDisplayInfo: any
  getBgColor: any
  getStatusHexColor: any
  getTimeAgoInfo: any
  formatFullName: any
  formatDate: any
  getInitials: any

  currentPage: number
  setCurrentPage: (updater: (prev: number) => number) => void
  itemsPerPage: number
  totalItems: number
}

const EnrollmentsListSection: React.FC<Props> = (props) => {
  return (
    <>
      <EnrollmentTable
        showTableSkeleton={props.showTableSkeleton}
        filteredAndSortedEnrollments={props.filteredAndSortedEnrollments}
        paginatedEnrollments={props.paginatedEnrollments}
        studentProfiles={props.studentProfiles}
        subjectAssignments={props.subjectAssignments as any}
        subjectSets={props.subjectSets as any}
        enrollingStudent={props.enrollingStudent}
        onView={props.onView}
        onQuickEnroll={props.onQuickEnroll}
        onDelete={props.onDelete}
        onPrint={props.onPrint}
        onOpenAIChat={props.onOpenAIChat}
        getEnrollmentDisplayInfo={props.getEnrollmentDisplayInfo}
        getBgColor={props.getBgColor}
        getStatusHexColor={props.getStatusHexColor}
        getTimeAgoInfo={props.getTimeAgoInfo}
        formatFullName={props.formatFullName}
        formatDate={props.formatDate}
        getInitials={props.getInitials}
      />

      <PaginationBar
        currentPage={props.currentPage}
        setCurrentPage={props.setCurrentPage}
        itemsPerPage={props.itemsPerPage}
        totalItems={props.totalItems}
      />
    </>
  )
}

export default EnrollmentsListSection
