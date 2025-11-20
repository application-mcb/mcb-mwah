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
      className={`p-8 border border-blue-100 bg-white shadow-sm h-full transition-all duration-500 ${
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
          <div className="bg-white border border-blue-100 p-4 rounded-xl">
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
                    {(() => {
                      const gradeLevel = previousEnrollment.enrollmentInfo.gradeLevel
                      const strand = previousEnrollment.enrollmentInfo?.strand
                      const department = previousEnrollment.enrollmentInfo?.department
                      if (department === 'SHS' && strand) {
                        return `Grade ${gradeLevel} - ${strand}`
                      }
                      return `Grade ${gradeLevel}`
                    })()}
                  </span>
                </div>
              )}
              {previousEnrollment.enrollmentInfo?.semester && previousEnrollment.enrollmentInfo?.level === 'high-school' && previousEnrollment.enrollmentInfo?.department === 'SHS' && (
                <div>
                  <span
                    className="text-gray-600"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    Semester:
                  </span>
                  <span
                    className="ml-2 text-gray-900 font-medium"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    {previousEnrollment.enrollmentInfo.semester === 'first-sem' ? 'First Semester' : 'Second Semester'}
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

        {/* Next Level Information (for High School - JHS only) */}
        {previousEnrollment && (() => {
          const prevLevel = previousEnrollment.enrollmentInfo?.level
          const prevSemester = previousEnrollment.enrollmentInfo?.semester
          const prevDept = previousEnrollment.enrollmentInfo?.department
          const isHS = prevLevel === 'high-school' || (!prevLevel && !prevSemester)
          const isSHS = prevDept === 'SHS'
          // Skip next level info for SHS (they handle semester progression differently)
          if (isSHS) return null
          const prevGradeRaw = previousEnrollment.enrollmentInfo?.gradeLevel
          const prevGradeNumStr = prevGradeRaw ? String(prevGradeRaw).match(/\d+/)?.[0] : undefined
          const prevGrade = prevGradeNumStr ? parseInt(prevGradeNumStr, 10) : undefined
          const nextGrade = isHS && prevGrade ? prevGrade + 1 : undefined
          if (!isHS || !nextGrade || nextGrade > 12) return null
          return (
            <div className="bg-white border border-blue-100 p-4 rounded-xl">
              <h3
                className="text-sm font-medium text-gray-900 mb-3"
                style={{ fontFamily: 'Poppins', fontWeight: 500 }}
              >
                Next Level Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span
                    className="text-gray-600"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    Next Grade:
                  </span>
                  <span
                    className="ml-2 text-gray-900 font-medium"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Grade {nextGrade}
                  </span>
                </div>
                <div>
                  <span
                    className="text-gray-600"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    Previous Grade:
                  </span>
                  <span
                    className="ml-2 text-gray-900 font-medium"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Grade {prevGrade}
                  </span>
                </div>
              </div>
            </div>
          )
        })()}

        {/* Semester Info (for College and SHS students) */}
        {reEnrollSemester &&
          ((previousEnrollment?.enrollmentInfo?.level === 'college') ||
            (previousEnrollment?.enrollmentInfo?.level === 'high-school' &&
              previousEnrollment?.enrollmentInfo?.department === 'SHS')) && (
            <div className="bg-white border border-blue-100 p-4 rounded-xl">
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
        <div className="bg-white border border-blue-100 p-4 rounded-xl">
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
