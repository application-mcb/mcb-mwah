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
import {
  GraduationCap,
  BookOpen,
  Check,
  Warning,
  Calendar,
  IdentificationCard,
  Heart,
  User,
  Envelope,
  Phone,
  MapPin,
  Users,
  UserCircle,
  File,
  FileText,
  X,
  ArrowRight,
  ArrowLeft,
  Medal,
  Certificate,
  Clock,
  CalendarBlank,
  UserCheck,
  ShieldCheck,
  Info,
  WarningCircle,
  Calculator,
  Atom,
  Globe,
  Monitor,
  Palette,
  MusicNote,
  Book,
  Books,
} from '@phosphor-icons/react'
import { GradeData } from '@/lib/grade-section-database'

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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-blue-100 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center aspect-square shadow-md">
              <GraduationCap size={24} className="text-white" weight="fill" />
            </div>
            <div>
              <h1
                className="text-2xl font-medium bg-gradient-to-r from-blue-900 to-blue-800 bg-clip-text text-transparent"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Student Enrollment
              </h1>
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                Select your grade level and complete your enrollment process
              </p>
            </div>
          </div>
        </div>
      </div>

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

      {/* Loading State */}
      {!userProfile && (
        <Card className="p-8 border-none bg-white/80 backdrop-blur-sm rounded-xl border border-blue-100 shadow-lg">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-xl h-8 w-8 border-2 border-blue-900/30 border-t-blue-900 mx-auto"></div>
            <p className="text-gray-600" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>Loading your profile information...</p>
          </div>
        </Card>
      )}

      {/* Step Content */}
      {userProfile && state.currentStep === 'compliance' && (
        <ComplianceStep
          animatingStep={state.animatingStep}
          complianceChecked={state.complianceChecked}
          onComplianceCheck={handleComplianceCheck}
          onProceed={handleProceedToLevelSelection}
        />
      )}

      {userProfile && state.currentStep === 're-enroll' && (
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
      )}

      {userProfile && state.currentStep === 'level-selection' && (
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
      )}

      {userProfile && state.currentStep === 'grade-selection' && (
        <GradeSelectionStep
          animatingStep={state.animatingStep}
          grades={state.grades}
          selectingGrade={state.selectingGrade}
          handleBackToLevelSelection={handleBackToLevelSelection}
          handleGradeSelect={handleGradeSelect}
        />
      )}

      {userProfile &&
        state.currentStep === 'course-selection' &&
        state.selectedLevel === 'college' && (
          <CourseSelectionStep
            animatingStep={state.animatingStep}
            loadingCourses={state.loadingCourses}
            courses={state.courses}
            previousEnrollment={state.previousEnrollment}
            selectedCourse={state.selectedCourse}
            handleBackToLevelSelection={handleBackToLevelSelection}
            handleCourseSelect={handleCourseSelect}
          />
        )}

      {userProfile &&
        state.currentStep === 'year-selection' &&
        state.selectedLevel === 'college' &&
        state.selectedCourse && (
          <YearSelectionStep
            animatingStep={state.animatingStep}
            previousEnrollment={state.previousEnrollment}
            selectedYear={state.selectedYear}
            onBack={() => changeStep('course-selection')}
            onSelectYear={handleYearSelect}
          />
        )}

      {userProfile &&
        state.currentStep === 'semester-selection' &&
        ((state.selectedLevel === 'college' &&
          state.selectedCourse &&
          state.selectedYear) ||
          (state.selectedLevel === 'high-school' &&
            state.selectedGrade?.department === 'SHS')) && (
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
        )}

      {userProfile &&
        state.currentStep === 'personal-info' &&
        (state.selectedGrade ||
          (state.selectedCourse &&
            state.selectedYear &&
            state.selectedSemester)) &&
        // For SHS, require semester; for JHS, no semester needed
        (!state.selectedGrade ||
          state.selectedGrade.department !== 'SHS' ||
          state.selectedSemester) && (
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
        )}
      {userProfile &&
        state.currentStep === 'confirmation' &&
        (state.selectedGrade || state.selectedCourse) && (
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
