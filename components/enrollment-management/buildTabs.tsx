'use client'

import React from 'react'
import {
  Tab,
  ExtendedEnrollmentData,
  StudentProfile,
  StudentDocuments,
  SubjectSetData,
} from './types'
import StudentInfoTab from './tabs/StudentInfoTab'
import DocumentsTab from './tabs/DocumentsTab'
import SubjectAssignmentTab from './tabs/SubjectAssignmentTab'
import ProcessTab from './tabs/ProcessTab'
import RegistrarGradesTab from '../grades/RegistrarGradesTab'
import {
  User as UserIcon,
  FileText as FileTextIcon,
  GraduationCap as GraduationCapIcon,
  Gear,
  Calculator,
} from '@phosphor-icons/react'

interface Args {
  viewingEnrollment: ExtendedEnrollmentData | null
  studentProfiles: Record<string, StudentProfile>
  studentDocuments: Record<string, StudentDocuments>
  subjectSets: Record<number, SubjectSetData[]>
  subjects: Record<string, any>
  allSubjectSets: SubjectSetData[]
  subjectAssignments: any[]
  selectedSubjectSets: string[]
  selectedSubjects: string[]
  setSelectedSubjectSets: (updater: (prev: string[]) => string[]) => void
  setSelectedSubjects: (updater: (prev: string[]) => string[]) => void
  showOtherSets: boolean
  setShowOtherSets: (v: boolean) => void
  getEnrollmentDisplayInfo: (enrollment: any) => any
  getStatusColor: (status: string) => string
  getBgColor: (color: string) => string
  formatFullName: (
    firstName?: string,
    middleName?: string,
    lastName?: string,
    nameExtension?: string
  ) => string
  formatBirthDate: (dateInput: any) => string
  formatDate: (dateInput: any) => string
  getTimeAgoInfo: (dateInput: any) => { text: string; color: string }
  onViewDocument: (doc: any) => void
  onCancelProcess: () => void
  onPrintProcess: () => void
  onRevoke: () => void
  revokingEnrollment: boolean
  onOpenEnroll: () => void
  enrollingStudent: boolean
  onOpenAIChat: () => void
  handleSubjectSetToggle: (subjectSetId: string, subjectIds: string[]) => void
  handleSubjectToggle: (subjectId: string) => void
  registrarUid: string
  onDocumentStatusChange?: () => void
}

