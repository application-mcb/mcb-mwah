'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { ExtendedEnrollmentData, StudentProfile, StudentDocuments, SubjectSetData, SubjectAssignmentData, Tab, CourseData, GradeData } from './types'
import { SubjectData } from '@/lib/subject-database'
import {
  User as UserIcon,
  FileText as FileTextIcon,
  GraduationCapIcon,
  Calculator,
  Gear,
} from '@phosphor-icons/react'
import StudentProfileHeader from './StudentProfileHeader'
import StudentInfoTab from './tabs/StudentInfoTab'
import DocumentsTab from './tabs/DocumentsTab'
import SubjectsTab from './tabs/SubjectsTab'
import GradesTab from './tabs/GradesTab'
import ActionsTab from './tabs/ActionsTab'

interface ViewStudentModalProps {
  isOpen: boolean
  onClose: () => void
  viewingEnrollment: ExtendedEnrollmentData | null
  studentProfiles: Record<string, StudentProfile>
  studentDocuments: Record<string, StudentDocuments>
  subjectSets: Record<number, SubjectSetData[]>
  subjects: Record<string, SubjectData>
  subjectAssignments: SubjectAssignmentData[]
  grades: Record<string, GradeData>
  courses: CourseData[]
  loadingImages: Record<string, boolean>
  onImageLoad: (userId: string) => void
  onImageError: (userId: string) => void
  onViewDocument: (doc: {url: string, fileName: string, fileType: string, fileFormat: string}) => void
  onShowPrintModal: () => void
  onUnenrollStudent: () => void
  unenrollingStudent: boolean
  onOpenAIChat: () => void
}

export default function ViewStudentModal({
  isOpen,
  onClose,
  viewingEnrollment,
  studentProfiles,
  studentDocuments,
  subjectSets,
  subjects,
  subjectAssignments,
  grades,
  courses,
  loadingImages,
  onImageLoad,
  onImageError,
  onViewDocument,
  onShowPrintModal,
  onUnenrollStudent,
  unenrollingStudent,
  onOpenAIChat,
}: ViewStudentModalProps) {
  const [activeTab, setActiveTab] = useState<string>('student-info')

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
  }

  const tabs: Tab[] = [
    {
      id: 'student-info',
      label: 'Student Information',
      icon: (
        <div className="w-5 h-5 aspect-square bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg flex items-center justify-center">
          <UserIcon size={12} weight="fill" className="text-white" />
        </div>
      ),
      content: (
        <StudentInfoTab
          viewingEnrollment={viewingEnrollment}
          studentProfiles={studentProfiles}
          grades={grades}
          courses={courses}
        />
      ),
    },
    {
      id: 'documents',
      label: 'Student Documents',
      icon: (
        <div className="w-5 h-5 aspect-square bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg flex items-center justify-center">
          <FileTextIcon size={12} weight="fill" className="text-white" />
        </div>
      ),
      content: (
        <DocumentsTab
          viewingEnrollment={viewingEnrollment}
          studentDocuments={studentDocuments}
          onViewDocument={onViewDocument}
        />
      ),
    },
    {
      id: 'subjects',
      label: 'Assigned Subjects',
      icon: (
        <div className="w-5 h-5 aspect-square bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg flex items-center justify-center">
          <GraduationCapIcon size={12} weight="fill" className="text-white" />
        </div>
      ),
      content: (
        <SubjectsTab
          viewingEnrollment={viewingEnrollment}
          subjectSets={subjectSets}
          subjects={subjects}
          subjectAssignments={subjectAssignments}
        />
      ),
    },
    {
      id: 'grades',
      label: 'Grades',
      icon: (
        <div className="w-5 h-5 aspect-square bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg flex items-center justify-center">
          <Calculator size={12} weight="fill" className="text-white" />
        </div>
      ),
      content: (
        <GradesTab viewingEnrollment={viewingEnrollment} />
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      icon: (
        <div className="w-5 h-5 aspect-square bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg flex items-center justify-center">
          <Gear size={12} weight="fill" className="text-white" />
        </div>
      ),
      content: (
        <ActionsTab
          viewingEnrollment={viewingEnrollment}
          grades={grades}
          courses={courses}
          unenrollingStudent={unenrollingStudent}
          onShowPrintModal={onShowPrintModal}
          onUnenrollStudent={onUnenrollStudent}
          onOpenAIChat={onOpenAIChat}
        />
      ),
    },
  ]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Student Details"
      size="2xl"
    >
      {viewingEnrollment && (
        <div className="p-6  overflow-y-auto">
          <StudentProfileHeader
            viewingEnrollment={viewingEnrollment}
            studentProfiles={studentProfiles}
            grades={grades}
            courses={courses}
            loadingImages={loadingImages}
            onImageLoad={onImageLoad}
            onImageError={onImageError}
          />

          {/* Tabs Navigation */}
          <div className="border border-blue-800 p-3 mb-6 rounded-xl ">
            <nav className="-mb-px flex">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium text-xs flex items-center justify-center gap-2 transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-br from-blue-800 to-blue-900 text-white border-blue-900'
                        : 'bg-white text-gray-500 hover:border-blue-300 hover:text-blue-900'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div>{tabs.find((tab) => tab.id === activeTab)?.content}</div>
        </div>
      )}
    </Modal>
  )
}
