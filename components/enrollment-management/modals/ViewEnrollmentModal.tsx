'use client'

import React from 'react'
import { Modal } from '@/components/ui/modal'
import { User as UserIcon, FileText as FileTextIcon, Calculator } from '@phosphor-icons/react'

interface Props {
  isOpen: boolean
  onClose: () => void
  viewingEnrollment: any
  studentProfiles: Record<string, any>
  activeTab: string
  onTabChange: (tabId: string) => void
  tabs: Array<{ id: string; label: string; icon: React.ReactElement; content: React.ReactNode }>
  formatFullName: (a?: string, b?: string, c?: string, d?: string) => string
  getInitials: (first?: string, last?: string) => string
  getStatusColor: (status: string) => string
  getEnrollmentDisplayInfo: (enrollment: any) => { displayText: string }
}

const ViewEnrollmentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  viewingEnrollment,
  studentProfiles,
  activeTab,
  onTabChange,
  tabs,
  formatFullName,
  getInitials,
  getStatusColor,
  getEnrollmentDisplayInfo,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Student Enrollment Details" size="2xl">
      {viewingEnrollment && (
        <div className="p-6  overflow-y-auto">
          <div className="flex items-center gap-4 mb-6 p-4 bg-white rounded-xl border border-gray-200">
            <div className="flex-shrink-0 h-16 w-16 rounded-full border-2 border-gray-200 border-black/80">
              {studentProfiles[viewingEnrollment.userId]?.photoURL ? (
                <img
                  src={studentProfiles[viewingEnrollment.userId].photoURL}
                  alt={`${viewingEnrollment.personalInfo?.firstName || 'Student'} profile`}
                  className="h-16 w-16 object-cover border-2 border-gray-200 rounded-full border-black/80"
                />
              ) : (
                <div className="h-16 w-16 bg-gradient-to-br from-blue-800 to-blue-900 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg font-medium" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                    {getInitials(viewingEnrollment.personalInfo?.firstName, viewingEnrollment.personalInfo?.lastName)}
                  </span>
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-medium text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                {formatFullName(
                  viewingEnrollment?.personalInfo?.firstName,
                  viewingEnrollment?.personalInfo?.middleName,
                  viewingEnrollment?.personalInfo?.lastName,
                  viewingEnrollment?.personalInfo?.nameExtension
                )}
              </h2>
              <p className="text-gray-600 font-mono uppercase text-xs" style={{ fontWeight: 400 }}>
                #{viewingEnrollment.id || 'N/A'}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`inline-flex px-2 py-1 text-xs font-medium uppercase ${getStatusColor(
                    viewingEnrollment?.enrollmentInfo?.status || 'unknown'
                  )}`}
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  {viewingEnrollment?.enrollmentInfo?.status || 'Unknown'}
                </span>
                <span className="text-xs text-gray-500" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  {(() => getEnrollmentDisplayInfo(viewingEnrollment).displayText)()}
                </span>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-xl p-3 mb-6">
            <nav className="-mb-px flex">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id
                const getTabIcon = (tabId: string, active: boolean) => {
                  const iconClass = active ? 'text-blue-900' : 'text-white'
                  const bgClass = active ? 'bg-white' : 'bg-gradient-to-br from-blue-800 to-blue-900'
                  switch (tabId) {
                    case 'student-info':
                      return (
                        <div className={`w-5 h-5 flex items-center justify-center ${bgClass}`}>
                          <UserIcon size={12} weight="fill" className={iconClass} />
                        </div>
                      )
                    case 'documents':
                      return (
                        <div className={`w-5 h-5 flex items-center justify-center ${bgClass}`}>
                          <FileTextIcon size={12} weight="fill" className={iconClass} />
                        </div>
                      )
                    case 'grades':
                      return (
                        <div className={`w-5 h-5 flex items-center justify-center ${bgClass}`}>
                          <Calculator size={12} weight="fill" className={iconClass} />
                        </div>
                      )
                    default:
                      return (
                        <div className={`w-5 h-5 flex items-center justify-center ${bgClass}`}>
                          <UserIcon size={12} weight="fill" className={iconClass} />
                        </div>
                      )
                  }
                }

                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`flex-1 py-3 px-4 font-medium text-xs flex items-center justify-center gap-2 transition-all duration-200 rounded-lg ${
                      isActive
                        ? 'bg-gradient-to-br from-blue-800 to-blue-900 text-white border-b-2 border-blue-900'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-white border-b-2 border-transparent'
                    }`}
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    {getTabIcon(tab.id, isActive)}
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>

          <div>{tabs.find((tab) => tab.id === activeTab)?.content}</div>
        </div>
      )}
    </Modal>
  )
}

export default ViewEnrollmentModal


