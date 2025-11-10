'use client'

import React from 'react'
import ViewHandler from '@/components/viewHandler'
import EnrollmentPrintModal from '@/components/enrollment-print-modal'
import RevokeEnrollmentModal from './modals/RevokeEnrollmentModal'
import QuickEnrollModal from './modals/QuickEnrollModal'
import EnrollModal from './modals/EnrollModal'
import DeleteEnrollmentModal from './modals/DeleteEnrollmentModal'
import ScholarshipModal from './modals/ScholarshipModal'
import SettingsModal from './modals/SettingsModal'
import ViewEnrollmentModal from './modals/ViewEnrollmentModal'
import AIChatModal from '@/components/student-management/AIChatModal'
import PrerequisiteWarningModal from './modals/PrerequisiteWarningModal'
import { FailedPrerequisite } from './utils/prerequisites'

interface Props {
  // Common data
  viewingEnrollment: any
  studentProfiles: Record<string, any>
  subjects: Record<string, any>
  subjectSets: any
  registrarName?: string

  // Tabs and helpers
  activeTab: string
  onTabChange: (id: string) => void
  tabs: any[]
  formatFullName: any
  getInitials: any
  getStatusColor: any
  getEnrollmentDisplayInfo: any

  // Document viewer
  viewingDocument: {
    url: string
    fileName: string
    fileType: string
    fileFormat: string
  } | null
  showDocumentModal: boolean
  onCloseDocument: () => void

  // Print
  showPrintModal: boolean
  onClosePrint: () => void
  selectedSubjects: string[]

  // Revoke
  showRevokeModal: boolean
  onCancelRevoke: () => void
  onConfirmRevoke: () => void
  revokeCountdown: number
  revokingEnrollment: boolean

  // Quick Enroll
  showQuickEnrollModal: boolean
  onCancelQuickEnroll: () => void
  quickEnrollData: any
  filteredQuickScholarships: any[]
  quickEnrollOrNumber: string
  setQuickEnrollOrNumber: (v: string) => void
  quickEnrollScholarship: string
  setQuickEnrollScholarship: (v: string) => void
  quickEnrollStudentId: string
  setQuickEnrollStudentId: (v: string) => void
  enrollingStudent: boolean
  onConfirmQuickEnroll: () => void

  // Enroll
  showEnrollModal: boolean
  onCancelEnroll: () => void
  selectedSubjectsCount: number
  studentIdResolved: string
  enrollOrNumber: string
  setEnrollOrNumber: (v: string) => void
  enrollScholarship: string
  setEnrollScholarship: (v: string) => void
  enrollStudentId: string
  setEnrollStudentId: (v: string) => void
  filteredEnrollScholarships: any[]
  onConfirmEnroll: () => void

  // Delete
  showDeleteModal: boolean
  onCancelDelete: () => void
  onConfirmDelete: () => void
  deleteCountdown: number
  deletingEnrollment: boolean
  deleteConfirmText: string

  // Scholarship
  showScholarshipModal: boolean
  onCloseScholarship: () => void
  scholarships: any[]
  editingScholarship: any
  scholarshipForm: any
  setScholarshipForm: (updater: any) => void
  scholarshipLoading: boolean
  handleCreateScholarship: () => void
  handleUpdateScholarship: () => void
  handleDeleteScholarship: (id: string) => void
  handleEditScholarship: (s: any) => void
  resetScholarshipForm: () => void

  // Settings
  showAcademicYearModal: boolean
  onCloseAcademicYear: () => void
  newAY: string
  setNewAY: (v: string) => void
  newSemester: string
  setNewSemester: (v: string) => void
  newEnrollmentStartHS: string
  setNewEnrollmentStartHS: (v: string) => void
  newEnrollmentEndHS: string
  setNewEnrollmentEndHS: (v: string) => void
  newEnrollmentStartCollege: string
  setNewEnrollmentStartCollege: (v: string) => void
  newEnrollmentEndCollege: string
  setNewEnrollmentEndCollege: (v: string) => void
  updatingAY: boolean
  onUpdateAcademicYear: () => void
  onClearHSDuration: () => void
  onClearCollegeDuration: () => void

  // Visibility flags
  showViewModal: boolean
  onCloseView: () => void

  // AI Chat Modal props
  showAIChatModal: boolean
  aiChatEnrollment: any
  onCloseAIChatModal: () => void
  studentDocuments: Record<string, any>
  subjectAssignments: any[]
  grades: Record<string, any>
  courses: any[]
  // Prerequisite Warning
  showPrerequisiteWarning: boolean
  prerequisiteWarnings: FailedPrerequisite[]
  onCancelPrerequisiteWarning: () => void
  onProceedPrerequisiteWarning: () => void
  checkingPrerequisites: boolean
}

