'use client'

import React from 'react'
import { ExtendedEnrollmentData, StudentProfile, StudentDocument, StudentDocuments } from './types'
import { SubjectData } from '@/lib/subject-database'
import { SubjectSetData } from './types'
import { SubjectAssignmentData, CourseData, GradeData } from './types'
import ViewStudentModal from './ViewStudentModal'
import ViewHandler from '../viewHandler'
import EnrollmentPrintModal from '../enrollment-print-modal'
import UnenrollModal from './UnenrollModal'
import AIChatModal from './AIChatModal'

interface ModalsSectionProps {
  // View Student Modal props
  showViewModal: boolean
  viewingEnrollment: ExtendedEnrollmentData | null
  studentProfiles: Record<string, StudentProfile>
  studentDocuments: Record<string, StudentDocuments>
  subjectSets: Record<number, SubjectSetData[]>
  subjects: Record<string, SubjectData>
  subjectAssignments: SubjectAssignmentData[]
  grades: Record<string, GradeData>
  courses: CourseData[]
  loadingImages: Record<string, boolean>
  onCloseViewModal: () => void
  onImageLoad: (userId: string) => void
  onImageError: (userId: string) => void
  onViewDocument: (doc: StudentDocument) => void
  onShowPrintModal: () => void
  onUnenrollStudent: () => void
  unenrollingStudent: boolean
  onOpenAIChat: () => void
  registrarUid: string
  onDocumentStatusChange?: () => void

  // Document Viewer Modal props
  showDocumentModal: boolean
  viewingDocument: {
    url: string
    fileName: string
    fileType: string
    fileFormat: string
  } | null
  onCloseDocumentModal: () => void

  // Print Modal props
  showPrintModal: boolean
  selectedSubjects: string[]
  registrarName: string | undefined
  onClosePrintModal: () => void

  // Unenroll Modal props
  showUnenrollModal: boolean
  unenrollCountdown: number
  onCancelUnenroll: () => void
  onConfirmUnenroll: () => void

  // AI Chat Modal props
  showAIChatModal: boolean
  aiChatEnrollment: ExtendedEnrollmentData | null
  onCloseAIChatModal: () => void
}

export default function ModalsSection({
  // View Student Modal props
  showViewModal,
  viewingEnrollment,
  studentProfiles,
  studentDocuments,
  subjectSets,
  subjects,
  subjectAssignments,
  grades,
  courses,
  loadingImages,
  onCloseViewModal,
  onImageLoad,
  onImageError,
  onViewDocument,
  onShowPrintModal,
  onUnenrollStudent,
  unenrollingStudent,
  onOpenAIChat,
  registrarUid,
  onDocumentStatusChange,

  // Document Viewer Modal props
  showDocumentModal,
  viewingDocument,
  onCloseDocumentModal,

  // Print Modal props
  showPrintModal,
  selectedSubjects,
  registrarName,
  onClosePrintModal,

  // Unenroll Modal props
  showUnenrollModal,
  unenrollCountdown,
  onCancelUnenroll,
  onConfirmUnenroll,

  // AI Chat Modal props
  showAIChatModal,
  aiChatEnrollment,
  onCloseAIChatModal,
}: ModalsSectionProps) {
  return (
    <>
      {/* View Student Modal */}
      <ViewStudentModal
        isOpen={showViewModal}
        onClose={onCloseViewModal}
        viewingEnrollment={viewingEnrollment}
        studentProfiles={studentProfiles}
        studentDocuments={studentDocuments}
        subjectSets={subjectSets}
        subjects={subjects}
        subjectAssignments={subjectAssignments}
        grades={grades}
        courses={courses}
        loadingImages={loadingImages}
        onImageLoad={onImageLoad}
        onImageError={onImageError}
        onViewDocument={onViewDocument}
        onShowPrintModal={onShowPrintModal}
        onUnenrollStudent={onUnenrollStudent}
        unenrollingStudent={unenrollingStudent}
        onOpenAIChat={onOpenAIChat}
        registrarUid={registrarUid}
        onDocumentStatusChange={onDocumentStatusChange}
      />

      {/* Document Viewer Modal */}
      {viewingDocument && (
        <ViewHandler
          isOpen={showDocumentModal}
          onClose={onCloseDocumentModal}
          documentUrl={viewingDocument.url}
          fileName={viewingDocument.fileName}
          fileType={viewingDocument.fileType}
          fileFormat={viewingDocument.fileFormat}
        />
      )}

      {/* Print Modal */}
      <EnrollmentPrintModal
        isOpen={showPrintModal}
        onClose={onClosePrintModal}
        enrollment={viewingEnrollment}
        studentProfile={
          viewingEnrollment ? studentProfiles[viewingEnrollment.userId] : null
        }
        selectedSubjects={selectedSubjects}
        subjects={subjects}
        subjectSets={subjectSets}
        registrarName={registrarName}
      />

      <UnenrollModal
        isOpen={showUnenrollModal}
        onClose={onCancelUnenroll}
        unenrollCountdown={unenrollCountdown}
        unenrollingStudent={unenrollingStudent}
        onConfirmUnenroll={onConfirmUnenroll}
        onCancel={onCancelUnenroll}
      />

      {/* AI Chat Modal */}
      {aiChatEnrollment && (
        <AIChatModal
          isOpen={showAIChatModal}
          onClose={onCloseAIChatModal}
          enrollment={aiChatEnrollment}
          studentProfile={
            aiChatEnrollment
              ? studentProfiles[aiChatEnrollment.userId]
              : null
          }
          studentDocuments={
            aiChatEnrollment
              ? studentDocuments[aiChatEnrollment.userId]
              : null
          }
          subjects={subjects}
          subjectSets={subjectSets}
          subjectAssignments={subjectAssignments}
          grades={grades}
          courses={courses}
        />
      )}
    </>
  )
}
