import React from 'react'
import { Input } from '@/components/ui/input'
import { FunnelSimple, X, ChartLineUp, ChartBar, Calendar } from '@phosphor-icons/react'

interface AnalyticsHeaderProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  showFilterDropdown: boolean
  onToggleFilterDropdown: () => void
  onCloseFilters: () => void
  availableAYs: string[]
  currentAY: string
  selectedAY: string
  selectedSemester: string
  selectedStudentType: ('regular' | 'irregular')[]
  selectedLevel: ('college' | 'senior' | 'junior')[]
  onSelectAY: (ay: string) => void
  onSelectSemester: (semester: '1' | '2') => void
  onToggleStudentType: (type: 'regular' | 'irregular') => void
  onToggleLevel: (level: 'college' | 'senior' | 'junior') => void
  onResetFilters: () => void
  onOpenComparison: () => void
}

export const AnalyticsHeader: React.FC<AnalyticsHeaderProps> = ({
  searchQuery,
  onSearchChange,
  showFilterDropdown,
  onToggleFilterDropdown,
  onCloseFilters,
  availableAYs,
  currentAY,
  selectedAY,
  selectedSemester,
  selectedStudentType,
  selectedLevel,
  onSelectAY,
  onSelectSemester,
  onToggleStudentType,
  onToggleLevel,
  onResetFilters,
  onOpenComparison,
}) => {
  const hasActiveFilters =
    selectedAY ||
    selectedSemester ||
    selectedStudentType.length > 0 ||
    selectedLevel.length > 0

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl p-6">
        <h1
          className="text-2xl font-light text-white flex items-center gap-2"
          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
        >
          <div className="w-8 h-8 aspect-square bg-white rounded-xl flex items-center justify-center">
            <ChartBar size={20} weight="fill" className="text-blue-900" />
          </div>
          Analytics & Reports
        </h1>
        <p
          className="text-xs text-blue-100 mt-1"
          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
        >
          Student enrollment insights and statistics
        </p>
        {selectedAY && (
          <div className="flex items-center gap-2 mt-3">
            <div className="flex items-center gap-2 px-2 py-1 bg-white rounded-lg border border-blue-700">
              <Calendar size={12} className="text-blue-900" weight="bold" />
              <span className="text-xs font-mono text-blue-900 font-mono">
                AY: {selectedAY}
              </span>
            </div>
            {selectedSemester && (
              <div className="flex items-center gap-2 px-2 py-1 bg-white rounded-lg border border-blue-700">
                <Calendar size={12} className="text-blue-900" weight="bold" />
                <span className="text-xs font-mono text-blue-900 font-mono">
                  Semester: {selectedSemester}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search analytics..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pr-4 py-2 w-full border-blue-900"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenComparison}
            disabled={availableAYs.length < 2}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-2 ${
              availableAYs.length >= 2
                ? 'bg-blue-900 text-white hover:bg-blue-800'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            <ChartLineUp size={16} weight="bold" />
            Comparison
          </button>
          <div className="relative">
            <button
              onClick={onToggleFilterDropdown}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-2 ${
                hasActiveFilters
                  ? 'bg-gradient-to-br from-blue-800 to-blue-900 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-900'
              }`}
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              <FunnelSimple size={16} weight="bold" />
              Filter
              {hasActiveFilters && <span className="w-2 h-2 bg-white rounded-full"></span>}
            </button>

            {showFilterDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={onCloseFilters}></div>
                <div className="absolute right-0 mt-2 w-96 bg-white border border-gray-200 shadow-lg rounded-xl z-20 p-6">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3
                        className="text-sm font-medium text-gray-900"
                        style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                      >
                        Filter Options
                      </h3>
                      <button
                        onClick={onCloseFilters}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div>
                      <label
                        className="text-xs text-gray-700 mb-2 block"
                        style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                      >
                        Academic Year
                      </label>
                      <div className="flex items-center gap-2 flex-wrap">
                        {availableAYs.length > 0 ? (
                          availableAYs.map((ay) => (
                            <button
                              key={ay}
                              onClick={() => onSelectAY(ay)}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                                selectedAY === ay
                                  ? 'bg-gradient-to-br from-blue-800 to-blue-900 text-white shadow-md'
                                  : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-900'
                              }`}
                              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                            >
                              {ay}
                            </button>
                          ))
                        ) : (
                          <button
                            onClick={() => currentAY && onSelectAY(currentAY)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                              selectedAY === currentAY
                                ? 'bg-gradient-to-br from-blue-800 to-blue-900 text-white shadow-md'
                                : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-900'
                            }`}
                            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                          >
                            {currentAY || 'Select AY'}
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <label
                        className="text-xs text-gray-700 mb-2 block"
                        style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                      >
                        Semester
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onSelectSemester('1')}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                            selectedSemester === '1'
                              ? 'bg-gradient-to-br from-blue-800 to-blue-900 text-white shadow-md'
                              : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-900'
                          }`}
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                        >
                          Semester 1
                        </button>
                        <button
                          onClick={() => onSelectSemester('2')}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                            selectedSemester === '2'
                              ? 'bg-gradient-to-br from-blue-800 to-blue-900 text-white shadow-md'
                              : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-900'
                          }`}
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                        >
                          Semester 2
                        </button>
                      </div>
                    </div>

                    <div>
                      <label
                        className="text-xs text-gray-700 mb-2 block"
                        style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                      >
                        Student Type
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { key: 'regular', label: 'Regular' },
                          { key: 'irregular', label: 'Irregular' },
                        ].map((option) => {
                          const typedKey = option.key as 'regular' | 'irregular'
                          const isSelected = selectedStudentType.includes(typedKey)
                          return (
                            <button
                              key={option.key}
                              onClick={() => onToggleStudentType(typedKey)}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                                isSelected
                                  ? 'bg-gradient-to-br from-blue-800 to-blue-900 text-white shadow-md'
                                  : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-900'
                              }`}
                              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                            >
                              {option.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div>
                      <label
                        className="text-xs text-gray-700 mb-2 block"
                        style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                      >
                        Level/Department
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { key: 'college', label: 'College' },
                          { key: 'senior', label: 'Senior' },
                          { key: 'junior', label: 'Junior' },
                        ].map((option) => {
                          const typedKey = option.key as 'college' | 'senior' | 'junior'
                          const isSelected = selectedLevel.includes(typedKey)
                          return (
                            <button
                              key={option.key}
                              onClick={() => onToggleLevel(typedKey)}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                                isSelected
                                  ? 'bg-gradient-to-br from-blue-800 to-blue-900 text-white shadow-md'
                                  : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-900'
                              }`}
                              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                            >
                              {option.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {hasActiveFilters && (
                      <button
                        onClick={onResetFilters}
                        className="w-full px-3 py-2 text-xs text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        Reset Filters
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

