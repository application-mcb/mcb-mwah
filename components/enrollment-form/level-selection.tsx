'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  GraduationCap,
  User,
  Check,
  WarningCircle,
} from '@phosphor-icons/react'
import { GradeData } from '@/lib/grade-section-database'

type LevelSelectionStepProps = {
  animatingStep: boolean
  checkingPreviousEnrollment: boolean
  previousEnrollment: any
  existingEnrollment: any
  grades?: GradeData[]
  enrollmentStartPeriodHS: string | null
  enrollmentEndPeriodHS: string | null
  enrollmentStartPeriodCollege: string | null
  enrollmentEndPeriodCollege: string | null
  isEnrollmentAvailable: (level: 'high-school' | 'college') => boolean
  getEnrollmentPeriodMessage: (
    level: 'high-school' | 'college'
  ) => string | null
  getEnrollmentDaysRemaining: (
    level: 'high-school' | 'college'
  ) => number | null
  getEnrollmentProgress: (level: 'high-school' | 'college') => number
  handleLevelSelect: (level: 'high-school' | 'college') => void
  handleBackToCompliance: () => void
  handleStartReEnroll: () => void
}

const getColorValue = (color: string): string => {
  const colorMap: Record<string, string> = {
    'blue-900': '#1e40af',
    'red-800': '#991b1b',
    'emerald-800': '#065f46',
    'yellow-800': '#92400e',
    'orange-800': '#9a3412',
    'violet-800': '#5b21b6',
    'purple-800': '#6b21a8',
    'blue-900': '#1d4ed8',
    'red-700': '#b91c1c',
    'emerald-700': '#047857',
    'yellow-700': '#a16207',
    'orange-700': '#c2410c',
    'violet-700': '#7c3aed',
    'purple-700': '#8b5cf6',
    'indigo-800': '#312e81',
    'indigo-700': '#4338ca',
    'blue-900': '#1e3a8a',
  }
  return colorMap[color] || '#065f46'
}

