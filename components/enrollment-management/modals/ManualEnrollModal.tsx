'use client'

import React from 'react'
import { Modal } from '@/components/ui/modal'
import SubjectAssignmentTab from '../tabs/SubjectAssignmentTab'
import {
  UserCircle,
  IdentificationBadge,
  ClipboardText,
  CheckCircle,
} from '@phosphor-icons/react'
import { getBgColor } from '../utils/color'
import { FailedPrerequisite } from '../utils/prerequisites'

interface Props {
  isOpen: boolean
  onClose: () => void
  enrollment: any
  studentProfile: any
  subjects: Record<string, any>
  subjectSetsByGrade: Record<number, any[]>
  allSubjectSets: any[]
  subjectAssignments: any[]
  selectedSubjects: string[]
  setSelectedSubjects: (updater: (prev: string[]) => string[]) => void
  showOtherSets: boolean
  setShowOtherSets: (value: boolean) => void
  handleSubjectToggle: (subjectId: string) => void
  checkingPrerequisites: boolean
  onProceed: () => void
  formatFullName: (
    first?: string,
    middle?: string,
    last?: string,
    ext?: string
  ) => string
  getEnrollmentDisplayInfo: (enrollment: any) => { displayText: string }
  manualSubjectCheckId?: string | null
  manualBlockedSubjects?: Record<string, FailedPrerequisite[]>
  takenSubjects?: Record<string, boolean>
  isLoading?: boolean
  takenLoading?: boolean
  validationDone?: boolean
}

