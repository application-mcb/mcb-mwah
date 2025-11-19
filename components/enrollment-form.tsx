'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { toast } from 'react-toastify'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import ComplianceStep from '@/components/enrollment-form/compliance'
import LevelSelectionStep from '@/components/enrollment-form/level-selection'
import GradeSelectionStep from '@/components/enrollment-form/grade-selection'
import CourseSelectionStep from '@/components/enrollment-form/course-selection'
import YearSelectionStep from '@/components/enrollment-form/year-selection'
import SemesterSelectionStep from '@/components/enrollment-form/semester-selection'
import PersonalInfoStep from '@/components/enrollment-form/personal-info'
import ConfirmationStep from '@/components/enrollment-form/confirmation'
import ProgressIndicator from '@/components/enrollment-form/progress-indicator'
import IrregularStudentModal from '@/components/enrollment-form/irregular-student-modal'
import CourseChangeModal from '@/components/enrollment-form/course-change-modal'
import SubmitConfirmationModal from '@/components/enrollment-form/submit-confirmation-modal'
import ReEnrollStep from '@/components/enrollment-form/re-enroll-step'
import EnrollmentSummary from '@/components/enrollment-form/enrollment-summary'
import DocumentStatusMessage from '@/components/enrollment-form/document-status-message'
import LoadingSkeleton from '@/components/enrollment-form/loading-skeleton'
import { useEnrollmentState } from '@/components/enrollment-form/use-enrollment-state'
import { createEnrollmentHandlers } from '@/components/enrollment-form/handlers/enrollment-handlers'
import {
  formatPhoneNumber,
  calculateAgeFromValues,
  isRegularGradeLevel,
  isRegularYearSemester,
} from '@/components/enrollment-form/utils/enrollment-utils'
import { GraduationCap } from '@phosphor-icons/react'
import { GradeData } from '@/lib/grade-section-database'
import {
  enrollmentSurfaceClass,
  sectionHeaderClass,
  sectionTitleClass,
  sectionSubtextClass,
  headerIconWrapperClass,
  sectionShellClass,
} from '@/components/enrollment-form/theme'

interface EnrollmentFormProps {
  userId: string
  userProfile: any
  onProgressUpdate?: () => void
}