export default function LevelSelectionStep({
  animatingStep,
  checkingPreviousEnrollment,
  previousEnrollment,
  existingEnrollment,
  grades,
  enrollmentStartPeriodHS,
  enrollmentEndPeriodHS,
  enrollmentStartPeriodCollege,
  enrollmentEndPeriodCollege,
  isEnrollmentAvailable,
  getEnrollmentPeriodMessage,
  getEnrollmentDaysRemaining,
  getEnrollmentProgress,
  handleLevelSelect,
  handleBackToCompliance,
  handleStartReEnroll,
}: LevelSelectionStepProps) {
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
            <div className="w-10 h-10 bg-gradient-to-br from-blue-800 to-blue-900 rounded-xl flex items-center justify-center">
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
        const currentEnrollmentLevel = existingEnrollment?.enrollmentInfo?.level
        const previousEnrollmentLevel =
          previousEnrollment?.enrollmentInfo?.level
        const studentDepartment =
          currentEnrollmentLevel || previousEnrollmentLevel

        const showHighSchool =
          studentDepartment === undefined || studentDepartment === 'high-school'
        const showCollege =
          studentDepartment === undefined || studentDepartment === 'college'

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(() => {
              if (!previousEnrollment || checkingPreviousEnrollment) return null
              const prevLevel = previousEnrollment.enrollmentInfo?.level
              const prevSemester = previousEnrollment.enrollmentInfo?.semester
              const prevDepartment = previousEnrollment.enrollmentInfo?.department
              const prevGradeRaw = previousEnrollment.enrollmentInfo?.gradeLevel
              const prevGradeNumStr = prevGradeRaw
                ? String(prevGradeRaw).match(/\d+/)?.[0]
                : undefined
              const prevGrade = prevGradeNumStr
                ? parseInt(prevGradeNumStr, 10)
                : undefined
              // Treat legacy HS (no level and no semester) as high-school
              const isHS =
                prevLevel === 'high-school' || (!prevLevel && !prevSemester)
              const isSHS = isHS && prevDepartment === 'SHS' && prevSemester
              
              // Calculate next grade/semester based on type
              let nextGrade: number | undefined
              let nextSemester: string | undefined
              let header: string
              let sub: string
              
              if (isSHS) {
                // SHS: Handle semester progression
                if (prevSemester === 'first-sem') {
                  // Continue to second semester of same grade
                  nextGrade = prevGrade
                  nextSemester = 'Second Semester'
                  header = `Continue to Grade ${nextGrade} Second Semester`
                  sub = `Next: Grade ${nextGrade} Second Semester (Previous: Grade ${prevGrade} First Semester)`
                } else if (prevSemester === 'second-sem') {
                  // Continue to first semester of next grade
                  nextGrade = prevGrade ? prevGrade + 1 : undefined
                  nextSemester = 'First Semester'
                  if (nextGrade && nextGrade <= 12) {
                    header = `Continue to Grade ${nextGrade} First Semester`
                    sub = `Next: Grade ${nextGrade} First Semester (Previous: Grade ${prevGrade} Second Semester)`
                  } else {
                    // Already at Grade 12 Second Semester, no next grade
                    return null
                  }
                } else {
                  return null
                }
              } else if (isHS) {
                // JHS: Simple grade progression (no semester)
                nextGrade = prevGrade ? prevGrade + 1 : undefined
                header = `Continue to Grade ${nextGrade}`
                sub = `Next: Grade ${nextGrade} (Previous: Grade ${prevGrade})`
              } else {
                // College
                header = 'Continue Previous'
                sub = previousEnrollment.enrollmentInfo?.courseCode ||
                  `Grade ${previousEnrollment.enrollmentInfo?.gradeLevel}`
              }
              
              const showCard =
                !isHS || (nextGrade !== undefined && nextGrade <= 12)
              if (!showCard) return null
              // Resolve next grade's configured color if available
              let nextGradeObj: GradeData | undefined
              if (isHS && nextGrade && Array.isArray(grades)) {
                nextGradeObj = grades.find(
                  (g) => Number(g.gradeLevel) === nextGrade
                )
              }
              const nextGradeBg = nextGradeObj?.color
                ? getColorValue(nextGradeObj.color)
                : undefined

              return (
                <Card
                  className="group p-8 border-none border-1 shadow-sm transition-all duration-300 hover:shadow-lg cursor-pointer"
                  style={
                    nextGradeBg
                      ? { backgroundColor: nextGradeBg }
                      : {
                          background:
                            'linear-gradient(135deg, #065f46 0%, #047857 100%)',
                        }
                  }
                  onClick={handleStartReEnroll}
                >
                  <div className="space-y-6 flex flex-col justify-between h-full">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                          <GraduationCap
                            size={32}
                            weight="fill"
                            className="text-white"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3
                            className="text-xl font-medium text-white"
                            style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                          >
                            {header}
                          </h3>
                          <p
                            className="text-sm text-white/80"
                            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                          >
                            {sub}
                          </p>
                        </div>
                      </div>
                    </div>

                    <p
                      className="text-sm text-white/90"
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      Continue with your previous enrollment information from{' '}
                      {previousEnrollment.enrollmentInfo?.schoolYear ||
                        'previous AY'}
                      .
                    </p>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm text-white/90">
                        <Check size={16} className="text-white" weight="bold" />
                        <span
                          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                        >
                          {previousEnrollment.enrollmentInfo?.level ===
                          'college'
                            ? `${previousEnrollment.enrollmentInfo?.courseCode} - Year ${previousEnrollment.enrollmentInfo?.yearLevel}`
                            : isSHS && prevSemester
                            ? `Grade ${previousEnrollment.enrollmentInfo?.gradeLevel} - ${
                                prevSemester === 'first-sem'
                                  ? 'First'
                                  : 'Second'
                              } Semester`
                            : `Grade ${previousEnrollment.enrollmentInfo?.gradeLevel}`}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-white/90">
                        <Check size={16} className="text-white" weight="bold" />
                        <span
                          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                        >
                          Pre-filled information
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-white/90">
                        <Check size={16} className="text-white" weight="bold" />
                        <span
                          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                        >
                          {previousEnrollment.enrollmentInfo?.level ===
                          'college'
                            ? `Previous: ${
                                previousEnrollment.enrollmentInfo?.semester ===
                                'first-sem'
                                  ? 'First'
                                  : 'Second'
                              } Semester`
                            : isSHS && nextSemester
                            ? `Next: ${nextSemester}`
                            : `Next Level: Grade ${nextGrade}`}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/20">
                      <div className="flex items-center justify-between">
                        <span
                          className="text-sm text-white/90"
                          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                        >
                          Click to continue
                        </span>
                        <div className="w-6 h-6 border-2 border-white"></div>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })()}

            {checkingPreviousEnrollment && (
              <Card className="group p-8 border-none border-1 shadow-sm bg-gray-50">
                <div className="space-y-6 flex flex-col justify-between h-full items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-green-600"></div>
                    <span
                      className="text-sm text-gray-500"
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      Checking...
                    </span>
                  </div>
                </div>
              </Card>
            )}

            {showHighSchool &&
              (() => {
                const isAvailable = isEnrollmentAvailable('high-school')
                const periodMessage = getEnrollmentPeriodMessage('high-school')
                const daysRemaining = getEnrollmentDaysRemaining('high-school')
                const progress = getEnrollmentProgress('high-school')
                const hasDuration =
                  enrollmentStartPeriodHS && enrollmentEndPeriodHS
                return (
                  <Card
                    className={`group p-8 border-none border-1 shadow-sm transition-all duration-300 ${
                      isAvailable
                        ? 'hover:shadow-lg cursor-pointer'
                        : 'cursor-not-allowed'
                    }`}
                    style={{
                      background: isAvailable
                        ? 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)'
                        : 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)',
                    }}
                    onClick={() =>
                      isAvailable && handleLevelSelect('high-school')
                    }
                  >
                    <div className="space-y-6 flex flex-col justify-between h-full">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                            <GraduationCap
                              size={32}
                              weight="fill"
                              className="text-white"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3
                              className="text-xl font-medium text-white"
                              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                            >
                              High School
                            </h3>
                            <p
                              className="text-sm text-white/80"
                              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                            >
                              Grades 7-12
                            </p>
                          </div>
                        </div>
                      </div>

                      <p
                        className="text-sm text-white/90"
                        style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                      >
                        Select this option if you're enrolling for junior high
                        school (Grade 7-10) or senior high school (Grade 11-12)
                        programs.
                      </p>

                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm text-white/90">
                          <Check
                            size={16}
                            className="text-white"
                            weight="bold"
                          />
                          <span
                            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                          >
                            Grade-based curriculum
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-white/90">
                          <Check
                            size={16}
                            className="text-white"
                            weight="bold"
                          />
                          <span
                            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                          >
                            Subject sets by grade level
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-white/90">
                          <Check
                            size={16}
                            className="text-white"
                            weight="bold"
                          />
                          <span
                            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                          >
                            Regular/Irregular student options
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 pt-4 border-t border-white/20">
                        <div className="flex items-center justify-between">
                          <span
                            className="text-sm font-medium text-white"
                            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                          >
                            {hasDuration
                              ? daysRemaining !== null
                                ? isAvailable
                                  ? `${daysRemaining} ${
                                      daysRemaining === 1 ? 'day' : 'days'
                                    } left`
                                  : 'Enrollment Closed'
                                : 'Duration not set'
                              : 'Enrollment Closed'}
                          </span>
                          {isAvailable ? (
                            <Check
                              size={20}
                              className="text-white"
                              weight="bold"
                            />
                          ) : (
                            <WarningCircle
                              size={20}
                              className="text-white"
                              weight="bold"
                            />
                          )}
                        </div>
                        {isAvailable &&
                          hasDuration &&
                          daysRemaining !== null && (
                            <div className="w-full bg-white/20 rounded-full h-2">
                              <div
                                className="bg-white h-2 rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                          )}
                        {hasDuration && periodMessage && (
                          <p
                            className="text-xs text-white/70"
                            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                          >
                            {periodMessage}
                          </p>
                        )}
                        {!hasDuration && (
                          <p
                            className="text-xs text-white/70"
                            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                          >
                            No enrollments available
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })()}

            {showCollege &&
              (() => {
                const isAvailable = isEnrollmentAvailable('college')
                const periodMessage = getEnrollmentPeriodMessage('college')
                const daysRemaining = getEnrollmentDaysRemaining('college')
                const progress = getEnrollmentProgress('college')
                const hasDuration =
                  enrollmentStartPeriodCollege && enrollmentEndPeriodCollege
                const hasPreviousCollegeEnrollment =
                  previousEnrollment?.enrollmentInfo?.level === 'college'
                const previousCourse =
                  previousEnrollment?.enrollmentInfo?.courseCode
                return (
                  <Card
                    className={`group p-8 border-none border-1 shadow-sm transition-all duration-300 ${
                      isAvailable
                        ? 'hover:shadow-lg cursor-pointer'
                        : 'cursor-not-allowed'
                    }`}
                    style={{
                      background: isAvailable
                        ? 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)'
                        : 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)',
                    }}
                    onClick={() => isAvailable && handleLevelSelect('college')}
                  >
                    <div className="space-y-6 flex flex-col justify-between h-full">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                            <GraduationCap
                              size={32}
                              weight="fill"
                              className="text-white"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3
                              className="text-xl font-medium text-white"
                              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                            >
                              {hasPreviousCollegeEnrollment
                                ? 'Shift Course'
                                : 'College'}
                            </h3>
                            <p
                              className="text-sm text-white/80"
                              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                            >
                              {hasPreviousCollegeEnrollment
                                ? 'Change Your Program'
                                : 'Degree Programs'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <p
                        className="text-sm text-white/90"
                        style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                      >
                        {hasPreviousCollegeEnrollment
                          ? `You are currently enrolled in ${
                              previousCourse || 'a course'
                            }. Select this option to shift to a different degree program.`
                          : "Select this option if you're enrolling for college degree programs and courses."}
                      </p>

                      <div className="space-y-2">
                        {hasPreviousCollegeEnrollment ? (
                          <>
                            <div className="flex items-center space-x-2 text-sm text-white/90">
                              <Check
                                size={16}
                                className="text-white"
                                weight="bold"
                              />
                              <span
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 300,
                                }}
                              >
                                Transfer to a different course
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-white/90">
                              <Check
                                size={16}
                                className="text-white"
                                weight="bold"
                              />
                              <span
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 300,
                                }}
                              >
                                Maintain your academic progress
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-white/90">
                              <Check
                                size={16}
                                className="text-white"
                                weight="bold"
                              />
                              <span
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 300,
                                }}
                              >
                                Subject selection by new course
                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center space-x-2 text-sm text-white/90">
                              <Check
                                size={16}
                                className="text-white"
                                weight="bold"
                              />
                              <span
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 300,
                                }}
                              >
                                Course-based curriculum
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-white/90">
                              <Check
                                size={16}
                                className="text-white"
                                weight="bold"
                              />
                              <span
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 300,
                                }}
                              >
                                Degree program enrollment
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-white/90">
                              <Check
                                size={16}
                                className="text-white"
                                weight="bold"
                              />
                              <span
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 300,
                                }}
                              >
                                Subject selection by course
                              </span>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="space-y-2 pt-4 border-t border-white/20">
                        <div className="flex items-center justify-between">
                          <span
                            className="text-sm font-medium text-white"
                            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                          >
                            {hasDuration
                              ? daysRemaining !== null
                                ? isAvailable
                                  ? `${daysRemaining} ${
                                      daysRemaining === 1 ? 'day' : 'days'
                                    } left`
                                  : 'Enrollment Closed'
                                : 'Duration not set'
                              : 'Enrollment Closed'}
                          </span>
                          {isAvailable ? (
                            <Check
                              size={20}
                              className="text-white"
                              weight="bold"
                            />
                          ) : (
                            <WarningCircle
                              size={20}
                              className="text-white"
                              weight="bold"
                            />
                          )}
                        </div>
                        {isAvailable &&
                          hasDuration &&
                          daysRemaining !== null && (
                            <div className="w-full bg-white/20 rounded-full h-2">
                              <div
                                className="bg-white h-2 rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                          )}
                        {hasDuration && periodMessage && (
                          <p
                            className="text-xs text-white/70"
                            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                          >
                            {periodMessage}
                          </p>
                        )}
                        {!hasDuration && (
                          <p
                            className="text-xs text-white/70"
                            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                          >
                            No enrollments available
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })()}
          </div>
        )
      })()}
    </div>
  )
}
