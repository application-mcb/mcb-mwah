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
    'blue-800': '#1e40af',
    'red-800': '#991b1b',
    'red-700': '#b91c1c',
    'emerald-800': '#065f46',
    'emerald-700': '#047857',
    'yellow-800': '#92400e',
    'yellow-700': '#a16207',
    'orange-800': '#9a3412',
    'orange-700': '#c2410c',
    'violet-800': '#5b21b6',
    'violet-700': '#7c3aed',
    'purple-800': '#6b21a8',
    'purple-700': '#8b5cf6',
  }
  return colorMap[color] || '#1e3a8a'
}

const getGradientClasses = (color: string): string => {
  const gradientMap: Record<string, string> = {
    'blue-900': 'bg-gradient-to-br from-blue-800 to-blue-900',
    'blue-800': 'bg-gradient-to-br from-blue-700 to-blue-800',
    'red-800': 'bg-gradient-to-br from-red-700 to-red-800',
    'red-700': 'bg-gradient-to-br from-red-600 to-red-700',
    'emerald-800': 'bg-gradient-to-br from-emerald-700 to-emerald-800',
    'emerald-700': 'bg-gradient-to-br from-emerald-600 to-emerald-700',
    'yellow-800': 'bg-gradient-to-br from-yellow-700 to-yellow-800',
    'yellow-700': 'bg-gradient-to-br from-yellow-600 to-yellow-700',
    'orange-800': 'bg-gradient-to-br from-orange-700 to-orange-800',
    'orange-700': 'bg-gradient-to-br from-orange-600 to-orange-700',
    'violet-800': 'bg-gradient-to-br from-violet-700 to-violet-800',
    'violet-700': 'bg-gradient-to-br from-violet-600 to-violet-700',
    'purple-800': 'bg-gradient-to-br from-purple-700 to-purple-800',
    'purple-700': 'bg-gradient-to-br from-purple-600 to-purple-700',
  }
  return gradientMap[color] || 'bg-gradient-to-br from-blue-800 to-blue-900'
}

const getShadowColor = (color: string): string => {
  const shadowMap: Record<string, string> = {
    'blue-900': '#3b82f6',
    'blue-800': '#3b82f6',
    'red-800': '#ef4444',
    'red-700': '#ef4444',
    'emerald-800': '#10b981',
    'emerald-700': '#10b981',
    'yellow-800': '#eab308',
    'yellow-700': '#eab308',
    'orange-800': '#f97316',
    'orange-700': '#f97316',
    'violet-800': '#8b5cf6',
    'violet-700': '#8b5cf6',
    'purple-800': '#a855f7',
    'purple-700': '#a855f7',
  }
  return shadowMap[color] || '#3b82f6'
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
            No grades available
          </h3>
          <p className="text-gray-600 text-justify border border-blue-100 p-3 bg-white rounded-xl">
            There are currently no grade levels available for enrollment. Please
            contact your registrar or try again later.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {grades.map((grade) => (
            <Card
              key={grade.id}
              className={`relative group p-5 rounded-2xl border text-white transition-all duration-300 ${getGradientClasses(
                grade.color
              )} ${
                selectingGrade === grade.id
                  ? 'border-white/80 shadow-xl'
                  : 'border-transparent shadow-lg'
              } hover:-translate-y-1`}
              style={{
                boxShadow: `0 20px 30px -15px ${getShadowColor(
                  grade.color
                )}80, inset 0 0 0 1px ${
                  selectingGrade === grade.id ? '#ffffff30' : 'transparent'
                }`,
              }}
              onClick={() => handleGradeSelect(grade)}
            >
              <div className="space-y-4 flex flex-col justify-between h-full">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
                    <GraduationCap size={18} weight="fill" className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/70 mb-1">
                      {grade.department === 'SHS'
                        ? 'Senior High'
                        : grade.department === 'JHS'
                        ? 'Junior High'
                        : 'College'}
                    </p>
                    <h3
                      className="text-lg font-semibold text-white mb-1 truncate"
                      style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                    >
                      Grade {grade.gradeLevel}{' '}
                      <span className="font-light">{grade.strand}</span>
                    </h3>
                  </div>
                  {selectingGrade === grade.id && (
                    <div className="w-8 h-8 bg-white/25 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-white" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-white/80 line-clamp-3">
                  {grade.description}
                </p>
                <div className="pt-3 border-t border-white/20 flex items-center justify-between text-xs text-white/70">
                  <span>{grade.sections?.length || 0} sections</span>
                  <span className="px-2 py-1 border border-white/30 rounded-lg">
                    Tap to select
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