const ManualEnrollModal: React.FC<Props> = ({
  isOpen,
  onClose,
  enrollment,
  studentProfile,
  subjects,
  subjectSetsByGrade,
  allSubjectSets,
  subjectAssignments,
  selectedSubjects,
  setSelectedSubjects,
  showOtherSets,
  setShowOtherSets,
  handleSubjectToggle,
  checkingPrerequisites,
  onProceed,
  formatFullName,
  getEnrollmentDisplayInfo,
  manualSubjectCheckId,
  manualBlockedSubjects,
  takenSubjects,
  isLoading = false,
  takenLoading = false,
  validationDone = false,
}) => {
  const hasSelection = selectedSubjects.length > 0

  const enrollmentDisplay = enrollment
    ? getEnrollmentDisplayInfo(enrollment).displayText
    : ''

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manual Enrollment"
      size="full"
      zIndex={70}
    >
      <div className="p-6 bg-gray-50 space-y-6">
        {!enrollment ? (
          <div
            className="bg-white border border-gray-200 rounded-xl p-6 text-center text-sm text-gray-600"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            Select a student from the table to start manual enrollment.
          </div>
        ) : isLoading ? (
          <div className="space-y-4" aria-busy="true">
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
              {(() => {
                const steps = [
                  {
                    label: 'Validating selections',
                    complete: validationDone || selectedSubjects.length === 0,
                  },
                  {
                    label: 'Detecting previously taken subjects',
                    complete: !takenLoading,
                  },
                  {
                    label: 'Preparing interface',
                    complete: validationDone && !takenLoading,
                  },
                ]
                const currentStep =
                  steps.find((step) => !step.complete) ||
                  steps[steps.length - 1]
                const stepIndex = steps.indexOf(currentStep)
                const completedSteps = steps.filter(
                  (step) => step.complete
                ).length
                const progress = (completedSteps / steps.length) * 100

                return (
                  <>
                    <div className="flex items-center justify-between">
                      <p
                        className="text-xs text-gray-700 uppercase tracking-wide"
                        style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                      >
                        {currentStep.label}
                      </p>
                      <span
                        className="text-[11px] text-gray-500"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        Step {Math.min(stepIndex + 1, steps.length)} of{' '}
                        {steps.length}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          progress >= 100 ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      ></div>
                    </div>
                  </>
                )
              })()}
            </div>
            <div className="grid gap-6 xl:grid-cols-3 animate-pulse">
              <div className="space-y-4">
                <section className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gray-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-16 bg-gray-200 rounded" />
                      <div className="h-4 w-32 bg-gray-200 rounded" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[1, 2, 3].map((item) => (
                      <div
                        key={`info-${item}`}
                        className="h-3 w-3/4 bg-gray-200 rounded"
                      />
                    ))}
                  </div>
                </section>
                <section className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-3 w-20 bg-gray-200 rounded" />
                    <div className="h-3 w-8 bg-gray-200 rounded" />
                  </div>
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={`selected-skeleton-${i}`}
                        className="h-10 w-full rounded-lg bg-gray-100"
                      />
                    ))}
                  </div>
                  <div className="space-y-2">
                    <div className="h-8 w-full rounded-lg bg-gray-200" />
                    <div className="h-8 w-full rounded-lg bg-gray-200" />
                  </div>
                </section>
              </div>
              <div className="xl:col-span-2 bg-white border border-gray-200 rounded-xl p-5 space-y-4">
                <div className="h-4 w-40 bg-gray-200 rounded" />
                {[...Array(5)].map((_, index) => (
                  <div
                    key={`row-skeleton-${index}`}
                    className="h-12 w-full rounded-lg bg-gray-100"
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-3">
            <div className="space-y-4">
              <section className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-900 text-white flex items-center justify-center">
                    <UserCircle size={28} weight="fill" />
                  </div>
                  <div>
                    <p
                      className="text-sm text-gray-600"
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      Student
                    </p>
                    <p
                      className="text-lg text-gray-900"
                      style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                    >
                      {formatFullName(
                        enrollment.personalInfo?.firstName,
                        enrollment.personalInfo?.middleName,
                        enrollment.personalInfo?.lastName,
                        enrollment.personalInfo?.nameExtension
                      )}
                    </p>
                  </div>
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <IdentificationBadge size={14} />
                    <span style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                      Level:
                    </span>
                    <span
                      className="text-gray-900"
                      style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                    >
                      {enrollmentDisplay}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <ClipboardText size={14} />
                    <span style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                      Type:
                    </span>
                    <span
                      className="text-gray-900 capitalize"
                      style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                    >
                      {enrollment.enrollmentInfo?.studentType || 'regular'}
                    </span>
                  </div>
                  {studentProfile?.studentId && (
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <CheckCircle size={14} />
                      <span style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                        Student ID:
                      </span>
                      <span
                        className="text-gray-900"
                        style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                      >
                        {studentProfile?.studentId}
                      </span>
                    </div>
                  )}
                </div>
              </section>

              <section className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span
                    className="text-gray-600"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Selected Subjects
                  </span>
                  <span
                    className={hasSelection ? 'text-blue-900' : 'text-red-600'}
                    style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                  >
                    {selectedSubjects.length}
                  </span>
                </div>

                {hasSelection ? (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {selectedSubjects.map((subjectId) => {
                      const subject = subjects[subjectId]
                      if (!subject) return null
                      return (
                        <div
                          key={`selected-${subjectId}`}
                          className="rounded-xl border border-gray-200 px-3 py-2 bg-gray-50"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span
                                className="inline-block h-3 w-3 rounded"
                                style={{
                                  backgroundColor: getBgColor(subject.color),
                                }}
                              />
                              <p
                                className="text-xs font-medium text-gray-900"
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 500,
                                }}
                              >
                                {subject.code} • {subject.name}
                              </p>
                            </div>
                            <span
                              className="text-[10px] text-gray-500"
                              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                            >
                              {(
                                (subject.lectureUnits || 0) +
                                (subject.labUnits || 0)
                              ).toLocaleString()}{' '}
                              units
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p
                    className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-xs text-gray-500"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Select at least one subject to continue.
                  </p>
                )}

                <div className="flex flex-col gap-3 pt-2">
                  <button
                    onClick={onClose}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg text-xs font-medium hover:bg-gray-700 transition-colors"
                    style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                    aria-label="Cancel manual enrollment"
                    disabled={checkingPrerequisites}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onProceed}
                    className="w-full px-4 py-2 bg-blue-900 text-white rounded-lg text-xs font-medium hover:bg-blue-950 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                    aria-label="Proceed to manual enrollment confirmation"
                    disabled={checkingPrerequisites || !hasSelection}
                  >
                    {checkingPrerequisites && (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    )}
                    {checkingPrerequisites ? 'Checking...' : 'Enroll Student'}
                  </button>
                </div>
              </section>
            </div>
            <div className="xl:col-span-2 bg-white border border-gray-200 rounded-xl p-4 overflow-y-auto max-h-[calc(100vh-200px)]">
              <SubjectAssignmentTab
                viewingEnrollment={enrollment}
                subjects={subjects}
                subjectSetsByGrade={subjectSetsByGrade}
                allSubjectSets={allSubjectSets as any}
                subjectAssignments={subjectAssignments}
                selectedSubjects={selectedSubjects}
                setSelectedSubjects={setSelectedSubjects}
                showOtherSets={showOtherSets}
                setShowOtherSets={setShowOtherSets}
                handleSubjectToggle={handleSubjectToggle}
                showSelectedSummary={false}
                pendingSubjectId={manualSubjectCheckId}
                blockedSubjects={manualBlockedSubjects}
                takenSubjects={takenSubjects}
              />
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default ManualEnrollModal
