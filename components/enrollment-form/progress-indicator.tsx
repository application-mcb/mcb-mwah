'use client'

import { Check, User, GraduationCap, Calendar } from '@phosphor-icons/react'

type ProgressIndicatorProps = {
  currentStep: 'compliance' | 're-enroll' | 'level-selection' | 'grade-selection' | 'course-selection' | 'year-selection' | 'semester-selection' | 'personal-info' | 'confirmation'
  selectedLevel: 'high-school' | 'college' | null
  complianceChecked: boolean
  selectedGrade: any | null
  selectedCourse: any | null
  selectedYear: number | null
  selectedSemester: 'first-sem' | 'second-sem' | null
  isPersonalInfoCompleted: () => boolean
  onProgressStepClick: (step: 'compliance' | 're-enroll' | 'level-selection' | 'grade-selection' | 'course-selection' | 'year-selection' | 'semester-selection' | 'personal-info' | 'confirmation') => void
}

// Helper function to check if selected grade is SHS
const isSHSGrade = (grade: any | null): boolean => grade?.department === 'SHS'

const stepWrapperClass =
  'flex flex-col items-center cursor-pointer group transition-all duration-300 relative z-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200/70 rounded-xl p-2'

const getCircleClass = (isActive: boolean, isCompleted: boolean): string => {
  if (isActive) {
    return 'relative w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 text-blue-50 shadow-lg shadow-blue-900/40 border border-blue-300/20'
  }

  if (isCompleted) {
    return 'relative w-12 h-12 flex items-center justify-center rounded-xl bg-blue-900/60 text-blue-50 border border-blue-400/20 shadow-md shadow-blue-900/30'
  }

  return 'relative w-12 h-12 flex items-center justify-center rounded-xl border border-blue-800/30 bg-blue-950/30 text-blue-400 group-hover:border-blue-500/50'
}

const getLabelClass = (isActive: boolean, isCompleted: boolean): string => {
  if (isActive) {
    return 'text-xs font-medium text-blue-50'
  }

  if (isCompleted) {
    return 'text-xs font-medium text-blue-100'
  }

  return 'text-xs font-medium text-blue-400 group-hover:text-blue-200'
}