export function buildEnrollmentTabs(args: Args): Tab[] {
  const {
    viewingEnrollment,
    studentProfiles,
    studentDocuments,
    subjectSets,
    subjects,
    allSubjectSets,
    subjectAssignments,
    selectedSubjectSets,
    selectedSubjects,
    setSelectedSubjectSets,
    setSelectedSubjects,
    showOtherSets,
    setShowOtherSets,
    getEnrollmentDisplayInfo,
    getStatusColor,
    getBgColor,
    formatFullName,
    formatBirthDate,
    formatDate,
    getTimeAgoInfo,
    onViewDocument,
    onCancelProcess,
    onPrintProcess,
    onRevoke,
    revokingEnrollment,
    onOpenEnroll,
    enrollingStudent,
    onOpenAIChat,
    handleSubjectSetToggle,
    handleSubjectToggle,
    registrarUid,
    onDocumentStatusChange,
  } = args

  return [
    {
      id: 'student-info',
      label: 'Student Information',
      icon: (
        <div className="w-5 h-5 bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg flex items-center justify-center">
          <UserIcon size={12} weight="fill" className="text-white" />
        </div>
      ),
      content: (
        <StudentInfoTab
          viewingEnrollment={viewingEnrollment}
          studentProfiles={studentProfiles}
          formatFullName={formatFullName}
          formatBirthDate={formatBirthDate}
          formatDate={formatDate}
          getTimeAgoInfo={getTimeAgoInfo}
          getEnrollmentDisplayInfo={getEnrollmentDisplayInfo}
          getStatusColor={getStatusColor}
        />
      ),
    },
    {
      id: 'documents',
      label: 'Student Documents',
      icon: (
        <div className="w-5 h-5 bg-blue-900 flex items-center justify-center">
          <FileTextIcon size={12} weight="fill" className="text-white" />
        </div>
      ),
      content: (
        <div className="space-y-4">
          <h3
            className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            <div className="w-6 h-6 bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg flex items-center justify-center">
              <FileTextIcon size={14} weight="fill" className="text-white" />
            </div>
            Submitted Documents
          </h3>
          <DocumentsTab
            viewingEnrollment={viewingEnrollment}
            studentDocuments={studentDocuments as any}
            formatDate={formatDate}
            onViewDocument={onViewDocument}
            registrarUid={registrarUid}
            onDocumentStatusChange={onDocumentStatusChange}
          />
        </div>
      ),
    },
    {
      id: 'subjects',
      label: 'Subject Assignment',
      icon: (
        <div className="w-5 h-5 bg-blue-900 flex items-center justify-center">
          <GraduationCapIcon size={12} weight="fill" className="text-white" />
        </div>
      ),
      content: (
        <SubjectAssignmentTab
          viewingEnrollment={viewingEnrollment}
          subjects={subjects as any}
          subjectSetsByGrade={subjectSets as any}
          allSubjectSets={allSubjectSets as any}
          subjectAssignments={subjectAssignments as any}
          selectedSubjectSets={selectedSubjectSets}
          selectedSubjects={selectedSubjects}
          setSelectedSubjectSets={setSelectedSubjectSets}
          setSelectedSubjects={setSelectedSubjects}
          showOtherSets={showOtherSets}
          setShowOtherSets={setShowOtherSets}
          handleSubjectSetToggle={handleSubjectSetToggle}
          handleSubjectToggle={handleSubjectToggle}
        />
      ),
    },
    {
      id: 'grades',
      label: 'Grades',
      icon: (
        <div className="w-5 h-5 bg-blue-900 flex items-center justify-center">
          <Calculator size={12} weight="fill" className="text-white" />
        </div>
      ),
      content: viewingEnrollment ? (
        <div className="space-y-4">
          <h3
            className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            <div className="w-6 h-6 bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg flex items-center justify-center">
              <Calculator size={14} weight="fill" className="text-white" />
            </div>
            Student Grades
          </h3>
          <RegistrarGradesTab
            studentId={viewingEnrollment.userId}
            studentName={formatFullName(
              viewingEnrollment.personalInfo?.firstName,
              viewingEnrollment.personalInfo?.middleName,
              viewingEnrollment.personalInfo?.lastName,
              viewingEnrollment.personalInfo?.nameExtension
            )}
          />
        </div>
      ) : (
        <div
          className="px-6 py-10 text-center text-xs text-gray-500"
          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
        >
          Select a student to view grades.
        </div>
      ),
    },
    {
      id: 'process',
      label: 'Process Enrollment',
      icon: (
        <div className="w-5 h-5 bg-blue-900 flex items-center justify-center">
          <Gear size={12} weight="fill" className="text-white" />
        </div>
      ),
      content: (
        <ProcessTab
          viewingEnrollment={viewingEnrollment}
          formatFullName={formatFullName}
          formatBirthDate={formatBirthDate}
          formatDate={formatDate}
          getTimeAgoInfo={getTimeAgoInfo}
          getEnrollmentDisplayInfo={getEnrollmentDisplayInfo as any}
          getStatusColor={getStatusColor}
          onCancel={onCancelProcess}
          onPrint={onPrintProcess}
          onRevoke={onRevoke}
          revokingEnrollment={revokingEnrollment}
          onOpenEnroll={onOpenEnroll}
          enrollingStudent={enrollingStudent}
          onOpenAIChat={onOpenAIChat}
        />
      ),
    },
  ]
}

export default buildEnrollmentTabs