export default function EnrollmentForm({
  userId,
  userProfile,
  onProgressUpdate,
}: EnrollmentFormProps) {
  const state = useEnrollmentState(userId, userProfile, onProgressUpdate)

  // Helper function to check if personal info is completed
  const isPersonalInfoCompleted = (): boolean => {
    const hasSelection =
      state.selectedGrade !== null ||
      (state.selectedCourse !== null &&
        state.selectedYear !== null &&
        state.selectedSemester !== null)
    return !!(
      hasSelection &&
      state.personalInfo.firstName?.trim() &&
      state.personalInfo.lastName?.trim() &&
      state.personalInfo.email?.trim() &&
      state.personalInfo.phone?.trim() &&
      state.personalInfo.gender &&
      state.personalInfo.civilStatus
    )
  }

  const changeStep = (
    newStep:
      | 'compliance'
      | 're-enroll'
      | 'level-selection'
      | 'grade-selection'
      | 'course-selection'
      | 'year-selection'
      | 'semester-selection'
      | 'personal-info'
      | 'confirmation'
  ) => {
    state.setAnimatingStep(true)
    setTimeout(() => {
      state.setCurrentStep(newStep)
      state.setAnimatingStep(false)
    }, 300)
  }

  const handlers = createEnrollmentHandlers(state, changeStep)

  const {
    handleComplianceCheck,
    handleProceedToLevelSelection,
    handleLevelSelect,
    handleGradeSelect,
    handleCourseSelect,
    handleYearSelect,
    handleSemesterSelect,
    handleReEnrollSemesterSelect,
    handlePersonalInfoChange,
    handlePhoneNumberChange,
    handlePhoneNumberKeyDown,
    handleProceedToConfirmation,
    handleStartReEnroll,
    handleProceedToReEnrollConfirmation,
    handleProceedToFinalConfirmation,
    handleBackToLevelSelection,
    handleBackToGradeSelection,
    handleBackToCourseSelection,
    handleBackToSemesterSelection,
    handleBackToPersonalInfo,
    handleBackToCompliance,
    confirmIrregularStudent,
    cancelIrregularStudent,
    confirmCourseChange,
    cancelCourseChange,
    handleOpenSubmitModal,
    handleCloseSubmitModal,
    handleFinalSubmit,
  } = handlers

  // Utility functions that are still referenced
  const saveCurrentStepData = () => {
    // This function ensures all current form data is preserved
    // The state variables are already being maintained by React state, so they persist automatically
    // when navigating between steps
  }

  const checkDocumentsStatus = async () => {
    try {
      state.setCheckingDocuments(true)
      const response = await fetch(`/api/documents?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        const documents = data.documents || []

        // Define required documents based on the documents-manager.tsx structure
        const requiredTypes = [
          'reportCard',
          'certificateOfGoodMoral',
          'birthCertificate',
          'idPicture',
        ]
        const uploadedRequired = requiredTypes.filter((type) =>
          documents.some((doc: any) => doc.type === type)
        )

        state.setDocumentsStatus({
          uploaded: uploadedRequired.length,
          required: requiredTypes.length,
          isComplete: uploadedRequired.length === requiredTypes.length,
          uploadedDocuments: documents, // Store the full documents array for detailed checking
        })
      } else {
        state.setDocumentsStatus({
          uploaded: 0,
          required: 4,
          isComplete: false,
          uploadedDocuments: [],
        })
      }
    } catch (error) {
      console.error('Error checking documents status:', error)
      state.setDocumentsStatus({
        uploaded: 0,
        required: 4,
        isComplete: false,
        uploadedDocuments: [],
      })
    } finally {
      state.setCheckingDocuments(false)
    }
  }

  const handleProgressStepClick = (
    step:
      | 'compliance'
      | 're-enroll'
      | 'level-selection'
      | 'grade-selection'
      | 'course-selection'
      | 'year-selection'
      | 'semester-selection'
      | 'personal-info'
      | 'confirmation'
  ) => {
    // Dynamic step order based on selected level
    const isSHS = state.selectedGrade?.department === 'SHS'
    let stepOrder: string[]
    if (state.selectedLevel === 'college') {
      stepOrder = [
        'compliance',
        'level-selection',
        'course-selection',
        'year-selection',
        'semester-selection',
        'personal-info',
        'confirmation',
      ]
    } else if (state.selectedLevel === 'high-school') {
      if (isSHS) {
        // SHS has semester selection
        stepOrder = [
          'compliance',
          'level-selection',
          'grade-selection',
          'semester-selection',
          'personal-info',
          'confirmation',
        ]
      } else {
        // JHS - no semester
        stepOrder = [
          'compliance',
          'level-selection',
          'grade-selection',
          'personal-info',
          'confirmation',
        ]
      }
    } else {
      stepOrder = ['compliance', 'level-selection']
    }

    const currentStepIndex = stepOrder.indexOf(state.currentStep)
    const targetStepIndex = stepOrder.indexOf(step)

    // Check if the target step has been completed
    const isStepCompleted = (targetStep: string) => {
      switch (targetStep) {
        case 'compliance':
          return state.complianceChecked
        case 'level-selection':
          return state.selectedLevel !== null
        case 'grade-selection':
          return state.selectedGrade !== null
        case 'course-selection':
          return state.selectedCourse !== null
        case 'year-selection':
          return state.selectedYear !== null
        case 'semester-selection':
          return state.selectedSemester !== null
        case 'personal-info':
          return isPersonalInfoCompleted()
        case 'confirmation':
          return isPersonalInfoCompleted()
        default:
          return false
      }
    }

    // Allow navigation if:
    // 1. It's the current step
    // 2. It's a previous step (always allowed)
    // 3. It's a future step that has been completed
    if (targetStepIndex <= currentStepIndex || isStepCompleted(step)) {
      // Save current form data before navigating
      saveCurrentStepData()

      // Show data preserved notification if navigating to a different step
      if (targetStepIndex !== currentStepIndex) {
        state.setShowDataPreserved(true)
        setTimeout(() => state.setShowDataPreserved(false), 3000)
      }

      changeStep(step)
    } else {
      // Show a helpful message for incomplete future steps
      toast.info(
        `Please complete the current step before proceeding to ${step.replace(
          '-',
          ' '
        )}`
      )
    }
  }

  // Helper function to determine if a grade level is regular or irregular

  // Helper function to determine if a college year/semester combination is regular or irregular

  if (state.loading || state.checkingEnrollment || state.checkingDocuments) {
    return <LoadingSkeleton />
  }

  // Show document upload message if required documents are not complete
  if (state.documentsStatus && !state.documentsStatus.isComplete) {
    return <DocumentStatusMessage documentsStatus={state.documentsStatus} />
  }

  // Show enrollment summary if student already has an enrollment for current AY + current semester
  // Hide form if enrollment exists for current AY + current semester (any status)
  const enrollmentToShow = state.submittedEnrollment || state.existingEnrollment

  // Hide form if enrollment exists (regardless of status - pending, approved, or enrolled)
  // This shows the "already submitted" UI instead of the form
  const shouldHideForm = enrollmentToShow !== null

  // Debug logging
  if (enrollmentToShow) {
    console.log('CONSOLE :: Enrollment check for form visibility:', {
      hasEnrollment: !!enrollmentToShow,
      status: enrollmentToShow.enrollmentInfo?.status,
      sectionId: enrollmentToShow.enrollmentInfo?.sectionId,
      shouldHideForm,
      willShowForm: !shouldHideForm,
    })
  }

  if (enrollmentToShow && shouldHideForm) {
    return (
      <EnrollmentSummary
        enrollmentToShow={enrollmentToShow}
        subjects={state.subjects}
        loadingSubjects={state.loadingSubjects}
        subjectsCarouselIndex={state.subjectsCarouselIndex}
        onSetSubjectsCarouselIndex={state.setSubjectsCarouselIndex}
      />
    )
  }

  return (
    <div
      className={`${enrollmentSurfaceClass} space-y-6 p-4 sm:p-6 lg:p-8`}
      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
    >
      {/* Header */}
      <div className={sectionHeaderClass}>
        <div className="flex flex-col gap-3 text-blue-50">
          <div className="flex items-center gap-3">
            <div className={headerIconWrapperClass} aria-hidden="true">
              <GraduationCap size={26} className="text-blue-50" weight="fill" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className={`${sectionTitleClass} text-2xl`}>
                Student Enrollment
              </h1>
              <p className={sectionSubtextClass}>
                Choose your learning path and complete the guided checklist
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden lg:block">
        <ProgressIndicator
          currentStep={state.currentStep}
          selectedLevel={state.selectedLevel}
          complianceChecked={state.complianceChecked}
          selectedGrade={state.selectedGrade}
          selectedCourse={state.selectedCourse}
          selectedYear={state.selectedYear}
          selectedSemester={state.selectedSemester}
          isPersonalInfoCompleted={isPersonalInfoCompleted}
          onProgressStepClick={handleProgressStepClick}
        />
      </div>

      {/* Loading State */}
      {!userProfile && (
        <Card className="p-8 border border-blue-800/30 bg-white/5 backdrop-blur-md rounded-2xl shadow-inner shadow-blue-950/40">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-lg h-8 w-8 border-2 border-blue-800/30 border-t-blue-200 mx-auto"></div>
            <p className="text-blue-100">Loading your profile information...</p>
          </div>
        </Card>
      )}

      {/* Step Content */}
      {userProfile && state.currentStep === 'compliance' && (
        <div className={sectionShellClass}>
          <ComplianceStep
            animatingStep={state.animatingStep}
            complianceChecked={state.complianceChecked}
            onComplianceCheck={handleComplianceCheck}
            onProceed={handleProceedToLevelSelection}
          />
        </div>
      )}

      {userProfile && state.currentStep === 're-enroll' && (
        <div className={sectionShellClass}>
          <ReEnrollStep
            animatingStep={state.animatingStep}
            previousEnrollment={state.previousEnrollment}
            reEnrollSemester={state.reEnrollSemester}
            onBack={() => {
              state.setIsReEnrolling(false)
              state.setCurrentStep('compliance')
            }}
            onProceed={handleProceedToReEnrollConfirmation}
          />
        </div>
      )}

      {userProfile && state.currentStep === 'level-selection' && (
        <div className={sectionShellClass}>
          <LevelSelectionStep
            animatingStep={state.animatingStep}
            checkingPreviousEnrollment={state.checkingPreviousEnrollment}
            previousEnrollment={state.previousEnrollment}
            existingEnrollment={state.existingEnrollment}
            grades={state.grades}
            enrollmentStartPeriodHS={state.enrollmentStartPeriodHS}
            enrollmentEndPeriodHS={state.enrollmentEndPeriodHS}
            enrollmentStartPeriodCollege={state.enrollmentStartPeriodCollege}
            enrollmentEndPeriodCollege={state.enrollmentEndPeriodCollege}
            isEnrollmentAvailable={state.isEnrollmentAvailable}
            getEnrollmentPeriodMessage={state.getEnrollmentPeriodMessage}
            getEnrollmentDaysRemaining={state.getEnrollmentDaysRemaining}
            getEnrollmentProgress={state.getEnrollmentProgress}
            handleLevelSelect={handleLevelSelect}
            handleBackToCompliance={handleBackToCompliance}
            handleStartReEnroll={handleStartReEnroll}
          />
        </div>
      )}

      {userProfile && state.currentStep === 'grade-selection' && (
        <div className={sectionShellClass}>
          <GradeSelectionStep
            animatingStep={state.animatingStep}
            grades={state.grades}
            selectingGrade={state.selectingGrade}
            handleBackToLevelSelection={handleBackToLevelSelection}
            handleGradeSelect={handleGradeSelect}
          />
        </div>
      )}

      {userProfile &&
        state.currentStep === 'course-selection' &&
        state.selectedLevel === 'college' && (
          <div className={sectionShellClass}>
            <CourseSelectionStep
              animatingStep={state.animatingStep}
              loadingCourses={state.loadingCourses}
              courses={state.courses}
              previousEnrollment={state.previousEnrollment}
              selectedCourse={state.selectedCourse}
              handleBackToLevelSelection={handleBackToLevelSelection}
              handleCourseSelect={handleCourseSelect}
            />
          </div>
        )}

      {userProfile &&
        state.currentStep === 'year-selection' &&
        state.selectedLevel === 'college' &&
        state.selectedCourse && (
          <div className={sectionShellClass}>
            <YearSelectionStep
              animatingStep={state.animatingStep}
              previousEnrollment={state.previousEnrollment}
              selectedYear={state.selectedYear}
              onBack={() => changeStep('course-selection')}
              onSelectYear={handleYearSelect}
            />
          </div>
        )}

      {userProfile &&
        state.currentStep === 'semester-selection' &&
        ((state.selectedLevel === 'college' &&
          state.selectedCourse &&
          state.selectedYear) ||
          (state.selectedLevel === 'high-school' &&
            state.selectedGrade?.department === 'SHS')) && (
          <div className={sectionShellClass}>
            <SemesterSelectionStep
              animatingStep={state.animatingStep}
              currentSystemSemester={state.currentSystemSemester}
              selectedSemester={state.selectedSemester}
              onBack={() =>
                state.selectedLevel === 'college'
                  ? changeStep('year-selection')
                  : changeStep('grade-selection')
              }
              onSelectSemester={handleSemesterSelect}
            />
          </div>
        )}

      {userProfile &&
        state.currentStep === 'personal-info' &&
        (state.selectedGrade ||
          (state.selectedCourse &&
            state.selectedYear &&
            state.selectedSemester)) &&
        (!state.selectedGrade ||
          state.selectedGrade.department !== 'SHS' ||
          state.selectedSemester) && (
          <div className={sectionShellClass}>
            <PersonalInfoStep
              animatingStep={state.animatingStep}
              selectedLevel={state.selectedLevel}
              selectedGrade={state.selectedGrade}
              selectedCourse={state.selectedCourse}
              selectedYear={state.selectedYear}
              selectedSemester={state.selectedSemester}
              personalInfo={state.personalInfo}
              calculatedAge={state.calculatedAge}
              onBackGrade={handleBackToGradeSelection}
              onBackSemester={() => changeStep('semester-selection')}
              onProceedToConfirmation={handleProceedToConfirmation}
              onChange={handlePersonalInfoChange}
              onPhoneChange={handlePhoneNumberChange}
              onPhoneKeyDown={handlePhoneNumberKeyDown}
            />
          </div>
        )}
      {userProfile &&
        state.currentStep === 'confirmation' &&
        (state.selectedGrade || state.selectedCourse) && (
          <div className={sectionShellClass}>
            <ConfirmationStep
              animatingStep={state.animatingStep}
              selectedLevel={state.selectedLevel}
              selectedGrade={state.selectedGrade}
              selectedCourse={state.selectedCourse}
              selectedYear={state.selectedYear}
              selectedSemester={state.selectedSemester}
              personalInfo={state.personalInfo}
              documentsStatus={state.documentsStatus}
              onBack={handleBackToPersonalInfo}
              onOpenSubmit={handleOpenSubmitModal}
            />
          </div>
        )}

      <IrregularStudentModal
        isOpen={state.showIrregularModal}
        onClose={cancelIrregularStudent}
        selectedGrade={state.selectedGrade}
        onConfirm={confirmIrregularStudent}
      />

      <CourseChangeModal
        isOpen={state.showCourseChangeModal}
        onClose={cancelCourseChange}
        pendingCourse={state.pendingCourse}
        onConfirm={confirmCourseChange}
      />

      <SubmitConfirmationModal
        isOpen={state.submitModalOpen}
        onClose={handleCloseSubmitModal}
        countdown={state.countdown}
        onConfirm={handleFinalSubmit}
        enrolling={state.enrolling}
      />
    </div>
  )
}