export default function ProgressIndicator({
  currentStep,
  selectedLevel,
  complianceChecked,
  selectedGrade,
  selectedCourse,
  selectedYear,
  selectedSemester,
  isPersonalInfoCompleted,
  onProgressStepClick,
}: ProgressIndicatorProps) {
  return (
    <div className="rounded-2xl border border-blue-800/40 bg-white/5 backdrop-blur-md p-6 shadow-inner shadow-blue-950/40 text-blue-50">
      <div className="relative">
        {/* Desktop Progress Steps Container */}
        <div className="hidden lg:flex justify-between items-start relative">
          {/* Progress Line Background - positioned behind circles */}
          <div className="absolute top-6 left-6 right-6 h-1 bg-blue-950/30 z-0 rounded-full"></div>

          {/* Animated Progress Line - positioned behind circles */}
          <div
            className="absolute top-6 left-6 h-1 bg-gradient-to-r from-blue-500 via-blue-700 to-blue-400 transition-all duration-700 ease-out z-10 rounded-full shadow-lg shadow-blue-900/40"
            style={{
              width: (() => {
                const isSHS = isSHSGrade(selectedGrade)
                let steps: string[]
                
                if (selectedLevel === 'college') {
                  steps = [
                    'compliance',
                    'level-selection',
                    'course-selection',
                    'year-selection',
                    'semester-selection',
                    'personal-info',
                    'confirmation',
                  ]
                } else if (isSHS) {
                  // SHS has semester selection like college
                  steps = [
                    'compliance',
                    'level-selection',
                    'grade-selection',
                    'semester-selection',
                    'personal-info',
                    'confirmation',
                  ]
                } else {
                  // JHS - no semester
                  steps = [
                    'compliance',
                    'level-selection',
                    'grade-selection',
                    'personal-info',
                    'confirmation',
                  ]
                }

                let stepIndex = steps.indexOf(currentStep)

                // Handle course-selection as grade-selection for high school
                if (
                  stepIndex === -1 &&
                  currentStep === 'course-selection' &&
                  selectedLevel === 'high-school'
                ) {
                  stepIndex = steps.indexOf('grade-selection')
                }
                
                // Handle semester-selection for SHS
                if (
                  stepIndex === -1 &&
                  currentStep === 'semester-selection' &&
                  isSHS
                ) {
                  stepIndex = steps.indexOf('semester-selection')
                }

                // Calculate based on step position with proper spacing
                if (stepIndex >= 0) {
                  // Define progress positions as variables for easy editing
                  const collegePositions = [0, 12.5, 25, 37.5, 50, 62.5, 75, 93] // 8 steps (includes semester)
                  const shsPositions = [0, 15, 30, 45, 60, 75, 93] // 7 steps (includes semester)
                  const jhsPositions = [0, 22.5, 45, 69, 93] // 5 steps (no semester)

                  const positions =
                    selectedLevel === 'college'
                      ? collegePositions
                      : isSHS
                      ? shsPositions
                      : jhsPositions
                  return `${positions[stepIndex]}%`
                }

                return '0%'
              })(),
            }}
          ></div>
          {/* Step 1: Compliance */}
          <div
            key="compliance-step"
            className={`${stepWrapperClass} ${
              currentStep === 'compliance' ? 'scale-105' : 'hover:scale-105'
            }`}
            role="button"
            tabIndex={0}
            aria-label="Go to compliance step"
            onClick={() => onProgressStepClick('compliance')}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onProgressStepClick('compliance')
              }
            }}
          >
            <div
              className={getCircleClass(
                currentStep === 'compliance',
                complianceChecked
              )}
            >
              <Check
                size={18}
                weight="bold"
                className="transition-all duration-300"
              />
              {/* Pulse animation for current step */}
              {currentStep === 'compliance' && (
                <div className="absolute inset-0 rounded-xl bg-blue-500/40 animate-ping opacity-60"></div>
              )}
            </div>
            <span
              className={`${getLabelClass(
                currentStep === 'compliance',
                complianceChecked
              )} text-center mt-2`}
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Compliance
            </span>
          </div>

          {/* Step 2: Level Selection */}
          <div
            key="level-selection-step"
            className={`${stepWrapperClass} ${
              currentStep === 'level-selection' ? 'scale-105' : 'hover:scale-105'
            }`}
            role="button"
            tabIndex={0}
            aria-label="Go to level selection step"
            onClick={() => onProgressStepClick('level-selection')}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onProgressStepClick('level-selection')
              }
            }}
          >
            <div
              className={getCircleClass(
                currentStep === 'level-selection',
                selectedLevel !== null
              )}
            >
              <User
                size={18}
                weight="bold"
                className="transition-all duration-300"
              />
              {/* Pulse animation for current step */}
              {currentStep === 'level-selection' && (
                <div className="absolute inset-0 rounded-xl bg-blue-500/40 animate-ping opacity-60"></div>
              )}
            </div>
            <span
              className={`${getLabelClass(
                currentStep === 'level-selection',
                selectedLevel !== null
              )} text-center mt-2`}
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Level Selection
            </span>
          </div>

          {/* Step 3: Grade/Course Selection */}
          <div
            key="selection-step"
            className={`${stepWrapperClass} ${
              currentStep === 'grade-selection' ||
              currentStep === 'course-selection'
                ? 'scale-105'
                : 'hover:scale-105'
            }`}
            role="button"
            tabIndex={0}
            aria-label={
              selectedLevel === 'high-school'
                ? 'Go to grade selection step'
                : 'Go to course selection step'
            }
            onClick={() =>
              onProgressStepClick(
                selectedLevel === 'high-school'
                  ? 'grade-selection'
                  : 'course-selection'
              )
            }
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onProgressStepClick(
                  selectedLevel === 'high-school'
                    ? 'grade-selection'
                    : 'course-selection'
                )
              }
            }}
          >
            <div
              className={getCircleClass(
                currentStep === 'grade-selection' ||
                  currentStep === 'course-selection',
                selectedGrade !== null || selectedCourse !== null
              )}
            >
              <GraduationCap
                size={18}
                weight="bold"
                className="transition-all duration-300"
              />
              {/* Pulse animation for current step */}
              {(currentStep === 'grade-selection' ||
                currentStep === 'course-selection') && (
                <div className="absolute inset-0 rounded-xl bg-blue-500/40 animate-ping opacity-60"></div>
              )}
            </div>
            <span
              className={`${getLabelClass(
                currentStep === 'grade-selection' ||
                  currentStep === 'course-selection',
                selectedGrade !== null || selectedCourse !== null
              )} text-center mt-2`}
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              {selectedLevel === 'high-school'
                ? 'Grade Selection'
                : selectedLevel === 'college'
                ? 'Course Selection'
                : 'Selection'}
            </span>
          </div>

          {/* Step 4: Year Selection (College only) */}
          {selectedLevel === 'college' && (
            <div
              key="year-selection-step"
              className={`${stepWrapperClass} ${
                currentStep === 'year-selection'
                  ? 'scale-105'
                  : 'hover:scale-105'
              }`}
              role="button"
              tabIndex={0}
              aria-label="Go to year selection step"
              onClick={() => onProgressStepClick('year-selection')}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onProgressStepClick('year-selection')
                }
              }}
            >
              <div
                className={getCircleClass(
                  currentStep === 'year-selection',
                  selectedYear !== null
                )}
              >
                <User
                  size={18}
                  weight="bold"
                  className="transition-all duration-300"
                />
                {currentStep === 'year-selection' && (
                  <div className="absolute inset-0 rounded-xl bg-blue-500/40 animate-ping opacity-60"></div>
                )}
              </div>
              <span
                className={`${getLabelClass(
                  currentStep === 'year-selection',
                  selectedYear !== null
                )} text-center mt-2`}
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Year Level
              </span>
            </div>
          )}

          {/* Step 5: Semester Selection (College and SHS) */}
          {(selectedLevel === 'college' || isSHSGrade(selectedGrade)) && (
            <div
              key="semester-selection-step"
              className={`${stepWrapperClass} ${
                currentStep === 'semester-selection'
                  ? 'scale-105'
                  : 'hover:scale-105'
              }`}
              role="button"
              tabIndex={0}
              aria-label="Go to semester selection step"
              onClick={() => onProgressStepClick('semester-selection')}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onProgressStepClick('semester-selection')
                }
              }}
            >
              <div
                className={getCircleClass(
                  currentStep === 'semester-selection',
                  selectedSemester !== null
                )}
              >
                <Calendar
                  size={18}
                  weight="bold"
                  className="transition-all duration-300"
                />
                {currentStep === 'semester-selection' && (
                  <div className="absolute inset-0 rounded-xl bg-blue-500/40 animate-ping opacity-60"></div>
                )}
              </div>
              <span
                className={`${getLabelClass(
                  currentStep === 'semester-selection',
                  selectedSemester !== null
                )} text-center mt-2`}
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Semester
              </span>
            </div>
          )}

          {/* Step 6/5: Personal Info */}
          <div
            key="personal-info-step"
            className={`${stepWrapperClass} ${
              currentStep === 'personal-info' ? 'scale-105' : 'hover:scale-105'
            }`}
            role="button"
            tabIndex={0}
            aria-label="Go to personal information step"
            onClick={() => onProgressStepClick('personal-info')}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onProgressStepClick('personal-info')
              }
            }}
          >
            <div
              className={getCircleClass(
                currentStep === 'personal-info',
                isPersonalInfoCompleted()
              )}
            >
              <User
                size={18}
                weight="bold"
                className="transition-all duration-300"
              />
              {currentStep === 'personal-info' && (
                <div className="absolute inset-0 rounded-xl bg-blue-500/40 animate-ping opacity-60"></div>
              )}
            </div>
            <span
              className={`${getLabelClass(
                currentStep === 'personal-info',
                isPersonalInfoCompleted()
              )} text-center mt-2`}
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Personal Info
            </span>
          </div>

          {/* Step 7/6: Confirmation */}
          <div
            key="confirmation-step"
            className={`${stepWrapperClass} ${
              currentStep === 'confirmation' ? 'scale-105' : 'hover:scale-105'
            }`}
            role="button"
            tabIndex={0}
            aria-label="Go to confirmation step"
            onClick={() => onProgressStepClick('confirmation')}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onProgressStepClick('confirmation')
              }
            }}
          >
            <div
              className={getCircleClass(
                currentStep === 'confirmation',
                isPersonalInfoCompleted()
              )}
            >
              <Check
                size={18}
                weight="bold"
                className="transition-all duration-300"
              />
              {currentStep === 'confirmation' && (
                <div className="absolute inset-0 rounded-xl bg-blue-500/40 animate-ping opacity-60"></div>
              )}
            </div>
            <span
              className={`${getLabelClass(
                currentStep === 'confirmation',
                isPersonalInfoCompleted()
              )} text-center mt-2`}
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Confirmation
            </span>
          </div>
        </div>

        {/* Mobile Progress Steps Container */}
        <div className="lg:hidden space-y-4">
          {/* Progress Line Background - vertical for mobile */}
          <div className="absolute left-6 top-12 bottom-12 w-1 bg-gray-200 z-0"></div>

          {/* Animated Progress Line - vertical for mobile */}
          <div
            className="absolute left-6 top-12 w-1 bg-gradient-to-b from-blue-600 to-blue-900 transition-all duration-1000 ease-out z-10"
            style={{
              height: (() => {
                const isSHS = isSHSGrade(selectedGrade)
                let steps: string[]

                if (selectedLevel === 'college') {
                  steps = [
                    'compliance',
                    'level-selection',
                    'course-selection',
                    'year-selection',
                    'semester-selection',
                    'personal-info',
                    'confirmation',
                  ]
                } else if (isSHS) {
                  // SHS has semester selection like college
                  steps = [
                    'compliance',
                    'level-selection',
                    'grade-selection',
                    'semester-selection',
                    'personal-info',
                    'confirmation',
                  ]
                } else {
                  // JHS - no semester
                  steps = [
                    'compliance',
                    'level-selection',
                    'grade-selection',
                    'personal-info',
                    'confirmation',
                  ]
                }

                let stepIndex = steps.indexOf(currentStep)

                // Handle course-selection as grade-selection for high school
                if (
                  stepIndex === -1 &&
                  currentStep === 'course-selection' &&
                  selectedLevel === 'high-school'
                ) {
                  stepIndex = steps.indexOf('grade-selection')
                }

                // Handle semester-selection for SHS
                if (
                  stepIndex === -1 &&
                  currentStep === 'semester-selection' &&
                  isSHS
                ) {
                  stepIndex = steps.indexOf('semester-selection')
                }

                // Calculate based on step position with proper spacing
                if (stepIndex >= 0) {
                  // Define progress positions as percentages for mobile vertical layout
                  const collegePositions = [0, 14.3, 28.6, 42.9, 57.2, 71.5, 85.8, 100]
                  const shsPositions = [0, 16.7, 33.4, 50.1, 66.8, 83.5, 100]
                  const jhsPositions = [0, 20, 40, 60, 80, 100]

                  const positions =
                    selectedLevel === 'college'
                      ? collegePositions
                      : isSHS
                      ? shsPositions
                      : jhsPositions
                  return `${positions[stepIndex]}%`
                }

                return '0%'
              })(),
            }}
          ></div>

          {/* Mobile Step 1: Compliance */}
          <div
            className={`flex items-center cursor-pointer group transition-all duration-300 relative z-20 ${
              currentStep === 'compliance' ? 'scale-105' : 'hover:scale-102'
            }`}
            onClick={() => onProgressStepClick('compliance')}
          >
            <div
              className={`relative w-12 h-12 flex items-center justify-center text-sm font-medium transition-all duration-500 rounded-full flex-shrink-0 mr-4 ${
                currentStep === 'compliance'
                  ? 'bg-blue-900 text-white shadow-lg shadow-blue-900/30'
                  : complianceChecked
                  ? 'bg-blue-900 text-white shadow-md'
                  : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
              }`}
            >
              <Check
                size={16}
                weight="bold"
                className="transition-all duration-300"
              />
              {/* Pulse animation for current step */}
              {currentStep === 'compliance' && (
                <div className="absolute inset-0 rounded-full bg-blue-900 animate-ping opacity-20"></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span
                className={`text-sm font-medium transition-all duration-300 block ${
                  currentStep === 'compliance'
                    ? 'text-blue-900 font-semibold'
                    : complianceChecked
                    ? 'text-blue-900'
                    : 'text-gray-400 group-hover:text-gray-600'
                }`}
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Compliance
              </span>
              <span className="text-xs text-gray-500">Acknowledge policies</span>
            </div>
          </div>

          {/* Mobile Step 2: Level Selection */}
          <div
            className={`flex items-center cursor-pointer group transition-all duration-300 relative z-20 ${
              currentStep === 'level-selection'
                ? 'scale-105'
                : 'hover:scale-102'
            }`}
            onClick={() => onProgressStepClick('level-selection')}
          >
            <div
              className={`relative w-12 h-12 flex items-center justify-center text-sm font-medium transition-all duration-500 rounded-full flex-shrink-0 mr-4 ${
                currentStep === 'level-selection'
                  ? 'bg-blue-900 text-white shadow-lg shadow-blue-900/30'
                  : selectedLevel !== null
                  ? 'bg-blue-900 text-white shadow-md'
                  : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
              }`}
            >
              <User
                size={16}
                weight="bold"
                className="transition-all duration-300"
              />
              {/* Pulse animation for current step */}
              {currentStep === 'level-selection' && (
                <div className="absolute inset-0 rounded-full bg-blue-900 animate-ping opacity-20"></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span
                className={`text-sm font-medium transition-all duration-300 block ${
                  currentStep === 'level-selection'
                    ? 'text-blue-900 font-semibold'
                    : selectedLevel !== null
                    ? 'text-blue-900'
                    : 'text-gray-400 group-hover:text-gray-600'
                }`}
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Level Selection
              </span>
              <span className="text-xs text-gray-500">Choose your level</span>
            </div>
          </div>

          {/* Mobile Step 3: Grade/Course Selection */}
          <div
            className={`flex items-center cursor-pointer group transition-all duration-300 relative z-20 ${
              currentStep === 'grade-selection' ||
              currentStep === 'course-selection'
                ? 'scale-105'
                : 'hover:scale-102'
            }`}
            onClick={() =>
              onProgressStepClick(
                selectedLevel === 'high-school'
                  ? 'grade-selection'
                  : 'course-selection'
              )
            }
          >
            <div
              className={`relative w-12 h-12 flex items-center justify-center text-sm font-medium transition-all duration-500 rounded-full flex-shrink-0 mr-4 ${
                currentStep === 'grade-selection' ||
                currentStep === 'course-selection'
                  ? 'bg-blue-900 text-white shadow-lg shadow-blue-900/30'
                  : selectedGrade !== null || selectedCourse !== null
                  ? 'bg-blue-900 text-white shadow-md'
                  : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
              }`}
            >
              <GraduationCap
                size={16}
                weight="bold"
                className="transition-all duration-300"
              />
              {/* Pulse animation for current step */}
              {(currentStep === 'grade-selection' ||
                currentStep === 'course-selection') && (
                <div className="absolute inset-0 rounded-full bg-blue-900 animate-ping opacity-20"></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span
                className={`text-sm font-medium transition-all duration-300 block ${
                  currentStep === 'grade-selection' ||
                  currentStep === 'course-selection'
                    ? 'text-blue-900 font-semibold'
                    : selectedGrade !== null || selectedCourse !== null
                    ? 'text-blue-900'
                    : 'text-gray-400 group-hover:text-gray-600'
                }`}
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                {selectedLevel === 'high-school'
                  ? 'Grade Selection'
                  : selectedLevel === 'college'
                  ? 'Course Selection'
                  : 'Selection'}
              </span>
              <span className="text-xs text-gray-500">
                {selectedLevel === 'high-school'
                  ? 'Choose your grade'
                  : selectedLevel === 'college'
                  ? 'Choose your course'
                  : 'Select option'}
              </span>
            </div>
          </div>

          {/* Mobile Step 4: Year Selection (College only) */}
          {selectedLevel === 'college' && (
            <div
              className={`flex items-center cursor-pointer group transition-all duration-300 relative z-20 ${
                currentStep === 'year-selection'
                  ? 'scale-105'
                  : 'hover:scale-102'
              }`}
              onClick={() => onProgressStepClick('year-selection')}
            >
              <div
                className={`relative w-12 h-12 flex items-center justify-center text-sm font-medium transition-all duration-500 rounded-full flex-shrink-0 mr-4 ${
                  currentStep === 'year-selection'
                    ? 'bg-blue-900 text-white shadow-lg shadow-blue-900/30'
                    : selectedYear !== null
                    ? 'bg-blue-900 text-white shadow-md'
                    : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                }`}
              >
                <User
                  size={16}
                  weight="bold"
                  className="transition-all duration-300"
                />
                {/* Pulse animation for current step */}
                {currentStep === 'year-selection' && (
                  <div className="absolute inset-0 rounded-full bg-blue-900 animate-ping opacity-20"></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span
                  className={`text-sm font-medium transition-all duration-300 block ${
                    currentStep === 'year-selection'
                      ? 'text-blue-900 font-semibold'
                      : selectedYear !== null
                      ? 'text-blue-900'
                      : 'text-gray-400 group-hover:text-gray-600'
                  }`}
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Year Level
                </span>
                <span className="text-xs text-gray-500">Choose your year</span>
              </div>
            </div>
          )}

          {/* Mobile Step 5: Semester Selection (College and SHS) */}
          {(selectedLevel === 'college' || isSHSGrade(selectedGrade)) && (
            <div
              className={`flex items-center cursor-pointer group transition-all duration-300 relative z-20 ${
                currentStep === 'semester-selection'
                  ? 'scale-105'
                  : 'hover:scale-102'
              }`}
              onClick={() => onProgressStepClick('semester-selection')}
            >
              <div
                className={`relative w-12 h-12 flex items-center justify-center text-sm font-medium transition-all duration-500 rounded-full flex-shrink-0 mr-4 ${
                  currentStep === 'semester-selection'
                    ? 'bg-blue-900 text-white shadow-lg shadow-blue-900/30'
                    : selectedSemester !== null
                    ? 'bg-blue-900 text-white shadow-md'
                    : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                }`}
              >
                <Calendar
                  size={16}
                  weight="bold"
                  className="transition-all duration-300"
                />
                {/* Pulse animation for current step */}
                {currentStep === 'semester-selection' && (
                  <div className="absolute inset-0 rounded-full bg-blue-900 animate-ping opacity-20"></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span
                  className={`text-sm font-medium transition-all duration-300 block ${
                    currentStep === 'semester-selection'
                      ? 'text-blue-900 font-semibold'
                      : selectedSemester !== null
                      ? 'text-blue-900'
                      : 'text-gray-400 group-hover:text-gray-600'
                  }`}
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Semester
                </span>
                <span className="text-xs text-gray-500">Choose semester</span>
              </div>
            </div>
          )}

          {/* Mobile Step 6/5: Personal Info */}
          <div
            className={`flex items-center cursor-pointer group transition-all duration-300 relative z-20 ${
              currentStep === 'personal-info'
                ? 'scale-105'
                : 'hover:scale-102'
            }`}
            onClick={() => onProgressStepClick('personal-info')}
          >
            <div
              className={`relative w-12 h-12 flex items-center justify-center text-sm font-medium transition-all duration-500 rounded-full flex-shrink-0 mr-4 ${
                currentStep === 'personal-info'
                  ? 'bg-blue-900 text-white shadow-lg shadow-blue-900/30'
                  : isPersonalInfoCompleted()
                  ? 'bg-blue-900 text-white shadow-md'
                  : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
              }`}
            >
              <User
                size={16}
                weight="bold"
                className="transition-all duration-300"
              />
              {/* Pulse animation for current step */}
              {currentStep === 'personal-info' && (
                <div className="absolute inset-0 rounded-full bg-blue-900 animate-ping opacity-20"></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span
                className={`text-sm font-medium transition-all duration-300 block ${
                  currentStep === 'personal-info'
                    ? 'text-blue-900 font-semibold'
                    : isPersonalInfoCompleted()
                    ? 'text-blue-900'
                    : 'text-gray-400 group-hover:text-gray-600'
                }`}
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Personal Info
              </span>
              <span className="text-xs text-gray-500">Enter details</span>
            </div>
          </div>

          {/* Mobile Step 7/6: Confirmation */}
          <div
            className={`flex items-center cursor-pointer group transition-all duration-300 relative z-20 ${
              currentStep === 'confirmation' ? 'scale-105' : 'hover:scale-102'
            }`}
            onClick={() => onProgressStepClick('confirmation')}
          >
            <div
              className={`relative w-12 h-12 flex items-center justify-center text-sm font-medium transition-all duration-500 rounded-full flex-shrink-0 mr-4 ${
                currentStep === 'confirmation'
                  ? 'bg-blue-900 text-white shadow-lg shadow-blue-900/30'
                  : isPersonalInfoCompleted()
                  ? 'bg-blue-900 text-white shadow-md'
                  : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
              }`}
            >
              <Check
                size={16}
                weight="bold"
                className="transition-all duration-300"
              />
              {/* Pulse animation for current step */}
              {currentStep === 'confirmation' && (
                <div className="absolute inset-0 rounded-full bg-blue-900 animate-ping opacity-20"></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span
                className={`text-sm font-medium transition-all duration-300 block ${
                  currentStep === 'confirmation'
                    ? 'text-blue-900 font-semibold'
                    : isPersonalInfoCompleted()
                    ? 'text-blue-900'
                    : 'text-gray-400 group-hover:text-gray-600'
                }`}
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Confirmation
              </span>
              <span className="text-xs text-gray-500">Review & submit</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
