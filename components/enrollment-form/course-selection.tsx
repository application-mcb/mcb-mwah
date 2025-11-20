'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GraduationCap } from '@phosphor-icons/react'
import {
  sectionHeaderClass,
  sectionTitleClass,
  sectionSubtextClass,
  headerIconWrapperClass,
  ghostButtonClass,
} from '@/components/enrollment-form/theme'

type CourseSelectionStepProps = {
  animatingStep: boolean
  loadingCourses: boolean
  courses: any[]
  previousEnrollment: any
  selectedCourse: any | null
  handleBackToLevelSelection: () => void
  handleCourseSelect: (course: any) => void
}

const getColorValue = (color: string): string => {
  const colorMap: Record<string, string> = {
    'blue-900': '#1e3a8a',
    'red-800': '#991b1b',
    'emerald-800': '#065f46',
    'yellow-800': '#92400e',
    'orange-800': '#9a3412',
    'violet-800': '#5b21b6',
    'purple-800': '#6b21a8',
    'red-700': '#b91c1c',
    'emerald-700': '#047857',
    'yellow-700': '#a16207',
    'orange-700': '#c2410c',
    'violet-700': '#7c3aed',
    'purple-700': '#8b5cf6',
    'indigo-800': '#312e81',
    'indigo-700': '#4338ca',
  }
  return colorMap[color] || '#1e3a8a'
}

const getGradientClasses = (color: string): string => {
  const gradientMap: Record<string, string> = {
    'blue-900': 'bg-gradient-to-br from-blue-800 to-blue-900',
    'red-800': 'bg-gradient-to-br from-red-700 to-red-800',
    'emerald-800': 'bg-gradient-to-br from-emerald-700 to-emerald-800',
    'yellow-800': 'bg-gradient-to-br from-yellow-700 to-yellow-800',
    'orange-800': 'bg-gradient-to-br from-orange-700 to-orange-800',
    'violet-800': 'bg-gradient-to-br from-violet-700 to-violet-800',
    'purple-800': 'bg-gradient-to-br from-purple-700 to-purple-800',
    'indigo-800': 'bg-gradient-to-br from-indigo-700 to-indigo-900',
  }
  return gradientMap[color] || 'bg-gradient-to-br from-blue-800 to-blue-900'
}

const getShadowColor = (color: string): string => {
  const shadowMap: Record<string, string> = {
    'blue-900': '#3b82f6',
    'red-800': '#ef4444',
    'emerald-800': '#10b981',
    'yellow-800': '#eab308',
    'orange-800': '#f97316',
    'violet-800': '#8b5cf6',
    'purple-800': '#a855f7',
    'indigo-800': '#6366f1',
  }
  return shadowMap[color] || '#3b82f6'
}

export default function CourseSelectionStep({
  animatingStep,
  loadingCourses,
  courses,
  previousEnrollment,
  selectedCourse,
  handleBackToLevelSelection,
  handleCourseSelect,
}: CourseSelectionStepProps) {
  return (
    <div
      className={`space-y-4 sm:space-y-6 transition-all duration-500 ${
        animatingStep
          ? 'opacity-0 transform translate-x-4'
          : 'opacity-100 transform translate-x-0'
      }`}
    >
      <div className={sectionHeaderClass}>
        <div className="flex items-center gap-3">
          <div className={headerIconWrapperClass}>
            <GraduationCap size={18} className="text-blue-50" weight="bold" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className={sectionTitleClass}>Select Your Course</h2>
            <p className={sectionSubtextClass}>
              Choose the college course you wish to enroll in
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={handleBackToLevelSelection}
          className={`${ghostButtonClass} w-full sm:w-auto`}
        >
          Back
        </Button>
      </div>

      {loadingCourses ? (
        <Card className="p-12 text-center border border-blue-100 bg-white shadow-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-900/30 border-t-blue-900 mx-auto mb-4"></div>
          <h3
            className="text-lg font-medium text-gray-900 mb-2"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            Loading courses...
          </h3>
          <p className="text-gray-600 text-justify border border-blue-100 p-3 bg-white rounded-xl">
            Please wait while we load available college courses.
          </p>
        </Card>
      ) : courses.length === 0 ? (
        <Card className="p-12 text-center border border-blue-100 bg-white shadow-sm">
          <GraduationCap
            size={48}
            className="mx-auto text-gray-400 mb-4"
            weight="duotone"
          />
          <h3
            className="text-lg font-medium text-gray-900 mb-2"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            No courses available
          </h3>
          <p className="text-gray-600 text-justify border border-blue-100 p-3 bg-white rounded-xl">
            There are currently no college courses available for enrollment.
            Please contact your registrar or try again later.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map((course, index) => {
            const previousCourseCode =
              previousEnrollment?.enrollmentInfo?.courseCode
            const isPreviousCourse =
              previousCourseCode && course.code === previousCourseCode
            const gradientClasses = getGradientClasses(course.color)
            const accentColor = getColorValue(course.color)
            const shadowColor = getShadowColor(course.color)
            const isSelected = selectedCourse?.id === course.id
            return (
              <Card
                key={`course-${course.id}-${index}`}
                className={`relative group p-5 rounded-2xl border text-white transition-all duration-300 ${gradientClasses} ${
                  isPreviousCourse
                    ? 'opacity-40 cursor-not-allowed'
                    : 'cursor-pointer hover:-translate-y-1 hover:shadow-2xl'
                } ${isSelected ? 'border-white/80 shadow-xl' : 'border-transparent shadow-lg'}`}
                style={{
                  boxShadow: `0 15px 25px -10px ${shadowColor}80, inset 0 0 0 1px ${isSelected ? '#ffffff40' : 'transparent'}`,
                }}
                onClick={() => !isPreviousCourse && handleCourseSelect(course)}
              >
                <div className="space-y-4 flex flex-col justify-between h-full">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
                      <GraduationCap size={18} weight="fill" className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className="text-lg font-semibold text-white mb-1 truncate"
                        style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                      >
                        {course.code}
                      </h3>
                      <p
                        className="text-sm text-white/80 truncate"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        {course.name}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="absolute top-4 right-4 w-8 h-8 bg-white/25 rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-white" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-white/80 line-clamp-3">
                    {course.description}
                  </p>
                  <div className="pt-3 border-t border-white/20 flex items-center justify-between text-xs text-white/80">
                    <span>
                      {isPreviousCourse
                        ? 'Already enrolled course'
                        : 'Tap to select'}
                    </span>
                    <span
                      className="px-2 py-1 rounded-lg border border-white/30 text-[11px]"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      {course.units
                        ? `${course.units} units`
                        : course.department || 'College'}
                    </span>
                  </div>
                </div>
                {!isSelected && !isPreviousCourse && (
                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"
                    style={{ backgroundColor: accentColor }}
                  />
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
