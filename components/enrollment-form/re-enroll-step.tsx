'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GraduationCap, Calendar, Check } from '@phosphor-icons/react'

type ReEnrollStepProps = {
  animatingStep: boolean
  previousEnrollment: any
  reEnrollSemester: 'first-sem' | 'second-sem' | null
  onBack: () => void
  onProceed: () => void
}

export default function ReEnrollStep({
  animatingStep,
  previousEnrollment,
  reEnrollSemester,
  onBack,
  onProceed,
}: ReEnrollStepProps) {
  return (
    <Card
      className={`p-8 border-none bg-gray-50 border-1 shadow-sm border-blue-900 h-full transition-all duration-500 ${
        animatingStep
          ? 'opacity-0 transform translate-x-4'
          : 'opacity-100 transform translate-x-0'
      }`}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-900 flex items-center justify-center">
              <GraduationCap
                size={20}
                className="text-white"
                weight="bold"
              />
            </div>
            <div>
              <h2
                className="text-xl font-medium text-gray-900"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Continue Previous Enrollment
              </h2>
              <p
                className="text-sm text-gray-600"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                Review your previous enrollment information
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={onBack}
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            Back
          </Button>
        </div>

        {/* Previous Enrollment Info */}
        {previousEnrollment && (
          <div className="bg-blue-50 border border-blue-200 p-4">
            <h3
              className="text-sm font-medium text-gray-900 mb-3"
              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
            >
              Previous Enrollment Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span
                  className="text-gray-600"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  Level:
                </span>
                <span
                  className="ml-2 text-gray-900 font-medium"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  {previousEnrollment.enrollmentInfo?.level === 'college'
                    ? 'College'
                    : 'High School'}
                </span>
              </div>
              {previousEnrollment.enrollmentInfo?.courseCode && (
                <div>
                  <span
                    className="text-gray-600"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    Course:
                  </span>
                  <span
                    className="ml-2 text-gray-900 font-medium"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    {previousEnrollment.enrollmentInfo.courseCode}
                  </span>
                </div>
              )}
              {previousEnrollment.enrollmentInfo?.gradeLevel && (
                <div>
                  <span
                    className="text-gray-600"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    Grade:
                  </span>
                  <span
                    className="ml-2 text-gray-900 font-medium"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Grade {previousEnrollment.enrollmentInfo.gradeLevel}
                  </span>
                </div>
              )}
              {previousEnrollment.enrollmentInfo?.yearLevel && (
                <div>
                  <span
                    className="text-gray-600"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    Year Level:
                  </span>
                  <span
                    className="ml-2 text-gray-900 font-medium"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Year {previousEnrollment.enrollmentInfo.yearLevel}
                  </span>
                </div>
              )}
              <div>
                <span
                  className="text-gray-600"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  Academic Year:
                </span>
                <span
                  className="ml-2 text-gray-900 font-medium"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  {previousEnrollment.enrollmentInfo?.schoolYear || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Semester Info (for College students) */}
        {previousEnrollment?.enrollmentInfo?.level === 'college' &&
          reEnrollSemester && (
            <div className="bg-blue-50 border border-blue-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-900 flex items-center justify-center">
                  <Calendar
                    size={20}
                    className="text-white"
                    weight="bold"
                  />
                </div>
                <div className="flex-1">
                  <h4
                    className="text-sm font-medium text-gray-900 mb-1"
                    style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                  >
                    Enrollment Semester
                  </h4>
                  <p
                    className="text-xs text-gray-600"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    You will be enrolling for{' '}
                    <span className="font-medium text-blue-900">
                      {reEnrollSemester === 'first-sem'
                        ? 'First Semester'
                        : 'Second Semester'}
                    </span>
                    {previousEnrollment.enrollmentInfo?.semester && (
                      <span className="ml-1">
                        based on your previous{' '}
                        {previousEnrollment.enrollmentInfo.semester ===
                        'first-sem'
                          ? 'First'
                          : 'Second'}{' '}
                        Semester enrollment
                      </span>
                    )}
                  </p>
                </div>
                <div className="w-8 h-8 bg-blue-900 flex items-center justify-center">
                  <Check size={16} className="text-white" weight="bold" />
                </div>
              </div>
            </div>
          )}

        {/* Note */}
        <div className="bg-gray-50 border border-gray-200 p-4">
          <p
            className="text-xs text-gray-600"
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            Your previous enrollment information will be used to pre-fill
            the form. You can review and confirm your details in the next
            step.
          </p>
        </div>

        <Button
          onClick={onProceed}
          className="bg-blue-900 hover:bg-blue-900 transition-all duration-300 hover:shadow-lg"
          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
        >
          Proceed to Confirmation
        </Button>
      </div>
    </Card>
  )
}
