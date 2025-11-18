import React from 'react'
import { FunnelSimple, X } from '@phosphor-icons/react'

interface AnalyticsHeaderProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  showFilterDropdown: boolean
  onToggleFilterDropdown: () => void
  onCloseFilters: () => void
  selectedSubjectFilter: string[]
  selectedSectionFilter: string[]
  availableSubjects: Array<{ id: string; code: string; name: string }>
  availableSections: Array<{ id: string; name: string }>
  onToggleSubject: (subjectId: string) => void
  onToggleSection: (sectionId: string) => void
  onResetFilters: () => void
}

export const AnalyticsHeader: React.FC<AnalyticsHeaderProps> = ({
  searchQuery,
  onSearchChange,
  showFilterDropdown,
  onToggleFilterDropdown,
  onCloseFilters,
  selectedSubjectFilter,
  selectedSectionFilter,
  availableSubjects,
  availableSections,
  onToggleSubject,
  onToggleSection,
  onResetFilters,
}) => {
  const hasActiveFilters =
    selectedSubjectFilter.length > 0 || selectedSectionFilter.length > 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-medium text-gray-900 mb-1"
            style={{ fontFamily: 'Poppins', fontWeight: 500 }}
          >
            Analytics & Performance
          </h1>
          <p
            className="text-sm text-gray-600"
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            Grade insights and section performance metrics
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search analytics..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-blue-100 bg-white focus:outline-none focus:ring-2 focus:ring-blue-900/40 text-sm"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            />
          </div>
        </div>
        <div className="relative">
          <button
            onClick={onToggleFilterDropdown}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-2 ${
              hasActiveFilters
                ? 'bg-gradient-to-br from-blue-800 to-blue-900 text-white shadow-md'
                : 'bg-white text-gray-700 border border-blue-100 hover:border-blue-300 hover:text-blue-900'
            }`}
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            <FunnelSimple size={16} weight="bold" />
            Filter
            {hasActiveFilters && (
              <span className="w-2 h-2 bg-white rounded-full"></span>
            )}
          </button>

          {showFilterDropdown && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={onCloseFilters}
              ></div>
              <div className="absolute right-0 mt-2 w-96 bg-white border border-blue-100 shadow-lg rounded-xl z-20 p-6">
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

                  {availableSubjects.length > 0 && (
                    <div>
                      <label
                        className="text-xs text-gray-700 mb-2 block"
                        style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                      >
                        Subjects
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {availableSubjects.map((subject) => {
                          const isSelected = selectedSubjectFilter.includes(
                            subject.id
                          )
                          return (
                            <button
                              key={subject.id}
                              onClick={() => onToggleSubject(subject.id)}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                                isSelected
                                  ? 'bg-gradient-to-br from-blue-800 to-blue-900 text-white shadow-md'
                                  : 'bg-white text-gray-700 border border-blue-100 hover:border-blue-300 hover:text-blue-900'
                              }`}
                              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                            >
                              {subject.code}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {availableSections.length > 0 && (
                    <div>
                      <label
                        className="text-xs text-gray-700 mb-2 block"
                        style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                      >
                        Sections
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {availableSections.map((section) => {
                          const isSelected = selectedSectionFilter.includes(
                            section.id
                          )
                          return (
                            <button
                              key={section.id}
                              onClick={() => onToggleSection(section.id)}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                                isSelected
                                  ? 'bg-gradient-to-br from-blue-800 to-blue-900 text-white shadow-md'
                                  : 'bg-white text-gray-700 border border-blue-100 hover:border-blue-300 hover:text-blue-900'
                              }`}
                              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                            >
                              {section.name}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {hasActiveFilters && (
                    <button
                      onClick={onResetFilters}
                      className="w-full px-3 py-2 text-xs text-gray-600 hover:text-gray-900 border border-blue-100 rounded-lg hover:border-blue-300 transition-colors"
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
  )
}
