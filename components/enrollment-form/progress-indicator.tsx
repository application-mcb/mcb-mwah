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
const isSHSGrade = (grade: any | null): boolean => {
  return grade?.department === 'SHS'
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
    <div className="bg-white p-6 border border-gray-200 shadow-lg">
      <div className="relative">
        {/* Progress Steps Container */}
        <div className="flex justify-between items-start relative">
          {/* Progress Line Background - positioned behind circles */}
          <div className="absolute top-6 left-6 right-6 h-1 bg-gray-200 z-0"></div>

          {/* Animated Progress Line - positioned behind circles */}
          <div
            className="absolute top-6 left-6 h-1 bg-gradient-to-r from-blue-600 to-blue-900 transition-all duration-1000 ease-out z-10"
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
            className={`flex flex-col items-center cursor-pointer group transition-all duration-300 relative z-20 ${
              currentStep === 'compliance' ? 'scale-110' : 'hover:scale-105'
            }`}
            onClick={() => onProgressStepClick('compliance')}
          >
            <div
              className={`relative w-12 h-12 flex items-center justify-center text-sm font-medium transition-all duration-500 rounded-none ${
                currentStep === 'compliance'
                  ? 'bg-blue-900 text-white shadow-lg shadow-blue-900/30'
                  : complianceChecked
                  ? 'bg-blue-900 text-white shadow-md'
                  : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
              }`}
            >
              <Check
                size={18}
                weight="bold"
                className="transition-all duration-300"
              />
              {/* Pulse animation for current step */}
              {currentStep === 'compliance' && (
                <div className="absolute inset-0 rounded-none bg-blue-900 animate-ping opacity-20"></div>
              )}
            </div>
            <span
              className={`text-xs font-medium mt-2 text-center transition-all duration-300 ${
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
          </div>

          {/* Step 2: Level Selection */}
          <div
            key="level-selection-step"
            className={`flex flex-col items-center cursor-pointer group transition-all duration-300 relative z-20 ${
              currentStep === 'level-selection'
                ? 'scale-110'
                : 'hover:scale-105'
            }`}
            onClick={() => onProgressStepClick('level-selection')}
          >
            <div
              className={`relative w-12 h-12 flex items-center justify-center text-sm font-medium transition-all duration-500 rounded-none ${
                currentStep === 'level-selection'
                  ? 'bg-blue-900 text-white shadow-lg shadow-blue-900/30'
                  : selectedLevel !== null
                  ? 'bg-blue-900 text-white shadow-md'
                  : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
              }`}
            >
              <User
                size={18}
                weight="bold"
                className="transition-all duration-300"
              />
              {/* Pulse animation for current step */}
              {currentStep === 'level-selection' && (
                <div className="absolute inset-0 rounded-none bg-blue-900 animate-ping opacity-20"></div>
              )}
            </div>
            <span
              className={`text-xs font-medium mt-2 text-center transition-all duration-300 ${
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
          </div>

          {/* Step 3: Grade/Course Selection */}
          <div
            key="selection-step"
            className={`flex flex-col items-center cursor-pointer group transition-all duration-300 relative z-20 ${
              currentStep === 'grade-selection' ||
              currentStep === 'course-selection'
                ? 'scale-110'
                : 'hover:scale-105'
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
              className={`relative w-12 h-12 flex items-center justify-center text-sm font-medium transition-all duration-500 rounded-none ${
                currentStep === 'grade-selection' ||
                currentStep === 'course-selection'
                  ? 'bg-blue-900 text-white shadow-lg shadow-blue-900/30'
                  : selectedGrade !== null || selectedCourse !== null
                  ? 'bg-blue-900 text-white shadow-md'
                  : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
              }`}
            >
              <GraduationCap
                size={18}
                weight="bold"
                className="transition-all duration-300"
              />
              {/* Pulse animation for current step */}
              {(currentStep === 'grade-selection' ||
                currentStep === 'course-selection') && (
                <div className="absolute inset-0 rounded-none bg-blue-900 animate-ping opacity-20"></div>
              )}
            </div>
            <span
              className={`text-xs font-medium mt-2 text-center transition-all duration-300 ${
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
          </div>

          {/* Step 4: Year Selection (College only) */}
          {selectedLevel === 'college' && (
            <div
              key="year-selection-step"
              className={`flex flex-col items-center cursor-pointer group transition-all duration-300 relative z-20 ${
                currentStep === 'year-selection'
                  ? 'scale-110'
                  : 'hover:scale-105'
              }`}
              onClick={() => onProgressStepClick('year-selection')}
            >
              <div
                className={`relative w-12 h-12 flex items-center justify-center text-sm font-medium transition-all duration-500 rounded-none ${
                  currentStep === 'year-selection'
                    ? 'bg-blue-900 text-white shadow-lg shadow-blue-900/30'
                    : selectedYear !== null
                    ? 'bg-blue-900 text-white shadow-md'
                    : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                }`}
              >
                <User
                  size={18}
                  weight="bold"
                  className="transition-all duration-300"
                />
                {/* Pulse animation for current step */}
                {currentStep === 'year-selection' && (
                  <div className="absolute inset-0 rounded-none bg-blue-900 animate-ping opacity-20"></div>
                )}
              </div>
              <span
                className={`text-xs font-medium mt-2 text-center transition-all duration-300 ${
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
            </div>
          )}

          {/* Step 5: Semester Selection (College and SHS) */}
          {(selectedLevel === 'college' || isSHSGrade(selectedGrade)) && (
            <div
              key="semester-selection-step"
              className={`flex flex-col items-center cursor-pointer group transition-all duration-300 relative z-20 ${
                currentStep === 'semester-selection'
                  ? 'scale-110'
                  : 'hover:scale-105'
              }`}
              onClick={() => onProgressStepClick('semester-selection')}
            >
              <div
                className={`relative w-12 h-12 flex items-center justify-center text-sm font-medium transition-all duration-500 rounded-none ${
                  currentStep === 'semester-selection'
                    ? 'bg-blue-900 text-white shadow-lg shadow-blue-900/30'
                    : selectedSemester !== null
                    ? 'bg-blue-900 text-white shadow-md'
                    : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                }`}
              >
                <Calendar
                  size={18}
                  weight="bold"
                  className="transition-all duration-300"
                />
                {/* Pulse animation for current step */}
                {currentStep === 'semester-selection' && (
                  <div className="absolute inset-0 rounded-none bg-blue-900 animate-ping opacity-20"></div>
                )}
              </div>
              <span
                className={`text-xs font-medium mt-2 text-center transition-all duration-300 ${
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
            </div>
          )}

          {/* Step 6/5: Personal Info */}
          <div
            key="personal-info-step"
            className={`flex flex-col items-center cursor-pointer group transition-all duration-300 relative z-20 ${
              currentStep === 'personal-info'
                ? 'scale-110'
                : 'hover:scale-105'
            }`}
            onClick={() => onProgressStepClick('personal-info')}
          >
            <div
              className={`relative w-12 h-12 flex items-center justify-center text-sm font-medium transition-all duration-500 rounded-none ${
                currentStep === 'personal-info'
                  ? 'bg-blue-900 text-white shadow-lg shadow-blue-900/30'
                  : isPersonalInfoCompleted()
                  ? 'bg-blue-900 text-white shadow-md'
                  : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
              }`}
            >
              <User
                size={18}
                weight="bold"
                className="transition-all duration-300"
              />
              {/* Pulse animation for current step */}
              {currentStep === 'personal-info' && (
                <div className="absolute inset-0 rounded-none bg-blue-900 animate-ping opacity-20"></div>
              )}
            </div>
            <span
              className={`text-xs font-medium mt-2 text-center transition-all duration-300 ${
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
          </div>

          {/* Step 7/6: Confirmation */}
          <div
            key="confirmation-step"
            className={`flex flex-col items-center cursor-pointer group transition-all duration-300 relative z-20 ${
              currentStep === 'confirmation' ? 'scale-110' : 'hover:scale-105'
            }`}
            onClick={() => onProgressStepClick('confirmation')}
          >
            <div
              className={`relative w-12 h-12 flex items-center justify-center text-sm font-medium transition-all duration-500 rounded-none ${
                currentStep === 'confirmation'
                  ? 'bg-blue-900 text-white shadow-lg shadow-blue-900/30'
                  : isPersonalInfoCompleted()
                  ? 'bg-blue-900 text-white shadow-md'
                  : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
              }`}
            >
              <Check
                size={18}
                weight="bold"
                className="transition-all duration-300"
              />
              {/* Pulse animation for current step */}
              {currentStep === 'confirmation' && (
                <div className="absolute inset-0 rounded-none bg-blue-900 animate-ping opacity-20"></div>
              )}
            </div>
            <span
              className={`text-xs font-medium mt-2 text-center transition-all duration-300 ${
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
          </div>
        </div>
      </div>
    </div>
  )
}
