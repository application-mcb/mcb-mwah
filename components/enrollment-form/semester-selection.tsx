'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, WarningCircle, Check } from '@phosphor-icons/react'

type SemesterSelectionStepProps = {
  animatingStep: boolean
  currentSystemSemester: string | null
  selectedSemester: 'first-sem' | 'second-sem' | null
  onBack: () => void
  onSelectSemester: (semester: 'first-sem' | 'second-sem') => void
}

const getColorValue = (color: string): string => {
  const colorMap: Record<string, string> = {
    'blue-900': '#1e40af',
    'blue-900': '#1e3a8a',
  }
  return colorMap[color] || '#1e40af'
}

export default function SemesterSelectionStep({
  animatingStep,
  currentSystemSemester,
  selectedSemester,
  onBack,
  onSelectSemester,
}: SemesterSelectionStepProps) {
  const currentSemesterFormat =
    currentSystemSemester === '1'
      ? 'first-sem'
      : currentSystemSemester === '2'
      ? 'second-sem'
      : null

  const isSemesterSelectable = (semester: 'first-sem' | 'second-sem') => {
    if (!currentSemesterFormat) return true
    return semester === currentSemesterFormat
  }

  return (
    <div
      className={`space-y-4 sm:space-y-6 transition-all duration-500 ${
        animatingStep
          ? 'opacity-0 transform translate-x-4'
          : 'opacity-100 transform translate-x-0'
      }`}
    >
      <div className="bg-white/80 backdrop-blur-sm p-4 sm:p-6 rounded-xl border border-blue-100 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-800 to-blue-900 rounded-xl flex items-center justify-center flex-shrink-0">
              <Calendar size={16} className="sm:w-5 sm:h-5 text-white" weight="bold" />
            </div>
            <div className="min-w-0 flex-1">
              <h2
                className="text-lg sm:text-xl font-medium text-gray-900"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Select Your Semester
              </h2>
              <p className="text-xs sm:text-sm text-gray-600">
                Choose the semester you wish to enroll in
              </p>
            </div>
          </div>
          <Button variant="ghost" onClick={onBack} className="w-full sm:w-auto">
            Back
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(['first-sem', 'second-sem'] as const).map((sem) => (
          <Card
            key={sem}
            className={`group p-6 border-none border-1 shadow-sm transition-all duration-300 ${
              !isSemesterSelectable(sem)
                ? 'cursor-not-allowed'
                : 'hover:border-blue-900 cursor-pointer hover:shadow-lg bg-gray-50'
            } ${selectedSemester === sem ? 'shadow-lg border-blue-900' : ''}`}
            style={{
              background: !isSemesterSelectable(sem)
                ? 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)'
                : selectedSemester === sem
                ? 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)'
                : 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
            }}
            onClick={() => isSemesterSelectable(sem) && onSelectSemester(sem)}
          >
            <div className="space-y-4 flex flex-col justify-between h-full">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-10 h-10 flex items-center justify-center bg-white`}
                  >
                    <Calendar
                      size={20}
                      weight="fill"
                      className={`${
                        selectedSemester === sem
                          ? 'text-blue-900'
                          : 'text-blue-900'
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`text-lg font-medium ${
                        selectedSemester === sem ? 'text-white' : 'text-white'
                      }`}
                      style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                    >
                      {sem === 'first-sem'
                        ? 'First Semester'
                        : 'Second Semester'}
                    </h3>
                    <p
                      className={`text-sm ${
                        selectedSemester === sem ? 'text-white' : 'text-white'
                      }`}
                    >
                      {sem === 'first-sem'
                        ? 'August - December'
                        : 'January - May'}
                    </p>
                  </div>
                </div>
              </div>

              <p
                className={`text-sm ${
                  selectedSemester === sem ? 'text-white' : 'text-white'
                }`}
              >
                {sem === 'first-sem'
                  ? 'First semester enrollment for the academic year.'
                  : 'Second semester enrollment for the academic year.'}
              </p>

              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm ${
                      selectedSemester === sem ? 'text-white' : 'text-white'
                    }`}
                  >
                    {!isSemesterSelectable(sem)
                      ? 'Not available'
                      : 'Click to select'}
                  </span>
                  {!isSemesterSelectable(sem) ? (
                    <WarningCircle
                      size={16}
                      className="text-red-200"
                      weight="bold"
                    />
                  ) : (
                    <div
                      className={`w-4 h-4 border-2 ${
                        selectedSemester === sem
                          ? 'border-white bg-white'
                          : 'border-white'
                      }`}
                    ></div>
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
