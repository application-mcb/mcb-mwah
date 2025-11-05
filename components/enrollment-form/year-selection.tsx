'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GraduationCap, User, WarningCircle } from '@phosphor-icons/react'

type YearSelectionStepProps = {
  animatingStep: boolean
  previousEnrollment: any
  selectedYear: number | null
  onBack: () => void
  onSelectYear: (year: number) => void
}

const getColorValue = (color: string): string => {
  const colorMap: Record<string, string> = {
    'blue-800': '#1e40af',
    'blue-900': '#1e3a8a',
  }
  return colorMap[color] || '#1e40af'
}

export default function YearSelectionStep({
  animatingStep,
  previousEnrollment,
  selectedYear,
  onBack,
  onSelectYear,
}: YearSelectionStepProps) {
  const previousYearLevel = previousEnrollment?.enrollmentInfo?.yearLevel
  const previousSemester = previousEnrollment?.enrollmentInfo?.semester
  let allowedYearLevel: number | null = null
  if (previousYearLevel && previousSemester) {
    allowedYearLevel = previousYearLevel + 1
  }

  const isYearSelectable = (year: number) => {
    if (!allowedYearLevel) return true
    return year === allowedYearLevel
  }

  return (
    <div
      className={`space-y-6 transition-all duration-500 ${
        animatingStep ? 'opacity-0 transform translate-x-4' : 'opacity-100 transform translate-x-0'
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-900 flex items-center justify-center">
              <User size={20} className="text-white" weight="bold" />
            </div>
            <div>
              <h2 className="text-xl font-medium text-gray-900" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                Select Your Year Level
              </h2>
              <p className="text-sm text-gray-600">Choose your current year level in college</p>
            </div>
          </div>
        </div>
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((year) => (
          <Card
            key={year}
            className={`group p-6 border-none border-1 shadow-sm transition-all duration-300 ${
              !isYearSelectable(year) ? 'cursor-not-allowed' : 'hover:border-blue-900 cursor-pointer hover:shadow-lg bg-gray-50'
            } ${selectedYear === year ? 'shadow-lg border-blue-900' : ''}`}
            style={{
              background: !isYearSelectable(year)
                ? 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)'
                : selectedYear === year
                ? getColorValue('blue-900')
                : getColorValue('blue-800'),
            }}
            onClick={() => isYearSelectable(year) && onSelectYear(year)}
          >
            <div className="space-y-4 flex flex-col justify-between h-full">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 flex items-center justify-center bg-white`}>
                    <GraduationCap
                      size={20}
                      weight="fill"
                      className={`${selectedYear === year ? 'text-blue-900' : 'text-blue-800'}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`text-lg font-medium ${selectedYear === year ? 'text-white' : 'text-white'}`}
                      style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                    >
                      {['First', 'Second', 'Third', 'Fourth'][year - 1]} Year
                    </h3>
                    <p className={`text-sm ${selectedYear === year ? 'text-white' : 'text-white'}`}>
                      {['Freshman', 'Sophomore', 'Junior', 'Senior'][year - 1]} Level
                    </p>
                  </div>
                </div>
              </div>

              <p className={`text-sm ${selectedYear === year ? 'text-white' : 'text-white'}`}>
                {[
                  'First year college students beginning their academic journey.',
                  'Second year college students continuing their studies.',
                  'Third year college students advancing in their major studies.',
                  'Fourth year college students completing their degree requirements.',
                ][year - 1]}
              </p>

              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${selectedYear === year ? 'text-white' : 'text-white'}`}>
                    {!isYearSelectable(year) ? 'Not available' : 'Click to select'}
                  </span>
                  {!isYearSelectable(year) ? (
                    <WarningCircle size={16} className="text-red-200" weight="bold" />
                  ) : (
                    <div className={`w-4 h-4 border-2 ${selectedYear === year ? 'border-white bg-white' : 'border-white'}`}></div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}


