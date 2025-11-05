'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  User,
  GraduationCap,
  BookOpen,
  CalendarBlank,
  WarningCircle,
  CheckCircle
} from '@phosphor-icons/react'
import { toast } from 'react-toastify'

interface Stage1Props {
  // State
  complianceChecked: boolean
  currentStep: string
  animatingStep: boolean
  userProfile: any
  selectedLevel: 'high-school' | 'college' | null
  existingEnrollment: any
  previousEnrollment: any

  // State setters
  setComplianceChecked: (checked: boolean) => void
  setSelectedLevel: (level: 'high-school' | 'college' | null) => void
  setSelectedGrade: (grade: any) => void
  setSelectedCourse: (course: any) => void
  setSelectedYear: (year: any) => void
  setSelectedSemester: (semester: any) => void

  // Functions
  changeStep: (step: string) => void
  isEnrollmentAvailable: (level: 'high-school' | 'college') => boolean
  getEnrollmentPeriodMessage: (level: 'high-school' | 'college') => string
}

const Stage1 = ({
  complianceChecked,
  currentStep,
  animatingStep,
  userProfile,
  selectedLevel,
  existingEnrollment,
  previousEnrollment,
  setComplianceChecked,
  setSelectedLevel,
  setSelectedGrade,
  setSelectedCourse,
  setSelectedYear,
  setSelectedSemester,
  changeStep,
  isEnrollmentAvailable,
  getEnrollmentPeriodMessage
}: Stage1Props) => {
  const handleComplianceCheck = () => {
    setComplianceChecked(!complianceChecked)
  }

  const handleProceedToLevelSelection = () => {
    if (!complianceChecked) {
      toast.error('Please check the compliance box to proceed')
      return
    }
    changeStep('level-selection')
  }

  const handleLevelSelect = (level: 'high-school' | 'college') => {
    // Check if enrollment is available for this level
    if (!isEnrollmentAvailable(level)) {
      const periodMessage = getEnrollmentPeriodMessage(level)
      toast.error(
        `Enrollment for ${
          level === 'high-school' ? 'High School' : 'College'
        } is currently closed.${periodMessage ? ` ${periodMessage}` : ''}`,
        {
          autoClose: 6000,
        }
      )
      return
    }

    setSelectedLevel(level)
    setSelectedGrade(null)
    setSelectedCourse(null)
    setSelectedYear(null)
    setSelectedSemester(null)

    // If college, go to course selection; if high school, go to grade selection
    if (level === 'college') {
      changeStep('course-selection')
    } else {
      changeStep('grade-selection')
    }
  }

  const handleBackToCompliance = () => {
    setSelectedGrade(null)
    setSelectedCourse(null)
    setSelectedLevel(null)
    changeStep('compliance')
  }

  // Compliance Stage
  if (currentStep === 'compliance') {
    return (
      <Card
        className={`p-8 border-none bg-gray-50 border-1 shadow-sm border-blue-900 h-full transition-all duration-500 ${
          animatingStep
            ? 'opacity-0 transform translate-x-4'
            : 'opacity-100 transform translate-x-0'
        }`}
      >
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-blue-900 flex items-center justify-center mx-auto">
            <BookOpen size={32} className="text-white" weight="fill" />
          </div>
          <div className="space-y-4 flex flex-col items-center">
            <h3
              className="text-xl font-medium text-gray-900 mb-2"
              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
            >
              Enrollment Compliance Agreement
            </h3>
            <p className="text-gray-600 text-sm text-justify max-w-2xl mx-auto border-1 shadow-sm border-blue-900 p-4 bg-blue-50">
              Before proceeding with enrollment, you must acknowledge and
              agree to comply with all school policies, academic requirements,
              and institutional guidelines. This includes maintaining academic
              integrity, following the code of conduct, and meeting all course
              prerequisites. By checking the box below, you confirm your
              understanding and commitment to these standards.
            </p>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="compliance-check"
                checked={complianceChecked}
                onChange={handleComplianceCheck}
                className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500 transition-all duration-200"
              />

              <label
                htmlFor="compliance-check"
                className="text-sm text-gray-900 cursor-pointer"
              >
                I acknowledge and agree to comply with all school policies and
                requirements
              </label>
            </div>
          </div>

          <div className="space-y-4"></div>

          <Button
            onClick={handleProceedToLevelSelection}
            disabled={!complianceChecked}
            className={`bg-blue-900 hover:bg-blue-900 transition-all duration-300 hover:shadow-lg ${
              !complianceChecked ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            Proceed to Level Selection
          </Button>
        </div>
      </Card>
    )
  }

  // Level Selection Stage
  if (currentStep === 'level-selection') {
    return (
      <div
        className={`space-y-6 transition-all duration-500 ${
          animatingStep
            ? 'opacity-0 transform -translate-x-4'
            : 'opacity-100 transform translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-900 flex items-center justify-center">
                <User size={20} className="text-white" weight="bold" />
              </div>
              <div>
                <h2
                  className="text-xl font-medium text-gray-900"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  Select Your Education Level
                </h2>
                <p className="text-sm text-gray-600">
                  Choose whether you're enrolling for high school or college
                </p>
              </div>
            </div>
          </div>
          <Button variant="ghost" onClick={handleBackToCompliance}>
            Back
          </Button>
        </div>

        {(() => {
          // Determine student's department from existing enrollment (current) or previous enrollment
          // Check existing enrollment first (current AY/semester), then previous enrollment (for re-enrollment)
          const currentEnrollmentLevel =
            existingEnrollment?.enrollmentInfo?.level
          const previousEnrollmentLevel =
            previousEnrollment?.enrollmentInfo?.level
          const studentDepartment =
            currentEnrollmentLevel || previousEnrollmentLevel // 'college' or 'high-school'

          console.log('Student department check:', {
            existingEnrollment: existingEnrollment?.enrollmentInfo?.level,
            previousEnrollment: previousEnrollment?.enrollmentInfo?.level,
            studentDepartment,
          })

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* High School Option */}
              <div
                className={`relative border-2 rounded-lg p-6 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                  selectedLevel === 'high-school'
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => handleLevelSelect('high-school')}
              >
                <div className="flex items-start space-x-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    selectedLevel === 'high-school' ? 'bg-blue-500' : 'bg-gray-100'
                  }`}>
                    <GraduationCap
                      size={24}
                      className={selectedLevel === 'high-school' ? 'text-white' : 'text-gray-600'}
                      weight="bold"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      High School
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Grades 7-12 • Comprehensive secondary education
                    </p>

                    {/* Enrollment Status */}
                    <div className="flex items-center space-x-2 mb-3">
                      {isEnrollmentAvailable('high-school') ? (
                        <>
                          <CheckCircle size={16} className="text-green-500" weight="fill" />
                          <span className="text-xs text-green-600 font-medium">
                            Enrollment Open
                          </span>
                        </>
                      ) : (
                        <>
                          <WarningCircle size={16} className="text-red-500" weight="fill" />
                          <span className="text-xs text-red-600 font-medium">
                            Currently Closed
                          </span>
                        </>
                      )}
                    </div>

                    {/* Department Restriction */}
                    {studentDepartment && studentDepartment !== 'high-school' && (
                      <div className="bg-amber-50 border border-amber-200 rounded p-2 mb-3">
                        <p className="text-xs text-amber-700">
                          Note: You are currently enrolled in College. Contact administration for department changes.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {selectedLevel === 'high-school' && (
                  <div className="absolute top-3 right-3">
                    <CheckCircle size={20} className="text-blue-500" weight="fill" />
                  </div>
                )}
              </div>

              {/* College Option */}
              <div
                className={`relative border-2 rounded-lg p-6 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                  selectedLevel === 'college'
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => handleLevelSelect('college')}
              >
                <div className="flex items-start space-x-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    selectedLevel === 'college' ? 'bg-blue-500' : 'bg-gray-100'
                  }`}>
                    <BookOpen
                      size={24}
                      className={selectedLevel === 'college' ? 'text-white' : 'text-gray-600'}
                      weight="bold"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      College
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Higher education • Specialized degree programs
                    </p>

                    {/* Enrollment Status */}
                    <div className="flex items-center space-x-2 mb-3">
                      {isEnrollmentAvailable('college') ? (
                        <>
                          <CheckCircle size={16} className="text-green-500" weight="fill" />
                          <span className="text-xs text-green-600 font-medium">
                            Enrollment Open
                          </span>
                        </>
                      ) : (
                        <>
                          <WarningCircle size={16} className="text-red-500" weight="fill" />
                          <span className="text-xs text-red-600 font-medium">
                            Currently Closed
                          </span>
                        </>
                      )}
                    </div>

                    {/* Department Restriction */}
                    {studentDepartment && studentDepartment !== 'college' && (
                      <div className="bg-amber-50 border border-amber-200 rounded p-2 mb-3">
                        <p className="text-xs text-amber-700">
                          Note: You are currently enrolled in High School. Contact administration for department changes.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {selectedLevel === 'college' && (
                  <div className="absolute top-3 right-3">
                    <CheckCircle size={20} className="text-blue-500" weight="fill" />
                  </div>
                )}
              </div>
            </div>
          )
        })()}
      </div>
    )
  }

  return null
}

export default Stage1
