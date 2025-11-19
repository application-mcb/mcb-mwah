'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GraduationCap } from '@phosphor-icons/react'
import { GradeData } from '@/lib/grade-section-database'
import {
  sectionHeaderClass,
  sectionTitleClass,
  sectionSubtextClass,
  headerIconWrapperClass,
  ghostButtonClass,
} from '@/components/enrollment-form/theme'

type GradeSelectionStepProps = {
  animatingStep: boolean
  grades: GradeData[]
  selectingGrade: string | null
  handleBackToLevelSelection: () => void
  handleGradeSelect: (grade: GradeData) => void
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
  return colorMap[color] || '#065f46'
}

export default function GradeSelectionStep({
  animatingStep,
  grades,
  selectingGrade,
  handleBackToLevelSelection,
  handleGradeSelect,
}: GradeSelectionStepProps) {
  return (
    <div
      className={`space-y-4 sm:space-y-6 transition-all duration-500 ${
        animatingStep
          ? 'opacity-0 transform -translate-x-4'
          : 'opacity-100 transform translate-x-0'
      }`}
    >
      <div className={sectionHeaderClass}>
        <div className="flex items-center gap-3">
          <div className={headerIconWrapperClass}>
            <GraduationCap size={18} className="text-blue-50" weight="bold" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className={sectionTitleClass}>Select Your Grade Level</h2>
            <p className={sectionSubtextClass}>
              Choose the grade level you wish to enroll in
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

      {grades.length === 0 ? (
        <Card className="p-12 text-center border-none bg-gray-50 border-1 shadow-sm border-blue-900">
          <GraduationCap
            size={48}
            className="mx-auto text-gray-400 mb-4"
            weight="duotone"
          />
          <h3
            className="text-lg font-medium text-gray-900 mb-2"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            No grades available
          </h3>
          <p className="text-gray-600 text-justify border-1 shadow-sm border-blue-900 p-3 bg-blue-50">
            There are currently no grade levels available for enrollment. Please
            contact your registrar or try again later.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {grades.map((grade) => (
            <Card
              key={grade.id}
              className={`group p-4 border-none border-1 shadow-sm bg-gray-50 hover:border-blue-900 cursor-pointer ${
                selectingGrade === grade.id ? 'shadow-lg border-blue-900' : ''
              }`}
              style={{ backgroundColor: getColorValue(grade.color) }}
              onClick={() => handleGradeSelect(grade)}
            >
              <div className="space-y-4 flex flex-col justify-between h-full">
                <div className="flex flex-col items-center space-y-2">
                  <div
                    className={`w-8 h-8 flex items-center justify-center bg-white rounded-full`}
                  >
                    <GraduationCap
                      size={16}
                      weight="fill"
                      style={{ color: getColorValue(grade.color) }}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-white/80 mb-1">
                      {grade.department} Department
                    </p>
                    <h3
                      className="text-sm font-medium text-white"
                      style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                    >
                      Grade {grade.gradeLevel} {grade.strand}
                    </h3>
                  </div>
                </div>
                <p className="hidden sm:block text-xs text-white line-clamp-3">
                  {grade.description}
                </p>
                <div className="hidden sm:block pt-2 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white">
                      Click to select
                    </span>
                    <div
                      className={`w-4 h-4 border-2 border-white transition-colors`}
                    ></div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