const EnrollmentModals: React.FC<Props> = (props) => {
  const {
    viewingEnrollment,
    studentProfiles,
    subjects,
    subjectSets,
    registrarName,
    activeTab,
    onTabChange,
    tabs,
    formatFullName,
    getInitials,
    getStatusColor,
    getEnrollmentDisplayInfo,
    viewingDocument,
    showDocumentModal,
    onCloseDocument,
    showPrintModal,
    onClosePrint,
    selectedSubjects,
    showRevokeModal,
    onCancelRevoke,
    onConfirmRevoke,
    revokeCountdown,
    revokingEnrollment,
    showQuickEnrollModal,
    onCancelQuickEnroll,
    quickEnrollData,
    filteredQuickScholarships,
    quickEnrollOrNumber,
    setQuickEnrollOrNumber,
    quickEnrollScholarship,
    setQuickEnrollScholarship,
    quickEnrollStudentId,
    setQuickEnrollStudentId,
    enrollingStudent,
    onConfirmQuickEnroll,
    showEnrollModal,
    onCancelEnroll,
    selectedSubjectsCount,
    studentIdResolved,
    enrollOrNumber,
    setEnrollOrNumber,
    enrollScholarship,
    setEnrollScholarship,
    enrollStudentId,
    setEnrollStudentId,
    filteredEnrollScholarships,
    onConfirmEnroll,
    showDeleteModal,
    onCancelDelete,
    onConfirmDelete,
    deleteCountdown,
    deletingEnrollment,
    deleteConfirmText,
    showScholarshipModal,
    onCloseScholarship,
    scholarships,
    editingScholarship,
    scholarshipForm,
    setScholarshipForm,
    scholarshipLoading,
    handleCreateScholarship,
    handleUpdateScholarship,
    handleDeleteScholarship,
    handleEditScholarship,
    resetScholarshipForm,
    showAcademicYearModal,
    onCloseAcademicYear,
    newAY,
    setNewAY,
    newSemester,
    setNewSemester,
    newEnrollmentStartHS,
    setNewEnrollmentStartHS,
    newEnrollmentEndHS,
    setNewEnrollmentEndHS,
    newEnrollmentStartCollege,
    setNewEnrollmentStartCollege,
    newEnrollmentEndCollege,
    setNewEnrollmentEndCollege,
    updatingAY,
    onUpdateAcademicYear,
    onClearHSDuration,
    onClearCollegeDuration,
    showViewModal,
    onCloseView,
    showAIChatModal,
    aiChatEnrollment,
    onCloseAIChatModal,
    studentDocuments,
    subjectAssignments,
    grades,
    courses,
    showPrerequisiteWarning,
    prerequisiteWarnings,
    onCancelPrerequisiteWarning,
    onProceedPrerequisiteWarning,
    checkingPrerequisites,
  } = props

  return (
    <>
      {viewingDocument && (
        <ViewHandler
          isOpen={showDocumentModal}
          onClose={onCloseDocument}
          documentUrl={viewingDocument.url}
          fileName={viewingDocument.fileName}
          fileType={viewingDocument.fileType}
          fileFormat={viewingDocument.fileFormat}
        />
      )}

      <EnrollmentPrintModal
        isOpen={showPrintModal}
        onClose={onClosePrint}
        enrollment={viewingEnrollment as any}
        studentProfile={
          viewingEnrollment ? studentProfiles[viewingEnrollment.userId] : null
        }
        selectedSubjects={selectedSubjects}
        subjects={subjects as any}
        subjectSets={subjectSets as any}
        registrarName={registrarName}
      />

      <RevokeEnrollmentModal
        isOpen={showRevokeModal}
        onClose={onCancelRevoke}
        onConfirm={onConfirmRevoke}
        revokeCountdown={revokeCountdown}
        revokingEnrollment={revokingEnrollment}
      />

      <QuickEnrollModal
        isOpen={showQuickEnrollModal}
        onClose={onCancelQuickEnroll}
        quickEnrollData={quickEnrollData}
        studentProfiles={studentProfiles as any}
        subjects={subjects as any}
        filteredQuickScholarships={filteredQuickScholarships as any}
        quickEnrollOrNumber={quickEnrollOrNumber}
        setQuickEnrollOrNumber={setQuickEnrollOrNumber}
        quickEnrollScholarship={quickEnrollScholarship}
        setQuickEnrollScholarship={setQuickEnrollScholarship}
        quickEnrollStudentId={quickEnrollStudentId}
        setQuickEnrollStudentId={setQuickEnrollStudentId}
        enrollingStudent={enrollingStudent}
        onConfirm={onConfirmQuickEnroll}
        formatFullName={formatFullName}
        getEnrollmentDisplayInfo={getEnrollmentDisplayInfo as any}
      />

      <EnrollModal
        isOpen={showEnrollModal}
        onClose={onCancelEnroll}
        viewingEnrollment={viewingEnrollment}
        selectedSubjectsCount={selectedSubjectsCount}
        studentIdResolved={studentIdResolved}
        enrollOrNumber={enrollOrNumber}
        setEnrollOrNumber={setEnrollOrNumber}
        enrollScholarship={enrollScholarship}
        setEnrollScholarship={setEnrollScholarship}
        enrollStudentId={enrollStudentId}
        setEnrollStudentId={setEnrollStudentId}
        filteredEnrollScholarships={filteredEnrollScholarships as any}
        enrollingStudent={enrollingStudent}
        onConfirm={onConfirmEnroll}
        formatFullName={formatFullName}
        getEnrollmentDisplayInfo={getEnrollmentDisplayInfo as any}
      />

      <DeleteEnrollmentModal
        isOpen={showDeleteModal}
        onClose={onCancelDelete}
        onConfirm={onConfirmDelete}
        deleteCountdown={deleteCountdown}
        deletingEnrollment={deletingEnrollment}
        confirmText={deleteConfirmText}
      />

      <ScholarshipModal
        isOpen={showScholarshipModal}
        onClose={onCloseScholarship}
        scholarships={scholarships}
        editingScholarship={editingScholarship}
        scholarshipForm={scholarshipForm}
        setScholarshipForm={setScholarshipForm as any}
        scholarshipLoading={scholarshipLoading}
        handleCreateScholarship={handleCreateScholarship}
        handleUpdateScholarship={handleUpdateScholarship}
        handleDeleteScholarship={handleDeleteScholarship}
        handleEditScholarship={handleEditScholarship}
        resetScholarshipForm={resetScholarshipForm}
      />

      <SettingsModal
        isOpen={showAcademicYearModal}
        onClose={onCloseAcademicYear}
        newAY={newAY}
        setNewAY={setNewAY}
        newSemester={newSemester}
        setNewSemester={setNewSemester}
        newEnrollmentStartHS={newEnrollmentStartHS}
        setNewEnrollmentStartHS={setNewEnrollmentStartHS}
        newEnrollmentEndHS={newEnrollmentEndHS}
        setNewEnrollmentEndHS={setNewEnrollmentEndHS}
        newEnrollmentStartCollege={newEnrollmentStartCollege}
        setNewEnrollmentStartCollege={setNewEnrollmentStartCollege}
        newEnrollmentEndCollege={newEnrollmentEndCollege}
        setNewEnrollmentEndCollege={setNewEnrollmentEndCollege}
        updatingAY={updatingAY}
        onUpdateAcademicYear={onUpdateAcademicYear}
        onClearHSDuration={onClearHSDuration}
        onClearCollegeDuration={onClearCollegeDuration}
      />

      <ViewEnrollmentModal
        isOpen={props.showViewModal}
        onClose={props.onCloseView}
        viewingEnrollment={viewingEnrollment}
        studentProfiles={studentProfiles}
        activeTab={activeTab}
        onTabChange={onTabChange}
        tabs={tabs as any}
        formatFullName={formatFullName}
        getInitials={getInitials}
        getStatusColor={getStatusColor}
        getEnrollmentDisplayInfo={getEnrollmentDisplayInfo as any}
      />

      {/* AI Chat Modal */}
      {aiChatEnrollment && (
        <AIChatModal
          isOpen={showAIChatModal}
          onClose={onCloseAIChatModal}
          enrollment={aiChatEnrollment}
          studentProfile={
            aiChatEnrollment ? studentProfiles[aiChatEnrollment.userId] : null
          }
          studentDocuments={
            aiChatEnrollment ? studentDocuments[aiChatEnrollment.userId] : null
          }
          subjects={subjects as any}
          subjectSets={subjectSets as any}
          subjectAssignments={subjectAssignments as any}
          grades={grades as any}
          courses={courses as any}
        />
      )}

      {/* Prerequisite Warning Modal */}
      <PrerequisiteWarningModal
        isOpen={showPrerequisiteWarning}
        onClose={onCancelPrerequisiteWarning}
        onProceed={onProceedPrerequisiteWarning}
        failedPrerequisites={prerequisiteWarnings}
        studentName={
          quickEnrollData
            ? formatFullName(
                quickEnrollData.enrollment.personalInfo?.firstName,
                quickEnrollData.enrollment.personalInfo?.middleName,
                quickEnrollData.enrollment.personalInfo?.lastName,
                quickEnrollData.enrollment.personalInfo?.nameExtension
              )
            : viewingEnrollment
            ? formatFullName(
                viewingEnrollment.personalInfo?.firstName,
                viewingEnrollment.personalInfo?.middleName,
                viewingEnrollment.personalInfo?.lastName,
                viewingEnrollment.personalInfo?.nameExtension
              )
            : undefined
        }
      />
    </>
  )
}

export default EnrollmentModals
